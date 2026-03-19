import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { PagesService } from '../pages/pages.service';
import { RenderService } from '../render/render.service';

@Controller('p')
export class PublicController {
  constructor(
    private readonly pages: PagesService,
    private readonly render: RenderService,
  ) {}

  @Get(':slug')
  async servePage(@Param('slug') slug: string, @Res() res: Response) {
    const page = await this.pages.findBySlug(slug);

    if (!page) {
      res.status(404).setHeader('Content-Type', 'text/html');
      return res.send(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Pagina nao encontrada</title></head><body style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Inter,sans-serif;background:#f4f4f5;color:#999;"><p>Pagina nao encontrada</p></body></html>`);
    }

    const html = this.render.render(page);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.send(html);
  }
}
