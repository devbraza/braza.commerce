import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CryptoService } from '../common/services/crypto.service';
import { hashPhone, hashEmail, sha256 } from '../common/utils/hash';
import { randomUUID } from 'crypto';

const META_CAPI_URL = 'https://graph.facebook.com/v21.0';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  async createEvent(
    userId: string,
    data: {
      leadId: string;
      conversationId?: string;
      type: string;
      value?: number;
      currency?: string;
    },
  ) {
    // Prevent duplicate events of same type for same lead
    if (data.type === 'ViewContent') {
      const existing = await this.prisma.event.findFirst({
        where: { leadId: data.leadId, type: 'ViewContent', userId },
      });
      if (existing) return existing;
    }

    const event = await this.prisma.event.create({
      data: {
        eventId: randomUUID(),
        leadId: data.leadId,
        conversationId: data.conversationId,
        type: data.type,
        value: data.value,
        currency: data.currency || 'BRL',
        userId,
      },
    });

    // Send to Meta CAPI
    await this.sendToMeta(event.id, userId);

    return event;
  }

  /** Auto-fire ViewContent on first message from a matched lead (FR3) */
  async fireViewContentIfFirst(leadId: string, conversationId: string, userId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId },
      include: { click: true },
    });

    // Only fire if lead has a click (matched via tracking link)
    if (!lead?.clickId) return;

    await this.createEvent(userId, {
      leadId,
      conversationId,
      type: 'ViewContent',
    });
  }

  /** Auto-create order on Purchase event (FR14) */
  async autoCreateOrderOnPurchase(
    userId: string,
    leadId: string,
    conversationId: string | undefined,
    value: number,
    currency: string,
  ) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId },
      include: { product: true },
    });

    const lastOrder = await this.prisma.order.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { orderId: true },
    });
    const lastNum = lastOrder?.orderId
      ? parseInt(lastOrder.orderId.replace('ORD-', ''), 10) || 0
      : 0;
    const orderId = `ORD-${String(lastNum + 1).padStart(4, '0')}`;

    return this.prisma.order.create({
      data: {
        orderId,
        leadId,
        conversationId: conversationId || undefined,
        productId: lead?.productId || undefined,
        value,
        currency,
        status: 'awaiting_address',
        userId,
      },
    });
  }

  async sendToMeta(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        lead: {
          include: {
            click: true,
            campaign: { include: { pixel: true } },
          },
        },
      },
    });

    if (!event || !event.lead?.campaign?.pixel) return;

    // Skip if no fbclid — Meta rejects events without sufficient identifiers
    if (!event.lead.click?.fbc) {
      await this.prisma.event.update({
        where: { id: eventId },
        data: { sentToMeta: false, metaResponse: { reason: 'skipped: no fbc' } },
      });
      return;
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.accessToken) return;

    const accessToken = this.crypto.decrypt(user.accessToken);
    const pixelId = event.lead.campaign.pixel.metaId;

    // Build CAPI payload with SHA-256 hashing (FR13, FR13.1)
    const userData: Record<string, unknown> = {
      ph: [hashPhone(event.lead.phone)],
      fbc: event.lead.click.fbc,
      fbp: event.lead.click.fbp,
      client_ip_address: event.lead.click.ip,
      client_user_agent: event.lead.click.userAgent,
      external_id: sha256(event.lead.click.clickId),
    };

    if (event.lead.name) {
      const names = event.lead.name.split(' ');
      userData.fn = sha256(names[0].toLowerCase().trim());
      if (names.length > 1) {
        userData.ln = sha256(names[names.length - 1].toLowerCase().trim());
      }
    }

    const eventData = {
      data: [
        {
          event_name: event.type,
          event_time: Math.floor(event.createdAt.getTime() / 1000),
          event_id: event.eventId,
          action_source: 'website',
          event_source_url: `https://link.brazachat.shop/c/${event.lead.campaign.trackingCode}`,
          user_data: userData,
          custom_data: {
            value: event.value,
            currency: event.currency,
          },
        },
      ],
    };

    try {
      const response = await fetch(
        `${META_CAPI_URL}/${pixelId}/events?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        },
      );

      const result = await response.json();

      await this.prisma.event.update({
        where: { id: eventId },
        data: {
          sentToMeta: response.ok,
          metaResponse: result,
          retryCount: { increment: 1 },
          lastRetryAt: new Date(),
        },
      });
    } catch (error) {
      await this.prisma.event.update({
        where: { id: eventId },
        data: {
          metaResponse: { error: String(error) },
          retryCount: { increment: 1 },
          lastRetryAt: new Date(),
        },
      });
    }
  }

  async findAll(userId: string, filters?: { type?: string; sentToMeta?: string; page?: number; limit?: number }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const skip = (page - 1) * limit;
    const where = {
      userId,
      ...(filters?.type && { type: filters.type }),
      ...(filters?.sentToMeta !== undefined && {
        sentToMeta: filters.sentToMeta === 'true',
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        include: {
          lead: { select: { phone: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.event.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async retryFailed(userId: string) {
    const failedEvents = await this.prisma.event.findMany({
      where: { userId, sentToMeta: false, retryCount: { lt: 3 } },
    });

    for (const event of failedEvents) {
      await this.sendToMeta(event.id, userId);
    }

    return { retriedCount: failedEvents.length };
  }
}
