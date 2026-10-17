import test from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import {
  BIZNESGO_MERCHANT_TYPES,
  getBiznesGoBotToken,
  hashSessionToken,
} from '../dist/lib/biznesgo-auth.js';
import { ensureSameMerchant } from '../dist/routes/biznesgo/middleware.js';
import { isPartnerDemoAllowed } from '../dist/lib/security-flags.js';
import { verifyTelegramWebAppData } from '../dist/lib/tg-auth.js';

test('BIZNESGO_MERCHANT_TYPES contains exactly the 6 required merchant types', () => {
  const expectedTypes = [
    'agro_shop',
    'veterinary_pharmacy',
    'feed_store',
    'warehouse',
    'seed_seedling_store',
    'equipment_store',
  ];

  assert.strictEqual(BIZNESGO_MERCHANT_TYPES.length, 6);
  for (const t of expectedTypes) {
    assert.strictEqual(BIZNESGO_MERCHANT_TYPES.includes(t), true, `Missing merchant type: ${t}`);
  }
});

test('hashSessionToken hashes token with sha256 hex format', () => {
  const rawToken = 'test-secret-token-12345';
  const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  assert.strictEqual(hashSessionToken(rawToken), expectedHash);
  assert.strictEqual(hashSessionToken(rawToken).length, 64);
});

test('getBiznesGoBotToken reads BIZNESGO_BOT_TOKEN from environment', () => {
  const origBiznesToken = process.env.BIZNESGO_BOT_TOKEN;
  const origAuthToken = process.env.TELEGRAM_AUTH_BOT_TOKEN;

  try {
    process.env.BIZNESGO_BOT_TOKEN = 'biznes-token-123';
    process.env.TELEGRAM_AUTH_BOT_TOKEN = 'auth-token-456';
    assert.strictEqual(getBiznesGoBotToken(), 'biznes-token-123');

    delete process.env.BIZNESGO_BOT_TOKEN;
    assert.strictEqual(getBiznesGoBotToken(), 'auth-token-456');

    delete process.env.TELEGRAM_AUTH_BOT_TOKEN;
    assert.strictEqual(getBiznesGoBotToken(), '');
  } finally {
    if (origBiznesToken !== undefined) process.env.BIZNESGO_BOT_TOKEN = origBiznesToken;
    else delete process.env.BIZNESGO_BOT_TOKEN;
    if (origAuthToken !== undefined) process.env.TELEGRAM_AUTH_BOT_TOKEN = origAuthToken;
    else delete process.env.TELEGRAM_AUTH_BOT_TOKEN;
  }
});

test('ensureSameMerchant strictly blocks cross-merchant access with 403', () => {
  let statusCode = 200;
  let jsonResponse = null;

  const mockRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonResponse = payload;
      return this;
    },
  };

  // 1. Same merchant access -> passes
  const validReq = {
    merchant: { id: 42, name: 'Sotuvchi 1' },
    params: { id: '42' },
    body: {},
    query: {},
  };
  const verified = ensureSameMerchant(validReq, mockRes);
  assert.strictEqual(verified.id, 42);

  // 2. Cross-merchant access -> 403 Forbidden
  const evilReq = {
    merchant: { id: 42, name: 'Sotuvchi 1' },
    params: { id: '99' },
    body: {},
    query: {},
  };
  statusCode = 200;
  jsonResponse = null;
  const blocked = ensureSameMerchant(evilReq, mockRes);
  assert.strictEqual(blocked, null);
  assert.strictEqual(statusCode, 403);
  assert.strictEqual(jsonResponse.ok, false);
  assert.strictEqual(jsonResponse.error, "Boshqa sotuvchiga tegishli ma'lumotga kirish taqiqlangan");

  // 3. Foreign merchantId in request body -> 403 Forbidden
  const bodyHijackReq = {
    merchant: { id: 42, name: 'Sotuvchi 1' },
    params: {},
    body: { merchantId: 101 },
    query: {},
  };
  statusCode = 200;
  jsonResponse = null;
  const blockedBody = ensureSameMerchant(bodyHijackReq, mockRes);
  assert.strictEqual(blockedBody, null);
  assert.strictEqual(statusCode, 403);
});

