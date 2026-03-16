import { Module } from '@nestjs/common';
import { ClicksController } from './clicks.controller';
import { ClicksService } from './clicks.service';
import { PrismaService } from '../common/services/prisma.service';
import { CampaignsService } from '../campaigns/campaigns.service';

@Module({
  controllers: [ClicksController],
  providers: [ClicksService, PrismaService, CampaignsService],
  exports: [ClicksService],
})
export class ClicksModule {}
