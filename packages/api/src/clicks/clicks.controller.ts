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

    // Clean white page with transparent JS redirect.
    // Same content for Facebook crawler and real users (no cloaking).
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Redirecionando</title>
<style>body{margin:0;background:#fff}</style>
</head>
<body>
<script>window.location.href="${redirectUrl.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}";</script>
<noscript><meta http-equiv="refresh" content="0;url=${redirectUrl}"></noscript>
</body>
</html>`);
  }
}
