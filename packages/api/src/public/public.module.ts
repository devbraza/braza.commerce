import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PagesModule } from '../pages/pages.module';
import { RenderModule } from '../render/render.module';

@Module({
  imports: [PagesModule, RenderModule],
  controllers: [PublicController],
})
export class PublicModule {}
