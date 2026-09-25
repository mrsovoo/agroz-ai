/**
 * Guruhga botlar qo'shilganda yuboriladigan xush kelibsiz xabari va
 * shaxsiy botga yo'naltiruvchi tugmalar logikasi.
 *
 * Ikkala bot (@agrozai_bot va @agroz_auth_bot) guruhga qo'shilganda ham
 * foydalanuvchilarga qisqa tanishtiruv beradi va o'z vazifasiga ko'ra
 * mos botga o'tish imkonini taqdim etadi.
 */

import { getBotUsername, authBotUsername, sendMessage } from "./telegram-bot.js";
import { sendAuthMessage } from "./auth-bot.js";
import { telegramBotUsername, telegramAuthBotUsername } from "./settings.js";

export async function getGroupWelcomeData() {
  const mainSetting = await telegramBotUsername();
  const authSetting = await telegramAuthBotUsername();

  const detectedMain = (await getBotUsername()) || mainSetting || process.env.TELEGRAM_BOT_USERNAME || "agrozai_bot";
  const detectedAuth = authBotUsername() || authSetting || process.env.TELEGRAM_AUTH_BOT_USERNAME || "agroz_auth_bot";

  const cleanMain = detectedMain.replace(/^@/, "").trim();
  const cleanAuth = detectedAuth.replace(/^@/, "").trim();

  const text = [
    `🌿 <b>Assalomu alaykum, hurmatli guruh a'zolari!</b>`,
    ``,
    `<b>Agroz AI</b> — bu O'zbekistondagi dehqon, fermer va chorvadorlar uchun yaratilgan zamonaviy sun'iy intellekt (AI) agro-ekotizimi!`,
    ``,
    `Guruhda botlardan to'liq foydalanish cheklangan bo'lishi mumkin. O'zingizga kerakli bo'lim bo'yicha botlarimizning <b>shaxsiy chatiga</b> o'ting:`,
    ``,
    `👨‍🌾 <b>1. Agar siz Dehqon, Fermer yoki Oddiy foydalanuvchi bo'lsangiz:</b>`,
    `• Ekin va chorva kasalliklariga rasm orqali sun'iy intellekt (AI) tashxisi qo'yish`,
    `• Yaqin atrofdagi dorixonalar va mutaxassislarni xaritada topish`,
    `• Dori vositalarini qidirish va yetkazib berish bilan buyurtma berish`,
    `👉 <i>Mijoz boti:</i> @${cleanMain}`,
    ``,
    `🏪 <b>2. Agar siz Dorixona egasi yoki Mutaxassis (Agronom / Veterinar) bo'lsangiz:</b>`,
    `• Dorixonangiz va mahsulotlaringizni xaritaga joylashtirish`,
    `• Dehqonlardan yangi buyurtmalar va chaqiruvlarni qabul qilish`,
    `• O'z xizmatlaringizni butun respublika bo'ylab reklama qilish`,
    `👉 <i>Mutaxassis & Dorixona boti:</i> @${cleanAuth}`,
    ``,
    `👇 <b>Bot bilan shaxsiy chatda bog'lanish uchun pastdagi tugmani bosing:</b>`,
  ].join("\n");

  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: `🌱 Dehqon & Fermer boti (@${cleanMain})`,
          url: `https://t.me/${cleanMain}?start=from_group`,
        },
      ],
      [
        {
          text: `🏪 Mutaxassis & Dorixona boti (@${cleanAuth})`,
          url: `https://t.me/${cleanAuth}?start=from_group`,
        },
      ],
      [
        {
          text: "🌐 Agroz AI Veb-Platformasi",
          url: "https://agroz.uz",
        },
      ],
    ],
  };

  return { text, inlineKeyboard, mainBot: cleanMain, authBot: cleanAuth };
}

/** Asosiy bot (@agrozai_bot / @agroz_bot) guruhga xabar yuborishi */
export async function sendMainBotGroupWelcome(chatId: number): Promise<boolean> {
  try {
    const { text, inlineKeyboard } = await getGroupWelcomeData();
    return await sendMessage(chatId, text, { keyboard: inlineKeyboard });
  } catch (err) {
    console.error(`[main-bot] sendMainBotGroupWelcome xatosi (chatId: ${chatId}):`, err);
    return false;
  }
}

/** Auth bot (@agroz_auth_bot) guruhga xabar yuborishi */
export async function sendAuthBotGroupWelcome(chatId: number): Promise<boolean> {
  try {
    const { text, inlineKeyboard } = await getGroupWelcomeData();
    return await sendAuthMessage(chatId, text, { inline: inlineKeyboard });
  } catch (err) {
    console.error(`[auth-bot] sendAuthBotGroupWelcome xatosi (chatId: ${chatId}):`, err);
    return false;
  }
}
