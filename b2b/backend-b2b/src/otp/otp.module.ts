import { Module } from '@nestjs/common';
import { SmsOtpChannel } from './channels/sms-otp.channel';
import { TelegramOtpChannel } from './channels/telegram-otp.channel';
import { OtpService } from './otp.service';

@Module({
  providers: [TelegramOtpChannel, SmsOtpChannel, OtpService],
  exports: [OtpService, TelegramOtpChannel, SmsOtpChannel],
})
export class OtpModule {}

