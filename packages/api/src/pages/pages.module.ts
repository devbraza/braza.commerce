import { Module } from '@nestjs/common';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';
import { PrismaService } from '../common/services/prisma.service';
import { UploadModule } from '../upload/upload.module';
import { AiModule } from '../ai/ai.module';
import { BrazaPagesModule } from '../braza-pages/braza-pages.module';
import { RenderModule } from '../render/render.module';

@Module({
  imports: [UploadModule, AiModule, BrazaPagesModule, RenderModule],
  controllers: [PagesController],
  providers: [PagesService, PrismaService],
  exports: [PagesService],
})
export class PagesModule {}
