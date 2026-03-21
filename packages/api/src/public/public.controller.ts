import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { PagesService } from '../pages/pages.service';
import { RenderService } from '../render/render.service';
import { UploadService } from '../upload/upload.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import * as archiver from 'archiver';
import { readFile } from 'fs/promises';
import { join } from 'path';

@Controller('p')
export class PublicController {
  constructor(
    private readonly pages: PagesService,
    private readonly render: RenderService,
    private readonly upload: UploadService,
    private readonly campaigns: CampaignsService,
  ) {}

  @Get(':slug')
  async servePage(@Param('slug') slug: string, @Res() res: Response) {
    const page = await this.pages.findBySlug(slug);

    if (!page) {
      res.status(404).setHeader('Content-Type', 'text/html');
      return res.send(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Pagina nao encontrada</title></head><body style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Inter,sans-serif;background:#f4f4f5;color:#999;"><p>Pagina nao encontrada</p></body></html>`);
    }

    const campaign = await this.campaigns.findActiveByPageId(page.id);
    const html = this.render.render(
      page,
      campaign?.id,
      campaign?.checkoutUrl,
    );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(html);
  }

  @Get(':slug/download')
  async downloadPage(@Param('slug') slug: string, @Res() res: Response) {
    const page = await this.pages.findBySlug(slug);
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    let html = this.render.render(page);
    const pageName = slug || 'page';

    // Replace image URLs with local relative paths
    for (const img of page.images) {
      const filename = `${img.position}.webp`;
      html = html.split(img.url).join(`assets/img/${filename}`);
    }

    // Extract CSS: find <style> and </style> by position
    let css = '';
    let js = '';
    const styleStart = html.indexOf('<style>');
    const styleEnd = html.indexOf('</style>');
    if (styleStart !== -1 && styleEnd !== -1) {
      css = html.substring(styleStart + 7, styleEnd);
      html = html.substring(0, styleStart) + '<link rel="stylesheet" href="assets/css/style.css">' + html.substring(styleEnd + 8);
    }

    // Extract JS: find last <script> and </script>
    const scriptStart = html.lastIndexOf('<script>');
    const scriptEnd = html.lastIndexOf('</script>');
    if (scriptStart !== -1 && scriptEnd !== -1) {
      js = html.substring(scriptStart + 8, scriptEnd);
      html = html.substring(0, scriptStart) + '<script src="assets/js/main.js"></script>' + html.substring(scriptEnd + 9);
    }

    // Create ZIP
    const archive = archiver('zip', { zlib: { level: 9 } });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${pageName}.zip"`);
    archive.pipe(res);

    // index.html
    archive.append(html, { name: `${pageName}/index.html` });

    // CSS
    if (css) {
      archive.append(css, { name: `${pageName}/assets/css/style.css` });
    }

    // JS
    if (js) {
      archive.append(js, { name: `${pageName}/assets/js/main.js` });
    }

    // Images
    for (const img of page.images) {
      const filename = `${img.position}.webp`;
      try {
        const imgPath = join(this.upload.getPageDir(page.id), filename);
        const imgBuffer = await readFile(imgPath);
        archive.append(imgBuffer, { name: `${pageName}/assets/img/${filename}` });
      } catch {
        // skip
      }
    }

    await archive.finalize();
  }
}
