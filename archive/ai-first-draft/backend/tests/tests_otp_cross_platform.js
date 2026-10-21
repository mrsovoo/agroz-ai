/**
 * Web & Telegram OTP Authentication with Cross-Platform Data Sync Test
 * - POST /api/biznesgo/auth/send-otp
 * - Telegram Bot /start otp_<code> interaction
 * - POST /api/biznesgo/auth/verify-otp
 * - Cross-Platform Data Sync between Web and Telegram Mini App
 */
const http = require('http');
const crypto = require('crypto');
const config = require('../config');
const { app } = require('../server');
const { pool, query } = require('../db/pool');
const { handleBiznesgoBotUpdate } = require('../services/telegramBot');

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

function generateMockInitData(botToken, userObj) {
  const userJson = JSON.stringify(userObj);
  const authDate = Math.floor(Date.now() / 1000).toString();
  const params = {
    auth_date: authDate,
    query_id: 'AAHdF6IQAAAAAN0XohDhrOrc',
    user: userJson,
  };
  const sortedPairs = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = crypto.createHmac('sha256', secretKey).update(sortedPairs).digest('hex');
  const searchParams = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) searchParams.set(k, v);
  searchParams.set('hash', hash);
  return searchParams.toString();
}

async function runOtpTests() {
  console.log('\n=== WEB & TELEGRAM OTP CROSS-PLATFORM DATA SYNC TEST BOSHLANDI ===\n');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  const testPhone = `+99890${Math.floor(1000000 + Math.random() * 9000000)}`;
  const testTgId = 88899911;

  try {
    // 1. WEB: Telefon kiritib OTP so'rash
    console.log(`1. Web orqali OTP so'rash: ${testPhone}...`);
    const sendRes = await makeRequest(server, {
      path: '/api/biznesgo/auth/send-otp',
      method: 'POST',
    }, { phone: testPhone });

    if (sendRes.status !== 200 || !sendRes.body.ok) {
      throw new Error(`send-otp xatosi: ${JSON.stringify(sendRes.body)}`);
    }
    console.log("   ✅ OTP so'rovi qabul qilindi. Bot URL:", sendRes.body.bot_url);

    // Neon DB dan generatsiya qilingan kodni olish
    const otpRow = await query(
      `SELECT id, code, telegram_id, expires_at FROM otp_codes
       WHERE regexp_replace(phone, '\\D', '', 'g') = $1
       ORDER BY id DESC LIMIT 1`,
      [testPhone.replace(/\D/g, '')]
    );
    const code = otpRow.rows[0]?.code;
    if (!code || code.length !== 6) {
      throw new Error("Neon DB da 6-xonali OTP kod topilmadi");
    }
    console.log(`   ✅ Neon DB da 6-xonali OTP kod saqlandi: ${code}`);

    // 2. TELEGRAM BOT: Foydalanuvchi botda /start otp_<code> ni bosadi
    console.log(`\n2. Telegram bot orqali tasdiqlash (/start otp_${code})...`);
    const mockUpdate = {
      update_id: 100001,
      message: {
        message_id: 501,
        from: { id: testTgId, first_name: 'Test', last_name: 'Merchant' },
        chat: { id: testTgId, type: 'private' },
        date: Math.floor(Date.now() / 1000),
        text: `/start otp_${code}`,
      },
    };

    const botRes = await handleBiznesgoBotUpdate(mockUpdate);
    if (!botRes.handled || !botRes.otp_confirmed) {
      throw new Error(`Bot OTP confirm xatosi: ${JSON.stringify(botRes)}`);
    }
    console.log("   ✅ Telegram bot OTP ni tasdiqladi va telegram_id ni bog'ladi!");

    // 3. WEB: Brauzerda OTP kodni tasdiqlash va kirish
    console.log("\n3. Webda OTP kodni tekshirish (POST /api/biznesgo/auth/verify-otp)...");
    const verifyRes = await makeRequest(server, {
      path: '/api/biznesgo/auth/verify-otp',
      method: 'POST',
    }, {
      phone: testPhone,
      code,
      store_name: 'Baraka Agro Baza',
      business_type: 'warehouse',
      full_name: 'Alisher Vohidov',
    });

    if (verifyRes.status !== 200 || !verifyRes.body.token || !verifyRes.body.merchant) {
      throw new Error(`verify-otp xatosi: ${JSON.stringify(verifyRes.body)}`);
    }
    const webToken = verifyRes.body.token;
    const merchantId = verifyRes.body.merchant.id;
    console.log(`   ✅ Web kirish muvaffaqiyatli! Merchant ID: ${merchantId}, Token berildi.`);

    // 4. WEB orqali do'konga mahsulot qo'shish
    console.log("\n4. Web orqali yangi mahsulot qo'shish...");
    const prodRes = await makeRequest(server, {
      path: '/api/biznesgo/products',
      method: 'POST',
      headers: { Authorization: `Bearer ${webToken}` },
    }, {
      name: 'Super Urug‘ 2026',
      price: 150000,
      stock_quantity: 50,
      unit: 'qop',
    });

    if (prodRes.status !== 201 || !prodRes.body.product) {
      throw new Error(`Mahsulot qo'shish xatosi: ${JSON.stringify(prodRes.body)}`);
    }
    const prodId = prodRes.body.product.id;
    console.log(`   ✅ Mahsulot qo'shildi. ID: ${prodId}, Nomi: ${prodRes.body.product.name}`);

    // 5. CROSS-PLATFORM DATA SYNC: Telegram Mini App orqali kirish
    console.log("\n5. Telegram Mini App orqali kirish (initData bilan sinxronizatsiya)...");
    const tgInitData = generateMockInitData(
      config.biznesgoBotToken || 'test_bot_token',
      { id: testTgId, first_name: 'Alisher', last_name: 'Vohidov', username: 'alisher_agro' }
    );

    const tgLoginRes = await makeRequest(server, {
      path: '/api/biznesgo/auth/telegram',
      method: 'POST',
    }, { initData: tgInitData });

    if (tgLoginRes.status !== 200 || !tgLoginRes.body.registered || !tgLoginRes.body.merchant) {
      throw new Error(`Telegram login xatosi: ${JSON.stringify(tgLoginRes.body)}`);
    }

    if (tgLoginRes.body.merchant.id !== merchantId) {
      throw new Error(`Cross-platform sync xatosi: Web merchant ID (${merchantId}) !== Telegram merchant ID (${tgLoginRes.body.merchant.id})`);
    }
    console.log(`   ✅ YAGONA BAZA SINXRONIZATSIYASI TASDIQLANDI!`);
    console.log(`   Telegram bot ham ayni o'sha Webdagi do'konni tanidi: "${tgLoginRes.body.merchant.store_name}" (ID: ${tgLoginRes.body.merchant.id})`);

    // 6. Telegram Mini App orqali webda qo'shilgan mahsulotlarni ko'rish
    const tgToken = tgLoginRes.body.token;
    const tgProdsRes = await makeRequest(server, {
      path: '/api/biznesgo/products',
      method: 'GET',
      headers: { Authorization: `Bearer ${tgToken}` },
    });

    const foundProd = tgProdsRes.body.products?.find((p) => p.id === prodId);
    if (!foundProd) {
      throw new Error("Telegram Mini App orqali Webda yaratilgan mahsulot ko'rinmadi!");
    }
    console.log(`   ✅ Webda yaratilgan mahsulot Telegram Mini App da aynan bir xil qoldiq bilan ko'rindi (${foundProd.name}, Qoldiq: ${foundProd.stock_quantity})!`);

    // Tozalash
    await query('DELETE FROM products WHERE id = $1', [prodId]);
    await query('DELETE FROM merchants WHERE id = $1', [merchantId]);
    await query('DELETE FROM users WHERE telegram_id = $1', [testTgId]);
    await query('DELETE FROM otp_codes WHERE phone = $1', [testPhone]);

    console.log('\n===============================================================');
    console.log('🎉 WEB & TELEGRAM OTP VA CROSS-PLATFORM SYNC TESTI 100% O‘TDI!');
    console.log('===============================================================\n');
  } finally {
    server.close();
  }
}

if (require.main === module) {
  runOtpTests()
    .then(() => pool.end().finally(() => process.exit(0)))
    .catch((err) => {
      console.error('\n❌ Test xatolik bilan to\'xtadi:', err);
      pool.end().finally(() => process.exit(1));
    });
}

module.exports = { runOtpTests };
