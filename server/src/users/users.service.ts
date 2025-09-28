import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByPhoneNumber(phoneNumber: string) {
    return this.prisma.user.findUnique({ where: { phoneNumber } });
  }

  async upsertUserByPhone({
    phoneNumber,
    name,
  }: {
    phoneNumber: string;
    name?: string;
  }): Promise<User> {
    return this.prisma.user.upsert({
      where: { phoneNumber },
      update: {
        name,
      },
      create: {
        phoneNumber,
        name,
      },
    });
  }

  async updateProfile(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  listAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAddress(
    userId: string,
    data: Omit<Prisma.AddressUncheckedCreateInput, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  ) {
    const address = await this.prisma.address.create({
      data: {
        ...data,
        userId,
      },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.defaultAddressId) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { defaultAddressId: address.id },
      });
    }

    return address;
  }

  async updateAddress(
    userId: string,
    addressId: string,
    data: Omit<Prisma.AddressUncheckedUpdateInput, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  ) {
    const existing = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Address not found');
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data,
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const existing = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.address.delete({ where: { id: addressId } });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.defaultAddressId === addressId) {
      const latest = await this.prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      await this.prisma.user.update({
        where: { id: userId },
        data: { defaultAddressId: latest?.id ?? null },
      });
    }

    return true;
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const existing = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { defaultAddressId: addressId },
    });

    return true;
  }
}
