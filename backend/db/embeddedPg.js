const crypto = require('crypto');
const fs = require('fs');
const SHARED_DB_FILE = '/tmp/biznesgo_shared_db_v2.json';
const {
  NEON_BIZNESGO_MERCHANTS,
  NEON_LEGACY_MERCHANTS,
  NEON_SPECIALISTS,
  NEON_USERS,
  NEON_DATA_CONSENTS,
  NEON_BOT_STATES
} = require('./neonSeedData');

function genUuid() {
  return crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function addDaysISO(baseDateStr, days) {
  const d = baseDateStr ? new Date(baseDateStr) : new Date();
  d.setUTCDate(d.getUTCDate() + Number(days));
  return d.toISOString().split('T')[0];
}

function diffDays(dateStrA, dateStrB) {
  if (!dateStrA || !dateStrB) return null;
  const a = new Date(String(dateStrA).split('T')[0] + 'T00:00:00Z');
  const b = new Date(String(dateStrB).split('T')[0] + 'T00:00:00Z');
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

class EmbeddedPgDatabase {
  constructor() {
    this.tables = {
      tenants: [],
      merchants: [],
      branches: [],
      roles: [],
      permissions: [],
      role_permissions: [],
      users: NEON_USERS.map((u) => ({
        ...u,
        full_name: u.name,
        telegram_chat_id: u.telegram_id ? String(u.telegram_id) : null,
        role_code: 'owner',
        is_active: true
      })),
      units: [],
      product_categories: [],
      products: [],
      product_variants: [],
      suppliers: [],
      warehouses: [],
      stock_batches: [],
      inventory_movements: [],
      stock_balances: [],
      customers: [],
      debts: [],
      debt_payments: [],
      debt_transactions: [],
      shifts: [],
      sales: [],
      sale_items: [],
      payments: [],
      purchases: [],
      purchase_items: [],
      purchase_payments: [],
      cash_accounts: [],
      cash_transactions: [],
      notifications: [],
      audit_logs: [],
      biznesgo_merchants: NEON_BIZNESGO_MERCHANTS.map((r) => ({ ...r })),
      neon_legacy_merchants: NEON_LEGACY_MERCHANTS.map((r) => ({ ...r })),
      specialists: NEON_SPECIALISTS.map((r) => ({ ...r })),
      data_consents: NEON_DATA_CONSENTS.map((r) => ({ ...r })),
      bot_states: NEON_BOT_STATES.map((r) => ({ ...r })),
      bot_registration_sessions: [],
      deleted_profiles: []
    };

    // Pre-seed the 4 active BiznesGO stores in 0-state (0 products, 0 sales)
    const initialStores = [
      {
        id: '11111111-1111-4111-8111-111111111119',
        phone: '+998908383772',
        name: 'Agroz Farm',
        owner_name: 'Sohibjon Sulaymonov',
        telegram_id: '6724823030',
        region: 'Farg‘ona viloyati',
        district: 'toshloq',
        address: 'Farg‘ona viloyati, toshloq',
        created_at: '2026-10-17T11:19:36.254Z'
      },
      {
        id: '11111111-1111-4111-8111-111111111101',
        phone: '+998990390078',
        name: 'VET FORMULA (Азия Агро Кимие Инвесть)',
        owner_name: 'Адхамжон',
        telegram_id: '8970822162',
        region: "Farg'ona viloyati",
        district: 'Toshloq tumani',
        address: "Xonaqa ko'chasi, Arabmozor, Toshloq tumani, Farg'ona Viloyati, 151501, Oʻzbekiston",
        created_at: '2026-09-24T07:39:44.850Z'
      },
      {
        id: '11111111-1111-4111-8111-111111111102',
        phone: '+998999694939',
        name: 'Hasanov Shahzodbek (Agronom)',
        owner_name: 'Hasanov Shahzodbek',
        telegram_id: '708982356',
        region: 'Xorazm viloyati',
        district: 'Urganch tumani',
        address: "Xorazm viloyati, G'aybu, Urganch Tumani",
        created_at: '2026-10-09T07:19:10.919Z'
      },
      {
        id: '11111111-1111-4111-8111-111111111103',
        phone: '+998931146489',
        name: 'Erkin agro',
        owner_name: 'Mehmonov Xurshid',
        telegram_id: '5983375830',
        region: 'Buxoro viloyati',
        district: 'Buxoro shahri',
        address: 'Buxoro viloyati, Buxoro shahri',
        created_at: '2026-10-11T07:56:20.545Z'
      }
    ];

    for (const st of initialStores) {
      this.tables.tenants.push({
        id: st.id,
        name: st.name,
        phone: st.phone,
        address: st.address,
        sector_type: 'agro_vet',
        plan: 'standard',
        is_active: true,
        settings: {
          owner_name: st.owner_name,
          telegram_id: st.telegram_id,
          region: st.region,
          district: st.district,
          source: 'telegram_bot'
        },
        created_at: st.created_at,
        updated_at: st.created_at
      });
      this.tables.merchants.push({
        id: st.id,
        tenant_id: st.id,
        phone: st.phone,
        name: st.name,
        business_type: 'agro_vet',
        address: `tg:${st.telegram_id}`,
        created_at: st.created_at
      });
      const brId = genUuid();
      this.tables.branches.push({
        id: brId,
        tenant_id: st.id,
        name: "Bosh Do'kon",
        code: 'MAIN',
        phone: st.phone,
        address: st.address,
        is_main: true,
        created_at: st.created_at
      });
      this.tables.warehouses.push({
        id: genUuid(),
        tenant_id: st.id,
        branch_id: brId,
        name: 'Asosiy Ombor',
        code: 'WH-01',
        type: 'main',
        created_at: st.created_at
      });
      this.tables.cash_accounts.push({
        id: genUuid(),
        tenant_id: st.id,
        branch_id: brId,
        name: 'Asosiy Kassa',
        account_type: 'cash',
        balance: 0,
        created_at: st.created_at
      });
    }

    // Transaction mutex for pessimistic locking (SELECT ... FOR UPDATE)
    this._txLockOwner = null;
    this._txWaitQueue = [];
    this._loadOrSaveInitial();
  }

  _loadOrSaveInitial() {
    try {
      if (fs.existsSync(SHARED_DB_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(SHARED_DB_FILE, 'utf8'));
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.tenants) && parsed.tenants.length > 0) {
          this.tables = { ...this.tables, ...parsed };
          return;
        }
      }
      this.persistToDisk();
    } catch (_) {}
  }

  syncFromDisk() {
    try {
      if (fs.existsSync(SHARED_DB_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(SHARED_DB_FILE, 'utf8'));
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.tenants)) {
          this.tables = { ...this.tables, ...parsed };
        }
      }
    } catch (_) {}
  }

  persistToDisk() {
    try {
      fs.writeFileSync(SHARED_DB_FILE, JSON.stringify(this.tables));
    } catch (_) {}
  }

  cloneState() {
    const copy = {};
    for (const [k, rows] of Object.entries(this.tables)) {
      copy[k] = rows.map((r) => ({ ...r }));
    }
    return copy;
  }

  restoreState(snapshot) {
    for (const [k, rows] of Object.entries(snapshot)) {
      this.tables[k] = rows.map((r) => ({ ...r }));
    }
  }

  async acquireLock(client) {
    if (this._txLockOwner === client) return;
    while (this._txLockOwner && this._txLockOwner !== client) {
      await new Promise((resolve) => this._txWaitQueue.push(resolve));
    }
    this._txLockOwner = client;
  }

  releaseLock(client) {
    if (this._txLockOwner === client) {
      this._txLockOwner = null;
      while (this._txWaitQueue.length > 0) {
        const next = this._txWaitQueue.shift();
        next();
      }
    }
  }
}

