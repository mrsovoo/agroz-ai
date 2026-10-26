import { TelegramBot, type TelegramMessage, type TelegramCallbackQuery } from '../bot.ts';
import { businessStore, type SectorType, type UserBusinessState } from '../services/store.ts';
import { dbService, type TenantData } from '../services/db.ts';
import { config } from '../config.ts';

const SECTOR_LABELS: Record<string, string> = {
  pharmacy: 'Vet & Agro Dorixona',
  feed: 'Yem-xashak & Ozuqa Ombori',
  seeds: 'Urug‘ & Ko‘chat Do‘koni',
  greenhouse: 'Issiqxona & Sug‘orish Jihozlari',
  machinery: 'Qishloq Xo‘jalik Texnikasi & Ehtiyot Qismlar',
  agro_vet: 'Vet & Agro Dorixona',
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

function formatMoney(amount: number): string {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

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

// Tezkor hisobotlar va Launch App uchun pastki menyu tugmalari
function getMainKeyboard(appUrl: string) {
  return {
    keyboard: [
      [
        {
          text: '🚀 BiznesGO Launch App',
          web_app: { url: appUrl },
        },
      ],
      [
        { text: '📊 Kunlik hisobot' },
        { text: '💳 Qarzlar holati' },
      ],
      [
        { text: '📦 Ombor holati' },
        { text: '👤 Mening profilim' },
      ],
      [
        { text: 'ℹ️ Yordam markazi' },
      ],
    ],
    resize_keyboard: true,
    persistent: true,
  };
}

export function registerB2BHandlers(bot: TelegramBot) {

  // ========================================================
  // 1. /start BUYRUG'I VA DEEP LINK TASDIQLASH
  // ========================================================
  bot.onCommand('start', async (msg: TelegramMessage) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id || chatId;
    const tgFirstName = msg.from?.first_name || 'Hurmatli tadbirkor';

    const parts = (msg.text || '').trim().split(' ');
    const startPayload = parts.length > 1 ? parts[1].trim() : '';

    // A) Agar start payload Web Login yoki Ro'yxatdan o'tish sessiyasi bo'lsa (login_... yoki reg_...)
    if (startPayload && (startPayload.startsWith('login_') || startPayload.startsWith('reg_'))) {
      const session = await dbService.getSession(startPayload);
      if (session) {
        const isLogin = startPayload.startsWith('login_');
        const sessionPhone = session.phone || 'Kiritilgan raqam';

        await bot.sendMessage(
          chatId,
          `🔐 <b>BiznesGO Web Kirish So‘rovi</b>\n\n` +
          `Brauzer orqali tizimga kirish so‘ralmoqda.\n` +
          `Telefon: <code>${sessionPhone}</code>\n` +
          (session.otpCode ? `Tasdiqlash kodi: <code>${session.otpCode}</code>\n\n` : `\n`) +
          `Tizimga kirishni tasdiqlaysizmi?`,
          {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '✅ Ha, tasdiqlayman',
                    callback_data: `approve_${startPayload}`,
                  },
                  {
                    text: '❌ Bekor qilish',
                    callback_data: `reject_${startPayload}`,
                  },
                ],
              ],
            },
          }
        );
        return;
      }
    }

    // B) Foydalanuvchini DB yoki store dan tekshiramiz
    let tenant = await dbService.findTenant(userId);
    let storeState = businessStore.get(userId);

    if (tenant || (storeState && storeState.step === 'COMPLETED')) {
      const storeName = tenant?.name || storeState?.storeName || 'BiznesGO Do‘kon';
      const sectorCode = tenant?.sector_type || storeState?.sector || 'pharmacy';
      const sectorName = SECTOR_LABELS[sectorCode] || sectorCode;
      const phone = tenant?.phone || storeState?.phone || '+998';
      const region = (tenant?.settings?.region || tenant?.address || storeState?.region || 'O‘zbekiston').replace('tg:' + userId, '');
      const ownerName = tenant?.settings?.owner_name || storeState?.fullName || tgFirstName;

      const appUrl = `${config.webAppUrl}?tg_id=${userId}&name=${encodeURIComponent(storeName)}&sector=${sectorCode}&phone=${encodeURIComponent(phone)}&region=${encodeURIComponent(region)}`;

      await bot.setChatMenuButton(chatId, appUrl, 'BiznesGO');

      await bot.sendMessage(
        chatId,
        `Assalomu alaykum, <b>${ownerName}</b>!\n\n` +
        `Sizning <b>«${storeName}»</b> (${sectorName}) hisobingiz faol holatda.\n` +
        `Hudud: <b>${region}</b>\n` +
        `Telefon: <b>${phone}</b>\n\n` +
        `Tezkor ko‘rsatkichlar (hisobot, qarzlar, ombor) pastki tugmalarda mavjud.\n` +
        `To‘liq boshqaruv va kassa (POS) uchun <b>Launch App</b> tugmasini bosing:`,
        {
          parse_mode: 'HTML',
          reply_markup: getMainKeyboard(appUrl),
        }
      );
      return;
    }

    // C) Yangi foydalanuvchi: 1-QADAM - Ism so'rash
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
      `Platformadan to‘liq foydalanish uchun <b>ism va familiyangizni</b> kiriting:`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          remove_keyboard: true,
        },
      }
    );
  });

  // ========================================================
  // 2. KONTAKT (TELEFON RAQAM)NI QABUL QILISH
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

    await bot.sendMessage(
      chatId,
      `Telefon raqamingiz qabul qilindi: <b>${phone}</b>\n\n` +
      `Qaysi yo‘nalishda faoliyat yuritishingizni tanlang:`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Vet & Agro Dorixona', callback_data: 'sector:pharmacy' }],
            [{ text: 'Yem-xashak & Ozuqa Ombori', callback_data: 'sector:feed' }],
            [{ text: 'Urug‘ & Ko‘chat Do‘koni', callback_data: 'sector:seeds' }],
            [{ text: 'Issiqxona & Sug‘orish Mollari', callback_data: 'sector:greenhouse' }],
            [{ text: 'Qishloq Xo‘jalik Texnikasi & Ehtiyot Qismlar', callback_data: 'sector:machinery' }],
          ],
        },
      }
    );
  });

  // ========================================================
  // 3. MATNLI XABARLAR (ISM, NOMER, DO'KON NOMI, TEZKOR TUGMALAR)
  // ========================================================
  bot.onText(async (msg: TelegramMessage) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id || chatId;
    const text = (msg.text || '').trim();

    // Maxsus buyruqlarni o'tkazib yuborish
    if (text.startsWith('/')) return;

    // --- TEZKOR VIZUAL HISOBOT MENYULARI ---
    if (text === '📊 Kunlik hisobot' || text.toLowerCase() === 'kunlik hisobot') {
      await sendDailyReport(bot, chatId, userId);
      return;
    }

    if (text === '💳 Qarzlar holati' || text.toLowerCase() === 'qarzlar holati') {
      await sendDebtReport(bot, chatId, userId);
      return;
    }

    if (text === '📦 Ombor holati' || text.toLowerCase() === 'ombor holati') {
      await sendInventoryReport(bot, chatId, userId);
      return;
    }

    if (text === '👤 Mening profilim' || text.toLowerCase() === 'profilim') {
      await sendProfileInfo(bot, chatId, userId);
      return;
    }

    if (text === 'ℹ️ Yordam markazi' || text.toLowerCase() === 'yordam') {
      await sendHelp(bot, chatId);
      return;
    }

    // --- ONBOARDING BOSQICHLARI ---
    const state = businessStore.get(userId);
    if (!state) return;

    // 1-QADAM: Ismni qabul qilish -> 2-QADAM: Nomer so'rash
    if (state.step === 'WAITING_NAME') {
      if (text.length < 2) {
        await bot.sendMessage(chatId, 'Iltimos, haqiqiy ism va familiyangizni kiriting:');
        return;
      }
      state.fullName = text;
      state.step = 'WAITING_PHONE';
      businessStore.set(userId, state);

      await bot.sendMessage(
        chatId,
        `Rahmat, <b>${text}</b>!\n\n` +
        `Endi <b>telefon raqamingizni</b> yuboring.\n` +
        `Quyidagi tugmani bosishingiz yoki <code>+998901234567</code> formatida yozishingiz mumkin:`,
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

    // 2-QADAM: Matn shaklida telefon raqam
    if (state.step === 'WAITING_PHONE') {
      let cleanPhone = text.replace(/[^\d+]/g, '');
      if (cleanPhone.length >= 9) {
        if (!cleanPhone.startsWith('+')) cleanPhone = `+${cleanPhone}`;
        state.phone = cleanPhone;
        state.step = 'WAITING_SECTOR';
        businessStore.set(userId, state);

        await bot.sendMessage(
          chatId,
          `Telefon raqamingiz saqlandi: <b>${cleanPhone}</b>\n\n` +
          `Qaysi yo‘nalishda faoliyat yuritishingizni tanlang:`,
          {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: 'Vet & Agro Dorixona', callback_data: 'sector:pharmacy' }],
                [{ text: 'Yem-xashak & Ozuqa Ombori', callback_data: 'sector:feed' }],
                [{ text: 'Urug‘ & Ko‘chat Do‘koni', callback_data: 'sector:seeds' }],
                [{ text: 'Issiqxona & Sug‘orish Mollari', callback_data: 'sector:greenhouse' }],
                [{ text: 'Qishloq Xo‘jalik Texnikasi & Ehtiyot Qismlar', callback_data: 'sector:machinery' }],
              ],
            },
          }
        );
      } else {
        await bot.sendMessage(
          chatId,
          `Telefon raqam noto‘g‘ri kiritildi. Iltimos <code>+998901234567</code> shaklida yozing:`
        );
      }
      return;
    }

    // 4-QADAM: Do'kon / Biznes nomini qabul qilish -> 5-QADAM: Hudud tanlash
    if (state.step === 'WAITING_STORE_NAME') {
      if (text.length < 2) {
        await bot.sendMessage(chatId, 'Iltimos, do‘koningiz yoki korxonangiz nomini to‘liqroq yozing:');
        return;
      }
      state.storeName = text;
      state.step = 'WAITING_REGION';
      businessStore.set(userId, state);

      await bot.sendMessage(
        chatId,
        `Do‘kon nomi: <b>${text}</b>\n\n` +
        `Do‘koningiz joylashgan <b>viloyat yoki hududni</b> tanlang:`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: buildRegionKeyboard(),
          },
        }
      );
      return;
    }
  });

  // ========================================================
  // 4. CALLBACK QUERIES (SEKTOR, HUDUD, LOGIN APPROVAL)
  // ========================================================
  bot.onCallbackQuery(async (query: TelegramCallbackQuery) => {
    const chatId = query.message?.chat.id || query.from.id;
    const userId = query.from.id;
    const data = query.data || '';

    // A) WEB LOGINNI TASDIQLASH (approve_login_... yoki approve_reg_...)
    if (data.startsWith('approve_')) {
      const token = data.replace('approve_', '');
      const result = await dbService.approveSession(token, userId);

      if (result) {
        await bot.answerCallbackQuery(query.id, 'Tizimga kirish tasdiqlandi!');
        await bot.sendMessage(
          chatId,
          `✅ <b>Kirish muvaffaqiyatli tasdiqlandi!</b>\n\n` +
          `Brauzeringizda boshqaruv paneli avtomatik ochilmoqda. Xush kelibsiz!`,
          {
            parse_mode: 'HTML',
          }
        );
      } else {
        await bot.answerCallbackQuery(query.id, 'Sessiya eskirgan yoki topilmadi', true);
      }
      return;
    }

    // B) WEB LOGINNI RAD ETISH
    if (data.startsWith('reject_')) {
      await bot.answerCallbackQuery(query.id, 'Kirish so‘rovi bekor qilindi');
      await bot.sendMessage(chatId, 'Kirish so‘rovi bekor qilindi.');
      return;
    }

    // C) 3-QADAM: Sektor tanlanganda -> 4-QADAM: Do'kon nomini so'rash
    if (data.startsWith('sector:')) {
      const sector = data.split(':')[1] as SectorType;
      const state = businessStore.get(userId);

      if (state) {
        state.sector = sector;
        state.step = 'WAITING_STORE_NAME';
        businessStore.set(userId, state);

        const sectorName = SECTOR_LABELS[sector] || sector;
        await bot.answerCallbackQuery(query.id, `Tanlandi: ${sectorName}`);

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

    // D) 5-QADAM: Hudud tanlanganda -> RO'YXATDAN O'TISHNI YAKUNLASH
    if (data.startsWith('region:')) {
      const region = data.split(':')[1];
      const state = businessStore.get(userId);

      if (state) {
        state.region = region;
        state.step = 'COMPLETED';
        businessStore.set(userId, state);

        await bot.answerCallbackQuery(query.id, `Hudud tanlandi: ${region}`);
        await finishRegistration(bot, chatId, userId, state);
      }
      return;
    }

    // E) Do'kon ma'lumotlari
    if (data === 'action:info') {
      await bot.answerCallbackQuery(query.id);
      await sendProfileInfo(bot, chatId, userId);
      return;
    }

    // F) Qayta ro'yxatdan o'tish
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
  // 5. BUYRUQLAR: /hisobot, /qarz, /ombor, /profil, /help
  // ========================================================
  bot.onCommand('hisobot', async (msg: TelegramMessage) => {
    await sendDailyReport(bot, msg.chat.id, msg.from?.id || msg.chat.id);
  });

  bot.onCommand('qarz', async (msg: TelegramMessage) => {
    await sendDebtReport(bot, msg.chat.id, msg.from?.id || msg.chat.id);
  });

  bot.onCommand('ombor', async (msg: TelegramMessage) => {
    await sendInventoryReport(bot, msg.chat.id, msg.from?.id || msg.chat.id);
  });

  bot.onCommand('profil', async (msg: TelegramMessage) => {
    await sendProfileInfo(bot, msg.chat.id, msg.from?.id || msg.chat.id);
  });

  bot.onCommand('help', async (msg: TelegramMessage) => {
    await sendHelp(bot, msg.chat.id);
  });
}

// ========================================================
// YORDAMCHI VIZUAL HISOBOT FUNKSIYALARI
// ========================================================

async function sendDailyReport(bot: TelegramBot, chatId: number, userId: number) {
  const tenant = await dbService.findTenant(userId);
  const store = businessStore.get(userId);

  const tenantId = tenant?.id || `tenant_${userId}`;
  const storeName = tenant?.name || store?.storeName || 'BiznesGO Do‘kon';
  const sectorCode = tenant?.sector_type || store?.sector || 'pharmacy';

  const sales = await dbService.getTodaySales(tenantId);
  const todayStr = new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' });

  const appUrl = `${config.webAppUrl}?tg_id=${userId}&name=${encodeURIComponent(storeName)}&sector=${sectorCode}`;

  await bot.sendMessage(
    chatId,
    `📊 <b>Kunlik Savdo Hisoboti</b>\n` +
    `Sana: <b>${todayStr}</b>\n` +
    `Do‘kon: <b>${storeName}</b>\n\n` +
    `• Jami savdo tushumi: <b>${formatMoney(sales.total)} so‘m</b>\n` +
    `  - Naqd to‘lovlar: <b>${formatMoney(sales.cash)} so‘m</b>\n` +
    `  - Bank kartasi (terminal): <b>${formatMoney(sales.card)} so‘m</b>\n` +
    `  - Nasiyaga (qarzga): <b>${formatMoney(sales.debt)} so‘m</b>\n\n` +
    `• Savdo cheklari soni: <b>${sales.count} ta</b>\n` +
    `• O‘rtacha chek: <b>${formatMoney(sales.avgCheck)} so‘m</b>\n\n` +
    `<i>Batafsil cheklar, kassa operatsiyalari va rentabellik tahlili Launch Appda:</i>`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 BiznesGO Launch Appni ochish', web_app: { url: appUrl } }],
        ],
      },
    }
  );
}

