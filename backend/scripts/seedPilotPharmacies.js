// BiznesGO B2B Core: 1-Sektor Agro-Vet Dorixona Pilot Onboarding Seeder
// 3-5 ta real pilot dorixonalar va ularning to'liq ma'lumotlar bazasini shakllantirish

require('dotenv').config();
const { pool } = require('../config');
const crypto = require('crypto');

async function seedPilotPharmacies() {
  console.log('🚀 [Pilot Onboarding] 5 ta Agro-Vet pilot dorixonalari ma\'lumotlarini kiritish boshlandi...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Pilot Dorixonalar (Tenants)
    const pharmacies = [
      {
        slug: 'agrovet-markaz',
        name: 'Agro-Vet Markaz Dorixonasi',
        legal_name: 'OOO AgroVet Markaz Farm',
        phone: '+998901234567',
        address: 'Toshkent sh., Chilonzor tumani, Bunyodkor shoh ko\'chasi 42',
        inn: '309112233',
        branches: ['Asosiy Dorixona (Chilonzor)', 'Sergeli Filiali']
      },
      {
        slug: 'chinoz-baraka',
        name: 'Chinoz Baraka Agro-Vet',
        legal_name: 'YaTT Baraka Chorva Farm',
        phone: '+998935551122',
        address: 'Toshkent vil., Chinoz tumani, Markaziy bozor yonida',
        inn: '502998811',
        branches: ['Markaziy Bozor Do\'koni']
      },
      {
        slug: 'zangiota-agrovet',
        name: 'Zangiota Agro-Vet Tarmoq',
        legal_name: 'OOO Zangiota Vet Servis',
        phone: '+998977778899',
        address: 'Toshkent vil., Zangiota tumani, Keles yo\'li 15',
        inn: '304778899',
        branches: ['Zangiota Bosh Ofis Dorixonasi', 'Bo\'zsuv Filiali']
      },
      {
        slug: 'fayz-agrovet',
        name: 'Fayz Agro-Vet Farmatsiya',
        legal_name: 'MChJ Fayz Agro Farm',
        phone: '+998998884433',
        address: 'Samarqand vil., Jomboy tumani, Dehqonobod MFY',
        inn: '201998877',
        branches: ['Asosiy Farmatsiya Markazi']
      },
      {
        slug: 'agroz-dehqon-vet',
        name: 'Agroz Dehqon Veterinariya',
        legal_name: 'YaTT Dehqon Agro Vet',
        phone: '+998914442211',
        address: 'Farg\'ona vil., Quva tumani, Farg\'ona ko\'chasi 108',
        inn: '408112255',
        branches: ['Quva Markaziy Agro-Vet']
      }
    ];

    for (const p of pharmacies) {
      // 1. Tenant yaratish yoki yangilash
      const tenantRes = await client.query(
        `INSERT INTO tenants (name, slug, sector_type, phone, address, inn, is_active)
         VALUES ($1, $2, 'agro_vet', $3, $4, $5, TRUE)
         ON CONFLICT (slug) DO UPDATE 
         SET name = EXCLUDED.name, phone = EXCLUDED.phone, address = EXCLUDED.address, inn = EXCLUDED.inn
         RETURNING id`,
        [p.name, p.slug, p.phone, p.address, p.inn]
      );
      const tenantId = tenantRes.rows[0].id;
      console.log(`\n🏢 Pilot Dorixona: ${p.name} (Tenant ID: ${tenantId})`);

      // 2. Filiallar (Branches)
      const branchIds = [];
      for (let i = 0; i < p.branches.length; i++) {
        const bName = p.branches[i];
        const bRes = await client.query(
          `INSERT INTO branches (tenant_id, name, code, is_main, address, is_active)
           VALUES ($1, $2, $3, $4, $5, TRUE)
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [tenantId, bName, `BR-${p.slug}-${i+1}`, i === 0, p.address]
        );
        let bId = bRes.rows[0]?.id;
        if (!bId) {
          const existing = await client.query(`SELECT id FROM branches WHERE tenant_id = $1 AND name = $2`, [tenantId, bName]);
          bId = existing.rows[0]?.id;
        }
        if (bId) branchIds.push(bId);
      }
      const mainBranchId = branchIds[0];

      // 3. Ombor (Warehouse)
      const whRes = await client.query(
        `INSERT INTO warehouses (tenant_id, branch_id, name, code, type, is_active)
         VALUES ($1, $2, 'Asosiy Dorixona Ombori', $3, 'store', TRUE)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [tenantId, mainBranchId, `WH-${p.slug}-MAIN`]
      );
      let whId = whRes.rows[0]?.id;
      if (!whId) {
        const existingWh = await client.query(`SELECT id FROM warehouses WHERE tenant_id = $1 LIMIT 1`, [tenantId]);
        whId = existingWh.rows[0]?.id;
      }

      // 4. Xodimlar (Owner, Manager, Cashier)
      const staffList = [
        { name: `${p.name} Rahbari`, role: 'owner', phone: p.phone },
        { name: `Menejer Sanjar`, role: 'manager', phone: '+99890' + Math.floor(1000000 + Math.random() * 9000000) },
        { name: `Kassir Dilnoza`, role: 'cashier', phone: '+99891' + Math.floor(1000000 + Math.random() * 9000000) }
      ];

      for (const s of staffList) {
        await client.query(
          `INSERT INTO users (tenant_id, branch_id, role, full_name, phone, is_active)
           VALUES ($1, $2, $3, $4, $5, TRUE)
           ON CONFLICT (tenant_id, phone) DO UPDATE
           SET full_name = EXCLUDED.full_name, role = EXCLUDED.role`,
          [tenantId, mainBranchId, s.role, s.name, s.phone]
        );
      }

      // 5. Yetkazib beruvchilar (Suppliers)
      const supRes = await client.query(
        `INSERT INTO suppliers (tenant_id, name, phone, contact_person, inn)
         VALUES ($1, 'UzVet Farm Sanoat', '+998712001122', 'Bobur aka', '301223344')
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [tenantId]
      );
      let supplierId = supRes.rows[0]?.id;
      if (!supplierId) {
        const exSup = await client.query(`SELECT id FROM suppliers WHERE tenant_id = $1 LIMIT 1`, [tenantId]);
        supplierId = exSup.rows[0]?.id;
      }

      // 6. Agro-Vet Xavfsizlik Maydonlari bilan Dorilar & Multi-Batch FEFO
      const drugs = [
        {
          name: 'Oksitetratsiklin 20% L.A.',
          active_ingredient: 'Oksitetratsiklin 200 mg/ml',
          dosage_form: 'Ineksiya eritmasi',
          storage_condition: '+15..+25°C (Xona haroratida)',
          category: 'Antibiotiklar (Vet)',
          unit: 'flakon',
          price: 55000,
          cost_price: 38000,
          image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
          batches: [
            { num: 'OKS-2401', prod: '2024-01-10', exp: '2026-11-20', qty: 40 }, // FEFO 1-navbat (yaqin)
            { num: 'OKS-2402', prod: '2024-06-15', exp: '2027-06-15', qty: 60 }, // FEFO 2-navbat (uzoq)
            { num: 'OKS-EXP-OLD', prod: '2023-01-01', exp: '2024-01-01', qty: 5 } // Muddati o'tgan (BLOKLANISHI SHART)
          ]
        },
        {
          name: 'Ivermektin 1% Vet',
          active_ingredient: 'Ivermektin 10 mg/ml',
          dosage_form: 'Ineksiya eritmasi',
          storage_condition: '+2..+25°C (Quruq va qorong\'i)',
          category: 'Antiparasitik preparatlar',
          unit: 'flakon',
          price: 38000,
          cost_price: 25000,
          image_url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400',
          batches: [
            { num: 'IVR-2501', prod: '2025-02-01', exp: '2027-02-01', qty: 50 }
          ]
        },
        {
          name: 'Amoksitsillin 15% Suspenziya',
          active_ingredient: 'Amoksitsillin trigidrat 150 mg/ml',
          dosage_form: 'Suspenziya',
          storage_condition: '+2..+8°C (Sovutgichda)',
          category: 'Antibiotiklar (Vet)',
          unit: 'flakon',
          price: 65000,
          cost_price: 46000,
          image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
          batches: [
            { num: 'AMX-2408', prod: '2024-08-01', exp: '2026-08-01', qty: 25 }
          ]
        },
        {
          name: 'Vetom 1.1 Probiotik',
          active_ingredient: 'Bacillus subtilis 1x10^9 CFU',
          dosage_form: 'Kukun (Oral)',
          storage_condition: '+15..+25°C (Xona haroratida)',
          category: 'Premikslar va vitaminlar',
          unit: 'qadoq',
          price: 22000,
          cost_price: 15000,
          image_url: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400',
          batches: [
            { num: 'VTM-2410', prod: '2024-10-01', exp: '2026-10-01', qty: 80 }
          ]
        },
        {
          name: 'Enrofloksatsin 10% Oral',
          active_ingredient: 'Enrofloksatsin 100 mg/ml',
          dosage_form: 'Oral eritma',
          storage_condition: '+15..+25°C (Xona haroratida)',
          category: 'Antibiotiklar (Vet)',
          unit: 'litr',
          price: 95000,
          cost_price: 68000,
          image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
          batches: [
            { num: 'ENR-CRIT-7', prod: '2024-01-01', exp: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], qty: 12 }, // 5 kun qolgan (<=7 kun xavf)
            { num: 'ENR-NORM', prod: '2024-05-01', exp: '2026-12-31', qty: 30 }
          ]
        }
      ];

      for (const d of drugs) {
        // Jami qoldiq
        const totalStock = d.batches.reduce((sum, b) => sum + b.qty, 0);

        // Product yaratish
        const pRes = await client.query(
          `INSERT INTO products (
            tenant_id, name, category, unit, sector_type,
            active_ingredient, dosage_form, storage_condition,
            price, cost_price, stock, min_stock, image_url,
            batch_number, expiry_date
          ) VALUES ($1, $2, $3, $4, 'agro_vet', $5, $6, $7, $8, $9, $10, 5, $11, $12, $13)
          RETURNING id`,
          [
            tenantId, d.name, d.category, d.unit,
            d.active_ingredient, d.dosage_form, d.storage_condition,
            d.price, d.cost_price, totalStock, d.image_url,
            d.batches[0].num, d.batches[0].exp
          ]
        );
        const prodId = pRes.rows[0].id;

        // Partiyalarni kiritish
        for (const b of d.batches) {
          await client.query(
            `INSERT INTO stock_batches (
              tenant_id, warehouse_id, product_id,
              batch_number, production_date, expiry_date,
              quantity, cost_price, supplier_id, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)`,
            [tenantId, whId, prodId, b.num, b.prod, b.exp, b.qty, d.cost_price, supplierId]
          );
        }
      }

      // 7. Mijozlar va Nasiya / Qarz daftari (Overdue, Urgent, Normal)
      const sampleCustomers = [
        {
          name: 'Rustam Fermer (Chorvachilik)',
          phone: '+998901112233',
          type: 'fermer',
          farm_profile: '50 bosh qoramol, sut va go\'sht yo\'nalishi',
          credit_limit: 15000000,
          debt_balance: 3850000,
          due_date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0] // 6 kun kechikkan (MUDDATI O'TGAN)
        },
        {
          name: 'Olimjon Parrandachi',
          phone: '+998934445566',
          type: 'ferma',
          farm_profile: 'Broyler fermasi 5,000 jo\'ja',
          credit_limit: 8000000,
          debt_balance: 1450000,
          due_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0] // 2 kun qolgan (SHOSHILINCH)
        },
        {
          name: 'Zangiota Sub-Vet Apteka',
          phone: '+998971239988',
          type: 'dookon',
          farm_profile: 'Mahalliy dorixona shoxobchasi',
          credit_limit: 25000000,
          debt_balance: 0,
          due_date: null
        }
      ];

      for (const c of sampleCustomers) {
        await client.query(
          `INSERT INTO customers (
            tenant_id, name, phone, customer_type, farm_profile,
            credit_limit, debt_balance, due_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (tenant_id, phone) DO UPDATE
          SET debt_balance = EXCLUDED.debt_balance, due_date = EXCLUDED.due_date`,
          [tenantId, c.name, c.phone, c.type, c.farm_profile, c.credit_limit, c.debt_balance, c.due_date]
        );
      }
    }

    await client.query('COMMIT');
    console.log('\n✅ [Pilot Onboarding Muvaffaqiyatli]: 5 ta pilot dorixonasi, filiallai, xodimlari, FEFO partiyalari va qarz daftarlari tayyorlandi.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ [Pilot Onboarding Xatoligi]:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seedPilotPharmacies().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { seedPilotPharmacies };

