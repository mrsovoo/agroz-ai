/**
 * Telegram Bot Service (Dual-Bot Focus, Redirect & Push Support)
 * - Main: @biznesgo_bot
 * - Legacy: @agroz_auth_bot (Redirects to @biznesgo_bot)
 * - Admin Push Broadcast with automatic fallback between bots
 */
const config = require('../config');
const { query } = require('../db/pool');
const { hashPassword } = require('../lib/security');

const BUSINESS_TYPE_MAP = {
  agro_vet: { title: '🌿 Agro-Vet dorixona', desc: 'O‘g‘itlar, kimyoviy himoya va dori-darmonlar' },
  feed: { title: '🌾 Yem-ozuqa savdosi', desc: 'Chorva va parranda yemlari, don va kepak' },
  warehouse: { title: '🏢 Ulgurji ombor', desc: 'Katta partiyalar, optom savdo va tarqatish' },
  seeds: { title: '🌱 Urug‘ va ko‘chat', desc: 'Ekin urug‘lari, nihol va ko‘chatlar' },
  machinery: { title: '🔧 Jihoz va texnika', desc: 'Uskunalar, purkagich va ehtiyot qismlar' },
};

const SECTOR_SUPPORT_MAP = {
  agro_vet: {
    name: 'Dr. Jamshid Olimov',
    role: 'Agro-kimyo va Fitosanitariya bosh mutaxassisi',
    phone: '+998 71 200 45 61',
    hours: 'Dush - Shan, 08:00 - 20:00 (24/7 navbatchi)',
  },
  feed: {
    name: 'Muzaffar Yoqubov',
    role: 'Chorvachilik va Parrandachilik ozuqa texnologi',
    phone: '+998 71 200 45 62',
    hours: 'Har kuni 08:00 - 20:00',
  },
  warehouse: {
    name: 'Akmal Rustamov',
    role: 'B2B Distribyutsiya va Logistika koordinatori',
    phone: '+998 71 200 45 63',
    hours: '24/7 Doimiy aloqada',
  },
  seeds: {
    name: 'Olimjon Qodirov',
    role: 'Urug‘chilik va Seleksiya bo‘yicha bosh agronom',
    phone: '+998 71 200 45 64',
    hours: 'Dush - Shan, 08:30 - 19:30',
  },
  machinery: {
    name: 'Farhod Ergashov',
    role: 'Qishloq xo‘jaligi texnikasi bosh muhandisi',
    phone: '+998 71 200 45 65',
    hours: 'Har kuni 08:00 - 21:00',
  },
};

const memorySessions = new Map();

async function getSession(chatId) {
  const mem = memorySessions.get(chatId);
  if (mem) return mem;
  try {
    const res = await query('SELECT step, data FROM bot_registration_sessions WHERE chat_id = $1', [chatId]);
    if (res.rows[0]) {
      const sess = { step: res.rows[0].step, data: res.rows[0].data || {} };
      memorySessions.set(chatId, sess);
      return sess;
    }
  } catch (e) {}
  return null;
}

