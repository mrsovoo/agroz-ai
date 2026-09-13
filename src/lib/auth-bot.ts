/**
 * `@agroz_auth_bot` — mutaxassislar va dorixona egalarini ro'yxatdan o'tkazuvchi bot.
 *
 * Asosiy `TELEGRAM_BOT_TOKEN`dan (kirish/OTP uchun) ajratilgan: bu bot faqat
 * ro'yxatdan o'tkazish va profil yangilash bilan shug'ullanadi. Shuning uchun
 * token ham alohida — `TELEGRAM_AUTH_BOT_TOKEN`.
 */

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

export function authBotToken(): string | null {
  const token = process.env.TELEGRAM_AUTH_BOT_TOKEN?.trim();
  return token ? token : null;
}

export function isAuthBotConfigured(): boolean {
  return authBotToken() !== null;
}

export async function callAuthBot<T>(
  method: string,
  payload?: Record<string, unknown>,
): Promise<T | null> {
  const token = authBotToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {}),
      cache: "no-store",
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
  const replyMarkup = options?.replyKeyboard ?? options?.inline;
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
      { text: "🌱 Agronom", callback_data: "sp:Agronom" },
      { text: "🐄 Veterinar", callback_data: "sp:Veterinar" },
    ],
    [
      { text: "🐑 Zootexnik", callback_data: "sp:Zootexnik" },
      { text: "🌳 Bog'bon", callback_data: "sp:Bog'bon" },
    ],
    [{ text: "✍️ Boshqa (o'zim yozaman)", callback_data: "sp:__other__" }],
  ],
};

export const PHARMACY_TYPE_KEYBOARD: InlineKeyboard = {
  inline_keyboard: [
    [
      { text: "🌾 Agro dorixona", callback_data: "pt:agro" },
      { text: "🩺 Vet dorixona", callback_data: "pt:vet" },
    ],
  ],
};

/** Dorini tasdiqlash yoki bekor qilish. */
export const MEDICINE_CONFIRM_KEYBOARD: InlineKeyboard = {
  inline_keyboard: [
    [{ text: "✅ Tasdiqlash", callback_data: "m:ok" }],
    [{ text: "❌ Bekor qilish", callback_data: "m:no" }],
  ],
};

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

export function askName(): string {
  return [
    "✍️ <b>Ism va familiyangizni yozing.</b>",
    "",
    "Masalan: <i>Alisher Qodirov</i>",
  ].join("\n");
}

