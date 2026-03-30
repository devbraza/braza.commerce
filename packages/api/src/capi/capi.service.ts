import { Injectable, Logger } from '@nestjs/common';
import { Click, Campaign } from '@prisma/client';

@Injectable()
export class CapiService {
  private readonly logger = new Logger(CapiService.name);
  private readonly graphUrl = 'https://graph.facebook.com/v21.0';

  async sendViewContent(click: Click, campaign: Campaign, pageUrl?: string) {
    if (!campaign.pixelId || !campaign.accessToken) {
      this.logger.debug('CAPI skip: no pixel configured');
      return;
    }
    const eventId = `vc_${click.clickId}`;
    await this.sendEvent(campaign.pixelId, campaign.accessToken, {
      event_name: 'ViewContent',
      event_id: eventId,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: pageUrl || '',
      user_data: {
        client_ip_address: click.ip,
        client_user_agent: click.userAgent,
        ...(click.fbc && { fbc: click.fbc }),
        ...(click.fbp && { fbp: click.fbp }),
      },
      custom_data: {
        content_type: 'product',
      },
    });
  }

  async sendPurchase(click: Click, campaign: Campaign, value: number) {
    if (!campaign.pixelId || !campaign.accessToken) {
      this.logger.debug('CAPI skip: no pixel configured');
      return;
    }
    const eventId = `purchase_${click.clickId}`;
    await this.sendEvent(campaign.pixelId, campaign.accessToken, {
      event_name: 'Purchase',
      event_id: eventId,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      user_data: {
        client_ip_address: click.ip,
        client_user_agent: click.userAgent,
        ...(click.fbc && { fbc: click.fbc }),
        ...(click.fbp && { fbp: click.fbp }),
      },
      custom_data: {
        value,
        currency: 'BRL',
      },
    });
  }

  async sendInitiateCheckout(click: Click, campaign: Campaign) {
    if (!campaign.pixelId || !campaign.accessToken) {
      this.logger.debug('CAPI skip: no pixel configured');
      return;
    }
    const eventId = `ic_${click.clickId}`;
    await this.sendEvent(campaign.pixelId, campaign.accessToken, {
      event_name: 'InitiateCheckout',
      event_id: eventId,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      user_data: {
        client_ip_address: click.ip,
        client_user_agent: click.userAgent,
        ...(click.fbc && { fbc: click.fbc }),
        ...(click.fbp && { fbp: click.fbp }),
      },
    });
  }

  private async sendEvent(pixelId: string, accessToken: string, eventData: Record<string, unknown>) {
    const url = `${this.graphUrl}/${pixelId}/events`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ data: [eventData] }),
      });
      const body = await res.json();
      if (res.ok) {
        this.logger.log(`CAPI ${eventData.event_name} (${eventData.event_id}): sent to pixel ${pixelId}`);
      } else {
        this.logger.error(`CAPI ${eventData.event_name} error: ${JSON.stringify(body)}`);
      }
    } catch (err) {
      this.logger.error(`CAPI ${eventData.event_name} fetch error: ${(err as Error).message}`);
    }
  }
}
