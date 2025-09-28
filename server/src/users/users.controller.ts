import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: any) {
    const profile = await this.usersService.findById(user.userId);
    const addresses = await this.usersService.listAddresses(user.userId);

    return {
      id: profile?.id,
      name: profile?.name,
      phoneNumber: profile?.phoneNumber,
      defaultAddressId: profile?.defaultAddressId,
      addresses,
    };
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.userId, dto);
  }

  @Get('me/addresses')
  listAddresses(@CurrentUser() user: any) {
    return this.usersService.listAddresses(user.userId);
  }

  @Post('me/addresses')
  createAddress(@CurrentUser() user: any, @Body() dto: CreateAddressDto) {
    return this.usersService.createAddress(user.userId, dto);
  }

  @Patch('me/addresses/:id')
  updateAddress(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateAddressDto) {
    return this.usersService.updateAddress(user.userId, id, dto);
  }

  @Delete('me/addresses/:id')
  deleteAddress(@CurrentUser() user: any, @Param('id') id: string) {
    return this.usersService.deleteAddress(user.userId, id);
  }

  @Patch('me/addresses/:id/default')
  setDefault(@CurrentUser() user: any, @Param('id') id: string) {
    return this.usersService.setDefaultAddress(user.userId, id);
  }
}
