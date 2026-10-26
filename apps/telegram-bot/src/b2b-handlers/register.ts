import { TelegramBot, type TelegramMessage, type TelegramCallbackQuery } from '../bot.ts';
import { businessStore, type SectorType } from '../services/store.ts';
import { config } from '../config.ts';

const SECTOR_LABELS: Record<SectorType, string> = {
  pharmacy: 'Vet & Agro Dorixona',
  feed: 'Yem-xashak & Ozuqa Ombori',
  seeds: 'Urug‘ & Ko‘chat Do‘koni',
  greenhouse: 'Issiqxona & Sug‘orish Jihozlari',
  machinery: 'Qishloq Xo‘jalik Texnikasi & Ehtiyot Qismlar',
};

const REGIONS = [
  'Toshkent shahri',
  'Toshkent viloyati',
  'Samarqand',
  'Farg‘ona',
  'Andijon',
  'Namangan',
  'Buxoro',
  'Qashqadaryo',
  'Surxondaryo',
  'Xorazm',
  'Navoiy',
  'Jizzax',
  'Sirdaryo',
  'Qoraqalpog‘iston R.',
];

function buildRegionKeyboard() {
  const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];
  for (let i = 0; i < REGIONS.length; i += 2) {
    const row = [{ text: REGIONS[i], callback_data: `region:${REGIONS[i]}` }];
    if (i + 1 < REGIONS.length) {
      row.push({ text: REGIONS[i + 1], callback_data: `region:${REGIONS[i + 1]}` });
    }
    keyboard.push(row);
  }
  return keyboard;
}

