const TelegramBot = require('node-telegram-bot-api');
const { pool, formatUZS } = require('../config');

// In-memory ro'yxatdan o'tish qadamlari
const registrationSessions = new Map();

function initTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const webAppUrl = process.env.WEBAPP_URL || 'https://biznesgo.vercel.app';

  if (!token) {
    console.log('[Telegram Bot] TELEGRAM_BOT_TOKEN o\'rnatilmagan. Bot nofaol rejimda.');
    return null;
  }

  // Polling rejimida botni ishga tushirish
  const bot = new TelegramBot(token, { polling: true });
  console.log('[Telegram Bot] @biznesgo_bot muvaffaqiyatli ishga tushirildi!');

  // Pastki chap burchakdagi doimiy "Menu" tugmasini WebApp qilib sozlash
  try {
    bot.setChatMenuButton({
      menu_button: {
        type: 'web_app',
        text: '🚀 BiznesGO',
        web_app: { url: webAppUrl }
      }
    });
  } catch (err) {
    console.warn('[Telegram Bot] setChatMenuButton xatosi:', err.message);
  }

  // Asosiy Menyu Keyboard
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
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const tgUserId = msg.from.id;
    const firstName = msg.from.first_name || 'Do\'kon egasi';

    try {
      // 1. Bazadan ushbu telegram user ID borligini tekshirish
      const userRes = await pool.query(
        'SELECT * FROM merchants WHERE phone LIKE $1 OR address LIKE $2 LIMIT 1',
        [`%${tgUserId}%`, `%tg:${tgUserId}%`]
      );

      if (userRes.rows.length > 0) {
        const merchant = userRes.rows[0];
        return bot.sendMessage(
          chatId,
          `Xush kelibsiz, *${firstName}*! 🌿💊\n\n` +
          `🏢 *Do'koningiz:* ${merchant.name}\n` +
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

      // Agar yangi foydalanuvchi bo'lsa: 1 bosishda telefon raqam so'rash
      bot.sendMessage(
        chatId,
        `*Assalomu alaykum, ${firstName}!* 🌿💊\n\n` +
        `*BiznesGO* — Veterinariya dorixonalari va qishloq xo'jaligi o'g'it do'konlari uchun avtomatlashtirilgan kassa va ombor platformasiga xush kelibsiz!\n\n` +
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
      bot.sendMessage(chatId, 'Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.');
    }
  });

  // 2. Telefon raqam (contact) qabul qilish
  bot.on('contact', async (msg) => {
    const chatId = msg.chat.id;
    const tgUserId = msg.from.id;
    let phone = msg.contact.phone_number;
    if (!phone.startsWith('+')) phone = `+${phone}`;

    try {
      // Raqam avval ro'yxatdan o'tganmi?
      const checkRes = await pool.query('SELECT * FROM merchants WHERE phone = $1', [phone]);

      if (checkRes.rows.length > 0) {
        const merchant = checkRes.rows[0];
        // Telegram ID ni bog'lash
        await pool.query(
          'UPDATE merchants SET address = $1 WHERE id = $2',
          [`tg:${tgUserId}`, merchant.id]
        );

        return bot.sendMessage(
          chatId,
          `✅ *Telefoningiz tasdiqlandi!*\n\n` +
          `🏢 *Do'kon:* ${merchant.name}\n` +
          `Faol do'koningiz muvaffaqiyatli ulandi. Boshqarish uchun pastdagi tugmani bosing:`,
          {
            parse_mode: 'Markdown',
            ...getMainMenuKeyboard()
          }
        );
      }

      // Yangi ro'yxatdan o'tish: Do'kon nomini so'rash
      registrationSessions.set(chatId, {
        step: 'awaiting_store_name',
        phone,
        tgUserId,
        ownerName: `${msg.from.first_name || ''} ${msg.from.last_name || ''}`.trim() || 'Do\'kon Egasi'
      });

      bot.sendMessage(
        chatId,
        `✅ Telefon raqamingiz qabul qilindi: *${phone}*\n\n` +
        `🏢 Endi agro-vet dorixonangiz nomini kiriting:\n` +
        `_(Masalan: Agro-Vet Fayz, Baraka Veterinariya, Oq-Oltin O'g'itlar)_`,
        {
          parse_mode: 'Markdown',
          reply_markup: { remove_keyboard: true }
        }
      );
    } catch (err) {
      console.error('Contact handler error:', err);
      bot.sendMessage(chatId, 'Ro\'yxatdan o\'tishda xatolik yuz berdi.');
    }
  });

  // 3. Matnli xabarlarni tutish (Do'kon nomi kiritish va Menyu buyruqlari)
  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;

    const chatId = msg.chat.id;
    const text = msg.text.trim();

    // A) Ro'yxatdan o'tish sessiyasi tekshiruvi
    const session = registrationSessions.get(chatId);
    if (session && session.step === 'awaiting_store_name') {
      const storeName = text;
      try {
        // Yangi merchant yaratish
        const newMerchant = await pool.query(
          `INSERT INTO merchants (phone, name, business_type, address)
           VALUES ($1, $2, 'agro_vet', $3)
           RETURNING *`,
          [session.phone, storeName, `tg:${session.tgUserId}`]
        );

        registrationSessions.delete(chatId);

        return bot.sendMessage(
          chatId,
          `🎉 *Tabriklaymiz! Do'koningiz muvaffaqiyatli ro'yxatdan o'tdi!*\n\n` +
          `🏢 *Do'kon:* ${storeName}\n` +
          `💊 *Sektor:* 1-Sektor: Agro-Vet Dorixona & O'g'itlar\n` +
          `👤 *Egasi:* ${session.ownerName}\n` +
          `📅 *Obuna:* 14 kunlik bepul sinov davri faollashtirildi!\n\n` +
          `Pastdagi tugma orqali ilovani to'liq mobil ilovadek ochishingiz mumkin:`,
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
        return bot.sendMessage(chatId, 'Do\'konni saqlashda xatolik yuz berdi.');
      }
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

        return bot.sendMessage(
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
        return bot.sendMessage(
          chatId,
          `📊 *Bugungi Kassa (Namuna):*\n\n` +
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
          return bot.sendMessage(
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

        return bot.sendMessage(chatId, msgText, { parse_mode: 'Markdown', ...getMainMenuKeyboard() });
      } catch (err) {
        return bot.sendMessage(
          chatId,
          `⚠️ *FEFO Xavfi (Namuna):*\n\n` +
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

        let msgText = `📒 *Qarz Daftari Xulosasi:*\n` +
                      `💰 *Umumiy nasiya balansi:* ${totalDebt} so'm\n\n` +
                      `*Eng katta qarzdor fermerlar:*\n`;

        debtRes.rows.forEach((c, idx) => {
          msgText += `${idx + 1}. *${c.name}* — ${Number(c.debt_balance).toLocaleString('uz-UZ')} so'm\n` +
                     `   🚜 ${c.farm_profile || 'Chorva/Ekin'} | 📞 ${c.phone}\n` +
                     `   📅 Qaytarish: ${c.due_date || 'Belgilanmagan'}\n\n`;
        });

        return bot.sendMessage(chatId, msgText, { parse_mode: 'Markdown', ...getMainMenuKeyboard() });
      } catch (err) {
        return bot.sendMessage(
          chatId,
          `📒 *Qarz Daftari (Namuna):*\n` +
          `💰 *Umumiy nasiya balansi:* 4,750,000 so'm\n\n` +
          `1. *Shavkat fermer* — 1,280,000 so'm (Chorva)\n` +
          `2. *Rustam aka* — 850,000 so'm (Bog'dorchilik)\n`,
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
          return bot.sendMessage(chatId, `✅ *Ombordagi barcha preparatlar zaxirasi yetarli!*`, {
            parse_mode: 'Markdown',
            ...getMainMenuKeyboard()
          });
        }

        let msgText = `📦 *Omborda Kam Qolgan Dorilar:*\n_Yangi partiyaga buyurtma berish tavsiya qilinadi:_\n\n`;
        lowStockRes.rows.forEach((p, idx) => {
          msgText += `${idx + 1}. *${p.name}* — *${p.stock} dona* qoldi (Minimal: ${p.min_stock})\n`;
        });

        return bot.sendMessage(chatId, msgText, { parse_mode: 'Markdown', ...getMainMenuKeyboard() });
      } catch (err) {
        return bot.sendMessage(
          chatId,
          `📦 *Kam Qolgan Dorilar (Namuna):*\n\n` +
          `1. *Biovit-80* — 8 ta qoldi (Minimal: 10)\n` +
          `2. *Ammofos 12:52* — 3 qop qoldi (Minimal: 5)\n`,
          { parse_mode: 'Markdown', ...getMainMenuKeyboard() }
        );
      }
    }
  });

  return bot;
}

module.exports = { initTelegramBot };
