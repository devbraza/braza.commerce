import { Injectable, Logger } from '@nestjs/common';
import { writeFile, mkdir, rm, copyFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { RenderService } from '../render/render.service';
import { Page, PageImage } from '@prisma/client';

type PageWithImages = Page & { images: PageImage[] };

@Injectable()
export class StaticPageGeneratorService {
  private readonly logger = new Logger(StaticPageGeneratorService.name);
  private readonly staticDir: string;
  private readonly uploadsDir: string;

  constructor(private readonly renderService: RenderService) {
    this.staticDir = process.env.STATIC_PAGES_DIR || '/var/www/static-pages';
    this.uploadsDir = join(process.cwd(), 'uploads', 'pages');
    this.logger.log(`Static pages dir: ${this.staticDir}`);
  }

  async generate(page: PageWithImages, campaignId?: string, campaignCheckoutUrl?: string): Promise<string> {
    const pageDir = join(this.staticDir, page.slug);
    const imgDir = join(pageDir, 'img');

    // Create directories
    await mkdir(imgDir, { recursive: true });

    // Render HTML
    let html = this.renderService.render(page, campaignId, campaignCheckoutUrl);

    // Copy images and rewrite URLs to relative paths
    const images = page.images.sort((a, b) => a.position - b.position);
    for (const img of images) {
      const filename = `${img.position}.webp`;
      const srcPath = join(this.uploadsDir, page.id, filename);

      if (existsSync(srcPath)) {
        await copyFile(srcPath, join(imgDir, filename));
        // Replace absolute URL with path relative to page slug
        html = html.split(img.url).join(`/p/${page.slug}/img/${filename}`);
      }
    }

    // Fix preload tag to use absolute path too
    if (images.length > 0) {
      const oldPreload = `href="${images[0].url}"`;
      html = html.replace(oldPreload, `href="/p/${page.slug}/img/${images[0].position}.webp"`);
    }

    // Write HTML
    const htmlPath = join(pageDir, 'index.html');
    await writeFile(htmlPath, html, 'utf-8');

    this.logger.log(`Static page generated: ${page.slug} (${html.length} bytes)`);
    return htmlPath;
  }

  async remove(slug: string): Promise<void> {
    const pageDir = join(this.staticDir, slug);
    try {
      await rm(pageDir, { recursive: true, force: true });
      this.logger.log(`Static page removed: ${slug}`);
    } catch {
      this.logger.warn(`No static page to remove: ${slug}`);
    }
  }

  async regenerateAll(pages: PageWithImages[]): Promise<number> {
    let count = 0;
    for (const page of pages) {
      try {
        await this.generate(page);
        count++;
      } catch (err) {
        this.logger.error(`Failed to generate static page for ${page.slug}: ${err}`);
      }
    }
    this.logger.log(`Regenerated ${count}/${pages.length} static pages`);
    return count;
  }
}
