import { Injectable, Logger } from '@nestjs/common';
import { OtpChannel, OtpSendResult } from '../interfaces/otp-channel.interface';

@Injectable()
export class ConsoleOtpChannel implements OtpChannel {
  readonly name = 'console';
  private readonly logger = new Logger(ConsoleOtpChannel.name);

  async sendOtp(phone: string, code: string): Promise<OtpSendResult> {
    this.logger.log(
      `\n==========================================================\n` +
        `🔑 [CONSOLE OTP] Telefon: ${phone} | Tasdiqlash kodi: ${code}\n` +
        `==========================================================\n`,
    );
    return { success: true };
  }
}

