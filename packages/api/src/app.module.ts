import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { HealthModule } from './health/health.module';
import { UploadModule } from './upload/upload.module';
import { PagesModule } from './pages/pages.module';
import { AiModule } from './ai/ai.module';
import { RenderModule } from './render/render.module';
import { PublicModule } from './public/public.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { TrackingModule } from './tracking/tracking.module';
import { CapiModule } from './capi/capi.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { SettingsModule } from './settings/settings.module';
import { MetricsModule } from './metrics/metrics.module';
import { PrismaService } from './common/services/prisma.service';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
      },
    }),
    HealthModule,
    UploadModule,
    PagesModule,
    AiModule,
    RenderModule,
    PublicModule,
    CampaignsModule,
    TrackingModule,
    CapiModule,
    WebhooksModule,
    SettingsModule,
    MetricsModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
