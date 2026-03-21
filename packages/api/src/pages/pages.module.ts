import { Module } from '@nestjs/common';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';
import { PrismaService } from '../common/services/prisma.service';
import { UploadModule } from '../upload/upload.module';
import { AiModule } from '../ai/ai.module';
import { StaticPagesModule } from '../static-pages/static-pages.module';
import { CampaignsModule } from '../campaigns/campaigns.module';

@Module({
  imports: [UploadModule, AiModule, StaticPagesModule, CampaignsModule],
  controllers: [PagesController],
  providers: [PagesService, PrismaService],
  exports: [PagesService],
})
export class PagesModule {}