class EmbeddedPgClient {
  constructor(db) {
    this.db = db;
    this.inTx = false;
    this.snapshot = null;
  }

  release() {
    if (this.inTx) {
      this.inTx = false;
      this.snapshot = null;
    }
    this.db.releaseLock(this);
  }

  async query(sqlText, params = []) {
    const rawSql = String(sqlText || '').trim();
    if (!rawSql) return { rows: [], rowCount: 0 };

    const upper = rawSql.toUpperCase();

    if (upper === 'BEGIN' || upper.startsWith('BEGIN;')) {
      this.inTx = true;
      return { rows: [], rowCount: 0 };
    }

    if (upper === 'COMMIT' || upper.startsWith('COMMIT;')) {
      this.inTx = false;
      this.snapshot = null;
      this.db.releaseLock(this);
      return { rows: [], rowCount: 0 };
    }

    if (upper === 'ROLLBACK' || upper.startsWith('ROLLBACK;')) {
      if (this.snapshot) {
        this.db.restoreState(this.snapshot);
      }
      this.inTx = false;
      this.snapshot = null;
      this.db.releaseLock(this);
      return { rows: [], rowCount: 0 };
    }

    const isForUpdate = /\bFOR\s+UPDATE\b/i.test(rawSql);
    const isWrite = /^\s*(INSERT|UPDATE|DELETE)\b/i.test(rawSql);

    if (this.inTx && (isForUpdate || isWrite)) {
      await this.db.acquireLock(this);
      if (!this.snapshot) {
        this.snapshot = this.db.cloneState();
      }
    }

    // DDL statements
    if (/^\s*(CREATE|ALTER|DROP|COMMENT)\b/i.test(rawSql)) {
      const createMatches = rawSql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/gi);
      for (const m of createMatches) {
        const tbl = m[1].toLowerCase();
        if (!this.db.tables[tbl]) this.db.tables[tbl] = [];
      }
      return { rows: [], rowCount: 0 };
    }

    if (/^\s*SELECT\s+1\b/i.test(rawSql) && !/\bFROM\b/i.test(rawSql)) {
      return { rows: [{ '?column?': 1 }], rowCount: 1 };
    }

    if (/^\s*SELECT\s+NOW\(\)/i.test(rawSql)) {
      return { rows: [{ now: new Date().toISOString() }], rowCount: 1 };
    }

