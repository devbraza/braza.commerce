import { Injectable, Logger } from '@nestjs/common';

interface BrazaPagesPublishResult {
  success: boolean;
  url: string;
  deployment_id: string;
  vercel_deployment_id?: string;
  status?: string;
  source?: string;
}

interface BrazaPagesErrorResult {
  success: false;
  error: string;
  statusCode: number;
}

@Injectable()
export class BrazaPagesService {
  private readonly logger = new Logger(BrazaPagesService.name);
  private readonly baseUrl: string | undefined;
  private readonly apiKey: string | undefined;
  private readonly defaultDomainId: string | undefined;

  constructor() {
    this.baseUrl = process.env.BRAZA_PAGES_URL;
    this.apiKey = process.env.BRAZA_PAGES_API_KEY;
    this.defaultDomainId = process.env.BRAZA_PAGES_DEFAULT_DOMAIN_ID;

    if (!this.baseUrl || !this.apiKey || !this.defaultDomainId) {
      this.logger.warn(
        'braza.pages integration disabled — missing env vars: BRAZA_PAGES_URL, BRAZA_PAGES_API_KEY, or BRAZA_PAGES_DEFAULT_DOMAIN_ID',
      );
    } else {
      this.logger.log(`braza.pages integration enabled → ${this.baseUrl}`);
    }
  }

  isConfigured(): boolean {
    return !!(this.baseUrl && this.apiKey && this.defaultDomainId);
  }

  getDefaultDomainId(): string | undefined {
    return this.defaultDomainId;
  }

  async publish(
    html: string,
    slug: string,
    domainId?: string,
  ): Promise<BrazaPagesPublishResult | BrazaPagesErrorResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Integracao braza.pages nao configurada',
        statusCode: 503,
      };
    }

    const targetDomainId = domainId || this.defaultDomainId;

    try {
      const response = await fetch(
        `${this.baseUrl}/api/deploy-passthrough`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey!,
          },
          body: JSON.stringify({
            html,
            slug,
            domain_id: targetDomainId,
            source: 'braza-commerce',
          }),
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        this.logger.log(`Published to braza.pages: ${data.url}`);
        return data as BrazaPagesPublishResult;
      }

      const errorMessage = data.error || `braza.pages retornou ${response.status}`;
      this.logger.error(`braza.pages error (${response.status}): ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
        statusCode: response.status,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`braza.pages request failed: ${message}`);
      return {
        success: false,
        error: `Falha ao conectar com braza.pages: ${message}`,
        statusCode: 502,
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.baseUrl) return false;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(this.baseUrl, {
        signal: controller.signal,
      });

      clearTimeout(timeout);
      return response.ok;
    } catch {
      return false;
    }
  }
}
