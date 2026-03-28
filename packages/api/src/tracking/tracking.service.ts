import { Injectable, Logger } from '@nestjs/common';
import { EventType } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(private readonly prisma: PrismaService) {}

  private generateClickId(): string {
    return `ck_${randomBytes(4).toString('hex').slice(0, 7)}`;
  }

  async registerClick(data: {
    campaignId: string;
    fbclid?: string;
    ip: string;
    userAgent: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
  }) {
    const clickId = this.generateClickId();
    const now = Date.now();
    const fbc = data.fbclid ? `fb.1.${now}.${data.fbclid}` : null;
    const fbp = `fb.1.${now}.${randomBytes(5).toString('hex')}`;

    const click = await this.prisma.click.create({
      data: {
        clickId,
        campaignId: data.campaignId,
        fbclid: data.fbclid || null,
        fbc,
        fbp,
        ip: data.ip,
        userAgent: data.userAgent,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
        utmContent: data.utmContent || null,
        utmTerm: data.utmTerm || null,
      },
    });

    // Auto-register VIEW_CONTENT event
    await this.prisma.event.create({
      data: { clickId: click.id, type: 'VIEW_CONTENT' },
    });

    this.logger.log(`Click registered: ${clickId} for campaign ${data.campaignId}`);
    return { clickId, clickDbId: click.id };
  }

  async registerEvent(clickId: string, type: string, value?: number): Promise<{ event: any; isNew: boolean } | null> {
    const click = await this.prisma.click.findUnique({ where: { clickId } });
    if (!click) {
      this.logger.warn(`Click not found: ${clickId}`);
      return null;
    }

    // Idempotency check: skip if event already exists for this click + type
    const existing = await this.prisma.event.findFirst({
      where: { clickId: click.id, type: type as EventType },
    });
    if (existing) {
      this.logger.warn(`Duplicate event skipped: ${type} for click ${clickId}`);
      return { event: existing, isNew: false };
    }

    const event = await this.prisma.event.create({
      data: {
        clickId: click.id,
        type: type as EventType,
        value: value || null,
      },
    });
    this.logger.log(`Event registered: ${type} for click ${clickId}${value ? ` value=${value}` : ''}`);
    return { event, isNew: true };
  }

  async getClickWithCampaign(clickId: string) {
    return this.prisma.click.findUnique({
      where: { clickId },
      include: { campaign: true },
    });
  }
}
