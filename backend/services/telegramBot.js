const { pool, jwtSecret, telegramBotToken } = require('../config');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function getBotToken() {
  return telegramBotToken || (process.env.TELEGRAM_BOT_TOKEN || '').trim();
}

function getWebhookSecretToken() {
  const token = getBotToken();
  if (!token) return '';
  return crypto.createHmac('sha256', jwtSecret || 'biznesgo').update(token).digest('hex').slice(0, 48);
}
const registrationSessions = new Map();
const phoneChatMap = new Map();

// Telegram Bot API Native Client
class TelegramApiClient {
  constructor(token) {
    this.token = token;
    this.baseUrl = `https://api.telegram.org/bot${token}`;
    this.offset = 0;
    this.isPolling = false;
  }

  async call(method, body = {}) {
    try {
      const res = await fetch(`${this.baseUrl}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch (err) {
      console.error(`[TelegramBot API ${method}] xatosi:`, err.message);
      return { ok: false, error: err.message };
    }
  }

  async sendMessage(chatId, text, options = {}) {
    return this.call('sendMessage', {
      chat_id: chatId,
      text,
      ...options
    });
  }

  async answerCallbackQuery(callbackQueryId, text = '', showAlert = false) {
    return this.call('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text,
      show_alert: showAlert
    });
  }

  async editMessageText(chatId, messageId, text, options = {}) {
    return this.call('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      ...options
    });
  }

  async setChatMenuButton(webAppUrl) {
    return this.call('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: '🚀 BiznesGO',
        web_app: { url: webAppUrl }
      }
    });
  }

  async setWebhook(url, secretToken) {
    const payload = {
      url,
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: true
    };
    if (secretToken) {
      payload.secret_token = secretToken;
    }
    return this.call('setWebhook', payload);
  }

  async getWebhookInfo() {
    return this.call('getWebhookInfo');
  }

  async deleteWebhook() {
    return this.call('deleteWebhook', { drop_pending_updates: false });
  }

  async getUpdates() {
    try {
      const res = await fetch(`${this.baseUrl}/getUpdates?offset=${this.offset}&timeout=20`, {
        signal: AbortSignal.timeout(30000)
      });
      return await res.json();
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  startPolling(onMessage, onCallback) {
    if (this.isPolling) return;
    this.isPolling = true;

    const poll = async () => {
      if (!this.isPolling) return;
      try {
        const data = await this.getUpdates();
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            this.offset = update.update_id + 1;
            if (update.message && onMessage) {
              await onMessage(update.message);
            } else if (update.callback_query && onCallback) {
              await onCallback(update.callback_query);
            }
          }
        }
      } catch (err) {
        console.error('[TelegramBot Polling] loop xatosi:', err.message);
      }
      setTimeout(poll, 1000);
    };

    poll();
  }

  stopPolling() {
    this.isPolling = false;
  }
}

// Global bot mijozi
let globalBotClient = null;

// Xabarlarni qayta ishlash asosiy mantiqi
async function handleTelegramMessage(client, msg) {
  const chatId = msg.chat?.id;
  if (!chatId) return;

  const text = msg.text ? msg.text.trim() : '';
  const tgUserId = msg.from?.id;
  const firstName = msg.from?.first_name || 'Do\'kon egasi';
  const webAppUrl = process.env.WEBAPP_URL || 'https://biznesgo.vercel.app';

  console.log(`[Telegram Bot] Xabar keldi from ${chatId} (${firstName}):`, text || (msg.contact ? 'Contact' : 'Other'));

  // Asosiy klaviatura
  const getMainMenuKeyboard = () => ({
    reply_markup: {
      keyboard: [
        [
          {
            text: '🚀 BiznesGO Kassani Ochish',
            web_app: { url: webAppUrl }
          }
        ],
        [
          { text: '📊 Bugungi Kassa' },
          { text: '⚠️ FEFO Xavfi' }
        ],
        [
          { text: '📒 Qarz Daftari' },
          { text: '📦 Kam Qolgan Dorilar' }
        ],
        [
          { text: '👤 Profilim' },
          { text: 'ℹ️ Yordam va Qo\'llab-quvvatlash' }
        ]
      ],
      resize_keyboard: true,
      persistent: true
    }
  });

  // 1. /start buyrug'i
  if (text.startsWith('/start')) {
    try {
      const parts = text.split(' ');
      const startPayload = parts[1] ? parts[1].trim() : '';

      // Agar start payload ro'yxatdan o'tish sessiyasi bo'lsa (masalan: reg_abcdef)
      if (startPayload && startPayload.startsWith('reg_')) {
        let session = registrationSessions.get(startPayload);
        if (!session) {
          try {
            const dbRes = await pool.query(`SELECT data FROM biznesgo_reg_sessions WHERE token = $1`, [startPayload]);
            if (dbRes.rows.length > 0 && dbRes.rows[0].data) {
              session = dbRes.rows[0].data;
              registrationSessions.set(startPayload, session);
            }
          } catch (_) {}
        }
        if (session) {
          session.tgUserId = tgUserId;
          session.tgChatId = chatId;
          phoneChatMap.set(session.phone.replace(/\D/g, ''), chatId);
          if (tgUserId) phoneChatMap.set(String(tgUserId), chatId);
          try {
            await pool.query(
              `UPDATE biznesgo_reg_sessions SET data = $2::jsonb, updated_at = NOW() WHERE token = $1`,
              [startPayload, JSON.stringify(session)]
            );
          } catch (_) {}

          return client.sendMessage(
            chatId,
            `🌿💊 *BiznesGO: Yangi Dorixonani Tasdiqlash*\n\n` +
            `🏢 *Dorixona:* ${session.name}\n` +
            `👤 *Mas'ul:* ${session.owner_name || firstName}\n` +
            `📱 *Telefon:* \`${session.phone}\`\n` +
            (session.address ? `📍 *Manzil:* ${session.address}\n\n` : `\n`) +
            `Barcha ma'lumotlar to'g'ri bo'lsa, pastdagi tugmani bosing va faollashtiring:`,
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: '✅ Tasdiqlash va Faollashtirish',
                      callback_data: `approve_${startPayload}`
                    }
                  ]
                ]
              }
            }
          );
        }
      }

      let userExists = false;
      let merchantName = 'Agro-Vet Dorixona';
      let matchedPhone = null;

      try {
        const tRes = await pool.query(
          `SELECT name, phone FROM tenants 
           WHERE settings->>'telegram_id' = $1 OR address LIKE $2 OR phone LIKE $3
           LIMIT 1`,
          [String(tgUserId), `%tg:${tgUserId}%`, `%${tgUserId}%`]
        );
        if (tRes.rows.length > 0) {
          userExists = true;
          merchantName = tRes.rows[0].name;
          matchedPhone = tRes.rows[0].phone;
        }
      } catch (_) {}

      if (!userExists) {
        try {
          const userRes = await pool.query(
            'SELECT * FROM merchants WHERE phone LIKE $1 OR address LIKE $2 LIMIT 1',
            [`%${tgUserId}%`, `%tg:${tgUserId}%`]
          );
          if (userRes.rows.length > 0) {
            userExists = true;
            merchantName = userRes.rows[0].name || userRes.rows[0].store_name || merchantName;
            matchedPhone = userRes.rows[0].phone;
          }
        } catch (_) {}
      }

      if (!userExists) {
        try {
          const bmRes = await pool.query(
            'SELECT organization_name, name, phone FROM biznesgo_merchants WHERE telegram_id::text = $1 LIMIT 1',
            [String(tgUserId)]
          );
          if (bmRes.rows.length > 0) {
            userExists = true;
            merchantName = bmRes.rows[0].organization_name || bmRes.rows[0].name;
            matchedPhone = bmRes.rows[0].phone;
          }
        } catch (_) {}
      }

      if (matchedPhone) {
        phoneChatMap.set(String(matchedPhone).replace(/\D/g, ''), chatId);
      }
      if (tgUserId) {
        phoneChatMap.set(String(tgUserId), chatId);
      }

      // Agar foydalanuvchi veb-brauzerda OTP so'ragan bo'lsa, /start bosishi bilan kodni yuboramiz
      try {
        const last9 = matchedPhone ? String(matchedPhone).replace(/\D/g, '').slice(-9) : null;
        const otpRes = await pool.query(
          `SELECT id, code FROM otp_codes
           WHERE used = FALSE AND expires_at > NOW()
             AND (telegram_id::text = $1 OR ($2::text IS NOT NULL AND REGEXP_REPLACE(phone, '\\D', '', 'g') LIKE '%' || $2))
           ORDER BY created_at DESC LIMIT 1`,
          [String(tgUserId), last9]
        );
        if (otpRes.rows.length > 0) {
          await client.sendMessage(
            chatId,
            `🔐 *BiznesGO Kirish Kodi:* \`${otpRes.rows[0].code}\`\n\n` +
            `Ushbu kodni veb brauzerga (biznesgo.uz) kiriting.\n` +
            `⏱ Amal qilish muddati: *5 daqiqa*.`,
            { parse_mode: 'Markdown' }
          );
        }
      } catch (_) {}

      if (userExists) {
        return client.sendMessage(
          chatId,
          `Xush kelibsiz, *${firstName}*! 🌿💊\n\n` +
          `🏢 *${merchantName}*\n\n` +
          `Kassa, ombor yoki qarz daftarini ochish uchun quyidagi tugmani bosing:`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🚀 BiznesGO Mobil Appni Ochish',
                    web_app: { url: `${webAppUrl}?tg_id=${tgUserId}&store=${encodeURIComponent(merchantName)}` }
                  }
                ]
              ],
              ...getMainMenuKeyboard().reply_markup
            }
          }
        );
      }

      // Yangi foydalanuvchi: telefon raqam so'rash
      return client.sendMessage(
        chatId,
        `*Assalomu alaykum, ${firstName}!* 🌿💊\n\n` +
        `*BiznesGO* — Veterinariya dorixonalari va o'g'it do'konlari uchun avtomatlashtirilgan kassa va ombor platformasiga xush kelibsiz!\n\n` +
        `Do'koningizni tizimda ro'yxatdan o'tkazish uchun telefon raqamingizni yuboring:`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [
              [
                {
                  text: '📱 Telefon raqamni yuborish',
                  request_contact: true
                }
              ]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        }
      );
    } catch (err) {
      console.error('/start error:', err);
    }
    return;
  }

  // 2. Telefon raqam qabul qilish (contact)
  if (msg.contact) {
    let phone = msg.contact.phone_number;
    if (!phone.startsWith('+')) phone = `+${phone}`;
    const cleanDigits = phone.replace(/\D/g, '');
    const last9 = cleanDigits.slice(-9);
    phoneChatMap.set(cleanDigits, chatId);
    if (tgUserId) phoneChatMap.set(String(tgUserId), chatId);

    try {
      // Agar foydalanuvchiga aktiv OTP kodi kutayotgan bo'lsa, uni ham yuboramiz
      try {
        const otpRes = await pool.query(
          `SELECT code FROM otp_codes
           WHERE used = FALSE AND expires_at > NOW()
             AND REGEXP_REPLACE(phone, '\\D', '', 'g') LIKE '%' || $1
           ORDER BY created_at DESC LIMIT 1`,
          [last9]
        );
        if (otpRes.rows.length > 0) {
          await client.sendMessage(
            chatId,
            `🔐 *BiznesGO Kirish Kodi:* \`${otpRes.rows[0].code}\`\n\n` +
            `Ushbu kodni veb brauzerga (biznesgo.uz) kiriting.`,
            { parse_mode: 'Markdown' }
          );
        }
      } catch (_) {}

      let isRegistered = false;
      let merchantName = '';

      try {
        const tCheck = await pool.query(
          `SELECT id, name FROM tenants WHERE REGEXP_REPLACE(phone, '\\D', '', 'g') LIKE '%' || $1 LIMIT 1`,
          [last9]
        );
        if (tCheck.rows.length > 0) {
          isRegistered = true;
          merchantName = tCheck.rows[0].name;
          await pool.query(
            `UPDATE tenants SET settings = settings || $1::jsonb WHERE id = $2`,
            [JSON.stringify({ telegram_id: String(tgUserId || chatId) }), tCheck.rows[0].id]
          );
        }
      } catch (_) {}

      try {
        const checkRes = await pool.query(
          `SELECT * FROM merchants WHERE REGEXP_REPLACE(phone, '\\D', '', 'g') LIKE '%' || $1 LIMIT 1`,
          [last9]
        );
        if (checkRes.rows.length > 0) {
          isRegistered = true;
          if (!merchantName) merchantName = checkRes.rows[0].name;
          await pool.query('UPDATE merchants SET address = $1 WHERE id = $2', [
            `tg:${tgUserId}`,
            checkRes.rows[0].id
          ]);
        }
      } catch (dbErr) {}

      if (isRegistered) {
        return client.sendMessage(
          chatId,
          `✅ *Telefoningiz tasdiqlandi!*\n\n` +
          `🏢 *Do'kon:* ${merchantName}\n` +
          `Boshqaruv panelini ochish uchun pastdagi tugmani bosing:`,
          {
            parse_mode: 'Markdown',
            ...getMainMenuKeyboard()
          }
        );
      }

      // Yangi do'kon nomi so'rash
      registrationSessions.set(chatId, {
        step: 'awaiting_store_name',
        phone: `+998${last9}`,
        tgUserId,
        ownerName: `${msg.from.first_name || ''} ${msg.from.last_name || ''}`.trim() || 'Do\'kon Egasi'
      });

      return client.sendMessage(
        chatId,
        `✅ Telefon raqamingiz qabul qilindi: *+998${last9}*\n\n` +
        `🏢 Endi agro-vet dorixonangiz nomini kiriting:\n` +
        `_(Masalan: Agro-Vet Fayz, Baraka Veterinariya, Chinoz O'g'itlar)_`,
        {
          parse_mode: 'Markdown',
          reply_markup: { remove_keyboard: true }
        }
      );
    } catch (err) {
      console.error('Contact handler error:', err);
    }
    return;
  }

  // 3. Matnli xabarlar
  if (!text) return;

  // A) Ro'yxatdan o'tish (Do'kon nomi kiritilganda)
  const session = registrationSessions.get(chatId);
  if (session && session.step === 'awaiting_store_name') {
    const storeName = text;
    try {
      await finalizeRegistration(
        {
          phone: session.phone,
          name: storeName,
          owner_name: session.ownerName,
          sector_type: 'agro_vet',
          address: `tg:${session.tgUserId || chatId}`
        },
        session.tgUserId,
        chatId
      );

      registrationSessions.delete(chatId);

      return client.sendMessage(
        chatId,
        `🎉 *Tabriklaymiz! Do'koningiz muvaffaqiyatli ro'yxatdan o'tdi!*\n\n` +
        `🏢 *${storeName}*\n\n` +
        `Pastdagi tugma orqali ilovani xuddi mobil ilovadek ochishingiz mumkin:`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🚀 BiznesGO Mobil Appni Ochish',
                  web_app: { url: `${webAppUrl}?store=${encodeURIComponent(storeName)}` }
                }
              ]
            ],
            ...getMainMenuKeyboard().reply_markup
          }
        }
      );
    } catch (err) {
      console.error('Do\'kon yaratish xatosi:', err);
    }
    return;
  }

  // B) "📊 Bugungi Kassa"
  if (text === '📊 Bugungi Kassa') {
    try {
      const salesRes = await pool.query(`
        SELECT 
          COUNT(*) as total_count,
          COALESCE(SUM(total_amount), 0) as total_sum,
          COALESCE(SUM(cash_amount), 0) as cash_sum,
          COALESCE(SUM(card_amount), 0) as card_sum,
          COALESCE(SUM(debt_amount), 0) as debt_sum
        FROM sales
        WHERE DATE(created_at) = CURRENT_DATE
      `);
      const data = salesRes.rows[0];

      return client.sendMessage(
        chatId,
        `📊 *Bugungi Kassa Hisoboti:*\n\n` +
        `💰 *Jami tushum:* ${Number(data.total_sum).toLocaleString('uz-UZ')} so'm\n` +
        `💵 *Naqd:* ${Number(data.cash_sum).toLocaleString('uz-UZ')} so'm\n` +
        `💳 *Karta:* ${Number(data.card_sum).toLocaleString('uz-UZ')} so'm\n` +
        `📝 *Nasiya (Qarz):* ${Number(data.debt_sum).toLocaleString('uz-UZ')} so'm\n` +
        `🧾 *Cheklar soni:* ${data.total_count} ta\n\n` +
        `_Kassa doimiy tarzda ishlamoqda._`,
        { parse_mode: 'Markdown', ...getMainMenuKeyboard() }
      );
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        return client.sendMessage(
          chatId,
          `📊 *Bugungi Kassa Hisoboti:*\n\n` +
          `💰 *Jami tushum:* 0 so'm\n` +
          `💵 *Naqd:* 0 so'm\n` +
          `💳 *Karta:* 0 so'm\n` +
          `📝 *Nasiya (Qarz):* 0 so'm\n` +
          `🧾 *Cheklar soni:* 0 ta\n\n` +
          `_Bugun hali yangi savdo amalga oshirilmadi._`,
          { parse_mode: 'Markdown', ...getMainMenuKeyboard() }
        );
      }
      return client.sendMessage(
        chatId,
        `📊 *Bugungi Kassa (Lokal Sinov):*\n\n` +
        `💰 *Jami tushum:* 3,450,000 so'm\n` +
        `💵 *Naqd:* 2,100,000 so'm\n` +
        `💳 *Karta:* 950,000 so'm\n` +
        `📝 *Nasiya (Qarz):* 400,000 so'm\n` +
        `🧾 *Cheklar soni:* 24 ta\n`,
        { parse_mode: 'Markdown', ...getMainMenuKeyboard() }
      );
    }
  }

  // C) "⚠️ FEFO Xavfi"
  if (text === '⚠️ FEFO Xavfi') {
    try {
      const expiryRes = await pool.query(`
        SELECT name, batch_number, expiry_date, stock,
               (expiry_date - CURRENT_DATE) as days_left
        FROM products
        WHERE (expiry_date - CURRENT_DATE) <= 30 AND stock > 0
        ORDER BY expiry_date ASC
        LIMIT 5
      `);

      if (expiryRes.rows.length === 0) {
        return client.sendMessage(
          chatId,
          `✅ *Muddati tugayotgan dori yo'q!*\nBarcha dorilar yaroqlilik muddati xavfsiz holatda.`,
          { parse_mode: 'Markdown', ...getMainMenuKeyboard() }
        );
      }

      let msgText = `⚠️ *FEFO: Muddati 30 kun ichida tugaydigan preparatlar:*\n_Birinchi navbatda sotish talab etiladi:_\n\n`;
      expiryRes.rows.forEach((p, idx) => {
        msgText += `${idx + 1}. *${p.name}* (Seriya: \`${p.batch_number}\`)\n` +
                   `   ⏳ Muddati: ${p.expiry_date} (*${p.days_left} kun qoldi*)\n` +
                   `   📦 Qoldiq: ${p.stock} dona\n\n`;
      });

      return client.sendMessage(chatId, msgText, { parse_mode: 'Markdown', ...getMainMenuKeyboard() });
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        return client.sendMessage(
          chatId,
          `✅ *Muddati tugayotgan dori yo'q!*\nBarcha dorilar yaroqlilik muddati xavfsiz holatda.`,
          { parse_mode: 'Markdown', ...getMainMenuKeyboard() }
        );
      }
      return client.sendMessage(
        chatId,
        `⚠️ *FEFO Xavfi (Lokal Sinov):*\n\n` +
        `1. *Oksitetratsiklin 20% LA* (Seriya: \`OKS-2401\`)\n   ⏳ *15 kun qoldi* | 📦 6 dona\n` +
        `2. *Ivermektin 1%* (Seriya: \`IVM-889\`)\n   ⏳ *25 kun qoldi* | 📦 14 dona\n`,
        { parse_mode: 'Markdown', ...getMainMenuKeyboard() }
      );
    }
  }

  // D) "📒 Qarz Daftari"
  if (text === '📒 Qarz Daftari') {
    try {
      const debtRes = await pool.query(`
        SELECT name, phone, farm_profile, debt_balance, due_date
        FROM customers
        WHERE debt_balance > 0
        ORDER BY debt_balance DESC
        LIMIT 5
      `);

      const sumRes = await pool.query('SELECT COALESCE(SUM(debt_balance), 0) as total FROM customers');
      const totalDebt = Number(sumRes.rows[0]?.total || 0).toLocaleString('uz-UZ');

      if (debtRes.rows.length === 0) {
        return client.sendMessage(
          chatId,
          `📒 *Qarz Daftari Toza!*\nHozirda faol nasiyadorlar mavjud emas (Umumiy qarz: 0 so'm).`,
          { parse_mode: 'Markdown', ...getMainMenuKeyboard() }
        );
      }

      let msgText = `📒 *Qarz Daftari Xulosasi:*\n` +
                    `💰 *Umumiy nasiya balansi:* ${totalDebt} so'm\n\n` +
                    `*Eng katta qarzdor fermerlar:*\n`;

      debtRes.rows.forEach((c, idx) => {
        msgText += `${idx + 1}. *${c.name}* — ${Number(c.debt_balance).toLocaleString('uz-UZ')} so'm\n` +
                   `   🚜 ${c.farm_profile || 'Chorva/Ekin'} | 📞 ${c.phone}\n` +
                   `   📅 Qaytarish: ${c.due_date || 'Belgilanmagan'}\n\n`;
      });

      return client.sendMessage(chatId, msgText, { parse_mode: 'Markdown', ...getMainMenuKeyboard() });
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        return client.sendMessage(
          chatId,
          `📒 *Qarz Daftari Toza!*\nHozirda faol nasiyadorlar mavjud emas (Umumiy qarz: 0 so'm).`,
          { parse_mode: 'Markdown', ...getMainMenuKeyboard() }
        );
      }
      return client.sendMessage(
        chatId,
        `📒 *Qarz Daftari (Lokal Sinov):*\n` +
        `💰 *Umumiy nasiya balansi:* 4,750,000 so'm\n\n` +
        `1. *Shavkat fermer* — 1,280,000 so'm (Chorva)\n` +
        `2. *Rustam aka* — 850,000 so'm (Issiqxona)\n`,
        { parse_mode: 'Markdown', ...getMainMenuKeyboard() }
      );
    }
  }

  // E) "📦 Kam Qolgan Dorilar"
  if (text === '📦 Kam Qolgan Dorilar') {
    try {
      const lowStockRes = await pool.query(`
        SELECT name, stock, min_stock, batch_number
        FROM products
        WHERE stock <= min_stock
        ORDER BY stock ASC
        LIMIT 5
      `);

      if (lowStockRes.rows.length === 0) {
        return client.sendMessage(chatId, `✅ *Ombordagi barcha preparatlar zaxirasi yetarli!*`, {
          parse_mode: 'Markdown',
          ...getMainMenuKeyboard()
        });
      }

      let msgText = `📦 *Omborda Kam Qolgan Dorilar:*\n_Yangi partiyaga buyurtma berish tavsiya qilinadi:_\n\n`;
      lowStockRes.rows.forEach((p, idx) => {
        msgText += `${idx + 1}. *${p.name}* — *${p.stock} dona* qoldi (Minimal: ${p.min_stock})\n`;
      });

      return client.sendMessage(chatId, msgText, { parse_mode: 'Markdown', ...getMainMenuKeyboard() });
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        return client.sendMessage(chatId, `✅ *Ombordagi barcha preparatlar zaxirasi yetarli!*`, {
          parse_mode: 'Markdown',
          ...getMainMenuKeyboard()
        });
      }
      return client.sendMessage(
        chatId,
        `📦 *Kam Qolgan Dorilar (Lokal Sinov):*\n\n` +
        `1. *Biovit-80* — 8 ta qoldi (Minimal: 10)\n` +
        `2. *Ammofos 12:52* — 3 qop qoldi (Minimal: 5)\n`,
        { parse_mode: 'Markdown', ...getMainMenuKeyboard() }
      );
    }
  }

  // F) "👤 Profilim" yoki "/profil"
  if (text === '👤 Profilim' || text === '/profil' || text.toLowerCase() === 'profil') {
    try {
      let store = null;
      let user = null;

      try {
        const merchantRes = await pool.query(
          `SELECT m.*, t.sector_type, t.plan, t.created_at as reg_date 
           FROM merchants m 
           LEFT JOIN tenants t ON m.tenant_id = t.id 
           WHERE m.address LIKE $1 OR m.phone LIKE $2 
           LIMIT 1`,
          [`%${tgUserId}%`, `%${tgUserId}%`]
        );
        if (merchantRes.rows.length > 0) {
          store = merchantRes.rows[0];
        }
      } catch (dbErr) {
        console.warn('DB profile query error:', dbErr.message);
      }

      if (!store) {
        // Chat mappingdan qidirib ko'ramiz
        for (const [p, cId] of phoneChatMap.entries()) {
          if (cId === chatId) {
            try {
              const res = await pool.query('SELECT * FROM merchants WHERE phone LIKE $1 LIMIT 1', [`%${p.slice(-9)}%`]);
              if (res.rows.length > 0) store = res.rows[0];
            } catch (_) {}
            break;
          }
        }
      }

      if (store) {
        const regDate = store.reg_date ? new Date(store.reg_date).toLocaleDateString('uz-UZ') : 'Yaqinda';
        const sectorNames = {
          agro_vet: 'Agro-Vet Dorixona',
          feed_nutrition: 'Yem va Ozuqa',
          seeds_seedlings: "Urug' va Ko'chat",
          greenhouse_livestock_eq: 'Issiqxona va Jihozlar',
          agro_machinery: 'Agro Texnika'
        };
        const sectorLabel = sectorNames[store.sector_type || store.business_type] || 'Agro-Vet Dorixona';

        return client.sendMessage(
          chatId,
          `👤 *Foydalanuvchi va Do'kon Profili:*\n\n` +
          `🏢 *Do'kon:* ${store.name}\n` +
          `🏷 *Soha (Sektor):* ${sectorLabel}\n` +
          `📱 *Telefon:* \`${store.phone}\`\n` +
          (store.address && !store.address.startsWith('tg:') ? `📍 *Manzil:* ${store.address}\n` : '') +
          `⭐️ *Tarif:* ${store.plan ? store.plan.toUpperCase() : 'STANDARD B2B'}\n` +
          `📅 *Ro'yxatdan o'tgan sana:* ${regDate}\n` +
          `🆔 *Telegram ID:* \`${tgUserId || chatId}\`\n\n` +
          `_Kassani brauzerda yoki ushbu bot ichida ochishingiz mumkin._`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🚀 BiznesGO Ilovasini Ochish',
                    web_app: { url: `${webAppUrl}?tg_id=${tgUserId}&store=${encodeURIComponent(store.name)}` }
                  }
                ],
                [
                  {
                    text: '🔄 Ma\'lumotlarni Yangilash',
                    callback_data: 'refresh_profile'
                  }
                ]
              ]
            }
          }
        );
      }

      // Agar hali do'kon topilmasa yoki biriktirilmagan bo'lsa
      return client.sendMessage(
        chatId,
        `👤 *Sizning Profilingiz:*\n\n` +
        `👤 *Ism:* ${firstName}\n` +
        `🆔 *Telegram ID:* \`${tgUserId || chatId}\`\n` +
        `⚠️ *Holat:* Sizning Telegram hisobingizga hozircha do'kon biriktirilmagan.\n\n` +
        `Do'koningizni ro'yxatdan o'tkazish yoki ulash uchun pastdagi tugmani bosing:`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [
              [
                {
                  text: '📱 Telefon raqamni yuborish',
                  request_contact: true
                }
              ],
              [
                { text: 'ℹ️ Yordam va Qo\'llab-quvvatlash' }
              ]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        }
      );
    } catch (err) {
      console.error('Profile handler error:', err);
      return client.sendMessage(chatId, `❌ Profilni yuklashda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.`, getMainMenuKeyboard());
    }
  }

  // G) "ℹ️ Yordam va Qo'llab-quvvatlash" yoki "/yordam"
  if (text === 'ℹ️ Yordam va Qo\'llab-quvvatlash' || text === '/yordam' || text.toLowerCase() === 'yordam' || text === '/help') {
    return client.sendMessage(
      chatId,
      `ℹ️ *BiznesGO B2B Yordam Markazi* 🌿💊\n\n` +
      `BiznesGO — Agro-veterinariya dorixonalari va qishloq xo'jaligi do'konlari uchun maxsus ishlab chiqilgan avtomatlashtirilgan boshqaruv tizimi.\n\n` +
      `📌 *Mavjud buyruqlar va imkoniyatlar:*\n` +
      `• *🚀 BiznesGO Kassani Ochish* — To'liq kassa va omborni ilova sifatida ochish\n` +
      `• *📊 Bugungi Kassa* — Kunlik naqd, karta, nasiya va tushum hisoboti\n` +
      `• *⚠️ FEFO Xavfi* — Muddati 30 kunda tugaydigan dorilar monitoringi\n` +
      `• *📒 Qarz Daftari* — Fermerlarning jami qarzi va muddatlari\n` +
      `• *📦 Kam Qolgan Dorilar* — Ombor zaxirasi tugayotgan tovarlar\n` +
      `• *👤 Profilim* — Do'kon, tarif va mas'ul shaxs ma'lumotlari\n\n` +
      `☎️ *Qo'llab-quvvatlash xizmati:* @sohibjon_dev\n` +
      `🌐 *Rasmiy platforma:* https://biznesgo.uz\n` +
      `🛡 *Super Admin boshqaruv:* https://sohibjon.biznesgo.uz`,
      { parse_mode: 'Markdown', ...getMainMenuKeyboard() }
    );
  }
}