    if (/^\s*INSERT\s+INTO\b/i.test(rawSql)) {
      if (!this.inTx) this.db.syncFromDisk();
      const res = this._handleInsert(rawSql, params);
      this.db.persistToDisk();
      return res;
    }

    if (/^\s*UPDATE\b/i.test(rawSql)) {
      if (!this.inTx) this.db.syncFromDisk();
      const res = this._handleUpdate(rawSql, params);
      this.db.persistToDisk();
      return res;
    }

    if (/^\s*DELETE\s+FROM\b/i.test(rawSql)) {
      if (!this.inTx) this.db.syncFromDisk();
      const res = this._handleDelete(rawSql, params);
      this.db.persistToDisk();
      return res;
    }

    if (/^\s*SELECT\b/i.test(rawSql)) {
      if (!this.inTx) this.db.syncFromDisk();
      return this._handleSelect(rawSql, params);
    }

    return { rows: [], rowCount: 0 };
  }

  _evalValueExpr(expr, params, currentRow = {}) {
    const t = expr.trim().replace(/::[a-zA-Z0-9_]+(\[\])?/g, '');
    if (/^\$\d+$/.test(t)) {
      const idx = parseInt(t.slice(1), 10) - 1;
      const val = params[idx];
      if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('[')) && expr.includes('::jsonb')) {
        try {
          return JSON.parse(val);
        } catch (_) {}
      }
      return val;
    }
    if (/^'([^']*(?:''[^']*)*)'$/.test(t)) {
      return t.slice(1, -1).replace(/''/g, "'");
    }
    if (/^TRUE$/i.test(t)) return true;
    if (/^FALSE$/i.test(t)) return false;
    if (/^NULL$/i.test(t)) return null;
    if (/^CURRENT_DATE\s*\+\s*(\d+)$/i.test(t)) {
      const m = t.match(/^CURRENT_DATE\s*\+\s*(\d+)$/i);
      return addDaysISO(todayISO(), Number(m[1]));
    }
    if (/^CURRENT_DATE\s*-\s*(\d+)$/i.test(t)) {
      const m = t.match(/^CURRENT_DATE\s*-\s*(\d+)$/i);
      return addDaysISO(todayISO(), -Number(m[1]));
    }
    if (/^CURRENT_DATE$/i.test(t)) return todayISO();
    if (/^(CURRENT_TIMESTAMP|NOW\(\))$/i.test(t)) return new Date().toISOString();
    if (/^gen_random_uuid\(\)$/i.test(t)) return genUuid();
    if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);

    const arithMatch = t.match(/^([a-zA-Z0-9_]+)\s*([+-])\s*(\$\d+|\d+(?:\.\d+)?)$/);
    if (arithMatch) {
      const col = arithMatch[1];
      const op = arithMatch[2];
      const rhs = this._evalValueExpr(arithMatch[3], params, currentRow);
      const lhs = Number(currentRow[col] || 0);
      return op === '+' ? lhs + Number(rhs) : lhs - Number(rhs);
    }

    const stockCaseMatch = t.match(/^CASE\s+WHEN\s+\(?\s*stock\s*-\s*(\$\d+|\d+)\s*\)?\s*<=\s*0\s+THEN\s+TRUE\s+ELSE\s+FALSE\s+END$/i);
    if (stockCaseMatch) {
      const deduct = Number(this._evalValueExpr(stockCaseMatch[1], params, currentRow));
      return (Number(currentRow.stock || 0) - deduct) <= 0;
    }

    if (/^CASE\s+WHEN\s+\$1\s*=\s*0\s+THEN\s+NULL\s+ELSE\s+COALESCE\(\$2,\s*due_date\)\s+END$/i.test(t)) {
      if (Number(params[0]) === 0) return null;
      return params[1] !== null && params[1] !== undefined ? params[1] : currentRow.due_date;
    }

    const coalMatch = t.match(/^COALESCE\(\s*([^,]+)\s*,\s*([a-zA-Z0-9_]+)\s*\)$/i);
    if (coalMatch) {
      const v1 = this._evalValueExpr(coalMatch[1], params, currentRow);
      return v1 !== null && v1 !== undefined ? v1 : currentRow[coalMatch[2]];
    }

    if (currentRow && Object.prototype.hasOwnProperty.call(currentRow, t)) {
      return currentRow[t];
    }

    return t;
  }

  _splitCsvSql(str) {
    const parts = [];
    let current = '';
    let depth = 0;
    let inQuote = false;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (ch === "'" && str[i - 1] !== '\\') {
        inQuote = !inQuote;
        current += ch;
      } else if (!inQuote && ch === '(') {
        depth++;
        current += ch;
      } else if (!inQuote && ch === ')') {
        depth--;
        current += ch;
      } else if (!inQuote && depth === 0 && ch === ',') {
        parts.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    if (current.trim()) parts.push(current.trim());
    return parts;
  }

  _handleInsert(sql, params) {
    const match = sql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES\s*\(([\s\S]+?)\)(?:\s+ON\s+CONFLICT[\s\S]*?)?(?:\s+RETURNING\s+([\s\S]+))?$/i);
    if (!match) {
      return { rows: [], rowCount: 0 };
    }
    const table = match[1].toLowerCase();
    const cols = this._splitCsvSql(match[2]).map((c) => c.trim());
    const valExprs = this._splitCsvSql(match[3]);
    const returningClause = match[4] ? match[4].trim() : null;

    if (!this.db.tables[table]) {
      this.db.tables[table] = [];
    }

    const row = {
      id: genUuid(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (table === 'tenants') {
      row.sector_type = 'agro_vet';
      row.plan = 'standard';
      row.is_active = true;
      row.settings = {};
    } else if (table === 'products') {
      row.unit = 'dona';
      row.category = 'Umumiy';
      row.cost_price = 0;
      row.price = 0;
      row.stock = 0;
      row.min_stock = 5;
      row.reorder_level = 10;
      row.is_out_of_stock = false;
      row.is_active = true;
      row.sector_type = 'agro_vet';
      row.sector_attributes = {};
    } else if (table === 'stock_batches') {
      row.quantity = 0;
      row.cost_price = 0;
      row.is_recalled = false;
      row.recall_reason = null;
      row.recalled_at = null;
    } else if (table === 'customers') {
      row.customer_type = 'fermer';
      row.credit_limit = 10000000;
      row.debt_balance = 0;
      row.status = 'active';
    } else if (table === 'debts') {
      row.status = 'active';
    } else if (table === 'sales') {
      row.cash_amount = 0;
      row.card_amount = 0;
      row.debt_amount = 0;
      row.discount_amount = 0;
      row.status = 'completed';
    }

    for (let i = 0; i < cols.length; i++) {
      const col = cols[i];
      const val = this._evalValueExpr(valExprs[i] || 'NULL', params, row);
      row[col] = val;
    }

    // Handle ON CONFLICT (phone) or ON CONFLICT (token) upsert for tenants, merchants, biznesgo_reg_sessions
    if ((table === 'tenants' || table === 'merchants') && row.phone) {
      const p9 = String(row.phone).replace(/\D/g, '').slice(-9);
      const existing = this.db.tables[table].find((r) => String(r.phone || '').replace(/\D/g, '').slice(-9) === p9);
      if (existing) {
        if (row.name) existing.name = row.name;
        if (row.address) existing.address = row.address;
        if (row.settings && typeof row.settings === 'object') {
          existing.settings = { ...(existing.settings || {}), ...row.settings };
        }
        return { rows: returningClause ? [{ ...existing }] : [], rowCount: 1 };
      }
    }

    if (table === 'products') {
      row.stock = Number(row.stock || 0);
      row.price = Number(row.price || 0);
      row.cost_price = Number(row.cost_price || 0);
      row.min_stock = Number(row.min_stock ?? 5);
      row.is_out_of_stock = row.stock <= 0;
      row.stock_status = row.stock <= 0 ? 'Qoldiq tugagan — buyurtma uchun mavjud' : 'Sotuvda mavjud';
    }

    this.db.tables[table].push(row);

    if (returningClause) {
      return { rows: [{ ...row }], rowCount: 1 };
    }
    return { rows: [], rowCount: 1 };
  }

  _matchesWhere(row, whereClause, params) {
    if (!whereClause) return true;
    const cleanWhere = whereClause
      .replace(/\bFOR\s+UPDATE\b/gi, '')
      .replace(/\bORDER\s+BY[\s\S]*$/i, '')
      .replace(/\bLIMIT\s+\d+[\s\S]*$/i, '')
      .trim();

    if (!cleanWhere) return true;

    // Special handling for phone/telegram lookup queries in auth.js, telegramBot.js, and super-adm/tenants.js
    if (/REGEXP_REPLACE\(phone/i.test(cleanWhere)) {
      const p1 = String(params[0] || '').replace(/\D/g, '').slice(-9);
      const p2 = params[1] ? String(params[1]) : null;
      const p3 = params[2] ? String(params[2]) : (params.length === 2 ? String(params[1] || '') : null);
      const rowP9 = String(row.phone || '').replace(/\D/g, '').slice(-9);
      if (p1 && p1.length === 9 && rowP9 === p1) return true;
      if (p2 && row.phone === p2) return true;
      const rowTg = row.telegram_id || row.telegram_chat_id || (row.settings && row.settings.telegram_id) || (row.address && String(row.address).startsWith('tg:') ? String(row.address).slice(3) : null);
      if (p3 && rowTg && String(rowTg) === String(p3)) return true;
      return false;
    }

    // ANY($1::uuid[])
    if (/ANY\(\$1::uuid\[\]\)/i.test(cleanWhere)) {
      const ids = Array.isArray(params[0]) ? params[0].map(String) : [String(params[0])];
      return ids.includes(String(row.tenant_id)) || ids.includes(String(row.merchant_id)) || ids.includes(String(row.id));
    }

    // Split top-level AND
    const conds = [];
    let cur = '';
    let depth = 0;
    let inQuote = false;
    for (let i = 0; i < cleanWhere.length; i++) {
      const ch = cleanWhere[i];
      if (ch === "'") inQuote = !inQuote;
      if (!inQuote && ch === '(') depth++;
      if (!inQuote && ch === ')') depth--;
      if (!inQuote && depth === 0 && /^AND\b/i.test(cleanWhere.slice(i)) && (i === 0 || /\s/.test(cleanWhere[i - 1]))) {
        conds.push(cur.trim());
        cur = '';
        i += 2;
        continue;
      }
      cur += ch;
    }
    if (cur.trim()) conds.push(cur.trim());

    for (let cond of conds) {
      if (cond.startsWith('(') && cond.endsWith(')')) {
        cond = cond.slice(1, -1).trim();
      }

      const tenantOrMerchant = cond.match(/^(?:[a-z]+\.)?(?:tenant_id|merchant_id)\s*=\s*(\$\d+)\s+OR\s+(?:[a-z]+\.)?(?:merchant_id|tenant_id)\s*=\s*\1$/i);
      if (tenantOrMerchant) {
        const val = this._evalValueExpr(tenantOrMerchant[1], params, row);
        if (String(row.tenant_id) !== String(val) && String(row.merchant_id) !== String(val)) return false;
        continue;
      }

      if (/\bILIKE\b/i.test(cond)) {
        const paramMatch = cond.match(/\$(\d+)/);
        const pattern = paramMatch ? String(params[Number(paramMatch[1]) - 1] || '').replace(/%/g, '').toLowerCase() : '';
        if (pattern) {
          const hay = [
            row.name,
            row.barcode,
            row.sku,
            row.active_ingredient,
            row.batch_number,
            row.brand,
            row.phone,
            row.farm_profile,
            row.notes
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (!hay.includes(pattern)) return false;
        }
        continue;
      }

      if (/DATE\((?:[a-z]+\.)?created_at\)\s*=\s*CURRENT_DATE/i.test(cond)) {
        const rowDate = String(row.created_at || '').split('T')[0];
        if (rowDate !== todayISO()) return false;
        continue;
      }

      const isNotNull = cond.match(/^(?:[a-z]+\.)?([a-zA-Z0-9_]+)\s+IS\s+NOT\s+NULL$/i);
      if (isNotNull) {
        const v = row[isNotNull[1]];
        if (v === null || v === undefined || v === '') return false;
        continue;
      }
      const isNull = cond.match(/^(?:[a-z]+\.)?([a-zA-Z0-9_]+)\s+IS\s+NULL$/i);
      if (isNull) {
        const v = row[isNull[1]];
        if (v !== null && v !== undefined && v !== '') return false;
        continue;
      }

      const inMatch = cond.match(/^(?:[a-z]+\.)?([a-zA-Z0-9_]+)\s+IN\s*\(([^)]+)\)$/i);
      if (inMatch) {
        const col = inMatch[1];
        const allowed = this._splitCsvSql(inMatch[2]).map((x) => this._evalValueExpr(x, params, row));
        if (!allowed.includes(row[col])) return false;
        continue;
      }

      const expDiffMatch = cond.match(/^\(?\s*expiry_date\s*-\s*CURRENT_DATE\s*\)?\s*(<=|<|>=|>|=)\s*(\d+)$/i);
      if (expDiffMatch) {
        if (!row.expiry_date) return false;
        const d = diffDays(row.expiry_date, todayISO());
        const op = expDiffMatch[1];
        const num = Number(expDiffMatch[2]);
        if (op === '<=' && !(d <= num)) return false;
        if (op === '<' && !(d < num)) return false;
        if (op === '>=' && !(d >= num)) return false;
        if (op === '>' && !(d > num)) return false;
        if (op === '=' && !(d === num)) return false;
        continue;
      }

      const dueDiffMatch = cond.match(/^\(?\s*CURRENT_DATE\s*-\s*due_date\s*\)?\s*(<=|<|>=|>|=)\s*(\d+)$/i);
      if (dueDiffMatch) {
        if (!row.due_date) return false;
        const d = diffDays(todayISO(), row.due_date);
        const op = dueDiffMatch[1];
        const num = Number(dueDiffMatch[2]);
        if (op === '<=' && !(d <= num)) return false;
        if (op === '<' && !(d < num)) return false;
        if (op === '>=' && !(d >= num)) return false;
        if (op === '>' && !(d > num)) return false;
        if (op === '=' && !(d === num)) return false;
        continue;
      }

      const cmpMatch = cond.match(/^(?:[a-z]+\.)?([a-zA-Z0-9_]+)\s*(<=|>=|<>|!=|<|>|=)\s*(.+)$/);
      if (cmpMatch) {
        const col = cmpMatch[1];
        const op = cmpMatch[2];
        const rhs = this._evalValueExpr(cmpMatch[3], params, row);
        const lhs = row[col];

        if ((col.includes('date') || col.endsWith('_at')) && lhs && rhs) {
          const lStr = String(lhs).split('T')[0];
          const rStr = String(rhs).split('T')[0];
          if (op === '=' && !(lStr === rStr)) return false;
          if (op === '<' && !(lStr < rStr)) return false;
          if (op === '<=' && !(lStr <= rStr)) return false;
          if (op === '>' && !(lStr > rStr)) return false;
          if (op === '>=' && !(lStr >= rStr)) return false;
          if ((op === '!=' || op === '<>') && !(lStr !== rStr)) return false;
          continue;
        }

        const bothNumeric = typeof lhs === 'number' || typeof rhs === 'number' || (!isNaN(Number(lhs)) && !isNaN(Number(rhs)) && lhs !== null && rhs !== null && lhs !== '' && rhs !== '' && typeof lhs !== 'boolean' && typeof rhs !== 'boolean');
        const a = bothNumeric ? Number(lhs) : lhs;
        const b = bothNumeric ? Number(rhs) : rhs;

        if (op === '=' && String(a) !== String(b)) return false;
        if ((op === '!=' || op === '<>') && String(a) === String(b)) return false;
        if (op === '<' && !(a < b)) return false;
        if (op === '<=' && !(a <= b)) return false;
        if (op === '>' && !(a > b)) return false;
        if (op === '>=' && !(a >= b)) return false;
        continue;
      }
    }

    return true;
  }

  _handleUpdate(sql, params) {
    const match = sql.match(/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+([\s\S]+?)(?:\s+WHERE\s+([\s\S]+?))?(?:\s+RETURNING\s+([\s\S]+))?$/i);
    if (!match) return { rows: [], rowCount: 0 };

    const table = match[1].toLowerCase();
    const setPart = match[2].trim();
    const wherePart = match[3] ? match[3].trim() : '';
    const returningPart = match[4] ? match[4].trim() : null;

    const rows = this.db.tables[table] || [];
    const assignments = this._splitCsvSql(setPart);
    const updatedRows = [];

    for (const row of rows) {
      if (this._matchesWhere(row, wherePart, params)) {
        for (const assign of assignments) {
          const eqIdx = assign.indexOf('=');
          if (eqIdx === -1) continue;
          const col = assign.slice(0, eqIdx).trim();
          const expr = assign.slice(eqIdx + 1).trim();
          row[col] = this._evalValueExpr(expr, params, row);
        }
        if (table === 'products') {
          row.stock = Number(row.stock || 0);
          row.is_out_of_stock = row.stock <= 0;
          row.stock_status = row.stock <= 0 ? 'Qoldiq tugagan — buyurtma uchun mavjud' : 'Sotuvda mavjud';
        }
        row.updated_at = new Date().toISOString();
        updatedRows.push({ ...row });
      }
    }

    return {
      rows: returningPart ? updatedRows : [],
      rowCount: updatedRows.length
    };
  }

  _handleDelete(sql, params) {
    const match = sql.match(/DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+([\s\S]+))?$/i);
    if (!match) return { rows: [], rowCount: 0 };
    const table = match[1].toLowerCase();
    const wherePart = match[2] ? match[2].trim() : '';
    const rows = this.db.tables[table] || [];
    const kept = [];
    let deleted = 0;
    for (const row of rows) {
      if (this._matchesWhere(row, wherePart, params)) {
        deleted++;
      } else {
        kept.push(row);
      }
    }
    this.db.tables[table] = kept;
    return { rows: [], rowCount: deleted };
  }

  _handleSelect(sql, params) {
    const today = todayISO();

    // 0. Super Admin Dashboard tenants LEFT JOIN merchants
    if (/FROM\s+tenants\s+t\s+LEFT\s+JOIN\s+merchants\s+m/i.test(sql)) {
      const tenants = this.db.tables.tenants || [];
      const merchants = this.db.tables.merchants || [];
      const rows = tenants
        .map((t) => {
          const m = merchants.find((x) => x.tenant_id === t.id || x.phone === t.phone);
          return {
            ...t,
            merchant_addr: m ? m.address : null
          };
        })
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      return { rows, rowCount: rows.length };
    }

    // 0.5. COUNT(*) FROM products
    if (/SELECT\s+COUNT\(\*\)\s+FROM\s+products/i.test(sql)) {
      const whereMatch = sql.match(/WHERE\s+([\s\S]+)$/i);
      const wherePart = whereMatch ? whereMatch[1].trim() : '';
      const count = (this.db.tables.products || []).filter((p) => this._matchesWhere(p, wherePart, params)).length;
      return { rows: [{ count: String(count) }], rowCount: 1 };
    }

    // 1. Dashboard /Sales today aggregate
    if (/FROM\s+sales\b/i.test(sql) && /SUM\(total_amount\)/i.test(sql)) {
      const tenantId = params[0];
      const sales = (this.db.tables.sales || []).filter(
        (s) => (String(s.tenant_id) === String(tenantId) || String(s.merchant_id) === String(tenantId)) &&
               String(s.created_at || '').split('T')[0] === today
      );
      return {
        rows: [{
          total_revenue: sales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0),
          cash_revenue: sales.reduce((acc, s) => acc + Number(s.cash_amount || 0), 0),
          card_revenue: sales.reduce((acc, s) => acc + Number(s.card_amount || 0), 0),
          debt_revenue: sales.reduce((acc, s) => acc + Number(s.debt_amount || 0), 0),
          total_receipts: sales.length,
          new_debts_count: sales.filter((s) => Number(s.debt_amount || 0) > 0 || s.payment_type === 'debt').length
        }],
        rowCount: 1
      };
    }

    // 2. Dashboard Expiry Intervals aggregate
    if (/FROM\s+products\b/i.test(sql) && /expired_count/i.test(sql)) {
      const tenantId = params[0];
      const prods = (this.db.tables.products || []).filter(
        (p) => (String(p.tenant_id) === String(tenantId) || String(p.merchant_id) === String(tenantId)) &&
               Number(p.stock) > 0 && p.expiry_date
      );
      let expired_count = 0;
      let critical_7_count = 0;
      let critical_30_count = 0;
      let warning_60_count = 0;
      let warning_90_count = 0;

      for (const p of prods) {
        const d = diffDays(p.expiry_date, today);
        if (d < 0) expired_count++;
        else if (d <= 7) {
          critical_7_count++;
          critical_30_count++;
        } else if (d <= 30) {
          critical_30_count++;
        } else if (d <= 60) {
          warning_60_count++;
        } else if (d <= 90) {
          warning_90_count++;
        }
      }
      return {
        rows: [{ expired_count, critical_7_count, critical_30_count, warning_60_count, warning_90_count }],
        rowCount: 1
      };
    }

    // 3. Dashboard Low Stock / Out of Stock aggregate
    if (/FROM\s+products\b/i.test(sql) && /out_of_stock_count/i.test(sql)) {
      const tenantId = params[0];
      const prods = (this.db.tables.products || []).filter(
        (p) => String(p.tenant_id) === String(tenantId) || String(p.merchant_id) === String(tenantId)
      );
      return {
        rows: [{
          out_of_stock_count: prods.filter((p) => Number(p.stock) <= 0).length,
          low_stock_count: prods.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= Number(p.min_stock ?? 5)).length
        }],
        rowCount: 1
      };
    }

    // 4. Dashboard & Debts Summary
    if (/FROM\s+customers\b/i.test(sql) && /total_debt_balance/i.test(sql)) {
      const tenantId = params[0];
      const custs = (this.db.tables.customers || []).filter(
        (c) => String(c.tenant_id) === String(tenantId) || String(c.merchant_id) === String(tenantId)
      );
      let total_debt_balance = 0;
      let debtor_count = 0;
      let overdue_debt_balance = 0;
      let overdue_debtors_count = 0;
      let urgent_debt_balance = 0;
      let due_today_debt = 0;
      let due_today_count = 0;
      let overdue_3_days_debt = 0;
      let overdue_3_days_count = 0;
      let overdue_30_days_debt = 0;
      let overdue_30_days_count = 0;

      for (const c of custs) {
        const bal = Number(c.debt_balance || 0);
        if (bal > 0) {
          total_debt_balance += bal;
          debtor_count++;
          if (c.due_date) {
            const overdueDays = diffDays(today, c.due_date);
            if (overdueDays === 0) {
              due_today_debt += bal;
              due_today_count++;
              urgent_debt_balance += bal;
            } else if (overdueDays > 0) {
              overdue_debt_balance += bal;
              overdue_debtors_count++;
              if (overdueDays > 30) {
                overdue_30_days_debt += bal;
                overdue_30_days_count++;
              } else if (overdueDays >= 3) {
                overdue_3_days_debt += bal;
                overdue_3_days_count++;
              }
            } else if (overdueDays >= -3) {
              urgent_debt_balance += bal;
            }
          }
        }
      }

      return {
        rows: [{
          total_debt_balance,
          debtor_count,
          total_debtors: debtor_count,
          overdue_debt_balance,
          overdue_debtors_count,
          urgent_debt_balance,
          due_today_debt,
          due_today_count,
          overdue_3_days_debt,
          overdue_3_days_count,
          overdue_30_days_debt,
          overdue_30_days_count
        }],
        rowCount: 1
      };
    }

    // 5. Dashboard Gross Profit aggregate
    if (/FROM\s+sale_items\s+si/i.test(sql) && /today_profit/i.test(sql)) {
      const tenantId = params[0];
      const todaySalesIds = new Set(
        (this.db.tables.sales || [])
          .filter((s) => (String(s.tenant_id) === String(tenantId) || String(s.merchant_id) === String(tenantId)) &&
                         String(s.created_at || '').split('T')[0] === today)
          .map((s) => s.id)
      );
      const items = (this.db.tables.sale_items || []).filter((si) => todaySalesIds.has(si.sale_id));
      const today_profit = items.reduce(
        (sum, si) => sum + (Number(si.price || 0) - Number(si.cost_price || 0)) * Number(si.quantity || 0),
        0
      );
      return { rows: [{ today_profit }], rowCount: 1 };
    }

    // 6. Sales History JOIN customers
    if (/FROM\s+sales\s+s\s+LEFT\s+JOIN\s+customers\s+c/i.test(sql)) {
      const tenantId = params[0];
      const sales = (this.db.tables.sales || [])
        .filter((s) => String(s.tenant_id) === String(tenantId) || String(s.merchant_id) === String(tenantId))
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
        .slice(0, 50)
        .map((s) => {
          const cust = (this.db.tables.customers || []).find((c) => c.id === s.customer_id);
          return {
            ...s,
            customer_name: cust?.name || null,
            customer_phone: cust?.phone || null,
            farm_profile: cust?.farm_profile || null
          };
        });
      return { rows: sales, rowCount: sales.length };
    }

    // Generic single-table SELECT
    const fromMatch = sql.match(/FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+([\s\S]+?))?(?:\s+ORDER\s+BY\s+([\s\S]+?))?(?:\s+LIMIT\s+(\d+))?(?:\s+FOR\s+UPDATE)?\s*$/i);
    if (!fromMatch) {
      return { rows: [], rowCount: 0 };
    }

    const table = fromMatch[1].toLowerCase();
    let wherePart = fromMatch[2] || '';
    let orderPart = fromMatch[3] || '';
    let limitNum = fromMatch[4] ? parseInt(fromMatch[4], 10) : null;

    const orderSplit = wherePart.split(/\bORDER\s+BY\b/i);
    if (orderSplit.length > 1) {
      wherePart = orderSplit[0].trim();
      orderPart = orderSplit[1].replace(/\bFOR\s+UPDATE\b/gi, '').trim();
    }
    const limitSplit = orderPart.split(/\bLIMIT\b/i);
    if (limitSplit.length > 1) {
      orderPart = limitSplit[0].trim();
      limitNum = parseInt(limitSplit[1].trim(), 10);
    }

    const rawRows = this.db.tables[table] || [];
    let filtered = rawRows
      .filter((r) => this._matchesWhere(r, wherePart, params))
      .map((r) => this._enrichProjectedRow(table, r, today));

    if (orderPart) {
      const firstOrder = this._splitCsvSql(orderPart)[0] || '';
      const om = firstOrder.match(/^([a-zA-Z0-9_]+)(?:\s+(ASC|DESC))?/i);
      if (om) {
        const col = om[1];
        const dir = (om[2] || 'ASC').toUpperCase() === 'DESC' ? -1 : 1;
        filtered.sort((a, b) => {
          const va = a[col];
          const vb = b[col];
          if (va === null || va === undefined) return 1;
          if (vb === null || vb === undefined) return -1;
          if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
          return String(va).localeCompare(String(vb)) * dir;
        });
      }
    }

    if (limitNum !== null && !isNaN(limitNum)) {
      filtered = filtered.slice(0, limitNum);
    }

    return { rows: filtered, rowCount: filtered.length };
  }

  _enrichProjectedRow(table, row, today) {
    const out = { ...row };
    if (out.expiry_date) {
      out.expiry_date = String(out.expiry_date).split('T')[0];
    }
    if (out.due_date) {
      out.due_date = String(out.due_date).split('T')[0];
    }

    if (table === 'products') {
      const stockNum = Number(out.stock || 0);
      out.is_out_of_stock = stockNum <= 0;
      out.stock_status = stockNum <= 0
        ? 'Qoldiq tugagan — buyurtma uchun mavjud'
        : stockNum <= Number(out.min_stock ?? 5)
        ? 'Minimal qoldiqdan past'
        : 'Sotuvda mavjud';

      if (out.expiry_date) {
        const d = diffDays(out.expiry_date, today);
        out.days_to_expiry = d;
        if (d < 0) {
          out.expiry_status = 'expired';
          out.status = 'expired';
        } else if (d <= 7) {
          out.expiry_status = 'critical_7';
          out.status = 'critical_7';
        } else if (d <= 30) {
          out.expiry_status = 'critical';
          out.status = 'critical_30';
        } else if (d <= 60) {
          out.expiry_status = 'warning_60';
        } else if (d <= 90) {
          out.expiry_status = 'warning_90';
        } else {
          out.expiry_status = 'normal';
        }
      } else {
        out.days_to_expiry = null;
        out.expiry_status = 'normal';
      }
    }

    if (table === 'customers') {
      const bal = Number(out.debt_balance || 0);
      if (out.due_date) {
        const over = diffDays(today, out.due_date);
        out.days_overdue = over;
        if (bal <= 0) out.status = 'closed';
        else if (over > 30) out.status = 'critical_overdue';
        else if (over > 0) out.status = 'overdue';
        else if (over >= -3) out.status = 'urgent';
        else out.status = 'normal';
      } else {
        out.days_overdue = 0;
        out.status = bal <= 0 ? 'closed' : 'normal';
      }
    }

    return out;
  }
}

class EmbeddedPgPool {
  constructor() {
    this.db = new EmbeddedPgDatabase();
  }

  async connect() {
    return new EmbeddedPgClient(this.db);
  }

  async query(sql, params = []) {
    const client = await this.connect();
    try {
      return await client.query(sql, params);
    } finally {
      client.release();
    }
  }

  async end() {
    return;
  }

  on() {
    return this;
  }
}

module.exports = { EmbeddedPgPool };
