const express = require('express');
const router = express.Router();
const { requireAdminAuth, requirePermission, logAdminAudit, maskPhone } = require('./middleware');
const { pool } = require('../config');

function extractRegion(address) {
  if (!address) return 'Noma\'lum';
  const lower = address.toLowerCase();
  if (lower.includes('toshkent') || lower.includes('tashkent')) return 'Toshkent viloyati / shahri';
  if (lower.includes('samarqand') || lower.includes('samarkand')) return 'Samarqand viloyati';
  if (lower.includes('farg') || lower.includes('fergana')) return 'Farg\'ona viloyati';
  if (lower.includes('andijon') || lower.includes('andijan')) return 'Andijon viloyati';
  if (lower.includes('namangan')) return 'Namangan viloyati';
  if (lower.includes('buxoro') || lower.includes('bukhara')) return 'Buxoro viloyati';
  if (lower.includes('qashqadaryo') || lower.includes('qarshi')) return 'Qashqadaryo viloyati';
  if (lower.includes('surxondaryo') || lower.includes('termiz')) return 'Surxondaryo viloyati';
  if (lower.includes('xorazm') || lower.includes('urganch')) return 'Xorazm viloyati';
  if (lower.includes('navoiy')) return 'Navoiy viloyati';
  if (lower.includes('jizzax')) return 'Jizzax viloyati';
  if (lower.includes('sirdaryo') || lower.includes('guliston')) return 'Sirdaryo viloyati';
  if (lower.includes('qoraqalpog') || lower.includes('nukus')) return 'Qoraqalpog\'iston Respublikasi';
  return address.split(',')[0].trim() || 'Boshqa hudud';
}

