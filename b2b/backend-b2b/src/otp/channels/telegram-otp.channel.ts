import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpChannel, OtpSendResult } from '../interfaces/otp-channel.interface';

@Injectable()
export class TelegramOtpChannel implements OtpChannel {
  readonly name = 'telegram';
  private readonly logger = new Logger(TelegramOtpChannel.name);
  private readonly botToken: string;

  constructor(private readonly config: ConfigService) {
    this.botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN', '');
  }

  async sendOtp(
    destination: string,
    code: string,
    metadata?: Record<string, unknown>,
  ): Promise<OtpSendResult> {
    const telegramId = metadata?.telegram_id as string | number | undefined;

    if (!telegramId) {
      this.logger.warn(`Cannot send Telegram OTP to ${destination}: telegram_id is missing`);
      return {
        success: false,
        error: 'Telegram profilingiz hali ulanmagan. Iltimos, Telegram orqali ro‘yxatdan o‘ting.',
      };
    }

    if (!this.botToken) {
      this.logger.warn(`TELEGRAM_BOT_TOKEN is not configured. Emulating OTP send to ${destination}: [${code}]`);
      return {
        success: true,
        messageId: 'mock-telegram-msg-id',
      };
    }

    const text =
      `🔐 <b>BiznesGO — Tasdiqlash kodi</b>\n\n` +
      `Sizning bir martalik kodingiz: <code>${code}</code>\n\n` +
      `⏱ Kod 5 daqiqa davomida amal qiladi.\n` +
      `⚠️ Ushbu kodni hech kimga, hatto platforma xodimlariga ham bermang!`;

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: String(telegramId),
          text,
          parse_mode: 'HTML',
        }),
      });

      const data = (await response.json()) as { ok: boolean; description?: string; result?: { message_id: number } };

      if (!data.ok) {
        this.logger.error(`Telegram API error for chat ${telegramId}: ${data.description}`);
        return {
          success: false,
          error: data.description || 'Telegram xabar yetkazilmadi',
        };
      }

      return {
        success: true,
        messageId: String(data.result?.message_id),
      };
    } catch (error) {
      this.logger.error(`Failed to send Telegram message to ${telegramId}`, error);
      return {
        success: false,
        error: 'Telegram tarmog‘i bilan bog‘lanishda xatolik',
      };
    }
  }
}

