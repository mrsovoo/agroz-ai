const jwt = require('jsonwebtoken');
const { pool } = require('../config');
const { hasPermission, ROLES } = require('./rbac');

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'biznesgo_super_admin_secret_key_2026';

// In-Memory fallback audit logs if DB table not yet created
const memoryAuditLogs = [];

async function logAdminAudit({
  adminId,
  adminName,
  adminEmail,
  action,
  resource,
  resourceId = null,
  details = {},
  reason = null,
  ip = '127.0.0.1'
}) {
  const logEntry = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    admin_id: adminId,
    admin_name: adminName,
    admin_email: adminEmail,
    action,
    resource,
    resource_id: resourceId,
    details,
    reason,
    ip_address: ip,
    created_at: new Date().toISOString()
  };

  memoryAuditLogs.unshift(logEntry);

  try {
    await pool.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity, entity_id, new_data)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        null,
        adminId,
        `admin:${action}`,
        resource,
        resourceId,
        JSON.stringify({ ...details, reason, ip, adminEmail })
      ]
    );
  } catch (err) {
    // DB fallback
  }

  return logEntry;
}

// Token tekshirish
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Super Admin avtorizatsiyasidan o\'tmagan' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: 'Ruxsat etilmagan: Admin huquqi talab qilinadi' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Yaroqsiz yoki muddati o\'tgan admin token' });
  }
}

// Ruxsat tekshirish
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
    }

    if (!hasPermission(req.admin.role, permission)) {
      return res.status(403).json({
        error: `Ruxsat yetarli emas. Talab qilinadigan ruxsat: [${permission}]`,
        your_role: req.admin.role
      });
    }

    next();
  };
}

// Sezgir ma'lumotlarni sukut bo'yicha maskalash (telefon, qarz, tannarx)
function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return '***';
  const clean = phone.replace(/\s+/g, '');
  if (clean.length < 9) return '***';
  return clean.slice(0, 4) + ' ' + clean.slice(4, 6) + ' *** ** ' + clean.slice(-2);
}

function maskAmount(amount) {
  return '*** *** so\'m';
}

module.exports = {
  ADMIN_JWT_SECRET,
  requireAdminAuth,
  requirePermission,
  logAdminAudit,
  maskPhone,
  maskAmount,
  memoryAuditLogs
};

