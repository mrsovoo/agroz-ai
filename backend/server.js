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
const inventoryRoutes = require('./routes/biznesgo/inventory');
const purchasingRoutes = require('./routes/biznesgo/purchasing');
const financeRoutes = require('./routes/biznesgo/finance');
const notificationsRoutes = require('./routes/biznesgo/notifications');
const settingsRoutes = require('./routes/biznesgo/settings');

const { initTelegramBot, handleTelegramUpdate } = require('./services/telegramBot');

const app = express();

// Neon / PostgreSQL sxemasini avtomatik ishga tushirish (Auto-migration)
async function initDatabase() {
  try {
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(sql);
      console.log('[Database] BiznesGO B2B Core sxemasi va 10 ta yadro jadvallari sinxronlandi.');
    }
  } catch (err) {
    console.warn('[Database] Sxema sinxronlash ogohlantirishi:', err.message);
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Telegram Bot Webhook (Railway va Telegram o'rtasida real-time aloqa)
app.post(['/api/biznesgo/telegram/webhook', '/api/biznesgo/bot/webhook'], async (req, res) => {
  res.status(200).send('OK');
  if (req.body) {
    try {
      await handleTelegramUpdate(req.body);
    } catch (err) {
      console.error('[Telegram Webhook Error]:', err.message);
    }
  }
});

// Health Check
const healthHandler = (req, res) => {
  res.status(200).json({
    status: 'ok',
    platform: 'BiznesGO B2B Core',
    supported_sectors: [
      'agro_vet',
      'feed_nutrition',
      'seeds_seedlings',
      'greenhouse_livestock_eq',
      'agro_machinery'
    ],
    version: '2.0.0-core',
    uptime: Math.round(process.uptime())
  });
};

app.get('/health', healthHandler);
app.get('/healthz', healthHandler);
app.get('/api/health', healthHandler);
app.get('/', (req, res) => {
  res.status(200).send('BiznesGO B2B Core API is running across all 5 sectors.');
});

// ============================================================================
// BiznesGO B2B Core API Yo'nalishlari (10 ta Yadro Modul)
// ============================================================================
// 1. Tenant & Access Core
app.use('/api/biznesgo/auth', authRoutes);

// 2. Master Data Core & Products (5 sektor xususiyatlari bilan)
app.use('/api/biznesgo/products', authMiddleware, productsRoutes);

// 3. Inventory & Warehouse Core (Kirim, Chiqim, Ko'chirish, Inventarizatsiya)
app.use('/api/biznesgo/inventory', authMiddleware, inventoryRoutes);

// 4. Sales & POS Core (Kassa, smenalar, cheklar)
app.use('/api/biznesgo/sales', authMiddleware, salesRoutes);

// 5. Customer & Debt Core (Mijozlar CRM, Nasiya daftari)
app.use('/api/biznesgo/debts', authMiddleware, debtsRoutes);

// 6. Purchasing & Supplier Core (Supplierlar, Kirim buyurtmalari)
app.use('/api/biznesgo/purchasing', authMiddleware, purchasingRoutes);

// 7. Cash & Finance Core (Kassalar, xarajatlar, pul oqimi)
app.use('/api/biznesgo/finance', authMiddleware, financeRoutes);

// 8. Reporting & Dashboard Core (Savdo tahlili, FEFO xavfi, qarz)
app.use('/api/biznesgo/dashboard', authMiddleware, dashboardRoutes);

// 9. Notification Core (Xabarnomalar)
app.use('/api/biznesgo/notifications', authMiddleware, notificationsRoutes);

// 10. Settings & Audit Core (Do'kon sozlamalari, audit log)
app.use('/api/biznesgo/settings', authMiddleware, settingsRoutes);

// ============================================================================
// BiznesGO Super Admin Core API (/v1/admin/*)
// ============================================================================
const superAdminRoutes = require('./super-adm');
app.use(['/v1/admin', '/api/v1/admin'], superAdminRoutes);

// Global xatoliklarni ushlash
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Ichki server xatoligi yuz berdi' });
});

app.listen(port, () => {
  console.log(`[BiznesGO B2B Core] Server listening on port ${port}`);
  initDatabase();
  initTelegramBot();
});
