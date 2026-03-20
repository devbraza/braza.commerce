import { Injectable } from '@nestjs/common';
import { EventType } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(from?: Date, to?: Date) {
    const dateFilter = {
      ...(from && { gte: from }),
      ...(to && { lte: to }),
    };
    const clickWhere = from || to ? { createdAt: dateFilter } : {};
    const eventWhere = (type?: string) => ({
      ...(type ? { type: type as EventType } : {}),
      ...(from || to ? { createdAt: dateFilter } : {}),
    });

    const [clicks, viewContent, checkouts, purchases, revenueAgg, activeCampaigns] = await Promise.all([
      this.prisma.click.count({ where: clickWhere }),
      this.prisma.event.count({ where: eventWhere('VIEW_CONTENT') }),
      this.prisma.event.count({ where: eventWhere('INITIATE_CHECKOUT') }),
      this.prisma.event.count({ where: eventWhere('PURCHASE') }),
      this.prisma.event.aggregate({ where: eventWhere('PURCHASE'), _sum: { value: true } }),
      this.prisma.campaign.count({ where: { status: 'ACTIVE' } }),
    ]);

    const revenue = Number(revenueAgg._sum.value || 0);
    return {
      clicks,
      viewContent,
      checkouts,
      purchases,
      revenue,
      aov: purchases > 0 ? revenue / purchases : 0,
      viewContentRate: clicks > 0 ? Number(((viewContent / clicks) * 100).toFixed(1)) : 0,
      checkoutRate: viewContent > 0 ? Number(((checkouts / viewContent) * 100).toFixed(1)) : 0,
      purchaseRate: checkouts > 0 ? Number(((purchases / checkouts) * 100).toFixed(1)) : 0,
      overallConversion: clicks > 0 ? Number(((purchases / clicks) * 100).toFixed(2)) : 0,
      activeCampaigns,
    };
  }

  async getGlobalEvents(page = 1, limit = 20) {
    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          click: {
            select: { clickId: true, campaign: { select: { name: true } } },
          },
        },
      }),
      this.prisma.event.count(),
    ]);
    return { events, total, page, limit, pages: Math.ceil(total / limit) };
  }
}
