import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { MetaModule } from './meta/meta.module';
import { ProductsModule } from './products/products.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { ClicksModule } from './clicks/clicks.module';
import { LeadsModule } from './leads/leads.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { EventsModule } from './events/events.module';
import { OrdersModule } from './orders/orders.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AiModule } from './ai/ai.module';
import { CryptoService } from './common/services/crypto.service';
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
    AuthModule,
    MetaModule,
    ProductsModule,
    CampaignsModule,
    ClicksModule,
    LeadsModule,
    WhatsappModule,
    EventsModule,
    OrdersModule,
    DashboardModule,
    AiModule,
  ],
  providers: [CryptoService, PrismaService],
  exports: [CryptoService, PrismaService],
})
export class AppModule {}
