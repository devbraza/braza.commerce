import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import { randomBytes } from 'crypto';

function generateClickId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  const bytes = randomBytes(7);
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(bytes[i] % chars.length);
  }
  return `ck_${code}`;
}

@Injectable()
export class ClicksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly campaigns: CampaignsService,
  ) {}

  async trackClick(
    trackingCode: string,
    query: Record<string, string>,
    ip: string,
    userAgent: string,
  ) {
    const campaign = await this.campaigns.findByTrackingCode(trackingCode);
    if (!campaign) throw new NotFoundException('Campaign not found');

    const fbclid = query.fbclid || null;
    const now = Date.now();
    const fbc = fbclid ? `fb.1.${now}.${fbclid}` : null;
    const fbp = `fb.1.${now}.${Math.floor(Math.random() * 10000000000)}`;
    const clickId = generateClickId();

    const click = await this.prisma.click.create({
      data: {
        clickId,
        campaignId: campaign.id,
        fbclid,
        fbc,
        fbp,
        ip,
        userAgent,
        utmSource: query.utm_source || campaign.utmSource,
        utmMedium: query.utm_medium || campaign.utmMedium,
        utmCampaign: query.utm_campaign || campaign.utmCampaign,
        utmContent: query.utm_content || campaign.utmContent,
        utmTerm: query.utm_term || campaign.utmTerm,
      },
    });

    const redirectUrl = this.buildWhatsAppUrl(campaign, clickId);
    return { click, redirectUrl };
  }

  async getRedirectUrl(trackingCode: string): Promise<string | null> {
    const campaign = await this.campaigns.findByTrackingCode(trackingCode);
    if (!campaign) return null;

    // Get the most recent click for this campaign to get the clickId
    const lastClick = await this.prisma.click.findFirst({
      where: { campaignId: campaign.id },
      orderBy: { createdAt: 'desc' },
    });

    const clickId = lastClick?.clickId || 'unknown';
    return this.buildWhatsAppUrl(campaign, clickId);
  }

  private buildWhatsAppUrl(
    campaign: {
      product: {
        whatsappPhone: string | null;
        messageTemplate: string | null;
        name: string;
      } | null;
    },
    clickId: string,
  ): string {
    const phone = campaign.product?.whatsappPhone?.replace(/\+/g, '') || '';
    let message = campaign.product?.messageTemplate || '';
    message = message.replace('{product}', campaign.product?.name || '');
    // Encode click_id as invisible zero-width characters
    const zwEncode = (text: string) => {
      return '\u2060\u2060' + text.split('').map(c => {
        return c.charCodeAt(0).toString(2).padStart(8, '0')
          .split('').map(b => b === '0' ? '\u200B' : '\u200C').join('');
      }).join('\u200D') + '\u2060\u2060';
    };
    message += zwEncode(`ref:${clickId}`);
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${phone}?text=${encoded}`;
  }
}
