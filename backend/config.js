const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const DEFAULT_DB_URL = 'postgresql://neondb_owner:npg_npiz2BoV9bZk@ep-steep-snow-b27sm8op-pooler.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const DEFAULT_AUTH_SECRET = 'bc909bbd9cdcafc1db30c9d347c13fdfd5422d44ac49c68716330f2485fc3091';

const isProd = process.env.NODE_ENV === 'production';

const config = {
  isProd,
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || DEFAULT_DB_URL,
  pgSsl: process.env.PGSSL !== 'false',
  pgPoolMax: Number(process.env.PGPOOL_MAX || 5),

  // Token imzolash kaliti (HMAC-SHA256). Railway-da env bo'lmasa xavfsiz fallback ishlaydi
  authSecret: process.env.AUTH_SECRET || DEFAULT_AUTH_SECRET,
  tokenTtlSeconds: Number(process.env.AUTH_TOKEN_TTL || 60 * 60 * 24 * 7), // 7 kun

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
  miniAppUrl: process.env.BIZNESGO_MINI_APP_URL || 'https://t.me/biznesgo_bot/app',

  // AgrozGO → BiznesGO server-to-server kaliti (buyurtma yuborish uchun)
  bridgeKey: process.env.BIZNESGO_BRIDGE_KEY || '',

  // CORS: vergul bilan ajratilgan ro'yxat. Bo'sh bo'lsa — faqat same-origin + dev localhost.
  corsOrigins: (process.env.CORS_ORIGINS || process.env.BIZNESGO_MINI_APP_URL || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  frontendDir: path.resolve(__dirname, process.env.FRONTEND_DIR || '../biznesgo'),
};

module.exports = config;

