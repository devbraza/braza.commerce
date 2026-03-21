import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { UploadService } from '../upload/upload.service';
import { StaticPageGeneratorService } from '../static-pages/static-page-generator.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import slugify from 'slugify';
import { randomBytes } from 'crypto';

@Injectable()
export class PagesService {
  private readonly logger = new Logger(PagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly upload: UploadService,
    private readonly staticPages: StaticPageGeneratorService,
    private readonly campaignsService: CampaignsService,
  ) {}

  private generateSlug(title?: string): string {
    const base = title
      ? slugify(title, { lower: true, strict: true })
      : `pagina-${randomBytes(4).toString('hex')}`;
    return base || `pagina-${randomBytes(4).toString('hex')}`;
  }

  private async ensureUniqueSlug(slug: string): Promise<string> {
    let candidate = slug;
    let suffix = 1;
    while (await this.prisma.page.findUnique({ where: { slug: candidate } })) {
      candidate = `${slug}-${suffix}`;
      suffix++;
    }
    return candidate;
  }

  async create(dto: CreatePageDto) {
    const slug = await this.ensureUniqueSlug(this.generateSlug(dto.title));
    const page = await this.prisma.page.create({
      data: {
        slug,
        title: dto.title,
        price: dto.price,
        originalPrice: dto.originalPrice,
        checkoutUrl: dto.checkoutUrl,
      },
    });

    // Auto-create Campaign if tracking fields provided
    if (dto.checkoutUrl) {
      await this.campaignsService.create({
        pageId: page.id,
        name: dto.title || page.slug,
        checkoutUrl: dto.checkoutUrl,
        pixelId: dto.pixelId,
        accessToken: dto.accessToken,
      });
      this.logger.log(`Auto-created campaign for page ${page.slug}`);
    }

    return page;
  }

