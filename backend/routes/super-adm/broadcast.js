/**
 * Super Admin Broadcast API — POST /api/super-adm/broadcast
 * @biznesgo_bot va @agroz_auth_bot orqali matn va rasmli Push xabarlar yuborish
 */
const express = require('express');
const { HttpError, asyncHandler } = require('../../lib/errors');
const { sendAdminBroadcast } = require('../../services/telegramBot');

const router = express.Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { text, photo_url, target_bots, target_ids } = req.body;

    if (!text || !text.trim()) {
      throw new HttpError(400, 'Xabar matni (text) kiritilishi shart', 'MISSING_TEXT');
    }

    const broadcastResult = await sendAdminBroadcast({
      text: text.trim(),
      photoUrl: photo_url ? photo_url.trim() : null,
      targetBots: Array.isArray(target_bots) ? target_bots : null,
      targetTelegramIds: Array.isArray(target_ids) ? target_ids : null,
    });

    res.json({
      ok: true,
      message: 'Push-xabarnomalar muvaffaqiyatli yuborildi',
      ...broadcastResult,
    });
  })
);

module.exports = router;