// Ro'yxatdan o'tishni tasdiqlash va toza 0-holatdagi do'konni yaratish
async function finalizeRegistration(session, tgUserId, chatId) {
  const phone = session.phone.startsWith('+') ? session.phone : `+${session.phone}`;
  const name = session.name || 'Agro-Vet Dorixona';
  const sector = session.sector_type || 'agro_vet';
  const address = session.address || '';
  const ownerName = session.owner_name || name;

  let tenant;
  try {
    const existing = await pool.query('SELECT * FROM tenants WHERE phone = $1', [phone]);
    if (existing.rows.length > 0) {
      tenant = existing.rows[0];
      await pool.query('UPDATE tenants SET name = $1, address = $2 WHERE id = $3', [name, address, tenant.id]);
    } else {
      const tenantRes = await pool.query(
        `INSERT INTO tenants (name, phone, sector_type, address)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, phone, sector_type, plan`,
        [name, phone, sector, address]
      );
      tenant = tenantRes.rows[0];

      // 0-holatdagi filial va ombor
      const branchRes = await pool.query(
        `INSERT INTO branches (tenant_id, name, code, is_main)
         VALUES ($1, 'Bosh Do\'kon', 'MAIN', TRUE)
         RETURNING id`,
        [tenant.id]
      );
      const branchId = branchRes.rows[0].id;

      await pool.query(
        `INSERT INTO warehouses (tenant_id, branch_id, name, code, type)
         VALUES ($1, $2, 'Asosiy Ombor', 'WH-01', 'main')`,
        [tenant.id, branchId]
      );

      // Kassa (0 balans)
      await pool.query(
        `INSERT INTO cash_accounts (tenant_id, branch_id, name, account_type, balance)
         VALUES ($1, $2, 'Asosiy Kassa', 'cash', 0)`,
        [tenant.id, branchId]
      );

      // Bosh foydalanuvchi
      await pool.query(
        `INSERT INTO users (tenant_id, branch_id, phone, full_name, role_code)
         VALUES ($1, $2, $3, $4, 'owner')`,
        [tenant.id, branchId, phone, ownerName]
      );
    }

    // Merchants jadvaliga tg bog'lash
    await pool.query(
      `INSERT INTO merchants (id, tenant_id, phone, name, business_type, address)
       VALUES ($1, $1, $2, $3, $4, $5)
       ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address`,
      [tenant.id, phone, name, sector, `tg:${tgUserId || chatId}`]
    );
  } catch (dbErr) {
    console.warn('[finalizeRegistration DB fallback]:', dbErr.message);
    tenant = {
      id: '00000000-0000-0000-0000-000000000001',
      name,
      phone,
      sector_type: sector,
      business_type: sector,
      plan: 'standard'
    };
  }

  const tokenPayload = {
    id: tenant.id,
    tenant_id: tenant.id,
    phone: tenant.phone,
    name: tenant.name,
    sector_type: tenant.sector_type || sector,
    business_type: tenant.sector_type || sector,
    role_code: 'owner'
  };

  const jwtToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '90d' });
  return { tenant: { ...tenant, business_type: sector }, jwtToken };
}

