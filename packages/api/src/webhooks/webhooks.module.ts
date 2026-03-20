import { Module } from '@nestjs/common';
import { YampiController } from './yampi.controller';
import { YampiService } from './yampi.service';
import { TrackingModule } from '../tracking/tracking.module';
import { CapiModule } from '../capi/capi.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [TrackingModule, CapiModule, SettingsModule],
  controllers: [YampiController],
  providers: [YampiService],
})
export class WebhooksModule {}
