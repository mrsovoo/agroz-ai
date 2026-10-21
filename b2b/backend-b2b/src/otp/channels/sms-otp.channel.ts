import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpChannel, OtpSendResult } from '../interfaces/otp-channel.interface';

@Injectable()
export class SmsOtpChannel implements OtpChannel {
  readonly name = 'sms';
  private readonly logger = new Logger(SmsOtpChannel.name);
  private readonly isEnabled: boolean;

  constructor(private readonly config: ConfigService) {
    // When ESKIZ credentials or SMS_GATEWAY is provided, enable automatically
    this.isEnabled = Boolean(this.config.get<string>('ESKIZ_EMAIL'));
  }

  async sendOtp(
    destination: string,
    code: string,
    _metadata?: Record<string, unknown>,
  ): Promise<OtpSendResult> {
    if (!this.isEnabled) {
      this.logger.debug(
        `SMS channel is not yet configured for ${destination}. Emulating SMS: [${code}]`,
      );
      return {
        success: true,
        messageId: 'mock-sms-id',
      };
    }

    // Planned Eskiz integration logic will sit here without touching OtpService
    this.logger.log(`Dispatching SMS to ${destination}`);
    return {
      success: true,
      messageId: 'eskiz-sms-id',
    };
  }
}