async function sendDebtReport(bot: TelegramBot, chatId: number, userId: number) {
  const tenant = await dbService.findTenant(userId);
  const store = businessStore.get(userId);

  const tenantId = tenant?.id || `tenant_${userId}`;
  const storeName = tenant?.name || store?.storeName || 'BiznesGO Do‘kon';
  const sectorCode = tenant?.sector_type || store?.sector || 'pharmacy';

  const debt = await dbService.getDebtSummary(tenantId);
  const appUrl = `${config.webAppUrl}/debts?tg_id=${userId}&name=${encodeURIComponent(storeName)}&sector=${sectorCode}`;

  await bot.sendMessage(
    chatId,
    `💳 <b>Nasiya va Qarzlar Daftari</b>\n` +
    `Do‘kon: <b>${storeName}</b>\n\n` +
    `• Jami ochiq nasiyalar: <b>${formatMoney(debt.totalDebt)} so‘m</b>\n` +
    `• Qarzdor mijozlar soni: <b>${debt.debtorCount} nafar</b>\n` +
    `• Kechikkan (muddati o‘tgan) qarzlar: <b>${formatMoney(debt.overdueDebt)} so‘m (${debt.overdueCount} ta)</b>\n\n` +
    `<i>Mijozlar ro‘yxati, to‘lov kiritish va SMS eslatma yuborish Launch Appda:</i>`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Qarzlar daftarini ochish', web_app: { url: appUrl } }],
        ],
      },
    }
  );
}

