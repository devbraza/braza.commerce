import { Controller, Post, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { TrackingService } from './tracking.service';
import { RegisterClickDto } from './dto/register-click.dto';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly tracking: TrackingService) {}

  @Post('click')
  async registerClick(
    @Body() dto: RegisterClickDto,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await this.tracking.registerClick({
      campaignId: dto.campaignId,
      fbclid: dto.fbclid,
      ip,
      userAgent,
      utmSource: dto.utmSource,
      utmMedium: dto.utmMedium,
      utmCampaign: dto.utmCampaign,
      utmContent: dto.utmContent,
      utmTerm: dto.utmTerm,
    });

    return { clickId: result.clickId };
  }
}
