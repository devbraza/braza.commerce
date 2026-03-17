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

    res.redirect(302, redirectUrl);
  }
}
