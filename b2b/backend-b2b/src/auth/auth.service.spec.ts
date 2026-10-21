import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import { AuditService } from '../audit/audit.service';
import { OtpService } from '../otp/otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService (Super Admin 2FA)', () => {
  let service: AuthService;
  let prisma: any;
  let jwt: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    jwt = {
      signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: OtpService, useValue: {} },
        { provide: JwtService, useValue: jwt },
        { provide: AuditService, useValue: { log: jest.fn() } },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def?: any) => def),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should reject super admin login if user is not super_admin', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'seller-id',
      phone: '+998901234567',
      role: 'seller', // Not super_admin
    });

    await expect(
      service.superAdminLogin({ phone: '+998901234567', password: 'Password123' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should require 2FA TOTP code for super admin', async () => {
    const passwordHash = await bcrypt.hash('Secret123', 10);
    const secret = authenticator.generateSecret();

    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'admin-id',
      phone: '+998901234567',
      role: 'super_admin',
      password_hash: passwordHash,
      totp_secret: secret,
      is_totp_enabled: true,
    });

    const result = await service.superAdminLogin({
      phone: '+998901234567',
      password: 'Secret123',
    });

    expect(result.requireTotpCode).toBe(true);
  });

  it('should verify valid TOTP code and issue tokens', async () => {
    const passwordHash = await bcrypt.hash('Secret123', 10);
    const secret = authenticator.generateSecret();
    const validTotp = authenticator.generate(secret);

    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'admin-id',
      phone: '+998901234567',
      role: 'super_admin',
      first_name: 'Super',
      last_name: 'Admin',
      password_hash: passwordHash,
      totp_secret: secret,
      is_totp_enabled: true,
      is_active: true,
    });

    const result: any = await service.superAdminLogin({
      phone: '+998901234567',
      password: 'Secret123',
      totp_code: validTotp,
    });

    expect(result.accessToken).toBe('mock-jwt-token');
    expect(result.user.role).toBe('super_admin');
  });
});