// 1. Barcha B2B Dorixonalar Ro'yxati (Filtr, qidiruv va aylanmalar bilan)
router.get('/', requireAdminAuth, requirePermission('tenants:view'), async (req, res) => {
  const { search, source, status, region } = req.query;

  try {
    let tenants = [];
    let merchantsList = [];
    let usersList = [];
    let sales = [];

    try {
      const tRes = await pool.query(`SELECT * FROM tenants ORDER BY created_at DESC`);
      tenants = tRes.rows || [];
    } catch (_) {}

    try {
      const mRes = await pool.query(`SELECT * FROM merchants ORDER BY created_at DESC`);
      merchantsList = mRes.rows || [];
    } catch (_) {}

    try {
      const uRes = await pool.query(`SELECT * FROM users ORDER BY created_at ASC`);
      usersList = uRes.rows || [];
    } catch (_) {}

    try {
      const sRes = await pool.query(`SELECT * FROM sales`);
      sales = (sRes.rows || [])
        .filter(s => !s.status || s.status === 'completed')
        .map(s => ({
          ...s,
          tenant_id: s.tenant_id || s.merchant_id
        }));
    } catch (_) {}

    // Merchants va Users ma'lumotlarini tenants bilan birlashtirish
    const merchantByTenantId = new Map();
    const merchantByPhone = new Map();
    merchantsList.forEach(m => {
      if (m.tenant_id) merchantByTenantId.set(m.tenant_id, m);
      if (m.phone) merchantByPhone.set(m.phone, m);
    });

    const userByTenantId = new Map();
    const userByPhone = new Map();
    usersList.forEach(u => {
      if (u.tenant_id && !userByTenantId.has(u.tenant_id)) userByTenantId.set(u.tenant_id, u);
      if (u.phone && !userByPhone.has(u.phone)) userByPhone.set(u.phone, u);
    });

    const existingPhones = new Set(tenants.map(t => t.phone));
    for (const m of merchantsList) {
      if (!existingPhones.has(m.phone)) {
        tenants.push({
          id: m.tenant_id || m.id,
          name: m.name,
          phone: m.phone,
          address: m.address,
          sector_type: m.business_type || 'agro_vet',
          is_active: true,
          created_at: m.created_at,
          merchant_id: m.id,
          merchant_name: m.name,
          merchant_phone: m.phone,
          merchant_addr: m.address,
          merchant_created_at: m.created_at
        });
        existingPhones.add(m.phone);
      }
    }

    tenants = tenants.map(t => {
      const m = merchantByTenantId.get(t.id) || merchantByPhone.get(t.phone) || {};
      const u = userByTenantId.get(t.id) || userByPhone.get(t.phone) || {};
      return {
        ...t,
        merchant_id: t.merchant_id || m.id || null,
        merchant_name: t.merchant_name || m.name || null,
        merchant_phone: t.merchant_phone || m.phone || null,
        merchant_addr: t.merchant_addr || m.address || null,
        merchant_created_at: t.merchant_created_at || m.created_at || null,
        user_id: t.user_id || u.id || null,
        user_full_name: t.user_full_name || u.full_name || m.name || t.name,
        user_phone: t.user_phone || u.phone || t.phone,
        user_role: t.user_role || u.role_code || u.role || 'owner',
        telegram_chat_id: t.telegram_chat_id || u.telegram_chat_id || null
      };
    });

    const revenueMap = new Map();
    const countMap = new Map();
    sales.forEach(s => {
      const tId = s.tenant_id;
      const amt = Number(s.total_amount) || 0;
      revenueMap.set(tId, (revenueMap.get(tId) || 0) + amt);
      countMap.set(tId, (countMap.get(tId) || 0) + 1);
    });

    let result = tenants.map(t => {
      const isTg = (t.merchant_addr && t.merchant_addr.includes('tg:')) || 
                   (t.address && t.address.includes('tg:')) ||
                   Boolean(t.telegram_chat_id);
      const tgId = t.telegram_chat_id || (t.merchant_addr && t.merchant_addr.includes('tg:') ? t.merchant_addr.replace(/^.*tg:/, '') : null);
      const reg = extractRegion(t.address);
      const rev = revenueMap.get(t.id) || 0;
      const cnt = countMap.get(t.id) || 0;

      return {
        id: t.id,
        name: t.name,
        phone: t.phone,
        masked_phone: maskPhone(t.phone),
        address: t.address || 'Kiritilmagan',
        region: reg,
        source: isTg ? 'telegram_bot' : 'web_browser',
        source_label: isTg ? 'Telegram Bot (@biznesgo_bot)' : 'Veb Brauzer',
        total_revenue: rev,
        sales_count: cnt,
        is_active: t.is_active !== false,
        status: t.is_active !== false ? 'active' : 'suspended',
        created_at: t.created_at,
        archive_data: {
          tenant_id: t.id,
          store_name: t.name,
          owner_name: t.user_full_name || t.merchant_name || t.name,
          phone: t.phone,
          masked_phone: maskPhone(t.phone),
          telegram_chat_id: tgId,
          source: isTg ? 'telegram_bot' : 'web_browser',
          source_label: isTg ? 'Telegram Bot (@biznesgo_bot)' : 'Veb Brauzer',
          sector_type: t.sector_type || 'agro_vet',
          address: t.address || 'Kiritilmagan',
          region: reg,
          registered_at: t.created_at,
          is_active: t.is_active !== false,
          raw_neon_record: {
            tenant: {
              id: t.id,
              name: t.name,
              phone: t.phone,
              email: t.email || null,
              tax_id: t.tax_id || null,
              address: t.address,
              sector_type: t.sector_type || 'agro_vet',
              plan: t.plan || 'standard',
              settings: t.settings || {},
              created_at: t.created_at
            },
            user: t.user_id || t.user_full_name ? {
              id: t.user_id || null,
              full_name: t.user_full_name || t.name,
              phone: t.user_phone || t.phone,
              role: t.user_role || 'owner',
              telegram_chat_id: t.telegram_chat_id || null
            } : null,
            merchant: t.merchant_id || t.merchant_addr ? {
              id: t.merchant_id || null,
              name: t.merchant_name || t.name,
              phone: t.merchant_phone || t.phone,
              address: t.merchant_addr || t.address,
              created_at: t.merchant_created_at || t.created_at
            } : null
          }
        }
      };
    });

    // Qidiruv va filtrlar
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(r => 
        r.name.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q) ||
        r.region.toLowerCase().includes(q)
      );
    }

    if (source) {
      result = result.filter(r => r.source === source);
    }

    if (status) {
      result = result.filter(r => r.status === status);
    }

    if (region) {
      result = result.filter(r => r.region === region);
    }

    res.json({
      success: true,
      tenants: result
    });
  } catch (err) {
    console.error('List tenants error:', err);
    res.status(500).json({ success: false, error: 'Dorixonalar ro\'yxatini olishda xatolik' });
  }
});

