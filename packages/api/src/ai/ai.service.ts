import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  async getInsights(userId: string) {
    return this.prisma.aiInsight.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateInsights(userId: string) {
    // Analyze campaign performance
    const campaigns = await this.prisma.campaign.findMany({
      where: { userId },
      include: {
        _count: { select: { clicks: true, leads: true } },
        product: { select: { name: true, price: true } },
      },
    });

    const insights = [];

    for (const campaign of campaigns) {
      const clickCount = campaign._count.clicks;
      const leadCount = campaign._count.leads;
      const conversionRate = clickCount > 0 ? (leadCount / clickCount) * 100 : 0;

      if (conversionRate > 0) {
        insights.push({
          type: 'campaign_performance',
          data: {
            campaignName: campaign.name,
            clicks: clickCount,
            leads: leadCount,
            conversionRate: conversionRate.toFixed(2),
            recommendation:
              conversionRate < 5
                ? 'Consider revising ad creative or targeting'
                : conversionRate > 20
                  ? 'High performing campaign — consider scaling budget'
                  : 'Average performance — test variations',
          },
          campaignId: campaign.id,
          confidence: Math.min(clickCount / 100, 1),
          sampleSize: clickCount,
          userId,
        });
      }
    }

    // Save insights
    for (const insight of insights) {
      await this.prisma.aiInsight.create({ data: insight });
    }

    return insights;
  }
}
