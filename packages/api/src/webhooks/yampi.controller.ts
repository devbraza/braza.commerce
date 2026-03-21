import { Controller, Post, Req, Res, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { YampiService } from './yampi.service';
import { TrackingService } from '../tracking/tracking.service';
import { CapiService } from '../capi/capi.service';
import { SettingsService } from '../settings/settings.service';

@Controller('api/webhooks')
export class YampiController {
  private readonly logger = new Logger(YampiController.name);

  constructor(
    private readonly yampi: YampiService,
    private readonly tracking: TrackingService,
    private readonly capi: CapiService,
    private readonly settings: SettingsService,
  ) {}

  @Post('yampi')
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    try {
      const config = await this.settings.getRaw();
      const secretKey = process.env.YAMPI_WEBHOOK_SECRET || config.yampiSecretKey;
      const signature = req.headers['x-yampi-hmac-sha256'] as string;

      if (secretKey && signature) {
        const rawBody = (req as any).rawBody as Buffer;
        if (!this.yampi.validateSignature(rawBody || req.body, signature, secretKey)) {
          this.logger.warn('Yampi webhook: invalid HMAC signature');
          return res.status(401).send('Invalid signature');
        }
      }

      res.status(200).send('OK');

      const body = req.body as Record<string, unknown>;
      const event = (body.event as string) || '';
      const resource = (body.resource || body.data || body) as Record<string, unknown>;
      this.logger.log(`Yampi webhook received: ${event}`);
      this.logger.log(`Yampi webhook metadata: ${JSON.stringify(resource?.metadata)}`);

      const clickId = this.yampi.extractClickId(resource);
      if (!clickId) {
        this.logger.debug('Yampi webhook: no click_id in metadata, skipping tracking');
        return;
      }

      const clickWithCampaign = await this.tracking.getClickWithCampaign(clickId);
      if (!clickWithCampaign) {
        this.logger.warn(`Yampi webhook: click ${clickId} not found`);
        return;
      }

      if (event === 'order.paid') {
        const total = this.yampi.extractOrderTotal(resource);
        await this.tracking.registerEvent(clickId, 'PURCHASE', total);
        // Fire Meta CAPI Purchase
        await this.capi.sendPurchase(clickWithCampaign, clickWithCampaign.campaign, total).catch((err) => {
          this.logger.error(`CAPI Purchase error: ${err.message}`);
        });
        this.logger.log(`Purchase registered: click=${clickId}, value=${total}`);
      } else if (event === 'order.created') {
        await this.tracking.registerEvent(clickId, 'INITIATE_CHECKOUT');
        this.logger.log(`Checkout registered: click=${clickId}`);
      } else if (event === 'transaction.payment.refused') {
        await this.tracking.registerEvent(clickId, 'PAYMENT_REFUSED');
        this.logger.log(`Payment refused: click=${clickId}`);
      }
    } catch (err) {
      this.logger.error(`Yampi webhook error: ${(err as Error).message}`);
    }
  }
}
