const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { ADMIN_JWT_SECRET, requireAdminAuth, logAdminAudit } = require('./middleware');
const { ROLES, PERMISSIONS } = require('./rbac');

// Standart super admin hisoblari (Poydevor uchun)
// Environment o'zgaruvchilari orqali ham sozlanadi:
const envAdminUsername = process.env.SUPER_ADMIN_USER || process.env.ADMIN_USER || 'admin';
const envAdminPassword = process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'admin123';
const envAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@biznesgo.uz';

const initialAdmins = [
  {
    id: 'adm-super-1',
    name: 'Bosh Administrator',
    full_name: 'Bosh Administrator',
    username: envAdminUsername,
    email: envAdminEmail,
    role: ROLES.SUPER_ADMIN,
    password_hash: envAdminPassword,
    is_2fa_enabled: false, // Foydalanuvchi to'g'ridan-to'g'ri o'zi admin paneldan yoqishi/o'chirishi mumkin
    two_factor_enabled: false,
    totp_secret: 'JBSWY3DPEHPK3PXP', // Mock TOTP
    is_active: true,
    status: 'active',
    created_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'adm-support-1',
    name: 'Texnik Yordam Mutaxassisi',
    full_name: 'Texnik Yordam Mutaxassisi',
    username: 'support',
    email: 'support@biznesgo.uz',
    role: ROLES.SUPPORT,
    password_hash: 'support2026!',
    is_2fa_enabled: false,
    two_factor_enabled: false,
    is_active: true,
    status: 'active',
    created_at: new Date('2026-02-01').toISOString()
  },
  {
    id: 'adm-analyst-1',
    name: 'Moliya Tahlilchisi',
    full_name: 'Moliya Tahlilchisi',
    username: 'analyst',
    email: 'analyst@biznesgo.uz',
    role: ROLES.ANALYST,
    password_hash: 'analyst2026!',
    is_2fa_enabled: false,
    two_factor_enabled: false,
    is_active: true,
    status: 'active',
    created_at: new Date('2026-02-15').toISOString()
  }
];

function formatAdmin(admin) {
  return {
    id: admin.id,
    name: admin.name || admin.full_name,
    full_name: admin.full_name || admin.name,
    username: admin.username || (admin.email ? admin.email.split('@')[0] : 'admin'),
    email: admin.email,
    role: admin.role,
    status: admin.is_active ? 'active' : 'suspended',
    is_active: Boolean(admin.is_active),
    two_factor_enabled: Boolean(admin.is_2fa_enabled || admin.two_factor_enabled),
    is_2fa_enabled: Boolean(admin.is_2fa_enabled || admin.two_factor_enabled),
    created_at: admin.created_at
  };
}

// 1. Kirish (Username/Email + Parol)
router.post('/login', async (req, res) => {
  const { email, username, password } = req.body;
  const loginInput = (username || email || '').trim().toLowerCase();

  if (!loginInput || !password) {
    return res.status(400).json({ error: 'Login (username/email) va parol kiritilishi shart' });
  }

  const admin = initialAdmins.find(a => 
    (a.email && a.email.toLowerCase() === loginInput) ||
    (a.username && a.username.toLowerCase() === loginInput)
  );

  if (!admin || !admin.is_active || admin.password_hash !== password) {
    return res.status(401).json({ error: 'Login yoki parol noto\'g\'ri' });
  }

  // Agar 2FA yoqilgan bo'lsa -> temp_token qaytariladi
  if (admin.is_2fa_enabled) {
    const tempToken = jwt.sign(
      { admin_id: admin.id, email: admin.email, is_temp: true },
      ADMIN_JWT_SECRET,
      { expiresIn: '5m' }
    );
    return res.json({
      success: true,
      require_2fa: true,
      temp_token: tempToken,
      message: 'Ikki bosqichli tasdiqlash (2FA) kodini kiriting'
    });
  }

  // To'g'ridan-to'g'ri token
  const token = jwt.sign(
    {
      admin_id: admin.id,
      name: admin.full_name || admin.name,
      email: admin.email,
      role: admin.role,
      isAdmin: true
    },
    ADMIN_JWT_SECRET,
    { expiresIn: '12h' }
  );

  await logAdminAudit({
    adminId: admin.id,
    adminName: admin.full_name || admin.name,
    adminEmail: admin.email,
    action: 'login',
    resource: 'auth',
    details: { method: 'password' },
    ip: req.ip
  });

  const formatted = formatAdmin(admin);
  return res.json({
    success: true,
    token,
    admin: formatted,
    user: formatted
  });
});

