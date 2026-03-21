import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';

@Injectable()
export class YampiService {
  private readonly logger = new Logger(YampiService.name);

  validateSignature(body: Buffer | unknown, signature: string, secretKey: string): boolean {
    if (!signature || !secretKey) return false;
    const payload = Buffer.isBuffer(body) ? body : JSON.stringify(body);
    const computed = createHmac('sha256', secretKey)
      .update(payload)
      .digest('base64');
    const isValid = computed === signature;
    if (!isValid) {
      this.logger.warn('Yampi webhook: invalid HMAC signature');
    }
    return isValid;
  }

  extractClickId(data: Record<string, unknown>): string | null {
    // Try multiple paths: data.metadata, data.resource.metadata, data.order.metadata
    const candidates = [
      data?.metadata,
      (data?.resource as Record<string, unknown>)?.metadata,
      (data?.order as Record<string, unknown>)?.metadata,
    ];
    for (const metadata of candidates) {
      if (metadata && typeof metadata === 'object') {
        const clickId = (metadata as Record<string, unknown>).click_id as string;
        if (clickId) {
          this.logger.log(`Found click_id: ${clickId}`);
          return clickId;
        }
      }
    }
    this.logger.log(`No click_id found in paths: metadata, resource.metadata, order.metadata`);
    return null;
  }

  extractOrderTotal(data: Record<string, unknown>): number {
    // Try multiple paths for total
    const resource = data?.resource as Record<string, unknown> | undefined;
    return Number(resource?.total || resource?.amount || data?.total || data?.amount || 0);
  }
}
