import { Module } from '@nestjs/common';
import { ConsoleOtpChannel } from './channels/console-otp.channel';
import { SmsOtpChannel } from './channels/sms-otp.channel';
import { TelegramOtpChannel } from './channels/telegram-otp.channel';
import { OtpService } from './otp.service';

@Module({
  providers: [TelegramOtpChannel, SmsOtpChannel, ConsoleOtpChannel, OtpService],
  exports: [OtpService, TelegramOtpChannel, SmsOtpChannel, ConsoleOtpChannel],
})
export class OtpModule {}

