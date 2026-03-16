import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CryptoService } from '../common/services/crypto.service';

const META_API_BASE = 'https://graph.facebook.com/v21.0';

interface MetaInsightRow {
  campaign_id: string;
  campaign_name: string;
  spend: string;
  impressions: string;
  reach: string;
  clicks: string;
  cpc: string;
  cpm: string;
  date_start: string;
  date_stop: string;
}

interface MetaInsightsResponse {
  data: MetaInsightRow[];
  paging?: {
    cursors?: { before: string; after: string };
    next?: string;
  };
}

@Injectable()
export class AdCostService {
  private readonly logger = new Logger(AdCostService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  async syncCosts(
    userId: string,
    adAccountId: string,
    since: string,
    until: string,
  ): Promise<{ synced: number; errors: string[] }> {
    const adAccount = await this.prisma.adAccount.findFirst({
      where: { id: adAccountId, userId },
    });

    if (!adAccount) {
      return { synced: 0, errors: ['Ad account not found.'] };
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (!user.accessToken) {
      throw new UnauthorizedException(
        'No Meta access token. Please re-authenticate.',
      );
    }

    const accessToken = this.crypto.decrypt(user.accessToken);
    const accountId = adAccount.metaId.startsWith('act_')
      ? adAccount.metaId
      : `act_${adAccount.metaId}`;

    const timeRange = JSON.stringify({ since, until });
    let url =
      `${META_API_BASE}/${accountId}/insights` +
      `?fields=campaign_id,campaign_name,spend,impressions,reach,clicks,cpc,cpm` +
      `&level=campaign` +
      `&time_range=${encodeURIComponent(timeRange)}` +
      `&time_increment=1` +
      `&access_token=${accessToken}`;

    let synced = 0;
    const errors: string[] = [];
    const allRows: MetaInsightRow[] = [];

    // Paginate through all results
    while (url) {
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 401 || error?.error?.code === 190) {
          throw new UnauthorizedException(
            'Meta token expired. Please re-authenticate.',
          );
        }
        errors.push(`Meta API error: ${JSON.stringify(error)}`);
        break;
      }

      const data: MetaInsightsResponse = await response.json();
      const rows = data.data || [];

      for (const row of rows) {
        try {
          await this.prisma.adCostSnapshot.upsert({
            where: {
              adAccountId_campaignMetaId_date: {
                adAccountId: adAccount.id,
                campaignMetaId: row.campaign_id,
                date: new Date(row.date_start),
              },
            },
            update: {
              campaignName: row.campaign_name,
              spend: parseFloat(row.spend) || 0,
              impressions: parseInt(row.impressions, 10) || 0,
              reach: parseInt(row.reach, 10) || 0,
              clicks: parseInt(row.clicks, 10) || 0,
              cpc: parseFloat(row.cpc) || 0,
              cpm: parseFloat(row.cpm) || 0,
              syncedAt: new Date(),
            },
            create: {
              adAccountId: adAccount.id,
              campaignMetaId: row.campaign_id,
              campaignName: row.campaign_name,
              date: new Date(row.date_start),
              spend: parseFloat(row.spend) || 0,
              impressions: parseInt(row.impressions, 10) || 0,
              reach: parseInt(row.reach, 10) || 0,
              clicks: parseInt(row.clicks, 10) || 0,
              cpc: parseFloat(row.cpc) || 0,
              cpm: parseFloat(row.cpm) || 0,
              userId,
            },
          });
          synced++;
        } catch (err) {
          errors.push(
            `Failed to upsert ${row.campaign_id}/${row.date_start}: ${(err as Error).message}`,
          );
        }
      }

      allRows.push(...rows);

      // Next page
      url = data.paging?.next || '';
    }

    // Auto-link campaigns once after all pages processed (FIX-1: moved outside loop)
    await this.autoLinkCampaigns(userId, allRows);

    this.logger.log(
      `Synced ${synced} cost records for adAccount ${adAccountId}`,
    );
    return { synced, errors };
  }

  async syncAllForUser(
    userId: string,
  ): Promise<{ synced: number; errors: string[] }> {
    const adAccounts = await this.prisma.adAccount.findMany({
      where: { userId },
    });

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const since = threeDaysAgo.toISOString().split('T')[0];
    const until = now.toISOString().split('T')[0];

    let totalSynced = 0;
    const allErrors: string[] = [];

    for (const account of adAccounts) {
      try {
        const result = await this.syncCosts(userId, account.id, since, until);
        totalSynced += result.synced;
        allErrors.push(...result.errors);
      } catch (err) {
        if (err instanceof UnauthorizedException) {
          allErrors.push(`Token expired for account ${account.name}`);
        } else {
          allErrors.push(
            `Failed account ${account.name}: ${(err as Error).message}`,
          );
        }
      }
    }

    return { synced: totalSynced, errors: allErrors };
  }

  async getLastSyncAt(userId: string): Promise<Date | null> {
    const result = await this.prisma.adCostSnapshot.findFirst({
      where: { userId },
      orderBy: { syncedAt: 'desc' },
      select: { syncedAt: true },
    });
    return result?.syncedAt || null;
  }

  private async autoLinkCampaigns(
    userId: string,
    rows: MetaInsightRow[],
  ): Promise<void> {
    const unlinkedCampaigns = await this.prisma.campaign.findMany({
      where: { userId, campaignMetaId: null },
    });

    if (unlinkedCampaigns.length === 0 || rows.length === 0) return;

    // FIX-3: Deduplicate — track which local campaigns have been linked in this batch
    const linkedLocalIds = new Set<string>();

    // Deduplicate Meta rows by campaign_id (same campaign can appear on multiple days)
    const uniqueMetaRows = new Map<string, MetaInsightRow>();
    for (const row of rows) {
      if (!uniqueMetaRows.has(row.campaign_id)) {
        uniqueMetaRows.set(row.campaign_id, row);
      }
    }

    for (const row of uniqueMetaRows.values()) {
      const metaName = row.campaign_name.toLowerCase().trim();

      const matches = unlinkedCampaigns.filter(
        (c) =>
          !linkedLocalIds.has(c.id) &&
          metaName.includes(c.name.toLowerCase().trim()),
      );

      // Only auto-link if exactly 1 match (avoid ambiguity)
      if (matches.length === 1) {
        await this.prisma.campaign.update({
          where: { id: matches[0].id },
          data: { campaignMetaId: row.campaign_id },
        });
        linkedLocalIds.add(matches[0].id);
      }
    }
  }
}