export function registerB2BHandlers(bot: TelegramBot) {
  
  // ========================================================
  // 1. /start BUYRUG'I
  // ========================================================
  bot.onCommand('start', async (msg: TelegramMessage) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id || chatId;
    const tgFirstName = msg.from?.first_name || 'Hurmatli tadbirkor';

    // Agar foydalanuvchi allaqachon to'liq ro'yxatdan o'tgan bo'lsa
    if (businessStore.isRegistered(userId)) {
      const store = businessStore.get(userId)!;
      const sectorName = SECTOR_LABELS[store.sector!] || store.sector;
      
      const appUrl = `${config.webAppUrl}?tg_id=${userId}&name=${encodeURIComponent(store.storeName || '')}&sector=${store.sector}&phone=${encodeURIComponent(store.phone || '')}&region=${encodeURIComponent(store.region || '')}`;

      // Doimiy menyu tugmasini sozlash
      await bot.setChatMenuButton(chatId, appUrl, 'BiznesGO');

      await bot.sendMessage(
        chatId,
        `Assalomu alaykum, <b>${store.fullName || tgFirstName}</b>!\n\n` +
        `Sizning <b>«${store.storeName}»</b> (${sectorName}) hisobingiz faol holatda.\n` +
        `Hudud: <b>${store.region || 'O‘zbekiston'}</b>\n` +
        `Telefon: <b>${store.phone}</b>\n\n` +
        `Kassa, tovarlar qoldig‘i, nasiyalar va hisobotlar bilan ishlash uchun quyidagi tugmani bosing:`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'BiznesGO ilovasini ochish',
                  web_app: { url: appUrl },
                },
              ],
              [
                {
                  text: 'Do‘kon ma’lumotlari',
                  callback_data: 'action:info',
                },
                {
                  text: 'Qayta ro‘yxatdan o‘tish',
                  callback_data: 'action:reset',
                },
              ],
            ],
          },
        }
      );
      return;
    }

    // 1-QADAM: Yangi foydalanuvchidan ISM so'rash
    businessStore.set(userId, {
      telegramId: userId,
      firstName: tgFirstName,
      lastName: msg.from?.last_name,
      username: msg.from?.username,
      step: 'WAITING_NAME',
      createdAt: new Date().toISOString(),
    });

    await bot.sendMessage(
      chatId,
      `Assalomu alaykum!\n\n` +
      `<b>BiznesGO</b> — Agro va Savdo korxonangizni boshqarish platformasiga xush kelibsiz.\n\n` +
      `Ro‘yxatdan o‘tish uchun <b>ism va familiyangizni</b> kiriting:`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          remove_keyboard: true,
        },
      }
    );
  });

  // ========================================================
  // 2. KONTAKT (TELEFON RAQAM)NI TUGMA ORQALI QABUL QILISH
  // ========================================================
  bot.onContact(async (msg: TelegramMessage) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id || chatId;
    let phone = msg.contact?.phone_number || '';

    if (!phone.startsWith('+')) {
      phone = `+${phone}`;
    }

    const state = businessStore.get(userId);
    if (!state) return;

    state.phone = phone;
    state.step = 'WAITING_SECTOR';
    businessStore.set(userId, state);

    // 3-QADAM: Sektor tanlashni so'rash (Inline tugmalar)
    await bot.sendMessage(
      chatId,
      `Telefon raqamingiz saqlandi: <b>${phone}</b>\n\n` +
      `Qaysi yo‘nalishda faoliyat yuritishingizni tanlang:`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          remove_keyboard: true,
        },
      }
    );

    await bot.sendMessage(
      chatId,
      `Faoliyat sohasini tanlang:`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Vet & Agro Dorixona', callback_data: 'sector:pharmacy' }],
            [{ text: 'Yem-xashak & Ozuqa Ombori', callback_data: 'sector:feed' }],
            [{ text: 'Urug‘ & Ko‘chat Do‘koni', callback_data: 'sector:seeds' }],
            [{ text: 'Issiqxona & Sug‘orish Jihozlari', callback_data: 'sector:greenhouse' }],
            [{ text: 'Qishloq Xo‘jalik Texnikasi', callback_data: 'sector:machinery' }],
          ],
        },
      }
    );
  });

  // ========================================================
  // 3. MATNLI XABARLARNI QAYTA ISHLASH (ISM, TELEFON, NOM, HUDUD)
  // ========================================================
  bot.onText(async (msg: TelegramMessage) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id || chatId;
    const text = msg.text?.trim() || '';

    // Buyruqlarni e'tiborsiz qoldiramiz
    if (text.startsWith('/')) return;

    const state = businessStore.get(userId);
    if (!state) return;

    // A) 1-QADAM: ISM QABUL QILINDI -> TELEFON RAQAM SO'RASH
    if (state.step === 'WAITING_NAME') {
      if (text.length < 2) {
        await bot.sendMessage(chatId, 'Iltimos, ismingizni to‘liqroq yozing:');
        return;
      }

      state.fullName = text;
      state.step = 'WAITING_PHONE';
      businessStore.set(userId, state);

      // Telefon raqam so'rash
      await bot.sendMessage(
        chatId,
        `Rahmat, <b>${text}</b>.\n\n` +
        `Endi pastdagi tugma orqali <b>telefon raqamingizni yuboring</b> yoki xabar shaklida kiriting (+998901234567):`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            keyboard: [
              [
                {
                  text: 'Telefon raqamni yuborish',
                  request_contact: true,
                },
              ],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        }
      );
      return;
    }

    // B) 2-QADAM (QO'LDA TELEFON YOZILSA) -> SEKTOR SO'RASH
    if (state.step === 'WAITING_PHONE') {
      const cleanPhone = text.replace(/[\s\-()]/g, '');
      if (cleanPhone.length < 9) {
        await bot.sendMessage(
          chatId,
          'Iltimos, to‘g‘ri telefon raqam kiriting (masalan: +998901234567):'
        );
        return;
      }

      state.phone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
      state.step = 'WAITING_SECTOR';
      businessStore.set(userId, state);

      await bot.sendMessage(
        chatId,
        `Telefon raqamingiz saqlandi: <b>${state.phone}</b>\n\n` +
        `Quyidagi ro‘yxatdan faoliyat sohasini tanlang:`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            remove_keyboard: true,
          },
        }
      );

      await bot.sendMessage(
        chatId,
        `Faoliyat sohasini tanlang:`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Vet & Agro Dorixona', callback_data: 'sector:pharmacy' }],
              [{ text: 'Yem-xashak & Ozuqa Ombori', callback_data: 'sector:feed' }],
              [{ text: 'Urug‘ & Ko‘chat Do‘koni', callback_data: 'sector:seeds' }],
              [{ text: 'Issiqxona & Sug‘orish Jihozlari', callback_data: 'sector:greenhouse' }],
              [{ text: 'Qishloq Xo‘jalik Texnikasi', callback_data: 'sector:machinery' }],
            ],
          },
        }
      );
      return;
    }

    // C) 4-QADAM: DO'KON NOMI QABUL QILINDI -> HUDUDNI SO'RASH
    if (state.step === 'WAITING_STORE_NAME') {
      if (text.length < 2) {
        await bot.sendMessage(chatId, 'Iltimos, do‘kon nomini to‘liqroq yozing:');
        return;
      }

      state.storeName = text;
      state.step = 'WAITING_REGION';
      businessStore.set(userId, state);

      // 5-QADAM: Hududni so'rash
      await bot.sendMessage(
        chatId,
        `Do‘kon nomi: <b>«${text}»</b>\n\n` +
        `Do‘koningiz joylashgan <b>hududni tanlang</b> yoki tumaningiz nomini yozing:`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: buildRegionKeyboard(),
          },
        }
      );
      return;
    }

    // D) 5-QADAM (QO'LDA HUDUD YOZILSA) -> YAKUNLASH
    if (state.step === 'WAITING_REGION') {
      state.region = text;
      state.step = 'COMPLETED';
      businessStore.set(userId, state);

      await finishRegistration(bot, chatId, userId, state);
      return;
    }
  });

  // ========================================================
  // 4. INLINE CALLBACK SO'ROVLARI (SEKTOR VA HUDUD TANLANGANDA)
  // ========================================================
  bot.onCallbackQuery(async (query: TelegramCallbackQuery) => {
    const data = query.data || '';
    const chatId = query.message?.chat.id || query.from.id;
    const userId = query.from.id;
    const state = businessStore.get(userId);

    // 3-QADAM: Sektor tanlanganda -> DO'KON NOMINI SO'RASH
    if (data.startsWith('sector:')) {
      const sector = data.split(':')[1] as SectorType;

      if (state) {
        state.sector = sector;
        state.step = 'WAITING_STORE_NAME';
        businessStore.set(userId, state);

        const sectorName = SECTOR_LABELS[sector] || sector;
        await bot.answerCallbackQuery(query.id, `Soha tanlandi: ${sectorName}`);

        await bot.sendMessage(
          chatId,
          `Tanlangan soha: <b>${sectorName}</b>\n\n` +
          `Endi <b>do‘koningiz yoki biznesingiz nomini</b> yozing:\n` +
          `<i>(Masalan: Baraka Vet Dorixona, Zangiota Yem Ombori yoki Agro Plast)</i>`,
          {
            parse_mode: 'HTML',
          }
        );
      }
      return;
    }

    // 5-QADAM: Hudud tanlanganda -> RO'YXATDAN O'TISHNI YAKUNLASH
    if (data.startsWith('region:')) {
      const region = data.split(':')[1];

      if (state) {
        state.region = region;
        state.step = 'COMPLETED';
        businessStore.set(userId, state);

        await bot.answerCallbackQuery(query.id, `Hudud tanlandi: ${region}`);
        await finishRegistration(bot, chatId, userId, state);
      }
      return;
    }

    // Do'kon ma'lumotlari
    if (data === 'action:info') {
      if (state) {
        await bot.answerCallbackQuery(query.id);
        await bot.sendMessage(
          chatId,
          `Do‘kon nomi: <b>${state.storeName}</b>\n` +
          `Egasi: <b>${state.fullName || state.firstName}</b>\n` +
          `Soha: <b>${SECTOR_LABELS[state.sector!] || state.sector}</b>\n` +
          `Hudud: <b>${state.region || 'Ko‘rsatilmagan'}</b>\n` +
          `Telefon: <b>${state.phone}</b>\n` +
          `Telegram ID: <code>${state.telegramId}</code>`,
          { parse_mode: 'HTML' }
        );
      }
      return;
    }

    // Qayta sozlash
    if (data === 'action:reset') {
      await bot.answerCallbackQuery(query.id, 'Qayta ro‘yxatdan o‘tish boshlandi');
      businessStore.set(userId, {
        telegramId: userId,
        firstName: query.from.first_name,
        lastName: query.from.last_name,
        username: query.from.username,
        step: 'WAITING_NAME',
        createdAt: new Date().toISOString(),
      });
      await bot.sendMessage(
        chatId,
        'Ism va familiyangizni kiriting:',
        { parse_mode: 'HTML', reply_markup: { remove_keyboard: true } }
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
      ? `${config.webAppUrl}?tg_id=${userId}&name=${encodeURIComponent(state.storeName)}&sector=${state.sector}&phone=${encodeURIComponent(state.phone || '')}&region=${encodeURIComponent(state.region || '')}`
      : config.webAppUrl;

    await bot.sendMessage(
      chatId,
      'BiznesGO ilovasini ochish:',
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'BiznesGO ilovasini ochish',
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
      `• Qarz daftarini avtomatlashtirish va mijozlar hisobi\n` +
      `• Kunlik va oylik foyda hisobotlarini ko‘rishingiz mumkin.\n\n` +
      `Murojaat uchun: Email info@biznesgo.uz yoki tel: +998 90 8383772`,
      { parse_mode: 'HTML' }
    );
  });
}

// Ro'yxatdan o'tishni muvaffaqiyatli yakunlash funksiyasi
async function finishRegistration(
  bot: TelegramBot,
  chatId: number,
  userId: number,
  state: any
) {
  const sectorName = SECTOR_LABELS[state.sector as SectorType] || state.sector;
  const appUrl = `${config.webAppUrl}?tg_id=${userId}&name=${encodeURIComponent(state.storeName || '')}&sector=${state.sector}&phone=${encodeURIComponent(state.phone || '')}&region=${encodeURIComponent(state.region || '')}`;

  // Doimiy chat menyu tugmasini o'rnatish
  await bot.setChatMenuButton(chatId, appUrl, 'BiznesGO');

  await bot.sendMessage(
    chatId,
    `Tabriklaymiz, <b>${state.fullName || state.firstName}</b>!\n\n` +
    `Sizning <b>«${state.storeName}»</b> (${sectorName}) korxonangiz muvaffaqiyatli ro‘yxatdan o‘tkazildi.\n\n` +
    `Hudud: <b>${state.region}</b>\n` +
    `Telefon: <b>${state.phone}</b>\n\n` +
    `Barcha kassa, tovarlar qoldig‘i, nasiya daftari va tahliliy hisobotlar bilan ishlash uchun pastdagi tugmani bosing:`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'BiznesGO ilovasini ochish',
              web_app: { url: appUrl },
            },
          ],
        ],
      },
    }
  );
}
