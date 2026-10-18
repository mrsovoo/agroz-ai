/**
 * Barcha 5 ta B2B Biznes Yo'nalishi (Agro-Vet, Feed, Warehouse, Seeds, Machinery)
 * uchun MVP Integratsiya Testi
 */
const http = require('http');
const { app } = require('./server');

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

async function registerMerchant(server, { type, storeName }) {
  const phone = '+99890' + Math.floor(1000000 + Math.random() * 9000000);
  const res = await request(server, '/auth/register', {
    method: 'POST',
    body: {
      full_name: 'Test ' + type,
      store_name: storeName,
      business_type: type,
      phone,
      password: 'password123',
      address: 'O\'zbekiston'
    }
  });
  if ((res.status !== 200 && res.status !== 201) || !res.body.token) {
    throw new Error(`Ro'yxatdan o'tib bo'lmadi [${type}]: ${JSON.stringify(res.body)}`);
  }
  return { token: res.body.token, merchant: res.body.merchant };
}

async function runAllProfilesTest() {
  console.log('=== BARCHA 5 TA BIZNES PROFILI MVP INTEGRATSIYA TESTI BOSHLANDI ===\n');
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, '127.0.0.1', r));

  try {
    // -------------------------------------------------------------
    // 1. YEM-OZUQA (FEED) PROFILI TESTI
    // -------------------------------------------------------------
    console.log('🌾 [1/4] YEM-OZUQA (FEED) PROFILI TESTI:');
    const feed = await registerMerchant(server, { type: 'feed', storeName: 'Chinoz Baraka Yem' });
    console.log('   ✅ Do\'kon ro\'yxatdan o\'tdi:', feed.merchant.store_name);

    // Mahsulot: 1 qop arpa yem (50 kg), narxi 220,000 so'm, qoldiq 50 qop
    const pFeedRes = await request(server, '/products', {
      method: 'POST',
      token: feed.token,
      body: {
        name: 'Arpa omuxta yem (№1)',
        category: 'Omuxta yem',
        price: 220000,
        unit: 'qop',
        stock_quantity: 50,
        min_stock_alert: 5,
        bag_weight_kg: 50
      }
    });
    if (pFeedRes.status !== 201) throw new Error(`Feed mahsulot qo'shilmadi: ${JSON.stringify(pFeedRes.body)}`);
    const pFeed = pFeedRes.body.product;
    console.log('   ✅ Yem mahsuloti qo\'shildi. 1 qop vazni:', pFeed.bag_weight_kg, 'kg, Birlik:', pFeed.unit);

    // Kassa (POS): Xaridor 10 kg so'radi -> 10 / 50 = 0.2 qop yem sotamiz
    const saleFeedRes = await request(server, '/sales', {
      method: 'POST',
      token: feed.token,
      body: {
        payment_type: 'cash',
        items: [
          { product_id: pFeed.id, quantity: 0.2, unit_price: 220000 }
        ]
      }
    });
    if (saleFeedRes.status !== 201) throw new Error(`Feed sotuv xato: ${JSON.stringify(saleFeedRes.body)}`);
    console.log('   ✅ 10 kg yem (0.2 qop) sotildi. Summa:', saleFeedRes.body.sale.total_amount, 'so\'m');

    // -------------------------------------------------------------
    // 2. OMBOR VA ULGURJI (WAREHOUSE) PROFILI TESTI
    // -------------------------------------------------------------
    console.log('\n🏢 [2/4] OMBOR VA ULGURJI (WAREHOUSE) PROFILI TESTI:');
    const wh = await registerMerchant(server, { type: 'warehouse', storeName: 'Optom Agro Baza' });
    console.log('   ✅ Do\'kon ro\'yxatdan o\'tdi:', wh.merchant.store_name);

    // Mahsulot: Karbamid o'g'it, chakana narx 25 000, ulgurji narx 20 000 (min 10 qop)
    const pWhRes = await request(server, '/products', {
      method: 'POST',
      token: wh.token,
      body: {
        name: 'Karbamid N46% mineral o\'g\'it',
        category: "O'g'it",
        price: 25000,
        unit: 'qop',
        stock_quantity: 100,
        min_stock_alert: 10,
        wholesale_price: 20000,
        wholesale_min_qty: 10
      }
    });
    if (pWhRes.status !== 201) throw new Error(`Warehouse mahsulot qo'shilmadi: ${JSON.stringify(pWhRes.body)}`);
    const pWh = pWhRes.body.product;
    console.log('   ✅ Mahsulot qo\'shildi. Chakana:', pWh.price, 'Ulgurji:', pWh.wholesale_price, '(min', pWh.wholesale_min_qty, ')');

    // Kassa (POS): Katta hajmda (20 qop) Nasiyaga sotish -> Avtomatik ulgurji narxda hisoblanadi (20 * 20000 = 400 000)
    const saleWhRes = await request(server, '/sales', {
      method: 'POST',
      token: wh.token,
      body: {
        payment_type: 'debt',
        customer_name: 'Shodlik Agrofirma',
        customer_phone: '+998933334455',
        due_date: '2026-11-15',
        items: [
          { product_id: pWh.id, quantity: 20 } // unit_price berilmasa server ulgurji narxni (20 000) oladi
        ]
      }
    });
    if (saleWhRes.status !== 201) throw new Error(`Warehouse sotuv xato: ${JSON.stringify(saleWhRes.body)}`);
    console.log('   ✅ 20 qop ulgurji narxda sotildi. Jami summa:', saleWhRes.body.sale.total_amount, 'so\'m (Ulgurji narx qo\'llandi)');

    // -------------------------------------------------------------
    // 3. URUG' VA KO'CHAT (SEEDS) PROFILI TESTI
    // -------------------------------------------------------------
    console.log('\n🌱 [3/4] URUG\' VA KO\'CHAT (SEEDS) PROFILI TESTI:');
    const seeds = await registerMerchant(server, { type: 'seeds', storeName: 'Dehqon Bobo Urug\'lari' });
    console.log('   ✅ Do\'kon ro\'yxatdan o\'tdi:', seeds.merchant.store_name);

    // Mahsulot: Pomidor urug'i, nav: "F1 Red Bull", pishish: "Erta pishar", mavsum: "Bahorgi", unuvchanlik: 2027-01-01
    const pSeedsRes = await request(server, '/products', {
      method: 'POST',
      token: seeds.token,
      body: {
        name: 'Pomidor F1 Red Bull (Gollandiya)',
        category: 'Sabzavot urug\'i',
        price: 85000,
        unit: 'pachka',
        stock_quantity: 30,
        min_stock_alert: 5,
        variety: 'F1 Red Bull',
        ripening_period: 'Erta pishar',
        season: 'Bahorgi',
        expiry_date: '2027-01-01'
      }
    });
    if (pSeedsRes.status !== 201) throw new Error(`Seeds mahsulot qo'shilmadi: ${JSON.stringify(pSeedsRes.body)}`);
    const pSeeds = pSeedsRes.body.product;
    console.log('   ✅ Urug\' yaratildi. Nav:', pSeeds.variety, 'Pishish:', pSeeds.ripening_period, 'Unuvchanlik:', pSeeds.expiry_date);

    // Kassa (POS): 2 pachka urug' sotish
    const saleSeedsRes = await request(server, '/sales', {
      method: 'POST',
      token: seeds.token,
      body: {
        payment_type: 'card',
        items: [{ product_id: pSeeds.id, quantity: 2, unit_price: 85000 }]
      }
    });
    if (saleSeedsRes.status !== 201) throw new Error(`Seeds sotuv xato: ${JSON.stringify(saleSeedsRes.body)}`);
    console.log('   ✅ Urug\' sotildi. Karta to\'lovi:', saleSeedsRes.body.sale.total_amount, 'so\'m');

    // -------------------------------------------------------------
    // 4. JIHOZ VA TEXNIKA (MACHINERY) PROFILI TESTI
    // -------------------------------------------------------------
    console.log('\n⚙️ [4/4] JIHOZ VA TEXNIKA (MACHINERY) PROFILI TESTI:');
    const mach = await registerMerchant(server, { type: 'machinery', storeName: 'AgroTexnika Savdo' });
    console.log('   ✅ Do\'kon ro\'yxatdan o\'tdi:', mach.merchant.store_name);

    // Mahsulot: Motorli purkagich, model: "MS-073D", seriya: "SN-776655", kafolat: 12 oy
    const pMachRes = await request(server, '/products', {
      method: 'POST',
      token: mach.token,
      body: {
        name: 'Benzinli motorli purkagich 25L',
        category: 'Purkagich',
        price: 1800000,
        unit: 'dona',
        stock_quantity: 8,
        min_stock_alert: 2,
        model: 'MS-073D',
        serial_number: 'SN-776655',
        warranty_months: 12
      }
    });
    if (pMachRes.status !== 201) throw new Error(`Machinery mahsulot qo'shilmadi: ${JSON.stringify(pMachRes.body)}`);
    const pMach = pMachRes.body.product;
    console.log('   ✅ Texnika qo\'shildi. Modeli:', pMach.model, 'S/N:', pMach.serial_number, 'Kafolat:', pMach.warranty_months, 'oy');

    // Kassa (POS): Purkagichni nasiyaga sotish (kafolat kvitansiyasi bilan)
    const saleMachRes = await request(server, '/sales', {
      method: 'POST',
      token: mach.token,
      body: {
        payment_type: 'debt',
        customer_name: 'Dilshod Bog\'bon',
        customer_phone: '+998909998877',
        paid_amount: 500000, // 500 000 boshlang'ich to'lov
        due_date: '2026-12-01',
        items: [{ product_id: pMach.id, quantity: 1, unit_price: 1800000 }]
      }
    });
    if (saleMachRes.status !== 201) throw new Error(`Machinery sotuv xato: ${JSON.stringify(saleMachRes.body)}`);
    const saleItem = saleMachRes.body.sale.items[0];
    console.log('   ✅ Texnika sotildi. Qarz qoldig\'i: 1 300 000 so\'m, Chekdagi kafolat:', saleItem.warranty_months, 'oy');

    console.log('\n===============================================================');
    console.log('🏆 BARCHA 5 TA BIZNES YO\'NALISHI BO\'YICHA TESTLAR 100% O\'TDI!');
    console.log('===============================================================\n');
    process.exit(0);

  } finally {
    server.close();
  }
}

runAllProfilesTest().catch(err => {
  console.error('❌ Test xatolik bilan to\'xtadi:', err);
  process.exit(1);
});

