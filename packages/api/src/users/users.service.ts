import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CryptoService } from '../common/services/crypto.service';
import { ZApiService, ZApiStatus, ZApiDevice } from './zapi.service';
import { WhatsAppConfigDto } from './dto/whatsapp-config.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly zapi: ZApiService,
  ) {}

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.timezone !== undefined) data.timezone = dto.timezone;
    if (dto.shippingData !== undefined) data.shippingData = dto.shippingData;

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, timezone: true, shippingData: true },
    });
  }

  async saveWhatsAppConfig(userId: string, dto: WhatsAppConfigDto) {
    const encryptedToken = this.crypto.encrypt(dto.token);
    const encryptedClientToken = this.crypto.encrypt(dto.clientToken);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        zapiInstanceId: dto.instanceId,
        zapiToken: encryptedToken,
        zapiClientToken: encryptedClientToken,
      },
    });

    const baseUrl = process.env.API_BASE_URL || 'https://api.brazachat.shop';
    const webhookOk = await this.zapi.registerWebhooks(
      { instanceId: dto.instanceId, token: dto.token, clientToken: dto.clientToken },
      baseUrl,
    );

    return { saved: true, webhooksRegistered: webhookOk };
  }

  async getWhatsAppStatus(userId: string): Promise<ZApiStatus> {
    const creds = await this.getDecryptedCredentials(userId);
    if (!creds) {
      return { connected: false, smartphoneConnected: false, error: 'Credenciais não configuradas' };
    }
    return this.zapi.getStatus(creds);
  }

  async getWhatsAppQrCode(userId: string): Promise<{ base64?: string; connected?: boolean }> {
    const creds = await this.getDecryptedCredentials(userId);
    if (!creds) {
      throw new BadRequestException('Credenciais Z-API não configuradas. Salve em Settings > WhatsApp primeiro.');
    }
    return this.zapi.getQrCode(creds);
  }

  async getWhatsAppDevice(userId: string): Promise<ZApiDevice | null> {
    const creds = await this.getDecryptedCredentials(userId);
    if (!creds) return null;
    return this.zapi.getDevice(creds);
  }

  async restoreWhatsAppSession(userId: string): Promise<boolean> {
    const creds = await this.getDecryptedCredentials(userId);
    if (!creds) return false;
    return this.zapi.restoreSession(creds);
  }

  async disconnectWhatsApp(userId: string): Promise<boolean> {
    const creds = await this.getDecryptedCredentials(userId);
    if (!creds) return false;
    return this.zapi.disconnect(creds);
  }

  async disconnectFacebook(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { accessToken: true },
    });

    // Attempt to revoke token via Meta API
    if (user?.accessToken) {
      try {
        const decryptedToken = this.crypto.decrypt(user.accessToken);
        await fetch(
          `https://graph.facebook.com/me/permissions?access_token=${decryptedToken}`,
          { method: 'DELETE' },
        );
      } catch (error) {
        this.logger.warn('Failed to revoke Facebook token', (error as Error).message);
      }
    }

    // Clear tokens but keep historical data
    await this.prisma.user.update({
      where: { id: userId },
      data: { accessToken: null, refreshToken: null },
    });

    return { disconnected: true };
  }

  private async getDecryptedCredentials(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { zapiInstanceId: true, zapiToken: true, zapiClientToken: true },
    });

    if (!user?.zapiInstanceId || !user?.zapiToken || !user?.zapiClientToken) {
      return null;
    }

    try {
      return {
        instanceId: user.zapiInstanceId,
        token: this.crypto.decrypt(user.zapiToken),
        clientToken: this.crypto.decrypt(user.zapiClientToken),
      };
    } catch (error) {
      this.logger.error('Failed to decrypt Z-API credentials', error);
      return null;
    }
  }
}