// 2. 2FA (TOTP) Kodini Tasdiqlash
router.post('/2fa/verify', async (req, res) => {
  const { temp_token, code } = req.body;
  if (!temp_token || !code) {
    return res.status(400).json({ success: false, error: 'Tasdiqlash tokeni va 2FA kodi kiritilishi shart' });
  }

  try {
    const decoded = jwt.verify(temp_token, ADMIN_JWT_SECRET);
    if (!decoded.is_temp) {
      return res.status(400).json({ success: false, error: 'Yaroqsiz vaqtinchalik sessiya' });
    }

    const admin = initialAdmins.find(a => a.id === decoded.admin_id);
    if (!admin) {
      return res.status(404).json({ success: false, error: 'Admin topilmadi' });
    }

    // Dev/Pilot test uchun 6 xonali kod (masalan 123456 yoki har qanday 6 xonali kod)
    if (code.length !== 6 || code !== '123456' && code !== '000000') {
      // 123456 va 000000 dev default
      return res.status(400).json({ success: false, error: 'Noto\'g\'ri 2FA kodi (Sinov kodi: 123456)' });
    }

    const token = jwt.sign(
      {
        admin_id: admin.id,
        name: admin.full_name || admin.name,
        email: admin.email,
        role: admin.role,
        isAdmin: true
      },
      ADMIN_JWT_SECRET,
      { expiresIn: '12h' }
    );

    await logAdminAudit({
      adminId: admin.id,
      adminName: admin.full_name || admin.name,
      adminEmail: admin.email,
      action: '2fa_verify',
      resource: 'auth',
      details: { method: 'totp' },
      ip: req.ip
    });

    const formatted = formatAdmin(admin);
    return res.json({
      success: true,
      token,
      admin: formatted,
      user: formatted
    });
  } catch (err) {
    return res.status(401).json({ success: false, error: '2FA sessiyasi muddati tugagan. Qaytadan kiring.' });
  }
});

// 3. Joriy Admin Ma'lumotlari & Ruxsatlar
router.get('/me', requireAdminAuth, (req, res) => {
  const admin = initialAdmins.find(a => a.id === req.admin.admin_id) || req.admin;
  const formatted = formatAdmin(admin);
  res.json({
    success: true,
    admin: formatted,
    user: formatted,
    permissions: Object.keys(PERMISSIONS).filter(perm => {
      const allowed = PERMISSIONS[perm];
      return req.admin.role === ROLES.SUPER_ADMIN || (Array.isArray(allowed) && allowed.includes(req.admin.role));
    })
  });
});

// 4. Admin o'z parolini va ma'lumotlarini o'zgartirishi (Profil sozlamalari)
router.patch('/profile', requireAdminAuth, async (req, res) => {
  const { current_password, new_password, name, full_name, username, email, is_2fa_enabled } = req.body;
  const admin = initialAdmins.find(a => a.id === req.admin.admin_id);

  if (!admin) {
    return res.status(404).json({ success: false, error: 'Admin topilmadi' });
  }

  // Agar yangi parol berilayotgan bo'lsa, joriy parol tekshiriladi
  if (new_password) {
    if (!current_password || admin.password_hash !== current_password) {
      return res.status(400).json({ success: false, error: 'Joriy parol noto\'g\'ri' });
    }
    if (new_password.length < 4) {
      return res.status(400).json({ success: false, error: 'Yangi parol kamida 4 belgidan iborat bo\'lishi kerak' });
    }
    admin.password_hash = new_password;
  }

  if (name || full_name) {
    admin.name = (full_name || name).trim();
    admin.full_name = admin.name;
  }

  if (username) {
    admin.username = username.trim().toLowerCase();
  }

  if (email) {
    admin.email = email.trim().toLowerCase();
  }

  if (typeof is_2fa_enabled === 'boolean') {
    admin.is_2fa_enabled = is_2fa_enabled;
    admin.two_factor_enabled = is_2fa_enabled;
  }

  await logAdminAudit({
    adminId: admin.id,
    adminName: admin.full_name || admin.name,
    adminEmail: admin.email,
    action: 'update_own_profile',
    resource: 'admins',
    resourceId: admin.id,
    details: {
      password_changed: Boolean(new_password),
      username: admin.username,
      email: admin.email,
      is_2fa_enabled: admin.is_2fa_enabled
    },
    ip: req.ip
  });

  const formatted = formatAdmin(admin);
  res.json({
    success: true,
    message: 'Profil va xavfsizlik sozlamalari muvaffaqiyatli saqlandi',
    admin: formatted,
    user: formatted
  });
});

module.exports = { router, initialAdmins, formatAdmin };
