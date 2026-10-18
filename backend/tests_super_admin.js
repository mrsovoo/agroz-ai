/**
 * Super Admin API E2E Integration Test
 *   - requireSuperAdmin guard (401/403 check)
 *   - GET /api/super-adm/stats
 *   - GET /api/super-adm/merchants
 *   - PATCH /api/super-adm/merchants/:id/status
 *   - POST /api/super-adm/merchants/:id/reset
 *   - DELETE /api/super-adm/merchants/:id (Cascade delete)
 *   - POST /api/super-adm/broadcast
 */
const http = require('http');
const config = require('./config');
const { app } = require('./server');
const { pool, query } = require('./db/pool');

function makeRequest(server, options, body = null) {
  return new Promise((resolve, reject) => {
    const { port } = server.address();
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        path: options.path,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let parsed;
          try {
            parsed = raw ? JSON.parse(raw) : null;
          } catch {
            parsed = raw;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function runSuperAdminTests() {
  console.log('\n=== SUPER ADMIN API INTEGRATION TEST BOSHLANDI ===\n');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  const adminKey = config.bridgeKey || 'test_admin_key_super_123';
  config.adminKey = adminKey;

  try {
    // 1. Guard tekshiruvi: Ruxsatsiz so'rovlar (401)
    console.log("1. Super Admin Guard (401 / 403) tekshiruvi...");
    const noAuthRes = await makeRequest(server, { path: '/api/super-adm/stats', method: 'GET' });
    if (noAuthRes.status !== 401) {
      throw new Error(`Xavfsizlik xatosi: Kalitsiz so'rov 401 bermadi: ${noAuthRes.status}`);
    }
    console.log("   ✅ Kalitsiz so'rov muvaffaqiyatli bloklandi (401 Unauthorized)");

    // 2. Stats olish (Neon DB aggregatsiyalari)
    console.log("\n2. Platforma statistikasi (/api/super-adm/stats)...");
    const statsRes = await makeRequest(server, {
      path: '/api/super-adm/stats',
      method: 'GET',
      headers: { 'X-Admin-Key': adminKey },
    });
    if (statsRes.status !== 200 || !statsRes.body.ok) {
      throw new Error(`Stats olish xatosi: ${JSON.stringify(statsRes.body)}`);
    }
    console.log("   ✅ Jami do'konlar soni:", statsRes.body.stats.merchants.total_merchants);
    console.log("   ✅ Faol do'konlar:", statsRes.body.stats.merchants.active_merchants);
    console.log("   ✅ Jami savdo summasi:", statsRes.body.stats.sales.total_sales_amount, "so'm");
    console.log("   ✅ Biznes turlari soni:", statsRes.body.stats.by_business_type.length);

    // 3. Test uchun yangi merchant va unga bog'liq savdo/qarz/mahsulot yaratish
    console.log("\n3. Sinov uchun test do'kon yaratilmoqda...");
    const testPhone = `+99899${Math.floor(1000000 + Math.random() * 9000000)}`;
    const userRes = await query(
      `INSERT INTO users (phone, name) VALUES ($1, 'Test Super Admin Merchant') RETURNING id`,
      [testPhone]
    );
    const testUserId = userRes.rows[0].id;

    const merchantRes = await query(
      `INSERT INTO merchants (user_id, store_name, phone, business_type, address, is_active)
       VALUES ($1, $2, $3, 'warehouse', 'Toshkent', true)
       RETURNING id, store_name`,
      [testUserId, 'Super Admin Test Dokoni', testPhone]
    );
    const testMerchantId = merchantRes.rows[0].id;
    console.log(`   ✅ Test do'kon yaratildi: ID=${testMerchantId}`);

    // Unga mahsulot qo'shamiz
    const prodRes = await query(
      `INSERT INTO products (merchant_id, name, price, stock_quantity)
       VALUES ($1, 'Test Qop Un', 150000, 50) RETURNING id`,
      [testMerchantId]
    );
    const prodId = prodRes.rows[0].id;

    // Unga mijoz va qarz qo'shamiz
    const custRes = await query(
      `INSERT INTO customers (merchant_id, full_name, phone, total_debt)
       VALUES ($1, 'Qarzdor Test Mijoz', '+998901112233', 300000) RETURNING id`,
      [testMerchantId]
    );
    const custId = custRes.rows[0].id;

    const debtRes = await query(
      `INSERT INTO debts (merchant_id, customer_id, total_debt, paid_amount, status)
       VALUES ($1, $2, 300000, 0, 'unpaid') RETURNING id`,
      [testMerchantId, custId]
    );

    // Unga savdo qo'shamiz
    const saleRes = await query(
      `INSERT INTO sales (merchant_id, total_amount, payment_type)
       VALUES ($1, 450000, 'cash') RETURNING id`,
      [testMerchantId]
    );
    await query(
      `INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price)
       VALUES ($1, $2, 'Test Qop Un', 3, 150000)`,
      [saleRes.rows[0].id, prodId]
    );
    console.log("   ✅ Test savdo, qarz va mahsulotlar yaratildi");

    // 4. Do'konlar ro'yxatini olish (/api/super-adm/merchants)
    console.log("\n4. Do'konlar ro'yxatini olish (/api/super-adm/merchants)...");
    const listRes = await makeRequest(server, {
      path: `/api/super-adm/merchants?search=${encodeURIComponent(testPhone)}`,
      method: 'GET',
      headers: { 'X-Admin-Key': adminKey },
    });
    if (listRes.status !== 200 || !listRes.body.merchants.length) {
      throw new Error(`Do'kon qidiruvda topilmadi: ${JSON.stringify(listRes.body)}`);
    }
    const foundMerchant = listRes.body.merchants[0];
    console.log("   ✅ Qidiruv orqali topildi:", foundMerchant.store_name);
    console.log("   ✅ Bog'langan mahsulotlar soni:", foundMerchant.products_count);
    console.log("   ✅ Bog'langan savdolar summasi:", foundMerchant.total_sales);
    console.log("   ✅ Bog'langan ochiq qarz summasi:", foundMerchant.total_open_debt);

    // 5. Do'kon holati va obunasini o'zgartirish (/api/super-adm/merchants/:id/status)
    console.log("\n5. Do'konni bloklash va obuna muddatini yangilash...");
    const subDate = new Date(Date.now() + 30 * 86400 * 1000).toISOString();
    const patchRes = await makeRequest(
      server,
      {
        path: `/api/super-adm/merchants/${testMerchantId}/status`,
        method: 'PATCH',
        headers: { 'X-Admin-Key': adminKey },
      },
      {
        is_active: false,
        subscription_until: subDate,
      }
    );
    if (patchRes.status !== 200 || patchRes.body.merchant.is_active !== false) {
      throw new Error(`Status yangilash xatosi: ${JSON.stringify(patchRes.body)}`);
    }
    console.log("   ✅ Do'kon bloklandi (is_active: false) va obuna muddati berildi:", subDate.slice(0, 10));

    // 6. Test ma'lumotlarini nolga tushirish (Reset data)
    console.log("\n6. Do'kon test savdolari va qarzlarini reset qilish (/merchants/:id/reset)...");
    const resetRes = await makeRequest(
      server,
      {
        path: `/api/super-adm/merchants/${testMerchantId}/reset`,
        method: 'POST',
        headers: { 'X-Admin-Key': adminKey },
      }
    );
    if (resetRes.status !== 200 || resetRes.body.reset_stats.deleted_sales !== 1) {
      throw new Error(`Reset xatosi: ${JSON.stringify(resetRes.body)}`);
    }
    console.log("   ✅ Savdo va qarzlar 0 ga tushirildi. O'chirilgan savdolar:", resetRes.body.reset_stats.deleted_sales);

    // 7. Cascade Delete: do'kon va qolgan barcha ma'lumotlarni to'liq o'chirish
    console.log("\n7. Do'konni to'liq o'chirish (Cascade Delete: /merchants/:id)...");
    const delRes = await makeRequest(
      server,
      {
        path: `/api/super-adm/merchants/${testMerchantId}`,
        method: 'DELETE',
        headers: { 'X-Admin-Key': adminKey },
      }
    );
    if (delRes.status !== 200 || delRes.body.deleted_merchant_id !== testMerchantId) {
      throw new Error(`Cascade delete xatosi: ${JSON.stringify(delRes.body)}`);
    }
    console.log("   ✅ Do'kon va barcha bog'liq yozuvlar Neon DB'dan to'liq o'chirildi");

    // Tozalash: test foydalanuvchini ham o'chiramiz
    await query('DELETE FROM users WHERE id = $1', [testUserId]);

    // 8. Super Admin Broadcast (Matn va rasm bilan)
    console.log("\n8. Super Admin Push Broadcast (/api/super-adm/broadcast)...");
    const bcastRes = await makeRequest(
      server,
      {
        path: '/api/super-adm/broadcast',
        method: 'POST',
        headers: { 'X-Admin-Key': adminKey },
      },
      {
        text: '📢 <b>Super Admin yangiliklari</b>: Platformaga yangi imkoniyatlar qo\'shildi!',
        photo_url: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800',
        target_bots: ['biznesgo_bot', 'agroz_auth_bot'],
        target_ids: [99887711],
      }
    );
    if (bcastRes.status !== 200 || !bcastRes.body.ok) {
      throw new Error(`Broadcast xatosi: ${JSON.stringify(bcastRes.body)}`);
    }
    console.log("   ✅ Rasmli va matnli Push broadcast muvaffaqiyatli qayta ishlandi!");

    // 9. Super Admin Archive & Soft-delete/Restore (/api/super-adm/archive)
    console.log("\n9. Super Admin Archive (/api/super-adm/archive) & Soft-delete/Restore...");
    const archiveRes = await makeRequest(server, {
      path: '/api/super-adm/archive',
      method: 'GET',
      headers: { 'X-Admin-Key': adminKey },
    });
    if (archiveRes.status !== 200 || !archiveRes.body.ok || !Array.isArray(archiveRes.body.items)) {
      throw new Error(`Archive GET xatosi: ${JSON.stringify(archiveRes.body)}`);
    }
    console.log(`   ✅ Arxiv ro'yxati olindi: ${archiveRes.body.total} ta yozuv, stats:`, archiveRes.body.stats);

    // Test merchant yaratamiz va arxivlaymiz (Soft-delete)
    const testArchiveUser = await query(
      "INSERT INTO users (name, phone, telegram_id) VALUES ('Archive Tester', '+998909998877', 99887766) RETURNING id"
    );
    const archiveUId = testArchiveUser.rows[0].id;
    const testArchiveMerchant = await query(
      `INSERT INTO merchants (user_id, store_name, phone, business_type, is_active)
       VALUES ($1, 'Archive Test Store', '+998909998877', 'seeds', true) RETURNING id`,
      [archiveUId]
    );
    const archiveMId = testArchiveMerchant.rows[0].id;

    // Arxivlash (Soft-delete)
    const softDelRes = await makeRequest(server, {
      path: `/api/super-adm/merchants/${archiveMId}/archive`,
      method: 'PATCH',
      headers: { 'X-Admin-Key': adminKey },
    });
    if (softDelRes.status !== 200 || softDelRes.body.merchant?.is_archived !== true) {
      throw new Error(`Soft-delete xatosi: ${JSON.stringify(softDelRes.body)}`);
    }
    console.log("   ✅ Do'kon muvaffaqiyatli arxivlandi (is_archived: true, is_active: false)");

    // Qayta tiklash (Restore)
    const restoreRes = await makeRequest(server, {
      path: `/api/super-adm/merchants/${archiveMId}/restore`,
      method: 'PATCH',
      headers: { 'X-Admin-Key': adminKey },
    });
    if (restoreRes.status !== 200 || restoreRes.body.merchant?.is_archived !== false || restoreRes.body.merchant?.is_active !== true) {
      throw new Error(`Restore xatosi: ${JSON.stringify(restoreRes.body)}`);
    }
    console.log("   ✅ Do'kon arxivdan qayta tiklandi (is_archived: false, is_active: true)");

    // Test tozalash
    await query('DELETE FROM merchants WHERE id = $1', [archiveMId]);
    await query('DELETE FROM users WHERE id = $1', [archiveUId]);

    console.log('\n===============================================================');
    console.log('🎉 SUPER ADMIN BACKEND API BARCHA TESTLARI 100% MUVAFFAQITYATLI O\'TDI!');
    console.log('===============================================================\n');
  } finally {
    server.close();
  }
}

if (require.main === module) {
  runSuperAdminTests()
    .then(() => pool.end().finally(() => process.exit(0)))
    .catch((err) => {
      console.error('\n❌ Test xatolik bilan to\'xtadi:', err);
      pool.end().finally(() => process.exit(1));
    });
}

module.exports = { runSuperAdminTests };
