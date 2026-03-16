import { Injectable, Logger } from '@nestjs/common';

interface ZApiCredentials {
  instanceId: string;
  token: string;
  clientToken: string;
}

export interface ZApiStatus {
  connected: boolean;
  smartphoneConnected: boolean;
  error: string;
}

export interface ZApiDevice {
  phone: string;
  name: string;
  photo: string;
  deviceModel: string;
  isBusiness: boolean;
}

@Injectable()
export class ZApiService {
  private readonly logger = new Logger(ZApiService.name);
  private readonly baseUrl = 'https://api.z-api.io/instances';

  private buildUrl(creds: ZApiCredentials, path: string): string {
    return `${this.baseUrl}/${creds.instanceId}/token/${creds.token}/${path}`;
  }

  private buildHeaders(creds: ZApiCredentials): Record<string, string> {
    return {
      'Client-Token': creds.clientToken,
      'Content-Type': 'application/json',
    };
  }

  private async fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error(`Z-API request failed: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  }

  async getStatus(creds: ZApiCredentials): Promise<ZApiStatus> {
    try {
      return await this.fetchJson<ZApiStatus>(
        this.buildUrl(creds, 'status'),
        { headers: this.buildHeaders(creds) },
      );
    } catch (error) {
      this.logger.error('Failed to get Z-API status', (error as Error).message);
      return { connected: false, smartphoneConnected: false, error: 'Failed to connect to Z-API' };
    }
  }

  async getQrCode(creds: ZApiCredentials): Promise<{ base64?: string; connected?: boolean }> {
    const status = await this.getStatus(creds);
    if (status.connected) {
      return { connected: true };
    }

    try {
      const res = await fetch(
        this.buildUrl(creds, 'qr-code/image'),
        { headers: this.buildHeaders(creds) },
      );
      if (!res.ok) throw new Error(`QR code request failed: ${res.status}`);
      const data = await res.json();
      return { base64: typeof data === 'string' ? data : data?.value };
    } catch (error) {
      this.logger.error('Failed to get QR code', (error as Error).message);
      throw error;
    }
  }

  async getDevice(creds: ZApiCredentials): Promise<ZApiDevice | null> {
    try {
      const data = await this.fetchJson<Record<string, unknown>>(
        this.buildUrl(creds, 'device'),
        { headers: this.buildHeaders(creds) },
      );
      return {
        phone: (data.phone as string) ?? '',
        name: (data.name as string) ?? '',
        photo: (data.photo as string) ?? '',
        deviceModel: (data.deviceModel as string) ?? '',
        isBusiness: (data.isBusiness as boolean) ?? false,
      };
    } catch (error) {
      this.logger.error('Failed to get device info', (error as Error).message);
      return null;
    }
  }

  async restoreSession(creds: ZApiCredentials): Promise<boolean> {
    try {
      const data = await this.fetchJson<{ value?: boolean }>(
        this.buildUrl(creds, 'restore-session'),
        { headers: this.buildHeaders(creds) },
      );
      return data?.value === true;
    } catch (error) {
      this.logger.error('Failed to restore session', (error as Error).message);
      return false;
    }
  }

  async disconnect(creds: ZApiCredentials): Promise<boolean> {
    try {
      await fetch(
        this.buildUrl(creds, 'disconnect'),
        { headers: this.buildHeaders(creds) },
      );
      return true;
    } catch (error) {
      this.logger.error('Failed to disconnect', (error as Error).message);
      return false;
    }
  }

  async registerWebhooks(creds: ZApiCredentials, baseUrl: string): Promise<boolean> {
    try {
      await Promise.all([
        fetch(this.buildUrl(creds, 'update-webhook-received'), {
          method: 'PUT',
          headers: this.buildHeaders(creds),
          body: JSON.stringify({ value: `${baseUrl}/webhook/z-api` }),
        }),
        fetch(this.buildUrl(creds, 'update-webhook-delivery'), {
          method: 'PUT',
          headers: this.buildHeaders(creds),
          body: JSON.stringify({ value: `${baseUrl}/webhook/z-api/delivery` }),
        }),
      ]);
      this.logger.log('Z-API webhooks registered successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to register webhooks', (error as Error).message);
      return false;
    }
  }
}
