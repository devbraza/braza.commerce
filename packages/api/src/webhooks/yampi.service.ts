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
    const metadata = data?.metadata as Record<string, unknown> | undefined;
    if (!metadata) {
      this.logger.log('No metadata in payload');
      return null;
    }

    // Yampi metadata format: { data: [{ key: "click_id", value: "ck_xxx" }, ...] }
    const metadataData = metadata.data as Array<{ key: string; value: string }> | undefined;
    if (Array.isArray(metadataData)) {
      const entry = metadataData.find((item) => item.key === 'click_id');
      if (entry?.value) {
        this.logger.log(`Found click_id: ${entry.value}`);
        return entry.value;
      }
    }

    // Fallback: direct metadata.click_id
    const directClickId = metadata.click_id as string;
    if (directClickId) {
      this.logger.log(`Found click_id (direct): ${directClickId}`);
      return directClickId;
    }

    this.logger.log(`No click_id in metadata: ${JSON.stringify(metadata).slice(0, 200)}`);
    return null;
  }

  extractOrderTotal(data: Record<string, unknown>): number {
    return Number(data?.value_total || data?.total || data?.amount || 0);
  }
}
