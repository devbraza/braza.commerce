import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CryptoService } from '../common/services/crypto.service';

const META_API_BASE = 'https://graph.facebook.com/v21.0';

@Injectable()
export class MetaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  async getAdAccounts(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (!user.accessToken) {
      throw new UnauthorizedException('No Meta access token. Please re-authenticate.');
    }

    const accessToken = this.crypto.decrypt(user.accessToken);

    const response = await fetch(
      `${META_API_BASE}/me/adaccounts?fields=id,name,account_status&access_token=${accessToken}`,
    );

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401 || error?.error?.code === 190) {
        throw new UnauthorizedException(
          'Meta token expired. Please re-authenticate.',
        );
      }
      throw new Error(`Meta API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const accounts = data.data || [];

    for (const account of accounts) {
      await this.prisma.adAccount.upsert({
        where: {
          metaId_userId: { metaId: account.id, userId },
        },
        update: {
          name: account.name,
          status: String(account.account_status),
        },
        create: {
          metaId: account.id,
          name: account.name,
          status: String(account.account_status),
          userId,
        },
      });
    }

    return this.prisma.adAccount.findMany({ where: { userId } });
  }

  async getPixels(userId: string, adAccountId: string) {
    const adAccount = await this.prisma.adAccount.findFirst({
      where: { id: adAccountId, userId },
    });

    if (!adAccount) {
      throw new UnauthorizedException('Ad account not found or not yours.');
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (!user.accessToken) {
      throw new UnauthorizedException('No Meta access token.');
    }

    const accessToken = this.crypto.decrypt(user.accessToken);

    // metaId already includes "act_" prefix from Facebook API
    const accountId = adAccount.metaId.startsWith('act_') ? adAccount.metaId : `act_${adAccount.metaId}`;
    const response = await fetch(
      `${META_API_BASE}/${accountId}/adspixels?fields=id,name&access_token=${accessToken}`,
    );

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401 || error?.error?.code === 190) {
        throw new UnauthorizedException('Meta token expired.');
      }
      throw new Error(`Meta API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const pixels = data.data || [];

    for (const pixel of pixels) {
      const existing = await this.prisma.pixel.findFirst({
        where: { metaId: pixel.id, adAccountId },
      });

      if (existing) {
        await this.prisma.pixel.update({
          where: { id: existing.id },
          data: { name: pixel.name },
        });
      } else {
        await this.prisma.pixel.create({
          data: {
            metaId: pixel.id,
            name: pixel.name,
            adAccountId,
          },
        });
      }
    }

    return this.prisma.pixel.findMany({ where: { adAccountId } });
  }
}
