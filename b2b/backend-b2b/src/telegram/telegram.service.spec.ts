import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService, TelegramUpdate } from './telegram.service';

describe('TelegramService', () => {
  let service: TelegramService;
  let prisma: any;
  let audit: any;

  beforeEach(async () => {
    prisma = {
      telegramLinkToken: {
        create: jest.fn().mockResolvedValue({ id: 'mock-id' }),
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'user-id', phone: '+998901234567' }),
        update: jest.fn().mockResolvedValue({ id: 'user-id', phone: '+998901234567' }),
      },
    };

    audit = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def?: any) => {
              if (key === 'TELEGRAM_BOT_TOKEN') return '';
              if (key === 'TELEGRAM_BOT_USERNAME') return 'biznesgo_bot';
              return def;
            }),
          },
        },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<TelegramService>(TelegramService);
  });

  it('should generate deep link with random 16-byte hex token', async () => {
    const res = await service.createLinkToken('user-id', '+998901234567');
    expect(res.token).toHaveLength(32);
    expect(res.linkUrl).toBe(`https://t.me/biznesgo_bot?start=${res.token}`);
    expect(prisma.telegramLinkToken.create).toHaveBeenCalled();
  });

  it('should STRICTLY reject contact if contact.user_id !== from.id (Anti-Spoofing)', async () => {
    const update: TelegramUpdate = {
      update_id: 1,
      message: {
        message_id: 10,
        from: { id: 111, is_bot: false, first_name: 'Attacker' },
        chat: { id: 111, type: 'private' },
        date: Date.now(),
        contact: {
          user_id: 222, // Mismatched user_id!
          phone_number: '+998909999999',
          first_name: 'Victim',
        },
      },
    };

    const result = await service.handleWebhookUpdate(update);
    expect(result.handled).toBe(true);
    expect(result.reason).toBe('Contact spoof attempt blocked');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'TELEGRAM_CONTACT_SPOOF_ATTEMPT',
      }),
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should accept contact and bind telegram_id if contact.user_id === from.id', async () => {
    const update: TelegramUpdate = {
      update_id: 2,
      message: {
        message_id: 11,
        from: { id: 777, is_bot: false, first_name: 'Merchant' },
        chat: { id: 777, type: 'private' },
        date: Date.now(),
        contact: {
          user_id: 777, // Matching user_id!
          phone_number: '901234567',
          first_name: 'Merchant',
        },
      },
    };

    const result = await service.handleWebhookUpdate(update);
    expect(result.handled).toBe(true);
    expect(result.reason).toBe('Account successfully linked');
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          phone: '+998901234567',
          telegram_id: 777n,
        }),
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'TELEGRAM_ACCOUNT_LINKED',
      }),
    );
  });
});

