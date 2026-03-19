import { Module } from '@nestjs/common';
import { AiCopyService } from './ai-copy.service';
import { AiImageService } from './ai-image.service';

@Module({
  providers: [AiCopyService, AiImageService],
  exports: [AiCopyService, AiImageService],
})
export class AiModule {}
