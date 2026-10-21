import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import { AuditService } from '../audit/audit.service';
import { OtpService } from '../otp/otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { AuthService } from './auth.service';

describe('AuthService (v0.0.1 Auth Architecture)', () => {
  let service: AuthService;
  let prisma: any;
  let jwt: any;
  let audit: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      refreshToken: {
        create: jest.fn().mockResolvedValue({ id: 'refresh-id' }),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      adminRecoveryCode: {
        create: jest.fn(),
        deleteMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    jwt = {
      signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
      verifyAsync: jest.fn(),
    };

    audit = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: OtpService, useValue: { verifyOtp: jest.fn() } },
        { provide: TelegramService, useValue: { createLinkToken: jest.fn() } },
        { provide: JwtService, useValue: jwt },
        { provide: AuditService, useValue: audit },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def?: any) => {
              if (key === 'JWT_ACCESS_SECRET') return 'test_access_secret';
              if (key === 'JWT_REFRESH_SECRET') return 'test_refresh_secret';
              return def;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('Super Admin Authentication & Mandatory 2FA', () => {
    it('should reject login if user is not super_admin or admin', async () => {
      prisma.user.findFirst.mockResolvedValueOnce({
        id: 'seller-id',
        phone: '+998901234567',
        role: 'seller',
      });

      await expect(
        service.adminLogin({ identifier: '+998901234567', password: 'Password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should require 2FA setup and return recovery codes for first-time admin', async () => {
      const passwordHash = await bcrypt.hash('Secret123', 10);

      prisma.user.findFirst.mockResolvedValueOnce({
        id: 'admin-id',
        phone: '+998901234567',
        email: 'admin@biznesgo.uz',
        role: 'super_admin',
        password_hash: passwordHash,
        totp_secret: null,
        is_totp_enabled: false,
      });

      const result: any = await service.adminLogin({
        identifier: 'admin@biznesgo.uz',
        password: 'Secret123',
      });

      expect(result.require2faSetup).toBe(true);
      expect(result.secret).toBeDefined();
      expect(result.otpauthUrl).toBeDefined();
      expect(result.recoveryCodes).toHaveLength(8);
      expect(prisma.adminRecoveryCode.create).toHaveBeenCalledTimes(8);
    });

    it('should require TOTP code if 2FA is already configured', async () => {
      const passwordHash = await bcrypt.hash('Secret123', 10);
      const secret = authenticator.generateSecret();

      prisma.user.findFirst.mockResolvedValueOnce({
        id: 'admin-id',
        phone: '+998901234567',
        role: 'super_admin',
        password_hash: passwordHash,
        totp_secret: secret,
        is_totp_enabled: true,
      });

      const result: any = await service.adminLogin({
        identifier: '+998901234567',
        password: 'Secret123',
      });

      expect(result.requireTotp).toBe(true);
      expect(result.tempToken).toBe('mock-jwt-token');
    });

    it('should verify 2FA using a valid single-use recovery code and mark it used', async () => {
      const secret = authenticator.generateSecret();
      jwt.verifyAsync.mockResolvedValueOnce({ sub: 'admin-id', stage: '2fa_verify' });

      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'admin-id',
        phone: '+998901234567',
        role: 'super_admin',
        first_name: 'Admin',
        totp_secret: secret,
      });

      const rawRecoveryCode = 'A1B2-C3D4';
      const cleanRecovery = 'A1B2C3D4';
      const expectedHash = crypto.createHash('sha256').update(cleanRecovery).digest('hex');

      prisma.adminRecoveryCode.findFirst.mockResolvedValueOnce({
        id: 'rec-code-1',
        user_id: 'admin-id',
        code_hash: expectedHash,
        is_used: false,
      });

      const result = await service.adminVerify2Fa({
        tempToken: 'valid-temp-token',
        code: rawRecoveryCode,
      });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(prisma.adminRecoveryCode.update).toHaveBeenCalledWith({
        where: { id: 'rec-code-1' },
        data: expect.objectContaining({ is_used: true }),
      });
    });
  });

  describe('Refresh Token Rotation & Security', () => {
    it('should rotate refresh token and revoke the previous token', async () => {
      const rawToken = 'sample_raw_refresh_token_123';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      prisma.refreshToken.findUnique.mockResolvedValueOnce({
        id: 'old-token-id',
        user_id: 'user-1',
        token_hash: tokenHash,
        revoked: false,
        expires_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Valid
        user: { id: 'user-1', phone: '+998901234567', role: 'owner' },
      });

      const result = await service.refreshTokens(rawToken);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).not.toBe(rawToken);

      // Verify old token was revoked
      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'old-token-id' },
        data: { revoked: true },
      });
    });

    it('should detect token re-use and revoke ALL sessions for the user', async () => {
      const reusedToken = 'compromised_refresh_token';
      const tokenHash = crypto.createHash('sha256').update(reusedToken).digest('hex');

      prisma.refreshToken.findUnique.mockResolvedValueOnce({
        id: 'compromised-token-id',
        user_id: 'victim-user-1',
        token_hash: tokenHash,
        revoked: true, // ALREADY REVOKED!
        expires_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        user: { id: 'victim-user-1' },
      });

      await expect(service.refreshTokens(reusedToken)).rejects.toThrow(UnauthorizedException);

      // Verify all sessions were invalidated
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { user_id: 'victim-user-1' },
        data: { revoked: true },
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'REFRESH_TOKEN_REUSE_DETECTED' }),
      );
    });
  });
});
