// BiznesGO B2B Core: Notification Core
// Tovar tugashi, minimal qoldiq, FEFO muddat va qarz muddati bo'yicha bildirishnomalar

const express = require('express');
const router = express.Router();
const { pool } = require('../../config');

// 1. Bildirishnomalar ro'yxati
router.get('/', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;

  try {
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE tenant_id = $1 
       ORDER BY is_read ASC, created_at DESC 
       LIMIT 30`,
      [tenantId]
    );
    res.json({ notifications: result.rows });
  } catch (err) {
    console.error('Notifications fetch error:', err.message);
    res.json({ notifications: [] });
  }
});

// 2. O'qilgan deb belgilash
router.patch('/:id/read', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const notifId = req.params.id;

  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND tenant_id = $2`,
      [notifId, tenantId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// 3. Barchasini o'qilgan deb belgilash
router.post('/read-all', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;

  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE tenant_id = $1`,
      [tenantId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

module.exports = router;

