import { Injectable, NotFoundException } from '@nestjs/common';
import { EventType } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCampaignDto) {
    return this.prisma.campaign.create({
      data: {
        name: dto.name,
        pageId: dto.pageId,
        checkoutUrl: dto.checkoutUrl,
        pixelId: dto.pixelId,
        accessToken: dto.accessToken,
      },
    });
  }

  async findAll() {
    const campaigns = await this.prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        page: { select: { title: true, slug: true } },
        _count: { select: { clicks: true } },
      },
    });

    if (campaigns.length === 0) return [];

    const campaignIds = campaigns.map((c) => c.id);

    // 2 aggregated queries instead of N*2
    const [purchaseData, revenueData] = await Promise.all([
      this.prisma.click.findMany({
        where: { campaignId: { in: campaignIds } },
        select: {
          campaignId: true,
          events: { where: { type: 'PURCHASE' }, select: { id: true } },
        },
      }),
      this.prisma.click.findMany({
        where: { campaignId: { in: campaignIds } },
        select: {
          campaignId: true,
          events: { where: { type: 'PURCHASE' }, select: { value: true } },
        },
      }),
    ]);

    // Aggregate by campaignId
    const purchaseMap = new Map<string, number>();
    const revenueMap = new Map<string, number>();
    for (const click of purchaseData) {
      purchaseMap.set(click.campaignId, (purchaseMap.get(click.campaignId) || 0) + click.events.length);
    }
    for (const click of revenueData) {
      for (const event of click.events) {
        revenueMap.set(click.campaignId, (revenueMap.get(click.campaignId) || 0) + Number(event.value || 0));
      }
    }

    return campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      pageTitle: c.page.title,
      pageSlug: c.page.slug,
      checkoutUrl: c.checkoutUrl,
      pixelId: c.pixelId,
      createdAt: c.createdAt,
      clicks: c._count.clicks,
      purchases: purchaseMap.get(c.id) || 0,
      revenue: revenueMap.get(c.id) || 0,
    }));
  }

  async findOne(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { page: { select: { title: true, slug: true } } },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async update(id: string, dto: UpdateCampaignDto) {
    await this.findOne(id);
    return this.prisma.campaign.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.checkoutUrl !== undefined && { checkoutUrl: dto.checkoutUrl }),
        ...(dto.pixelId !== undefined && { pixelId: dto.pixelId }),
        ...(dto.accessToken !== undefined && { accessToken: dto.accessToken }),
      },
    });
  }

  async pause(id: string) {
    await this.findOne(id);
    return this.prisma.campaign.update({ where: { id }, data: { status: 'PAUSED' } });
  }

  async activate(id: string) {
    await this.findOne(id);
    return this.prisma.campaign.update({ where: { id }, data: { status: 'ACTIVE' } });
  }

  async getStats(campaignId: string, from?: Date, to?: Date) {
    const dateFilter = {
      ...(from && { gte: from }),
      ...(to && { lte: to }),
    };
    const clickWhere = {
      campaignId,
      ...(from || to ? { createdAt: dateFilter } : {}),
    };
    const eventWhere = (type?: string) => ({
      click: { campaignId },
      ...(type ? { type: type as EventType } : {}),
      ...(from || to ? { createdAt: dateFilter } : {}),
    });

    const [clicks, viewContent, checkouts, purchases, revenueAgg] = await Promise.all([
      this.prisma.click.count({ where: clickWhere }),
      this.prisma.event.count({ where: eventWhere('VIEW_CONTENT') }),
      this.prisma.event.count({ where: eventWhere('INITIATE_CHECKOUT') }),
      this.prisma.event.count({ where: eventWhere('PURCHASE') }),
      this.prisma.event.aggregate({ where: eventWhere('PURCHASE'), _sum: { value: true } }),
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
    };
  }

  async getEvents(campaignId: string, page = 1, limit = 20) {
    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where: { click: { campaignId } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { click: { select: { clickId: true } } },
      }),
      this.prisma.event.count({ where: { click: { campaignId } } }),
    ]);
    return { events, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findActiveByPageId(pageId: string) {
    return this.prisma.campaign.findFirst({
      where: { pageId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
  }
}
