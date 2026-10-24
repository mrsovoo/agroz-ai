const express = require('express');
const cors = require('cors');
const { port, pool } = require('./config');
const fs = require('fs');
const path = require('path');

const authMiddleware = require('./middleware/auth');
const authRoutes = require('./routes/biznesgo/auth');
const productsRoutes = require('./routes/biznesgo/products');
const salesRoutes = require('./routes/biznesgo/sales');
const debtsRoutes = require('./routes/biznesgo/debts');
const dashboardRoutes = require('./routes/biznesgo/dashboard');
const { initTelegramBot } = require('./services/telegramBot');

const app = express();

// Neon / PostgreSQL sxemasini avtomatik ishga tushirish (Auto-migration)
async function initDatabase() {
  try {
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(sql);
      console.log('[Database] Neon PostgreSQL sxemasi va jadvallari muvaffaqiyatli sinxronlandi.');
    }
  } catch (err) {
    console.warn('[Database] Sxema sinxronlash ogohlantirishi:', err.message);
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Health Check (Railway, Vercel va monitoring barcha yo'llari uchun)
const healthHandler = (req, res) => {
  res.status(200).json({
    status: 'ok',
    platform: 'BiznesGO B2B',
    active_sector: 'agro_vet',
    version: '1.0.0-agrovet',
    uptime: Math.round(process.uptime())
  });
};

app.get('/health', healthHandler);
app.get('/healthz', healthHandler);
app.get('/api/health', healthHandler);
app.get('/', (req, res) => {
  res.status(200).send('BiznesGO B2B Agro-Vet API is running.');
});

// B2B Agro-Vet API yo'nalishlari
app.use('/api/biznesgo/auth', authRoutes);
app.use('/api/biznesgo/products', authMiddleware, productsRoutes);
app.use('/api/biznesgo/sales', authMiddleware, salesRoutes);
app.use('/api/biznesgo/debts', authMiddleware, debtsRoutes);
app.use('/api/biznesgo/dashboard', authMiddleware, dashboardRoutes);

// Global xatoliklarni ushlash
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Ichki server xatoligi yuz berdi' });
});

app.listen(port, () => {
  console.log(`[BiznesGO B2B Agro-Vet] Server listening on port ${port}`);
  initDatabase();
  initTelegramBot();
});

