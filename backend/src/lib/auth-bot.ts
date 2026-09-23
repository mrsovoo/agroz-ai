/**
 * `@agroz_auth_bot` — mutaxassislar va dorixona egalarini ro'yxatdan o'tkazuvchi bot.
 *
 * Asosiy botdan (kirish/OTP uchun) ajratilgan: bu bot faqat ro'yxatdan o'tkazish
 * va profil yangilash bilan shug'ullanadi. Token alohida — admin panel orqali
 * ham yangilanadi (DB'dagi qiymat env'dan ustun turadi).
 */

import { telegramAuthBotToken } from "@/lib/settings";

const API_BASE = "https://api.telegram.org";

export type InlineKeyboard = {
  inline_keyboard: { text: string; callback_data?: string; url?: string }[][];
};

export type ReplyKeyboard = {
  keyboard: { text: string; request_contact?: boolean; request_location?: boolean }[][];
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
  remove_keyboard?: boolean;
};

/** Sinxron env tokeni — dori rasmi proxy'sida ishlatiladi. */
export function authBotToken(): string | null {
  const token = process.env.TELEGRAM_AUTH_BOT_TOKEN?.trim();
  return token ? token : null;
}

/** Token: DB (admin panel) > env. */
export async function resolveAuthBotToken(): Promise<string | null> {
  return telegramAuthBotToken();
}

export async function isAuthBotConfigured(): Promise<boolean> {
  return (await resolveAuthBotToken()) !== null;
}

export async function callAuthBot<T>(
  method: string,
  payload?: Record<string, unknown>,
): Promise<T | null> {
  const token = await resolveAuthBotToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {}),
    });
    const json = (await res.json()) as { ok?: boolean; result?: T; description?: string };
    if (!json.ok) {
      console.error(`[auth-bot] ${method} xatosi:`, json.description ?? res.status);
      return null;
    }
    return json.result ?? null;
  } catch (err) {
    console.error(`[auth-bot] ${method} so'rovi bajarilmadi:`, err);
    return null;
  }
}

/** Xabar yuborish. `replyKeyboard` berilsa klaviatura pastda doimiy turadi. */
export async function sendAuthMessage(
  chatId: number,
  text: string,
  options?: { inline?: InlineKeyboard; replyKeyboard?: ReplyKeyboard },
): Promise<boolean> {
  if (options?.inline && options?.replyKeyboard) {
    // Agar ikkalasi ham berilgan bo'lsa, asosiy xabarga inline_keyboard biriktiriladi
    const result = await callAuthBot<{ message_id?: number }>("sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      reply_markup: options.inline,
    });
    return result !== null;
  }

  const replyMarkup = options?.inline ?? options?.replyKeyboard;
  const result = await callAuthBot<{ message_id?: number }>("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
  return result !== null;
}

/** Pastdagi doimiy klaviaturani olib tashlab, xabar yuboradi. */
export async function clearReplyKeyboard(chatId: number, text: string): Promise<boolean> {
  return sendAuthMessage(chatId, text, {
    replyKeyboard: { keyboard: [], resize_keyboard: true, remove_keyboard: true },
  });
}

/** Rasm yuborish (dori rasmini tasdiqlash uchun). */
export async function sendAuthPhoto(
  chatId: number,
  fileId: string,
  caption: string,
  options?: { inline?: InlineKeyboard },
): Promise<boolean> {
  const result = await callAuthBot<{ message_id?: number }>("sendPhoto", {
    chat_id: chatId,
    photo: fileId,
    caption,
    parse_mode: "HTML",
    ...(options?.inline ? { reply_markup: options.inline } : {}),
  });
  return result !== null;
}

export async function answerCallbackQuery(id: string, text?: string): Promise<void> {
  await callAuthBot("answerCallbackQuery", {
    callback_query_id: id,
    ...(text ? { text } : {}),
  });
}

export async function editAuthMessageReplyMarkup(
  chatId: number,
  messageId: number,
  replyMarkup?: InlineKeyboard,
): Promise<boolean> {
  const result = await callAuthBot("editMessageReplyMarkup", {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: replyMarkup ?? { inline_keyboard: [] },
  });
  return result !== null;
}

export async function editAuthMessageText(
  chatId: number,
  messageId: number,
  text: string,
  options?: { inline?: InlineKeyboard },
): Promise<boolean> {
  const result = await callAuthBot("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    reply_markup: options?.inline ?? { inline_keyboard: [] },
  });
  return result !== null;
}

/** Telegram `parse_mode=HTML` uchun foydalanuvchi matnini ekranlaydi. */
export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---------------------------------------------------------------------------
// Klaviaturalar
// ---------------------------------------------------------------------------

export const ROLE_KEYBOARD: InlineKeyboard = {
  inline_keyboard: [
    [
      { text: "👨‍🌾 Mutaxassisman", callback_data: "r:s" },
      { text: "🏪 Dorixona egasiman", callback_data: "r:p" },
    ],
  ],
};

export const SPECIALTY_KEYBOARD: InlineKeyboard = {
  inline_keyboard: [
    [
      { text: "🌱 O'simliklar / Ekinlar (Agronom)", callback_data: "sp:crop" },
    ],
    [
      { text: "🐄 Veterinariya (Chorvachilik)", callback_data: "sp:animal" },
    ],
    [
      { text: "🌿🐄 Ikkalasi ham (Ekin & Chorva)", callback_data: "sp:both" },
    ],
  ],
};

export const EXPERIENCE_KEYBOARD: InlineKeyboard = {
  inline_keyboard: [
    [
      { text: "🌱 1–2 yil (boshlang'ich)", callback_data: "exp:2" },
      { text: "🌿 3–5 yil (amaliyotchi)", callback_data: "exp:4" },
    ],
    [
      { text: "🌳 5–10 yil (tajribali)", callback_data: "exp:7" },
      { text: "👑 10+ yil (katta mutaxassis)", callback_data: "exp:12" },
    ],
    [{ text: "⏩ O'tkazib yuborish", callback_data: "exp:skip" }],
  ],
};

