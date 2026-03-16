import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function generateTrackingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    dto: {
      name: string;
      productId: string;
      adAccountId: string;
      pixelId?: string;
      adsetName?: string;
      adName?: string;
      creativeName?: string;
    },
  ) {
    // FIX-005: Verify ownership
    const product = await this.prisma.product.findFirst({ where: { id: dto.productId, userId } });
    if (!product) throw new NotFoundException('Product not found or not yours');
    const adAccount = await this.prisma.adAccount.findFirst({ where: { id: dto.adAccountId, userId } });
    if (!adAccount) throw new NotFoundException('Ad Account not found or not yours');
    if (dto.pixelId) {
      const pixel = await this.prisma.pixel.findFirst({ where: { id: dto.pixelId, adAccountId: dto.adAccountId } });
      if (!pixel) throw new BadRequestException('Pixel does not belong to selected Ad Account');
    }

    let trackingCode = generateTrackingCode();
    while (
      await this.prisma.campaign.findUnique({ where: { trackingCode } })
    ) {
      trackingCode = generateTrackingCode();
    }

    // UTMs are NOT pre-generated — they are captured from the real Facebook click URL
    return this.prisma.campaign.create({
      data: {
        name: dto.name,
        trackingCode,
        productId: dto.productId,
        adAccountId: dto.adAccountId,
        pixelId: dto.pixelId,
        userId,
      },
    });
  }

  async findAll(userId: string, pagination?: { page?: number; limit?: number }) {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where: { userId },
        include: {
          product: { select: { name: true } },
          adAccount: { select: { name: true } },
          _count: { select: { clicks: true, leads: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.campaign.count({ where: { userId } }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(userId: string, id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, userId },
      include: {
        product: true,
        adAccount: true,
        pixel: true,
        _count: { select: { clicks: true, leads: true } },
      },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async findByTrackingCode(trackingCode: string) {
    return this.prisma.campaign.findUnique({
      where: { trackingCode },
      include: { product: true },
    });
  }

  async update(
    userId: string,
    id: string,
    dto: Partial<{
      name: string;
      adsetName: string;
      adName: string;
      creativeName: string;
      utmSource: string;
      utmMedium: string;
      utmCampaign: string;
      utmContent: string;
      utmTerm: string;
    }>,
  ) {
    await this.findOne(userId, id);

    const data: Record<string, unknown> = { ...dto };
    if (dto.name && !dto.utmCampaign) data.utmCampaign = slugify(dto.name);
    if (dto.creativeName && !dto.utmContent)
      data.utmContent = slugify(dto.creativeName);
    if (dto.adsetName && !dto.utmTerm) data.utmTerm = slugify(dto.adsetName);

    return this.prisma.campaign.update({ where: { id }, data });
  }
}
