/**
 * BiznesGO backend server.
 *   - /api/biznesgo/*  — REST API
 *   - /healthz, /health, /api/health — health check
 *   - /*               — biznesgo/ frontend (SPA) statik fayllari
 */
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const config = require('./config');
const { pool } = require('./db/pool');
const { migrate } = require('./db/migrate');
const { errorHandler } = require('./lib/errors');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

// Xavfsizlik sarlavhalari. Telegram Mini App iframe ichida ochilgani uchun
// frame-ancestors'ga Telegram domenlari qo'shilgan.
app.use((_req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self' https://telegram.org; style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; connect-src 'self' https:; " +
      "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org",
  });
  next();
});

// Qat'iy va xavfsiz CORS tekshiruvi (B2B, Super Admin va B2C AgrozGO)
const allowedOrigins = [
  'https://biznesgo.uz',
  'https://www.biznesgo.uz',
  'https://super-adm.biznesgo.uz',
  'https://sohibjon.biznesgo.uz',
  'https://biznesgo.vercel.app',
  'https://biznesgo-sovos-projects.vercel.app',
  'https://agroz.uz',
  'https://www.agroz.uz',
  'https://admin.agroz.uz',
  ...config.corsOrigins,
];

function isOriginAllowed(origin) {
  if (!origin) return true; // Server-to-server, curl, mobil Telegram WebApp
  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1') return true;
    if (host === 'telegram.org' || host.endsWith('.telegram.org')) return true;
    if (host === 'vercel.app' || host.endsWith('.vercel.app')) return true;
    if (host === 'biznesgo.uz' || host.endsWith('.biznesgo.uz')) return true;
    if (host === 'agroz.uz' || host.endsWith('.agroz.uz')) return true;
    return allowedOrigins.some((ao) => {
      try {
        return new URL(ao).hostname.toLowerCase() === host;
      } catch {
        return ao === origin;
      }
    });
  } catch {
    return false;
  }
}

app.use(
  '/api',
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS tomonidan bloklandi: ' + origin));
      }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Telegram-Init-Data', 'X-Bridge-Key', 'X-Admin-Key', 'X-Telegram-Bot-Api-Secret-Token'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    maxAge: 600,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

let dbStatus = 'initializing';

const healthHandler = (_req, res) => {
  const isHealthy = dbStatus === 'connected' || dbStatus === 'initializing';
  res.status(isHealthy ? 200 : 503).json({
    ok: isHealthy,
    status: isHealthy ? 'ok' : 'unhealthy',
    service: 'biznesgo-backend',
    database: dbStatus,
    uptime: process.uptime(),
  });
};

app.get('/healthz', healthHandler);
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Webhook backward compatibility routes for Telegram
const botRouter = require('./routes/biznesgo/bot');
app.post(['/api/biznesgo/telegram/webhook', '/api/telegram/webhook'], (req, res, next) => {
  req.url = '/webhook/biznesgo';
  botRouter(req, res, next);
});
app.post(['/api/telegram/auth-webhook', '/api/biznesgo/telegram/auth-webhook'], (req, res, next) => {
  req.url = '/webhook/agroz_auth';
  botRouter(req, res, next);
});
app.use('/api/biznesgo', require('./routes/biznesgo'));
app.use('/api/super-adm', require('./routes/super-adm'));
app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint topilmadi', code: 'NOT_FOUND' }));

// Frontend (SPA)
if (fs.existsSync(config.frontendDir)) {
  app.use(express.static(config.frontendDir, { index: 'index.html', maxAge: config.isProd ? '1h' : 0 }));
  app.get('*', (_req, res) => res.sendFile(path.join(config.frontendDir, 'index.html')));
}

app.use(errorHandler);

async function start() {
  try {
    if (process.env.MIGRATE_ON_START !== 'false') {
      await migrate();
      console.log('[biznesgo] Baza migratsiyasi muvaffaqiyatli yakunlandi.');
    }
    dbStatus = 'connected';
  } catch (mErr) {
    dbStatus = 'migration_error: ' + mErr.message;
    console.error('[biznesgo] Migratsiya xatosi:', mErr.message);
    if (config.isProd) {
      console.error('[biznesgo] Production muhitida xatolik sababli to\'xtatilmoqda...');
      process.exit(1);
    }
  }

  const host = '0.0.0.0';
  const server = app.listen(config.port, host, () => {
    console.log(`[biznesgo] Server ishlamoqda: http://${host}:${config.port} (env: ${process.env.NODE_ENV || 'development'})`);
  });
  const shutdown = () => {
    server.close(() => pool.end().finally(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

if (require.main === module) {
  start().catch((err) => {
    console.error('[biznesgo] ishga tushmadi:', err);
    process.exit(1);
  });
}

module.exports = { app };
