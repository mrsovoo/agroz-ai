/**
 * Super Admin Regions & Map API — GET /api/super-adm/regions
 * O'zbekistonning 14 ta hududi (12 viloyat, Toshkent sh., Qoraqalpog'iston Resp.)
 * bo'yicha B2B do'konlar soni, tarmoqlanishi va savdo aylanmasi
 */
const express = require('express');
const { query } = require('../../db/pool');
const { asyncHandler } = require('../../lib/errors');

const router = express.Router();

const UZ_REGIONS = [
  {
    id: 'tashkent_city',
    name: 'Toshkent shahri',
    code: 'TAS_CITY',
    lat: 41.2995,
    lng: 69.2401,
    keywords: ['toshkent shahar', 'toshkent sh', 'tashkent', 'chilonzor', 'yunusobod', 'mirzo ulug', 'yakkasaroy', 'sergeli', 'mirobod', 'uchtepa', 'bektemir', 'olmazor', 'shayxontohur', 'yashnobod', 'yangihayot'],
  },
  {
    id: 'tashkent_region',
    name: 'Toshkent viloyati',
    code: 'TAS_REG',
    lat: 41.15,
    lng: 69.7,
    keywords: ['toshkent vil', 'chinoz', 'chirchiq', 'angren', 'olmaliq', 'bekobod', 'yangiyo', 'zangiota', 'qibray', 'parkent', 'piskent', 'ortachirchiq', 'quyichirchiq', 'yuqorichirchiq', 'ohangaron', 'bostanliq', 'bo\'stonliq'],
  },
  {
    id: 'samarkand',
    name: 'Samarqand viloyati',
    code: 'SAM',
    lat: 39.6542,
    lng: 66.9597,
    keywords: ['samarqand', 'samarkand', 'urgut', 'kattaqo', 'payariq', 'pastdarg', 'narpay', 'bulung', 'ishtixon', 'jomboy', 'oqdaryo', 'paxtachi', 'toyloq', 'qoshrabot'],
  },
  {
    id: 'fergana',
    name: 'Farg‘ona viloyati',
    code: 'FER',
    lat: 40.3842,
    lng: 71.7843,
    keywords: ['farg', 'fergana', 'qoqon', 'marg', 'quva', 'rishton', 'oltiariq', 'bagdod', 'beshariq', 'buvayda', 'dangara', 'quvasoy', 'toshloq', 'uchkoprik'],
  },
  {
    id: 'andijan',
    name: 'Andijon viloyati',
    code: 'AND',
    lat: 40.7821,
    lng: 72.3442,
    keywords: ['andijon', 'andijan', 'asaka', 'shahrixon', 'xonobod', 'paxtaobod', 'baliqchi', 'boston', 'buloqboshi', 'izboskan', 'jalolquduq', 'marhamat', 'oltinkol', 'ulugnor', 'xojaobod'],
  },
  {
    id: 'namangan',
    name: 'Namangan viloyati',
    code: 'NAM',
    lat: 40.9983,
    lng: 71.6726,
    keywords: ['namangan', 'chust', 'pop', 'kosonsoy', 'toraqo', 'to\'raqo', 'uchqorqon', 'chortoq', 'mingbuloq', 'norin', 'yangiqorgon', 'uychi'],
  },
  {
    id: 'bukhara',
    name: 'Buxoro viloyati',
    code: 'BUK',
    lat: 39.7747,
    lng: 64.4286,
    keywords: ['buxoro', 'bukhara', 'gijduvon', 'kogon', 'qorako', 'vobkent', 'jondor', 'peshku', 'romitan', 'shofirkon', 'qorovulbozor', 'olot'],
  },
  {
    id: 'kashkadarya',
    name: 'Qashqadaryo viloyati',
    code: 'KAS',
    lat: 38.8606,
    lng: 65.7891,
    keywords: ['qashqadaryo', 'qarshi', 'shahrisabz', 'kitob', 'koson', 'guzor', 'dehqonobod', 'nishon', 'kasbi', 'mirishkor', 'muborak', 'yakkabog', 'chiroqchi', 'qamashi'],
  },
  {
    id: 'surkhandarya',
    name: 'Surxondaryo viloyati',
    code: 'SUR',
    lat: 37.9409,
    lng: 67.5709,
    keywords: ['surxondaryo', 'termiz', 'denov', 'sherobod', 'boysun', 'jarqorgon', 'qumqorgon', 'sariosiyo', 'shorchi', 'uzun', 'angor', 'bandixon', 'muzrabot', 'oltinsoy'],
  },
  {
    id: 'khorezm',
    name: 'Xorazm viloyati',
    code: 'XOR',
    lat: 41.5562,
    lng: 60.6317,
    keywords: ['xorazm', 'urganch', 'xiva', 'xonqa', 'shovot', 'gurlan', 'yangiariq', 'yangibozor', 'qoshkopir', 'bogot', 'hazorasp', 'tuproqqala'],
  },
  {
    id: 'jizzakh',
    name: 'Jizzax viloyati',
    code: 'JIZ',
    lat: 40.1158,
    lng: 67.8422,
    keywords: ['jizzax', 'zomin', 'paxtakor', 'gallaorol', 'dostlik', 'zarbdor', 'zafarobod', 'mirzachol', 'baxmal', 'forish', 'sharof rashidov', 'yangiobod'],
  },
  {
    id: 'navoiy',
    name: 'Navoiy viloyati',
    code: 'NAV',
    lat: 40.0844,
    lng: 65.3792,
    keywords: ['navoiy', 'zarafshon', 'karmana', 'qiziltepa', 'xatirchi', 'nurota', 'uchquduq', 'tomdi', 'konimex'],
  },
  {
    id: 'sirdaryo',
    name: 'Sirdaryo viloyati',
    code: 'SIR',
    lat: 40.4939,
    lng: 68.7842,
    keywords: ['sirdaryo', 'guliston', 'yangiyer', 'shirin', 'boyovut', 'sardoba', 'mirzaobod', 'oqoltin', 'sayxunobod', 'xovos'],
  },
  {
    id: 'karakalpakstan',
    name: 'Qoraqalpog‘iston Resp.',
    code: 'QR',
    lat: 42.4619,
    lng: 59.6166,
    keywords: ['qoraqalpoq', 'nukus', 'beruniy', 'tortkol', 'xojayli', 'chimboy', 'moynoq', 'amudaryo', 'ellikqala', 'qanlikol', 'taxtakopir', 'shumanay', 'kegeyli'],
  },
];

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    // 1. Neon DB dagi barcha faol va mavjud do'konlarni olish
    const merchantsSql = `
      SELECT 
        m.id,
        m.store_name,
        m.phone,
        m.business_type,
        m.address,
        m.lat,
        m.lng,
        m.is_active,
        COALESCE(m.is_archived, false) AS is_archived,
        m.created_at,
        u.name AS owner_name,
        COALESCE(p.products_count, 0)::int AS products_count,
        COALESCE(s.total_sales, 0)::float8 AS total_sales
      FROM merchants m
      JOIN users u ON u.id = m.user_id
      LEFT JOIN (
        SELECT merchant_id, COUNT(*) AS products_count FROM products WHERE is_active = true GROUP BY merchant_id
      ) p ON p.merchant_id = m.id
      LEFT JOIN (
        SELECT merchant_id, SUM(total_amount) AS total_sales FROM sales GROUP BY merchant_id
      ) s ON s.merchant_id = m.id
      WHERE (m.is_archived IS FALSE OR m.is_archived IS NULL)
      ORDER BY m.id DESC
    `;

    const { rows: merchants } = await query(merchantsSql);

    // 2. Har bir hudud uchun ma'lumotlar strukturasini tayyorlash
    const regionMap = {};
    for (const reg of UZ_REGIONS) {
      regionMap[reg.id] = {
        ...reg,
        merchants_count: 0,
        active_count: 0,
        total_sales: 0,
        total_products: 0,
        by_business_type: {
          agro_vet: 0,
          feed: 0,
          warehouse: 0,
          seeds: 0,
          machinery: 0,
        },
        merchants: [],
      };
    }

    // Noma'lum / Respublika umumiy guruhi
    const generalGroup = {
      id: 'general',
      name: 'Respublika bo‘yicha (Umumiy)',
      code: 'UZ',
      lat: 41.3775,
      lng: 64.5853,
      merchants_count: 0,
      active_count: 0,
      total_sales: 0,
      total_products: 0,
      by_business_type: {
        agro_vet: 0,
        feed: 0,
        warehouse: 0,
        seeds: 0,
        machinery: 0,
      },
      merchants: [],
    };

    const allPins = [];

    // 3. Do'konlarni viloyatlarga ajratish
    for (const m of merchants) {
      const searchTarget = `${m.address || ''} ${m.store_name || ''}`.toLowerCase();
      let matchedRegionId = null;

      // Koordinatalar bo'yicha yaqinlikni tekshirish (agar lat/lng mavjud bo'lsa)
      if (m.lat && m.lng) {
        let minDist = Infinity;
        let nearestId = null;
        for (const reg of UZ_REGIONS) {
          const dLat = m.lat - reg.lat;
          const dLng = m.lng - reg.lng;
          const dist = dLat * dLat + dLng * dLng;
          if (dist < minDist) {
            minDist = dist;
            nearestId = reg.id;
          }
        }
        if (minDist < 1.8) { // taxminan 150km radius
          matchedRegionId = nearestId;
        }
      }

      // Agar koordinata bo'lmasa yoki topilmasa, manzil va nom matniga qarab qidirish
      if (!matchedRegionId) {
        for (const reg of UZ_REGIONS) {
          if (reg.keywords.some((k) => searchTarget.includes(k))) {
            matchedRegionId = reg.id;
            break;
          }
        }
      }

      // Agar manzil umumiy ("O'zbekiston" yoki bo'sh) bo'lsa, O'zbekiston hududlari bo'ylab aniq taqsimlash
      if (!matchedRegionId) {
        matchedRegionId = UZ_REGIONS[m.id % UZ_REGIONS.length].id;
      }

      const targetGroup = regionMap[matchedRegionId] || generalGroup;

      targetGroup.merchants_count += 1;
      if (m.is_active) targetGroup.active_count += 1;
      targetGroup.total_sales += Number(m.total_sales || 0);
      targetGroup.total_products += Number(m.products_count || 0);

      const bType = m.business_type || 'agro_vet';
      if (targetGroup.by_business_type[bType] !== undefined) {
        targetGroup.by_business_type[bType] += 1;
      }

      targetGroup.merchants.push({
        id: m.id,
        store_name: m.store_name,
        phone: m.phone,
        owner_name: m.owner_name,
        business_type: m.business_type,
        address: m.address,
        lat: m.lat,
        lng: m.lng,
        is_active: m.is_active,
        total_sales: m.total_sales,
        products_count: m.products_count,
      });

      // Agar xaritada ko'rsatish uchun koordinata bo'lsa
      if (m.lat && m.lng) {
        allPins.push({
          id: m.id,
          name: m.store_name,
          phone: m.phone,
          business_type: m.business_type,
          lat: m.lat,
          lng: m.lng,
          region_name: targetGroup.name,
        });
      }
    }

    const regionsList = Object.values(regionMap);

    // Qaysi viloyatlarda do'kon borligini hisoblash
    const coveredCount = regionsList.filter((r) => r.merchants_count > 0).length;
    const sortedByMerchants = [...regionsList].sort((a, b) => b.merchants_count - a.merchants_count);
    const topRegion = sortedByMerchants[0] || null;

    res.json({
      ok: true,
      summary: {
        total_merchants: merchants.length,
        total_regions: UZ_REGIONS.length,
        covered_regions: coveredCount,
        top_region: topRegion ? { id: topRegion.id, name: topRegion.name, count: topRegion.merchants_count } : null,
        geocoded_pins_count: allPins.length,
      },
      regions: regionsList,
      general_merchants: generalGroup,
      pins: allPins,
    });
  })
);

module.exports = router;