export const WORK_HOURS_KEYBOARD: InlineKeyboard = {
  inline_keyboard: [
    [
      { text: "⏰ 08:00 - 18:00", callback_data: "wh:08:00 - 18:00" },
      { text: "⏰ 09:00 - 20:00", callback_data: "wh:09:00 - 20:00" },
    ],
    [
      { text: "🚨 24/7 (favqulodda)", callback_data: "wh:24/7" },
      { text: "⏩ O'tkazib yuborish (09:00 - 18:00)", callback_data: "wh:skip" },
    ],
  ],
};

export const PHARMACY_TYPE_KEYBOARD: InlineKeyboard = {
  inline_keyboard: [
    [
      { text: "🌾 Agro dorixona", callback_data: "pt:agro" },
      { text: "🩺 Vet dorixona", callback_data: "pt:vet" },
    ],
    [{ text: "📦 Umumiy (ikkalasi ham)", callback_data: "pt:general" }],
  ],
};

/** Dorini tasdiqlash / qayta yuborish / bekor qilish. */
export const MEDICINE_CONFIRM_KEYBOARD: InlineKeyboard = {
  inline_keyboard: [
    [{ text: "✅ Tasdiqlash", callback_data: "m:ok" }],
    [
      { text: "🔄 Qayta yuborish", callback_data: "m:restart" },
      { text: "❌ Bekor qilish", callback_data: "m:no" },
    ],
  ],
};

/** Dori qo'shish boshida rasm yoki rasmsiz davom etish. */
export const MEDICINE_PHOTO_KEYBOARD: InlineKeyboard = {
  inline_keyboard: [
    [{ text: "⏩ Rasmsiz davom etish (nomini yozish)", callback_data: "m:skip_photo" }],
    [{ text: "❌ Bekor qilish", callback_data: "m:no" }],
  ],
};

/** Dori qo'shish jarayonida har bir etapda ko'rinadigan bekor tugmasi. */
export const MEDICINE_CANCEL_KEYBOARD: InlineKeyboard = {
  inline_keyboard: [[{ text: "❌ Bekor qilish", callback_data: "m:no" }]],
};

/** Dori saqlangandan keyingi tugmalar. */
export const MEDICINE_DONE_KEYBOARD: InlineKeyboard = {
  inline_keyboard: [
    [{ text: "➕ Yana dori qo'shish", callback_data: "m:again" }],
    [{ text: "💊 Dorilarim ro'yxati", callback_data: "m:list" }],
    [{ text: "👤 Profilimni ko'rish", callback_data: "m:profile" }],
  ],
};

/** Tasdiqlangan dorixona egasi uchun doimiy menyu tugmalari (Reply Keyboard). */
export function approvedPharmacyMenuKeyboard(): ReplyKeyboard {
  return {
    keyboard: [
      [{ text: "📦 Buyurtmalar" }, { text: "💊 Dorilarim" }],
      [{ text: "➕ Dori qo'shish" }, { text: "👤 Ma'lumotlarim" }],
    ],
    resize_keyboard: true,
  };
}

/** Tasdiqlangan mutaxassis uchun doimiy menyu tugmalari (Reply Keyboard). */
export function approvedSpecialistMenuKeyboard(): ReplyKeyboard {
  return {
    keyboard: [
      [{ text: "📋 Chaqiruvlarim" }, { text: "👤 Ma'lumotlarim" }],
      [{ text: "✏️ Profilni tahrirlash" }],
    ],
    resize_keyboard: true,
  };
}

/** Hali tasdiqlanmagan (arizasi kutilayotgan) foydalanuvchi menyusi. */
export function pendingApprovalMenuKeyboard(): ReplyKeyboard {
  return {
    keyboard: [
      [{ text: "⏳ Ariza holati" }, { text: "👤 Ma'lumotlarim" }],
    ],
    resize_keyboard: true,
  };
}

/** Profilni ko'rish va to'g'ridan-to'g'ri tahrirlash klaviaturasi. */
export function profileKeyboard(s: { role: string; name: string; isApproved?: boolean }): InlineKeyboard {
  const isPharmacy = s.role === "pharmacy";
  const rows: InlineKeyboard["inline_keyboard"] = [
    [
      { text: "✏️ Ismni o'zgartirish", callback_data: "ed:name" },
      { text: "📞 Telefonni o'zgartirish", callback_data: "ed:phone" },
    ],
    [
      { text: "📍 Manzil/Lokatsiya", callback_data: "ed:loc" },
      { text: "⏰ Ish vaqti", callback_data: "ed:hours" },
    ],
  ];

  if (isPharmacy) {
    rows.push([
      { text: "🏪 Tashkilot nomi", callback_data: "ed:org" },
    ]);
    if (s.isApproved) {
      rows.push([
        { text: "➕ Yangi dori qo'shish", callback_data: "m:again" },
        { text: "💊 Dorilarimni boshqarish", callback_data: "m:list" },
      ]);
      rows.push([
        { text: "📦 Buyurtmalar", callback_data: "m:orders" },
      ]);
    } else {
      rows.push([
        { text: "⏳ Ariza holati: Ko'rib chiqilmoqda...", callback_data: "app:status" },
      ]);
    }
  } else {
    rows.push([
      { text: "🎯 Mutaxassislikni o'zgartirish", callback_data: "ed:spec" },
    ]);
    if (!s.isApproved) {
      rows.push([
        { text: "⏳ Ariza holati: Ko'rib chiqilmoqda...", callback_data: "app:status" },
      ]);
    }
  }

  rows.push([
    { text: "🔄 Barcha ma'lumotlarni qayta to'ldirish", callback_data: "r:start" },
    { text: "🗑 Profilni o'chirish", callback_data: "pd:ask" },
  ]);

  return { inline_keyboard: rows };
}

