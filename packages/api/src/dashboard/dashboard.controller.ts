import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { DashboardService } from './dashboard.service';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';

@Controller('dashboard')
@UseGuards(OptionalAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

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
}