export function askPhone(): string {
  return [
    "📱 <b>Telefon raqamingizni yuboring.</b>",
    "",
    "Pastdagi <b>«📱 Telefon raqamni yuborish»</b> tugmasini bosing yoki raqamni",
    "qo'lda yozing (masalan: <code>+998901234567</code>).",
    "",
    "❗️ Raqam boshqa foydalanuvchilarga ko'rinadi — mijozlar siz bilan shu orqali",
    "bog'lanadi.",
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
  return ["🧑‍🎓 <b>Mutaxassisligingizni tanlang</b> yoki «Boshqa»ni bosib o'zingiz yozing."].join(
    "\n",
  );
}

export function askSpecialtyText(): string {
  return [
    "✍️ <b>Mutaxassisligingizni yozing.</b>",
    "",
    "Masalan: <i>Agronom-entomolog</i>, <i>Sut mahsulotlari bo'yicha veterinar</i>",
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
  return ["🌾 <b>Dorixona turini tanlang.</b>", "", "Agro (o'simlik) yoki veterinariya?"].join(
    "\n",
  );
}

export function askWorkHours(): string {
  return [
    "🕘 <b>Ish vaqtini yozing.</b>",
    "",
    "Masalan: <i>09:00 - 18:00</i> yoki <i>24/7</i>",
  ].join("\n");
}

export function confirmSummary(data: {
  role: string;
  name: string;
  phone: string;
  address: string;
  specialty: string | null;
  organization: string | null;
  lat: number;
  lng: number;
  workHours: string | null;
}): string {
  const roleLabel = data.role === "pharmacy" ? "🏪 Dorixona egasi" : "👨‍🌾 Mutaxassis";
  const rows = [
    "🧾 <b>Ma'lumotlarni tekshiring</b>",
    "",
    `<b>Turi:</b> ${roleLabel}`,
    `<b>Ism:</b> ${escapeHtml(data.name)}`,
    `<b>Telefon:</b> ${escapeHtml(data.phone)}`,
  ];
  if (data.organization) rows.push(`<b>Dorixona:</b> ${escapeHtml(data.organization)}`);
  if (data.specialty) rows.push(`<b>Mutaxassislik:</b> ${escapeHtml(data.specialty)}`);
  rows.push(
    `<b>Manzil:</b> ${escapeHtml(data.address)}`,
    `<b>Ish vaqti:</b> ${escapeHtml(data.workHours ?? "09:00 - 18:00")}`,
    `<b>Lokatsiya:</b> ${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`,
    "",
    "Hammasi to'g'rimi?",
  );
  return rows.join("\n");
}

export function savedMessage(name: string): string {
  return [
    "✅ <b>Ro'yxatdan muvaffaqiyatli o'tdingiz!</b>",
    "",
    `${escapeHtml(name)}, siz endi <b>Agroz AI</b> platformasida ko'rinasiz.`,
    "5 km ichidagi mijozlar sizni xaritada topa oladi va telefon orqali bog'lanadi.",
    "",
    "Ma'lumotlarni istagan vaqtda <b>/royxatdan_otish</b> orqali yangilashingiz mumkin.",
  ].join("\n");
}

export function profileMessage(s: {
  name: string;
  phone: string;
  role: string;
  specialty: string | null;
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
  rows.push(
    `<b>Manzil:</b> ${escapeHtml(s.address)}`,
    `<b>Ish vaqti:</b> ${escapeHtml(s.workHours ?? "09:00 - 18:00")}`,
    `<b>Lokatsiya:</b> ${s.lat.toFixed(5)}, ${s.lng.toFixed(5)}`,
    "",
    "Yangilash uchun: <b>/royxatdan_otish</b>",
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
    "/malumotlarim — profilingizni ko'rish",
    "/bekor — jarayonni to'xtatish",
    "/yordam — shu yordam xabari",
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

export function onlyPharmacyMessage(): string {
  return [
    "ℹ️ Bu bo'lim faqat <b>dorixona egalari</b> uchun.",
    "",
    "Ro'yxatdan o'tishda «🏪 Dorixona egasiman»ni tanlang.",
  ].join("\n");
}

export function askMedicinePhoto(): string {
  return [
    "💊 <b>Dorining rasmini yuboring.</b>",
    "",
    "Dorining qutisi yoki flakoni aniq ko'rinadigan qilib rasmga oling.",
    "Keyin nomini yozasiz va tasdiqlaysiz.",
  ].join("\n");
}

export function askMedicineName(): string {
  return [
    "✍️ <b>Dorining nomini yozing.</b>",
    "",
    "Masalan: <i>Ridomil Gold</i>, <i>Ivermektin 1%</i>",
  ].join("\n");
}

export function medicineConfirmCaption(name: string): string {
  return [
    "💊 <b>Shu dorini qo'shamizmi?</b>",
    "",
    `Nomi: <b>${escapeHtml(name)}</b>`,
    "",
    "Tasdiqlasangiz, dori platformaga qo'shiladi va tashxis bo'yicha",
    "tavsiya qilinganda ko'rinadi.",
  ].join("\n");
}

export function medicineSavedMessage(name: string, total: number): string {
  return [
    "✅ <b>Dori qo'shildi!</b>",
    "",
    `<b>${escapeHtml(name)}</b> dorixonangiz ro'yxatiga kirdi.`,
    `Jami dorilar: <b>${total}</b> ta.`,
    "",
    "Yana qo'shish uchun: <b>/dori_qoshish</b>",
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

export function invalidLocationMessage(): string {
  return [
    "❗️ Lokatsiya qabul qilinmadi.",
    "",
    "Iltimos, pastdagi <b>«📍 Lokatsiyani yuborish»</b> tugmasini bosing.",
  ].join("\n");
}

/** Ro'yxatdan o'tganlarga Mini Appni ochish uchun tugma. */
export function appKeyboard(): InlineKeyboard | undefined {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/+$/, "");
  if (!raw) return undefined;
  const rows: InlineKeyboard["inline_keyboard"] = [];
  rows.push([{ text: "🗺 Mutaxassislar xaritasi", url: `${raw}/mutaxassislar` }]);
  return { inline_keyboard: rows };
}
