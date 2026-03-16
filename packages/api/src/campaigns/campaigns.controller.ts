import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';

@Controller('campaigns')
@UseGuards(OptionalAuthGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateCampaignDto) {
    const user = req.user as { id: string };
    return this.campaignsService.create(user.id, dto);
  }

  @Get()
  findAll(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const user = req.user as { id: string };
    return this.campaignsService.findAll(user.id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    return this.campaignsService.findOne(user.id, id);
  }

  @Patch(':id')
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: any) {
    const user = req.user as { id: string };
    return this.campaignsService.update(user.id, id, dto);
  }
}
