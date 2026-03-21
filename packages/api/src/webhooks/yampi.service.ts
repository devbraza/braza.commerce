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
    const metadata = data.metadata as Record<string, unknown> | undefined;
    if (!metadata) return null;
    return (metadata.click_id as string) || null;
  }

  extractOrderTotal(data: Record<string, unknown>): number {
    return Number(data.total || data.amount || 0);
  }
}
