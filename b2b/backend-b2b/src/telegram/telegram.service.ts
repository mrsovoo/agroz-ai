import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { AuditService } from '../audit/audit.service';
import { normalizeE164 } from '../common/utils/phone';
import { PrismaService } from '../prisma/prisma.service';

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
    contact?: {
      phone_number: string;
      first_name: string;
      last_name?: string;
      user_id?: number;
      vcard?: string;
    };
  };
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly botUsername: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {
    this.botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN', '');
    this.botUsername = this.config.get<string>('TELEGRAM_BOT_USERNAME', 'biznesgo_bot');
  }

  /**
   * Generates a 15-minute one-time link token and returns the t.me/bot?start=TOKEN deep link
   */
  async createLinkToken(
    userId?: string,
    rawPhone?: string,
  ): Promise<{ token: string; linkUrl: string; expiresAt: Date }> {
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const phone = rawPhone ? normalizeE164(rawPhone) : undefined;

    await this.prisma.telegramLinkToken.create({
      data: {
        token,
        user_id: userId,
        phone,
        is_used: false,
        expires_at: expiresAt,
      },
    });

    const linkUrl = `https://t.me/${this.botUsername}?start=${token}`;
    return { token, linkUrl, expiresAt };
  }

  /**
   * Sends a message with Telegram Bot API
   */
  async sendMessage(chatId: number | string, text: string, replyMarkup?: unknown): Promise<boolean> {
    if (!this.botToken) {
      this.logger.warn(`TELEGRAM_BOT_TOKEN missing, mock send to ${chatId}: ${text}`);
      return true;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          reply_markup: replyMarkup,
        }),
      });
      const data = (await response.json()) as { ok: boolean };
      return data.ok;
    } catch (error) {
      this.logger.error(`Error sending telegram message to ${chatId}`, error);
      return false;
    }
  }

  /**
   * Handles incoming webhook updates from Telegram
   */
  async handleWebhookUpdate(update: TelegramUpdate): Promise<{ handled: boolean; reason?: string }> {
    const msg = update.message;
    if (!msg || !msg.from) {
      return { handled: false, reason: 'No message payload' };
    }

    const chatId = msg.chat.id;
    const fromId = msg.from.id;
    const text = (msg.text || '').trim();

    // 1. Handle /start <token> command
    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      const token = parts[1]?.trim();

      if (!token) {
        await this.sendMessage(
          chatId,
          `👋 <b>BiznesGO botiga xush kelibsiz!</b>\n\nPlatformaga kirish uchun veb-sayt orqali ro‘yxatdan o‘ting va havola orqali kiring.`,
        );
        return { handled: true };
      }

      // Verify token
      const linkRecord = await this.prisma.telegramLinkToken.findUnique({
        where: { token },
      });

      if (!linkRecord || linkRecord.is_used || linkRecord.expires_at < new Date()) {
        await this.sendMessage(
          chatId,
          `⚠️ <b>Ulanish havolasi eskirgan yoki foydalanilgan.</b>\n\nIltimos, saytdan yangi havola oling.`,
        );
        return { handled: true, reason: 'Token invalid or expired' };
      }

      // Prompt user with Contact Request Keyboard
      const keyboard = {
        keyboard: [
          [
            {
              text: '📱 Telefon raqamimni yuborish',
              request_contact: true,
            },
          ],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      };

      await this.sendMessage(
        chatId,
        `👋 Assalomu alaykum, <b>${msg.from.first_name}</b>!\n\n` +
          `BiznesGO profilingizni Telegram bilan bog‘lash uchun pastdagi <b>"Telefon raqamimni yuborish"</b> tugmasini bosing.`,
        keyboard,
      );

      return { handled: true, reason: 'Requested contact' };
    }

    // 2. Handle Contact sharing
    if (msg.contact) {
      const contact = msg.contact;

      // ⚠️ STRICT SECURITY CHECK: Contact MUST belong to the sender!
      // Forwarded contacts or contacts with different user_id are strictly rejected.
      if (contact.user_id !== fromId) {
        this.logger.warn(
          `Security violation: User ${fromId} attempted to submit contact with user_id ${contact.user_id}`,
        );

        await this.sendMessage(
          chatId,
          `❌ <b>Xavfsizlik xatosi:</b> Faqat o‘zingizning profilingizga tegishli telefon raqamni yuborishingiz mumkin!`,
          { remove_keyboard: true },
        );

        await this.audit.log({
          action: 'TELEGRAM_CONTACT_SPOOF_ATTEMPT',
          entityName: 'telegram_binding',
          details: { fromId, contactUserId: contact.user_id, phone: contact.phone_number },
        });

        return { handled: true, reason: 'Contact spoof attempt blocked' };
      }

      // Normalize phone to E.164
      let phone: string;
      try {
        phone = normalizeE164(contact.phone_number);
      } catch (e: any) {
        await this.sendMessage(chatId, `❌ Noto‘g‘ri telefon raqam formati.`);
        return { handled: true, reason: e.message };
      }

      // Find user or create seller user
      let user = await this.prisma.user.findUnique({
        where: { phone },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            phone,
            first_name: contact.first_name || msg.from.first_name,
            last_name: contact.last_name || msg.from.last_name,
            telegram_id: BigInt(fromId),
            role: 'seller',
            country_id: 'UZ',
          },
        });
      } else {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            telegram_id: BigInt(fromId),
          },
        });
      }

      // Invalidate active link tokens for this phone/user
      await this.prisma.telegramLinkToken.updateMany({
        where: {
          OR: [{ phone }, { user_id: user.id }],
          is_used: false,
        },
        data: { is_used: true },
      });

      await this.audit.log({
        action: 'TELEGRAM_ACCOUNT_LINKED',
        entityName: 'user',
        entityId: user.id,
        userId: user.id,
        details: { phone, telegram_id: fromId, username: msg.from.username },
      });

      await this.sendMessage(
        chatId,
        `✅ <b>Muvaffaqiyatli bog‘landi!</b>\n\n` +
          `Sizning raqamingiz (<b>${phone}</b>) BiznesGO tizimiga ulandi.\n` +
          `Endi saytga kirishda tasdiqlash kodlari to‘g‘ridan-to‘g‘ri shu yerga yuboriladi.`,
        { remove_keyboard: true },
      );

      return { handled: true, reason: 'Account successfully linked' };
    }

    return { handled: false, reason: 'Unhandled message type' };
  }
}
