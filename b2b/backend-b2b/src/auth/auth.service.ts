import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import { AuditService } from '../audit/audit.service';
import { normalizeE164 } from '../common/utils/phone';
import { OtpService } from '../otp/otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import {
  AdminSetup2FaDto,
  AdminVerify2FaDto,
  SuperAdminLoginDto,
} from './dto/auth.dto';

export interface UserSummary {
  id: string;
  phone: string;
  email?: string | null;
  role: string;
  first_name: string;
  last_name?: string | null;
  is_totp_enabled: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: UserSummary;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly telegramService: TelegramService,
    private readonly jwtService: JwtService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Request OTP code for merchant mobile-first login
   */
  async requestOtp(rawPhone: string, ipAddress?: string) {
    const phone = normalizeE164(rawPhone);
    return this.otpService.requestOtp(phone, ipAddress);
  }

  /**
   * Creates a one-time Telegram link token to bind user Telegram account
   */
  async createTelegramLinkToken(rawPhone: string, userId?: string) {
    const phone = normalizeE164(rawPhone);
    return this.telegramService.createLinkToken(userId, phone);
  }

  /**
   * Verify OTP and issue JWT session tokens with rotated refresh token
   */
  async verifyOtpAndLogin(
    rawPhone: string,
    code: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    const phone = normalizeE164(rawPhone);

    // Verify through OTP service (rate-limits, lock, single-use check)
    await this.otpService.verifyOtp(phone, code, ipAddress);

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone,
          first_name: 'Foydalanuvchi',
          role: 'seller',
          country_id: 'UZ',
        },
      });
    }

    if (!user.is_active) {
      throw new ForbiddenException('Ushbu hisob faolsizlantirilgan');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.phone,
      user.role,
      ipAddress,
      userAgent,
    );

    await this.audit.log({
      action: 'AUTH_LOGIN_SUCCESS',
      entityName: 'user',
      entityId: user.id,
      userId: user.id,
      details: { phone, role: user.role, ip: ipAddress },
      ipAddress,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        is_totp_enabled: user.is_totp_enabled,
      },
    };
  }

  /**
   * Rotate refresh token and issue new token pair
   */
  async refreshTokens(
    rawRefreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token kiritilmadi');
    }

    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token_hash: tokenHash },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token yaroqsiz yoki mavjud emas');
    }

    // Refresh Token Reuse Detection
    if (tokenRecord.revoked) {
      // Possible token compromise! Revoke all tokens for this user.
      await this.prisma.refreshToken.updateMany({
        where: { user_id: tokenRecord.user_id },
        data: { revoked: true },
      });

      await this.audit.log({
        action: 'REFRESH_TOKEN_REUSE_DETECTED',
        entityName: 'refresh_token',
        userId: tokenRecord.user_id,
        details: { ip: ipAddress, userAgent },
        ipAddress,
      });

      throw new UnauthorizedException(
        'Xavfsizlik ogohlantirishi: Token qayta ishlatildi. Xavfsizlik yuzasidan barcha sessiyalar bekor qilindi.',
      );
    }

    // Check expiration
    if (tokenRecord.expires_at < new Date()) {
      throw new UnauthorizedException('Refresh token muddati tugagan');
    }

    // Mark current token as revoked (single-use rotation)
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked: true },
    });

    // Issue new pair
    const tokens = await this.generateTokens(
      tokenRecord.user.id,
      tokenRecord.user.phone,
      tokenRecord.user.role,
      ipAddress,
      userAgent,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Revoke refresh token upon logout
   */
  async logout(rawRefreshToken: string, ipAddress?: string): Promise<{ success: boolean; message: string }> {
    if (rawRefreshToken) {
      const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token_hash: tokenHash },
      });

      if (tokenRecord) {
        await this.prisma.refreshToken.update({
          where: { id: tokenRecord.id },
          data: { revoked: true },
        });

        await this.audit.log({
          action: 'AUTH_LOGOUT',
          entityName: 'refresh_token',
          userId: tokenRecord.user_id,
          details: { ip: ipAddress },
          ipAddress,
        });
      }
    }

    return { success: true, message: 'Tizimdan muvaffaqiyatli chiqildi.' };
  }

  /**
   * Super Admin Login (Step 1: Password authentication)
   */
  async adminLogin(dto: SuperAdminLoginDto, ipAddress?: string) {
    const rawIdentifier = dto.identifier.trim();

    let phone: string | undefined;
    try {
      phone = normalizeE164(rawIdentifier);
    } catch {
      phone = undefined;
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(phone ? [{ phone }] : []),
          { email: rawIdentifier.toLowerCase() },
        ],
      },
    });

    if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
      await this.audit.log({
        action: 'SUPER_ADMIN_LOGIN_DENIED',
        entityName: 'user',
        details: { identifier: rawIdentifier, reason: 'Invalid credentials or role', ip: ipAddress },
        ipAddress,
      });
      throw new UnauthorizedException('Kirish ma‘lumotlari noto‘g‘ri');
    }

    if (!user.password_hash) {
      throw new UnauthorizedException('Hisobda parol sozlanmagan');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      await this.audit.log({
        action: 'SUPER_ADMIN_PASSWORD_FAILED',
        entityName: 'user',
        entityId: user.id,
        userId: user.id,
        details: { ip: ipAddress },
        ipAddress,
      });
      throw new UnauthorizedException('Kirish ma‘lumotlari noto‘g‘ri');
    }

    // Check if 2FA TOTP is already enabled
    if (!user.is_totp_enabled || !user.totp_secret) {
      // First-time 2FA Setup Required
      const secret = authenticator.generateSecret();
      const otpauthUrl = authenticator.keyuri(
        user.email || user.phone,
        'BiznesGO Super Admin',
        secret,
      );

      // Save secret (not yet confirmed)
      await this.prisma.user.update({
        where: { id: user.id },
        data: { totp_secret: secret, is_totp_enabled: false },
      });

      // Generate 8 single-use recovery codes
      const recoveryCodes = this.generateRecoveryCodes(8);

      // Invalidate old recovery codes for this user
      await this.prisma.adminRecoveryCode.deleteMany({
        where: { user_id: user.id },
      });

      // Save hashed recovery codes
      for (const code of recoveryCodes) {
        const codeHash = this.hashRecoveryCode(code);
        await this.prisma.adminRecoveryCode.create({
          data: {
            user_id: user.id,
            code_hash: codeHash,
            is_used: false,
          },
        });
      }

      // Temporary token for setup verification (10 minutes)
      const tempToken = await this.jwtService.signAsync(
        { sub: user.id, stage: '2fa_setup' },
        {
          secret: this.config.get<string>('JWT_ACCESS_SECRET', 'access_secret'),
          expiresIn: '10m',
        },
      );

      return {
        require2faSetup: true,
        tempToken,
        secret,
        otpauthUrl,
        recoveryCodes,
        message:
          'Google Authenticator orqali QR kodni skanerlang, bir martalik tiklash kodlarini saqlab oling va 6 xonali kod bilan tasdiqlang.',
      };
    }

    // 2FA is already enabled: Return temporary token requiring 2FA code
    const tempToken = await this.jwtService.signAsync(
      { sub: user.id, stage: '2fa_verify' },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET', 'access_secret'),
        expiresIn: '10m',
      },
    );

    return {
      requireTotp: true,
      tempToken,
      message: 'Google Authenticator 6 xonali kodini yoki bir martalik recovery kodni kiriting.',
    };
  }

  /**
   * Super Admin Confirm 2FA Setup (Step 2)
   */
  async adminSetup2Fa(
    dto: AdminSetup2FaDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    const payload = await this.verifyTempToken(dto.tempToken, '2fa_setup');
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.totp_secret) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi yoki 2FA sozlanmagan');
    }

    const isTotpValid = authenticator.verify({
      token: dto.totpCode.trim(),
      secret: user.totp_secret,
    });

    if (!isTotpValid) {
      await this.audit.log({
        action: 'SUPER_ADMIN_2FA_SETUP_FAILED',
        entityName: 'user',
        entityId: user.id,
        userId: user.id,
        details: { ip: ipAddress },
        ipAddress,
      });
      throw new BadRequestException('Kiritilgan 2FA (TOTP) kodi noto‘g‘ri');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { is_totp_enabled: true },
    });

    await this.audit.log({
      action: 'SUPER_ADMIN_2FA_SETUP_SUCCESS',
      entityName: 'user',
      entityId: user.id,
      userId: user.id,
      details: { ip: ipAddress },
      ipAddress,
    });

    const tokens = await this.generateTokens(
      user.id,
      user.phone,
      user.role,
      ipAddress,
      userAgent,
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        is_totp_enabled: true,
      },
    };
  }

  /**
   * Super Admin Verify 2FA (Step 2: TOTP or Single-use Recovery Code)
   */
  async adminVerify2Fa(
    dto: AdminVerify2FaDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    const payload = await this.verifyTempToken(dto.tempToken, '2fa_verify');
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.totp_secret) {
      throw new UnauthorizedException('2FA ma‘lumotlari topilmadi');
    }

    const cleanCode = dto.code.trim();
    let verified = false;

    // 1. Try TOTP code (if 6 digits)
    if (/^\d{6}$/.test(cleanCode)) {
      verified = authenticator.verify({
        token: cleanCode,
        secret: user.totp_secret,
      });
    }

    // 2. If TOTP failed or not 6 digits, check single-use recovery code
    if (!verified) {
      const recoveryHash = this.hashRecoveryCode(cleanCode);
      const recoveryRecord = await this.prisma.adminRecoveryCode.findFirst({
        where: {
          user_id: user.id,
          code_hash: recoveryHash,
          is_used: false,
        },
      });

      if (recoveryRecord) {
        verified = true;
        await this.prisma.adminRecoveryCode.update({
          where: { id: recoveryRecord.id },
          data: {
            is_used: true,
            used_at: new Date(),
          },
        });

        await this.audit.log({
          action: 'SUPER_ADMIN_RECOVERY_CODE_USED',
          entityName: 'admin_recovery_code',
          entityId: recoveryRecord.id,
          userId: user.id,
          details: { ip: ipAddress },
          ipAddress,
        });
      }
    }

    if (!verified) {
      await this.audit.log({
        action: 'SUPER_ADMIN_2FA_FAILED',
        entityName: 'user',
        entityId: user.id,
        userId: user.id,
        details: { ip: ipAddress },
        ipAddress,
      });
      throw new UnauthorizedException('2FA (TOTP) yoki recovery kod noto‘g‘ri');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.phone,
      user.role,
      ipAddress,
      userAgent,
    );

    await this.audit.log({
      action: 'SUPER_ADMIN_LOGIN_SUCCESS',
      entityName: 'user',
      entityId: user.id,
      userId: user.id,
      details: { role: user.role, ip: ipAddress },
      ipAddress,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        is_totp_enabled: true,
      },
    };
  }

  private async verifyTempToken(token: string, expectedStage: string): Promise<{ sub: string }> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET', 'access_secret'),
      });
      if (payload.stage !== expectedStage) {
        throw new UnauthorizedException('Noto‘g‘ri token bosqichi');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Vaqtinchalik token yaroqsiz yoki muddati tugagan');
    }
  }

  private generateRecoveryCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const p1 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const p2 = crypto.randomBytes(2).toString('hex').toUpperCase();
      codes.push(`${p1}-${p2}`);
    }
    return codes;
  }

  private hashRecoveryCode(code: string): string {
    const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  private async generateTokens(
    userId: string,
    phone: string,
    role: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const payload = { sub: userId, phone, role };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET', 'access_secret'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await this.prisma.refreshToken.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
        revoked: false,
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }
}
