/**
 * BiznesGO backend server.
 *   - /api/biznesgo/*  — REST API
 *   - /healthz         — health check
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
      "img-src 'self' data: https:; connect-src 'self'; " +
      "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org",
  });
  next();
});

app.use(
  '/api',
  cors({
    origin: true,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Telegram-Init-Data', 'X-Bridge-Key'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    maxAge: 600,
  })
);
app.use(express.json({ limit: '200kb' }));

const healthHandler = (_req, res) => {
  res.status(200).json({ ok: true, status: 'ok', service: 'biznesgo-backend', uptime: process.uptime() });
};
app.get('/healthz', healthHandler);
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

app.use('/api/biznesgo', require('./routes/biznesgo'));
app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint topilmadi', code: 'NOT_FOUND' }));

// Frontend (SPA)
if (fs.existsSync(config.frontendDir)) {
  app.use(express.static(config.frontendDir, { index: 'index.html', maxAge: config.isProd ? '1h' : 0 }));
  app.get('*', (_req, res) => res.sendFile(path.join(config.frontendDir, 'index.html')));
}

app.use(errorHandler);

async function start() {
  try {
    if (process.env.MIGRATE_ON_START !== 'false') await migrate();
  } catch (mErr) {
    console.error('[biznesgo] Migratsiya ogohlantirishi:', mErr.message);
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

