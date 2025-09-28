import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  listOrders(@CurrentUser() user: any) {
    return this.ordersService.listOrders(user.userId);
  }

  @Get(':id')
  getOrder(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ordersService.getOrder(user.userId, id);
  }

  @Post()
  createOrder(@CurrentUser() user: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(user.userId, dto);
  }
}
