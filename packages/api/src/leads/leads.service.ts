import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

export interface LeadsFilter {
  status?: string;
  campaignId?: string;
  productId?: string;
  utmSource?: string;
  search?: string;
}

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreate(
    userId: string,
    phone: string,
    data?: {
      name?: string;
      campaignId?: string;
      productId?: string;
      clickId?: string;
      fbclid?: string;
    },
  ) {
    let lead = await this.prisma.lead.findFirst({
      where: { phone, userId },
    });

    if (!lead) {
      lead = await this.prisma.lead.create({
        data: {
          phone,
          name: data?.name,
          campaignId: data?.campaignId,
          productId: data?.productId,
          clickId: data?.clickId,
          fbclid: data?.fbclid,
          userId,
        },
      });
    }

    return lead;
  }

  async findAll(userId: string, filters?: LeadsFilter & { page?: number; limit?: number }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };

    if (filters?.status) where.status = filters.status;
    if (filters?.campaignId) where.campaignId = filters.campaignId;
    if (filters?.productId) where.productId = filters.productId;

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.utmSource) {
      where.click = { utmSource: { contains: filters.utmSource, mode: 'insensitive' } };
    }

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: {
          campaign: { select: { name: true } },
          product: { select: { name: true } },
          click: {
            select: {
              utmSource: true,
              utmMedium: true,
              utmCampaign: true,
              utmContent: true,
              utmTerm: true,
            },
          },
          events: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { type: true, createdAt: true },
          },
          conversations: {
            take: 1,
            orderBy: { lastMessageAt: 'desc' },
            select: { lastMessageAt: true },
          },
          _count: { select: { conversations: true, events: true, orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.lead.count({ where }),
    ]);

    const data = leads.map((lead) => ({
      ...lead,
      lastEventType: lead.events[0]?.type ?? null,
      lastEventAt: lead.events[0]?.createdAt ?? null,
      lastMessageAt: lead.conversations[0]?.lastMessageAt ?? null,
    }));

    return { data, total, page, limit };
  }

  async findOne(userId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, userId },
      include: {
        campaign: true,
        product: true,
        click: true,
        conversations: { include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } } },
        events: { orderBy: { createdAt: 'desc' } },
        orders: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async updateStatus(userId: string, id: string, status: string) {
    await this.findOne(userId, id);
    return this.prisma.lead.update({ where: { id }, data: { status } });
  }
}
