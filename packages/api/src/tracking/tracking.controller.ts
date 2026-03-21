import { Controller, Post, Body, Req, Logger } from '@nestjs/common';
import { Request } from 'express';
import { TrackingService } from './tracking.service';
import { CapiService } from '../capi/capi.service';
import { RegisterClickDto } from './dto/register-click.dto';

@Controller('tracking')
export class TrackingController {
  private readonly logger = new Logger(TrackingController.name);

  constructor(
    private readonly tracking: TrackingService,
    private readonly capi: CapiService,
  ) {}

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

    // Fire ViewContent via Meta CAPI (server-side)
    const clickWithCampaign = await this.tracking.getClickWithCampaign(result.clickId);
    if (clickWithCampaign?.campaign) {
      const pageUrl = req.headers['referer'] || '';
      this.capi.sendViewContent(clickWithCampaign, clickWithCampaign.campaign, pageUrl as string).catch((err) => {
        this.logger.error(`CAPI ViewContent error: ${err.message}`);
      });
    }

    return { clickId: result.clickId };
  }
}
