import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

function getDateRange(period: string): { from: Date; prevFrom: Date; prevTo: Date } {
  const now = new Date();
  let days = 30;
  if (period === 'today') days = 1;
  else if (period === '7d') days = 7;
  else if (period === '30d') days = 30;

  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const prevTo = new Date(from.getTime());
  const prevFrom = new Date(from.getTime() - days * 24 * 60 * 60 * 1000);

  return { from, prevFrom, prevTo };
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(userId: string, period = '30d') {
    const { from, prevFrom, prevTo } = getDateRange(period);

    const [
      totalLeads, prevLeads,
      totalClicks, prevClicks,
      totalOrders, prevOrders,
      totalRevenue, prevRevenue,
      totalEvents, eventsSentToMeta,
      campaigns,
      totalConversations,
    ] = await Promise.all([
      this.prisma.lead.count({ where: { userId, createdAt: { gte: from } } }),
      this.prisma.lead.count({ where: { userId, createdAt: { gte: prevFrom, lt: prevTo } } }),
      this.prisma.click.count({ where: { campaign: { userId }, createdAt: { gte: from } } }),
      this.prisma.click.count({ where: { campaign: { userId }, createdAt: { gte: prevFrom, lt: prevTo } } }),
      this.prisma.order.count({ where: { userId, createdAt: { gte: from } } }),
      this.prisma.order.count({ where: { userId, createdAt: { gte: prevFrom, lt: prevTo } } }),
      this.prisma.order.aggregate({
        where: { userId, status: { not: 'cancelled' }, createdAt: { gte: from } },
        _sum: { value: true },
      }),
      this.prisma.order.aggregate({
        where: { userId, status: { not: 'cancelled' }, createdAt: { gte: prevFrom, lt: prevTo } },
        _sum: { value: true },
      }),
      this.prisma.event.count({ where: { userId, createdAt: { gte: from } } }),
      this.prisma.event.count({ where: { userId, sentToMeta: true, createdAt: { gte: from } } }),
      this.prisma.campaign.count({ where: { userId } }),
      this.prisma.conversation.count({ where: { userId, createdAt: { gte: from } } }),
    ]);

    const revenue = totalRevenue._sum.value || 0;
    const prevRevenueVal = prevRevenue._sum.value || 0;

    const calcChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      totalLeads,
      totalClicks,
      totalOrders,
      totalRevenue: revenue,
      totalEvents,
      eventsSentToMeta,
      campaigns,
      totalConversations,
      conversionRate: totalClicks > 0 ? `${((totalLeads / totalClicks) * 100).toFixed(2)}%` : '0.00%',
      changes: {
        leads: calcChange(totalLeads, prevLeads),
        clicks: calcChange(totalClicks, prevClicks),
        orders: calcChange(totalOrders, prevOrders),
        revenue: calcChange(revenue, prevRevenueVal),
      },
    };
  }

  async getTopData(userId: string, period = '30d') {
    const { from } = getDateRange(period);

    const [topCampaigns, topProducts] = await Promise.all([
      this.prisma.campaign.findMany({
        where: { userId },
        include: {
          _count: { select: { clicks: true, leads: true } },
        },
        orderBy: { leads: { _count: 'desc' } },
        take: 5,
      }),
      this.prisma.product.findMany({
        where: { userId },
        include: {
          orders: {
            where: { status: { not: 'cancelled' }, createdAt: { gte: from } },
            select: { value: true },
          },
          _count: { select: { orders: true } },
        },
        take: 5,
      }),
    ]);

    return {
      topCampaigns: topCampaigns.map((c) => ({
        name: c.name,
        clicks: c._count.clicks,
        leads: c._count.leads,
        conversionRate: c._count.clicks > 0
          ? `${((c._count.leads / c._count.clicks) * 100).toFixed(1)}%`
          : '0.0%',
      })),
      topProducts: topProducts
        .map((p) => ({
          name: p.name,
          orders: p._count.orders,
          revenue: p.orders.reduce((sum, o) => sum + o.value, 0),
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
    };
  }
}
