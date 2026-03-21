import { Injectable, Logger } from '@nestjs/common';
import { writeFile, readFile, mkdir, rm, copyFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { RenderService } from '../render/render.service';
import { CloudflarePagesService } from './cloudflare-pages.service';
import { Page, PageImage } from '@prisma/client';

type PageWithImages = Page & { images: PageImage[] };

export interface GenerateResult {
  localPath: string;
  cloudflareUrl?: string;
}

@Injectable()
export class StaticPageGeneratorService {
  private readonly logger = new Logger(StaticPageGeneratorService.name);
  private readonly staticDir: string;
  private readonly uploadsDir: string;

  constructor(
    private readonly renderService: RenderService,
    private readonly cloudflarePagesService: CloudflarePagesService,
  ) {
    this.staticDir = process.env.STATIC_PAGES_DIR || '/var/www/static-pages';
    this.uploadsDir = join(process.cwd(), 'uploads', 'pages');
    this.logger.log(`Static pages dir: ${this.staticDir}`);
  }

  /**
   * Generate a static page locally and deploy ALL published pages to CF Pages.
   *
   * Steps:
   * 1. Render HTML via RenderService
   * 2. Copy images + save HTML locally (Nginx fallback)
   * 3. Deploy ALL local slug dirs to CF Pages (atomic deploy)
   */
  async generate(page: PageWithImages, campaignId?: string, campaignCheckoutUrl?: string): Promise<GenerateResult> {
    // 1. Generate locally
    const localPath = await this.generateLocal(page, campaignId, campaignCheckoutUrl);
    const result: GenerateResult = { localPath };

    // 2. Deploy ALL pages to CF Pages (atomic — includes this one + all others)
    if (this.cloudflarePagesService.isEnabled()) {
      try {
        const deployResult = await this.cloudflarePagesService.deployAll(this.staticDir);
        result.cloudflareUrl = deployResult.url;
        this.logger.log(`CF Pages deploy complete: ${deployResult.url}`);
      } catch (err) {
        this.logger.error(`CF Pages deploy failed, local fallback active: ${err}`);
      }
    }

    return result;
  }

  /**
   * Generate static files locally (HTML + images) for Nginx fallback.
   */
  private async generateLocal(page: PageWithImages, campaignId?: string, campaignCheckoutUrl?: string): Promise<string> {
    const pageDir = join(this.staticDir, page.slug);
    const imgDir = join(pageDir, 'img');
    await mkdir(imgDir, { recursive: true });

    // Render HTML
    let html = this.renderService.render(page, campaignId, campaignCheckoutUrl);

    // Copy images and rewrite URLs to local static paths
    const images = page.images.sort((a, b) => a.position - b.position);
    for (const img of images) {
      const filename = `${img.position}.webp`;
      const srcPath = join(this.uploadsDir, page.id, filename);

      if (existsSync(srcPath)) {
        await copyFile(srcPath, join(imgDir, filename));

        if (img.position === 1) {
          // Inline first image as base64 (eliminates LCP round trip)
          const imgBuffer = await readFile(srcPath);
          const b64 = imgBuffer.toString('base64');
          html = html.split(img.url).join(`data:image/webp;base64,${b64}`);
          // Remove preload tag for inlined image (no longer needed)
          html = html.replace(/<link rel="preload" as="image" href="[^"]*" fetchpriority="high">\n?/, '');
        } else {
          html = html.split(img.url).join(`/p/${page.slug}/img/${filename}`);
        }
      }
    }

    // Write HTML
    const htmlPath = join(pageDir, 'index.html');
    await writeFile(htmlPath, html, 'utf-8');

    this.logger.log(`Static page generated locally: ${page.slug} (${html.length} bytes)`);
    return htmlPath;
  }

  /**
   * Remove a page locally and redeploy all remaining pages to CF Pages.
   */
  async remove(slug: string): Promise<void> {
    // Remove local files
    const pageDir = join(this.staticDir, slug);
    try {
      await rm(pageDir, { recursive: true, force: true });
      this.logger.log(`Static page removed locally: ${slug}`);
    } catch {
      this.logger.warn(`No static page to remove: ${slug}`);
    }

    // Redeploy all REMAINING pages to CF (excludes the removed slug)
    if (this.cloudflarePagesService.isEnabled()) {
      try {
        await this.cloudflarePagesService.deployAll(this.staticDir);
        this.logger.log(`CF Pages redeployed without ${slug}`);
      } catch (err) {
        this.logger.warn(`Failed to redeploy to CF Pages: ${err}`);
      }
    }
  }

  /**
   * Regenerate all published pages locally, then deploy once to CF Pages.
   */
  async regenerateAll(pages: PageWithImages[]): Promise<number> {
    // Generate all locally first
    let count = 0;
    for (const page of pages) {
      try {
        await this.generateLocal(page);
        count++;
      } catch (err) {
        this.logger.error(`Failed to generate static page for ${page.slug}: ${err}`);
      }
    }

    // Single CF deploy with everything
    if (this.cloudflarePagesService.isEnabled() && count > 0) {
      try {
        await this.cloudflarePagesService.deployAll(this.staticDir);
        this.logger.log(`CF Pages: deployed ${count} pages in single deploy`);
      } catch (err) {
        this.logger.error(`CF Pages bulk deploy failed: ${err}`);
      }
    }

    this.logger.log(`Regenerated ${count}/${pages.length} static pages`);
    return count;
  }
}
