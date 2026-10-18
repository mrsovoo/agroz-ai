/**
 * Telegram Bot Service (Dual-Bot Focus, Redirect & Push Support)
 * - Main: @biznesgo_bot
 * - Legacy: @agroz_auth_bot (Redirects to @biznesgo_bot)
 * - Admin Push Broadcast with automatic fallback between bots
 */
const config = require('../config');
const { query } = require('../db/pool');

async function callTelegramApi(token, method, payload) {
  if (!token) {
    throw new Error('Telegram bot tokeni ko\'rsatilmagan');
  }
  const url = `https://api.telegram.org/bot${token}/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data;
}

/**
 * agroz_auth_bot: Legacy redirect handler
 */
async function handleAgrozAuthBotUpdate(update) {
  const message = update.message || update.edited_message;
  if (!message || !message.chat) return { handled: false, reason: 'NO_MESSAGE' };

  const chatId = message.chat.id;
  const redirectText =
    `📢 <b>BiznesGO B2B platformasi rasmiy botga ko‘chirildi!</b>\n\n` +
    `Do‘koningizni (Tezkor Kassa, Ombor qoldig‘i va Qarz daftari) boshqarish uchun rasmiy botimizga o‘ting:\n\n` +
    `👇 Quyidagi tugmani bosing:`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: "👉 BiznesGO Botga O‘tish",
          url: `https://t.me/${config.biznesgoBotUsername}`,
        },
      ],
    ],
  };

  try {
    const res = await callTelegramApi(config.agrozAuthBotToken, 'sendMessage', {
      chat_id: chatId,
      text: redirectText,
      parse_mode: 'HTML',
      reply_markup: inlineKeyboard,
    });
    return { handled: true, bot: 'agroz_auth_bot', redirected: true, telegram_response: res };
  } catch (err) {
    return { handled: false, error: err.message };
  }
}

/**
 * biznesgo_bot: Main B2B Bot handler
 */
async function handleBiznesgoBotUpdate(update) {
  const message = update.message || update.edited_message;
  if (!message || !message.chat) return { handled: false, reason: 'NO_MESSAGE' };

  const chatId = message.chat.id;
  const text = message.text || '';

  if (text.startsWith('/start otp_')) {
    const otpCode = text.replace('/start otp_', '').trim();
    // 1. otp_codes jadvalidan aktiv kodni topamiz
    const otpRes = await query(
      `SELECT id, phone, expires_at, used FROM otp_codes
        WHERE code = $1 AND used = false AND expires_at > now()
        ORDER BY id DESC LIMIT 1`,
      [otpCode]
    );

    if (otpRes.rows[0]) {
      const otpRow = otpRes.rows[0];
      // telegram_id ni otp_codes ga biriktiramiz
      await query(
        `UPDATE otp_codes SET telegram_id = $1, delivered_at = now() WHERE id = $2`,
        [chatId, otpRow.id]
      );

      // Agar users da shu telefon bo'lsa, unga ham telegram_id ni biriktiramiz (Cross-Platform Sync)
      const phoneDigits = otpRow.phone.replace(/\D/g, '');
      await query(
        `UPDATE users SET telegram_id = $1
          WHERE regexp_replace(COALESCE(phone,''), '\\D', '', 'g') = $2
            AND (telegram_id IS NULL OR telegram_id = $1)`,
        [chatId, phoneDigits]
      );

      const confirmText =
        `🔐 <b>Web Kirish Tasdiqlandi!</b>\n\n` +
        `Sizning tasdiqlash kodingiz: <code>${otpCode}</code>\n\n` +
        `✅ Brauzerga qaytib ushbu 6-xonali kodni kiriting.\n` +
        `Ushbu Telegram hisobingiz va Web profilingiz avtomatik sinxronlashtirildi!`;

      const inlineKeyboard = {
        inline_keyboard: [
          [
            {
              text: "🚀 BiznesGO B2B Ilovasini Ochish",
              web_app: { url: config.miniAppUrl },
            },
          ],
        ],
      };

      try {
        const res = await callTelegramApi(config.biznesgoBotToken, 'sendMessage', {
          chat_id: chatId,
          text: confirmText,
          parse_mode: 'HTML',
          reply_markup: inlineKeyboard,
        });
        return { handled: true, bot: 'biznesgo_bot', otp_confirmed: true, telegram_response: res };
      } catch (err) {
        return { handled: false, error: err.message };
      }
    }
  }

  if (text.startsWith('/start')) {
    const welcomeText =
      `👋 <b>Xush kelibsiz!</b>\n\n` +
      `<b>BiznesGO</b> — O‘zbekistondagi agro-biznes (Agro-Vet dorixona, Yem, Ombor, Urug‘ va Texnika) egalari uchun B2B kassa, ombor va qarz boshqaruvi platformasi.\n\n` +
      `🚀 Tizimni to‘liq ekranda ochish uchun quyidagi tugmani bosing:`;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: "🚀 BiznesGO B2B Ilovasini Ochish",
            web_app: { url: config.miniAppUrl },
          },
        ],
      ],
    };

    try {
      const res = await callTelegramApi(config.biznesgoBotToken, 'sendMessage', {
        chat_id: chatId,
        text: welcomeText,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard,
      });
      return { handled: true, bot: 'biznesgo_bot', started: true, telegram_response: res };
    } catch (err) {
      return { handled: false, error: err.message };
    }
  }

  return { handled: true, bot: 'biznesgo_bot' };
}

