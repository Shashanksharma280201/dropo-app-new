import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

const TAX_RATE = 0.05;
const DELIVERY_FEE = 0;

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            categoryId: true,
            imageUrl: true,
          },
        },
        variant: true,
        addons: {
          include: {
            addonOption: {
              include: {
                group: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const items = cartItems.map((item) => {
      const addonTotal = item.addons.reduce((acc, addon) => acc + Number(addon.addonOption.priceDelta), 0);
      const unitPrice = Number(item.variant.price) + addonTotal;
      const lineTotal = unitPrice * item.quantity;

      return {
        id: item.id,
        quantity: item.quantity,
        notes: item.notes,
        product: item.product,
        variant: {
          id: item.variant.id,
          name: item.variant.name,
          price: Number(item.variant.price),
        },
        addons: item.addons.map((addon) => ({
          id: addon.addonOption.id,
          name: addon.addonOption.name,
          priceDelta: Number(addon.addonOption.priceDelta),
          group: {
            id: addon.addonOption.group.id,
            name: addon.addonOption.group.name,
            selectionType: addon.addonOption.group.selectionType,
          },
        })),
        unitPrice,
        lineTotal,
      };
    });

    const subtotal = items.reduce((acc, item) => acc + item.lineTotal, 0);
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const deliveryFee = DELIVERY_FEE;
    const discount = 0;
    const total = subtotal + tax + deliveryFee - discount;

    return {
      items,
      summary: {
        subtotal,
        tax,
        deliveryFee,
        discount,
        total,
      },
    };
  }

  async addOrUpdateItem(userId: string, dto: AddCartItemDto) {
    const product = await this.prisma.product.findUnique({
      where: { slug: dto.productSlug },
      include: {
        variants: true,
        addonGroups: {
          include: { options: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const variant = product.variants.find((v) => v.id === dto.variantId);
    if (!variant) {
      throw new BadRequestException('Selected variant is invalid');
    }

    const quantity = dto.quantity ?? 1;
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    const validAddonIds = new Set(
      product.addonGroups.flatMap((group) => group.options.map((option) => option.id)),
    );

    const addonOptionIds = dto.addonOptionIds ?? [];
    addonOptionIds.forEach((id) => {
      if (!validAddonIds.has(id)) {
        throw new BadRequestException('Invalid addon selected');
      }
    });

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.cartItem.findFirst({
        where: {
          userId,
          productId: product.id,
          variantId: variant.id,
        },
      });

      const item = existing
        ? await tx.cartItem.update({
            where: { id: existing.id },
            data: {
              quantity,
              notes: dto.notes,
            },
          })
        : await tx.cartItem.create({
            data: {
              userId,
              productId: product.id,
              variantId: variant.id,
              quantity,
              notes: dto.notes,
            },
          });

      await tx.cartItemAddon.deleteMany({ where: { cartItemId: item.id } });

      if (addonOptionIds.length) {
        await tx.cartItemAddon.createMany({
          data: addonOptionIds.map((addonOptionId) => ({
            cartItemId: item.id,
            addonOptionId,
          })),
        });
      }
    });

    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const existing = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        product: {
          include: {
            addonGroups: {
              include: { options: true },
            },
          },
        },
      },
    });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Cart item not found');
    }

    if (dto.quantity !== undefined && dto.quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.cartItem.update({
        where: { id: itemId },
        data: {
          quantity: dto.quantity ?? existing.quantity,
          notes: dto.notes ?? existing.notes,
        },
      });

      if (dto.addonOptionIds) {
        const validAddonIds = new Set(
          existing.product.addonGroups.flatMap((group) => group.options.map((option) => option.id)),
        );

        dto.addonOptionIds.forEach((id) => {
          if (!validAddonIds.has(id)) {
            throw new BadRequestException('Invalid addon selected');
          }
        });

        await tx.cartItemAddon.deleteMany({ where: { cartItemId: itemId } });
        await tx.cartItemAddon.createMany({
          data: dto.addonOptionIds.map((addonOptionId) => ({ cartItemId: itemId, addonOptionId })),
        });
      }
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const existing = await this.prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItemAddon.deleteMany({ where: { cartItemId: itemId } });
    await this.prisma.cartItem.delete({ where: { id: itemId } });

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const items = await this.prisma.cartItem.findMany({ where: { userId }, select: { id: true } });
    const itemIds = items.map((item) => item.id);

    if (itemIds.length) {
      await this.prisma.$transaction([
        this.prisma.cartItemAddon.deleteMany({ where: { cartItemId: { in: itemIds } } }),
        this.prisma.cartItem.deleteMany({ where: { userId } }),
      ]);
    } else {
      await this.prisma.cartItem.deleteMany({ where: { userId } });
    }

    return this.getCart(userId);
  }
}