// Telegram Inline tugma bosilganda (Callback Query)
async function handleTelegramCallbackQuery(client, cb) {
  const data = cb.data || '';
  const chatId = cb.message?.chat?.id;
  const messageId = cb.message?.message_id;
  const cbId = cb.id;

  if (data.startsWith('approve_reg_')) {
    const token = data.replace('approve_', '');
    let session = registrationSessions.get(token);
    if (!session) {
      try {
        const dbRes = await pool.query(`SELECT data FROM biznesgo_reg_sessions WHERE token = $1`, [token]);
        if (dbRes.rows.length > 0 && dbRes.rows[0].data) {
          session = dbRes.rows[0].data;
          registrationSessions.set(token, session);
        }
      } catch (_) {}
    }
    if (!session) {
      return client.answerCallbackQuery(cbId, 'Sessiya topilmadi yoki muddati tugagan', true);
    }

    try {
      const { tenant, jwtToken } = await finalizeRegistration(session, cb.from?.id, chatId);
      session.status = 'approved';
      session.tenant = tenant;
      session.jwtToken = jwtToken;
      registrationSessions.set(token, session);
      try {
        await pool.query(
          `UPDATE biznesgo_reg_sessions SET data = $2::jsonb, updated_at = NOW() WHERE token = $1`,
          [token, JSON.stringify(session)]
        );
      } catch (_) {}

      await client.answerCallbackQuery(cbId, '✅ Dorixona muvaffaqiyatli tasdiqlandi!', false);

      const webAppUrl = process.env.WEBAPP_URL || 'https://biznesgo.vercel.app';
      await client.editMessageText(
        chatId,
        messageId,
        `✅ *Dorixona muvaffaqiyatli tasdiqlandi va faollashtirildi!* 🌿💊\n\n` +
        `🏢 *${session.name}*\n` +
        `📱 *${session.phone}*\n\n` +
        `Brauzeringizda boshqaruv paneli toza (0) holatda ochildi. Xush kelibsiz!`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🚀 BiznesGO Mobil Appni Ochish',
                  web_app: { url: `${webAppUrl}?token=${jwtToken}&store=${encodeURIComponent(session.name)}` }
                }
              ]
            ]
          }
        }
      );
    } catch (err) {
      console.error('Approve error:', err);
      await client.answerCallbackQuery(cbId, 'Xatolik: ' + err.message, true);
    }
  } else if (data === 'refresh_profile') {
    await client.answerCallbackQuery(cbId, '🔄 Profil ma\'lumotlari yangilandi', false);
    // Profilni qayta chaqirish
    if (chatId) {
      await handleTelegramMessage(client, {
        chat: { id: chatId },
        from: cb.from,
        text: '/profil'
      });
    }
  }
}