async function sendInventoryReport(bot: TelegramBot, chatId: number, userId: number) {
  const tenant = await dbService.findTenant(userId);
  const store = businessStore.get(userId);

  const tenantId = tenant?.id || `tenant_${userId}`;
  const storeName = tenant?.name || store?.storeName || 'BiznesGO Do‘kon';
  const sectorCode = tenant?.sector_type || store?.sector || 'pharmacy';

  const inv = await dbService.getInventorySummary(tenantId);
  const appUrl = `${config.webAppUrl}/inventory?tg_id=${userId}&name=${encodeURIComponent(storeName)}&sector=${sectorCode}`;

  await bot.sendMessage(
    chatId,
    `📦 <b>Ombor va Tovarlar Holati</b>\n` +
    `Do‘kon: <b>${storeName}</b>\n\n` +
    `• Ombordagi jami tovarlar: <b>${inv.totalProducts} xil</b>\n` +
    `• Qoldig‘i tugagan tovarlar: <b>${inv.outOfStock} ta</b>\n` +
    `• Qoldig‘i kam qolgan tovarlar (xavf): <b>${inv.lowStock} ta</b>\n` +
    `• Muddati kelayotgan partiyalar (30 kun): <b>${inv.expiringSoon} ta</b>\n\n` +
    `<i>Tovar qabul qilish, narxlarni o‘zgartirish va shtrix-kodlar bilan ishlash Launch Appda:</i>`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Ombor bo‘limini ochish', web_app: { url: appUrl } }],
        ],
      },
    }
  );
}

