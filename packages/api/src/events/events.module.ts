import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { PrismaService } from '../common/services/prisma.service';
import { CryptoService } from '../common/services/crypto.service';

@Module({
  controllers: [EventsController],
  providers: [EventsService, PrismaService, CryptoService],
  exports: [EventsService],
})
export class EventsModule {}
