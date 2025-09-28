import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService, private readonly cartService: CartService) {}

  listOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        address: true,
      },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    const cart = await this.cartService.getCart(userId);
    if (!cart.items.length) {
      throw new BadRequestException('Cart is empty');
    }

    const address = await this.prisma.address.findUnique({ where: { id: dto.addressId } });
    if (!address || address.userId !== userId) {
      throw new BadRequestException('Invalid address');
    }

    const subtotal = cart.summary.subtotal;
    const tax = cart.summary.tax;
    const deliveryFee = cart.summary.deliveryFee;
    const discount = cart.summary.discount;
    const total = cart.summary.total;

    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId,
          addressId: dto.addressId,
          status: 'CREATED',
          paymentStatus: 'PENDING',
          paymentMethod: dto.paymentMethod ?? 'COD',
          couponCode: dto.couponCode,
          subtotal,
          tax,
          deliveryFee,
          discount,
          total,
          items: {
            create: cart.items.map((item) => ({
              productName: item.product.name,
              variantName: item.variant.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              addons: item.addons.map((addon) => ({
                id: addon.id,
                name: addon.name,
                priceDelta: addon.priceDelta,
                group: addon.group,
              })),
            })),
          },
        },
        include: {
          items: true,
          address: true,
        },
      });

      await tx.cartItemAddon.deleteMany({ where: { cartItem: { userId } } });
      await tx.cartItem.deleteMany({ where: { userId } });

      return createdOrder;
    });

    return order;
  }
}
