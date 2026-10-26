import { TelegramBot, type TelegramMessage, type TelegramCallbackQuery } from '../bot.ts';
import { businessStore, type SectorType } from '../services/store.ts';
import { config } from '../config.ts';

const SECTOR_LABELS: Record<SectorType, string> = {
  pharmacy: 'Vet & Agro Dorixona',
  feed: 'Yem-xashak Ombori',
  seeds: 'Urug‘ & Ko‘chat Do‘koni',
  greenhouse: 'Issiqxona Jihozlari',
  machinery: 'Qishloq Xo‘jalik Texnikasi',
};

export function registerB2BHandlers(bot: TelegramBot) {
  
  // ========================================================
  // 1. /start BUYRUG'I (SODDALASHTIRILGAN BOSHLASH)
  // ========================================================
  bot.onCommand('start', async (msg: TelegramMessage) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id || chatId;
    const firstName = msg.from?.first_name || 'Foydalanuvchi';

    // Foydalanuvchi avval ro'yxatdan o'tgan bo'lsa
    if (businessStore.isRegistered(userId)) {
      const store = businessStore.get(userId)!;
      const sectorName = SECTOR_LABELS[store.sector!] || store.sector;
      
      const appUrl = `${config.webAppUrl}?tg_id=${userId}&name=${encodeURIComponent(store.storeName || '')}&sector=${store.sector}&phone=${encodeURIComponent(store.phone || '')}`;

      // Menu buttonni sozlash (doimiy pastda turadi)
      await bot.setChatMenuButton(chatId, appUrl, 'BiznesGO');

      await bot.sendMessage(
        chatId,
        `Assalomu alaykum, <b>${firstName}</b>!\n\n` +
        `Sizning <b>«${store.storeName}»</b> (${sectorName}) hisobingiz faol holatda.\n\n` +
        `Kassa, tovarlar qoldig‘i, nasiyalar va hisobotlar bilan ishlash uchun pastdagi tugmani bosing:`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🚀 BiznesGO ilovasini ochish',
                  web_app: { url: appUrl },
                },
              ],
              [
                {
                  text: 'ℹ️ Do‘kon ma’lumotlari',
                  callback_data: 'action:info',
                },
                {
                  text: '🔄 Qayta sozlash',
                  callback_data: 'action:reset',
                },
              ],
            ],
          },
        }
      );
      return;
    }

    // Yangi foydalanuvchi: 1-QADAM - Telefon raqamni 1 bosishda olish
    businessStore.set(userId, {
      telegramId: userId,
      firstName,
      lastName: msg.from?.last_name,
      username: msg.from?.username,
      step: 'WAITING_PHONE',
      createdAt: new Date().toISOString(),
    });

    await bot.sendMessage(
      chatId,
      `Assalomu alaykum, <b>${firstName}</b>!\n\n` +
      `<b>BiznesGO</b> — Agro va Savdo do‘koningizni boshqarish platformasiga xush kelibsiz.\n\n` +
      `Do‘koningizni tizimga ulash uchun pastdagi <b>«Telefon raqamni yuborish»</b> tugmasini bosing:`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [
            [
              {
                text: '📱 Telefon raqamni yuborish',
                request_contact: true,
              },
            ],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }
    );
  });

  // ========================================================
  // 2. KONTAKTNI QABUL QILISH (1-QADAM YAKUNI)
  // ========================================================
  bot.onContact(async (msg: TelegramMessage) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id || chatId;
    let phone = msg.contact?.phone_number || '';

    if (!phone.startsWith('+')) {
      phone = `+${phone}`;
    }

    const currentState = businessStore.get(userId) || {
      telegramId: userId,
      firstName: msg.from?.first_name || 'Foydalanuvchi',
      createdAt: new Date().toISOString(),
      step: 'WAITING_STORE_NAME',
    };

    currentState.phone = phone;
    currentState.step = 'WAITING_STORE_NAME';
    businessStore.set(userId, currentState);

    // 2-QADAM: Do'kon nomini so'rash (Oddiy klaviatura olib tashlanadi)
    await bot.sendMessage(
      chatId,
      `Telefon raqamingiz qabul qilindi: <b>${phone}</b>\n\n` +
      `Endi <b>do‘koningiz yoki omboringiz nomini</b> yozing:\n` +
      `<i>(Masalan: Baraka Vet Dorixona, Zangiota Yem Ombori yoki Agro Plast)</i>`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          remove_keyboard: true,
        },
      }
    );
  });

  // ========================================================
  // 3. MATNLI XABARLARNI QAYTA ISHLASH (DO'KON NOMI)
  // ========================================================
  bot.onText(async (msg: TelegramMessage) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id || chatId;
    const text = msg.text?.trim() || '';

    const currentState = businessStore.get(userId);
    if (!currentState) return;

    // Agar foydalanuvchi do'kon nomini kiritayotgan bo'lsa
    if (currentState.step === 'WAITING_STORE_NAME') {
      if (text.length < 2) {
        await bot.sendMessage(chatId, 'Iltimos, do‘kon nomini to‘liqroq yozing:');
        return;
      }

      currentState.storeName = text;
      currentState.step = 'WAITING_SECTOR';
      businessStore.set(userId, currentState);

      // 3-QADAM: Faoliyat sohasini 1 bosishda tanlash (Inline buttons)
      await bot.sendMessage(
        chatId,
        `Do‘kon nomi: <b>«${text}»</b>\n\n` +
        `Qaysi yo‘nalishda faoliyat olib borasiz? Quyidagi sohalardan birini tanlang:`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '💊 Vet & Agro Dorixona', callback_data: 'sector:pharmacy' }],
              [{ text: '🌾 Yem-xashak Ombori', callback_data: 'sector:feed' }],
              [{ text: '🌱 Urug‘ & Ko‘chat Do‘koni', callback_data: 'sector:seeds' }],
              [{ text: '🍃 Issiqxona Jihozlari', callback_data: 'sector:greenhouse' }],
              [{ text: '🚜 Texnika & Zapchast', callback_data: 'sector:machinery' }],
            ],
          },
        }
      );
    }
  });

  // ========================================================
  // 4. SOHANI TANLASH VA YAKUNLASH (INLINE CALLBACK)
  // ========================================================
  bot.onCallbackQuery(async (query: TelegramCallbackQuery) => {
    const data = query.data || '';
    const chatId = query.message?.chat.id || query.from.id;
    const userId = query.from.id;

    // Sektor tanlanganda
    if (data.startsWith('sector:')) {
      const sector = data.split(':')[1] as SectorType;
      const state = businessStore.get(userId);

      if (state) {
        state.sector = sector;
        state.step = 'COMPLETED';
        businessStore.set(userId, state);

        const sectorName = SECTOR_LABELS[sector] || sector;
        const appUrl = `${config.webAppUrl}?tg_id=${userId}&name=${encodeURIComponent(state.storeName || '')}&sector=${sector}&phone=${encodeURIComponent(state.phone || '')}`;

        // Telegram chatning pastki doimiy menu buttonini o'rnatish
        await bot.setChatMenuButton(chatId, appUrl, 'BiznesGO');

        await bot.answerCallbackQuery(query.id, 'Profilingiz muvaffaqiyatli yaratildi!');

        // Tabriknoma va Mini App Launch tugmasi
        await bot.sendMessage(
          chatId,
          `Tabriklaymiz! <b>«${state.storeName}»</b> (${sectorName}) tizimga muvaffaqiyatli ulandi.\n\n` +
          `Siz uchun barcha kassa, ombor va qarz daftari funksiyalari faollashtirildi.\n\n` +
          `Pastdagi <b>«BiznesGO ilovasini ochish»</b> tugmasini bosing:`,
          {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🚀 BiznesGO ilovasini ochish',
                    web_app: { url: appUrl },
                  },
                ],
              ],
            },
          }
        );
      }
      return;
    }

    // Do'kon ma'lumotlari ko'rish
    if (data === 'action:info') {
      const state = businessStore.get(userId);
      if (state) {
        await bot.answerCallbackQuery(query.id);
        await bot.sendMessage(
          chatId,
          `🏢 <b>Do‘kon:</b> ${state.storeName}\n` +
          `📂 <b>Soha:</b> ${SECTOR_LABELS[state.sector!] || state.sector}\n` +
          `📞 <b>Telefon:</b> ${state.phone}\n` +
          `🆔 <b>Telegram ID:</b> <code>${state.telegramId}</code>`,
          { parse_mode: 'HTML' }
        );
      }
      return;
    }

    // Qayta sozlash (Reset)
    if (data === 'action:reset') {
      await bot.answerCallbackQuery(query.id, 'Qayta ro‘yxatdan o‘tish boshlandi');
      businessStore.set(userId, {
        telegramId: userId,
        firstName: query.from.first_name,
        lastName: query.from.last_name,
        username: query.from.username,
        step: 'WAITING_STORE_NAME',
        createdAt: new Date().toISOString(),
      });
      await bot.sendMessage(
        chatId,
        'Yangi do‘kon nomini yozing:',
        { parse_mode: 'HTML' }
      );
      return;
    }
  });

  // ========================================================
  // 5. /app VA /help QO'SHIMCHA BUYRUQLAR
  // ========================================================
  bot.onCommand('app', async (msg: TelegramMessage) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id || chatId;
    const state = businessStore.get(userId);

    const appUrl = state?.storeName
      ? `${config.webAppUrl}?tg_id=${userId}&name=${encodeURIComponent(state.storeName)}&sector=${state.sector}&phone=${encodeURIComponent(state.phone || '')}`
      : config.webAppUrl;

    await bot.sendMessage(
      chatId,
      'BiznesGO Launch App ilovasini ochish:',
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 BiznesGO ilovasini ochish',
                web_app: { url: appUrl },
              },
            ],
          ],
        },
      }
    );
  });

  bot.onCommand('help', async (msg: TelegramMessage) => {
    await bot.sendMessage(
      msg.chat.id,
      `<b>BiznesGO Yordam Markazi</b>\n\n` +
      `Platforma orqali siz:\n` +
      `• Kassa va savdo cheklarini chiqarish (POS)\n` +
      `• Shtrix-kod skaneri orqali tovar qo‘shish\n` +
      `• Qarz daftarini avtomatlashtirish va SMS yuborish\n` +
      `• Kunlik va oylik foyda hisobotlarini ko‘rishingiz mumkin.\n\n` +
      `Murojaat uchun: Email info@biznesgo.uz yoki tel: +998 90 8383772`,
      { parse_mode: 'HTML' }
    );
  });
}