// Helper: bitta korxonani (tenants yoki merchants + users) xavfsiz qidirish
async function findTenantOrMerchantById(id) {
  let tenant = null;

  try {
    const tRes = await pool.query('SELECT * FROM tenants WHERE id = $1', [id]);
    if (tRes.rows.length > 0) {
      tenant = { ...tRes.rows[0] };
    }
  } catch (_) {}

  try {
    const mRes = await pool.query(
      'SELECT * FROM merchants WHERE id = $1 OR tenant_id = $1 OR ($2::text IS NOT NULL AND phone = $2) LIMIT 1',
      [id, tenant?.phone || null]
    );
    if (mRes.rows.length > 0) {
      const m = mRes.rows[0];
      if (!tenant) {
        tenant = {
          id: m.tenant_id || m.id,
          merchant_id: m.id,
          name: m.name,
          phone: m.phone,
          address: m.address,
          merchant_name: m.name,
          merchant_phone: m.phone,
          merchant_addr: m.address,
          merchant_created_at: m.created_at,
          sector_type: 'agro_vet',
          is_active: true,
          created_at: m.created_at
        };
      } else {
        tenant.merchant_id = m.id;
        tenant.merchant_name = m.name;
        tenant.merchant_phone = m.phone;
        tenant.merchant_addr = m.address;
        tenant.merchant_created_at = m.created_at;
        if (!tenant.address && m.address) tenant.address = m.address;
      }
    }
  } catch (_) {}

  if (tenant) {
    try {
      const uRes = await pool.query(
        'SELECT full_name, phone, role_code, telegram_chat_id FROM users WHERE tenant_id = $1 OR phone = $2 ORDER BY created_at ASC LIMIT 1',
        [tenant.id, tenant.phone || '']
      );
      if (uRes.rows.length > 0) {
        tenant.user_full_name = uRes.rows[0].full_name;
        tenant.user_phone = uRes.rows[0].phone;
        tenant.user_role = uRes.rows[0].role_code;
        tenant.telegram_chat_id = uRes.rows[0].telegram_chat_id;
      }
    } catch (_) {}
  }

  return tenant;
}

