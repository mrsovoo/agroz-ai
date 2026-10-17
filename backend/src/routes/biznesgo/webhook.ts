import { Router } from "express";
import { handleBiznesGoBotUpdate } from "../../lib/biznesgo-bot-flow.js";

const router = Router();

/**
 * POST /api/biznesgo/telegram/webhook
 * POST /api/biznesgo/webhook
 * BiznesGO Telegram bot webhook handler.
 */
router.post(["/webhook", "/bot-webhook", "/telegram/webhook"], async (req, res) => {
  try {
    const expectedSecret =
      process.env.BIZNESGO_WEBHOOK_SECRET?.trim() ||
      process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

    if (expectedSecret) {
      const headerSecret = req.headers["x-telegram-bot-api-secret-token"];
      if (headerSecret !== expectedSecret) {
        return res.status(401).json({ ok: false, error: "Unauthorized webhook request" });
      }
    }

    const update = req.body;
    if (update) {
      await handleBiznesGoBotUpdate(update).catch((err) => {
        console.error("[biznesgo webhook processing error]:", err);
      });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("[biznesgo webhook route error]:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

export default router;