async function setSession(chatId, step, data) {
  const sess = { step, data };
  memorySessions.set(chatId, sess);
  try {
    await query(
      `INSERT INTO bot_registration_sessions (chat_id, step, data, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (chat_id) DO UPDATE SET step = EXCLUDED.step, data = EXCLUDED.data, updated_at = now()`,
      [chatId, step, JSON.stringify(data)]
    );
  } catch (e) {
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS bot_registration_sessions (
          chat_id BIGINT PRIMARY KEY,
          step VARCHAR(32) NOT NULL,
          data JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_at TIMESTAMP NOT NULL DEFAULT now()
        )
      `);
      await query(
        `INSERT INTO bot_registration_sessions (chat_id, step, data, updated_at)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (chat_id) DO UPDATE SET step = EXCLUDED.step, data = EXCLUDED.data, updated_at = now()`,
        [chatId, step, JSON.stringify(data)]
      );
    } catch (err2) {}
  }
}

async function clearSession(chatId) {
  memorySessions.delete(chatId);
  try {
    await query('DELETE FROM bot_registration_sessions WHERE chat_id = $1', [chatId]);
  } catch (e) {}
}

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
 * - Visual-less 3-step registration right in chat (Business type -> Store & Phone -> Location & Address)
 * - Auto-generates Web login & password and provides instant TMA Launch App & Web URLs
 * - If already registered, Launch App via Telegram ID opens seamlessly without any login/password
 */
async function handleBiznesgoBotUpdate(update) {
  const callbackQuery = update.callback_query;
  const message = update.message || update.edited_message || (callbackQuery && callbackQuery.message);
  if (!callbackQuery && (!message || !message.chat)) {
    return { handled: false, reason: 'NO_MESSAGE_OR_CALLBACK' };
  }

  const chatId = callbackQuery ? (callbackQuery.message?.chat?.id || callbackQuery.from?.id) : message.chat.id;
  const from = callbackQuery ? callbackQuery.from : (message.from || message.chat || {});
  const tgId = from.id || chatId;
  const firstName = from.first_name || 'Foydalanuvchi';
  const text = (message && message.text) ? message.text.trim() : '';

  if (callbackQuery) {
    try {
      await callTelegramApi(config.biznesgoBotToken, 'answerCallbackQuery', {
        callback_query_id: callbackQuery.id,
      });
    } catch {}
  }

  // OTP deep link handler: /start otp_...
  if (text.startsWith('/start otp_')) {
    const otpCode = text.replace('/start otp_', '').trim();
    const otpRes = await query(
      `SELECT id, phone, expires_at, used FROM otp_codes
        WHERE code = $1 AND used = false AND expires_at > now()
        ORDER BY id DESC LIMIT 1`,
      [otpCode]
    );

    if (otpRes.rows[0]) {
      const otpRow = otpRes.rows[0];
      await query(
        `UPDATE otp_codes SET telegram_id = $1, delivered_at = now() WHERE id = $2`,
        [chatId, otpRow.id]
      );

      const phoneDigits = otpRow.phone.replace(/\D/g, '');
      const last9 = phoneDigits.slice(-9);
      await query(
        `UPDATE users SET telegram_id = $1
          WHERE RIGHT(regexp_replace(COALESCE(phone,''), '\\D', '', 'g'), 9) = $2
            AND (telegram_id IS NULL OR telegram_id = $1)`,
        [chatId, last9]
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

  // Cancel handler
  if (text === '/cancel' || text === '❌ Bekor qilish') {
    await clearSession(chatId);
    await callTelegramApi(config.biznesgoBotToken, 'sendMessage', {
      chat_id: chatId,
      text: "Amaliyot bekor qilindi. Qaytadan boshlash uchun /start buyrug‘ini yuboring.",
      reply_markup: { remove_keyboard: true },
    });
    return { handled: true, canceled: true };
  }

  // 1. Agar foydalanuvchi allaqachon ro'yxatdan o'tgan bo'lsa
  const mRes = await query(
    `SELECT m.id, m.store_name, m.business_type, m.is_active, u.name AS user_name
       FROM merchants m
       JOIN users u ON u.id = m.user_id
      WHERE u.telegram_id = $1
      ORDER BY m.id DESC LIMIT 1`,
    [tgId]
  );
  const existingM = mRes.rows[0];

  const bizMeta = existingM ? (BUSINESS_TYPE_MAP[existingM.business_type] || { title: existingM.business_type }) : { title: 'Agro-biznes' };
  const sectorContact = existingM ? (SECTOR_SUPPORT_MAP[existingM.business_type] || SECTOR_SUPPORT_MAP.agro_vet) : SECTOR_SUPPORT_MAP.agro_vet;

  // 1a. Tarif ko'rish (Buyruq yoki tugma orqali)
  if (text === '/tariff' || text === '💳 Mening tarifim' || (callbackQuery && callbackQuery.data === 'cmd_tariff')) {
    const tariffText =
      `💳 <b>Sizning tarifingiz: BiznesGO B2B Pro</b>\n\n` +
      `🏪 <b>Do‘kon:</b> ${existingM ? existingM.store_name : 'Do‘koningiz'}\n` +
      `📌 <b>Yo‘nalish:</b> ${bizMeta.title}\n` +
      `💰 <b>Oylik to‘lov:</b> 199,000 so‘m / oy\n` +
      `⏳ <b>Holat:</b> Faol Obuna (30 kun qoldi)\n\n` +
      `✨ <b>Tarif ichiga kiritilgan imkoniyatlar:</b>\n` +
      `• Cheksiz tovarlar, partiyalar va qoldiq monitoringi\n` +
      `• Sektorga mos aqlli Kassa va POS chek chiqarish\n` +
      `• CRM va Qarz daftari (Kredit limiti va jadvallar)\n` +
      `• Telegram bot va Web sinxronizatsiyasi\n` +
      `• Sektor bo‘yicha 24/7 shaxsiy mutaxassis yordami\n\n` +
      `Tarifni uzaytirish yoki to‘lov qilish uchun adminga yozing: @biznesgo_support`;

    const inlineKeyboard = {
      inline_keyboard: [
        [{ text: "🚀 Ilovani ochish", web_app: { url: config.miniAppUrl } }],
        [{ text: "📞 Qo‘llab-quvvatlash", callback_data: "cmd_support" }, { text: "📢 Yangiliklar", callback_data: "cmd_news" }],
      ],
    };

    try {
      const res = await callTelegramApi(config.biznesgoBotToken, 'sendMessage', {
        chat_id: chatId,
        text: tariffText,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard,
      });
      return { handled: true, cmd: 'tariff', telegram_response: res };
    } catch (err) {
      return { handled: false, error: err.message };
    }
  }

  // 1b. Qo'llab-quvvatlash (Buyruq yoki tugma orqali)
  if (text === '/support' || text === '📞 Qo‘llab-quvvatlash' || (callbackQuery && callbackQuery.data === 'cmd_support')) {
    const supportText =
      `📞 <b>BiznesGO Qo‘llab-quvvatlash xizmati</b>\n\n` +
      `📌 <b>Sizning yo‘nalishingiz:</b> ${bizMeta.title}\n` +
      `👤 <b>Sektor kuratori:</b> ${sectorContact.name}\n` +
      `💼 <b>Mutaxassisligi:</b> ${sectorContact.role}\n` +
      `📱 <b>Aloqa telefoni:</b> ${sectorContact.phone}\n` +
      `💬 <b>Telegram:</b> @biznesgo_support\n` +
      `⏰ <b>Ish vaqti:</b> ${sectorContact.hours}\n\n` +
      `🏢 <b>Markaziy 24/7 Call-markaz:</b> +998 71 200 45 67\n\n` +
      `<i>Mutaxassis sektorga xos sertifikatlar, yaroqlilik, doza, kredit limitlari va texnik masalalarda bepul maslahat beradi.</i>`;

    const inlineKeyboard = {
      inline_keyboard: [
        [{ text: "💬 Telegram orqali yozish", url: "https://t.me/biznesgo_support" }],
        [{ text: "💳 Mening tarifim", callback_data: "cmd_tariff" }, { text: "📢 Yangiliklar", callback_data: "cmd_news" }],
      ],
    };

    try {
      const res = await callTelegramApi(config.biznesgoBotToken, 'sendMessage', {
        chat_id: chatId,
        text: supportText,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard,
      });
      return { handled: true, cmd: 'support', telegram_response: res };
    } catch (err) {
      return { handled: false, error: err.message };
    }
  }

  // 1c. Yangiliklar (Buyruq yoki tugma orqali)
  if (text === '/news' || text === '📢 Yangiliklar' || (callbackQuery && callbackQuery.data === 'cmd_news')) {
    const newsText =
      `📢 <b>BiznesGO Platformasi Yangiliklari & Relizlar</b>\n\n` +
      `🚀 <b>1. BiznesGO v1.0.0 ishga tushirildi!</b>\n` +
      `Barcha 5 ta yo‘nalish (Agro-Vet, Yem, Ombor, Urug‘, Texnika) uchun mos kassa, ombor va CRM to‘liq yangilandi.\n\n` +
      `📍 <b>2. Geolokatsiya orqali manzilni avtomatik tasdiqlash</b>\n` +
      `Do‘kon joylashuvi faqat aniq GPS koordinatalari asosida xaritada belgilanadi va xatolar oldi olinadi.\n\n` +
      `💳 <b>3. B2B Kredit Limiti va Nasiya nazorati</b>\n` +
      `Ulgurji ombor va do‘konlar uchun xaridorlarga kredit limiti o‘rnatish va limit oshganda ogohlantirish qo‘shildi.\n\n` +
      `⚠️ <b>4. Yaroqlilik muddati monitoringi</b>\n` +
      `Muddati o‘tayotgan dorilar Dashboardda avtomatik qizil signal bilan ko‘rsatiladi.`;

    const inlineKeyboard = {
      inline_keyboard: [
        [{ text: "🚀 Ilovani ochish", web_app: { url: config.miniAppUrl } }],
        [{ text: "💳 Mening tarifim", callback_data: "cmd_tariff" }, { text: "📞 Qo‘llab-quvvatlash", callback_data: "cmd_support" }],
      ],
    };

    try {
      const res = await callTelegramApi(config.biznesgoBotToken, 'sendMessage', {
        chat_id: chatId,
        text: newsText,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard,
      });
      return { handled: true, cmd: 'news', telegram_response: res };
    } catch (err) {
      return { handled: false, error: err.message };
    }
  }

  if (existingM && (text.startsWith('/start') || !callbackQuery)) {
    const welcomeText =
      `👋 Assalomu alaykum, <b>${firstName}</b>!\n\n` +
      `🏪 <b>${existingM.store_name}</b> do‘koningiz tizimda faol.\n` +
      `📌 <b>Yo‘nalish:</b> ${bizMeta.title}\n` +
      `Kassa, Ombor va Qarz daftaringiz to‘liq tayyor.\n\n` +
      `Boshqaruv paneliga kirish yoki kerakli bo‘limni tanlang:`;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: `🚀 Ilovani ochish (Launch App)`,
            web_app: { url: config.miniAppUrl },
          },
        ],
        [
          { text: "💳 Mening tarifim", callback_data: "cmd_tariff" },
          { text: "📞 Qo‘llab-quvvatlash", callback_data: "cmd_support" },
        ],
        [
          { text: "📢 Yangiliklar (v1.0.0)", callback_data: "cmd_news" },
          { text: "🌐 Web brauzerda", url: "https://biznesgo.vercel.app" },
        ],
      ],
    };

    const replyKeyboard = {
      keyboard: [
        [{ text: '🚀 BiznesGO Ilovasini ochish', web_app: { url: config.miniAppUrl } }],
        [{ text: '💳 Mening tarifim' }, { text: '📞 Qo‘llab-quvvatlash' }],
        [{ text: '📢 Yangiliklar' }],
      ],
      resize_keyboard: true,
    };

    try {
      const res = await callTelegramApi(config.biznesgoBotToken, 'sendMessage', {
        chat_id: chatId,
        text: welcomeText,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard,
      });

      // Shuningdek pastki doimiy menyuni yangilaymiz
      try {
        await callTelegramApi(config.biznesgoBotToken, 'sendMessage', {
          chat_id: chatId,
          text: "👇 Menyudan kerakli bo‘limni tanlashingiz mumkin:",
          reply_markup: replyKeyboard,
        });
      } catch {}

      try {
        await callTelegramApi(config.biznesgoBotToken, 'setChatMenuButton', {
          chat_id: chatId,
          menu_button: {
            type: 'web_app',
            text: '🚀 BiznesGO',
            web_app: { url: config.miniAppUrl },
          },
        });
      } catch {}

      return { handled: true, bot: 'biznesgo_bot', is_existing: true, telegram_response: res };
    } catch (err) {
      return { handled: false, error: err.message };
    }
  }

  // 2. Yangi foydalanuvchi: /start bosilganda 1-bosqich (Biznes yo'nalishi) ni taklif qilamiz
  if (text.startsWith('/start')) {
    await setSession(chatId, 'STEP1_BIZ_TYPE', {
      tg_id: tgId,
      first_name: firstName,
      username: from.username || null,
    });

    const startText =
      `👋 Assalomu alaykum, <b>${firstName}</b>!\n\n` +
      `<b>BiznesGO</b> — O‘zbekistondagi agro-biznes (dorixona, yem, ombor, urug‘ va texnika) egalari uchun savdo va hisob-kitob platformasiga xush kelibsiz.\n\n` +
      `Do‘koningizni ochish uchun 3 ta qisqa bosqichni bajaring:\n\n` +
      `📍 <b>1-bosqich: Faoliyat yo‘nalishingizni tanlang:</b>`;

    const inlineKeyboard = {
      inline_keyboard: [
        [{ text: "🌿 Agro-Vet dorixona", callback_data: "reg_type_agro_vet" }],
        [{ text: "🌾 Yem-ozuqa savdosi", callback_data: "reg_type_feed" }],
        [{ text: "🏢 Ulgurji ombor", callback_data: "reg_type_warehouse" }],
        [{ text: "🌱 Urug‘ va ko‘chat", callback_data: "reg_type_seeds" }],
        [{ text: "🔧 Jihoz va texnika", callback_data: "reg_type_machinery" }],
      ],
    };

    try {
      const res = await callTelegramApi(config.biznesgoBotToken, 'sendMessage', {
        chat_id: chatId,
        text: startText,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard,
      });
      return { handled: true, step: 'STEP1_BIZ_TYPE', telegram_response: res };
    } catch (err) {
      return { handled: false, error: err.message };
    }
  }

  // 3. Aktiv ro'yxatdan o'tish sessiyasini tekshirish
  const session = await getSession(chatId);

  // 1-bosqich natijasi: Callback query orqali yo'nalish tanlandi
  if (callbackQuery && callbackQuery.data?.startsWith('reg_type_')) {
    const bizType = callbackQuery.data.replace('reg_type_', '');
    const meta = BUSINESS_TYPE_MAP[bizType] || { title: bizType };
    const sessionData = (session && session.data) ? session.data : { tg_id: tgId, first_name: firstName };
    sessionData.business_type = bizType;
    sessionData.business_type_title = meta.title;

    await setSession(chatId, 'STEP2_STORE_NAME', sessionData);

    const step2Text =
      `✅ <b>Tanlangan yo‘nalish:</b> ${meta.title}\n\n` +
      `🏪 <b>2-bosqich (1/2): Do‘koningiz nomini yozib yuboring:</b>\n` +
      `<i>(Masalan: AgroHimoya, Baraka Ulgurji yoki Hosil Dorixona)</i>`;

    const res = await callTelegramApi(config.biznesgoBotToken, 'sendMessage', {
      chat_id: chatId,
      text: step2Text,
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [[{ text: '❌ Bekor qilish' }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
    return { handled: true, step: 'STEP2_STORE_NAME', telegram_response: res };
  }

  // 2-bosqich (1/2): Do'kon nomi kelganda
  if (session && session.step === 'STEP2_STORE_NAME') {
    if (!text || text.length < 2) {
      await callTelegramApi(config.biznesgoBotToken, 'sendMessage', {
        chat_id: chatId,
        text: "⚠️ Do‘kon nomi kamida 2 ta harfdan iborat bo‘lishi kerak. Iltimos, do‘kon nomini yozib yuboring:",
      });
      return { handled: true };
    }

    session.data.store_name = text;
    await setSession(chatId, 'STEP2_PHONE', session.data);

    const phonePrompt =
      `✅ <b>Do‘kon nomi:</b> ${text}\n\n` +
      `📱 <b>2-bosqich (2/2): Mas’ul shaxs telefon raqami.</b>\n\n` +
      `Pastdagi <b>«📲 Telefon raqamni yuborish»</b> tugmasini bosing yoki raqamingizni <code>+998901234567</code> formatida yozing:`;

    const res = await callTelegramApi(config.biznesgoBotToken, 'sendMessage', {
      chat_id: chatId,
      text: phonePrompt,
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [
          [{ text: '📲 Telefon raqamni yuborish', request_contact: true }],
          [{ text: '❌ Bekor qilish' }],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
    return { handled: true, step: 'STEP2_PHONE', telegram_response: res };
  }

  // 2-bosqich (2/2): Telefon kelganda
  if (session && session.step === 'STEP2_PHONE') {
    let rawPhone = message.contact ? message.contact.phone_number : text;
    let digits = (rawPhone || '').replace(/\D/g, '');
    if (digits.length === 9) {
      digits = '998' + digits;
    }
    if (!digits.startsWith('998') || digits.length !== 12) {
      await callTelegramApi(config.biznesgoBotToken, 'sendMessage', {
        chat_id: chatId,
        text: "⚠️ Telefon raqami noto‘g‘ri formatda. Iltimos, pastdagi «📲 Telefon raqamni yuborish» tugmasini bosing yoki +998901234567 ko‘rinishida kiriting:",
      });
      return { handled: true };
    }

    const finalPhone = '+' + digits;
    session.data.phone = finalPhone;
    await setSession(chatId, 'STEP3_LOCATION', session.data);

    const locationPrompt =
      `✅ <b>Telefon raqam tasdiqlandi:</b> <code>${finalPhone}</code>\n\n` +
      `📍 <b>3-bosqich: Do‘kon manzili va lokatsiyasini tasdiqlash.</b>\n\n` +
      `Do‘koningiz joylashgan manzilni tasdiqlash uchun pastdagi <b>«📍 Do‘kon lokatsiyasini yuborish»</b> tugmasini bosing yoki yozma manzilni (shahar, tuman, bozor yoki ko‘cha nomi) yozib yuboring:`;

    const res = await callTelegramApi(config.biznesgoBotToken, 'sendMessage', {
      chat_id: chatId,
      text: locationPrompt,
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [
          [{ text: '📍 Do‘kon lokatsiyasini yuborish', request_location: true }],
          [{ text: '❌ Bekor qilish' }],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
    return { handled: true, step: 'STEP3_LOCATION', telegram_response: res };
  }

  // 3-bosqich: Lokatsiya yoki Yozma manzil kelganda ro'yxatdan o'tkazish
  if (session && session.step === 'STEP3_LOCATION') {
    let lat = null;
    let lng = null;
    let address = '';

    if (message.location) {
      lat = message.location.latitude;
      lng = message.location.longitude;
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: { 'User-Agent': 'BiznesGO-Bot/1.0' },
            signal: AbortSignal.timeout(4000),
          }
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          address = geoData.display_name || '';
        }
      } catch (e) {}

      if (!address) {
        address = `Geolokatsiya: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      }
    } else if (text) {
      address = text;
    } else {
      await callTelegramApi(config.biznesgoBotToken, 'sendMessage', {
        chat_id: chatId,
        text: "Iltimos, pastdagi «📍 Do‘kon lokatsiyasini yuborish» tugmasini bosing yoki manzilni yozib yuboring:",
      });
      return { handled: true };
    }

    // Web kirish uchun avtomatik parol generatsiya qilish
    const plainPassword = 'Go' + Math.floor(100000 + Math.random() * 900000);
    const passwordHash = hashPassword(plainPassword);
    const fullName = session.data.first_name || 'Sotuvchi';

    // 1. users jadvalida user borligini tekshiramiz
    const uRes = await query(
      `SELECT id FROM users WHERE telegram_id = $1 OR RIGHT(regexp_replace(COALESCE(phone,''), '\\D', '', 'g'), 9) = $2 ORDER BY id LIMIT 1`,
      [tgId, session.data.phone.slice(-9)]
    );
    let userId = uRes.rows[0]?.id;
    if (userId) {
      await query(
        `UPDATE users SET telegram_id = $1, phone = COALESCE($2, phone), name = COALESCE($3, name) WHERE id = $4`,
        [tgId, session.data.phone, fullName, userId]
      );
    } else {
      const insU = await query(
        `INSERT INTO users (telegram_id, phone, name) VALUES ($1, $2, $3) RETURNING id`,
        [tgId, session.data.phone, fullName]
      );
      userId = insU.rows[0].id;
    }

    // 2. merchants jadvalida do'kon yaratamiz yoki yangilaymiz
    const mExist = await query(
      `SELECT id FROM merchants WHERE user_id = $1 OR RIGHT(regexp_replace(COALESCE(phone,''), '\\D', '', 'g'), 9) = $2 ORDER BY id LIMIT 1`,
      [userId, session.data.phone.slice(-9)]
    );
    let merchantId;
    if (mExist.rows[0]) {
      merchantId = mExist.rows[0].id;
      await query(
        `UPDATE merchants
            SET store_name = $1, business_type = $2, phone = $3, address = $4,
                lat = $5::float8, lng = $6::float8,
                location = CASE WHEN $5::float8 IS NULL THEN NULL ELSE point($6::float8, $5::float8) END,
                password_hash = $7, is_active = true
          WHERE id = $8`,
        [
          session.data.store_name,
          session.data.business_type,
          session.data.phone,
          address,
          lat,
          lng,
          passwordHash,
          merchantId,
        ]
      );
    } else {
      const insM = await query(
        `INSERT INTO merchants (user_id, store_name, phone, business_type, address, lat, lng, location, password_hash, is_active)
         VALUES ($1, $2, $3, $4, $5, $6::float8, $7::float8,
                 CASE WHEN $6::float8 IS NULL THEN NULL ELSE point($7::float8, $6::float8) END,
                 $8, true)
         RETURNING id`,
        [
          userId,
          session.data.store_name,
          session.data.phone,
          session.data.business_type,
          address,
          lat,
          lng,
          passwordHash,
        ]
      );
      merchantId = insM.rows[0].id;
    }

    // 3. Sessiyani tozalaymiz
    await clearSession(chatId);

    // 4. Keyboardni tozalash va yakuniy xabarni yuborish
    try {
      await callTelegramApi(config.biznesgoBotToken, 'sendMessage', {
        chat_id: chatId,
        text: "✅ Barcha ma’lumotlar saqlandi!",
        reply_markup: { remove_keyboard: true },
      });
    } catch {}

    const successText =
      `🎉 <b>Do‘koningiz muvaffaqiyatli ro‘yxatdan o‘tkazildi!</b>\n\n` +
      `🏪 <b>Do‘kon:</b> ${session.data.store_name}\n` +
      `📌 <b>Yo‘nalish:</b> ${session.data.business_type_title}\n` +
      `👤 <b>Mas’ul:</b> ${fullName}\n` +
      `📞 <b>Telefon:</b> <code>${session.data.phone}</code>\n` +
      `📍 <b>Manzil:</b> ${address}\n\n` +
      `─────────────────────\n` +
      `🔑 <b>Web brauzer orqali kirish ma’lumotlari:</b>\n` +
      `• Sayt: <code>https://biznesgo.vercel.app</code>\n` +
      `• Login: <code>${session.data.phone}</code>\n` +
      `• Parol: <code>${plainPassword}</code>\n` +
      `<i>(Ushbu login va parolni eslab qoling. Kompyuter yoki brauzerda kirishda kerak bo‘ladi)</i>\n` +
      `─────────────────────\n\n` +
      `Quyidagi tugmalar orqali platformadan foydalaning:`;

    const finalKeyboard = {
      inline_keyboard: [
        [
          {
            text: `🚀 Ilovani ochish (Launch App)`,
            web_app: { url: config.miniAppUrl },
          },
        ],
        [
          { text: "💳 Mening tarifim", callback_data: "cmd_tariff" },
          { text: "📞 Qo‘llab-quvvatlash", callback_data: "cmd_support" },
        ],
        [
          { text: "📢 Yangiliklar (v1.0.0)", callback_data: "cmd_news" },
          { text: "🌐 Web brauzerda", url: "https://biznesgo.vercel.app" },
        ],
      ],
    };

    const replyKeyboard = {
      keyboard: [
        [{ text: '🚀 BiznesGO Ilovasini ochish', web_app: { url: config.miniAppUrl } }],
        [{ text: '💳 Mening tarifim' }, { text: '📞 Qo‘llab-quvvatlash' }],
        [{ text: '📢 Yangiliklar' }],
      ],
      resize_keyboard: true,
    };

    const res = await callTelegramApi(config.biznesgoBotToken, 'sendMessage', {
      chat_id: chatId,
      text: successText,
      parse_mode: 'HTML',
      reply_markup: finalKeyboard,
    });

    try {
      await callTelegramApi(config.biznesgoBotToken, 'sendMessage', {
        chat_id: chatId,
        text: "👇 Menyudan kerakli bo‘limni tanlashingiz mumkin:",
        reply_markup: replyKeyboard,
      });
    } catch {}

    try {
      await callTelegramApi(config.biznesgoBotToken, 'setChatMenuButton', {
        chat_id: chatId,
        menu_button: {
          type: 'web_app',
          text: '🚀 BiznesGO',
          web_app: { url: config.miniAppUrl },
        },
      });
    } catch {}

    return { handled: true, registered: true, telegram_response: res };
  }

  // Agar boshqa xabar bo'lsa va ro'yxatdan o'tmagan bo'lsa
  const defaultPrompt =
    `👋 Assalomu alaykum, <b>${firstName}</b>!\n\n` +
    `BiznesGO platformasida do‘kon ochish yoki hisobingizga kirish uchun quyidagi buyruqdan foydalaning:\n\n` +
    `👉 /start — Do‘konni ochish yoki hisobni boshqarish`;

  try {
    const res = await callTelegramApi(config.biznesgoBotToken, 'sendMessage', {
      chat_id: chatId,
      text: defaultPrompt,
      parse_mode: 'HTML',
    });
    return { handled: true, bot: 'biznesgo_bot', telegram_response: res };
  } catch (err) {
    return { handled: false, error: err.message };
  }
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

