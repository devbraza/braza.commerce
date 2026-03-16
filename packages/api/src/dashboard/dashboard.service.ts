import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
      costAgg, prevCostAgg,
      spendByDay,
      revenueByDay,
      lastSync,
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
      // Ad cost aggregations
      this.prisma.adCostSnapshot.aggregate({
        where: { userId, date: { gte: from } },
        _sum: { spend: true, clicks: true },
      }),
      this.prisma.adCostSnapshot.aggregate({
        where: { userId, date: { gte: prevFrom, lt: prevTo } },
        _sum: { spend: true },
      }),
      // Spend time series
      this.prisma.adCostSnapshot.groupBy({
        by: ['date'],
        where: { userId, date: { gte: from } },
        _sum: { spend: true },
        orderBy: { date: 'asc' },
      }),
      // Revenue time series (isolated with catch — FIX-2: raw query failure must not crash entire dashboard)
      this.prisma.$queryRaw<{ date: Date; revenue: number }[]>(
        Prisma.sql`
          SELECT DATE("createdAt") as date, SUM(value) as revenue
          FROM "Order"
          WHERE "userId" = ${userId}
            AND status != 'cancelled'
            AND "createdAt" >= ${from}
          GROUP BY DATE("createdAt")
          ORDER BY date ASC
        `,
      ).catch(() => [] as { date: Date; revenue: number }[]),
      // Last sync
      this.prisma.adCostSnapshot.findFirst({
        where: { userId },
        orderBy: { syncedAt: 'desc' },
        select: { syncedAt: true },
      }),
    ]);

    const revenue = totalRevenue._sum.value || 0;
    const prevRevenueVal = prevRevenue._sum.value || 0;
    const totalSpend = costAgg._sum.spend || 0;
    const prevSpend = prevCostAgg._sum.spend || 0;
    const metaClicks = costAgg._sum.clicks || 0;

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
      // Cost metrics
      totalSpend,
      avgCpc: metaClicks > 0 ? totalSpend / metaClicks : 0,
      costPerLead: totalLeads > 0 ? totalSpend / totalLeads : 0,
      roas: totalSpend > 0 ? revenue / totalSpend : null,
      lastSyncAt: lastSync?.syncedAt || null,
      spendTimeSeries: spendByDay.map((row) => ({
        date: row.date.toISOString().split('T')[0],
        spend: row._sum.spend || 0,
      })),
      revenueTimeSeries: revenueByDay.map((row) => ({
        date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date),
        revenue: Number(row.revenue) || 0,
      })),
      changes: {
        leads: calcChange(totalLeads, prevLeads),
        clicks: calcChange(totalClicks, prevClicks),
        orders: calcChange(totalOrders, prevOrders),
        revenue: calcChange(revenue, prevRevenueVal),
        spend: calcChange(totalSpend, prevSpend),
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

    // Enrich campaigns with spend data
    const campaignsWithSpend = await Promise.all(
      topCampaigns.map(async (c) => {
        let spend: number | null = null;

        if (c.campaignMetaId) {
          // Level 1: explicit link
          const costAgg = await this.prisma.adCostSnapshot.aggregate({
            where: { campaignMetaId: c.campaignMetaId, userId, date: { gte: from } },
            _sum: { spend: true },
          });
          spend = costAgg._sum.spend || 0;
        } else {
          // Level 2: name heuristic
          const matches = await this.prisma.adCostSnapshot.groupBy({
            by: ['campaignMetaId'],
            where: {
              userId,
              date: { gte: from },
              campaignName: { contains: c.name, mode: 'insensitive' },
            },
            _sum: { spend: true },
          });
          if (matches.length === 1) {
            spend = matches[0]._sum.spend || 0;
          }
        }

        return {
          name: c.name,
          clicks: c._count.clicks,
          leads: c._count.leads,
          conversionRate: c._count.clicks > 0
            ? `${((c._count.leads / c._count.clicks) * 100).toFixed(1)}%`
            : '0.0%',
          spend,
        };
      }),
    );

    return {
      topCampaigns: campaignsWithSpend,
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
