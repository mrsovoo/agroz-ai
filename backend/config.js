const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const isProd = process.env.NODE_ENV === 'production';

// Production muhitida muhim kalitlar env sifatida bo'lishi shart
if (isProd) {
  if (!process.env.DATABASE_URL) {
    throw new Error("Muhit o'zgaruvchisi topilmadi: DATABASE_URL (production uchun majburiy)");
  }
  if (!process.env.AUTH_SECRET) {
    throw new Error("Muhit o'zgaruvchisi topilmadi: AUTH_SECRET (production uchun majburiy)");
  }
}

const config = {
  isProd,
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/agroz_dev',
  pgSsl: process.env.PGSSL !== 'false',
  pgPoolMax: Number(process.env.PGPOOL_MAX || 5),

  // Token imzolash kaliti (HMAC-SHA256)
  authSecret: process.env.AUTH_SECRET || 'dev_insecure_auth_secret_only_for_local_development',
  tokenTtlSeconds: Number(process.env.AUTH_TOKEN_TTL || 60 * 60 * 24 * 7), // 7 kun

  // Telegram Mini App initData yaroqlilik muddati (standart: 24 soat)
  initDataMaxAgeSeconds: Number(process.env.INIT_DATA_MAX_AGE_SECONDS || 86400),

  // Telegram Mini App initData tekshiruvi uchun bot tokenlari (Dual-bot support)
  biznesgoBotToken: process.env.BIZNESGO_BOT_TOKEN || '',
  agrozAuthBotToken: process.env.AGROZ_AUTH_BOT_TOKEN || process.env.TELEGRAM_AUTH_BOT_TOKEN || '',
  botToken: process.env.BIZNESGO_BOT_TOKEN || process.env.AGROZ_AUTH_BOT_TOKEN || process.env.TELEGRAM_AUTH_BOT_TOKEN || '',
  botTokens: [
    process.env.BIZNESGO_BOT_TOKEN,
    process.env.AGROZ_AUTH_BOT_TOKEN,
    process.env.TELEGRAM_AUTH_BOT_TOKEN
  ].filter(Boolean),

  // Telegram Bot usernames & URLs
  biznesgoBotUsername: process.env.BIZNESGO_BOT_USERNAME || 'biznesgo_bot',
  agrozAuthBotUsername: process.env.AGROZ_AUTH_BOT_USERNAME || 'agroz_auth_bot',
  miniAppUrl: process.env.BIZNESGO_MINI_APP_URL || 'https://biznesgo.vercel.app',

  // Admin autentifikatsiyasi (broadcast va boshqaruv uchun)
  adminPassword: process.env.ADMIN_PASSWORD || '',
  adminKey: process.env.ADMIN_KEY || process.env.ADMIN_PASSWORD || '',

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
