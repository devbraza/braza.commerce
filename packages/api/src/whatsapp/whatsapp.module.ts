import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { PrismaService } from '../common/services/prisma.service';
import { CryptoService } from '../common/services/crypto.service';
import { LeadsService } from '../leads/leads.service';
import { EventsService } from '../events/events.service';
import { ZApiService } from '../users/zapi.service';

@Module({
  controllers: [WhatsappController],
  providers: [WhatsappService, PrismaService, LeadsService, EventsService, CryptoService, ZApiService],
  exports: [WhatsappService],
})
export class WhatsappModule implements OnModuleInit {
  private readonly logger = new Logger(WhatsappModule.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly zapi: ZApiService,
  ) {}

  async onModuleInit() {
    try {
      const users = await this.prisma.user.findMany({
        where: { zapiInstanceId: { not: null } },
        select: { zapiInstanceId: true, zapiToken: true, zapiClientToken: true },
      });

      if (users.length === 0) {
        this.logger.log('No Z-API credentials configured — skipping webhook registration');
        return;
      }

      const baseUrl = process.env.API_BASE_URL || 'https://api.brazachat.shop';

      for (const user of users) {
        if (!user.zapiInstanceId || !user.zapiToken || !user.zapiClientToken) continue;
        try {
          const creds = {
            instanceId: user.zapiInstanceId,
            token: this.crypto.decrypt(user.zapiToken),
            clientToken: this.crypto.decrypt(user.zapiClientToken),
          };
          await this.zapi.registerWebhooks(creds, baseUrl);
        } catch (err) {
          this.logger.warn(`Failed to register webhooks for instance ${user.zapiInstanceId}: ${(err as Error).message}`);
        }
      }
    } catch (err) {
      this.logger.warn(`Webhook auto-registration skipped: ${(err as Error).message}`);
    }
  }
}
