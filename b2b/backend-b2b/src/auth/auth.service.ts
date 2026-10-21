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
import { authenticator } from 'otplib';
import { AuditService } from '../audit/audit.service';
import { normalizeE164 } from '../common/utils/phone';
import { OtpService } from '../otp/otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { SuperAdminLoginDto } from './dto/auth.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    phone: string;
    role: string;
    first_name: string;
    last_name?: string | null;
    is_totp_enabled: boolean;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
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
   * Verify OTP and issue JWT session tokens
   */
  async verifyOtpAndLogin(rawPhone: string, code: string, ipAddress?: string): Promise<AuthTokens> {
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

    const tokens = await this.generateTokens(user.id, user.phone, user.role);

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
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        is_totp_enabled: user.is_totp_enabled,
      },
    };
  }

  /**
   * Super Admin Login with MANDATORY 2FA TOTP (ADR 0005)
   */
  async superAdminLogin(dto: SuperAdminLoginDto, ipAddress?: string) {
    const phone = normalizeE164(dto.phone);

    const user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user || user.role !== 'super_admin') {
      await this.audit.log({
        action: 'SUPER_ADMIN_LOGIN_DENIED',
        entityName: 'user',
        details: { phone, reason: 'User not found or not super_admin', ip: ipAddress },
        ipAddress,
      });
      throw new UnauthorizedException('Kirish ma‘lumotlari noto‘g‘ri');
    }

    // Verify Password
    if (!user.password_hash) {
      throw new UnauthorizedException('Parol sozlanmagan');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      await this.audit.log({
        action: 'SUPER_ADMIN_PASSWORD_FAILED',
        entityName: 'user',
        entityId: user.id,
        userId: user.id,
        details: { phone, ip: ipAddress },
        ipAddress,
      });
      throw new UnauthorizedException('Kirish ma‘lumotlari noto‘g‘ri');
    }

    // 2FA TOTP Enforced
    if (!user.totp_secret) {
      // First time setup required
      const secret = authenticator.generateSecret();
      const otpauthUrl = authenticator.keyuri(user.phone, 'BiznesGO Super Admin', secret);

      // Save secret temporarily until confirmed
      await this.prisma.user.update({
        where: { id: user.id },
        data: { totp_secret: secret, is_totp_enabled: false },
      });

      return {
        require2faSetup: true,
        secret,
        otpauthUrl,
        message: 'Google Authenticator ilovasi orqali QR kodni skanerlang va 6 xonali kodni kiriting.',
      };
    }

    // Existing 2FA: TOTP code is strictly mandatory
    if (!dto.totp_code) {
      return {
        requireTotpCode: true,
        message: 'Google Authenticator 6 xonali kodini kiriting.',
      };
    }

    const isTotpValid = authenticator.verify({
      token: dto.totp_code,
      secret: user.totp_secret,
    });

    if (!isTotpValid) {
      await this.audit.log({
        action: 'SUPER_ADMIN_TOTP_FAILED',
        entityName: 'user',
        entityId: user.id,
        userId: user.id,
        details: { phone, ip: ipAddress },
        ipAddress,
      });
      throw new UnauthorizedException('2FA (TOTP) kodi noto‘g‘ri');
    }

    // If first confirmation succeeded, mark enabled
    if (!user.is_totp_enabled) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { is_totp_enabled: true },
      });
    }

    const tokens = await this.generateTokens(user.id, user.phone, user.role);

    await this.audit.log({
      action: 'SUPER_ADMIN_LOGIN_SUCCESS',
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
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        is_totp_enabled: true,
      },
    };
  }

  private async generateTokens(userId: string, phone: string, role: string) {
    const payload = { sub: userId, phone, role };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET', 'access_secret'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '1h'),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET', 'refresh_secret'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '30d'),
    });

    return { accessToken, refreshToken };
  }
}
