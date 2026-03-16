import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { MetaService } from './meta.service';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';

@Controller('meta')
@UseGuards(OptionalAuthGuard)
export class MetaController {
  constructor(private readonly metaService: MetaService) {}

  @Get('ad-accounts')
  getAdAccounts(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.metaService.getAdAccounts(user.id);
  }

  @Get('ad-accounts/:id/pixels')
  getPixels(@Req() req: Request, @Param('id') adAccountId: string) {
    const user = req.user as { id: string };
    return this.metaService.getPixels(user.id, adAccountId);
  }
}