// 2. Bitta Dorixonaning To'liq Kartochkasi (Detail)
router.get('/:id', requireAdminAuth, requirePermission('tenants:view'), async (req, res) => {
  const { id } = req.params;

  try {
    let tenant = await findTenantOrMerchantById(id);
    let sales = [];
    let productsCount = 0;

    if (tenant) {
      const lookupIds = [tenant.id, tenant.merchant_id].filter(Boolean);
      try {
        const sRes = await pool.query(`
          SELECT id, receipt_number, total_amount, payment_type, status, created_at
          FROM sales
          WHERE tenant_id = ANY($1::uuid[]) OR merchant_id = ANY($1::uuid[])
          ORDER BY created_at DESC
          LIMIT 20
        `, [lookupIds]);
        sales = sRes.rows;
      } catch (_) {}

      try {
        const pRes = await pool.query(
          'SELECT COUNT(*) FROM products WHERE tenant_id = ANY($1::uuid[]) OR merchant_id = ANY($1::uuid[])',
          [lookupIds]
        );
        productsCount = Number(pRes.rows[0]?.count) || 0;
      } catch (_) {}
    }

    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Dorixona topilmadi' });
    }

    const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
    const isTg = (tenant.address && tenant.address.includes('tg:')) || 
                 (tenant.merchant_addr && tenant.merchant_addr.includes('tg:')) || 
                 Boolean(tenant.telegram_chat_id);
    const tgId = tenant.telegram_chat_id || (tenant.merchant_addr && tenant.merchant_addr.includes('tg:') ? tenant.merchant_addr.replace(/^.*tg:/, '') : null);
    const reg = extractRegion(tenant.address);

    res.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        phone: tenant.phone,
        masked_phone: maskPhone(tenant.phone),
        address: tenant.address,
        region: reg,
        source: isTg ? 'telegram_bot' : 'web_browser',
        source_label: isTg ? 'Telegram Bot (@biznesgo_bot)' : 'Veb Brauzer',
        is_active: tenant.is_active !== false,
        status: tenant.is_active !== false ? 'active' : 'suspended',
        created_at: tenant.created_at,
        archive_data: {
          tenant_id: tenant.id,
          store_name: tenant.name,
          owner_name: tenant.user_full_name || tenant.merchant_name || tenant.name,
          phone: tenant.phone,
          masked_phone: maskPhone(tenant.phone),
          telegram_chat_id: tgId,
          source: isTg ? 'telegram_bot' : 'web_browser',
          source_label: isTg ? 'Telegram Bot (@biznesgo_bot)' : 'Veb Brauzer',
          sector_type: tenant.sector_type || 'agro_vet',
          address: tenant.address || 'Kiritilmagan',
          region: reg,
          registered_at: tenant.created_at,
          is_active: tenant.is_active !== false,
          raw_neon_record: tenant
        },
        stats: {
          total_revenue: totalRevenue,
          sales_count: sales.length,
          products_count: productsCount,
          average_check: sales.length > 0 ? Math.round(totalRevenue / sales.length) : 0
        },
        recent_sales: sales
      }
    });
  } catch (err) {
    console.error('Tenant detail error:', err);
    res.status(500).json({ success: false, error: 'Dorixona ma\'lumotlarini yuklashda xatolik' });
  }
});

// 3. Neon Ro'yxatdan O'tganlar Arxivini Alohida Olish
router.get('/:id/archive', requireAdminAuth, requirePermission('tenants:view'), async (req, res) => {
  const { id } = req.params;
  try {
    const raw = await findTenantOrMerchantById(id);

    if (!raw) {
      return res.status(404).json({ success: false, error: 'Arxiv yozuvi topilmadi' });
    }

    res.json({
      success: true,
      archive: {
        tenant_id: raw.id,
        store_name: raw.name,
        owner_name: raw.user_full_name || raw.merchant_name || raw.name,
        phone: raw.phone,
        masked_phone: maskPhone(raw.phone),
        telegram_chat_id: raw.telegram_chat_id || null,
        sector_type: raw.sector_type || 'agro_vet',
        address: raw.address || 'Kiritilmagan',
        region: extractRegion(raw.address),
        registered_at: raw.created_at,
        is_active: raw.is_active !== false,
        raw_neon_record: raw
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Dorixonani Bloklash / Faollashtirish (Audit log bilan)
router.patch('/:id/status', requireAdminAuth, requirePermission('tenants:manage'), async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  const isActive = status === 'active';

  try {
    try {
      await pool.query('UPDATE tenants SET is_active = $1 WHERE id = $2', [isActive, id]);
    } catch (_) {}

    await logAdminAudit({
      adminId: req.admin.admin_id,
      adminName: req.admin.name,
      adminEmail: req.admin.email,
      action: isActive ? 'tenant:activate' : 'tenant:suspend',
      resource: 'tenants',
      resourceId: id,
      details: { status: isActive ? 'active' : 'suspended', reason: reason || 'Admin qarori' },
      reason: reason || (isActive ? 'Hisob qayta faollashtirildi' : 'Qonunchilik yoki to\'lov talabi bo\'yicha bloklandi'),
      ip: req.ip
    });

    res.json({
      success: true,
      message: `Dorixona holati o'zgartirildi: ${isActive ? 'Faol' : 'To\'xtatilgan'}`,
      is_active: isActive,
      status: isActive ? 'active' : 'suspended'
    });
  } catch (err) {
    console.error('Tenant status update error:', err);
    res.status(500).json({ success: false, error: 'Holatni o\'zgartirishda xatolik yuz berdi' });
  }
});

module.exports = router;

