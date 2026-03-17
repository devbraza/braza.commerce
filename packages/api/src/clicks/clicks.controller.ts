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

    // Encode URL as base64 so Facebook's crawler can't detect wa.me in the HTML source
    const encoded = Buffer.from(redirectUrl).toString('base64');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Redirecionando...</title>
  <meta property="og:title" content="Saiba mais sobre nosso produto">
  <meta property="og:description" content="Clique para saber mais">
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
    <p>Redirecionando...</p>
    <p id="fb" style="margin-top:1rem;font-size:13px;color:#71717a;display:none">
      Não redirecionou? <a id="fl" href="#">Clique aqui</a>
    </p>
  </div>
  <script>
    (function(){var d=atob("${encoded}");window.location.href=d;setTimeout(function(){var a=document.getElementById("fl");var b=document.getElementById("fb");if(a&&b){a.href=d;b.style.display="block"}},2000)})();
  </script>
</body>
</html>`);
  }
}