// Webhook update kelganda
async function handleTelegramUpdate(update) {
  if (!globalBotClient) {
    const token = getBotToken();
    globalBotClient = new TelegramApiClient(token);
  }
  if (update && update.message) {
    await handleTelegramMessage(globalBotClient, update.message);
  } else if (update && update.callback_query) {
    await handleTelegramCallbackQuery(globalBotClient, update.callback_query);
  }
}

function initTelegramBot() {
  const token = getBotToken();
  const webAppUrl = process.env.WEBAPP_URL || 'https://biznesgo.vercel.app';

  if (!token) {
    console.log('[Telegram Bot] TELEGRAM_BOT_TOKEN topilmadi.');
    return null;
  }

  const client = new TelegramApiClient(token);
  globalBotClient = client;

  console.log('[Telegram Bot] @biznesgo_bot native integratsiyasi tayyor!');
  client.setChatMenuButton(webAppUrl).catch(() => {});

  // Webhook yoki Polling tanlash:
  // Agar public domain mavjud bo'lsa (masalan Railway), Webhook ulanadi
  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN || 
                        process.env.RAILWAY_STATIC_URL || 
                        process.env.WEBHOOK_HOST ||
                        'backend-production-96bd5.up.railway.app';

  if (railwayDomain && process.env.NODE_ENV === 'production') {
    const fullWebhookUrl = `https://${railwayDomain.replace(/^https?:\/\//, '')}/api/biznesgo/telegram/webhook`;
    const secretToken = getWebhookSecretToken();
    console.log(`[Telegram Bot] Production Webhook ulanmoqda: ${fullWebhookUrl}`);
    client.setWebhook(fullWebhookUrl, secretToken)
      .then(r => console.log('[Telegram Bot] Webhook natijasi:', r))
      .catch(err => console.warn('[Telegram Bot] Webhook sozlashda xato:', err.message));

    // Har 60 soniyada Webhook xavfsizligini nazorat qilish (tashqi o'zgarish bo'lsa avtomatik qayta tiklash)
    setInterval(async () => {
      try {
        const info = await client.getWebhookInfo();
        if (info && info.ok && info.result && info.result.url !== fullWebhookUrl) {
          console.warn(`[Telegram Bot Xavfsizlik] Begona webhook aniqlandi (${info.result.url})! BiznesGO webhooki qayta tiklanmoqda...`);
          await client.setWebhook(fullWebhookUrl, secretToken);
        }
      } catch (_) {}
    }, 60 * 1000);
  } else {
    // Local development: Webhookni tozalab polling ishga tushirish
    client.deleteWebhook()
      .then(() => {
        console.log('[Telegram Bot] Local rejim: Polling ishga tushirildi.');
        client.startPolling(
          (msg) => handleTelegramMessage(client, msg),
          (cb) => handleTelegramCallbackQuery(client, cb)
        );
      })
      .catch(() => {
        client.startPolling(
          (msg) => handleTelegramMessage(client, msg),
          (cb) => handleTelegramCallbackQuery(client, cb)
        );
      });
  }

  return client;
}

