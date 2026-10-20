/**
 * Dual-Bot Support Test (biznesgo_bot + agroz_auth_bot)
 */
const crypto = require('crypto');
const http = require('http');
const { app } = require('../server');
const config = require('../config');

function createTelegramInitData(botToken, user, authDate = Math.floor(Date.now() / 1000)) {
  const params = {
    auth_date: String(authDate),
    query_id: 'AAHdF6IQAAAAAN0XohDhrPwt',
    user: JSON.stringify(user)
  };

  const dataCheckString = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const searchParams = new URLSearchParams(params);
  searchParams.set('hash', hash);
  return searchParams.toString();
}

function request(server, path, body = {}) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const opt = {
      hostname: '127.0.0.1',
      port: addr.port,
      path: '/api/biznesgo' + path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(opt, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function runDualBotTest() {
  console.log('=== DUAL-BOT SUPPORT TEST (biznesgo_bot + agroz_auth_bot) BOSHLANDI ===\n');
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, '127.0.0.1', r));

  try {
    const biznesgoToken = config.biznesgoBotToken;
    const agrozAuthToken = config.agrozAuthBotToken;

    console.log('Bot 1 Token (biznesgo_bot):', biznesgoToken ? 'Mavjud ✅' : 'Yo\'q ❌');
    console.log('Bot 2 Token (agroz_auth_bot):', agrozAuthToken ? 'Mavjud ✅' : 'Yo\'q ❌');

    // 1. biznesgo_bot orqali kelgan initData testi
    console.log('\n1. @biznesgo_bot orqali HMAC-SHA256 initData yuborilmoqda...');
    const user1 = { id: 7771001, first_name: 'BiznesGo', last_name: 'Foydalanuvchi', username: 'biznesgo_user' };
    const initData1 = createTelegramInitData(biznesgoToken, user1);

    const res1 = await request(server, '/auth/telegram', { initData: initData1 });
    if (res1.status !== 200) {
      throw new Error(`biznesgo_bot initData rad etildi: ${JSON.stringify(res1.body)}`);
    }
    console.log('   ✅ @biznesgo_bot initData muvaffaqiyatli tasdiqlandi! Status:', res1.status, 'User ID:', res1.body.telegram_user?.id || 'Merchant mavjud');

    // 2. agroz_auth_bot orqali kelgan initData testi
    console.log('\n2. @agroz_auth_bot orqali HMAC-SHA256 initData yuborilmoqda...');
    const user2 = { id: 7771002, first_name: 'AgrozAuth', last_name: 'Foydalanuvchi', username: 'agroz_auth_user' };
    const initData2 = createTelegramInitData(agrozAuthToken, user2);

    const res2 = await request(server, '/auth/telegram', { initData: initData2 });
    if (res2.status !== 200) {
      throw new Error(`agroz_auth_bot initData rad etildi: ${JSON.stringify(res2.body)}`);
    }
    console.log('   ✅ @agroz_auth_bot initData muvaffaqiyatli tasdiqlandi! Status:', res2.status, 'User ID:', res2.body.telegram_user?.id || 'Merchant mavjud');

    // 3. Begona / noto'g'ri token bilan imzolangan initData (Security Check)
    console.log('\n3. Noto\'g\'ri bot tokeni bilan soxta initData yuborib xavfsizlikni tekshirish...');
    const fakeToken = '123456789:ABCdefGHIjklMNOpqrSTUvwxYZ';
    const initDataFake = createTelegramInitData(fakeToken, user1);

    const resFake = await request(server, '/auth/telegram', { initData: initDataFake });
    if (resFake.status === 401) {
      console.log('   ✅ Soxta imzo muvaffaqiyatli bloklandi! Status: 401 Unauthorized, Code:', resFake.body.code);
    } else {
      throw new Error(`Xavfsizlik xatosi! Soxta initData qabul qilindi: ${resFake.status}`);
    }

    console.log('\n===============================================================');
    console.log('🎉 DUAL-BOT SUPPORT VA XAVFSIZLIK TESTI 100% MUVAFFAQITYATLI O\'TDI!');
    console.log('===============================================================\n');
    process.exit(0);

  } finally {
    server.close();
  }
}

runDualBotTest().catch(err => {
  console.error('❌ Test xatolik bilan to\'xtadi:', err);
  process.exit(1);
});
