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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';

@Controller('orders')
@UseGuards(OptionalAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateOrderDto) {
    const user = req.user as { id: string };
    return this.ordersService.create(user.id, dto);
  }

  @Get()
  findAll(
    @Req() req: Request,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const user = req.user as { id: string };
    return this.ordersService.findAll(user.id, {
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    return this.ordersService.findOne(user.id, id);
  }

  @Patch(':id/address')
  updateAddress(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateAddressDto) {
    const user = req.user as { id: string };
    return this.ordersService.updateAddress(user.id, id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    const user = req.user as { id: string };
    return this.ordersService.updateStatus(user.id, id, status);
  }

  @Patch(':id/tracking')
  setTracking(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('trackingCode') trackingCode: string,
  ) {
    const user = req.user as { id: string };
    return this.ordersService.setTrackingCode(user.id, id, trackingCode);
  }
}
