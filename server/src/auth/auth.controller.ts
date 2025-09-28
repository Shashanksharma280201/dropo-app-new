import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-otp')
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request) {
    const userAgent = req.headers['user-agent'];
    return this.authService.verifyOtp(dto, { userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent });
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    const userAgent = req.headers['user-agent'];
    return this.authService.refreshTokens(dto.refreshToken, Array.isArray(userAgent) ? userAgent[0] : userAgent);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Body() dto: LogoutDto, @CurrentUser() user: any) {
    if (dto.refreshToken) {
      await this.authService.revokeSession(dto.refreshToken);
    } else if (user?.userId) {
      await this.authService.revokeAllSessionsForUser(user.userId);
    }

    return { success: true };
  }
}
