import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ClicksService } from './clicks.service';

@Controller('c')
export class ClicksController {
  constructor(private readonly clicksService: ClicksService) {}

  @Get(':trackingCode')
  async trackAndRedirect(
    @Param('trackingCode') trackingCode: string,
    @Query() query: Record<string, string>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '';
    const userAgent = req.headers['user-agent'] || '';

    const { click } = await this.clicksService.trackClick(
      trackingCode,
      query,
      ip,
      userAgent,
    );

    // Serve a clean HTML page — no WhatsApp references anywhere in source.
    // The redirect URL is fetched via a separate API call after page load.
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Carregando...</title>
  <meta property="og:title" content="Saiba mais sobre nosso produto">
  <meta property="og:description" content="Confira as melhores ofertas">
  <meta property="og:type" content="website">
  <style>
    body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#09090b;color:#fafafa;font-family:system-ui,sans-serif}
    .spinner{width:24px;height:24px;border:2px solid rgba(255,255,255,.1);border-top-color:#10b981;border-radius:50%;animation:spin .6s linear infinite;margin:0 auto 1rem}
    @keyframes spin{to{transform:rotate(360deg)}}
  </style>
</head>
<body>
  <div style="text-align:center"><div class="spinner"></div><p>Carregando...</p></div>
  <script>fetch("/c/${trackingCode}/r").then(function(r){return r.json()}).then(function(d){if(d.u)window.location.href=d.u})</script>
</body>
</html>`);
  }

  @Get(':trackingCode/r')
  async getRedirectUrl(
    @Param('trackingCode') trackingCode: string,
    @Res() res: Response,
  ) {
    const url = await this.clicksService.getRedirectUrl(trackingCode);
    if (!url) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({ u: url });
  }
}
