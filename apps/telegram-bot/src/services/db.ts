import pg from 'pg';
import jwt from 'jsonwebtoken';
import { config } from '../config.ts';

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === 'production';
let sslConfig: any = false;

if (config.databaseUrl) {
  if (config.databaseUrl.includes('railway.internal')) {
    sslConfig = false;
  } else if (config.databaseUrl.includes('sslmode=') || config.databaseUrl.includes('neon.tech') || config.databaseUrl.includes('supabase.co')) {
    sslConfig = { rejectUnauthorized: false };
  } else if (isProduction && !config.databaseUrl.includes('localhost') && !config.databaseUrl.includes('127.0.0.1')) {
    sslConfig = { rejectUnauthorized: false };
  }
}

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: sslConfig,
  connectionTimeoutMillis: 4000,
});

pool.on('error', (err: any) => {
  console.warn('[TelegramBot DB Pool] warning:', err.message);
});

export interface TenantData {
  id: string;
  name: string;
  phone: string;
  sector_type: string;
  address?: string;
  settings?: any;
}

export const dbService = {
  /**
   * Telegram ID yoki telefon raqam orqali korxona/foydalanuvchini topish
   */
  async findTenant(telegramId: number | string, phone?: string): Promise<TenantData | null> {
    const tgStr = String(telegramId);
    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
    const last9 = cleanPhone.slice(-9);

    try {
      const res = await pool.query(
        `SELECT id, name, phone, sector_type, address, settings FROM tenants
         WHERE (settings->>'telegram_id' = $1 OR address = 'tg:' || $1)
            OR (LENGTH($2) = 9 AND REGEXP_REPLACE(phone, '\\D', '', 'g') LIKE '%' || $2)
         ORDER BY created_at DESC LIMIT 1`,
        [tgStr, last9 || '___NOMATCH___']
      );

      if (res.rows.length > 0) {
        return res.rows[0];
      }
    } catch (err) {
      console.warn('[dbService.findTenant] error:', (err as any).message);
    }
    return null;
  },

  /**
   * Bugungi kassa va savdo tushumini hisoblash
   */
  async getTodaySales(tenantId: string) {
    try {
      const res = await pool.query(
        `SELECT 
          COALESCE(SUM(total_amount), 0) as total_amount,
          COALESCE(SUM(cash_amount), 0) as cash_amount,
          COALESCE(SUM(card_amount), 0) as card_amount,
          COALESCE(SUM(debt_amount), 0) as debt_amount,
          COUNT(id) as count
         FROM sales 
         WHERE (tenant_id = $1 OR merchant_id = $1) 
           AND DATE(created_at) = CURRENT_DATE`,
        [tenantId]
      );

      if (res.rows.length > 0) {
        const row = res.rows[0];
        const total = Number(row.total_amount) || 0;
        const cash = Number(row.cash_amount) || 0;
        const card = Number(row.card_amount) || 0;
        const debt = Number(row.debt_amount) || 0;
        const count = Number(row.count) || 0;
        const avgCheck = count > 0 ? Math.round(total / count) : 0;

        return {
          total,
          cash,
          card,
          debt,
          count,
          avgCheck,
        };
      }
    } catch (err) {
      console.warn('[dbService.getTodaySales] error:', (err as any).message);
    }

    return {
      total: 0,
      cash: 0,
      card: 0,
      debt: 0,
      count: 0,
      avgCheck: 0,
    };
  },

  /**
   * Qarzlar (Nasiyalar) holati
   */
  async getDebtSummary(tenantId: string) {
    try {
      const res = await pool.query(
        `SELECT 
          COALESCE(SUM(debt_balance), 0) as total_debt,
          COUNT(CASE WHEN debt_balance > 0 THEN 1 END) as debtor_count,
          COALESCE(SUM(CASE WHEN due_date IS NOT NULL AND due_date < CURRENT_DATE THEN debt_balance ELSE 0 END), 0) as overdue_debt,
          COUNT(CASE WHEN debt_balance > 0 AND due_date IS NOT NULL AND due_date < CURRENT_DATE THEN 1 END) as overdue_count
         FROM customers 
         WHERE (tenant_id = $1 OR merchant_id = $1)`,
        [tenantId]
      );

      if (res.rows.length > 0) {
        const r = res.rows[0];
        return {
          totalDebt: Number(r.total_debt) || 0,
          debtorCount: Number(r.debtor_count) || 0,
          overdueDebt: Number(r.overdue_debt) || 0,
          overdueCount: Number(r.overdue_count) || 0,
        };
      }
    } catch (err) {
      console.warn('[dbService.getDebtSummary] error:', (err as any).message);
    }

    return {
      totalDebt: 0,
      debtorCount: 0,
      overdueDebt: 0,
      overdueCount: 0,
    };
  },

  /**
   * Ombor holati (Tovar turlari, kam qolgan tovarlar)
   */
  async getInventorySummary(tenantId: string) {
    try {
      const res = await pool.query(
        `SELECT 
          COUNT(id) as total_products,
          COUNT(CASE WHEN stock <= 0 THEN 1 END) as out_of_stock,
          COUNT(CASE WHEN stock > 0 AND stock <= COALESCE(min_stock, 5) THEN 1 END) as low_stock,
          COUNT(CASE WHEN expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + 30 THEN 1 END) as expiring_soon
         FROM products 
         WHERE (tenant_id = $1 OR merchant_id = $1)`,
        [tenantId]
      );

      if (res.rows.length > 0) {
        const r = res.rows[0];
        return {
          totalProducts: Number(r.total_products) || 0,
          outOfStock: Number(r.out_of_stock) || 0,
          lowStock: Number(r.low_stock) || 0,
          expiringSoon: Number(r.expiring_soon) || 0,
        };
      }
    } catch (err) {
      console.warn('[dbService.getInventorySummary] error:', (err as any).message);
    }

    return {
      totalProducts: 0,
      outOfStock: 0,
      lowStock: 0,
      expiringSoon: 0,
    };
  },

  /**
   * Yangi biznesni bazaga to'liq saqlash va filial/omborni ochish
   */
  async registerTenant(params: {
    telegramId: number;
    fullName: string;
    phone: string;
    sector: string;
    storeName: string;
    region: string;
  }) {
    const { telegramId, fullName, phone, sector, storeName, region } = params;
    const tgStr = String(telegramId);
    const cleanPhone = phone.startsWith('+') ? phone : `+${phone}`;

    try {
      const settings = JSON.stringify({
        owner_name: fullName,
        telegram_id: tgStr,
        region,
        source: 'telegram_bot',
      });

      // 1. Tenants jadvaliga yozish
      const tenantRes = await pool.query(
        `INSERT INTO tenants (phone, name, sector_type, address, settings)
         VALUES ($1, $2, $3, $4, $5::jsonb)
         RETURNING id, phone, name, sector_type, address, settings`,
        [cleanPhone, storeName, sector, region, settings]
      );
      const tenant = tenantRes.rows[0];

      // 2. Merchants jadvali
      await pool.query(
        `INSERT INTO merchants (id, tenant_id, phone, name, business_type, address)
         VALUES ($1, $1, $2, $3, $4, $5)
         ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, tenant_id = EXCLUDED.tenant_id`,
        [tenant.id, cleanPhone, storeName, sector, `tg:${tgStr}`]
      );

      // 3. Bosh filial
      const bRes = await pool.query(
        `INSERT INTO branches (tenant_id, name, code, address, phone, is_main)
         VALUES ($1, 'Bosh Do''kon', 'MAIN', $2, $3, TRUE)
         RETURNING id`,
        [tenant.id, region, cleanPhone]
      );
      const branchId = bRes.rows[0].id;

      // 4. Asosiy ombor
      await pool.query(
        `INSERT INTO warehouses (tenant_id, branch_id, name, code, type)
         VALUES ($1, $2, 'Asosiy Ombor', 'WH-MAIN', 'main')`,
        [tenant.id, branchId]
      );

      // 5. Asosiy kassa
      await pool.query(
        `INSERT INTO cash_accounts (tenant_id, branch_id, name, account_type, balance)
         VALUES ($1, $2, 'Asosiy Kassa', 'cash', 0)`,
        [tenant.id, branchId]
      );

      // 6. User (Owner)
      await pool.query(
        `INSERT INTO users (tenant_id, branch_id, phone, full_name, role_code)
         VALUES ($1, $2, $3, $4, 'owner')`,
        [tenant.id, branchId, cleanPhone, fullName]
      );

      return tenant;
    } catch (err) {
      console.warn('[dbService.registerTenant] error:', (err as any).message);
      return {
        id: `tenant_${telegramId}`,
        name: storeName,
        phone: cleanPhone,
        sector_type: sector,
        address: region,
      };
    }
  },

  /**
   * Sessiya ma'lumotini olish
   */
  async getSession(token: string) {
    try {
      await pool.query(
        `CREATE TABLE IF NOT EXISTS biznesgo_reg_sessions (
          token TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )`
      );
      const res = await pool.query(
        `SELECT data FROM biznesgo_reg_sessions WHERE token = $1`,
        [token]
      );
      if (res.rows.length > 0) {
        return res.rows[0].data;
      }
    } catch (err) {
      console.warn('[dbService.getSession] error:', (err as any).message);
    }
    return null;
  },

  /**
   * Sessiyani tasdiqlash va JWT generatsiya qilish
   */
  async approveSession(token: string, approverTgId: number) {
    try {
      const session = await this.getSession(token);
      if (!session) return null;

      // Foydalanuvchini topish yoki yaratish
      let tenant = await this.findTenant(approverTgId, session.phone);
      if (!tenant) {
        tenant = {
          id: `t_${approverTgId}`,
          name: session.name || 'BiznesGO Do‘kon',
          phone: session.phone,
          sector_type: session.sector_type || 'pharmacy',
          address: session.address || 'O‘zbekiston',
        };
      }

      const jwtToken = jwt.sign(
        {
          id: tenant.id,
          tenant_id: tenant.id,
          phone: tenant.phone,
          name: tenant.name,
          sector_type: tenant.sector_type,
          business_type: tenant.sector_type,
          role_code: 'owner',
        },
        config.jwtSecret,
        { expiresIn: '30d' }
      );

      const updatedSession = {
        ...session,
        status: 'approved',
        jwtToken,
        tenant,
        approvedAt: Date.now(),
        approvedByTgId: approverTgId,
      };

      await pool.query(
        `UPDATE biznesgo_reg_sessions 
         SET data = $2::jsonb, updated_at = NOW() 
         WHERE token = $1`,
        [token, JSON.stringify(updatedSession)]
      );

      return { session: updatedSession, tenant, jwtToken };
    } catch (err) {
      console.error('[dbService.approveSession] error:', (err as any).message);
      return null;
    }
  },
};
