import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: any) {
    return this.cartService.getCart(user.userId);
  }

  @Post()
  addItem(@CurrentUser() user: any, @Body() dto: AddCartItemDto) {
    return this.cartService.addOrUpdateItem(user.userId, dto);
  }

  @Patch(':id')
  updateItem(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateCartItemDto) {
    return this.cartService.updateItem(user.userId, id, dto);
  }

  @Delete(':id')
  removeItem(@CurrentUser() user: any, @Param('id') id: string) {
    return this.cartService.removeItem(user.userId, id);
  }

  @Delete()
  clear(@CurrentUser() user: any) {
    return this.cartService.clearCart(user.userId);
  }
}
