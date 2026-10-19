/**
 * BiznesGO Merchant Support Routes — /api/biznesgo/support
 * Himoyalangan: authenticate, requireMerchant
 */
const express = require('express');
const { getMerchantMessages, addMessage } = require('../../services/supportService');

const router = express.Router();

/**
 * GET /api/biznesgo/support
 * Joriy do'kon egasining qo'llab-quvvatlash xabarlari tarixi
 */
router.get('/', async (req, res) => {
  try {
    const merchantId = req.merchant.id;
    const messages = await getMerchantMessages(merchantId);
    return res.json({ ok: true, messages });
  } catch (err) {
    console.error('[BiznesGO Support GET Error]:', err.message);
    return res.status(500).json({ ok: false, error: 'Xabarlar yuklanmadi' });
  }
});

/**
 * POST /api/biznesgo/support
 * Do'kon egasidan Super Adminga yangi xabar yuborish
 */
router.post('/', async (req, res) => {
  try {
    const merchant = req.merchant;
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ ok: false, error: 'Xabar matni bo‘sh bo‘lishi mumkin emas' });
    }

    const created = await addMessage({
      merchantId: merchant.id,
      telegramId: merchant.telegram_id || null,
      senderType: 'merchant',
      senderName: merchant.owner_name || merchant.store_name,
      senderPhone: merchant.phone,
      businessType: merchant.business_type,
      message: message.trim(),
      source: 'web',
    });

    return res.status(201).json({ ok: true, message: created });
  } catch (err) {
    console.error('[BiznesGO Support POST Error]:', err.message);
    return res.status(500).json({ ok: false, error: 'Xabar yuborishda xatolik yuz berdi' });
  }
});

module.exports = router;
