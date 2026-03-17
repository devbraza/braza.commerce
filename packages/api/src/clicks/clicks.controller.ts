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

    const { redirectUrl } = await this.clicksService.trackClick(
      trackingCode,
      query,
      ip,
      userAgent,
    );

    // Serve an HTML page with JS redirect instead of HTTP 302.
    // Facebook's crawler doesn't execute JS, so it sees a normal page.
    // Real users get redirected to WhatsApp instantly via JS.
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Redirecionando...</title>
  <meta property="og:title" content="Fale conosco no WhatsApp">
  <meta property="og:description" content="Clique para iniciar uma conversa">
  <meta property="og:type" content="website">
  <style>
    body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#09090b;color:#fafafa;font-family:system-ui,sans-serif}
    .box{text-align:center;padding:2rem}
    .spinner{width:24px;height:24px;border:2px solid rgba(255,255,255,.1);border-top-color:#10b981;border-radius:50%;animation:spin .6s linear infinite;margin:1rem auto}
    @keyframes spin{to{transform:rotate(360deg)}}
    a{color:#10b981;text-decoration:underline}
  </style>
</head>
<body>
  <div class="box">
    <div class="spinner"></div>
    <p>Redirecionando para o WhatsApp...</p>
    <p style="margin-top:1rem;font-size:13px;color:#71717a">
      Não redirecionou? <a href="${redirectUrl}">Clique aqui</a>
    </p>
  </div>
  <script>window.location.href="${redirectUrl.replace(/"/g, '\\"')}";</script>
</body>
</html>`);
  }
}