  async findAll() {
    const pages = await this.prisma.page.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        images: { where: { position: 1 }, take: 1 },
        campaigns: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, checkoutUrl: true, pixelId: true },
        },
      },
    });
    return pages.map((p) => {
      const campaign = p.campaigns[0] || null;
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        status: p.status,
        createdAt: p.createdAt,
        publishedAt: p.publishedAt,
        staticUrl: p.staticUrl,
        thumbnail: p.images[0]?.url || null,
        trackingEnabled: !!campaign,
        checkoutUrl: campaign?.checkoutUrl || p.checkoutUrl || null,
        pixelId: campaign?.pixelId || null,
      };
    });
  }

  async findOne(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: { images: { orderBy: { position: 'asc' } } },
    });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  async update(id: string, dto: UpdatePageDto) {
    const page = await this.findOne(id);
    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.originalPrice !== undefined) data.originalPrice = dto.originalPrice;
    if (dto.checkoutUrl !== undefined) data.checkoutUrl = dto.checkoutUrl;
    if (dto.userEditedContent !== undefined) data.userEditedContent = dto.userEditedContent as Prisma.InputJsonValue;
    if (dto.slug !== undefined) {
      const sanitized = dto.slug.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
      if (sanitized.length >= 3 && sanitized.length <= 60) {
        const available = await this.checkSlugAvailable(sanitized, id);
        if (available) data.slug = sanitized;
      }
    }
    const updated = await this.prisma.page.update({ where: { id }, data });

    // Auto-create or update Campaign if tracking fields provided
    if (dto.checkoutUrl !== undefined || dto.pixelId !== undefined || dto.accessToken !== undefined) {
      const existing = await this.campaignsService.findActiveByPageId(id);
      if (existing) {
        await this.campaignsService.update(existing.id, {
          ...(dto.checkoutUrl !== undefined && { checkoutUrl: dto.checkoutUrl }),
          ...(dto.pixelId !== undefined && { pixelId: dto.pixelId }),
          ...(dto.accessToken !== undefined && { accessToken: dto.accessToken }),
        });
      } else if (dto.checkoutUrl) {
        await this.campaignsService.create({
          pageId: id,
          name: updated.title || updated.slug,
          checkoutUrl: dto.checkoutUrl,
          pixelId: dto.pixelId,
          accessToken: dto.accessToken,
        });
        this.logger.log(`Auto-created campaign for page ${updated.slug}`);
      }
    }

    return updated;
  }

  async remove(id: string) {
    const page = await this.findOne(id);
    await this.upload.deletePageFiles(page.id);

    // Remove static page if it was published
    try {
      await this.staticPages.remove(page.slug);
    } catch (err) {
      this.logger.error(`Failed to remove static page: ${err}`);
    }

    return this.prisma.page.delete({ where: { id } });
  }

  async duplicate(id: string) {
    const original = await this.findOne(id);
    const slug = await this.ensureUniqueSlug(this.generateSlug(original.title || undefined));
    const duplicated = await this.prisma.page.create({
      data: {
        slug,
        title: original.title,
        price: original.price,
        originalPrice: original.originalPrice,
        checkoutUrl: original.checkoutUrl,
        aiGeneratedContent: original.aiGeneratedContent as Prisma.InputJsonValue,
      },
    });

    // Copy tracking campaign if original has one
    const originalCampaign = await this.campaignsService.findActiveByPageId(id);
    if (originalCampaign) {
      await this.campaignsService.create({
        pageId: duplicated.id,
        name: duplicated.title || duplicated.slug,
        checkoutUrl: originalCampaign.checkoutUrl,
        pixelId: originalCampaign.pixelId || undefined,
        accessToken: originalCampaign.accessToken || undefined,
      });
      this.logger.log(`Copied campaign to duplicated page ${duplicated.slug}`);
    }

    return duplicated;
  }

  async publish(id: string) {
    await this.findOne(id);
    const page = await this.prisma.page.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
      include: { images: { orderBy: { position: 'asc' } } },
    });

    // Find active campaign for tracking injection
    const campaign = await this.campaignsService.findActiveByPageId(id);

    // Generate static page + deploy to Cloudflare Pages
    try {
      const result = await this.staticPages.generate(
        page,
        campaign?.id,
        campaign?.checkoutUrl,
      );
      if (result.cloudflareUrl) {
        const fullUrl = `${result.cloudflareUrl}/${page.slug}/`;
        await this.prisma.page.update({
          where: { id },
          data: { staticUrl: fullUrl },
        });
        page.staticUrl = fullUrl;
        this.logger.log(`Page ${page.slug} deployed to CF: ${fullUrl}`);
      }
    } catch (err) {
      this.logger.error(`Failed to generate static page: ${err}`);
    }

    return page;
  }

  async unpublish(id: string) {
    const page = await this.findOne(id);
    const result = await this.prisma.page.update({
      where: { id },
      data: { status: 'ARCHIVED', staticUrl: null },
    });

    // Remove static page (local + Cloudflare Pages)
    try {
      await this.staticPages.remove(page.slug);
    } catch (err) {
      this.logger.error(`Failed to remove static page: ${err}`);
    }

    return result;
  }

  async checkSlugAvailable(slug: string, excludePageId?: string): Promise<boolean> {
    const existing = await this.prisma.page.findUnique({ where: { slug } });
    if (!existing) return true;
    if (excludePageId && existing.id === excludePageId) return true;
    return false;
  }

  async regenerateAllStatic() {
    const pages = await this.prisma.page.findMany({
      where: { status: 'PUBLISHED' },
      include: { images: { orderBy: { position: 'asc' } } },
    });
    return this.staticPages.regenerateAll(pages);
  }

  async findBySlug(slug: string) {
    const page = await this.prisma.page.findUnique({
      where: { slug },
      include: { images: { orderBy: { position: 'asc' } } },
    });
    if (!page || page.status !== 'PUBLISHED') return null;
    return page;
  }
}
