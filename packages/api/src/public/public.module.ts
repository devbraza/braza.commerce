import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PagesModule } from '../pages/pages.module';
import { RenderModule } from '../render/render.module';
import { UploadModule } from '../upload/upload.module';
import { CampaignsModule } from '../campaigns/campaigns.module';

@Module({
  imports: [PagesModule, RenderModule, UploadModule, CampaignsModule],
  controllers: [PublicController],
})
export class PublicModule {}
