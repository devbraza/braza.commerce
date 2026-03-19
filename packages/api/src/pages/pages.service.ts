import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/services/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import slugify from 'slugify';
import { randomBytes } from 'crypto';

@Injectable()
export class PagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly upload: UploadService,
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
    return this.prisma.page.create({
      data: {
        slug,
        title: dto.title,
        price: dto.price,
        originalPrice: dto.originalPrice,
        checkoutUrl: dto.checkoutUrl,
      },
    });
  }

  async findAll() {
    const pages = await this.prisma.page.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        images: { where: { position: 1 }, take: 1 },
      },
    });
    return pages.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      status: p.status,
      createdAt: p.createdAt,
      publishedAt: p.publishedAt,
      thumbnail: p.images[0]?.url || null,
    }));
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
    await this.findOne(id);
    return this.prisma.page.update({
      where: { id },
      data: {
        title: dto.title,
        price: dto.price,
        originalPrice: dto.originalPrice,
        checkoutUrl: dto.checkoutUrl,
        userEditedContent: dto.userEditedContent as Prisma.InputJsonValue,
      },
    });
  }

  async remove(id: string) {
    const page = await this.findOne(id);
    await this.upload.deletePageFiles(page.id);
    return this.prisma.page.delete({ where: { id } });
  }

  async duplicate(id: string) {
    const original = await this.findOne(id);
    const slug = await this.ensureUniqueSlug(this.generateSlug(original.title || undefined));
    return this.prisma.page.create({
      data: {
        slug,
        title: original.title,
        price: original.price,
        originalPrice: original.originalPrice,
        checkoutUrl: original.checkoutUrl,
        aiGeneratedContent: original.aiGeneratedContent as Prisma.InputJsonValue,
      },
    });
  }

  async publish(id: string) {
    await this.findOne(id);
    return this.prisma.page.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
  }

  async unpublish(id: string) {
    await this.findOne(id);
    return this.prisma.page.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
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
