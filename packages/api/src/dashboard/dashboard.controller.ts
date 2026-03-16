import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { DashboardService } from './dashboard.service';
import { AdCostService } from './ad-cost.service';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';

@Controller('dashboard')
@UseGuards(OptionalAuthGuard)
export class DashboardController {
  private syncCooldowns = new Map<string, number>();

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly adCostService: AdCostService,
  ) {}

  @Get('metrics')
  getMetrics(@Req() req: Request, @Query('period') period?: string) {
    const user = req.user as { id: string };
    return this.dashboardService.getMetrics(user.id, period || '30d');
  }

  @Get('top')
  getTop(@Req() req: Request, @Query('period') period?: string) {
    const user = req.user as { id: string };
    return this.dashboardService.getTopData(user.id, period || '30d');
  }

  @Post('sync-costs')
  async syncCosts(@Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    const now = Date.now();
    const lastSync = this.syncCooldowns.get(userId) || 0;

    if (now - lastSync < 5 * 60 * 1000) {
      throw new BadRequestException(
        'Aguarde 5 minutos entre sincronizacoes.',
      );
    }

    // FIX-5: Cleanup expired entries to prevent memory leak
    for (const [uid, ts] of this.syncCooldowns) {
      if (now - ts >= 5 * 60 * 1000) this.syncCooldowns.delete(uid);
    }

    this.syncCooldowns.set(userId, now);
    return this.adCostService.syncAllForUser(userId);
  }
}
