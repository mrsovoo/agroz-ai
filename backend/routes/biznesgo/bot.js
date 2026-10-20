/**
 * Telegram Bot Webhook & Admin Push Routes
 *   - POST /api/biznesgo/bot/webhook/:botType
 *   - POST /api/biznesgo/bot/broadcast
 *   - GET  /api/biznesgo/bot/status
 */
const crypto = require('crypto');
const express = require('express');
const config = require('../../config');
const { asyncHandler, HttpError } = require('../../lib/errors');
const {
  handleAgrozAuthBotUpdate,
  handleBiznesgoBotUpdate,
  handleAgrozgoBotUpdate,
  sendAdminBroadcast,
} = require('../../services/telegramBot');

const router = express.Router();

function verifyAdminAuth(req) {
  const adminKey = req.headers['x-admin-key'] || req.headers['x-bridge-key'];
  const authHeader = req.headers['authorization'];
  let bearerToken = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    bearerToken = authHeader.slice(7).trim();
  }

  const candidate = adminKey || bearerToken;
  if (!candidate) return false;

  const validKeys = [config.adminKey, config.adminPassword, config.bridgeKey].filter(Boolean);
  if (!validKeys.length) return false;

  return validKeys.some((k) => {
    try {
      const a = Buffer.from(candidate);
      const b = Buffer.from(k);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
}

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
  ['/webhook', '/webhook/:botType'],
  asyncHandler(async (req, res) => {
    if (config.telegramWebhookSecret) {
      const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
      if (!secretHeader || secretHeader !== config.telegramWebhookSecret) {
        throw new HttpError(403, "Telegram webhook xavfsizlik kaliti noto'g'ri", 'INVALID_WEBHOOK_SECRET');
      }
    }

    const botType = req.params.botType || 'biznesgo';
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
    } else if (botType === 'agrozgo' || botType === 'agrozgo_bot' || botType === 'agrozai' || botType === 'agrozai_bot') {
      const result = await handleAgrozgoBotUpdate(update);
      return res.json(result);
    } else {
      throw new HttpError(404, `Noma'lum bot turi: ${botType}`, 'BOT_TYPE_NOT_FOUND');
    }
  })
);

/**
 * POST /api/biznesgo/bot/broadcast
 * Admin Push Notifications Support (Xavfsiz: faqat admin kalit bilan ishlaydi)
 */
router.post(
  '/broadcast',
  asyncHandler(async (req, res) => {
    if (!verifyAdminAuth(req)) {
      throw new HttpError(401, "Admin autentifikatsiyasi talab qilinadi (X-Admin-Key yoki Bearer token)", 'ADMIN_AUTH_REQUIRED');
    }

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