test('ensureSameMerchant rejects unauthenticated requests with 401', () => {
  let statusCode = 200;
  let jsonResponse = null;

  const mockRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonResponse = payload;
      return this;
    },
  };

  const unauthReq = {
    merchant: null,
    params: {},
    body: {},
    query: {},
  };

  const result = ensureSameMerchant(unauthReq, mockRes);
  assert.strictEqual(result, null);
  assert.strictEqual(statusCode, 401);
  assert.strictEqual(jsonResponse.ok, false);
});

test('dev-demo check strictly blocks demo access in production', () => {
  const origNodeEnv = process.env.NODE_ENV;
  const origDemoFlag = process.env.ALLOW_PARTNER_DEMO;

  try {
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_PARTNER_DEMO = 'true';
    assert.strictEqual(isPartnerDemoAllowed(), false, 'Demo access must be blocked in production');

    process.env.NODE_ENV = 'development';
    process.env.ALLOW_PARTNER_DEMO = 'false';
    assert.strictEqual(isPartnerDemoAllowed(), false, 'Demo access disabled if flag is false');

    process.env.NODE_ENV = 'development';
    process.env.ALLOW_PARTNER_DEMO = 'true';
    assert.strictEqual(isPartnerDemoAllowed(), true, 'Demo allowed only in dev with flag');
  } finally {
    process.env.NODE_ENV = origNodeEnv;
    process.env.ALLOW_PARTNER_DEMO = origDemoFlag;
  }
});

test('verifyTelegramWebAppData rejects tampered initData', () => {
  const botToken = '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ';
  const fakeInitData = 'query_id=AAHdF6IQAAAAAN0XohBkXJd_&user=%7B%22id%22%3A123456%7D&auth_date=1700000000&hash=tampered_hash_value';
  const result = verifyTelegramWebAppData(fakeInitData, botToken);
  assert.strictEqual(result, false, 'Tampered hash must be rejected');
});

test('BIZNESGO_MERCHANT_TYPE_LABELS has readable labels for all merchant types', async () => {
  const { BIZNESGO_MERCHANT_TYPE_LABELS } = await import('../dist/lib/biznesgo-bot-flow.js');
  for (const t of BIZNESGO_MERCHANT_TYPES) {
    assert.strictEqual(typeof BIZNESGO_MERCHANT_TYPE_LABELS[t], 'string');
    assert.ok(BIZNESGO_MERCHANT_TYPE_LABELS[t].length > 3);
  }
});

test('BiznesGO Drizzle schema exports all 10 clean BiznesGO tables and migration SQL is idempotent', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const schema = await import('../dist/db/schema.js');

  const requiredSchemaExports = [
    'biznesgoMerchants',
    'biznesgoSessions',
    'biznesgoProducts',
    'biznesgoCustomers',
    'biznesgoDebts',
    'biznesgoDebtPayments',
    'biznesgoPosSales',
    'biznesgoPosSaleItems',
    'biznesgoOrders',
    'biznesgoOrderItems',
  ];

  for (const exportName of requiredSchemaExports) {
    assert.ok(schema[exportName], `Missing Drizzle table export: ${exportName}`);
  }

  const sqlPath = path.resolve(process.cwd(), 'drizzle/0018_biznesgo_merchants_and_sessions.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  const expectedSqlTables = [
    'biznesgo_merchants',
    'biznesgo_sessions',
    'biznesgo_products',
    'biznesgo_customers',
    'biznesgo_debts',
    'biznesgo_debt_payments',
    'biznesgo_pos_sales',
    'biznesgo_pos_sale_items',
    'biznesgo_orders',
    'biznesgo_order_items',
  ];

  for (const tbl of expectedSqlTables) {
    assert.ok(
      sqlContent.includes(`CREATE TABLE IF NOT EXISTS ${tbl}`),
      `Missing idempotent CREATE TABLE IF NOT EXISTS for ${tbl}`
    );
  }

  // Must not include legacy pharmacies/medicines tables
  assert.strictEqual(sqlContent.includes('CREATE TABLE pharmacies'), false);
  assert.strictEqual(sqlContent.includes('CREATE TABLE medicines'), false);
});
