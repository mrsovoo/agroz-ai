const express = require('express');
const router = express.Router();
const { requireAdminAuth, requirePermission, logAdminAudit } = require('./middleware');
const { ROLES } = require('./rbac');
const { initialAdmins, formatAdmin } = require('./auth');

// 1. Adminlar Ro'yxati
router.get('/', requireAdminAuth, requirePermission('admins:view'), (req, res) => {
  const safeAdmins = initialAdmins.map(a => formatAdmin(a));
  res.json({ success: true, admins: safeAdmins });
});

// 2. Yangi Admin Qo'shish
router.post('/', requireAdminAuth, requirePermission('admins:manage'), async (req, res) => {
  const { name, full_name, email, role, password } = req.body;
  const adminName = full_name || name;
  if (!adminName || !email || !role || !password) {
    return res.status(400).json({ success: false, error: 'Barcha maydonlar to\'ldirilishi shart' });
  }

  if (initialAdmins.some(a => a.email.toLowerCase() === email.trim().toLowerCase())) {
    return res.status(400).json({ success: false, error: 'Ushbu email bilan admin allaqachon mavjud' });
  }

  const newAdmin = {
    id: `adm-${Date.now()}`,
    name: adminName.trim(),
    full_name: adminName.trim(),
    email: email.trim().toLowerCase(),
    role,
    password_hash: password,
    is_2fa_enabled: false,
    two_factor_enabled: false,
    is_active: true,
    status: 'active',
    created_at: new Date().toISOString()
  };

  initialAdmins.push(newAdmin);

  await logAdminAudit({
    adminId: req.admin.admin_id,
    adminName: req.admin.name,
    adminEmail: req.admin.email,
    action: 'create_admin',
    resource: 'admins',
    resourceId: newAdmin.id,
    details: { name: newAdmin.name, email: newAdmin.email, role: newAdmin.role },
    ip: req.ip
  });

  const formatted = formatAdmin(newAdmin);
  res.status(201).json({
    success: true,
    message: 'Yangi admin muvaffaqiyatli yaratildi',
    admin: formatted
  });
});

// 3. Admin Rolini Yangilash
router.patch('/:id/role', requireAdminAuth, requirePermission('admins:manage'), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const admin = initialAdmins.find(a => a.id === id);
  if (!admin) {
    return res.status(404).json({ success: false, error: 'Admin topilmadi' });
  }

  const oldRole = admin.role;
  admin.role = role;

  await logAdminAudit({
    adminId: req.admin.admin_id,
    adminName: req.admin.name,
    adminEmail: req.admin.email,
    action: 'update_admin_role',
    resource: 'admins',
    resourceId: admin.id,
    details: { oldRole, newRole: role },
    ip: req.ip
  });

  res.json({ success: true, message: 'Admin roli yangilandi', admin: formatAdmin(admin) });
});

// 4. Adminni Faollashtirish / O'chirish
router.patch('/:id/status', requireAdminAuth, requirePermission('admins:manage'), async (req, res) => {
  const { id } = req.params;
  const admin = initialAdmins.find(a => a.id === id);
  if (!admin) {
    return res.status(404).json({ success: false, error: 'Admin topilmadi' });
  }

  if (admin.id === req.admin.admin_id) {
    return res.status(400).json({ success: false, error: 'O\'zingizni nofaol qila olmaysiz' });
  }

  admin.is_active = !admin.is_active;
  admin.status = admin.is_active ? 'active' : 'suspended';

  await logAdminAudit({
    adminId: req.admin.admin_id,
    adminName: req.admin.name,
    adminEmail: req.admin.email,
    action: admin.is_active ? 'activate_admin' : 'deactivate_admin',
    resource: 'admins',
    resourceId: admin.id,
    details: { is_active: admin.is_active },
    ip: req.ip
  });

  res.json({
    success: true,
    message: `Admin holati o'zgartirildi: ${admin.is_active ? 'Faol' : 'Nofaol'}`,
    admin: formatAdmin(admin)
  });
});

module.exports = router;
