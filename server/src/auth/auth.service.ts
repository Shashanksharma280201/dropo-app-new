import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AuthResponse, AuthTokens } from './auth.types';
import { OtpService } from './otp.service';

const DEFAULT_ACCESS_TTL_SECONDS = 900; // 15 minutes
const DEFAULT_REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessTtlSeconds: number;
  private readonly refreshTtlSeconds: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {
    this.accessTtlSeconds = this.parseTtl(
      this.configService.get<string>('JWT_ACCESS_TTL'),
      DEFAULT_ACCESS_TTL_SECONDS,
    );
    this.refreshTtlSeconds = this.parseTtl(
      this.configService.get<string>('JWT_REFRESH_TTL'),
      DEFAULT_REFRESH_TTL_SECONDS,
    );
  }

  requestOtp({ phoneNumber }: RequestOtpDto) {
    return this.otpService.requestOtp(phoneNumber);
  }

  async verifyOtp(
    { phoneNumber, requestId, code, name }: VerifyOtpDto,
    context?: { userAgent?: string },
  ): Promise<AuthResponse> {
    await this.otpService.verifyOtp({ phoneNumber, code, requestId });

    const user = await this.usersService.upsertUserByPhone({ phoneNumber, name });

    const tokens = await this.generateTokens(user.id, user.phoneNumber, context?.userAgent);

    return {
      user: {
        id: user.id,
        name: user.name ?? null,
        phoneNumber: user.phoneNumber,
      },
      tokens,
      onboardingComplete: Boolean(user.name),
    };
  }

  private async generateTokens(
    userId: string,
    phoneNumber: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    const payload = { sub: userId, phoneNumber };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: `${this.accessTtlSeconds}s`,
      secret: this.getAccessSecret(),
    });

    const sessionToken = randomUUID();
    const refreshTokenRaw = randomUUID();
    const refreshTokenHash = await bcrypt.hash(refreshTokenRaw, 10);
    const refreshExpiresAt = new Date(Date.now() + this.refreshTtlSeconds * 1000);

    await this.prisma.session.create({
      data: {
        userId,
        sessionToken,
        refreshTokenHash,
        userAgent,
        expiresAt: refreshExpiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: `${sessionToken}.${refreshTokenRaw}`,
      expiresIn: this.accessTtlSeconds,
      refreshExpiresIn: this.refreshTtlSeconds,
    };
  }

  async refreshTokens(refreshToken: string, userAgent?: string): Promise<AuthTokens> {
    const [sessionToken, tokenValue] = refreshToken.split('.');

    if (!sessionToken || !tokenValue) {
      throw new BadRequestException('Malformed refresh token.');
    }

    const session = await this.prisma.session.findUnique({ where: { sessionToken } });

    if (!session) {
      throw new UnauthorizedException('Session not found.');
    }

    if (session.expiresAt.getTime() < Date.now()) {
      await this.prisma.session.delete({ where: { sessionToken } }).catch(() => undefined);
      throw new UnauthorizedException('Session expired.');
    }

    const valid = await bcrypt.compare(tokenValue, session.refreshTokenHash);

    if (!valid) {
      await this.prisma.session.delete({ where: { sessionToken } }).catch(() => undefined);
      throw new UnauthorizedException('Invalid refresh token.');
    }

    // Rotate refresh token
    const newRefreshRaw = randomUUID();
    const newRefreshHash = await bcrypt.hash(newRefreshRaw, 10);
    const newExpiry = new Date(Date.now() + this.refreshTtlSeconds * 1000);

    await this.prisma.session.update({
      where: { sessionToken },
      data: {
        refreshTokenHash: newRefreshHash,
        expiresAt: newExpiry,
        userAgent,
      },
    });

    const user = await this.usersService.findById(session.userId);
    const phoneNumber = user?.phoneNumber ?? '';

    const accessToken = await this.jwtService.signAsync(
      { sub: session.userId, phoneNumber },
      {
        expiresIn: `${this.accessTtlSeconds}s`,
        secret: this.getAccessSecret(),
      },
    );

    return {
      accessToken,
      refreshToken: `${sessionToken}.${newRefreshRaw}`,
      expiresIn: this.accessTtlSeconds,
      refreshExpiresIn: this.refreshTtlSeconds,
    };
  }

  async revokeSession(refreshToken: string) {
    const [sessionToken] = refreshToken.split('.');
    if (!sessionToken) {
      throw new BadRequestException('Malformed refresh token.');
    }

    await this.prisma.session.deleteMany({ where: { sessionToken } });
  }

  async revokeAllSessionsForUser(userId: string) {
    await this.prisma.session.deleteMany({ where: { userId } });
  }

  private parseTtl(value: string | undefined | null, fallback: number): number {
    if (!value) {
      return fallback;
    }

    const trimmed = value.trim();
    const unit = trimmed.slice(-1);
    const maybeNumber = Number(trimmed);

    if (!Number.isNaN(maybeNumber)) {
      return maybeNumber;
    }

    const amount = Number(trimmed.slice(0, -1));
    if (Number.isNaN(amount)) {
      this.logger.warn(`Unable to parse TTL value '${value}', using fallback ${fallback}`);
      return fallback;
    }

    switch (unit) {
      case 's':
        return amount;
      case 'm':
        return amount * 60;
      case 'h':
        return amount * 60 * 60;
      case 'd':
        return amount * 60 * 60 * 24;
      default:
        this.logger.warn(`Unknown TTL unit '${unit}', defaulting to fallback`);
        return fallback;
    }
  }

  private getAccessSecret() {
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new BadRequestException('JWT_ACCESS_SECRET is not configured');
    }
    return secret;
  }
}
