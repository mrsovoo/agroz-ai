/**
 * Telegram Bot Webhook & Admin Push Routes
 *   - POST /api/biznesgo/bot/webhook/:botType
 *   - POST /api/biznesgo/bot/broadcast
 *   - GET  /api/biznesgo/bot/status
 */
const express = require('express');
const config = require('../../config');
const { asyncHandler, HttpError } = require('../../lib/errors');
const {
  handleAgrozAuthBotUpdate,
  handleBiznesgoBotUpdate,
  sendAdminBroadcast,
} = require('../../services/telegramBot');

const router = express.Router();

/**
 * GET /api/biznesgo/bot/status
 */
router.get(
  '/status',
  asyncHandler(async (_req, res) => {
    res.json({
      main_bot: {
        username: config.biznesgoBotUsername,
        configured: Boolean(config.biznesgoBotToken),
        role: 'Primary B2B Platform Bot (Registration & Fullscreen TMA)',
      },
      legacy_bot: {
        username: config.agrozAuthBotUsername,
        configured: Boolean(config.agrozAuthBotToken),
        role: 'Legacy Redirect Bot (Redirects users to @' + config.biznesgoBotUsername + ')',
      },
      mini_app_url: config.miniAppUrl,
    });
  })
);

/**
 * POST /api/biznesgo/bot/webhook/:botType
 * :botType = 'biznesgo' | 'agroz_auth'
 */
router.post(
  '/webhook/:botType',
  asyncHandler(async (req, res) => {
    const { botType } = req.params;
    const update = req.body;

    if (!update) {
      return res.status(400).json({ error: 'Update obyekti kiritilmagan' });
    }

    if (botType === 'agroz_auth' || botType === 'agroz_auth_bot') {
      const result = await handleAgrozAuthBotUpdate(update);
      return res.json(result);
    } else if (botType === 'biznesgo' || botType === 'biznesgo_bot') {
      const result = await handleBiznesgoBotUpdate(update);
      return res.json(result);
    } else {
      throw new HttpError(404, `Noma'lum bot turi: ${botType}`, 'BOT_TYPE_NOT_FOUND');
    }
  })
);

/**
 * POST /api/biznesgo/bot/broadcast
 * Admin Push Notifications Support
 */
router.post(
  '/broadcast',
  asyncHandler(async (req, res) => {
    const { text, target_ids } = req.body;

    if (!text || !text.trim()) {
      throw new HttpError(400, 'Xabar matni (text) kiritilishi shart', 'MISSING_TEXT');
    }

    const broadcastResult = await sendAdminBroadcast({
      text: text.trim(),
      targetTelegramIds: target_ids,
    });

    res.json({
      ok: true,
      message: 'Xabarnomalar yuborildi',
      ...broadcastResult,
    });
  })
);

module.exports = router;