async function sendProfileInfo(bot: TelegramBot, chatId: number, userId: number) {
  const tenant = await dbService.findTenant(userId);
  const store = businessStore.get(userId);

  const storeName = tenant?.name || store?.storeName || 'BiznesGO Do‘kon';
  const sectorCode = tenant?.sector_type || store?.sector || 'pharmacy';
  const sectorName = SECTOR_LABELS[sectorCode] || sectorCode;
  const phone = tenant?.phone || store?.phone || '+998';
  const region = (tenant?.settings?.region || tenant?.address || store?.region || 'O‘zbekiston').replace('tg:' + userId, '');
  const ownerName = tenant?.settings?.owner_name || store?.fullName || 'Tadbirkor';

  const appUrl = `${config.webAppUrl}?tg_id=${userId}&name=${encodeURIComponent(storeName)}&sector=${sectorCode}&phone=${encodeURIComponent(phone)}&region=${encodeURIComponent(region)}`;

  await bot.sendMessage(
    chatId,
    `👤 <b>Mening Profilim</b>\n\n` +
    `• Do‘kon nomi: <b>${storeName}</b>\n` +
    `• Mas'ul: <b>${ownerName}</b>\n` +
    `• Soha (sektor): <b>${sectorName}</b>\n` +
    `• Hudud: <b>${region}</b>\n` +
    `• Telefon: <b>${phone}</b>\n` +
    `• Telegram ID: <code>${userId}</code>\n` +
    `• Tizim holati: <b>Faol (Cloud B2B)</b>`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 BiznesGO Launch Appni ochish', web_app: { url: appUrl } }],
          [{ text: 'Qayta ro‘yxatdan o‘tish', callback_data: 'action:reset' }],
        ],
      },
    }
  );
}

