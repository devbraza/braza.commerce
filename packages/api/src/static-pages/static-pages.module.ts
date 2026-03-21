import { Module } from '@nestjs/common';
import { StaticPageGeneratorService } from './static-page-generator.service';
import { RenderModule } from '../render/render.module';

@Module({
  imports: [RenderModule],
  providers: [StaticPageGeneratorService],
  exports: [StaticPageGeneratorService],
})
export class StaticPagesModule {}
