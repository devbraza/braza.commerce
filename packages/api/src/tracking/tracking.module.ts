import { Module } from '@nestjs/common';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { PrismaService } from '../common/services/prisma.service';
import { CapiModule } from '../capi/capi.module';

@Module({
  imports: [CapiModule],
  controllers: [TrackingController],
  providers: [TrackingService, PrismaService],
  exports: [TrackingService],
})
export class TrackingModule {}