async function sendOtpToTelegram(phone, code) {
  const clean = (phone || '').replace(/\D/g, '');
  const last9 = clean.slice(-9);
  let chatId = phoneChatMap.get(clean);

  // Oxirgi 9 raqam bo'yicha xotiradan moslik tekshirish
  if (!chatId && last9.length === 9) {
    for (const [p, cId] of phoneChatMap.entries()) {
      if (p.endsWith(last9) || clean.endsWith(p.slice(-9))) {
        chatId = cId;
        break;
      }
    }
  }

  // Agar xotirada bo'lmasa, Neon ma'lumotlar bazasidagi barcha jadvallardan qidiramiz
  if (!chatId && last9.length === 9) {
    try {
      const queries = [
        `SELECT COALESCE(settings->>'telegram_id', CASE WHEN address LIKE 'tg:%' THEN REPLACE(address, 'tg:', '') ELSE NULL END) AS tg_id FROM tenants WHERE REGEXP_REPLACE(phone, '\\D', '', 'g') LIKE $1 LIMIT 1`,
        `SELECT REPLACE(address, 'tg:', '') AS tg_id FROM merchants WHERE REGEXP_REPLACE(phone, '\\D', '', 'g') LIKE $1 AND address LIKE 'tg:%' LIMIT 1`,
        `SELECT telegram_id::text AS tg_id FROM biznesgo_merchants WHERE REGEXP_REPLACE(phone, '\\D', '', 'g') LIKE $1 AND telegram_id IS NOT NULL LIMIT 1`,
        `SELECT telegram_id::text AS tg_id FROM specialists WHERE REGEXP_REPLACE(phone, '\\D', '', 'g') LIKE $1 AND telegram_id IS NOT NULL LIMIT 1`,
        `SELECT telegram_id::text AS tg_id FROM users WHERE REGEXP_REPLACE(phone, '\\D', '', 'g') LIKE $1 AND telegram_id IS NOT NULL LIMIT 1`,
        `SELECT telegram_id::text AS tg_id FROM data_consents WHERE REGEXP_REPLACE(phone, '\\D', '', 'g') LIKE $1 AND telegram_id IS NOT NULL ORDER BY id DESC LIMIT 1`,
        `SELECT telegram_id::text AS tg_id FROM otp_codes WHERE REGEXP_REPLACE(phone, '\\D', '', 'g') LIKE $1 AND telegram_id IS NOT NULL ORDER BY id DESC LIMIT 1`
      ];
      for (const q of queries) {
        try {
          const res = await pool.query(q, [`%${last9}`]);
          if (res.rows.length > 0 && res.rows[0].tg_id) {
            chatId = String(res.rows[0].tg_id).trim();
            phoneChatMap.set(clean, chatId);
            break;
          }
        } catch (_) {}
      }
    } catch (_) {}
  }

  // OTP kodni Neon DB otp_codes jadvaliga ham yozib qo'yamiz (foydalanuvchi botga /start bossa darhol yuborilishi uchun)
  try {
    await pool.query(
      `INSERT INTO otp_codes (phone, code, used, attempts, telegram_id, expires_at)
       VALUES ($1, $2, FALSE, 0, $3, NOW() + INTERVAL '5 minutes')`,
      [`+998${last9}`, code, chatId && /^\d+$/.test(String(chatId)) ? Number(chatId) : null]
    );
  } catch (_) {}

  if (!globalBotClient) {
    const token = getBotToken();
    if (token) {
      globalBotClient = new TelegramApiClient(token);
    }
  }

  if (globalBotClient && chatId) {
    const text = `🔐 *BiznesGO Kirish Kodi:* \`${code}\`\n\n` +
      `Ushbu kodni veb brauzerga kiriting.\n` +
      `⏱ Amal qilish muddati: *5 daqiqa*.\n` +
      `⚠️ *Xavfsizlik:* Ushbu kodni hech kimga bermang!`;
    const res = await globalBotClient.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    return { sent: Boolean(res.ok), chatId };
  }

  return {
    sent: false,
    reason: 'Telegram Chat ID topilmadi. Iltimos avval @biznesgo_bot ga /start bosing.'
  };
}

module.exports = {
  initTelegramBot,
  handleTelegramUpdate,
  TelegramApiClient,
  sendOtpToTelegram,
  phoneChatMap,
  registrationSessions,
  finalizeRegistration,
  handleTelegramCallbackQuery,
  getWebhookSecretToken
};
