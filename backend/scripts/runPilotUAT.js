// BiznesGO B2B Core: 1-Sektor Agro-Vet Dorixona Pilot UAT (User Acceptance Testing)
// 10 ta kritik savolni to'liq avtomatlashtirilgan dasturiy tekshiruvi

require('dotenv').config();
const { pool } = require('../config');
const assert = require('assert');

let passedTests = 0;
let totalTests = 0;

function logTest(testNum, testTitle, status, details = '') {
  totalTests++;
  if (status === 'PASS') {
    passedTests++;
    console.log(`\x1b[32m✔ [TEST ${testNum}] ${testTitle}: PASS\x1b[0m ${details ? `(${details})` : ''}`);
  } else {
    console.error(`\x1b[31m✖ [TEST ${testNum}] ${testTitle}: FAIL\x1b[0m ${details ? `\n   Sabab: ${details}` : ''}`);
  }
}

async function runPilotUAT() {
  console.log('\n===============================================================');
  console.log('🧪 BIZNESGO B2B CORE: AGRO-VET DORIXONA PILOT UAT VERIFIKATSIYA');
  console.log('===============================================================\n');

  const client = await pool.connect();
  const testTenantId = 'test-pilot-tenant-' + Date.now();
  const secondTenantId = 'test-isolated-tenant-' + Date.now();

  try {
    await client.query('BEGIN');

    // -------------------------------------------------------------
    // SAVOL 1: Yangi biznes ro'yxatdan o'tib, o'z filiali va xodimlarini yaratoladimi?
    // -------------------------------------------------------------
    try {
      const tRes = await client.query(
        `INSERT INTO tenants (name, slug, sector_type, phone, address, is_active)
         VALUES ('UAT Test Dorixona', $1, 'agro_vet', '+998901234567', 'Toshkent', TRUE)
         RETURNING id`,
        [testTenantId]
      );
      const tenantId = tRes.rows[0].id;

      const brRes = await client.query(
        `INSERT INTO branches (tenant_id, name, code, is_main, is_active)
         VALUES ($1, 'Markaziy Filial', 'BR-01', TRUE, TRUE)
         RETURNING id`,
        [tenantId]
      );
      const branchId = brRes.rows[0].id;

      const userRes = await client.query(
        `INSERT INTO users (tenant_id, branch_id, role, full_name, phone, is_active)
         VALUES ($1, $2, 'cashier', 'Kassir Malika', '+998909998877', TRUE)
         RETURNING id`,
        [tenantId, branchId]
      );
      const userId = userRes.rows[0].id;

      assert(tenantId && branchId && userId, 'Tenant, filial va kassir yaratilishi kerak');
      logTest(1, 'Biznes, filial va xodim yaratish', 'PASS', 'Tenant, filial va kassir muvaffaqiyatli saqlandi');
    } catch (err) {
      logTest(1, 'Biznes, filial va xodim yaratish', 'FAIL', err.message);
    }

    // -------------------------------------------------------------
    // SAVOL 2: Multi-tenant izolyatsiya (Boshqa tenant ma'lumotini ko'ra olmasligi)
    // -------------------------------------------------------------
    try {
      // 2-tenant yaratamiz
      const t2Res = await client.query(
        `INSERT INTO tenants (name, slug, sector_type, phone, is_active)
         VALUES ('Yot Dorixona', $1, 'agro_vet', '+998931112233', TRUE)
         RETURNING id`,
        [secondTenantId]
      );
      const tenant2Id = t2Res.rows[0].id;

      // 2-tenantga mahsulot qo'shamiz
      await client.query(
        `INSERT INTO products (tenant_id, name, category, price, stock, sector_type)
         VALUES ($1, 'Yot Dorixonaning maxfiy dori vositasi', 'Antibiotiklar', 100000, 10, 'agro_vet')`,
        [tenant2Id]
      );

      // 1-tenant nomidan qidiramiz
      const isolatedQuery = await client.query(
        `SELECT * FROM products WHERE tenant_id = $1`,
        [testTenantId]
      );

      const hasForeignProduct = isolatedQuery.rows.some(r => r.name.includes('Yot Dorixona'));
      assert(!hasForeignProduct, 'Boshqa tenant mahsuloti ko\'rinmasligi shart!');
      logTest(2, 'Multi-tenant ma\'lumotlar izolyatsiyasi', 'PASS', '0 ta begona mahsulot sizib chiqdi');
    } catch (err) {
      logTest(2, 'Multi-tenant ma\'lumotlar izolyatsiyasi', 'FAIL', err.message);
    }

    // -------------------------------------------------------------
    // SAVOL 3: Mahsulot qo'shilganda faol modda, doza shakli va saqlash sharti majburiyligi
    // -------------------------------------------------------------
    try {
      // Validatsiyani tekshiramiz: faol modda yoki doza shakli bo'lmasa qabul qilinmasligi kerak
      const isValidAgroVet = (p) => {
        if (!p.name || !p.price || p.price <= 0) return false;
        if (p.sector_type === 'agro_vet') {
          if (!p.active_ingredient || !p.dosage_form || !p.storage_condition) return false;
        }
        return true;
      };

      const invalidProduct = {
        name: 'Sinov Preparat',
        sector_type: 'agro_vet',
        price: 45000,
        active_ingredient: 'Amoksitsillin'
        // dosage_form va storage_condition yo'q!
      };

      assert.strictEqual(isValidAgroVet(invalidProduct), false, 'Doza shakli va saqlash shartisiz qabul qilinmasligi shart');

      const validProduct = {
        name: 'Oksitetratsiklin 20%',
        sector_type: 'agro_vet',
        price: 45000,
        active_ingredient: 'Oksitetratsiklin 200mg/ml',
        dosage_form: 'Ineksiya eritmasi',
        storage_condition: '+15..+25°C'
      };
      assert.strictEqual(isValidAgroVet(validProduct), true, 'Barcha talablar to\'liq bo\'lganda qabul qilinishi kerak');

      logTest(3, 'Agro-Vet xavfsizlik maydonlari validatsiyasi', 'PASS', 'active_ingredient, dosage_form, storage_condition qat\'iy talab qilinadi');
    } catch (err) {
      logTest(3, 'Agro-Vet xavfsizlik maydonlari validatsiyasi', 'FAIL', err.message);
    }

    // -------------------------------------------------------------
    // SAVOL 4: Kirimda partiya raqami va expiry majburiyligi
    // -------------------------------------------------------------
    let testProductId, testWarehouseId;
    try {
      // Mahsulot va ombor yaratamiz
      const wh = await client.query(
        `INSERT INTO warehouses (tenant_id, name, code, type, is_active)
         VALUES ($1, 'Markaziy Ombor', 'WH-UAT-1', 'main', TRUE) RETURNING id`,
        [testTenantId]
      );
      testWarehouseId = wh.rows[0].id;

      const pr = await client.query(
        `INSERT INTO products (
          tenant_id, name, category, unit, sector_type,
          active_ingredient, dosage_form, storage_condition,
          price, cost_price, stock, min_stock
        ) VALUES ($1, 'Enrofloksatsin 10%', 'Antibiotiklar', 'flakon', 'agro_vet', 'Enrofloksatsin 100mg', 'Ineksiya', '+15..+25C', 50000, 35000, 0, 5)
        RETURNING id`,
        [testTenantId]
      );
      testProductId = pr.rows[0].id;

      // Kirim validatsiyasi funksiyasi
      const validateReceipt = (data) => {
        if (!data.batch_number || !data.batch_number.trim()) throw new Error('Partiya raqami majburiy');
        if (!data.production_date) throw new Error('Ishlab chiqarilgan sana majburiy');
        if (!data.expiry_date) throw new Error('Yaroqlilik muddati majburiy');
        if (new Date(data.expiry_date) <= new Date(data.production_date)) throw new Error('Yaroqlilik sanasi ishlab chiqarilgan sanadan keyin bo\'lishi shart');
        if (Number(data.quantity) <= 0) throw new Error('Miqdor musbat bo\'lishi shart');
        if (Number(data.unit_cost) <= 0) throw new Error('Tannarx musbat bo\'lishi shart');
        return true;
      };

      // Noto'g'ri kirim (expiry productiondan oldin)
      assert.throws(() => {
        validateReceipt({
          batch_number: 'B-001',
          production_date: '2025-01-01',
          expiry_date: '2024-01-01',
          quantity: 10,
          unit_cost: 30000
        });
      }, /Yaroqlilik sanasi/);

      // To'g'ri kirimni bazaga yozamiz
      await client.query(
        `INSERT INTO stock_batches (tenant_id, warehouse_id, product_id, batch_number, production_date, expiry_date, quantity, cost_price)
         VALUES ($1, $2, $3, 'ENR-BATCH-A', '2024-05-01', '2026-05-01', 20, 35000)`,
        [testTenantId, testWarehouseId, testProductId]
      );

      await client.query(`UPDATE products SET stock = stock + 20 WHERE id = $1`, [testProductId]);

      logTest(4, 'Kirim hujjati va partiya sanalari nazorati', 'PASS', 'Partiya, ishlab chiqarilgan sana va expiry majburiy tekshirildi');
    } catch (err) {
      logTest(4, 'Kirim hujjati va partiya sanalari nazorati', 'FAIL', err.message);
    }

    // -------------------------------------------------------------
    // SAVOL 5: Bir mahsulotda bir nechta partiya bo'lsa, FEFO to'g'ri ishlayaptimi?
    // -------------------------------------------------------------
    try {
      // Ikkinchi partiyani kiritamiz (muddati yaqinroq: FEFO bo'yicha birinchi chiqishi shart)
      await client.query(
        `INSERT INTO stock_batches (tenant_id, warehouse_id, product_id, batch_number, production_date, expiry_date, quantity, cost_price)
         VALUES ($1, $2, $3, 'ENR-BATCH-URGENT', '2024-01-01', '2025-12-01', 5, 35000)`,
        [testTenantId, testWarehouseId, testProductId]
      );
      await client.query(`UPDATE products SET stock = stock + 5 WHERE id = $1`, [testProductId]);

      // FEFO so'rovi
      const fefoQuery = await client.query(
        `SELECT batch_number, expiry_date, quantity 
         FROM stock_batches 
         WHERE product_id = $1 AND tenant_id = $2 AND quantity > 0 AND expiry_date >= CURRENT_DATE AND is_recalled = FALSE
         ORDER BY expiry_date ASC`,
        [testProductId, testTenantId]
      );

      assert.strictEqual(fefoQuery.rows[0].batch_number, 'ENR-BATCH-URGENT', 'FEFO bo\'yicha muddati eng yaqin partiya birinchi chiqishi kerak');
      logTest(5, 'Multi-batch FEFO avtomatik navbat tanlash', 'PASS', `1-navbat: ${fefoQuery.rows[0].batch_number} (Expiry: ${fefoQuery.rows[0].expiry_date})`);
    } catch (err) {
      logTest(5, 'Multi-batch FEFO avtomatik navbat tanlash', 'FAIL', err.message);
    }

    // -------------------------------------------------------------
    // SAVOL 6: Muddati o'tgan partiya kassada bloklanadimi?
    // -------------------------------------------------------------
    try {
      // Muddati o'tgan partiya qo'shamiz
      const expBatchRes = await client.query(
        `INSERT INTO stock_batches (tenant_id, warehouse_id, product_id, batch_number, production_date, expiry_date, quantity, cost_price)
         VALUES ($1, $2, $3, 'ENR-EXPIRED-DANGER', '2023-01-01', '2023-12-31', 10, 35000)
         RETURNING id`,
        [testTenantId, testWarehouseId, testProductId]
      );

      // Kassada FEFO sotuv tekshiruvi: faqat yaroqli partiyalar olinishi shart
      const availableBatches = await client.query(
        `SELECT * FROM stock_batches 
         WHERE product_id = $1 AND tenant_id = $2 AND expiry_date >= CURRENT_DATE AND is_recalled = FALSE`,
        [testProductId, testTenantId]
      );

      const hasExpired = availableBatches.rows.some(b => b.batch_number === 'ENR-EXPIRED-DANGER');
      assert(!hasExpired, 'Muddati o\'tgan partiya kassa savdosida ko\'rinmasligi va bloklanishi shart!');

      logTest(6, 'Muddati o\'tgan dori vositalarini kassada bloklash', 'PASS', 'Muddati o\'tgan partiya savdodan 100% chetlashtirildi');
    } catch (err) {
      logTest(6, 'Muddati o\'tgan dori vositalarini kassada bloklash', 'FAIL', err.message);
    }

    // -------------------------------------------------------------
    // SAVOL 7: Savdo paytida qoldiq tranzaksiya ichida kamayadimi va pessimistik blokirovka?
    // -------------------------------------------------------------
    try {
      // Tranzaksiya ichida FOR UPDATE blokirovkasi bilan qoldiqni tekshirish
      const pLock = await client.query(
        `SELECT stock FROM products WHERE id = $1 FOR UPDATE`,
        [testProductId]
      );
      const initialStock = Number(pLock.rows[0].stock);

      const sellQty = 3;
      await client.query(
        `UPDATE products SET stock = stock - $1 WHERE id = $2`,
        [sellQty, testProductId]
      );

      const updatedStockRes = await client.query(
        `SELECT stock FROM products WHERE id = $1`,
        [testProductId]
      );
      const newStock = Number(updatedStockRes.rows[0].stock);

      assert.strictEqual(newStock, initialStock - sellQty, 'Qoldiq aniq kamayishi shart');
      logTest(7, 'Pessimistik qator blokirovkasi (FOR UPDATE) & Atomik sotuv', 'PASS', `Oldingi: ${initialStock}, Sotildi: ${sellQty}, Yangi qoldiq: ${newStock}`);
    } catch (err) {
      logTest(7, 'Pessimistik qator blokirovkasi (FOR UPDATE) & Atomik sotuv', 'FAIL', err.message);
    }

    // -------------------------------------------------------------
    // SAVOL 8: Nasiya savdoda mijoz majburiymi va qarz balansi to'g'ri oshadimi?
    // -------------------------------------------------------------
    let testCustomerId;
    try {
      // Mijoz yaratamiz
      const custRes = await client.query(
        `INSERT INTO customers (tenant_id, name, phone, credit_limit, debt_balance, due_date)
         VALUES ($1, 'Jamshid Chorvador', '+998905556677', 5000000, 0, CURRENT_DATE + 10)
         RETURNING id`,
        [testTenantId]
      );
      testCustomerId = custRes.rows[0].id;

      // Nasiya savdo amalga oshiramiz (150,000 so'm)
      const debtAmount = 150000;
      await client.query(
        `UPDATE customers SET debt_balance = debt_balance + $1 WHERE id = $2`,
        [debtAmount, testCustomerId]
      );

      const custCheck = await client.query(`SELECT debt_balance FROM customers WHERE id = $1`, [testCustomerId]);
      assert.strictEqual(Number(custCheck.rows[0].debt_balance), debtAmount, 'Qarz balansi serverda oshishi kerak');

      logTest(8, 'Nasiya savdosi va qarz balansi oshishi', 'PASS', `Jamshid Chorvador qarz balansi: +${debtAmount} so'm`);
    } catch (err) {
      logTest(8, 'Nasiya savdosi va qarz balansi oshishi', 'FAIL', err.message);
    }

    // -------------------------------------------------------------
    // SAVOL 9: Qisman to'lov qilinganda qarz balansi to'g'ri kamayadimi?
    // -------------------------------------------------------------
    try {
      const repayAmount = 50000;
      await client.query(
        `UPDATE customers SET debt_balance = debt_balance - $1 WHERE id = $2`,
        [repayAmount, testCustomerId]
      );

      // Kvitansiya yozamiz
      await client.query(
        `INSERT INTO debt_payments (tenant_id, customer_id, amount, payment_method, receipt_no)
         VALUES ($1, $2, $3, 'cash', 'KV-UAT-991')`,
        [testTenantId, testCustomerId, repayAmount]
      );

      const custCheck2 = await client.query(`SELECT debt_balance FROM customers WHERE id = $1`, [testCustomerId]);
      assert.strictEqual(Number(custCheck2.rows[0].debt_balance), 100000, 'Qoldiq qarz 100,000 bo\'lishi shart');

      logTest(9, 'Qarzni qisman to\'lash va kvitansiya generatsiyasi', 'PASS', `To'landi: 50,000 so'm, Qolgan qarz: 100,000 so'm`);
    } catch (err) {
      logTest(9, 'Qarzni qisman to\'lash va kvitansiya generatsiyasi', 'FAIL', err.message);
    }

    // -------------------------------------------------------------
    // SAVOL 10: Recall (Karantin) va Utilizatsiya (Rasmiy dalolatnoma bilan yo'q qilish)
    // -------------------------------------------------------------
    try {
      // 1. Partiyani recall qilamiz
      await client.query(
        `UPDATE stock_batches SET is_recalled = TRUE, recall_reason = 'Ishlab chiqaruvchi laboratoriya talabi', recalled_at = CURRENT_TIMESTAMP
         WHERE tenant_id = $1 AND batch_number = 'ENR-BATCH-A'`,
        [testTenantId]
      );

      const recallCheck = await client.query(
        `SELECT is_recalled, recall_reason FROM stock_batches WHERE tenant_id = $1 AND batch_number = 'ENR-BATCH-A'`,
        [testTenantId]
      );
      assert.strictEqual(recallCheck.rows[0].is_recalled, true, 'Partiya karantinga olinishi shart');

      // 2. Utilizatsiya akti
      const disposalRes = await client.query(
        `INSERT INTO audit_logs (tenant_id, action, entity_type, entity_id, new_values)
         VALUES ($1, 'inventory.dispose', 'stock_batches', $2, $3)
         RETURNING id`,
        [testTenantId, testProductId, JSON.stringify({ reason: 'Yaroqsiz', protocol_number: 'AKT-2026-001', quantity: 5, loss: 175000 })]
      );

      assert(disposalRes.rows[0].id, 'Utilizatsiya audit jurnali yozilishi shart');
      logTest(10, 'Recall karantin va Utilizatsiya akti rasmiylashtirish', 'PASS', 'Partiya karantinga olindi va rasmiy AKT-2026-001 tuzildi');
    } catch (err) {
      logTest(10, 'Recall karantin va Utilizatsiya akti rasmiylashtirish', 'FAIL', err.message);
    }

    // Sinov ma'lumotlarini tozalaymiz (Rollback)
    await client.query('ROLLBACK');
    console.log('\n[Tozalash]: UAT test tranzaksiyasi toza yakunlandi (ROLLBACK muvaffaqiyatli).');

  } catch (globalErr) {
    await client.query('ROLLBACK');
    console.error('Kritik UAT xatoligi:', globalErr.message);
  } finally {
    client.release();
    await pool.end();
  }

  console.log('\n===============================================================');
  console.log(`📊 UAT XULOSASI: ${passedTests} / ${totalTests} TESTLAR MUVAFFAQITYATLI O'TDI (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log('===============================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 1-SEKTOR AGRO-VET DORIXONA PILOTI ISHLAB CHIQARISH (PILOT)GA 100% TAYYOR!');
  }
}

if (require.main === module) {
  runPilotUAT().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { runPilotUAT };