async function sendHelp(bot: TelegramBot, chatId: number) {
  await bot.sendMessage(
    chatId,
    `<b>BiznesGO Yordam Markazi</b>\n\n` +
    `BiznesGO orqali siz quyidagilarni boshqarasiz:\n` +
    `1. Kassa va savdo cheklarini chiqarish (POS)\n` +
    `2. Shtrix-kod skaneri va tovar qoldig‘i\n` +
    `3. Qarz daftari (nasiyalar) va SMS xabarnoma\n` +
    `4. Kunlik va oylik foyda hisoboti\n\n` +
    `Savollar va takliflar uchun:\n` +
    `Telefon: +998 90 8383772\n` +
    `Email: info@biznesgo.uz\n` +
    `Bot username: @biznesgo_bot`,
    { parse_mode: 'HTML' }
  );
}

// Ro'yxatdan o'tishni yakunlash va Neon DB ga saqlash
async function finishRegistration(
  bot: TelegramBot,
  chatId: number,
  userId: number,
  state: UserBusinessState
) {
  const sectorName = SECTOR_LABELS[state.sector as SectorType] || state.sector;

  // Neon DB ga saqlash
  try {
    await dbService.registerTenant({
      telegramId: userId,
      fullName: state.fullName || state.firstName,
      phone: state.phone || '+998',
      sector: state.sector || 'pharmacy',
      storeName: state.storeName || 'BiznesGO Do‘kon',
      region: state.region || 'O‘zbekiston',
    });
  } catch (err) {
    console.warn('[finishRegistration DB err]:', err);
  }

  const appUrl = `${config.webAppUrl}?tg_id=${userId}&name=${encodeURIComponent(state.storeName || '')}&sector=${state.sector}&phone=${encodeURIComponent(state.phone || '')}&region=${encodeURIComponent(state.region || '')}`;

  // Doimiy chat menyu tugmasini o'rnatish
  await bot.setChatMenuButton(chatId, appUrl, 'BiznesGO');

  await bot.sendMessage(
    chatId,
    `Tabriklaymiz, <b>${state.fullName || state.firstName}</b>!\n\n` +
    `Sizning <b>«${state.storeName}»</b> (${sectorName}) korxonangiz muvaffaqiyatli ro‘yxatdan o‘tkazildi.\n\n` +
    `Hudud: <b>${state.region}</b>\n` +
    `Telefon: <b>${state.phone}</b>\n\n` +
    `Tezkor ko‘rsatkichlar pastki menyu tugmalarida joylashdi. To‘liq do‘koningizni boshqarish uchun pastdagi tugmani bosing:`,
    {
      parse_mode: 'HTML',
      reply_markup: getMainKeyboard(appUrl),
    }
  );
}