/** Lokatsiyadan topilgan manzilni tasdiqlash yoki qo'lda yozish. */
export const ADDRESS_CONFIRM_KEYBOARD: InlineKeyboard = {
  inline_keyboard: [
    [{ text: "✅ Manzil to'g'ri", callback_data: "ad:ok" }],
    [{ text: "✏️ O'zim yozaman", callback_data: "ad:edit" }],
  ],
};

export const CONFIRM_KEYBOARD: InlineKeyboard = {
  inline_keyboard: [
    [{ text: "✅ Tasdiqlash", callback_data: "c:ok" }],
    [{ text: "❌ Bekor qilish", callback_data: "c:no" }],
  ],
};

export const NEXT_STEP_KEYBOARD: InlineKeyboard = {
  inline_keyboard: [[{ text: "▶️ Ro'yxatdan o'tish", callback_data: "r:start" }]],
};

export function contactKeyboard(): ReplyKeyboard {
  return {
    keyboard: [[{ text: "📱 Telefon raqamni yuborish", request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  };
}

export function locationKeyboard(): ReplyKeyboard {
  return {
    keyboard: [[{ text: "📍 Lokatsiyani yuborish", request_location: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  };
}

// ---------------------------------------------------------------------------
// Xabarlar
// ---------------------------------------------------------------------------

export function welcomeMessage(name?: string, registered = false): string {
  const lines = [
    `👋 Salom${name ? `, ${escapeHtml(name)}` : ""}!`,
    "",
    "Men <b>Agroz Auth</b> botiman — <b>Agroz AI</b> platformasi uchun mutaxassislar va",
    "dorixona egalarini ro'yxatdan o'tkazaman.",
    "",
    "📋 Ro'yxatdan o'tish uchun quyidagilar so'raladi:",
    "• Ism-familiya",
    "• Telefon raqam",
    "• Lokatsiya (xaritada ko'rinish uchun)",
    "• Manzil",
    "• Mutaxassislik yoki dorixona ma'lumoti",
  ];
  if (registered) {
    lines.push("", "ℹ️ Siz allaqachon ro'yxatdagisiz — qayta yuborsangiz ma'lumotlar yangilanadi.");
  }
  lines.push("", "Boshlash uchun pastdagi tugmani bosing.");
  return lines.join("\n");
}

export function roleQuestion(): string {
  return ["🧑‍🔬 <b>Kim sifatida ro'yxatdan o'tasiz?</b>", "", "Kerakli variantni tanlang."].join("\n");
}

export function askName(prefill?: string): string {
  const base = [
    "✍️ <b>Ism va familiyangizni yozing.</b>",
    "",
    "Masalan: <i>Alisher Qodirov</i>",
  ];
  if (prefill) base.push("", `Hozirgi qiymat: <b>${escapeHtml(prefill)}</b> — o'zgartirmasangiz shu qoladi.`);
  return base.join("\n");
}

export function askPhone(): string {
  return [
    "📱 <b>Hozirda ishlab turgan faol telefon raqamingizni kiriting.</b>",
    "",
    "⚠️ <b>DIQQAT:</b> Telegram hisobingizga ulangan raqam eskirgan yoki ishlamaydigan bo'lishi mumkin.",
    "Shuning uchun, ayni vaqtda sizga qo'ng'iroq qilsa tushadigan <b>ishlayotgan raqamingizni yozib yuboring</b>",
    "(masalan: <code>+998901234567</code> yoki <code>90 123 45 67</code>).",
    "",
    "<i>(Yoki agar Telegram hisobingizdagi raqam hozir ishlab turgan bo'lsa, pastdagi «📱 Telefon raqamni yuborish» tugmasini bosing)</i>",
    "",
    "❗️ Mijozlar va mutaxassislar siz bilan aynan shu raqam orqali bog'lanadi.",
  ].join("\n");
}

export function askLocation(): string {
  return [
    "📍 <b>Joylashuvingizni yuboring.</b>",
    "",
    "Pastdagi <b>«📍 Lokatsiyani yuborish»</b> tugmasini bosing.",
    "",
    "Bu sizni xaritada ko'rsatish va 5 km ichidagi mijozlarga topish uchun kerak.",
  ].join("\n");
}

export function askAddress(): string {
  return [
    "🏠 <b>Manzilni yozing.</b>",
    "",
    "Masalan: <i>Toshkent sh., Chilonzor t., Bunyodkor ko'chasi 45</i>",
  ].join("\n");
}

/** Lokatsiya bo'yicha avtomatik topilgan manzilni tasdiqlash so'rovi. */
export function askAddressConfirm(address: string): string {
  return [
    "📍 <b>Manzilingiz aniqlandi:</b>",
    "",
    `<b>${escapeHtml(address)}</b>`,
    "",
    "Shu manzil to'g'rimi? Tasdiqlasangiz, ro'yxatdan o'tish davom etadi.",
    "Agar noto'g'ri bo'lsa — «✏️ O'zim yozaman»ni bosing.",
  ].join("\n");
}

export function askSpecialty(): string {
  return [
    "🧑‍🌾 <b>1. Faoliyat yo'nalishingizni tanlang:</b>",
    "",
    "Agroz AI platformasida qaysi soha bo'yicha fermer va dehqonlarga yordam berasiz?",
    "Pastdagi 3 ta asosiy yo'nalishdan birini tanlang:",
  ].join("\n");
}

export function askSpecialtyText(): string {
  return [
    "✍️ <b>Mutaxassislik yo'nalishingizni yozing:</b>",
    "",
    "Qaysi sohada xizmat ko'rsatasiz? Masalan:",
    "• <i>Agronom-entomolog (ekin zararkunandalari)</i>",
    "• <i>Qoramol va mayda tuyoqli mollar veterinari</i>",
    "• <i>Tomchilatib sug'orish va o'g'itlash bo'yicha mutaxassis</i>",
    "• <i>Bog'dorchilik va ko'chatchilik ustasi</i>",
  ].join("\n");
}

export function askOrganization(): string {
  return [
    "🏪 <b>Dorixonangiz nomini yozing.</b>",
    "",
    "Masalan: <i>AgroHimiya Savdo</i>",
  ].join("\n");
}

export function askPharmacyType(): string {
  return [
    "🌾 <b>Dorixona turini tanlang.</b>",
    "",
    "• Agro — ekin/o'simlik dorilari",
    "• Vet — chorva/hayvon dorilari",
    "• Umumiy — ikkala turdagi dorilar ham",
  ].join("\n");
}

export function askWorkHours(prefill?: string): string {
  const base = [
    "🕘 <b>Mijozlar siz bilan qaysi vaqtlarda bog'lanishi mumkin?</b>",
    "",
    "Pastdagi tugmalardan birini tanlang yoki o'zingiz yozing:",
    "Masalan: <i>08:00 - 19:00</i>, <i>09:00 - 20:00</i> yoki <i>24/7 (favqulodda)</i>",
    "",
    "<i>O'tkazib yuborish uchun pastdagi /skip ni bosing (standart: 09:00 - 18:00).</i>",
  ];
  if (prefill) base.push("", `Hozirgi qiymat: <b>${escapeHtml(prefill)}</b>`);
  return base.join("\n");
}

export function confirmSummary(data: {
  role: string;
  name: string;
  phone: string;
  address: string;
  specialty: string | null;
  organization: string | null;
  helpsWith?: string | null;
  education?: string | null;
  experienceYears?: number | null;
  bio?: string | null;
  lat: number;
  lng: number;
  workHours?: string | null;
}): string {
  const roleLabel = data.role === "pharmacy" ? "🏪 Dorixona egasi" : "👨‍🌾 Mutaxassis";
  const rows = [
    "🧾 <b>Ma'lumotlarni tekshiring:</b>",
    "",
    `<b>Turi:</b> ${roleLabel}`,
    `<b>Ism:</b> ${escapeHtml(data.name)}`,
    `<b>Telefon:</b> ${escapeHtml(data.phone)}`,
  ];
  if (data.organization) rows.push(`<b>Dorixona nomi:</b> ${escapeHtml(data.organization)}`);
  if (data.specialty) rows.push(`<b>Mutaxassislik:</b> ${escapeHtml(data.specialty)}`);
  if (data.helpsWith) {
    const hwLabel =
      data.helpsWith === "crop"
        ? "🌱 Ekin va o'simliklar"
        : data.helpsWith === "animal"
          ? "🐄 Chorva va parrandalar"
          : "🌾 Har ikkalasi (universal)";
    rows.push(`<b>Soha yo'nalishi:</b> ${hwLabel}`);
  }
  if (data.education) rows.push(`<b>Ta'lim / Muassasa:</b> ${escapeHtml(data.education)}`);
  if (data.experienceYears) rows.push(`<b>Amaliy tajriba:</b> ${data.experienceYears} yil`);
  if (data.bio) rows.push(`<b>Xizmatlar / Bio:</b> ${escapeHtml(data.bio)}`);
  rows.push(
    `<b>Manzil:</b> ${escapeHtml(data.address)}`,
    `<b>Ish vaqti:</b> ${escapeHtml(data.workHours ?? "09:00 - 18:00")}`,
    `<b>Lokatsiya:</b> ${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`,
    "",
    "Hammasi to'g'rimi?",
  );
  return rows.join("\n");
}

export function savedMessage(name: string, role?: string): string {
  const isPharmacy = role === "pharmacy";
  return [
    "✅ <b>Ro'yxatdan muvaffaqiyatli o'tdingiz!</b>",
    "",
    `${escapeHtml(name)}, siz endi <b>Agroz AI</b> platformasida ${isPharmacy ? "dorixona sifatida" : "mutaxassis sifatida"} faolsiz.`,
    "📍 Yaqin atrofdagi dehqon va chorvadorlar sizni xaritada topa oladi va bevosita bog'lanadi.",
    "",
    "💡 Pastdagi tugmalar orqali boshqaruv panelidan foydalanishingiz mumkin.",
  ].join("\n");
}

export function applicationPendingMessage(name: string, role: string, orgName?: string | null): string {
  const roleLabel = role === "pharmacy" ? "Dorixona egasi" : "Mutaxassis";
  const rows = [
    "📋 <b>Arizangiz qabul qilindi!</b>",
    "",
    `Hurmatli <b>${escapeHtml(name)}</b>! Sizning <b>${roleLabel}</b> sifatida yuborgan arizangiz Agroz AI ma'muriyatiga ko'rib chiqish uchun yuborildi.`,
  ];
  if (orgName) rows.push(`🏪 Dorixona: <b>${escapeHtml(orgName)}</b>`);
  rows.push(
    "",
    "⏳ <b>Ariza holati: Ko'rib chiqilmoqda</b>",
    "",
    "Adminlar arizangizni tasdiqlagach, botda to'liq <b>Boshqaruv Paneli</b> (dori qo'shish, buyurtmalarni qabul qilish va boshqarish) avtomatik faollashadi.",
    "",
    "Ariza holatini tekshirish uchun pastdagi <b>«⏳ Ariza holati»</b> tugmasini bosing.",
  );
  return rows.join("\n");
}

export function applicationStatusMessage(s: {
  name: string;
  role: string;
  organization?: string | null;
  isApproved: boolean;
}): string {
  const roleLabel = s.role === "pharmacy" ? "Dorixona egasi" : "Mutaxassis";
  if (s.isApproved) {
    return [
      "✅ <b>Arizangiz tasdiqlangan!</b>",
      "",
      `Hurmatli <b>${escapeHtml(s.name)}</b> (${roleLabel}), arizangiz ma'muriyat tomonidan tasdiqlangan va profilingiz platformada faol!`,
      "",
      "Pastdagi menyu tugmalari orqali boshqaruv panelidan foydalanishingiz mumkin.",
    ].join("\n");
  }
  return [
    "⏳ <b>Arizangiz ko'rib chiqilmoqda</b>",
    "",
    `Hurmatli <b>${escapeHtml(s.name)}</b>! Sizning <b>${roleLabel}</b> arizangiz hozirda Agroz AI ma'muriyati tomonidan ko'rib chiqilmoqda.`,
    s.organization ? `🏪 Tashkilot: <b>${escapeHtml(s.organization)}</b>\n` : "",
    "Adminlarimiz arizangizni tekshirib tasdiqlagach, sizga darhol xabarnoma yuboriladi va botdagi barcha funksiyalar ochiladi.",
  ].filter(Boolean).join("\n");
}

export function applicationApprovedNotification(name: string, role: string): string {
  const isPharmacy = role === "pharmacy";
  return [
    "🎉 <b>Tabriklaymiz! Arizangiz tasdiqlandi!</b>",
    "",
    `Hurmatli <b>${escapeHtml(name)}</b>, sizning ${isPharmacy ? "dorixona" : "mutaxassis"} arizangiz ma'muriyat tomonidan ma'qullandi va tasdiqlandi!`,
    "",
    isPharmacy
      ? "🏪 Siz endi dorilaringizni qo'shishingiz va mijozlardan buyurtmalarni qabul qilishingiz mumkin."
      : "👨‍🌾 Siz endi mutaxassis sifatida fermer va bog'bonlar bilan muloqot qilishingiz mumkin.",
    "",
    "Boshqaruv paneli faollashdi. Pastdagi menyu tugmalaridan foydalanishingiz mumkin! 👇",
  ].join("\n");
}

export function applicationRejectedNotification(name: string, role: string, reason?: string): string {
  return [
    "⚠️ <b>Arizangiz holati: Tasdiqlanmadi</b>",
    "",
    `Hurmatli <b>${escapeHtml(name)}</b>, afsuski, sizning arizangiz ma'muriyat tomonidan tasdiqlanmadi.`,
    reason ? `\nSabab: <i>${escapeHtml(reason)}</i>\n` : "",
    "Ma'lumotlarni to'g'rilab qayta topshirish uchun <b>/royxatdan_otish</b> buyrug'idan foydalanishingiz mumkin.",
  ].join("\n");
}

export function pendingBlockedMessage(): string {
  return [
    "⏳ <b>Arizangiz hali tasdiqlanmagan.</b>",
    "",
    "Dori qo'shish va buyurtmalarni boshqarish faqat administratorlar arizangizni tasdiqlaganidan so'ng faollashadi.",
    "",
    "Iltimos, arizangiz ko'rib chiqilishini kuting yoki <b>«⏳ Ariza holati»</b> tugmasini bosing.",
  ].join("\n");
}

export function profileMessage(s: {
  name: string;
  phone: string;
  role: string;
  specialty: string | null;
  education?: string | null;
  bio?: string | null;
  experienceYears?: number | null;
  organization: string | null;
  address: string;
  workHours: string | null;
  lat: number;
  lng: number;
}): string {
  const roleLabel = s.role === "pharmacy" ? "🏪 Dorixona egasi" : "👨‍🌾 Mutaxassis";
  const rows = [
    "👤 <b>Sizning profilingiz</b>",
    "",
    `<b>Turi:</b> ${roleLabel}`,
    `<b>Ism:</b> ${escapeHtml(s.name)}`,
    `<b>Telefon:</b> ${escapeHtml(s.phone)}`,
  ];
  if (s.organization) rows.push(`<b>Dorixona:</b> ${escapeHtml(s.organization)}`);
  if (s.specialty) rows.push(`<b>Mutaxassislik:</b> ${escapeHtml(s.specialty)}`);
  if (s.education) rows.push(`<b>Ta'lim:</b> ${escapeHtml(s.education)}`);
  if (s.experienceYears) rows.push(`<b>Tajriba:</b> ${s.experienceYears} yil`);
  if (s.bio) rows.push(`<b>Ma'lumot:</b> ${escapeHtml(s.bio)}`);
  rows.push(
    `<b>Manzil:</b> ${escapeHtml(s.address)}`,
    `<b>Ish vaqti:</b> ${escapeHtml(s.workHours ?? "09:00 - 18:00")}`,
    `<b>Lokatsiya:</b> ${s.lat.toFixed(5)}, ${s.lng.toFixed(5)}`,
    "",
    "Yangilash: <b>/royxatdan_otish</b> · O'chirish: <b>/profilni_ochirish</b>",
  );
  return rows.join("\n");
}

export function cancelMessage(): string {
  return [
    "❌ Ro'yxatdan o'tish bekor qilindi.",
    "",
    "Qaytadan boshlash uchun <b>/royxatdan_otish</b> yuboring.",
  ].join("\n");
}

export function helpMessage(): string {
  return [
    "🤖 <b>Buyruqlar</b>",
    "",
    "/royxatdan_otish — ro'yxatdan o'tish yoki ma'lumotlarni yangilash",
    "/dori_qoshish — dorixonaga dori qo'shish (rasm + nom)",
    "/dorilarim — dorilar ro'yxati va o'chirish",
    "/buyurtmalar — mijozlar buyurtmalari (dorixona egalari uchun)",
    "/malumotlarim — profilingizni ko'rish",
    "/profilni_ochirish — profilingizni butunlay o'chirish",
    "/yangiliklar — agro va chorvachilik yangiliklarini ko'rish",
    "/bekor — jarayonni to'xtatish",
    "/yordam — shu yordam xabari",
  ].join("\n");
}

/** Profil o'chirish tasdiqlash klaviaturasi. */
export const PROFILE_DELETE_KEYBOARD: InlineKeyboard = {
  inline_keyboard: [
    [{ text: "🗑 Ha, profilingizni o'chirish", callback_data: "pd:yes" }],
    [{ text: "❌ Bekor qilish", callback_data: "pd:no" }],
  ],
};

export function askProfileDelete(profileName: string, role: string): string {
  const roleLabel = role === "pharmacy" ? "🏪 Dorixona egasi" : "👨‍🌾 Mutaxassis";
  return [
    "⚠️ <b>Profilingizni o'chirishni tasdiqlang</b>",
    "",
    `👤 ${escapeHtml(profileName)} (${roleLabel})`,
    "",
    role === "pharmacy"
      ? "Dorixona va undagi BARCHA dorilar platformadan o'chadi."
      : "Profil platformadan butunlay o'chadi.",
    "",
    "Keyin qayta ro'yxatdan o'tishingiz kerak bo'ladi.",
  ].join("\n");
}

export function profileDeletedMessage(): string {
  return [
    "🗑 <b>Profil o'chirildi.</b>",
    "",
    "Agar qayta qo'shilmoqchi bo'lsangiz: /royxatdan_otish",
  ].join("\n");
}

export function profileDeleteCanceledMessage(): string {
  return "✅ Profil o'chirilmadi — barcha ma'lumotlar saqlanib qoldi.";
}

/** Dorilar ro'yxati — status, narx va boshqaruv havolalari bilan. */
export function medicinesListMessage(
  items: { id: number; name: string; type: string; status: string; price?: number | null }[],
): string {
  const lines = ["💊 <b>Dorilaringiz</b>", ""];
  if (items.length === 0) {
    lines.push("Hozircha dori qo'shilmagan.", "", "Qo'shish: /dori_qoshish");
    return lines.join("\n");
  }
  for (const m of items) {
    const t = m.type === "crop" ? "🌱" : m.type === "animal" ? "🐄" : "📦";
    const status = m.status === "bor" ? "✅ Bor" : "❌ Yo'q";
    const price = m.price ? ` · ${formatSum(m.price)}` : "";
    lines.push(`${t} <b>${escapeHtml(m.name)}</b>`);
    lines.push(`   ${status}${price}`);
  }
  lines.push("", "Dori ustiga bossangiz — bor/yo'q, narx, o'chirish.");
  return lines.join("\n");
}

export function medicinesListKeyboard(
  items: { id: number; name: string; status: string }[],
): InlineKeyboard {
  return {
    inline_keyboard: [
      ...items.slice(0, 15).map((m) => [
        {
          text: `${m.status === "bor" ? "✅" : "❌"} ${m.name.slice(0, 28)}`,
          callback_data: `mm:${m.id}`,
        },
      ]),
      [{ text: "➕ Dori qo'shish", callback_data: "m:start" }],
    ],
  };
}

/** Bitta dori boshqaruvi klaviaturasi (bor/yoq, narx, o'chirish). */
export function medicineManageKeyboard(m: {
  id: number;
  status: string;
}): InlineKeyboard {
  return {
    inline_keyboard: [
      [
        m.status === "bor"
          ? { text: "❌ Yo'q deb belgilash", callback_data: `ms:${m.id}:yoq` }
          : { text: "✅ Bor deb belgilash", callback_data: `ms:${m.id}:bor` },
        { text: "💰 Narx", callback_data: `mp:set:${m.id}` },
      ],
      [{ text: "🗑 O'chirish", callback_data: `md:${m.id}` }],
      [{ text: "⬅️ Ro'yxatga qaytish", callback_data: "m:list" }],
    ],
  };
}

/** Bitta dori boshqarish xabari. */
export function medicineManageMessage(m: {
  name: string;
  type: string;
  status: string;
  price?: number | null;
  usage?: string | null;
}): string {
  const t = m.type === "crop" ? "🌱" : m.type === "animal" ? "🐄" : "📦";
  return [
    `${t} <b>${escapeHtml(m.name)}</b>`,
    "",
    `Holat: <b>${m.status === "bor" ? "✅ Bor" : "❌ Yo'q"}</b>`,
    m.price ? `Narx: <b>${formatSum(m.price)}</b>` : "Narx: kiritilmagan",
    ...(m.usage ? [`Nima uchun: ${escapeHtml(m.usage)}`] : []),
    "",
    "Kerakli amalni tanlang:",
  ].join("\n");
}

/** Narx kiritish rejimida ko'rinadigan bekor tugmasi. */
export const MEDICINE_PRICE_CANCEL_KEYBOARD: InlineKeyboard = {
  inline_keyboard: [[{ text: "❌ Bekor qilish", callback_data: "m:list" }]],
};

export function medicineDeletedMessage(name: string, total: number): string {
  return [`🗑 <b>${escapeHtml(name)}</b> o'chirildi.`, `📦 Qoldi: <b>${total}</b> ta`].join("\n");
}

export function noMedicinesMessage(): string {
  return ["ℹ️ Sizda hozircha dori yo'q.", "", "Qo'shish: <b>/dori_qoshish</b>"].join("\n");
}

/** Tajriba yillari so'rovi. */
export function askExperience(): string {
  return [
    "🏅 <b>4. Ushbu sohada necha yillik amaliy tajribangiz bor?</b>",
    "",
    "Pastdagi tayyor tugmalardan birini tanlang yoki raqam ko'rinishida yozing (masalan: <i>7</i>).",
    "",
    "<i>💡 Tajribali mutaxassislar xaritada va qidiruv ro'yxatida yuqoriroq ko'rsatiladi.</i>",
  ].join("\n");
}

/** Qayerda tamomlagan so'rovi. */
export function askEducation(): string {
  return [
    "🎓 <b>3. Mutaxassislik ma'lumotingiz / Diplomingiz:</b>",
    "",
    "Qaysi oliygoh, kollej yoki muassasada tahsil olgansiz?",
    "Masalan:",
    "• <i>Toshkent Davlat Agrar Universiteti (TDAU), Agronomiya</i>",
    "• <i>Samarqand Davlat Veterinariya Meditsinasi Universiteti</i>",
    "• <i>Qishloq xo'jaligi kolleji, Zootexniya</i>",
    "",
    "<i>(Agar ma'lumot kiritishni istamasangiz, /skip yozing)</i>",
  ].join("\n");
}

/** O'zi haqida qisqa ma'lumot. */
export function askBio(): string {
  return [
    "📋 <b>5. Qanday xizmatlar ko'rsatasiz va qanday muammolarni hal qilasiz?</b>",
    "",
    "Dehqon va chorvadorlar sizga qaysi masalalarda murojaat qilishi mumkin? Qisqacha yozing:",
    "Masalan:",
    "• <i>Ekin kasalliklarini aniqlash, dorilash sxemasini tuzish, hosildorlikni oshirish</i>",
    "• <i>Qoramol va mayda mollarni emlash, tug'ruqqa yordam, profilaktika</i>",
    "• <i>Issiqxona ekinlari (pomidor, bodring) parvarishi va oziqlantirish</i>",
    "",
    "<i>(O'tkazib yuborish uchun /skip yozing)</i>",
  ].join("\n");
}

/** Kimga yordam beradi (ekin/chorva). */
export const HELPS_WITH_KEYBOARD: InlineKeyboard = {
  inline_keyboard: [
    [{ text: "🌱 Ekin va o'simliklar (dala, bog', issiqxona)", callback_data: "hw:crop" }],
    [{ text: "🐄 Chorva va parrandalar (mol, qo'y, tovuq)", callback_data: "hw:animal" }],
    [{ text: "🌾 Har ikkalasi (universal agro-veterinar)", callback_data: "hw:both" }],
  ],
};

export function askHelpsWith(): string {
  return [
    "🎯 <b>2. Asosan qaysi yo'nalishda konsultatsiya berasiz?</b>",
    "",
    "Bu fermerlarga sizni kerakli bo'limda (Ekinlar yoki Chorva) to'g'ri topishiga yordam beradi:",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Dorixona uchun dori qo'shish
// ---------------------------------------------------------------------------

export function needRegistrationMessage(): string {
  return [
    "ℹ️ <b>Avval ro'yxatdan o'ting.</b>",
    "",
    "Dori qo'shish uchun dorixona egasi sifatida ro'yxatdan o'tishingiz kerak.",
    "Buyruq: <b>/royxatdan_otish</b>",
  ].join("\n");
}

export function onlyPharmacyMessage(role?: string): string {
  const isSpecialist = role === "specialist";
  return [
    "ℹ️ <b>Bu bo'lim faqat dorixona egalari uchun.</b>",
    "",
    isSpecialist
      ? "Siz <b>mutaxassis</b> sifatida ro'yxatdan o'tgansiz — dorilarni dorixona egalari qo'shadi."
      : "Dorilarni dorixona egasi sifatida ro'yxatdan o'tganlar qo'shadi.",
    "",
    "Agar sizda dorixona bo'lsa va uni platformaga qo'shmoqchi bo'lsangiz,",
    "/royxatdan_otish buyrug'i bilan «🏪 Dorixona egasiman»ni tanlab qayta ro'yxatdan o'ting.",
  ].join("\n");
}

/** /dori_qoshish boshlanganda — dorixona ma'lumoti va bosqichlar bilan. */
export function medicineIntroMessage(pharmacyName: string, total: number): string {
  return [
    "💊 <b>Dori qo'shish</b>",
    "",
    `🏪 Dorixona: <b>${escapeHtml(pharmacyName)}</b>`,
    `📦 Hozirgi dorilar: <b>${total}</b> ta`,
    "",
    "<b>6 ta bosqich:</b>",
    "1️⃣ Rasm → 2️⃣ Nomi → 3️⃣ Turi → 4️⃣ Nima uchun → 5️⃣ Narx → 6️⃣ Tasdiqlash",
    "",
    "📸 Endi dorining rasmini yuboring.",
  ].join("\n");
}

/** Rasm qabul qilingach — nom so'raladi. */
export function photoReceivedMessage(): string {
  return [
    "✅ <b>Rasm qabul qilindi.</b>",
    "",
    "✍️ Endi dorining <b>nomini yozing</b>.",
    "",
    "Masalan: <i>Ridomil Gold</i>, <i>Ivermektin 1%</i>",
  ].join("\n");
}

export function askMedicinePhoto(): string {
  return [
    "💊 <b>Dorining rasmini yuboring.</b>",
    "",
    "Dorining qutisi yoki flakoni aniq ko'rinadigan qilib rasmga oling.",
    "Keyin nomini, turini va qo'llanishini kiritasiz.",
  ].join("\n");
}

export function askMedicineType(): string {
  return [
    "🧭 <b>Bu dori kim uchun?</b>",
    "",
    "Turi bo'yicha mijozlarga to'g'ri tavsiya beriladi:",
    "• 🌱 Ekin — o'simlik kasalliklari uchun",
    "• 🐄 Hayvon — chorva kasalliklari uchun",
    "• 📦 Umumiy — ikkalasi uchun ham",
  ].join("\n");
}

export function askMedicineUsage(): string {
  return [
    "🩺 <b>Bu dori nimaga yordam beradi?</b>",
    "",
    "Qisqacha yozing — mijoz tashxisdan keyin shu ma'lumotni ko'radi.",
    "",
    "Masalan: <i>kech piyozdog' va fitoftorozga qarshi</i>",
    "Yoki <i>/skip</i> yozib o'tkazib yuborishingiz mumkin.",
  ].join("\n");
}

export const MEDICINE_TYPE_LABELS: Record<string, string> = {
  crop: "🌱 Ekin/O'simlik",
  animal: "🐄 Hayvon",
  general: "📦 Umumiy",
};

/** Dori bosqichi indikatori: «📌 Bosqich 1/6 · Rasm ▰▱▱▱▱▱» ko'rinishida. */
export function medicineStepIndicator(step: "photo" | "name" | "type" | "usage" | "price" | "confirm"): string {
  const map = { photo: 1, name: 2, type: 3, usage: 4, price: 5, confirm: 6 } as const;
  const labels = { photo: "Rasm", name: "Nomi", type: "Turi", usage: "Nima uchun", price: "Narx", confirm: "Tasdiqlash" } as const;
  const n = map[step];
  const bar = "▰".repeat(n) + "▱".repeat(6 - n);
  return `📌 <b>Bosqich ${n}/6</b> ${bar} · ${labels[step]}`;
}

/** Kim uchun ekanini tanlash (dori turi). */
export const MEDICINE_TYPE_KEYBOARD: InlineKeyboard = {
  inline_keyboard: [
    [
      { text: "🌱 Ekin/O'simlik uchun", callback_data: "mt:crop" },
      { text: "🐄 Hayvon uchun", callback_data: "mt:animal" },
    ],
    [
      { text: "📦 Umumiy (ikkalasi uchun)", callback_data: "mt:general" },
      { text: "❌ Bekor qilish", callback_data: "m:no" },
    ],
  ],
};

/** Narx bosqichi: narxsiz saqlash imkoni ham bor. */
export const MEDICINE_PRICE_SKIP_KEYBOARD: InlineKeyboard = {
  inline_keyboard: [
    [{ text: "💰 Narxsiz saqlash", callback_data: "mp:skip" }],
    [{ text: "❌ Bekor qilish", callback_data: "m:no" }],
  ],
};

/** Narxni so'm ko'rinishida formatlaydi: 45000 → "45 000 so'm". */
export function formatSum(value: number): string {
  return `${value.toLocaleString("ru-RU").replace(/\u00a0/g, " ")} so'm`;
}

export function askMedicinePrice(): string {
  return [
    "💰 <b>Dorining narxini yozing (so'mda).</b>",
    "",
    "Faqat raqam: masalan <i>45000</i> yoki <i>45 000</i>",
    "Narx yozmasangiz — «💰 Narxsiz saqlash»ni bosing, keyin /dorilarim orqali",
    "qo'shishingiz mumkin.",
  ].join("\n");
}

export function invalidPriceMessage(): string {
  return [
    "❗️ Narx noto'g'ri. Faqat raqam yozing (masalan <i>45000</i>)",
    "yoki «💰 Narxsiz saqlash»ni bosing.",
  ].join("\n");
}

export function medicineConfirmCaption(
  name: string,
  pharmacyName?: string,
  typeLabel?: string,
  usage?: string | null,
  price?: number | null,
  stock?: number | null,
  stockUnit?: string,
): string {
  return [
    "🧾 <b>Tasdiqlash</b>",
    "",
    `💊 Dori nomi: <b>${escapeHtml(name)}</b>`,
    ...(typeLabel ? [`🧭 Turi: ${escapeHtml(typeLabel)}`] : []),
    ...(usage ? [`🩺 Nima uchun: ${escapeHtml(usage)}`] : []),
    ...(price ? [`💰 Narx: <b>${formatSum(price)}</b>`] : ["💰 Narx: kiritilmagan"]),
    `📦 Qoldiq miqdori: <b>${stock ?? 10} ${stockUnit ?? "dona"}</b>`,
    ...(pharmacyName ? [`🏪 Dorixona: ${escapeHtml(pharmacyName)}`] : []),
    "",
    "Tasdiqlasangiz, dori platformaga chiqadi va dehqon/chorvadorlar",
    "dori qidirganda yoki yaqin dorixonalarni ko'rganda dorixonangiz bilan ko'rsatiladi.",
  ].join("\n");
}

export function medicineNameTooShortMessage(): string {
  return [
    "❗️ Dori nomi juda qisqa.",
    "",
    "To'liq nomini yozing, masalan: <i>Ridomil Gold</i>",
  ].join("\n");
}

export function medicineSavedMessage(name: string, total: number, price?: number | null): string {
  return [
    "✅ <b>Dori qo'shildi!</b>",
    "",
    `💊 <b>${escapeHtml(name)}</b> — dorixonangiz ro'yxatida.`,
    ...(price ? [`💰 Narx: <b>${formatSum(price)}</b>`] : []),
    `📦 Jami dorilar: <b>${total}</b> ta`,
    "",
    "🧑‍🌾 Endi mijozlar dori qidirganda yoki yaqin dorixonalarni ko'rganda —",
    "dorixonangiz <b>manzili, telefon va doringiz bilan</b> ko'rsatiladi.",
  ].join("\n");
}

/** Dorixona egasi ro'yxatdan o'tgach — dori qo'shishga taklif. */
export function pharmacyNextStepMessage(): string {
  return [
    "💊 <b>Keyingi qadam: dorilaringizni qo'shing!</b>",
    "",
    "/dori_qoshish buyrug'i bilan har bir doringizning rasmi va nomini qo'shasiz.",
    "Dorilar mijozlarga platforma katalogida va xaritada to'g'ridan-to'g'ri ko'rinadi.",
  ].join("\n");
}

export function errorMessage(): string {
  return [
    "⚠️ <b>Xatolik yuz berdi.</b>",
    "",
    "Iltimos, bir ozdan so'ng <b>/start</b> yuboring yoki qaytadan urinib ko'ring.",
  ].join("\n");
}

export function invalidPhoneMessage(): string {
  return [
    "❗️ Telefon raqam noto'g'ri ko'rinishda.",
    "",
    "Iltimos, pastdagi tugma orqali yuboring yoki <code>+998XXXXXXXXX</code>",
    "formatida yozing.",
  ].join("\n");
}

/** Telefon raqam boshqa profilga band bo'lsa. */
export function phoneTakenMessage(ownerName: string, ownerRole: string): string {
  const roleLabel = ownerRole === "pharmacy" ? "dorixona egasi" : "mutaxassis";
  return [
    "❗️ <b>Bu telefon raqam allaqachon band.</b>",
    "",
    `Raqam <b>${escapeHtml(ownerName)}</b> (${roleLabel}) profiliga ulangan.`,
    "",
    "Bir raqam — bitta profil. Agar bu sizning profilingiz bo'lsa, o'sha Telegram",
    "hisobidan kiring yoki boshqa raqam yuboring.",
  ].join("\n");
}

export function invalidLocationMessage(): string {
  return [
    "❗️ Lokatsiya qabul qilinmadi.",
    "",
    "Iltimos, pastdagi <b>«📍 Lokatsiyani yuborish»</b> tugmasini bosing.",
  ].join("\n");
}

/** Auth botda xaridor mini-ilovalari ko'rsatilmaydi. */
export function appKeyboard(): InlineKeyboard | undefined {
  return undefined;
}
