/**
 * Super Admin Support Routes — /api/super-adm/support
 * Protected by requireSuperAdmin in super-adm/index.js
 */
const express = require('express');
const {
  getAllConversations,
  getThreadMessages,
  replyToThread,
  getUnreadStats,
} = require('../../services/supportService');

const router = express.Router();

/**
 * GET /api/super-adm/support
 * Barcha chat suhbatlari ro'yxati va o'qilmagan xabarlar soni
 */
router.get('/', async (req, res) => {
  try {
    const conversations = await getAllConversations();
    const unread_total = await getUnreadStats();
    return res.json({ ok: true, conversations, unread_total });
  } catch (err) {
    console.error('[SuperAdmin Support GET Error]:', err.message);
    return res.status(500).json({ ok: false, error: 'Suhbatlar yuklanmadi: ' + err.message });
  }
});

/**
 * GET /api/super-adm/support/thread
 * Bitta suhbat bo'yicha barcha xabarlar tarixi
 */
router.get('/thread', async (req, res) => {
  try {
    const merchantId = req.query.merchant_id ? Number(req.query.merchant_id) : null;
    const telegramId = req.query.telegram_id ? Number(req.query.telegram_id) : null;

    if (!merchantId && !telegramId) {
      return res.status(400).json({ ok: false, error: 'merchant_id yoki telegram_id talab qilinadi' });
    }

    const messages = await getThreadMessages({ merchantId, telegramId });
    return res.json({ ok: true, messages });
  } catch (err) {
    console.error('[SuperAdmin Support Thread Error]:', err.message);
    return res.status(500).json({ ok: false, error: 'Xabarlar yuklanmadi: ' + err.message });
  }
});

/**
 * POST /api/super-adm/support/reply
 * Administrator javobini yozish (agar Telegram foydalanuvchisi bo'lsa bot orqali avtomatik jo'natiladi)
 */
router.post('/reply', async (req, res) => {
  try {
    const { merchant_id, telegram_id, message, admin_name } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ ok: false, error: 'Javob xabari bo‘sh bo‘lishi mumkin emas' });
    }

    const result = await replyToThread({
      merchantId: merchant_id ? Number(merchant_id) : null,
      telegramId: telegram_id ? Number(telegram_id) : null,
      message: message.trim(),
      adminName: admin_name || 'Super Admin',
    });

    return res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[SuperAdmin Support Reply Error]:', err.message);
    return res.status(500).json({ ok: false, error: 'Javob yuborishda xatolik: ' + err.message });
  }
});

module.exports = router;

