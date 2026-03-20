import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    const settings = await this.prisma.settings.upsert({
      where: { id: 'default' },
      create: { id: 'default' },
      update: {},
    });
    return {
      ...settings,
      defaultAccessToken: settings.defaultAccessToken
        ? '•'.repeat(Math.max(0, settings.defaultAccessToken.length - 4)) + settings.defaultAccessToken.slice(-4)
        : null,
      hasYampiSecret: !!settings.yampiSecretKey,
      yampiSecretKey: undefined,
    };
  }

  async getRaw() {
    return this.prisma.settings.upsert({
      where: { id: 'default' },
      create: { id: 'default' },
      update: {},
    });
  }

  async update(data: { yampiSecretKey?: string; defaultPixelId?: string; defaultAccessToken?: string }) {
    return this.prisma.settings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...data },
      update: data,
    });
  }
}
