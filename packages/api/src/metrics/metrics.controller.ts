import { Controller, Get, Query } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller()
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get('metrics/overview')
  getOverview(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.metrics.getOverview(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('events')
  getEvents(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.metrics.getGlobalEvents(Number(page) || 1, Number(limit) || 20);
  }
}
