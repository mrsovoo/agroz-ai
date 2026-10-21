import { BadRequestException, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'crypto';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { SmsOtpChannel } from './channels/sms-otp.channel';
import { TelegramOtpChannel } from './channels/telegram-otp.channel';
import { OtpService } from './otp.service';

describe('OtpService', () => {
  let service: OtpService;
  let prisma: any;
  let audit: any;

  beforeEach(async () => {
    prisma = {
      otpVerification: {
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'mock-otp-id' }),
        update: jest.fn().mockResolvedValue({ id: 'mock-otp-id' }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 'mock-user-id', telegram_id: 123456n, role: 'seller' }),
      },
    };

    audit = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def?: any) => {
              if (key === 'OTP_SALT') return 'test_salt';
              if (key === 'NODE_ENV') return 'test';
              return def;
            }),
          },
        },
        { provide: AuditService, useValue: audit },
        {
          provide: TelegramOtpChannel,
          useValue: {
            name: 'telegram',
            sendOtp: jest.fn().mockResolvedValue({ success: true, messageId: '100' }),
          },
        },
        {
          provide: SmsOtpChannel,
          useValue: {
            name: 'sms',
            sendOtp: jest.fn().mockResolvedValue({ success: true }),
          },
        },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
  });

  it('should request an OTP and store only the hash in DB', async () => {
    const result = await service.requestOtp('+998901234567', '127.0.0.1');
    expect(result.success).toBe(true);
    expect(prisma.otpVerification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          phone: '+998901234567',
          channel: 'telegram',
          code_hash: expect.any(String),
          is_used: false,
        }),
      }),
    );
  });

  it('should enforce 60s cooldown if OTP was recently requested', async () => {
    prisma.otpVerification.findFirst.mockResolvedValueOnce({
      id: 'active-id',
      phone: '+998901234567',
      created_at: new Date(), // Just now
      expires_at: new Date(Date.now() + 5 * 60 * 1000),
      is_used: false,
      locked_until: null,
    });

    await expect(service.requestOtp('+998901234567')).rejects.toThrow(HttpException);
  });

  it('should reject verification if code is invalid and lock after 5 attempts', async () => {
    const salt = 'test_salt';
    const validHash = crypto.createHmac('sha256', salt).update('123456').digest('hex');

    prisma.otpVerification.findFirst.mockResolvedValueOnce({
      id: 'active-id',
      phone: '+998901234567',
      code_hash: validHash,
      attempts: 4, // 5th attempt will fail and lock
      max_attempts: 5,
      is_used: false,
      expires_at: new Date(Date.now() + 5 * 60 * 1000),
      locked_until: null,
    });

    await expect(service.verifyOtp('+998901234567', '999999')).rejects.toThrow(HttpException);

    expect(prisma.otpVerification.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'active-id' },
        data: expect.objectContaining({
          attempts: 5,
          locked_until: expect.any(Date),
        }),
      }),
    );
  });

  it('should verify OTP successfully and mark is_used to true', async () => {
    const salt = 'test_salt';
    const validHash = crypto.createHmac('sha256', salt).update('654321').digest('hex');

    prisma.otpVerification.findFirst.mockResolvedValueOnce({
      id: 'active-id',
      phone: '+998901234567',
      code_hash: validHash,
      attempts: 0,
      max_attempts: 5,
      is_used: false,
      expires_at: new Date(Date.now() + 5 * 60 * 1000),
      locked_until: null,
    });

    const success = await service.verifyOtp('+998901234567', '654321');
    expect(success).toBe(true);
    expect(prisma.otpVerification.update).toHaveBeenCalledWith({
      where: { id: 'active-id' },
      data: { is_used: true },
    });
  });
});
