import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PagesService } from './pages.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { AiCopyService } from '../ai/ai-copy.service';
import { AiImageService } from '../ai/ai-image.service';
import { UploadService } from '../upload/upload.service';
import { PrismaService } from '../common/services/prisma.service';
import * as sharp from 'sharp';
import { join } from 'path';
import { Prisma } from '@prisma/client';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'application/octet-stream'];

@Controller('pages')
export class PagesController {
  constructor(
    private readonly pages: PagesService,
    private readonly prisma: PrismaService,
    private readonly upload: UploadService,
    private readonly aiCopy: AiCopyService,
    private readonly aiImage: AiImageService,
  ) {}

  @Post()
  create(@Body() dto: CreatePageDto) {
    return this.pages.create(dto);
  }

  @Get()
  findAll() {
    return this.pages.findAll();
  }

  @Get('check-slug/:slug')
  async checkSlug(@Param('slug') slug: string) {
    const available = await this.pages.checkSlugAvailable(slug);
    return { available };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pages.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePageDto) {
    return this.pages.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pages.remove(id);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string) {
    return this.pages.duplicate(id);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.pages.publish(id);
  }

  @Patch(':id/unpublish')
  unpublish(@Param('id') id: string) {
    return this.pages.unpublish(id);
  }

  @Post(':id/reference')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIMES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException(`Format not supported: ${file.mimetype}`), false);
      }
    },
  }))
  async uploadReference(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) throw new BadRequestException('Page not found');

    const webpBuffer = await sharp(file.buffer)
      .resize(640, null, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const url = await this.upload.saveBuffer(id, 'reference.webp', webpBuffer);
    await this.prisma.page.update({ where: { id }, data: { referenceImageUrl: url } });
    return { referenceImageUrl: url };
  }

  @Post(':id/images')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIMES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException(`Format not supported: ${file.mimetype}`), false);
      }
    },
  }))
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const page = await this.prisma.page.findUnique({ where: { id }, include: { images: true } });
    if (!page) throw new BadRequestException('Page not found');
    if (page.images.length >= 6) throw new BadRequestException('Maximum 6 images');

    const position = page.images.length + 1;
    const webpBuffer = await sharp(file.buffer)
      .resize(640, null, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const filename = `${position}.webp`;
    const url = await this.upload.saveBuffer(id, filename, webpBuffer);

    const img = await this.prisma.pageImage.create({
      data: { pageId: id, url, position, originalName: file.originalname || filename, sizeBytes: webpBuffer.length },
    });

    return img;
  }

  @Post(':id/generate-images')
  async generateImages(@Param('id') id: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) throw new BadRequestException('Page not found');
    if (!page.referenceImageUrl) throw new BadRequestException('No reference image uploaded');

    const refPath = join(this.upload.getPageDir(id), 'reference.webp');
    const imageBuffers = await this.aiImage.generateProductImages(refPath);

    await this.prisma.pageImage.deleteMany({ where: { pageId: id } });

    const savedImages = [];
    for (let i = 0; i < imageBuffers.length; i++) {
      if (imageBuffers[i].length === 0) continue;
      try {
        const webpBuffer = await sharp(imageBuffers[i])
          .resize(800, null, { withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer();

        const filename = `${i + 1}.webp`;
        const url = await this.upload.saveBuffer(id, filename, webpBuffer);
        const img = await this.prisma.pageImage.create({
          data: { pageId: id, url, position: i + 1, originalName: filename, sizeBytes: webpBuffer.length },
        });
        savedImages.push(img);
      } catch {
        continue;
      }
    }
    return { images: savedImages, count: savedImages.length };
  }

  @Post(':id/generate-copy')
  async generateCopy(@Param('id') id: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) throw new BadRequestException('Page not found');
    if (!page.referenceImageUrl) throw new BadRequestException('No reference image uploaded');

    const refPath = join(this.upload.getPageDir(id), 'reference.webp');
    const content = await this.aiCopy.generatePageContent(refPath);

    await this.prisma.page.update({
      where: { id },
      data: { aiGeneratedContent: content as unknown as Prisma.InputJsonValue, title: content.name },
    });
    return { content };
  }
}
