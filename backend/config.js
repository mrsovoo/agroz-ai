const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const isProd = process.env.NODE_ENV === 'production';

// Production muhitida zarur sozlamalar
if (isProd) {
  if (!process.env.DATABASE_URL) {
    throw new Error("Muhit o'zgaruvchisi topilmadi: DATABASE_URL (production uchun majburiy)");
  }
  if (!process.env.AUTH_SECRET) {
    process.env.AUTH_SECRET = 'bc909bbd9cdcafc1db30c9d347c13fdfd5422d44ac49c68716330f2485fc3091';
  }
}

const config = {
  isProd,
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/agroz_dev',
  pgSsl: process.env.PGSSL !== 'false',
  pgPoolMax: Number(process.env.PGPOOL_MAX || 5),

  // Token imzolash kaliti (HMAC-SHA256)
  authSecret: process.env.AUTH_SECRET || (isProd ? '' : 'dev_insecure_auth_secret_only_for_local_development'),
  tokenTtlSeconds: Number(process.env.AUTH_TOKEN_TTL || 60 * 60 * 24 * 7), // 7 kun

  // Telegram Mini App initData yaroqlilik muddati (standart: 24 soat)
  initDataMaxAgeSeconds: Number(process.env.INIT_DATA_MAX_AGE_SECONDS || 86400),

  // Telegram Mini App initData tekshiruvi uchun bot tokenlari (Multi-bot support)
  biznesgoBotToken: process.env.BIZNESGO_BOT_TOKEN || '',
  agrozAuthBotToken: process.env.AGROZ_AUTH_BOT_TOKEN || process.env.TELEGRAM_AUTH_BOT_TOKEN || '',
  agrozgoBotToken: process.env.AGROZGO_BOT_TOKEN || '8805081951:AAFtJ5oHbzL-MK_6jW8f5ox0vvNbtnJOYXk',
  botToken: process.env.BIZNESGO_BOT_TOKEN || process.env.AGROZ_AUTH_BOT_TOKEN || process.env.TELEGRAM_AUTH_BOT_TOKEN || '',
  botTokens: [
    process.env.BIZNESGO_BOT_TOKEN,
    process.env.AGROZ_AUTH_BOT_TOKEN,
    process.env.TELEGRAM_AUTH_BOT_TOKEN,
    process.env.AGROZGO_BOT_TOKEN || '8805081951:AAFtJ5oHbzL-MK_6jW8f5ox0vvNbtnJOYXk',
  ].filter(Boolean),

  // Telegram Bot usernames & URLs
  biznesgoBotUsername: process.env.BIZNESGO_BOT_USERNAME || 'biznesgo_bot',
  agrozAuthBotUsername: process.env.AGROZ_AUTH_BOT_USERNAME || 'agroz_auth_bot',
  agrozgoBotUsername: process.env.AGROZGO_BOT_USERNAME || 'agrozai_bot',
  miniAppUrl: process.env.BIZNESGO_MINI_APP_URL || 'https://biznesgo.uz',
  agrozgoMiniAppUrl: process.env.AGROZGO_MINI_APP_URL || 'https://agroz-ai.vercel.app',

  // Admin autentifikatsiyasi (broadcast va boshqaruv uchun)
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'AgrozAdmin_2026_Prod_9f3b8c',
  adminKey: process.env.ADMIN_KEY || process.env.ADMIN_PASSWORD || 'AgrozAdmin_2026_Prod_9f3b8c',

  // Telegram Webhook Secret Token (qo'shimcha xavfsizlik uchun)
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || '',

  // AgrozGO → BiznesGO server-to-server kaliti
  bridgeKey: process.env.BIZNESGO_BRIDGE_KEY || '',

  // CORS: ruxsat etilgan domenlar
  corsOrigins: (process.env.CORS_ORIGINS || process.env.BIZNESGO_MINI_APP_URL || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  frontendDir: path.resolve(__dirname, process.env.FRONTEND_DIR || '../biznesgo'),
};

module.exports = config;
