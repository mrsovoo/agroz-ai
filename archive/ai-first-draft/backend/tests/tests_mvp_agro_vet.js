/**
 * Agro-Vet MVP E2E Integratsiya Testi
 */
const http = require('http');
const { app } = require('../server');
const { query } = require('../db/pool');

function request(server, path, options = {}) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const opt = {
      hostname: '127.0.0.1',
      port: addr.port,
      path: '/api/biznesgo' + path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { 'Authorization': `Bearer ${options.token}` } : {}),
        ...(options.headers || {})
      }
    };

    const req = http.request(opt, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function runTest() {
  console.log('--- Agro-Vet MVP E2E Test Boshlandi ---');
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, '127.0.0.1', r));

  try {
    const testPhone = '+99890' + Math.floor(1000000 + Math.random() * 9000000);
    console.log('1. Ro\'yxatdan o\'tish (Agro-Vet do\'kon):', testPhone);
    const regRes = await request(server, '/auth/register', {
      method: 'POST',
      body: {
        full_name: 'Agro Test Sotuvchi',
        store_name: 'Zomin Agro-Vet Dorixonasi',
        business_type: 'agro_vet',
        phone: testPhone,
        password: 'password123',
        address: 'Jizzax viloyati, Zomin tumani'
      }
    });

    if ((regRes.status !== 200 && regRes.status !== 201) || !regRes.body.token) {
      throw new Error(`Ro'yxatdan o'tib bo'lmadi: ${JSON.stringify(regRes.body)}`);
    }
    const token = regRes.body.token;
    const merchant = regRes.body.merchant;
    console.log('   ✅ Ro\'yxatdan o\'tildi, merchant ID:', merchant.id, 'business_type:', merchant.business_type);

    // 2. Sozlamalarda business_type o'zgartirishni bloklash testi
    console.log('2. Sozlamalarda business_type ni o\'zgartirish urinishini tekshirish...');
    const lockRes = await request(server, '/merchant', {
      method: 'PUT',
      token,
      body: {
        store_name: 'Yangi Store Name',
        business_type: 'feed' // O'zgartirishga urinish
      }
    });
    if (lockRes.status === 400) {
      console.log('   ✅ Muvaffaqiyatli bloklandi (400 Bad Request):', lockRes.body.error);
    } else {
      throw new Error(`Xato! business_type o'zgartirilishiga yo'l qo'yildi: ${lockRes.status}`);
    }

    // 3. Agro-Vet mahsulot qo'shish (Partiya va Yaroqlilik muddati bilan)
    console.log('3. Agro-Vet dori/preparati qo\'shish (Enrofloksatsin 10%)...');
    const prodRes = await request(server, '/products', {
      method: 'POST',
      token,
      body: {
        name: 'Enrofloksatsin 10% (Antibiotik)',
        category: 'Veterinariya dorilari',
        price: 45000,
        unit: 'dona',
        stock_quantity: 20,
        min_stock_alert: 5,
        batch_number: 'ENRO-2026-BATCH01',
        expiry_date: '2026-11-20'
      }
    });
    if (prodRes.status !== 201) {
      throw new Error(`Mahsulot qo'shilmadi: ${JSON.stringify(prodRes.body)}`);
    }
    const product = prodRes.body.product;
    console.log('   ✅ Mahsulot yaratildi. ID:', product.id, 'Qoldiq:', product.stock_quantity, 'Partiya:', product.batch_number, 'Muddati:', product.expiry_date);

    // 4. Tezkor Kassa (POS): Naqd sotuv
    console.log('4. Tezkor Kassa (POS): 5 dona mahsulotni naqd sotish...');
    const sale1Res = await request(server, '/sales', {
      method: 'POST',
      token,
      body: {
        payment_type: 'cash',
        items: [
          { product_id: product.id, quantity: 5, unit_price: 45000 }
        ]
      }
    });
    if (sale1Res.status !== 201) {
      throw new Error(`Naqd sotuv amalga oshmadi: ${JSON.stringify(sale1Res.body)}`);
    }
    console.log('   ✅ Naqd sotuv yakunlandi. Jami summa:', sale1Res.body.sale.total_amount, 'so\'m');

    // Mahsulot qoldig'ini tekshirish (20 - 5 = 15 bo'lishi kerak)
    const check1 = await request(server, `/products`, { token });
    const p1 = check1.body.products.find(x => x.id === product.id);
    console.log('   ✅ Ombor qoldig\'i avtomatik kamaydi: 20 ->', p1.stock_quantity);
    if (Number(p1.stock_quantity) !== 15) throw new Error(`Qoldiq xato kamaygan: ${p1.stock_quantity}`);

    // 5. Tezkor Kassa (POS): Nasiya (Qarz) sotuv
    console.log('5. Tezkor Kassa (POS): 5 dona mahsulotni Nasiya (Qarz) ga sotish...');
    const sale2Res = await request(server, '/sales', {
      method: 'POST',
      token,
      body: {
        payment_type: 'debt',
        customer_name: 'Anvar Fermer',
        customer_phone: '+998911112233',
        paid_amount: 50000, // 225,000 dan 50,000 boshlang'ich to'lov
        due_date: '2026-11-01',
        items: [
          { product_id: product.id, quantity: 5, unit_price: 45000 }
        ]
      }
    });
    if (sale2Res.status !== 201) {
      throw new Error(`Nasiya sotuv amalga oshmadi: ${JSON.stringify(sale2Res.body)}`);
    }
    const debt = sale2Res.body.sale.debt;
    console.log('   ✅ Nasiya sotuv yakunlandi. Qarz ID:', debt?.id, 'Ochiq qarz summasi:', debt?.total_debt, 'To\'langan:', debt?.paid_amount);

    // Qoldiq yana kamaydi (15 - 5 = 10 bo'lishi kerak)
    const check2 = await request(server, `/products`, { token });
    const p2 = check2.body.products.find(x => x.id === product.id);
    console.log('   ✅ Ombor qoldig\'i yana kamaydi: 15 ->', p2.stock_quantity);
    if (Number(p2.stock_quantity) !== 10) throw new Error(`Qoldiq xato: ${p2.stock_quantity}`);

    // 6. Qarz daftari (Debt Ledger) tekshiruvi va Qarz to'lash
    console.log('6. Qarz daftari ro\'yxati va to\'lovni qabul qilish...');
    const debtListRes = await request(server, '/debts?status=open', { token });
    const debts = debtListRes.body.debts || [];
    console.log('   ✅ Ochiq qarzlar soni:', debts.length, 'Jami ochiq summa:', debtListRes.body.summary.total_outstanding);
    const targetDebt = debts[0];
    if (!targetDebt) throw new Error('Qarz ro\'yxatda topilmadi!');

    // Qarzni to'liq yopish
    const remain = Number(targetDebt.total_debt) - Number(targetDebt.paid_amount);
    console.log('   Qarzning qolgan qismini to\'lash:', remain, 'so\'m');
    const payRes = await request(server, '/debts/pay', {
      method: 'POST',
      token,
      body: {
        debt_id: targetDebt.id,
        amount: remain,
        payment_method: 'cash',
        note: 'To\'liq hisob-kitob qilindi'
      }
    });
    if (payRes.status !== 200 || !payRes.body.debts || payRes.body.debts[0]?.status !== 'paid') {
      throw new Error(`Qarz to'lovi qabul qilinmadi: ${JSON.stringify(payRes.body)}`);
    }
    const paidDebt = payRes.body.debts[0];
    console.log('   ✅ Qarz to\'liq yopildi! Status:', paidDebt.status, 'Qoldiq:', paidDebt.remaining, 'Mijoz jami qarzi:', payRes.body.customer?.total_debt);

    // 7. Dashboard ko'rsatkichlari
    console.log('7. Boshqaruv paneli (Dashboard) statistikasi...');
    const dashRes = await request(server, '/dashboard?days=7', { token });
    const dData = dashRes.body;
    console.log('   ✅ Bugungi tushum:', dData.today?.revenue, 'so\'m (Savdolar soni:', dData.today?.sales_count, ')');
    console.log('   ✅ Ombor qiymati:', dData.stock?.stock_value, 'so\'m, Jami mahsulotlar:', dData.stock?.total);

    console.log('\n=============================================');
    console.log('🎉 BARCHA AGRO-VET MVP TESTLAR 100% MUVAFFAQITYATLI O\'TDI!');
    console.log('=============================================\n');
    process.exit(0);

  } finally {
    server.close();
  }
}

runTest().catch(err => {
  console.error('❌ Test xatolik bilan to\'xtadi:', err);
  process.exit(1);
});
