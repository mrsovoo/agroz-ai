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

function parseJsonSafe(val) {
  if (!val) return {};
  if (typeof val === 'object') return val;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch (_) {
      return {};
    }
  }
  return {};
}

// 1. Barcha B2B Dorixonalar Ro'yxati (Filtr, qidiruv va aylanmalar bilan)
router.get('/', requireAdminAuth, requirePermission('tenants:view'), async (req, res) => {
  const { search, source, status, region } = req.query;

  try {
    let tenants = [];
    let merchantsList = [];
    let biznesgoMerchants = [];
    let usersList = [];
    let sales = [];
    let deletedProfiles = [];

    try {
      const tRes = await pool.query(`SELECT * FROM tenants ORDER BY created_at DESC`);
      tenants = tRes.rows || [];
    } catch (_) {}

    try {
      const dpRes = await pool.query(`SELECT * FROM deleted_profiles ORDER BY deleted_at DESC`);
      deletedProfiles = dpRes.rows || [];
    } catch (_) {}

    try {
      const mRes = await pool.query(`SELECT * FROM merchants ORDER BY created_at DESC`);
      merchantsList = mRes.rows || [];
    } catch (_) {}

    try {
      const bmRes = await pool.query(`SELECT * FROM biznesgo_merchants ORDER BY id ASC`);
      biznesgoMerchants = bmRes.rows || [];
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

    // Merchants, BiznesGO Merchants va Users ma'lumotlarini tenants bilan birlashtirish
    const merchantByTenantId = new Map();
    const merchantByPhone = new Map();
    merchantsList.forEach(m => {
      if (m.tenant_id) merchantByTenantId.set(m.tenant_id, m);
      if (m.phone) merchantByPhone.set(String(m.phone).replace(/\D/g, '').slice(-9), m);
    });

    const bmByPhone = new Map();
    biznesgoMerchants.forEach(bm => {
      const p9 = String(bm.phone || '').replace(/\D/g, '').slice(-9);
      if (p9) bmByPhone.set(p9, bm);
    });

    const userByTenantId = new Map();
    const userByPhone = new Map();
    usersList.forEach(u => {
      if (u.tenant_id && !userByTenantId.has(u.tenant_id)) userByTenantId.set(u.tenant_id, u);
      const p9 = String(u.phone || '').replace(/\D/g, '').slice(-9);
      if (p9 && !userByPhone.has(p9)) userByPhone.set(p9, u);
    });

    const existingPhones = new Set(tenants.map(t => String(t.phone || '').replace(/\D/g, '').slice(-9)));
    for (const m of merchantsList) {
      const p9 = String(m.phone || '').replace(/\D/g, '').slice(-9);
      if (p9 && !existingPhones.has(p9)) {
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
        existingPhones.add(p9);
      }
    }

    const deletedByPhoneMap = new Map();
    const deletedByTenantIdMap = new Map();
    deletedProfiles.forEach(dp => {
      if (dp.tenant_id) deletedByTenantIdMap.set(String(dp.tenant_id), dp);
      const p9 = String(dp.phone || '').replace(/\D/g, '').slice(-9);
      if (p9 && !deletedByPhoneMap.has(p9)) deletedByPhoneMap.set(p9, dp);
    });

    tenants = tenants.map(t => {
      const p9 = String(t.phone || '').replace(/\D/g, '').slice(-9);
      const m = merchantByTenantId.get(t.id) || merchantByPhone.get(p9) || {};
      const bm = bmByPhone.get(p9) || {};
      const u = userByTenantId.get(t.id) || userByPhone.get(p9) || {};
      const settingsObj = parseJsonSafe(t.settings);

      return {
        ...t,
        settings: settingsObj,
        merchant_id: t.merchant_id || m.id || bm.id || null,
        merchant_name: t.merchant_name || bm.shop_name || m.name || null,
        merchant_phone: t.merchant_phone || bm.phone || m.phone || null,
        merchant_addr: t.merchant_addr || m.address || null,
        merchant_created_at: t.merchant_created_at || bm.created_at || m.created_at || null,
        user_id: t.user_id || u.id || null,
        user_full_name: settingsObj.owner_name || bm.owner_name || t.user_full_name || u.full_name || u.name || m.name || t.name,
        user_phone: t.user_phone || u.phone || t.phone,
        user_role: t.user_role || u.role_code || u.role || 'owner',
        telegram_chat_id: settingsObj.telegram_id || bm.telegram_id || t.telegram_chat_id || u.telegram_chat_id || u.telegram_id || null,
        biznesgo_merchant: bm.id ? bm : null
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
      const p9 = String(t.phone || '').replace(/\D/g, '').slice(-9);
      const dpRec = deletedByTenantIdMap.get(String(t.id)) || deletedByPhoneMap.get(p9) || null;
      const isTg = (t.merchant_addr && String(t.merchant_addr).includes('tg:')) || 
                   (t.address && String(t.address).includes('tg:')) ||
                   Boolean(t.telegram_chat_id);
      const tgId = t.telegram_chat_id || (t.merchant_addr && String(t.merchant_addr).includes('tg:') ? String(t.merchant_addr).replace(/^.*tg:/, '') : null);
      const reg = extractRegion(t.address);
      const rev = revenueMap.get(t.id) || 0;
      const cnt = countMap.get(t.id) || 0;
      const settingsObj = parseJsonSafe(t.settings);
      const deleteReason = (dpRec && dpRec.delete_reason) || settingsObj.delete_reason || null;
      const deletedAt = (dpRec && dpRec.deleted_at) || settingsObj.deleted_at || null;
      const isDeleted = Boolean(dpRec || settingsObj.is_deleted || deleteReason);

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
        is_deleted: isDeleted,
        delete_reason: deleteReason,
        deleted_at: deletedAt,
        created_at: t.created_at,
        archive_data: {
          tenant_id: t.id,
          store_name: t.name,
          owner_name: t.user_full_name || t.merchant_name || t.name,
          phone: t.phone,
          masked_phone: maskPhone(t.phone),
          telegram_chat_id: tgId ? String(tgId) : null,
          source: isTg ? 'telegram_bot' : 'web_browser',
          source_label: isTg ? 'Telegram Bot (@biznesgo_bot)' : 'Veb Brauzer',
          sector_type: t.sector_type || 'agro_vet',
          address: t.address || 'Kiritilmagan',
          region: reg,
          registered_at: t.created_at,
          is_active: t.is_active !== false,
          is_deleted: isDeleted,
          delete_reason: deleteReason,
          deleted_at: deletedAt,
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
            biznesgo_merchant: t.biznesgo_merchant || null,
            user: t.user_id || t.user_full_name ? {
              id: t.user_id || null,
              full_name: t.user_full_name || t.name,
              phone: t.user_phone || t.phone,
              role: t.user_role || 'owner',
              telegram_chat_id: tgId ? String(tgId) : null
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

// 1.5. Neon DB dagi BARCHA Ro'yxatdan O'tganlar Arxivi (biznesgo_merchants, users, specialists, data_consents, bot_states)
router.get('/neon-archive/all', requireAdminAuth, requirePermission('tenants:view'), async (req, res) => {
  try {
    let tenants = [];
    let biznesgoMerchants = [];
    let legacyMerchants = [];
    let usersList = [];
    let specialists = [];
    let consents = [];
    let botStates = [];
    let botRegSessions = [];
    let deletedProfiles = [];

    try { const r = await pool.query('SELECT * FROM tenants ORDER BY created_at DESC'); tenants = r.rows || []; } catch (_) {}
    try { const r = await pool.query('SELECT * FROM biznesgo_merchants ORDER BY id ASC'); biznesgoMerchants = r.rows || []; } catch (_) {}
    try { const r = await pool.query('SELECT * FROM neon_legacy_merchants ORDER BY id ASC'); legacyMerchants = r.rows || []; } catch (_) {}
    try { const r = await pool.query('SELECT * FROM users ORDER BY id ASC'); usersList = r.rows || []; } catch (_) {}
    try { const r = await pool.query('SELECT * FROM specialists ORDER BY id ASC'); specialists = r.rows || []; } catch (_) {}
    try { const r = await pool.query('SELECT * FROM data_consents ORDER BY id DESC'); consents = r.rows || []; } catch (_) {}
    try { const r = await pool.query('SELECT * FROM bot_states ORDER BY updated_at DESC'); botStates = r.rows || []; } catch (_) {}
    try { const r = await pool.query('SELECT * FROM bot_registration_sessions ORDER BY created_at DESC'); botRegSessions = r.rows || []; } catch (_) {}
    try { const r = await pool.query('SELECT * FROM deleted_profiles ORDER BY deleted_at DESC'); deletedProfiles = r.rows || []; } catch (_) {}

    const activeTenantPhones = new Map();
    const deletedByPhone = new Map();
    deletedProfiles.forEach(dp => {
      const p9 = String(dp.phone || '').replace(/\D/g, '').slice(-9);
      if (p9 && !deletedByPhone.has(p9)) deletedByPhone.set(p9, dp);
    });
    tenants.forEach(t => {
      const p9 = String(t.phone || '').replace(/\D/g, '').slice(-9);
      const sObj = parseJsonSafe(t.settings);
      t.settings = sObj;
      if (p9) activeTenantPhones.set(p9, t);
      if (sObj.delete_reason && p9 && !deletedByPhone.has(p9)) {
        deletedByPhone.set(p9, {
          id: `del-${t.id}`,
          tenant_id: t.id,
          store_name: t.name,
          owner_name: sObj.owner_name || t.name,
          phone: t.phone,
          telegram_id: sObj.telegram_id || null,
          sector_type: t.sector_type || 'agro_vet',
          address: t.address,
          delete_reason: sObj.delete_reason,
          deleted_by: sObj.deleted_by || 'telegram_bot',
          deleted_at: sObj.deleted_at || t.updated_at
        });
      }
    });

    // Barcha yagona ro'yxat ("all_people") ni shakllantirish
    const archiveItems = [];

    // 0. Bot orqali o'chirilgan profillar va ularning sabablari (deleted_profiles)
    for (const dp of Array.from(deletedByPhone.values())) {
      const p9 = String(dp.phone || '').replace(/\D/g, '').slice(-9);
      const matchedTenant = activeTenantPhones.get(p9) || null;
      archiveItems.push({
        uid: `del-${dp.id || p9}`,
        category: 'deleted_profile',
        category_label: 'Botdan O\'chirilgan Profil (deleted_profiles)',
        name: dp.store_name || dp.owner_name || 'O\'chirilgan Do\'kon',
        owner_name: dp.owner_name || dp.store_name || '',
        phone: dp.phone || '',
        masked_phone: maskPhone(dp.phone || ''),
        telegram_id: dp.telegram_id ? String(dp.telegram_id) : null,
        region: extractRegion(dp.address),
        district: '',
        address: dp.address || 'Kiritilmagan',
        role_or_type: `Sabab: ${dp.delete_reason}`,
        delete_reason: dp.delete_reason,
        deleted_at: dp.deleted_at || dp.created_at,
        deleted_by: dp.deleted_by || 'telegram_bot',
        is_biznesgo_active: matchedTenant ? matchedTenant.is_active !== false : false,
        tenant_id: dp.tenant_id || (matchedTenant ? matchedTenant.id : null),
        created_at: dp.deleted_at || dp.created_at,
        raw_data: {
          source_table: 'deleted_profiles',
          delete_reason: dp.delete_reason,
          deleted_at: dp.deleted_at,
          deleted_by: dp.deleted_by || 'telegram_bot',
          record: dp,
          linked_tenant: matchedTenant
        }
      });
    }

    // 1. BiznesGO Merchants (4 ta do'kon + neon_legacy_merchants)
    for (const bm of biznesgoMerchants) {
      const p9 = String(bm.phone || '').replace(/\D/g, '').slice(-9);
      const matchedTenant = activeTenantPhones.get(p9) || null;
      const delInfo = deletedByPhone.get(p9) || null;
      const fullAddr = [bm.region, bm.district, bm.mahalla, bm.address].filter(Boolean).join(', ');
      archiveItems.push({
        uid: `bm-${bm.id}`,
        category: 'biznesgo_store',
        category_label: 'BiznesGO Do\'koni (biznesgo_merchants)',
        name: bm.shop_name || bm.owner_name,
        owner_name: bm.owner_name || bm.shop_name,
        phone: bm.phone || '',
        masked_phone: maskPhone(bm.phone || ''),
        telegram_id: bm.telegram_id ? String(bm.telegram_id) : null,
        region: bm.region || extractRegion(fullAddr),
        district: bm.district || '',
        address: fullAddr || 'Kiritilmagan',
        role_or_type: bm.activity_type || 'agro_vet',
        delete_reason: delInfo ? delInfo.delete_reason : (matchedTenant && matchedTenant.settings ? matchedTenant.settings.delete_reason || null : null),
        deleted_at: delInfo ? delInfo.deleted_at : (matchedTenant && matchedTenant.settings ? matchedTenant.settings.deleted_at || null : null),
        is_biznesgo_active: matchedTenant ? matchedTenant.is_active !== false : false,
        tenant_id: matchedTenant ? matchedTenant.id : null,
        created_at: bm.created_at,
        raw_data: {
          source_table: 'biznesgo_merchants',
          record: bm,
          linked_tenant: matchedTenant,
          deletion_info: delInfo
        }
      });
    }

    // 2. Specialists (3 ta mutaxassis/dorixona)
    for (const sp of specialists) {
      const p9 = String(sp.phone || '').replace(/\D/g, '').slice(-9);
      const matchedTenant = activeTenantPhones.get(p9) || null;
      const fullAddr = [sp.region, sp.district, sp.mahalla, sp.address].filter(Boolean).join(', ');
      archiveItems.push({
        uid: `sp-${sp.id}`,
        category: 'specialist',
        category_label: 'Agro/Vet Mutaxassis (specialists)',
        name: sp.organization || sp.name,
        owner_name: sp.name,
        phone: sp.phone || '',
        masked_phone: maskPhone(sp.phone || ''),
        telegram_id: sp.telegram_id ? String(sp.telegram_id) : null,
        region: sp.region || extractRegion(fullAddr),
        district: sp.district || '',
        address: fullAddr || 'Kiritilmagan',
        role_or_type: `${sp.specialty || 'agronom'} (${sp.experience_years || 0} yil tajriba)`,
        is_biznesgo_active: Boolean(matchedTenant),
        tenant_id: matchedTenant ? matchedTenant.id : null,
        created_at: sp.created_at,
        raw_data: {
          source_table: 'specialists',
          record: sp,
          linked_tenant: matchedTenant
        }
      });
    }

    // 3. Users (25 ta fermer/bot foydalanuvchisi)
    for (const u of usersList) {
      const p9 = String(u.phone || '').replace(/\D/g, '').slice(-9);
      const matchedTenant = activeTenantPhones.get(p9) || null;
      const fullAddr = [u.region, u.district].filter(Boolean).join(', ');
      archiveItems.push({
        uid: `user-${u.id}`,
        category: 'farmer_user',
        category_label: 'Bot / Fermer Foydalanuvchi (users)',
        name: u.name || u.full_name || 'Noma\'lum Foydalanuvchi',
        owner_name: u.name || u.full_name || '',
        phone: u.phone || '',
        second_phone: u.second_phone || null,
        masked_phone: maskPhone(u.phone || ''),
        telegram_id: (u.telegram_id || u.telegram_chat_id) ? String(u.telegram_id || u.telegram_chat_id) : null,
        region: u.region || extractRegion(fullAddr),
        district: u.district || '',
        address: fullAddr || 'Kiritilmagan',
        role_or_type: u.consent_channel || u.role || 'farmer',
        is_biznesgo_active: Boolean(matchedTenant),
        tenant_id: matchedTenant ? matchedTenant.id : null,
        created_at: u.created_at,
        raw_data: {
          source_table: 'users',
          record: u,
          linked_tenant: matchedTenant
        }
      });
    }

    // 4. Data Consents (25 ta O'RQ-547 rozilik bitimi)
    for (const c of consents) {
      const p9 = String(c.phone || '').replace(/\D/g, '').slice(-9);
      const matchedTenant = activeTenantPhones.get(p9) || null;
      archiveItems.push({
        uid: `consent-${c.id}`,
        category: 'data_consent',
        category_label: 'O\'RQ-547 Rozilik Bitimi (data_consents)',
        name: c.full_name || c.phone,
        owner_name: c.full_name || '',
        phone: c.phone || '',
        masked_phone: maskPhone(c.phone || ''),
        telegram_id: c.telegram_id ? String(c.telegram_id) : null,
        region: 'O\'zbekiston',
        district: '',
        address: `Kanal: ${c.consent_channel || 'bot'} | Versiya: ${c.consent_version || 'v1'}`,
        role_or_type: c.subject_type || 'farmer',
        is_biznesgo_active: Boolean(matchedTenant),
        tenant_id: matchedTenant ? matchedTenant.id : null,
        created_at: c.consented_at,
        raw_data: {
          source_table: 'data_consents',
          record: c
        }
      });
    }

    // 5. Bot States & Registration Sessions
    for (const bs of botStates) {
      const dataObj = typeof bs.data === 'object' && bs.data ? bs.data : {};
      const phone = dataObj.phone || '';
      const p9 = String(phone).replace(/\D/g, '').slice(-9);
      const matchedTenant = p9 ? activeTenantPhones.get(p9) : null;
      archiveItems.push({
        uid: `botstate-${bs.chat_id}`,
        category: 'bot_session',
        category_label: 'Telegram Bot Holati (bot_states)',
        name: dataObj.shop_name || dataObj.name || `Telegram Chat #${bs.chat_id}`,
        owner_name: dataObj.name || dataObj.owner_name || '',
        phone: phone || `tg:${bs.chat_id}`,
        masked_phone: phone ? maskPhone(phone) : `tg:${bs.chat_id}`,
        telegram_id: String(bs.chat_id),
        region: dataObj.region || 'Noma\'lum',
        district: dataObj.district || '',
        address: [dataObj.region, dataObj.district, dataObj.mahalla, dataObj.address].filter(Boolean).join(', ') || `Qadam: ${bs.step}`,
        role_or_type: `Qadam: ${bs.step}`,
        is_biznesgo_active: Boolean(matchedTenant),
        tenant_id: matchedTenant ? matchedTenant.id : null,
        created_at: bs.updated_at,
        raw_data: {
          source_table: 'bot_states',
          record: bs
        }
      });
    }

    res.json({
      success: true,
      summary: {
        total_records: archiveItems.length,
        biznesgo_stores_count: biznesgoMerchants.length,
        legacy_merchants_count: legacyMerchants.length,
        farmer_users_count: usersList.length,
        specialists_count: specialists.length,
        consents_count: consents.length,
        bot_sessions_count: botStates.length + botRegSessions.length,
        deleted_profiles_count: deletedByPhone.size
      },
      items: archiveItems,
      tables: {
        biznesgo_merchants: biznesgoMerchants,
        neon_legacy_merchants: legacyMerchants,
        users: usersList,
        specialists,
        data_consents: consents,
        bot_states: botStates,
        bot_registration_sessions: botRegSessions,
        deleted_profiles: Array.from(deletedByPhone.values())
      }
    });
  } catch (err) {
    console.error('Neon archive fetch error:', err);
    res.status(500).json({ success: false, error: 'Neon arxivini yuklashda xatolik yuz berdi' });
  }
});

// 1.6. Arxivdagi foydalanuvchi yoki do'konni BiznesGO B2B platformasida faollashtirish (0-state)
router.post('/neon-archive/activate', requireAdminAuth, requirePermission('tenants:manage'), async (req, res) => {
  const { phone, name, owner_name, address, telegram_id, sector_type } = req.body;
  if (!phone || !name) {
    return res.status(400).json({ success: false, error: 'Do\'kon/Foydalanuvchi nomi va telefon raqami majburiy' });
  }

  const cleanDigits = String(phone).replace(/\D/g, '');
  const last9 = cleanDigits.slice(-9);
  const formattedPhone = last9.length === 9 ? `+998${last9}` : phone;
  const sector = sector_type === 'pharmacy' ? 'pharmacy' : 'agro_vet';

  try {
    const existing = await pool.query(
      `SELECT * FROM tenants WHERE REGEXP_REPLACE(phone, '\\D', '', 'g') LIKE '%' || $1 LIMIT 1`,
      [last9]
    );

    let tenant;
    if (existing.rows.length > 0) {
      const upd = await pool.query(
        `UPDATE tenants SET is_active = TRUE, name = COALESCE($1, name), address = COALESCE($2, address), updated_at = NOW()
         WHERE id = $3 RETURNING *`,
        [name, address || null, existing.rows[0].id]
      );
      tenant = upd.rows[0];
    } else {
      const settingsJson = JSON.stringify({
        owner_name: owner_name || name,
        telegram_id: telegram_id ? String(telegram_id) : null
      });
      const ins = await pool.query(
        `INSERT INTO tenants (name, phone, sector_type, address, is_active, settings)
         VALUES ($1, $2, $3, $4, TRUE, $5::jsonb)
         RETURNING *`,
        [name, formattedPhone, sector, address || null, settingsJson]
      );
      tenant = ins.rows[0];

      await pool.query(
        `INSERT INTO merchants (id, tenant_id, phone, name, business_type, address)
         VALUES ($1, $1, $2, $3, $4, $5)
         ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, tenant_id = EXCLUDED.tenant_id`,
        [tenant.id, formattedPhone, name, sector, telegram_id ? `tg:${telegram_id}` : (address || null)]
      );

      const bRes = await pool.query(
        `INSERT INTO branches (tenant_id, name, code, address, phone, is_main)
         VALUES ($1, 'Bosh Do''kon', 'MAIN', $2, $3, TRUE) RETURNING id`,
        [tenant.id, address || null, formattedPhone]
      );
      const branchId = bRes.rows[0].id;

      await pool.query(
        `INSERT INTO warehouses (tenant_id, branch_id, name, code, type)
         VALUES ($1, $2, 'Asosiy Ombor', 'WH-MAIN', 'main')`,
        [tenant.id, branchId]
      );

      await pool.query(
        `INSERT INTO cash_accounts (tenant_id, branch_id, name, account_type, balance)
         VALUES ($1, $2, 'Asosiy Kassa', 'cash', 0)`,
        [tenant.id, branchId]
      );
    }

    res.json({
      success: true,
      message: `${tenant.name} (${tenant.phone}) BiznesGO platformasida 0-holatda faollashtirildi!`,
      tenant
    });
  } catch (err) {
    console.error('Activate neon archive error:', err);
    res.status(500).json({ success: false, error: 'Faollashtirishda xatolik: ' + err.message });
  }
});

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

