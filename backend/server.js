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
    // 1. Eng avval tenants jadvali va eski jadvallarga tenant_id ustunini xavfsiz qo'shib olamiz
    const preMigrations = [
      `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,
      `CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        code VARCHAR(50) UNIQUE,
        phone VARCHAR(30) UNIQUE NOT NULL,
        email VARCHAR(120),
        tax_id VARCHAR(50),
        address TEXT,
        logo_url TEXT,
        sector_type VARCHAR(50) NOT NULL DEFAULT 'agro_vet',
        plan VARCHAR(30) NOT NULL DEFAULT 'standard',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        settings JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS merchants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        phone VARCHAR(30) UNIQUE NOT NULL,
        name VARCHAR(150) NOT NULL,
        business_type VARCHAR(50) NOT NULL DEFAULT 'agro_vet',
        address VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`,
      `ALTER TABLE merchants ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE`,
      `ALTER TABLE merchants ADD COLUMN IF NOT EXISTS business_type VARCHAR(50) NOT NULL DEFAULT 'agro_vet'`,
      `ALTER TABLE merchants ADD COLUMN IF NOT EXISTS address VARCHAR(255)`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS dosage_form VARCHAR(100)`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS storage_condition VARCHAR(255)`,
      `ALTER TABLE customers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE`,
      `ALTER TABLE sales ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE`,
      `ALTER TABLE sales ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'completed'`
    ];

    for (const stmt of preMigrations) {
      try {
        await pool.query(stmt);
      } catch (_) {}
    }

    // 2. Asosiy schema.sql ni ishga tushirish
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      try {
        await pool.query(sql);
      } catch (batchErr) {
        // Agar umumiy paketda xatolik bersa, har bir SQL buyruqni alohida tranzaksiyada bajaramiz
        const statements = sql
          .split(/;\s*(?:\r?\n|$)/)
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));
        for (const stmt of statements) {
          try {
            await pool.query(stmt);
          } catch (_) {}
        }
      }
    }

    // 3. Neon DB'dagi eski merchants yozuvlarini tenants jadvaliga ko'chirish va bog'lash
    const syncQueries = [
      `INSERT INTO tenants (id, name, phone, address, sector_type, created_at)
       SELECT id, name, phone, address, 
              CASE WHEN business_type IN ('agro_vet', 'feed_nutrition', 'seeds_seedlings', 'greenhouse_livestock_eq', 'agro_machinery') THEN business_type ELSE 'agro_vet' END,
              COALESCE(created_at, CURRENT_TIMESTAMP)
       FROM merchants
       ON CONFLICT (phone) DO NOTHING`,
      `UPDATE merchants m SET tenant_id = t.id FROM tenants t WHERE m.phone = t.phone AND m.tenant_id IS NULL`,
      `UPDATE products p SET tenant_id = m.tenant_id FROM merchants m WHERE p.merchant_id = m.id AND p.tenant_id IS NULL`,
      `UPDATE customers c SET tenant_id = m.tenant_id FROM merchants m WHERE c.merchant_id = m.id AND c.tenant_id IS NULL`,
      `UPDATE sales s SET tenant_id = m.tenant_id FROM merchants m WHERE s.merchant_id = m.id AND s.tenant_id IS NULL`
    ];

    for (const q of syncQueries) {
      try {
        await pool.query(q);
      } catch (_) {}
    }

    console.log('[Database] BiznesGO B2B Core sxemasi va Neon ma\'lumotlari to\'liq sinxronlandi.');
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

// Super Admin Frontend Static Serving (/admin)
const adminDistPath = path.join(__dirname, 'public', 'admin');
if (fs.existsSync(adminDistPath)) {
  app.use('/admin', express.static(adminDistPath));
  app.get(['/admin', '/admin/*'], (req, res) => {
    res.sendFile(path.join(adminDistPath, 'index.html'));
  });
}

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
