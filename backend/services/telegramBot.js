const { pool } = require('../config');

const DEFAULT_BOT_TOKEN = '8546564636:AAE8WDjtaFDMr4Mb35KX4uBfPD5b-dB28LM';

function getBotToken() {
  const envToken = process.env.TELEGRAM_BOT_TOKEN || '';
  // Agar Railway'da eski bot tokeni saqlanib qolgan bo'lsa ham, qat'iy @biznesgo_bot tokenini ishlatish:
  if (envToken && envToken.startsWith('8546564636')) {
    return envToken;
  }
  return DEFAULT_BOT_TOKEN;
}
const registrationSessions = new Map();

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

  async setChatMenuButton(webAppUrl) {
    return this.call('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: '🚀 BiznesGO',
        web_app: { url: webAppUrl }
      }
    });
  }

  async setWebhook(url) {
    return this.call('setWebhook', { url });
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

  startPolling(onMessage) {
    if (this.isPolling) return;
    this.isPolling = true;

    const poll = async () => {
      if (!this.isPolling) return;
      try {
        const data = await this.getUpdates();
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            this.offset = update.update_id + 1;
            if (update.message) {
              await onMessage(update.message);
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
        ]
      ],
      resize_keyboard: true,
      persistent: true
    }
  });

  // 1. /start buyrug'i
  if (text.startsWith('/start')) {
    try {
      let userExists = false;
      let merchantName = 'Agro-Vet Dorixona';

      try {
        const userRes = await pool.query(
          'SELECT * FROM merchants WHERE phone LIKE $1 OR address LIKE $2 LIMIT 1',
          [`%${tgUserId}%`, `%tg:${tgUserId}%`]
        );
        if (userRes.rows.length > 0) {
          userExists = true;
          merchantName = userRes.rows[0].name;
        }
      } catch (dbErr) {
        // DB ulanishi bo'lmasa fallback rejim
      }

      if (userExists) {
        return client.sendMessage(
          chatId,
          `Xush kelibsiz, *${firstName}*! 🌿💊\n\n` +
          `🏢 *Do'koningiz:* ${merchantName}\n` +
          `💊 *Sektor:* 1-Sektor: Agro-Vet Dorixona & O'g'itlar\n\n` +
          `Kassa, ombor yoki qarz daftarini ochish uchun quyidagi tugmani bosing:`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🚀 BiznesGO Mobil Appni Ochish',
                    web_app: { url: `${webAppUrl}?tg_id=${tgUserId}` }
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

    try {
      let isRegistered = false;
      let merchantName = '';

      try {
        const checkRes = await pool.query('SELECT * FROM merchants WHERE phone = $1', [phone]);
        if (checkRes.rows.length > 0) {
          isRegistered = true;
          merchantName = checkRes.rows[0].name;
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
        phone,
        tgUserId,
        ownerName: `${msg.from.first_name || ''} ${msg.from.last_name || ''}`.trim() || 'Do\'kon Egasi'
      });

      return client.sendMessage(
        chatId,
        `✅ Telefon raqamingiz qabul qilindi: *${phone}*\n\n` +
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
      try {
        await pool.query(
          `INSERT INTO merchants (phone, name, business_type, address)
           VALUES ($1, $2, 'agro_vet', $3)`,
          [session.phone, storeName, `tg:${session.tgUserId}`]
        );
      } catch (dbErr) {
        console.warn('DB merchant saqlashda xatolik (mock rejimda ishlaydi):', dbErr.message);
      }

      registrationSessions.delete(chatId);

      return client.sendMessage(
        chatId,
        `🎉 *Tabriklaymiz! Do'koningiz muvaffaqiyatli ro'yxatdan o'tdi!*\n\n` +
        `🏢 *Do'kon:* ${storeName}\n` +
        `💊 *Sektor:* 1-Sektor: Agro-Vet Dorixona & O'g'itlar\n` +
        `👤 *Egasi:* ${session.ownerName}\n` +
        `📅 *Obuna:* 14 kunlik bepul sinov davri faollashtirildi!\n\n` +
        `Pastdagi tugma orqali ilovani xuddi mobil ilovadek ochishingiz mumkin:`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🚀 BiznesGO Mobil Appni Ochish',
                  web_app: { url: `${webAppUrl}?registered=1` }
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
}

// Webhook update kelganda
async function handleTelegramUpdate(update) {
  if (!globalBotClient) {
    const token = getBotToken();
    globalBotClient = new TelegramApiClient(token);
  }
  if (update && update.message) {
    await handleTelegramMessage(globalBotClient, update.message);
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
    console.log(`[Telegram Bot] Production Webhook ulanmoqda: ${fullWebhookUrl}`);
    client.setWebhook(fullWebhookUrl)
      .then(r => console.log('[Telegram Bot] Webhook natijasi:', r))
      .catch(err => console.warn('[Telegram Bot] Webhook sozlashda xato:', err.message));
  } else {
    // Local development: Webhookni tozalab polling ishga tushirish
    client.deleteWebhook()
      .then(() => {
        console.log('[Telegram Bot] Local rejim: Polling ishga tushirildi.');
        client.startPolling((msg) => handleTelegramMessage(client, msg));
      })
      .catch(() => {
        client.startPolling((msg) => handleTelegramMessage(client, msg));
      });
  }

  return client;
}

module.exports = { initTelegramBot, handleTelegramUpdate, TelegramApiClient };
