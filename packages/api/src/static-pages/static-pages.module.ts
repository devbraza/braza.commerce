import { Module } from '@nestjs/common';
import { StaticPageGeneratorService } from './static-page-generator.service';
import { CloudflarePagesService } from './cloudflare-pages.service';
import { RenderModule } from '../render/render.module';

@Module({
  imports: [RenderModule],
  providers: [StaticPageGeneratorService, CloudflarePagesService],
  exports: [StaticPageGeneratorService, CloudflarePagesService],
})
export class StaticPagesModule {}
