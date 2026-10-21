import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { AuditService } from '../audit/audit.service';
import { normalizeE164 } from '../common/utils/phone';
import { PrismaService } from '../prisma/prisma.service';
import { SmsOtpChannel } from './channels/sms-otp.channel';
import { TelegramOtpChannel } from './channels/telegram-otp.channel';
import { OtpChannel } from './interfaces/otp-channel.interface';

export interface RequestOtpResult {
  success: boolean;
  channel: string;
  cooldownSeconds: number;
  message: string;
  debugCode?: string; // Only returned in non-production development mode if telegram is unlinked
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly channels: Map<string, OtpChannel> = new Map();
  private readonly salt: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    telegramChannel: TelegramOtpChannel,
    smsChannel: SmsOtpChannel,
  ) {
    this.salt = this.config.get<string>('OTP_SALT', 'agroz_default_salt_2026');
    this.registerChannel(telegramChannel);
    this.registerChannel(smsChannel);
  }

  registerChannel(channel: OtpChannel): void {
    this.channels.set(channel.name, channel);
  }

  private hashCode(code: string): string {
    return crypto.createHmac('sha256', this.salt).update(code.trim()).digest('hex');
  }

  /**
   * Generates and dispatches a 6-digit OTP code to the phone number
   */
  async requestOtp(rawPhone: string, ipAddress?: string): Promise<RequestOtpResult> {
    const phone = normalizeE164(rawPhone);
    const now = new Date();

    // 1. IP-based rate limiting (Max 5 requests per minute per IP)
    if (ipAddress) {
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
      const ipRecentCount = await this.prisma.otpVerification.count({
        where: {
          ip_address: ipAddress,
          created_at: { gte: oneMinuteAgo },
        },
      });

      if (ipRecentCount >= 5) {
        throw new HttpException(
          'Juda ko‘p so‘rov yuborildi. Iltimos, 1 daqiqadan so‘ng qayta urinib ko‘ring.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // 2. Check existing active OTP for this phone (Account Lock check & 60s Cooldown)
    const activeOtp = await this.prisma.otpVerification.findFirst({
      where: {
        phone,
        is_used: false,
        expires_at: { gte: now },
      },
      orderBy: { created_at: 'desc' },
    });

    if (activeOtp) {
      // Check if locked due to 5 failed attempts
      if (activeOtp.locked_until && activeOtp.locked_until > now) {
        const remainingMinutes = Math.ceil(
          (activeOtp.locked_until.getTime() - now.getTime()) / (60 * 1000),
        );
        throw new HttpException(
          `Xavfsizlik yuzasidan ushbu raqam ${remainingMinutes} daqiqaga vaqtincha bloklandi.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Check 60 seconds resend cooldown
      const elapsedSeconds = Math.floor((now.getTime() - activeOtp.created_at.getTime()) / 1000);
      if (elapsedSeconds < 60) {
        throw new HttpException(
          `Kodni qayta yuborish uchun ${60 - elapsedSeconds} soniya kuting.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // 3. Generate 6-digit code and calculate hash
    const rawCode = String(crypto.randomInt(100000, 1000000));
    const codeHash = this.hashCode(rawCode);
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes validity

    // 4. Save new OTP challenge in database
    await this.prisma.otpVerification.create({
      data: {
        phone,
        code_hash: codeHash,
        channel: 'telegram',
        attempts: 0,
        max_attempts: 5,
        is_used: false,
        expires_at: expiresAt,
        ip_address: ipAddress,
        country_id: 'UZ',
      },
    });

    // 5. Find if user has a linked telegram_id
    const user = await this.prisma.user.findUnique({
      where: { phone },
      select: { id: true, telegram_id: true, role: true },
    });

    // Super admin must NOT use OTP via messaging (ADR 0005)
    if (user?.role === 'super_admin') {
      throw new BadRequestException(
        'Super admin hisobiga OTP orqali kirish taqiqlangan. 2FA (TOTP) orqali kiring.',
      );
    }

    let channelName = 'telegram';
    let sendSuccess = false;
    let sendError: string | undefined;

    const telegramChannel = this.channels.get('telegram');
    if (telegramChannel && user?.telegram_id) {
      const result = await telegramChannel.sendOtp(phone, rawCode, {
        telegram_id: String(user.telegram_id),
      });
      sendSuccess = result.success;
      sendError = result.error;
    } else {
      // User is not yet linked to Telegram
      channelName = 'telegram';
      sendSuccess = false;
      sendError =
        'Telegram profilingiz hali ulanmagan. Iltimos, Telegram orqali akkauntingizni ulang.';
    }

    // 6. Record in Audit Log
    await this.audit.log({
      action: 'AUTH_OTP_REQUESTED',
      entityName: 'otp_verification',
      userId: user?.id,
      details: {
        phone,
        channel: channelName,
        success: sendSuccess,
        error: sendError,
        ip: ipAddress,
      },
      ipAddress,
    });

    // In local dev without bot, provide friendly developer convenience
    const isDev = this.config.get<string>('NODE_ENV') !== 'production';

    return {
      success: sendSuccess || isDev,
      channel: channelName,
      cooldownSeconds: 60,
      message: sendSuccess
        ? 'Tasdiqlash kodi Telegram orqali yuborildi.'
        : isDev
          ? `[DEV REJIM] Telegram ulanmagan. Test kodi: ${rawCode}`
          : sendError || 'Tasdiqlash kodi yuborilmadi.',
      debugCode: isDev && !sendSuccess ? rawCode : undefined,
    };
  }

  /**
   * Verifies the submitted OTP code. Marks challenge as consumed upon success.
   */
  async verifyOtp(rawPhone: string, code: string, ipAddress?: string): Promise<boolean> {
    const phone = normalizeE164(rawPhone);
    const now = new Date();

    if (!code || code.trim().length !== 6) {
      throw new BadRequestException('Tasdiqlash kodi 6 xonali bo‘lishi kerak');
    }

    const challenge = await this.prisma.otpVerification.findFirst({
      where: {
        phone,
        is_used: false,
      },
      orderBy: { created_at: 'desc' },
    });

    if (!challenge) {
      throw new BadRequestException('Faol tasdiqlash kodi topilmadi. Qayta kod so‘rang.');
    }

    // Check lock
    if (challenge.locked_until && challenge.locked_until > now) {
      const remainingMinutes = Math.ceil(
        (challenge.locked_until.getTime() - now.getTime()) / (60 * 1000),
      );
      throw new HttpException(
        `Ushbu raqam vaqtincha bloklangan. ${remainingMinutes} daqiqadan so‘ng urinib ko‘ring.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Check expiration
    if (challenge.expires_at < now) {
      throw new BadRequestException('Tasdiqlash kodining muddati tugagan. Yangi kod so‘rang.');
    }

    const submittedHash = this.hashCode(code);
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(submittedHash, 'hex'),
      Buffer.from(challenge.code_hash, 'hex'),
    );

    if (!isMatch) {
      const newAttempts = challenge.attempts + 1;
      const isNowLocked = newAttempts >= challenge.max_attempts;
      const lockedUntil = isNowLocked ? new Date(now.getTime() + 15 * 60 * 1000) : null;

      await this.prisma.otpVerification.update({
        where: { id: challenge.id },
        data: {
          attempts: newAttempts,
          locked_until: lockedUntil,
        },
      });

      await this.audit.log({
        action: 'AUTH_OTP_FAILED',
        entityName: 'otp_verification',
        entityId: challenge.id,
        details: { phone, attempts: newAttempts, locked: isNowLocked, ip: ipAddress },
        ipAddress,
      });

      if (isNowLocked) {
        throw new HttpException(
          '5 marta noto‘g‘ri kod kiritildi. Xavfsizlik yuzasidan hisob 15 daqiqaga bloklandi.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      const remainingAttempts = challenge.max_attempts - newAttempts;
      throw new BadRequestException(
        `Kiritilgan kod noto‘g‘ri. Qolgan urinishlar: ${remainingAttempts}`,
      );
    }

    // Code is valid: Mark as consumed (Single-use)
    await this.prisma.otpVerification.update({
      where: { id: challenge.id },
      data: { is_used: true },
    });

    await this.audit.log({
      action: 'AUTH_OTP_VERIFIED',
      entityName: 'otp_verification',
      entityId: challenge.id,
      details: { phone, ip: ipAddress },
      ipAddress,
    });

    return true;
  }
}