/**
 * Admin Push Notifications Support
 * Broadcasts messages to all users, automatically utilizing both biznesgo_bot and agroz_auth_bot fallback.
 */
async function sendAdminBroadcast({ text, photoUrl = null, targetBots = null, targetTelegramIds = null }) {
  if (!text || !text.trim()) {
    throw new Error('Xabar matni kiritilmagan');
  }

  let recipients = targetTelegramIds;

  // Agar aniq ID-lar berilmagan bo'lsa, bazadagi barcha telegram_id larni olamiz
  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    const { rows } = await query(`
      SELECT DISTINCT telegram_id FROM (
        SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL
        UNION
        SELECT telegram_id FROM specialists WHERE telegram_id IS NOT NULL
      ) all_users
      ORDER BY telegram_id
    `);
    recipients = rows.map((r) => Number(r.telegram_id)).filter(Boolean);
  }

  const results = {
    total: recipients.length,
    sent_via_biznesgo: 0,
    sent_via_agroz_auth: 0,
    failed: 0,
    details: [],
  };

  const allowBiznesgo = !targetBots || targetBots.includes('biznesgo') || targetBots.includes('biznesgo_bot');
  const allowAgrozAuth = !targetBots || targetBots.includes('agroz_auth') || targetBots.includes('agroz_auth_bot');

  for (const tgId of recipients) {
    let sent = false;
    let via = null;

    // 1. Birinchi navbatda asosiy bot (biznesgo_bot) orqali yuborishga urinish
    if (allowBiznesgo && config.biznesgoBotToken) {
      try {
        const method = photoUrl ? 'sendPhoto' : 'sendMessage';
        const payload = photoUrl
          ? { chat_id: tgId, photo: photoUrl, caption: text, parse_mode: 'HTML' }
          : { chat_id: tgId, text, parse_mode: 'HTML' };

        const res = await callTelegramApi(config.biznesgoBotToken, method, payload);
        if (res.ok) {
          sent = true;
          via = 'biznesgo_bot';
          results.sent_via_biznesgo++;
        }
      } catch (e) {
        // Fallback to legacy bot below
      }
    }

    // 2. Agar biznesgo_bot dan o'tmasa, eski agroz_auth_bot tokeni bilan yuborish (Legacy support)
    if (!sent && allowAgrozAuth && config.agrozAuthBotToken) {
      try {
        const method = photoUrl ? 'sendPhoto' : 'sendMessage';
        const payload = photoUrl
          ? { chat_id: tgId, photo: photoUrl, caption: text, parse_mode: 'HTML' }
          : { chat_id: tgId, text, parse_mode: 'HTML' };

        const res = await callTelegramApi(config.agrozAuthBotToken, method, payload);
        if (res.ok) {
          sent = true;
          via = 'agroz_auth_bot';
          results.sent_via_agroz_auth++;
        }
      } catch (e) {
        // Both failed
      }
    }

    if (!sent) {
      results.failed++;
    }

    results.details.push({ telegram_id: tgId, success: sent, via });
  }

  return results;
}

module.exports = {
  callTelegramApi,
  handleAgrozAuthBotUpdate,
  handleBiznesgoBotUpdate,
  sendAdminBroadcast,
};

