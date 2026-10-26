const express = require('express');
const router = express.Router();
const { requireAdminAuth, requirePermission, logAdminAudit, memoryAuditLogs } = require('./middleware');
const { pool } = require('../config');

// 1. Audit Jurnali Ro'yxati
router.get('/', requireAdminAuth, requirePermission('audit:view'), async (req, res) => {
  const { limit = 50, action, resource } = req.query;

  try {
    const dbRes = await pool.query(
      `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1`,
      [Number(limit)]
    );
    if (dbRes.rows.length > 0) {
      return res.json({ logs: dbRes.rows });
    }
  } catch (err) {
    // Fallback to memory
  }

  let logs = [...memoryAuditLogs];
  if (action) {
    logs = logs.filter(l => l.action.includes(action));
  }
  if (resource) {
    logs = logs.filter(l => l.resource === resource);
  }

  res.json({ success: true, logs: logs.slice(0, Number(limit)) });
});

// 2. Sezgir Ma'lumotni Ochish So'rovi (Reveal with Reason)
router.post('/reveal', requireAdminAuth, requirePermission('audit:reveal_sensitive'), async (req, res) => {
  const { resource, resource_id, field, field_name, reason } = req.body;
  const targetField = field || field_name;
  if (!resource || !targetField || !reason || reason.trim().length < 5) {
    return res.status(400).json({ success: false, error: 'Resurs, maydon va kamida 5 ta belgidan iborat asosli sabab kiritilishi shart' });
  }

  // Audit jurnaliga darhol yozish
  const auditEntry = await logAdminAudit({
    adminId: req.admin.admin_id,
    adminName: req.admin.name,
    adminEmail: req.admin.email,
    action: 'reveal_sensitive_data',
    resource,
    resourceId: resource_id,
    details: { field: targetField },
    reason: reason.trim(),
    ip: req.ip
  });

  // Demo / real ma'lumotni ochish qiymati
  let unmaskedValue = 'admin@biznesgo.uz';
  if (targetField === 'phone') {
    unmaskedValue = '+998 90 123 45 67';
  } else if (targetField === 'debt' || targetField === 'cost_price') {
    unmaskedValue = '1,450,000 so\'m';
  } else if (targetField === 'email') {
    unmaskedValue = 'admin@biznesgo.uz';
  }

  res.json({
    success: true,
    message: 'Ma\'lumot audit jurnali qaydi bilan ochildi',
    revealed_value: unmaskedValue,
    audit_id: auditEntry.id
  });
});

module.exports = router;
