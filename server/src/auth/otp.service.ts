import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Twilio } from 'twilio';

import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_TTL_SECONDS = 300;

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly ttlSeconds: number;
  private readonly twilioClient?: Twilio;
  private readonly twilioVerifyServiceSid?: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.ttlSeconds = Number(this.configService.get('OTP_TTL_SECONDS') ?? DEFAULT_TTL_SECONDS);
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const verifyServiceSid = this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID');

    if (accountSid && authToken && verifyServiceSid) {
      this.twilioClient = new Twilio(accountSid, authToken);
      this.twilioVerifyServiceSid = verifyServiceSid;
      this.logger.log('Twilio Verify enabled for OTP delivery');
    } else {
      this.logger.warn('Twilio credentials missing. Falling back to development OTP mode.');
    }
  }

  private get isTwilioEnabled() {
    return Boolean(this.twilioClient && this.twilioVerifyServiceSid);
  }

  async requestOtp(phoneNumber: string) {
    if (this.isTwilioEnabled) {
      const verification = await this.twilioClient!
        .verify.v2.services(this.twilioVerifyServiceSid!)
        .verifications.create({ to: phoneNumber, channel: 'sms' });

      await this.persistOtpLog({
        phoneNumber,
        requestId: verification.sid,
        codeHash: 'twilio-managed',
      });

      return {
        requestId: verification.sid,
        expiresIn: this.ttlSeconds,
      };
    }

    const code = this.generateCode();
    const requestId = randomUUID();
    const codeHash = await bcrypt.hash(code, 10);

    await this.persistOtpLog({
      phoneNumber,
      requestId,
      codeHash,
    });

    this.logger.debug(`Dev OTP for ${phoneNumber}: ${code}`);

    return {
      requestId,
      expiresIn: this.ttlSeconds,
      devCode: code,
    };
  }

  async verifyOtp({
    phoneNumber,
    code,
    requestId,
  }: {
    phoneNumber: string;
    code: string;
    requestId?: string;
  }) {
    if (this.isTwilioEnabled) {
      const result = await this.twilioClient!
        .verify.v2.services(this.twilioVerifyServiceSid!)
        .verificationChecks.create({ to: phoneNumber, code });

      if (result.status !== 'approved') {
        throw new BadRequestException('Invalid or expired OTP.');
      }

      if (result.sid) {
        await this.prisma.otpLog.deleteMany({ where: { requestId: result.sid } }).catch(() => undefined);
      }

      return true;
    }

    if (!requestId) {
      throw new BadRequestException('requestId is required in development OTP mode.');
    }

    const otpLog = await this.prisma.otpLog.findUnique({ where: { requestId } });

    if (!otpLog || otpLog.phoneNumber !== phoneNumber) {
      throw new BadRequestException('OTP not found or phone mismatch.');
    }

    if (otpLog.expiresAt.getTime() < Date.now()) {
      await this.prisma.otpLog.delete({ where: { requestId } }).catch(() => undefined);
      throw new BadRequestException('OTP expired. Please request a new code.');
    }

    const valid = await bcrypt.compare(code, otpLog.codeHash);

    if (!valid) {
      throw new BadRequestException('Invalid OTP supplied.');
    }

    await this.prisma.otpLog.delete({ where: { requestId } }).catch(() => undefined);
    return true;
  }

  private async persistOtpLog({
    phoneNumber,
    requestId,
    codeHash,
  }: {
    phoneNumber: string;
    requestId: string;
    codeHash: string;
  }) {
    const expiresAt = new Date(Date.now() + this.ttlSeconds * 1000);
    await this.prisma.otpLog.upsert({
      where: { requestId },
      update: {
        phoneNumber,
        ttl: this.ttlSeconds,
        codeHash,
        expiresAt,
      },
      create: {
        phoneNumber,
        requestId,
        ttl: this.ttlSeconds,
        codeHash,
        expiresAt,
      },
    });
  }

  private generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
