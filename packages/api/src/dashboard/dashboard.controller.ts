import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
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
