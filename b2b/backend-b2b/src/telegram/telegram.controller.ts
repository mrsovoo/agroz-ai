import { Body, Controller, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TelegramService, TelegramUpdate } from './telegram.service';

@ApiTags('Telegram')
@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Telegram Bot Webhook update handler' })
  async handleWebhook(@Body() update: TelegramUpdate) {
    return this.telegramService.handleWebhookUpdate(update);
  }

  @Post('link-token')
  @ApiOperation({ summary: 'Generate deep link to bind Telegram account' })
  async createLinkToken(
    @Query('user_id') userId?: string,
    @Query('phone') phone?: string,
  ) {
    return this.telegramService.createLinkToken(userId, phone);
  }
}

