import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { AdCostService } from './ad-cost.service';
import { PrismaService } from '../common/services/prisma.service';
import { CryptoService } from '../common/services/crypto.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, AdCostService, PrismaService, CryptoService],
})
export class DashboardModule {}
