import { Module } from '@nestjs/common';
import { BrazaPagesService } from './braza-pages.service';

@Module({
  providers: [BrazaPagesService],
  exports: [BrazaPagesService],
})
export class BrazaPagesModule {}
