// BiznesGO B2B Core: Settings, Branches, Users, Audit Core & Pilot Onboarding
const express = require('express');
const router = express.Router();
const { pool } = require('../../config');
const { getSector } = require('../../core/sectors');

// 1. Biznes profili va sozlamalari
router.get('/', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;

  try {
    const tenantRes = await pool.query(
      `SELECT id, name, phone, email, tax_id, address, sector_type, plan, settings, created_at 
       FROM tenants 
       WHERE id = $1`,
      [tenantId]
    );

    if (tenantRes.rows.length === 0) {
      return res.json({
        name: 'Agro-Vet Dorixona',
        sector_type: 'agro_vet',
        sector_info: getSector('agro_vet')
      });
    }

    const tenant = tenantRes.rows[0];
    res.json({
      ...tenant,
      sector_info: getSector('agro_vet')
    });
  } catch (err) {
    console.error('Settings fetch error:', err.message);
    res.status(500).json({ error: 'Sozlamalarni yuklab bo\'lmadi' });
  }
});

// 2. Sozlamalarni yangilash
router.put('/', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const { name, phone, email, tax_id, address, settings } = req.body;

  try {
    const updateRes = await pool.query(
      `UPDATE tenants SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        email = COALESCE($3, email),
        tax_id = COALESCE($4, tax_id),
        address = COALESCE($5, address),
        settings = COALESCE($6, settings),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, phone, email, tax_id, address, settings ? JSON.stringify(settings) : null, tenantId]
    );

    if (name) {
      try {
        await pool.query(
          `UPDATE merchants SET name = $1, address = $2 WHERE id = $3 OR tenant_id = $3`,
          [name, address || null, tenantId]
        );
      } catch (_) {}
    }

    res.json({
      message: 'Sozlamalar muvaffaqiyatli saqlandi',
      tenant: updateRes.rows[0]
    });
  } catch (err) {
    console.error('Settings update error:', err.message);
    res.status(500).json({ error: 'Sozlamalarni saqlashda xatolik yuz berdi' });
  }
});

// 3. Filiallar ro'yxati va Yangi Filial qo'shish
router.get('/branches', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  try {
    const result = await pool.query(
      `SELECT * FROM branches WHERE tenant_id = $1 ORDER BY is_main DESC, name ASC`,
      [tenantId]
    );
    res.json({ branches: result.rows });
  } catch (err) {
    res.json({ branches: [] });
  }
});

router.post('/branches', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const { name, code, phone, address, is_main = false } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Filial nomi kiritilishi shart' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO branches (tenant_id, name, code, phone, address, is_main)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [tenantId, name.trim(), code || null, phone || null, address || null, Boolean(is_main)]
    );
    res.status(201).json({ branch: result.rows[0] });
  } catch (err) {
    console.error('Branch create error:', err.message);
    res.status(500).json({ error: 'Filialni saqlashda xatolik yuz berdi' });
  }
});

// 4. Xodimlar (Foydalanuvchilar) ro'yxati va Yangi xodim qo'shish
router.get('/users', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.phone, u.role_code, u.is_active, u.created_at, b.name as branch_name
       FROM users u
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE u.tenant_id = $1
       ORDER BY u.created_at DESC`,
      [tenantId]
    );
    res.json({ users: result.rows });
  } catch (err) {
    res.json({ users: [] });
  }
});

router.post('/users', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const { full_name, phone, role_code = 'cashier', branch_id } = req.body;

  if (!full_name || !phone) {
    return res.status(400).json({ error: 'Xodim ismi va telefoni majburiy' });
  }

  const validRoles = ['owner', 'manager', 'cashier', 'warehouse', 'accountant'];
  if (!validRoles.includes(role_code)) {
    return res.status(400).json({ error: 'Noto\'g\'ri rol tanlandi' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO users (tenant_id, branch_id, phone, full_name, role_code)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, phone, role_code, is_active, created_at`,
      [tenantId, branch_id || null, phone.trim(), full_name.trim(), role_code]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error('User create error:', err.message);
    res.status(500).json({ error: 'Xodimni saqlashda xatolik yuz berdi' });
  }
});

// 5. Audit Log (Amallar tarixi)
router.get('/audit-logs', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const { limit = 50 } = req.query;

  try {
    const result = await pool.query(
      `SELECT l.*, u.full_name as user_name 
       FROM audit_logs l
       LEFT JOIN users u ON l.user_id = u.id
       WHERE l.tenant_id = $1 
       ORDER BY l.created_at DESC 
       LIMIT $2`,
      [tenantId, Number(limit) || 50]
    );
    res.json({ audit_logs: result.rows });
  } catch (err) {
    res.json({ audit_logs: [] });
  }
});

module.exports = router;
