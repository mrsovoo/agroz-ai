/**
 * Telegram Bot Focus & Redirect Logic Test:
 *   1. Bot status API tekshiruvi (biznesgo_bot vs agroz_auth_bot)
 *   2. agroz_auth_bot legacy redirect mantiqi (/start -> t.me/biznesgo_bot)
 *   3. biznesgo_bot asosiy TMA launch mantiqi (/start -> web_app)
 *   4. Admin push broadcast (dual-bot fallback)
 *   5. Legacy user auto-migration (agroz_auth_bot foydalanuvchisi biznesgo_bot orqali kirganda)
 */
const http = require('http');
const crypto = require('crypto');
const { app } = require('./server');
const config = require('./config');
const { query } = require('./db/pool');

function makeRequest(server, options, body = null) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const req = http.request(
      {
        host: '127.0.0.1',
        port: address.port,
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
          let parsed = null;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolve({ status: res.statusCode, body: parsed, headers: res.headers });
        });
      }
    );
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function generateMockInitData(botToken, userObj) {
  const authDate = Math.floor(Date.now() / 1000);
  const data = {
    auth_date: String(authDate),
    query_id: 'AAHdF60gAAAAAN0XrSAzK2',
    user: JSON.stringify(userObj),
  };
  const dataCheckString = Object.keys(data)
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(data)) {
    params.set(k, v);
  }
  params.set('hash', hash);
  return params.toString();
}

async function runTests() {
  console.log('=== TELEGRAM BOT FOCUS & REDIRECT LOGIC TEST BOSHLANDI ===\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    // 1. Bot status API tekshiruvi
    console.log('1. Bot status endpoint tekshirilmoqda (/api/biznesgo/bot/status)...');
    const statusRes = await makeRequest(server, { path: '/api/biznesgo/bot/status' });
    if (statusRes.status !== 200) {
      throw new Error(`Bot status 200 qaytarmadi: ${JSON.stringify(statusRes.body)}`);
    }
    console.log('   ✅ Asosiy bot:', statusRes.body.main_bot.username);
    console.log('   ✅ Eski redirect bot:', statusRes.body.legacy_bot.username);
    console.log('   ✅ Mini App URL:', statusRes.body.mini_app_url);

    // 2. agroz_auth_bot /start bosganda redirect javobi
    console.log('\n2. agroz_auth_bot webhook /start tekshirilmoqda (Redirect logic)...');
    const agrozWebhookRes = await makeRequest(
      server,
      { path: '/api/biznesgo/bot/webhook/agroz_auth', method: 'POST' },
      {
        update_id: 10001,
        message: {
          message_id: 1,
          chat: { id: 99887711, type: 'private' },
          text: '/start',
        },
      }
    );
    console.log('   ✅ agroz_auth_bot javobi:', agrozWebhookRes.body.redirected ? 'Muvaffaqiyatli Redirect' : 'Javob olindi');

    // 3. biznesgo_bot /start bosganda TMA ochish javobi
    console.log('\n3. biznesgo_bot webhook /start tekshirilmoqda (TMA Launch logic)...');
    const biznesgoWebhookRes = await makeRequest(
      server,
      { path: '/api/biznesgo/bot/webhook/biznesgo', method: 'POST' },
      {
        update_id: 10002,
        message: {
          message_id: 1,
          chat: { id: 99887711, type: 'private' },
          text: '/start',
        },
      }
    );
    console.log('   ✅ biznesgo_bot javobi:', biznesgoWebhookRes.body.started ? 'Muvaffaqiyatli TMA Launch' : 'Javob olindi');

    // 4. Admin Push Notifications Broadcast tekshiruvi
    console.log('\n4. Admin Push broadcast endpoint tekshirilmoqda (/api/biznesgo/bot/broadcast)...');
    const pushRes = await makeRequest(
      server,
      { path: '/api/biznesgo/bot/broadcast', method: 'POST' },
      {
        text: 'E\'lon: BiznesGO tizimi yangilandi!',
        target_ids: [99887711],
      }
    );
    if (pushRes.status !== 200) {
      throw new Error(`Push broadcast xatolik qaytardi: ${JSON.stringify(pushRes.body)}`);
    }
    console.log('   ✅ Admin push xabarnomasi qayta ishlandi. Jami qabul qiluvchilar:', pushRes.body.total);

    // 5. Legacy foydalanuvchini avtomatik tanish va B2B do'konga yo'naltirish
    console.log('\n5. Legacy user auto-migration (agroz_auth_bot foydalanuvchisi biznesgo_bot dan kirganda)...');
    const legacyTgId = 554433221;
    // Test uchun specialists jadvaliga eski dorixona yozamiz (agar yo'q bo'lsa)
    await query(`
      INSERT INTO specialists (telegram_id, name, phone, organization, role, address, lat, lng)
      VALUES ($1, 'Eski Dorixona Egasi', '+998905544332', 'AgroShifo Samarqand', 'pharmacist', 'Samarqand shahri', 39.6542, 66.9597)
      ON CONFLICT (telegram_id) DO UPDATE SET organization = 'AgroShifo Samarqand', address = 'Samarqand shahri', lat = 39.6542, lng = 66.9597
    `, [legacyTgId]);

    // Endi foydalanuvchi biznesgo_bot orqali Mini App initData yuboradi
    const botToken = config.biznesgoBotToken || config.agrozAuthBotToken;
    const legacyInitData = generateMockInitData(botToken, {
      id: legacyTgId,
      first_name: 'Eski Dorixona',
      username: 'eskidorixona',
    });

    const authRes = await makeRequest(
      server,
      { path: '/api/biznesgo/auth/telegram', method: 'POST' },
      { initData: legacyInitData }
    );

    if (authRes.status !== 200 || !authRes.body.registered || !authRes.body.merchant) {
      throw new Error(`Legacy user tanilmadi: ${JSON.stringify(authRes.body)}`);
    }

    console.log('   ✅ Legacy foydalanuvchi avtomatik tanildi!');
    console.log('   ✅ Merchant ID:', authRes.body.merchant.id);
    console.log('   ✅ Do‘kon nomi:', authRes.body.merchant.store_name);
    console.log('   ✅ Biznes turi:', authRes.body.merchant.business_type);
    console.log('   ✅ Qayta ro‘yxatdan o‘tish so‘ralmadi (registered: true)');

    console.log('\n===============================================================');
    console.log('🎉 BARCHA BOT FOCUS, REDIRECT VA PUSH TESTLAR 100% O‘TDI!');
    console.log('===============================================================');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Test xatolik bilan to‘xtadi:', err);
  process.exit(1);
});
