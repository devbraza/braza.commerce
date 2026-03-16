import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { PrismaService } from '../common/services/prisma.service';
import { LeadsService } from '../leads/leads.service';
import { EventsService } from '../events/events.service';
import { CryptoService } from '../common/services/crypto.service';

@Module({
  controllers: [WhatsappController],
  providers: [WhatsappService, PrismaService, LeadsService, EventsService, CryptoService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
