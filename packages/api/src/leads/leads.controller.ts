import { Controller, Get, Patch, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  findAll(
    @Req() req: Request,
    @Query('status') status?: string,
    @Query('campaignId') campaignId?: string,
    @Query('productId') productId?: string,
    @Query('utmSource') utmSource?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const user = req.user as { id: string };
    return this.leadsService.findAll(user.id, {
      status,
      campaignId,
      productId,
      utmSource,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    return this.leadsService.findOne(user.id, id);
  }

  @Patch(':id/status')
  updateStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    const user = req.user as { id: string };
    return this.leadsService.updateStatus(user.id, id, status);
  }
}
