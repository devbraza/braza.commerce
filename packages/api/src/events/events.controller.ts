import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';

@Controller('events')
@UseGuards(OptionalAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateEventDto) {
    const user = req.user as { id: string };
    return this.eventsService.createEvent(user.id, dto);
  }

  @Get()
  findAll(
    @Req() req: Request,
    @Query('type') type?: string,
    @Query('sentToMeta') sentToMeta?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const user = req.user as { id: string };
    return this.eventsService.findAll(user.id, {
      type,
      sentToMeta,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('retry')
  retryFailed(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.eventsService.retryFailed(user.id);
  }
}
