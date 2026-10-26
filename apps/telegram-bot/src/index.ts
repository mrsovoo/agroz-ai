import { TelegramBot } from './bot.ts';
import { registerB2BHandlers } from './b2b-handlers/register.ts';
import { config } from './config.ts';

async function main() {
  console.log('==============================================');
  console.log('  BiznesGO Telegram Launch App Bot Server     ');
  console.log('==============================================');

  if (!config.botToken || config.botToken === 'YOUR_BOT_TOKEN_HERE') {
    console.warn('[OGOHLANTIRISH] BOT_TOKEN sozlanmagan!');
    console.warn('Iltimos, apps/telegram-bot/.env fayliga BOT_TOKEN=... ni kiriting.');
    console.warn('Namuna token kutilyapti...');
  }

  const bot = new TelegramBot(config.botToken);

  // B2B ro'yxatdan o'tish va Launch App boshqaruvchilarini ulash
  registerB2BHandlers(bot);

  // Botni ishga tushirish (Long Polling)
  bot.startPolling();

  // Jarayonni to'xtatish (Ctrl+C)
  const shutdown = () => {
    console.log('\n[Bot] To‘xtatilmoqda...');
    bot.stopPolling();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[Bot Fatal Error]:', err);
});
