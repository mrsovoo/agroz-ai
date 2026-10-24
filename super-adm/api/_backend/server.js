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

const { initTelegramBot, handleTelegramUpdate, getWebhookSecretToken } = require('./services/telegramBot');

const app = express();

// Neon / PostgreSQL sxemasini avtomatik ishga tushirish (Auto-migration & Neon Sync)
async function initDatabase() {
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // 1. Agar eski integer-ID li merchants / products jadvallari mavjud bo'lsa:
    //    a) merchants jadvalidagi yozuvlarni neon_legacy_merchants arxiv jadvaliga xavfsiz nusxalaymiz
    //    b) Eski integer-ID li POS jadvallarini (products, sales, customers, debts, merchants) toza UUID v2 sxemasiga o'tkazamiz va barcha test tovar/savdolarni 0 ga tushiramiz
    try {
      const legacyMerchCheck = await pool.query(`
        SELECT data_type FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'merchants' AND column_name = 'id'
      `);
      if (legacyMerchCheck.rows.length > 0 && legacyMerchCheck.rows[0].data_type === 'integer') {
        await pool.query(`CREATE TABLE IF NOT EXISTS neon_legacy_merchants AS SELECT * FROM merchants`);
      }

      const legacyProdCheck = await pool.query(`
        SELECT data_type FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'id'
      `);
      if (
        (legacyProdCheck.rows.length > 0 && legacyProdCheck.rows[0].data_type === 'integer') ||
        (legacyMerchCheck.rows.length > 0 && legacyMerchCheck.rows[0].data_type === 'integer')
      ) {
        console.log('[Database] Eski integer POS jadvallari aniqlandi — arxiv saqlangan holda v2 UUID 0-state sxemasiga yangilanmoqda...');
        await pool.query(`
          DROP TABLE IF EXISTS 
            sale_items,
            debt_payments,
            debts,
            debt_transactions,
            sales,
            stock_batches,
            inventory_movements,
            stock_balances,
            purchase_payments,
            purchase_items,
            purchases,
            suppliers,
            product_variants,
            products,
            customers,
            merchants
          CASCADE
        `);
      }

      // Eski test mahsulot va savdo jadvallarini 0 holatga keltirish (faqat ro'yxatdan o'tgan odamlar qoladi)
      const clearTestTables = [
        'biznesgo_pos_sale_items',
        'biznesgo_pos_sales',
        'biznesgo_order_items',
        'biznesgo_orders',
        'biznesgo_debt_payments',
        'biznesgo_debts',
        'biznesgo_customers',
        'biznesgo_products'
      ];
      for (const tbl of clearTestTables) {
        try {
          await pool.query(`DELETE FROM ${tbl}`);
        } catch (_) {}
      }
    } catch (migCheckErr) {
      console.warn('[Database] Legacy check warning:', migCheckErr.message);
    }

    // 2. Mavjud users jadvaliga (25 ta fermer/bot foydalanuvchilari buzilmasligi uchun) v2 ustunlarini qo'shish
    const userAlterStmts = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id UUID`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(150)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS role_code VARCHAR(50) DEFAULT 'owner'`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(50)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`,
      `UPDATE users SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL`,
      `UPDATE users SET telegram_chat_id = telegram_id::text WHERE telegram_chat_id IS NULL AND telegram_id IS NOT NULL`
    ];
    for (const stmt of userAlterStmts) {
      try {
        await pool.query(stmt);
      } catch (_) {}
    }

    // 3. Asosiy schema.sql ni ishga tushirish
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      try {
        await pool.query(sql);
      } catch (batchErr) {
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

    // 4. Neon DB'dagi biznesgo_merchants va neon_legacy_merchants ro'yxatdan o'tgan do'konlarni tenants va merchants ga sinxronlash
    await syncNeonBiznesGoMerchants();

    console.log('[Database] BiznesGO B2B Core sxemasi va Neon ma\'lumotlari to\'liq sinxronlandi.');
  } catch (err) {
    console.warn('[Database] Sxema sinxronlash ogohlantirishi:', err.message);
  }
}

async function syncNeonBiznesGoMerchants() {
  try {
    const storeMap = new Map(); // last9 -> merged merchant object

    // A) biznesgo_merchants jadvalidan o'qish
    try {
      const bmRes = await pool.query(`SELECT * FROM biznesgo_merchants ORDER BY id ASC`);
      for (const row of bmRes.rows) {
        const digits = String(row.phone || '').replace(/\D/g, '');
        if (digits.length < 9) continue;
        const last9 = digits.slice(-9);
        const normalizedPhone = `+998${last9}`;
        const fullAddr = [row.region, row.district, row.mahalla, row.address]
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i)
          .join(', ');

        storeMap.set(last9, {
          phone: normalizedPhone,
          name: (row.shop_name || row.organization_name || row.name || 'Agro-Vet Dorixona').trim(),
          owner_name: (row.owner_name || row.name || row.organization_name || 'Do\'kon Egasi').trim(),
          telegram_id: row.telegram_id ? String(row.telegram_id) : null,
          region: row.region || null,
          district: row.district || null,
          address: fullAddr || (row.telegram_id ? `tg:${row.telegram_id}` : null),
          sector_type: 'agro_vet',
          created_at: row.created_at || new Date().toISOString(),
          legacy_biznesgo_merchant: row
        });
      }
    } catch (_) {}

    // B) neon_legacy_merchants jadvalidan o'qish
    try {
      const lmRes = await pool.query(`SELECT * FROM neon_legacy_merchants ORDER BY id ASC`);
      for (const row of lmRes.rows) {
        const digits = String(row.phone || '').replace(/\D/g, '');
        if (digits.length < 9) continue;
        const last9 = digits.slice(-9);
        const normalizedPhone = `+998${last9}`;
        const existing = storeMap.get(last9);
        const tgFromAddr = row.address && row.address.startsWith('tg:') ? row.address.replace('tg:', '').trim() : null;

        if (existing) {
          if (row.store_name && row.store_name !== existing.name && !existing.name.includes(row.store_name)) {
            existing.name = `${existing.name} (${row.store_name})`;
          }
          if (row.address && !row.address.startsWith('tg:') && (!existing.address || existing.address.length < row.address.length)) {
            existing.address = row.address;
          }
          if (!existing.telegram_id && tgFromAddr) {
            existing.telegram_id = tgFromAddr;
          }
          existing.legacy_merchant = row;
        } else {
          storeMap.set(last9, {
            phone: normalizedPhone,
            name: (row.store_name || row.name || 'Agro-Vet Dorixona').trim(),
            owner_name: (row.store_name || row.name || 'Do\'kon Egasi').trim(),
            telegram_id: tgFromAddr,
            region: null,
            district: null,
            address: row.address || null,
            sector_type: 'agro_vet',
            created_at: row.created_at || new Date().toISOString(),
            legacy_merchant: row
          });
        }
      }
    } catch (_) {}

    // C) Har bir topilgan BiznesGO do'konini tenants, merchants, branches, warehouses, cash_accounts ga yozish
    for (const [, item] of storeMap.entries()) {
      const settingsObj = {
        owner_name: item.owner_name,
        telegram_id: item.telegram_id,
        region: item.region,
        district: item.district,
        source: item.telegram_id ? 'telegram_bot' : 'web_browser',
        legacy_biznesgo_merchant: item.legacy_biznesgo_merchant || null,
        legacy_merchant: item.legacy_merchant || null
      };

      const tRes = await pool.query(
        `INSERT INTO tenants (name, phone, address, sector_type, settings, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, TRUE, $6)
         ON CONFLICT (phone) DO UPDATE SET
           name = EXCLUDED.name,
           address = COALESCE(EXCLUDED.address, tenants.address),
           settings = tenants.settings || EXCLUDED.settings
         RETURNING id`,
        [item.name, item.phone, item.address, item.sector_type, JSON.stringify(settingsObj), item.created_at]
      );
      const tenantId = tRes.rows[0].id;

      // Merchants jadvaliga ham mos yozuv kiritish
      const merchAddr = item.telegram_id ? `tg:${item.telegram_id}` : item.address;
      await pool.query(
        `INSERT INTO merchants (id, tenant_id, phone, name, business_type, address, created_at)
         VALUES ($1, $1, $2, $3, $4, $5, $6)
         ON CONFLICT (phone) DO UPDATE SET
           tenant_id = EXCLUDED.tenant_id,
           name = EXCLUDED.name,
           address = COALESCE(EXCLUDED.address, merchants.address)`,
        [tenantId, item.phone, item.name, item.sector_type, merchAddr, item.created_at]
      );

      // Standart filial, ombor va 0-balansli kassa yaratish (agar yo'q bo'lsa)
      const brCheck = await pool.query(`SELECT id FROM branches WHERE tenant_id = $1 LIMIT 1`, [tenantId]);
      let branchId = brCheck.rows[0]?.id;
      if (!branchId) {
        const brRes = await pool.query(
          `INSERT INTO branches (tenant_id, name, code, phone, address, is_main)
           VALUES ($1, 'Bosh Do''kon', 'MAIN', $2, $3, TRUE)
           RETURNING id`,
          [tenantId, item.phone, item.address]
        );
        branchId = brRes.rows[0]?.id;
      }

      const whCheck = await pool.query(`SELECT id FROM warehouses WHERE tenant_id = $1 LIMIT 1`, [tenantId]);
      if (whCheck.rows.length === 0) {
        await pool.query(
          `INSERT INTO warehouses (tenant_id, branch_id, name, code, type)
           VALUES ($1, $2, 'Asosiy Ombor', 'WH-01', 'main')`,
          [tenantId, branchId || null]
        );
      }

      const caCheck = await pool.query(`SELECT id FROM cash_accounts WHERE tenant_id = $1 LIMIT 1`, [tenantId]);
      if (caCheck.rows.length === 0) {
        await pool.query(
          `INSERT INTO cash_accounts (tenant_id, branch_id, name, account_type, balance)
           VALUES ($1, $2, 'Asosiy Kassa', 'cash', 0)`,
          [tenantId, branchId || null]
        );
      }
    }
  } catch (err) {
    console.warn('[Database] syncNeonBiznesGoMerchants warning:', err.message);
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Telegram Bot Webhook (Railway/Vercel va Telegram o'rtasida real-time aloqa)
app.post(['/api/biznesgo/telegram/webhook', '/api/biznesgo/bot/webhook'], async (req, res) => {
  const expectedSecret = getWebhookSecretToken();
  const incomingSecret = req.headers['x-telegram-bot-api-secret-token'];
  if (expectedSecret && incomingSecret && incomingSecret !== expectedSecret) {
    return res.status(403).send('Forbidden');
  }
  if (req.body) {
    try {
      await handleTelegramUpdate(req.body);
    } catch (err) {
      console.error('[Telegram Webhook Error]:', err.message);
    }
  }
  return res.status(200).send('OK');
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

if (require.main === module) {
  const primaryPort = Number(port) || 5001;
  app.listen(primaryPort, '0.0.0.0', () => {
    console.log(`[BiznesGO B2B Core] Server listening on port ${primaryPort}`);
    initDatabase();
    initTelegramBot();
  });

  // Railway Public Domain proxy port mosligini kafolatlash (5001 / 8080 / 3000)
  if (process.env.NODE_ENV === 'production') {
    for (const extraPort of [5001, 8080, 3000]) {
      if (extraPort !== primaryPort) {
        try {
          const extraServer = app.listen(extraPort, '0.0.0.0');
          extraServer.on('error', () => {});
        } catch (_) {}
      }
    }
  }
}

module.exports = { app, initDatabase, syncNeonBiznesGoMerchants };
