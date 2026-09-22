/**
 * `@agroz_auth_bot` suhbati: mutaxassis / dorixona egasini bosqichma-bosqich
 * ro'yxatdan o'tkazish.
 *
 * Holat bazada (`bot_states`) saqlanadi — serverless muhitda xotira saqlanmaydi,
 * shuning uchun har bir update holatni o'qib, keyin yangilab boradi.
 */

import { db } from "@/db";
import { botStates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cleanText, normalizePhone } from "@/lib/validate";
import {
  addMedicine,
  countMedicines,
  deleteMedicine,
  deleteSpecialist,
  findPhoneOwner,
  getSpecialistByTelegramId,
  isSpecialistRole,
  listMedicines,
  setMedicinePrice,
  setMedicineStatus,
  upsertSpecialist,
  type SpecialistRole,
} from "@/lib/specialists";
import {
  PHARMACY_TYPE_KEYBOARD,
  SPECIALTY_KEYBOARD,
  ADDRESS_CONFIRM_KEYBOARD,
  CONFIRM_KEYBOARD,
  MEDICINE_CONFIRM_KEYBOARD,
  MEDICINE_CANCEL_KEYBOARD,
  MEDICINE_DONE_KEYBOARD,
  MEDICINE_TYPE_KEYBOARD,
  MEDICINE_TYPE_LABELS,
  formatSum,
  NEXT_STEP_KEYBOARD,
  ROLE_KEYBOARD,
  answerCallbackQuery,
  appKeyboard,
  askAddress,
  askAddressConfirm,
  askLocation,
  askEducation,
  askExperience,
  EXPERIENCE_KEYBOARD,
  askBio,
  askHelpsWith,
  HELPS_WITH_KEYBOARD,
  askMedicinePhoto,
  askMedicinePrice,
  askMedicineType,
  askMedicineUsage,
  askWorkHours,
  WORK_HOURS_KEYBOARD,
  invalidPriceMessage,
  medicineManageKeyboard,
  medicineManageMessage,
  MEDICINE_PRICE_CANCEL_KEYBOARD,
  MEDICINE_PRICE_SKIP_KEYBOARD,
  phoneTakenMessage,
  askName,
  askOrganization,
  askPharmacyType,
  askPhone,
  askSpecialty,
  askSpecialtyText,
  cancelMessage,
  clearReplyKeyboard,
  confirmSummary,
  contactKeyboard,
  errorMessage,
  helpMessage,
  invalidLocationMessage,
  invalidPhoneMessage,
  locationKeyboard,
  medicineConfirmCaption,
  medicineNameTooShortMessage,
  medicineStepIndicator,
  medicineIntroMessage,
  photoReceivedMessage,
  pharmacyNextStepMessage,
  medicineSavedMessage,
  medicineDeletedMessage,
  medicinesListMessage,
  medicinesListKeyboard,
  noMedicinesMessage,
  profileDeletedMessage,
  profileDeleteCanceledMessage,
  askProfileDelete,
  PROFILE_DELETE_KEYBOARD,
  needRegistrationMessage,
  onlyPharmacyMessage,
  profileMessage,
  roleQuestion,
  savedMessage,
  sendAuthMessage,
  sendAuthPhoto,
  welcomeMessage,
  escapeHtml,
} from "@/lib/auth-bot";
import { reverseGeocode } from "@/lib/geocode";
import { getNewsFeed } from "@/lib/news";

export type AuthBotUpdate = {
  message?: {
    message_id?: number;
    text?: string;
    chat?: { id?: number; type?: string };
    from?: { id?: number; first_name?: string; last_name?: string; username?: string };
    contact?: { phone_number?: string; user_id?: number; first_name?: string };
    location?: { latitude?: number; longitude?: number };
    photo?: { file_id?: string; width?: number; height?: number }[];
  };
  callback_query?: {
    id: string;
    data?: string;
    from?: { id?: number; first_name?: string };
    message?: { chat?: { id?: number } };
  };
};

type Step =
  | "role"
  | "name"
  | "phone"
  | "location"
  | "address"
  | "address_confirm"
  | "specialty"
  | "specialty_text"
  | "organization"
  | "pharmacy_type"
  | "helps_with"
  | "education"
  | "experience"
  | "bio"
  | "confirm"
  // Ro'yxatdan o'tish: ish vaqti (mijozga ko'rinadi).
  | "work_hours"
  // Dorixona uchun dori qo'shish oqimi (6 bosqich).
  | "med_photo"
  | "med_name"
  | "med_type"
  | "med_usage"
  | "med_price"
  | "med_confirm"
  // /dorilarim → bitta dorining narxini o'zgartirish.
  | "med_price_edit";

type Draft = {
  role?: SpecialistRole;
  name?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  address?: string;
  specialty?: string;
  organization?: string;
  /** crop | animal | both — kimga yordam beradi (mutaxassis). */
  helpsWith?: "crop" | "animal" | "both";
  education?: string;
  experienceYears?: number;
  bio?: string;
  /** Ish vaqti — masalan "09:00 - 18:00" yoki "24/7". */
  workHours?: string;
  /** Dori qo'shish uchun vaqtinchalik maydonlar. */
  medPhotoFileId?: string;
  /** Normallashtirilgan rasm (1080×1450 JPEG, base64) — saqlashda bazaga yoziladi. */
  medPhotoBase64?: string;
  medName?: string;
  /** crop | animal | general */
  medType?: string;
  medUsage?: string;
  /** Narx so'mda (ixtiyoriy). */
  medPrice?: number;
  /** /dorilarim → narxini o'zgartirayotgan dori id'si. */
  editingPriceFor?: number;
};

type StateRow = typeof botStates.$inferSelect;

// ---------------------------------------------------------------------------
// Holat (state) bilan ishlash
// ---------------------------------------------------------------------------

function parseDraft(raw: string | null): Draft {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Draft) : {};
  } catch {
    return {};
  }
}

async function getState(telegramId: number): Promise<{ step: Step; draft: Draft } | null> {
  const rows = await db.select().from(botStates).where(eq(botStates.telegramId, telegramId)).limit(1);
  const row: StateRow | undefined = rows[0];
  if (!row) return null;
  return { step: row.step as Step, draft: parseDraft(row.data) };
}

async function setState(telegramId: number, step: Step, draft: Draft): Promise<void> {
  const values = {
    telegramId,
    flow: "auth",
    step,
    data: JSON.stringify(draft),
    updatedAt: new Date(),
  };
  await db
    .insert(botStates)
    .values(values)
    .onConflictDoUpdate({ target: botStates.telegramId, set: values });
}

async function clearState(telegramId: number): Promise<void> {
  await db.delete(botStates).where(eq(botStates.telegramId, telegramId));
}

// ---------------------------------------------------------------------------
// Kirish nuqtasi
// ---------------------------------------------------------------------------

export async function handleAuthBotUpdate(update: AuthBotUpdate): Promise<void> {
  if (update.callback_query) {
    await handleCallback(update.callback_query);
    return;
  }
  const message = update.message;
  const chatId = message?.chat?.id;
  if (!chatId) return;

  const telegramId = message?.from?.id ?? chatId;
  const firstName = message?.from?.first_name;
  const text = message?.text?.trim() ?? "";

  try {
    // 1) Kontakt (telefon) — faqat telefon bosqichida qabul qilinadi.
    if (message?.contact) {
      await handleContact(chatId, telegramId, message.contact.phone_number);
      return;
    }

    // 2) Lokatsiya — faqat lokatsiya bosqichida.
    if (message?.location) {
      await handleLocation(chatId, telegramId, message.location.latitude, message.location.longitude);
      return;
    }

    // 2b) Dori rasmi — dorixona egasi dori qo'shayotganda.
    if (message?.photo && message.photo.length > 0) {
      await handleMedicinePhoto(chatId, telegramId, message.photo);
      return;
    }

    // 3) Buyruqlar.
    if (text.startsWith("/")) {
      await handleCommand(chatId, telegramId, firstName, text);
      return;
    }

    // 4) Bosqichga qarab matn kutiladi.
    const state = await getState(telegramId);
    if (!state) {
      await sendAuthMessage(chatId, helpMessage(), { inline: NEXT_STEP_KEYBOARD });
      return;
    }
    await handleText(chatId, telegramId, state.step, state.draft, text);
  } catch (err) {
    console.error("[auth-bot] update xatosi:", err);
    await sendAuthMessage(chatId, errorMessage());
  }
}

async function handleCommand(
  chatId: number,
  telegramId: number,
  firstName: string | undefined,
  text: string,
): Promise<void> {
  const command = text.split(/\s+/)[0].split("@")[0];

  if (command === "/royxatdan_otish") {
    await startRegistration(chatId, telegramId);
    return;
  }

  if (command === "/dori_qoshish") {
    await startMedicineAdd(chatId, telegramId);
    return;
  }

  if (command === "/malumotlarim") {
    const profile = await getSpecialistByTelegramId(telegramId);
    if (!profile) {
      await sendAuthMessage(chatId, welcomeMessage(firstName), { inline: NEXT_STEP_KEYBOARD });
      return;
    }
    await sendAuthMessage(chatId, profileMessage(profile), { inline: appKeyboard() });
    return;
  }

  // Profil o'chirish — tasdiqlash bilan.
  if (command === "/profilni_ochirish") {
    const profile = await getSpecialistByTelegramId(telegramId);
    if (!profile) {
      await sendAuthMessage(chatId, needRegistrationMessage(), { inline: NEXT_STEP_KEYBOARD });
      return;
    }
    await sendAuthMessage(chatId, askProfileDelete(profile.name, profile.role), {
      inline: PROFILE_DELETE_KEYBOARD,
    });
    return;
  }

  // /buyurtmalar — dorixona egasiga kelgan buyurtmalar ro'yxati.
  if (command === "/buyurtmalar") {
    const { listOrders } = await import("@/lib/orders");
    const { ordersListKeyboard, ordersEmptyMessage, ordersHintMessage } = await import("@/lib/orders-bot");
    const profile = await getSpecialistByTelegramId(telegramId);
    if (!profile) {
      await sendAuthMessage(chatId, needRegistrationMessage(), { inline: NEXT_STEP_KEYBOARD });
      return;
    }
    if (profile.role !== "pharmacy") {
      await sendAuthMessage(chatId, onlyPharmacyMessage(profile.role));
      return;
    }
    const orders = await listOrders({ pharmacySpecialistId: profile.id, limit: 20 });
    if (orders.length === 0) {
      await sendAuthMessage(chatId, ordersEmptyMessage());
      return;
    }
    await sendAuthMessage(chatId, ordersHintMessage(orders.length), {
      inline: ordersListKeyboard(orders),
    });
    return;
  }

  // Dorilar ro'yxati va o'chirish (faqat dorixona egasi).
  if (command === "/dorilarim") {
    const data = await listMedicines(telegramId);
    if (!data) {
      await sendAuthMessage(chatId, needRegistrationMessage(), { inline: NEXT_STEP_KEYBOARD });
      return;
    }
    if (data.profile.role !== "pharmacy") {
      await sendAuthMessage(chatId, onlyPharmacyMessage(data.profile.role));
      return;
    }
    if (data.medicines.length === 0) {
      await sendAuthMessage(chatId, noMedicinesMessage());
      return;
    }
    await sendAuthMessage(chatId, medicinesListMessage(data.medicines), {
      inline: medicinesListKeyboard(data.medicines),
    });
    return;
  }

  if (command === "/bekor") {
    await clearState(telegramId);
    await sendAuthMessage(chatId, cancelMessage());
    return;
  }

  if (command === "/yordam" || command === "/help") {
    await sendAuthMessage(chatId, helpMessage());
    return;
  }

  // /yangiliklar — real manbalardan agro/chorvachilik yangiliklari.
  if (command === "/yangiliklar") {
    try {
      const items = await getNewsFeed(6);
      if (items.length === 0) {
        await sendAuthMessage(
          chatId,
          "📰 Hozircha yangiliklar topilmadi. Birozdan so'ng qayta urinib ko'ring.",
        );
        return;
      }
      const lines = ["📰 <b>Agro va chorvachilik yangiliklari</b>", ""];
      items.forEach((n, i) => {
        const date = new Date(n.publishedAt);
        const dateStr = Number.isFinite(date.getTime())
          ? ` · ${date.getMonth() + 1}.${date.getDate()}`
          : "";
        lines.push(
          `${i + 1}. <b>${escapeHtml(n.title.slice(0, 140))}</b>`,
          `   ${escapeHtml(n.source)}${dateStr} · ${n.tag}`,
        );
        if (n.link) lines.push(`   ${n.link}`);
        lines.push("");
      });
      lines.push("🔄 Manbalar: AgroWorld, EastFruit, Kun.uz, Gazeta.uz");
      await sendAuthMessage(chatId, lines.join("\n"));
    } catch (newsErr) {
      console.error("[auth-bot] yangiliklar xatosi:", newsErr);
      await sendAuthMessage(
        chatId,
        "⚠️ Yangiliklarni olishda xatolik. Birozdan so'ng qayta urinib ko'ring.",
      );
    }
    return;
  }

  // /start va boshqa har qanday buyruq.
  const profile = await getSpecialistByTelegramId(telegramId);
  await sendAuthMessage(chatId, welcomeMessage(firstName, Boolean(profile)), {
    inline: profile ? appKeyboard() ?? NEXT_STEP_KEYBOARD : NEXT_STEP_KEYBOARD,
  });
}

async function startRegistration(chatId: number, telegramId: number): Promise<void> {
  await clearState(telegramId);
  // Mavjud profil bo'lsa — ma'lumotlarni oldindan to'ldiramiz: foydalanuvchi
  // faqat o'zgartirmoqchi bo'lgan maydonni qayta yozadi.
  const existing = await getSpecialistByTelegramId(telegramId);
  const draft: Draft = existing
    ? {
        role: existing.role === "pharmacy" ? "pharmacy" : "specialist",
        name: existing.name,
        phone: existing.phone,
        lat: existing.lat,
        lng: existing.lng,
        address: existing.address,
        specialty: existing.specialty ?? undefined,
        organization: existing.organization ?? undefined,
        helpsWith: (existing.helpsWith as Draft["helpsWith"]) ?? "both",
        education: existing.education ?? undefined,
        experienceYears: existing.experienceYears ?? undefined,
        bio: existing.bio ?? undefined,
        workHours: existing.workHours ?? undefined,
      }
    : {};
  await setState(telegramId, "role", draft);
  await sendAuthMessage(
    chatId,
    existing
      ? `${roleQuestion()}\n\n<i>Ma'lumotlaringiz saqlangan — tasdiqlasangiz shu qoldi.</i>`
      : roleQuestion(),
    { inline: ROLE_KEYBOARD },
  );
}

/**
 * Dorixona egasi dori qo'shishni boshlaydi (faqat role=pharmacy uchun).
 * Har bir etap aniq ko'rsatiladi: 1/3 rasm → 2/3 nom → 3/3 tasdiqlash.
 */
async function startMedicineAdd(chatId: number, telegramId: number): Promise<void> {
  const profile = await getSpecialistByTelegramId(telegramId);
  if (!profile) {
    await sendAuthMessage(chatId, needRegistrationMessage(), { inline: NEXT_STEP_KEYBOARD });
    return;
  }
  if (profile.role !== "pharmacy") {
    await sendAuthMessage(chatId, onlyPharmacyMessage(profile.role));
    return;
  }
  await clearState(telegramId);
  await setState(telegramId, "med_photo", {});
  await sendAuthMessage(
    chatId,
    medicineIntroMessage(profile.organization ?? profile.name, await countMedicines(profile.id)),
  );
}

/** Dori jarayonini bekor qilib, boshlash uchun taklif bilan qaytadi. */
async function cancelMedicineFlow(chatId: number, telegramId: number): Promise<void> {
  await clearState(telegramId);
  await sendAuthMessage(chatId, cancelMessage(), { inline: NEXT_STEP_KEYBOARD });
}

// ---------------------------------------------------------------------------
// Callback (tugmalar)
// ---------------------------------------------------------------------------

async function handleCallback(query: NonNullable<AuthBotUpdate["callback_query"]>): Promise<void> {
  const chatId = query.message?.chat?.id;
  const telegramId = query.from?.id;
  const data = query.data ?? "";
  if (!chatId || !telegramId) {
    await answerCallbackQuery(query.id);
    return;
  }

  try {
    if (data === "r:start") {
      await answerCallbackQuery(query.id);
      await startRegistration(chatId, telegramId);
      return;
    }

    const state = await getState(telegramId);
    if (!state) {
      await answerCallbackQuery(query.id, "Jarayon topilmadi. /royxatdan_otish yuboring.");
      return;
    }
    let { step, draft } = state;

    // Rol tanlash.
    if (data === "r:s" || data === "r:p") {
      draft.role = data === "r:p" ? "pharmacy" : "specialist";
      step = "name";
      await setState(telegramId, step, draft);
      await answerCallbackQuery(query.id);
      // Prefill — yangi yozilsa o'zgaradi, tasdiqlash uchun eski nom ko'rsatiladi.
      await sendAuthMessage(chatId, draft.name ? askName(draft.name) : askName());
      return;
    }

    // Mutaxassislik tanlash.
    if (data.startsWith("sp:")) {
      const value = data.slice(3);
      if (value === "__other__") {
        step = "specialty_text";
        await setState(telegramId, step, draft);
        await answerCallbackQuery(query.id);
        await clearReplyKeyboard(chatId, askSpecialtyText());
        return;
      }
      draft.specialty = value.slice(0, 160);
      // Mutaxassis uchun keyingi bosqich — kimga yordam beradi.
      step = "helps_with";
      await setState(telegramId, step, draft);
      await answerCallbackQuery(query.id);
      await sendAuthMessage(chatId, askHelpsWith(), { inline: HELPS_WITH_KEYBOARD });
      return;
    }

    // Dori turi tanlandi (mt:crop | mt:animal | mt:general).
    if (data.startsWith("mt:")) {
      const value = data.slice(3);
      if (value !== "crop" && value !== "animal" && value !== "general") {
        await answerCallbackQuery(query.id);
        return;
      }
      draft.medType = value;
      await setState(telegramId, "med_usage", draft);
      await answerCallbackQuery(query.id);
      await sendAuthMessage(
        chatId,
        `${medicineStepIndicator("usage")}\n\n${askMedicineUsage()}`,
        { inline: MEDICINE_CANCEL_KEYBOARD },
      );
      return;
    }

    // Tasdiqlashda narx bosqichidan o'tgan bo'lishi kerak — m:ok to'g'ridan-to'g'ri ishlaydi.

    // Dorini tasdiqlash / qayta boshlash / bekor qilish / yana qo'shish.
    if (data === "m:ok") {
      await answerCallbackQuery(query.id);
      const saved = await saveMedicine(telegramId, draft);
      if (!saved) {
        await sendAuthMessage(chatId, needRegistrationMessage(), { inline: NEXT_STEP_KEYBOARD });
        return;
      }
      const savedProfile = await getSpecialistByTelegramId(telegramId);
      await clearState(telegramId);
      await sendAuthMessage(chatId, medicineSavedMessage(saved.name, saved.total, saved.price), {
        inline: {
          inline_keyboard: [
            [{ text: "➕ Yana dori qo'shish", callback_data: "m:again" }],
            ...(savedProfile
              ? appKeyboard()?.inline_keyboard ?? []
              : []),
          ],
        },
      });
      return;
    }

    // Tasdiqlashda xato bo'lsa — boshidan qayta boshlash taklifi.
    if (data === "m:restart") {
      await answerCallbackQuery(query.id);
      await startMedicineAdd(chatId, telegramId);
      return;
    }

    // Saqlagandan keyin «Yana dori qo'shish».
    if (data === "m:again") {
      await answerCallbackQuery(query.id);
      await startMedicineAdd(chatId, telegramId);
      return;
    }

    // Saqlagandan keyin «Profilimni ko'rish».
    if (data === "m:profile") {
      await answerCallbackQuery(query.id);
      const profile = await getSpecialistByTelegramId(telegramId);
      if (profile) {
        await sendAuthMessage(chatId, profileMessage(profile), { inline: appKeyboard() });
      }
      return;
    }

    if (data === "m:no") {
      await answerCallbackQuery(query.id);
      await cancelMedicineFlow(chatId, telegramId);
      return;
    }

    // Lokatsiyadan avtomatik topilgan manzilni tasdiqlash.
    if (data === "ad:ok") {
      if (!draft.address) {
        await setState(telegramId, "address", draft);
        await answerCallbackQuery(query.id);
        await sendAuthMessage(chatId, askAddress());
        return;
      }
      await answerCallbackQuery(query.id);
      await advanceAfterAddress(chatId, telegramId, draft);
      return;
    }

    // Foydalanuvchi manzilni qo'lda yozishni tanladi.
    if (data === "ad:edit") {
      delete draft.address;
      await setState(telegramId, "address", draft);
      await answerCallbackQuery(query.id);
      await sendAuthMessage(chatId, askAddress());
      return;
    }

    // Dorixona turi: agro | vet | general (umumiy — ikkala turdagi dorilar ham).
    if (data.startsWith("pt:")) {
      const value = data.slice(3);
      draft.specialty =
        value === "vet" ? "Vet dorixona" : value === "general" ? "Umumiy dorixona" : "Agro dorixona";
      // Dorixona uchun keyingi bosqich — ish vaqti, so'ng tasdiqlash.
      step = "work_hours";
      await setState(telegramId, step, draft);
      await answerCallbackQuery(query.id);
      await sendAuthMessage(chatId, askWorkHours(draft.workHours), { inline: WORK_HOURS_KEYBOARD });
      return;
    }

    // Kimga yordam beradi (mutaxassis): hw:crop | hw:animal | hw:both.
    if (data.startsWith("hw:")) {
      const value = data.slice(3);
      if (value !== "crop" && value !== "animal" && value !== "both") {
        await answerCallbackQuery(query.id);
        return;
      }
      draft.helpsWith = value;
      step = "education";
      await setState(telegramId, step, draft);
      await answerCallbackQuery(query.id);
      await sendAuthMessage(chatId, askEducation());
      return;
    }

    // Tajriba yillari inline tugmasi: exp:2 | exp:4 | exp:7 | exp:12 | exp:skip
    if (data.startsWith("exp:")) {
      const val = data.slice(4);
      if (val === "skip") {
        delete draft.experienceYears;
      } else {
        const y = Number(val);
        if (Number.isFinite(y)) draft.experienceYears = y;
      }
      step = "bio";
      await setState(telegramId, step, draft);
      await answerCallbackQuery(query.id);
      await sendAuthMessage(chatId, askBio());
      return;
    }

    // Ish vaqti tanlanganda yoki o'tkazib yuborilganda: wh:08:00 - 18:00 | wh:09:00 - 20:00 | wh:24/7 | wh:skip
    if (data.startsWith("wh:")) {
      const val = data.slice(3);
      if (val === "skip") {
        delete draft.workHours;
      } else {
        draft.workHours = val;
      }
      await setState(telegramId, "confirm", draft);
      await answerCallbackQuery(query.id);
      await sendSummary(chatId, telegramId, draft);
      return;
    }

    // Dori narxini kiritmasdan davom etish.
    if (data === "mp:skip") {
      delete draft.medPrice;
      await setState(telegramId, "med_confirm", draft);
      await answerCallbackQuery(query.id);
      await sendMedicineConfirm(chatId, draft);
      return;
    }

    // /dorilarim → dori boshqaruvi oynasi (mm:<id>).
    if (data.startsWith("mm:")) {
      await answerCallbackQuery(query.id);
      const medId = Number(data.slice(3));
      if (!Number.isSafeInteger(medId)) return;
      const data2 = await listMedicines(telegramId);
      const med = data2?.medicines.find((m) => m.id === medId);
      if (!data2 || !med) {
        await sendAuthMessage(chatId, errorMessage());
        return;
      }
      await sendAuthMessage(chatId, medicineManageMessage(med), {
        inline: medicineManageKeyboard(med),
      });
      return;
    }

    // /dorilarim → ro'yxatga qaytish.
    if (data === "m:list") {
      await answerCallbackQuery(query.id);
      const data2 = await listMedicines(telegramId);
      if (!data2 || data2.medicines.length === 0) {
        await sendAuthMessage(chatId, noMedicinesMessage());
        return;
      }
      await sendAuthMessage(chatId, medicinesListMessage(data2.medicines), {
        inline: medicinesListKeyboard(data2.medicines),
      });
      return;
    }

    // /dorilarim → bor/yoq statusini almashtirish (ms:<id>:bor|yoq).
    if (data.startsWith("ms:")) {
      await answerCallbackQuery(query.id);
      const [, idPart, statusPart] = data.split(":");
      const medId = Number(idPart);
      const status = statusPart === "yoq" ? "yoq" : "bor";
      if (!Number.isSafeInteger(medId)) return;
      const ok = await setMedicineStatus(telegramId, medId, status);
      if (!ok) {
        await sendAuthMessage(chatId, errorMessage());
        return;
      }
      const data2 = await listMedicines(telegramId);
      const med = data2?.medicines.find((m) => m.id === medId);
      if (med) {
        await sendAuthMessage(chatId, medicineManageMessage(med), {
          inline: medicineManageKeyboard(med),
        });
      }
      return;
    }

    // /dorilarim → narxni o'zgartirish rejimi (mp:set:<id>).
    if (data.startsWith("mp:set:")) {
      const medId = Number(data.slice("mp:set:".length));
      if (!Number.isSafeInteger(medId)) {
        await answerCallbackQuery(query.id);
        return;
      }
      const data2 = await listMedicines(telegramId);
      const med = data2?.medicines.find((m) => m.id === medId);
      if (!data2 || !med) {
        await answerCallbackQuery(query.id);
        await sendAuthMessage(chatId, errorMessage());
        return;
      }
      draft.editingPriceFor = medId;
      await setState(telegramId, "med_price_edit", draft);
      await answerCallbackQuery(query.id);
      await sendAuthMessage(
        chatId,
        `💰 <b>${escapeHtml(med.name)}</b> uchun yangi narxni yozing (so'mda).\n\nMasalan: <i>45000</i>\nNarxni olib tashlash uchun <i>/skip</i> yozing.`,
        { inline: MEDICINE_PRICE_CANCEL_KEYBOARD },
      );
      return;
    }

    if (data === "c:ok") {
      await answerCallbackQuery(query.id);
      const saved = await saveDraft(telegramId, draft);
      if (!saved) {
        await sendAuthMessage(chatId, errorMessage());
        return;
      }
      await clearState(telegramId);
      // Dorixona egasi bo'lsa — keyingi qadam sifatida dori qo'shish taklif qilinadi.
      const isPharmacy = saved.role === "pharmacy";
      await sendAuthMessage(chatId, savedMessage(saved.name, saved.role), {
        inline: {
          inline_keyboard: [
            ...(isPharmacy ? [[{ text: "💊 Dorilar qo'shish", callback_data: "m:start" }]] : []),
            [{ text: "👤 Mening profilim", callback_data: "m:profile" }],
            ...(appKeyboard()?.inline_keyboard ?? []),
          ],
        },
      });
      return;
    }

    // Ro'yxatdan o'tishdan keyingi «Dorilar qo'shish» tugmasi.
    if (data === "m:start") {
      await answerCallbackQuery(query.id);
      await startMedicineAdd(chatId, telegramId);
      return;
    }

    // Buyurtma ko'rish / holat o'zgartirish (o:view:<id>, o:confirm:<id>, o:cancel:<id>, o:done:<id>).
    if (data.startsWith("o:")) {
      await answerCallbackQuery(query.id);
      const [, action, idPart] = data.split(":");
      const orderId = Number(idPart);
      if (!Number.isSafeInteger(orderId)) return;

      const { listOrders, setOrderStatus } = await import("@/lib/orders");
      const { orderMessage, orderActionsKeyboard } = await import("@/lib/orders-bot");

      if (action === "view") {
        const orders = await listOrders({ orderId });
        const order = orders[0];
        if (!order) {
          await sendAuthMessage(chatId, errorMessage());
          return;
        }
        // Faqat shu dorixona egasi ko'ra oladi.
        const profile = await getSpecialistByTelegramId(telegramId);
        if (!profile || order.customerName === undefined) {
          await sendAuthMessage(chatId, errorMessage());
          return;
        }
        const mine = await listOrders({ pharmacySpecialistId: profile.id, limit: 100 });
        if (!mine.some((o) => o.id === orderId)) {
          await sendAuthMessage(chatId, errorMessage());
          return;
        }
        await sendAuthMessage(chatId, orderMessage(order), { inline: orderActionsKeyboard(order) });
        return;
      }

      const statusMap: Record<string, "tasdiqlandi" | "bekor" | "yetkazildi"> = {
        confirm: "tasdiqlandi",
        cancel: "bekor",
        done: "yetkazildi",
      };
      const nextStatus = statusMap[action];
      if (!nextStatus) return;
      const ok = await setOrderStatus(telegramId, orderId, nextStatus);
      if (!ok) {
        await sendAuthMessage(chatId, errorMessage());
        return;
      }
      const orders = await listOrders({ orderId });
      const order = orders[0];
      if (order) {
        await sendAuthMessage(chatId, orderMessage(order), { inline: orderActionsKeyboard(order) });
        if (nextStatus === "yetkazildi") {
          const { notifyCustomerOrderDelivered } = await import("@/lib/orders-bot");
          notifyCustomerOrderDelivered(orderId).catch((err) =>
            console.error("[orders] mijozga yetkazildi xabarnomasi yuborilmadi:", err),
          );
        }
      }
      return;
    }

    // Mijoz buyurtmani bot orqali baholashi (cr:rate:<orderId>:<stars>)
    if (data.startsWith("cr:rate:")) {
      await answerCallbackQuery(query.id);
      const [, , orderIdStr, starsStr] = data.split(":");
      const orderId = Number(orderIdStr);
      const stars = Number(starsStr);
      if (!Number.isSafeInteger(orderId) || !Number.isSafeInteger(stars)) return;

      const { rateOrderDirectly, listOrders } = await import("@/lib/orders");
      const res = await rateOrderDirectly(orderId, stars);
      if (!res.ok) {
        await sendAuthMessage(
          chatId,
          `⚠️ ${res.error || "Ushbu buyurtma allaqachon baholangan yoki mavjud emas."}`,
        );
        return;
      }

      const orders = await listOrders({ orderId });
      const order = orders[0];
      const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/+$/, "");
      const firstMed = order?.items?.[0];
      const medReviewUrl =
        firstMed && rawAppUrl
          ? `${rawAppUrl}/dori/${firstMed.medicineId ?? firstMed.id}`
          : rawAppUrl
            ? `${rawAppUrl}/dorilar`
            : "";

      const starEmoji = "⭐️".repeat(Math.max(1, Math.min(5, stars)));
      const reviewMsg = [
        `⭐️ <b>Katta rahmat!</b>`,
        `Sizning ${starEmoji} (${stars}/5) bahoyingiz qabul qilindi.`,
        "",
        "Sizning fikringiz boshqa fermer va bog'bonlar uchun eng to'g'ri dori vositalarini tanlashda yordam beradi.",
      ].join("\n");

      await sendAuthMessage(chatId, reviewMsg, {
        inline: medReviewUrl
          ? {
              inline_keyboard: [
                [
                  {
                    text: "💬 Fermerlar sharhlariga o'tish / Fikr bildirish",
                    url: medReviewUrl,
                  },
                ],
              ],
            }
          : undefined,
      });
      return;
    }


    // Profil o'chirish tasdiqlash.
    if (data === "pd:yes") {
      await answerCallbackQuery(query.id);
      const deleted = await deleteSpecialist(telegramId);
      await sendAuthMessage(
        chatId,
        deleted ? profileDeletedMessage() : errorMessage(),
      );
      return;
    }
    if (data === "pd:no") {
      await answerCallbackQuery(query.id);
      await sendAuthMessage(chatId, profileDeleteCanceledMessage());
      return;
    }

    // Dori o'chirish (md:<id>).
    if (data.startsWith("md:")) {
      await answerCallbackQuery(query.id);
      const medId = Number(data.slice(3));
      if (!Number.isSafeInteger(medId)) return;
      const deleted = await deleteMedicine(telegramId, medId);
      if (!deleted) {
        await sendAuthMessage(chatId, errorMessage());
        return;
      }
      const rest = await listMedicines(telegramId);
      const total = rest?.medicines.length ?? 0;
      await sendAuthMessage(chatId, medicineDeletedMessage(`Dori #${medId}`, total));
      if (total > 0 && rest) {
        await sendAuthMessage(chatId, medicinesListMessage(rest.medicines), {
          inline: medicinesListKeyboard(rest.medicines),
        });
      }
      return;
    }

    if (data === "c:no") {
      await answerCallbackQuery(query.id);
      await clearState(telegramId);
      await sendAuthMessage(chatId, cancelMessage());
      return;
    }

    await answerCallbackQuery(query.id);
  } catch (err) {
    console.error("[auth-bot] callback xatosi:", err);
    await answerCallbackQuery(query.id);
    await sendAuthMessage(chatId, errorMessage());
  }
}

// ---------------------------------------------------------------------------
// Matn / kontakt / lokatsiya
// ---------------------------------------------------------------------------

async function handleText(
  chatId: number,
  telegramId: number,
  step: Step,
  draft: Draft,
  text: string,
): Promise<void> {
  if (!text) return;

  switch (step) {
    case "name": {
      const skip = text === "/skip";
      const name = skip ? (draft.name ?? null) : cleanText(text, 120);
      if (!name) {
        await sendAuthMessage(chatId, draft.name ? askName(draft.name) : askName());
        return;
      }
      draft.name = name;
      await setState(telegramId, "phone", draft);
      await sendAuthMessage(chatId, askPhone(), { replyKeyboard: contactKeyboard() });
      return;
    }

    case "phone": {
      await handleContact(chatId, telegramId, text);
      return;
    }

    // Ish vaqti — mijozga ko'rinadi. /skip yoki bo'sh — standart qoladi.
    case "work_hours": {
      const skip = text === "/skip";
      const hours = skip ? null : cleanText(text, 60);
      if (!skip && !hours) {
        await sendAuthMessage(chatId, askWorkHours(draft.workHours));
        return;
      }
      if (hours) draft.workHours = hours;
      else delete draft.workHours;
      await setState(telegramId, "confirm", draft);
      await sendSummary(chatId, telegramId, draft);
      return;
    }

    case "address": {
      const skip = text === "/skip";
      const address = skip ? (draft.address ?? null) : cleanText(text, 300);
      if (!address) {
        await sendAuthMessage(chatId, askAddress());
        return;
      }
      draft.address = address;
      await advanceAfterAddress(chatId, telegramId, draft);
      return;
    }

    // Foydalanuvchi tasdiqlash o'rniga manzilni yozib yubordi — shu matn qabul qilinadi.
    case "address_confirm": {
      const skip = text === "/skip";
      const address = skip ? (draft.address ?? null) : cleanText(text, 300);
      if (!address) {
        await sendAuthMessage(chatId, askAddressConfirm(draft.address ?? ""), {
          inline: ADDRESS_CONFIRM_KEYBOARD,
        });
        return;
      }
      draft.address = address;
      await advanceAfterAddress(chatId, telegramId, draft);
      return;
    }

    case "specialty_text": {
      const specialty = cleanText(text, 160);
      if (!specialty) {
        await sendAuthMessage(chatId, askSpecialtyText());
        return;
      }
      draft.specialty = specialty;
      await setState(telegramId, "helps_with", draft);
      await sendAuthMessage(chatId, askHelpsWith(), { inline: HELPS_WITH_KEYBOARD });
      return;
    }

    // Mutaxassis uchun ham ish vaqti so'raymiz (dorixona turi pt: bosqichi
    // dorixonalarda ishlatiladi, mutaxassislar hw: dan to'g'ridan-to'g'ri
    // education'ga o'tadi — shuning uchun work_hours'ni specialty_text
    // paytidan so'ng emas, confirm oldidan so'raymiz: advanceAfterAddress).

    case "helps_with":
      await sendAuthMessage(chatId, askHelpsWith(), { inline: HELPS_WITH_KEYBOARD });
      return;

    case "education": {
      // /skip — ta'limni o'tkazib yuborish.
      const skip = text === "/skip";
      const education = skip ? null : cleanText(text, 300);
      if (!skip && !education) {
        await sendAuthMessage(chatId, askEducation());
        return;
      }
      draft.education = education ?? undefined;
      await setState(telegramId, "experience", draft);
      await sendAuthMessage(chatId, askExperience(), { inline: EXPERIENCE_KEYBOARD });
      return;
    }

    case "experience": {
      // /skip — tajribani o'tkazib yuborish.
      const skip = text === "/skip";
      const years = skip ? null : Number(text.replace(/[^0-9]/g, ""));
      if (!skip && (!Number.isFinite(years) || (years as number) < 0 || (years as number) > 80)) {
        await sendAuthMessage(chatId, askExperience(), { inline: EXPERIENCE_KEYBOARD });
        return;
      }
      draft.experienceYears = years ?? undefined;
      await setState(telegramId, "bio", draft);
      await sendAuthMessage(chatId, askBio());
      return;
    }

    case "bio": {
      // /skip — bio'ni o'tkazib yuborish.
      const skip = text === "/skip";
      const bio = skip ? null : cleanText(text, 500);
      if (!skip && !bio) {
        await sendAuthMessage(chatId, askBio());
        return;
      }
      draft.bio = bio ?? undefined;
      // Mutaxassis uchun ham mijozlar qachon bog'lanishi mumkinligini so'raymiz
      await setState(telegramId, "work_hours", draft);
      await sendAuthMessage(chatId, askWorkHours(draft.workHours), { inline: WORK_HOURS_KEYBOARD });
      return;
    }

    case "med_name": {
      // Juda qisqa nomlar rad etiladi (masalan bitta harf).
      const name = cleanText(text, 160);
      if (!name || name.replace(/\s/g, "").length < 2) {
        await sendAuthMessage(chatId, medicineNameTooShortMessage(), {
          inline: MEDICINE_CANCEL_KEYBOARD,
        });
        return;
      }
      draft.medName = name;
      await setState(telegramId, "med_type", draft);
      await sendAuthMessage(
        chatId,
        `${medicineStepIndicator("type")}\n\n${askMedicineType()}`,
        { inline: MEDICINE_TYPE_KEYBOARD },
      );
      return;
    }

    case "med_usage": {
      // /skip yoki /o'tkaz yozilsa — usage bo'sh qoladi.
      const skip = text === "/skip" || text === "/otkaz";
      const usage = skip ? null : cleanText(text, 300);
      if (!skip && !usage) {
        await sendAuthMessage(chatId, askMedicineUsage(), { inline: MEDICINE_CANCEL_KEYBOARD });
        return;
      }
      draft.medUsage = usage ?? undefined;
      // Keyingi: narx (6 bosqichli oqim).
      await setState(telegramId, "med_price", draft);
      await sendAuthMessage(
        chatId,
        `${medicineStepIndicator("price")}\n\n${askMedicinePrice()}`,
        { inline: MEDICINE_PRICE_SKIP_KEYBOARD },
      );
      return;
    }

    // Dori qo'shishda narx kiritish (ixtiyoriy).
    case "med_price": {
      const skip = text === "/skip" || text === "/otkaz";
      if (skip) {
        delete draft.medPrice;
        await setState(telegramId, "med_confirm", draft);
        await sendMedicineConfirm(chatId, draft);
        return;
      }
      const price = parsePrice(text);
      if (price === null) {
        await sendAuthMessage(chatId, invalidPriceMessage(), {
          inline: MEDICINE_PRICE_SKIP_KEYBOARD,
        });
        return;
      }
      draft.medPrice = price;
      await setState(telegramId, "med_confirm", draft);
      await sendMedicineConfirm(chatId, draft);
      return;
    }

    // /dorilarim → tanlangan dorining narxini o'zgartirish.
    case "med_price_edit": {
      const medId = draft.editingPriceFor;
      if (!medId) {
        await clearState(telegramId);
        await sendAuthMessage(chatId, cancelMessage(), { inline: NEXT_STEP_KEYBOARD });
        return;
      }
      if (text === "/skip") {
        await setMedicinePrice(telegramId, medId, null);
        await clearState(telegramId);
        await sendAuthMessage(chatId, "✅ Narx olib tashlandi.", { inline: MEDICINE_PRICE_CANCEL_KEYBOARD });
        return;
      }
      const price = parsePrice(text);
      if (price === null) {
        await sendAuthMessage(chatId, invalidPriceMessage(), {
          inline: MEDICINE_PRICE_CANCEL_KEYBOARD,
        });
        return;
      }
      const ok = await setMedicinePrice(telegramId, medId, price);
      await clearState(telegramId);
      if (!ok) {
        await sendAuthMessage(chatId, errorMessage());
        return;
      }
      const data2 = await listMedicines(telegramId);
      const med = data2?.medicines.find((m) => m.id === medId);
      if (med) {
        await sendAuthMessage(chatId, medicineManageMessage(med), {
          inline: medicineManageKeyboard(med),
        });
      } else {
        await sendAuthMessage(chatId, `✅ Narx yangilandi: <b>${formatSum(price)}</b>`);
      }
      return;
    }

    case "med_type":
      // Turi tanlanmagan — klaviaturani qayta ko'rsatamiz.
      await sendAuthMessage(
        chatId,
        `${medicineStepIndicator("type")}\n\n${askMedicineType()}`,
        { inline: MEDICINE_TYPE_KEYBOARD },
      );
      return;

    case "med_photo":
      // Hali rasm yuborilmagan — qayta so'raymiz (bekor qilish imkoni bilan).
      await sendAuthMessage(chatId, `${medicineStepIndicator("photo")}\n\n${askMedicinePhoto()}`, {
        inline: MEDICINE_CANCEL_KEYBOARD,
      });
      return;

    case "med_confirm":
      // Nom yozilgan, tasdiqlash kutilmoqda — tugmalarni qayta ko'rsatamiz.
      await sendMedicineConfirm(chatId, draft);
      return;

    case "organization": {
      const skip = text === "/skip";
      const organization = skip ? (draft.organization ?? null) : cleanText(text, 200);
      if (!organization) {
        await sendAuthMessage(chatId, askOrganization());
        return;
      }
      draft.organization = organization;
      await setState(telegramId, "pharmacy_type", draft);
      await sendAuthMessage(chatId, askPharmacyType(), { inline: PHARMACY_TYPE_KEYBOARD });
      return;
    }

    case "role":
      await sendAuthMessage(chatId, roleQuestion(), { inline: ROLE_KEYBOARD });
      return;

    case "specialty":
      await sendAuthMessage(chatId, askSpecialty(), { inline: SPECIALTY_KEYBOARD });
      return;

    case "pharmacy_type":
      await sendAuthMessage(chatId, askPharmacyType(), { inline: PHARMACY_TYPE_KEYBOARD });
      return;

    case "location":
      await sendAuthMessage(chatId, invalidLocationMessage(), { replyKeyboard: locationKeyboard() });
      return;

    case "confirm":
      await sendSummary(chatId, telegramId, draft);
      return;

    default:
      await sendAuthMessage(chatId, helpMessage());
  }
}

async function handleContact(
  chatId: number,
  telegramId: number,
  rawPhone: string | undefined,
): Promise<void> {
  const state = await getState(telegramId);
  if (!state || state.step !== "phone") {
    await sendAuthMessage(chatId, helpMessage(), { inline: NEXT_STEP_KEYBOARD });
    return;
  }
  const phone = normalizePhone(rawPhone);
  if (!phone) {
    await sendAuthMessage(chatId, invalidPhoneMessage(), { replyKeyboard: contactKeyboard() });
    return;
  }
  const draft = state.draft;
  draft.phone = phone;

  // Bir raqam — bitta profil: boshqa hisobda band bo'lsa o'tkazmaymiz.
  const owner = await findPhoneOwner(phone, telegramId);
  if (owner) {
    await sendAuthMessage(chatId, phoneTakenMessage(owner.name, owner.role), {
      replyKeyboard: contactKeyboard(),
    });
    return;
  }

  await setState(telegramId, "location", draft);
  await sendAuthMessage(chatId, askLocation(), { replyKeyboard: locationKeyboard() });
}

async function handleLocation(
  chatId: number,
  telegramId: number,
  lat: number | undefined,
  lng: number | undefined,
): Promise<void> {
  const state = await getState(telegramId);
  if (!state || state.step !== "location") {
    await sendAuthMessage(chatId, helpMessage(), { inline: NEXT_STEP_KEYBOARD });
    return;
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    await sendAuthMessage(chatId, invalidLocationMessage(), { replyKeyboard: locationKeyboard() });
    return;
  }
  const draft = state.draft;
  draft.lat = lat;
  draft.lng = lng;

  // Manzilni avtomatik aniqlaymiz — foydalanuvchi qo'lda yozib o'tirmasin.
  const detected = await reverseGeocode(lat as number, lng as number);
  if (detected) {
    draft.address = detected;
    await setState(telegramId, "address_confirm", draft);
    await sendAuthMessage(chatId, askAddressConfirm(detected), {
      inline: ADDRESS_CONFIRM_KEYBOARD,
      replyKeyboard: { keyboard: [], remove_keyboard: true },
    });
    return;
  }

  // Aniqlanmasa — qo'lda so'raymiz (oqim to'xtamaydi).
  await setState(telegramId, "address", draft);
  await clearReplyKeyboard(chatId, askAddress());
}

async function handleMedicinePhoto(
  chatId: number,
  telegramId: number,
  photos: { file_id?: string; width?: number; height?: number }[],
): Promise<void> {
  const state = await getState(telegramId);
  if (!state || state.step !== "med_photo") {
    await sendAuthMessage(chatId, helpMessage(), { inline: NEXT_STEP_KEYBOARD });
    return;
  }
  // Eng katta o'lchamdagi variant eng aniq rasm bo'ladi.
  const best = [...photos].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];
  if (!best?.file_id) {
    await sendAuthMessage(chatId, askMedicinePhoto(), { inline: MEDICINE_CANCEL_KEYBOARD });
    return;
  }
  const draft = state.draft;
  draft.medPhotoFileId = best.file_id;

  // Rasmi Telegram'dan yuklab, 1080×1450 ga normallashtiramiz (oq fon + JPEG siqish).
  // Bazaga saqlanadi — sahifalarda Telegram'ga qayta murojaat qilmasdan ko'rsatiladi.
  try {
    const { fetchTelegramPhoto } = await import("@/lib/image");
    const processed = await fetchTelegramPhoto(best.file_id);
    if (processed) {
      draft.medPhotoBase64 = processed.base64;
      await sendAuthMessage(
        chatId,
        "🖼 Rasm 1080×1450 formatga moslandi (nisbat saqlanadi, oq fon bilan to'ldiriladi).",
      );
    }
  } catch (err) {
    console.error("[auth-bot] rasmni normallashtirishda xatolik:", err);
  }

  await setState(telegramId, "med_name", draft);
  await sendAuthMessage(
    chatId,
    `${medicineStepIndicator("name")}\n\n${photoReceivedMessage()}`,
    { inline: MEDICINE_CANCEL_KEYBOARD },
  );
}

/**
 * Narx matnini raqamga aylantiradi: "45000", "45 000", "45 000 so'm".
 * Yaroqsiz bo'lsa null. 0 va juda katta qiymatlar rad etiladi.
 */
function parsePrice(text: string): number | null {
  const digits = text.replace(/[^0-9]/g, "");
  if (!digits) return null;
  const value = Number(digits);
  if (!Number.isSafeInteger(value) || value <= 0 || value > 1_000_000_000) return null;
  return value;
}

/** Tasdiqlash xabari — rasm bilan (bor bo'lsa), narx ham ko'rsatiladi. */
async function sendMedicineConfirm(chatId: number, draft: Draft): Promise<void> {
  const typeLabel = draft.medType ? MEDICINE_TYPE_LABELS[draft.medType] : undefined;
  const caption = `${medicineStepIndicator("confirm")}\n\n${medicineConfirmCaption(
    draft.medName ?? "",
    draft.organization,
    typeLabel,
    draft.medUsage,
    draft.medPrice,
  )}`;
  const sent = draft.medPhotoFileId
    ? await sendAuthPhoto(chatId, draft.medPhotoFileId, caption, {
        inline: MEDICINE_CONFIRM_KEYBOARD,
      })
    : false;
  if (!sent) {
    await sendAuthMessage(chatId, caption, { inline: MEDICINE_CONFIRM_KEYBOARD });
  }
}
async function saveMedicine(
  telegramId: number,
  draft: Draft,
): Promise<{ name: string; total: number; price: number | null } | null> {
  const name = draft.medName?.trim();
  if (!name) return null;
  const profile = await getSpecialistByTelegramId(telegramId);
  if (!profile || profile.role !== "pharmacy") return null;

  const medType =
    draft.medType === "crop" || draft.medType === "animal" || draft.medType === "general"
      ? draft.medType
      : "general";

  await addMedicine({
    specialistId: profile.id,
    name,
    photoFileId: draft.medPhotoFileId ?? null,
    photoData: draft.medPhotoBase64 ?? null,
    type: medType,
    usage: draft.medUsage ?? null,
    price: draft.medPrice ?? null,
  });
  const total = await countMedicines(profile.id);
  return { name, total, price: draft.medPrice ?? null };
}

async function advanceAfterAddress(chatId: number, telegramId: number, draft: Draft): Promise<void> {
  if (draft.role === "pharmacy") {
    await setState(telegramId, "organization", draft);
    await sendAuthMessage(chatId, askOrganization());
    return;
  }
  await setState(telegramId, "specialty", draft);
  await sendAuthMessage(chatId, askSpecialty(), { inline: SPECIALTY_KEYBOARD });
}

async function sendSummary(chatId: number, telegramId: number, draft: Draft): Promise<void> {
  const missing = requiredMissing(draft);
  if (missing) {
    await setState(telegramId, missing.step, draft);
    await sendAuthMessage(chatId, missing.question);
    return;
  }
  await sendAuthMessage(
    chatId,
    confirmSummary({
      role: draft.role as SpecialistRole,
      name: draft.name as string,
      phone: draft.phone as string,
      address: draft.address as string,
      specialty: draft.specialty ?? null,
      organization: draft.organization ?? null,
      helpsWith: draft.helpsWith ?? null,
      education: draft.education ?? null,
      experienceYears: draft.experienceYears ?? null,
      bio: draft.bio ?? null,
      lat: draft.lat as number,
      lng: draft.lng as number,
      workHours: draft.workHours ?? "09:00 - 18:00",
    }),
    { inline: CONFIRM_KEYBOARD },
  );
}

/** Majburiy maydonlardan biri yo'q bo'lsa — qaysi bosqichga qaytishni aytadi. */
function requiredMissing(draft: Draft): { step: Step; question: string } | null {
  if (!draft.role) return { step: "role", question: roleQuestion() };
  if (!draft.name) return { step: "name", question: askName() };
  if (!draft.phone) return { step: "phone", question: askPhone() };
  if (!Number.isFinite(draft.lat) || !Number.isFinite(draft.lng)) {
    return { step: "location", question: askLocation() };
  }
  if (!draft.address) return { step: "address", question: askAddress() };
  if (draft.role === "pharmacy" && !draft.organization) {
    return { step: "organization", question: askOrganization() };
  }
  if (!draft.specialty) {
    return draft.role === "pharmacy"
      ? { step: "pharmacy_type", question: askPharmacyType() }
      : { step: "specialty", question: askSpecialty() };
  }
  return null;
}

async function saveDraft(
  telegramId: number,
  draft: Draft,
): Promise<{ name: string; role: SpecialistRole } | null> {
  if (requiredMissing(draft)) return null;
  const role: SpecialistRole =
    draft.role === "pharmacy" || draft.role === "specialist" ? draft.role : "specialist";

  // Xavfsizlik: raqam boshqa hisobga tegishli bo'lib qolgan bo'lsa (masalan
  // draft eski holatdan qolgan) — saqlamaymiz.
  const owner = await findPhoneOwner(draft.phone as string, telegramId);
  if (owner) return null;

  const saved = await upsertSpecialist({
    telegramId,
    name: draft.name as string,
    phone: draft.phone as string,
    role,
    specialty: draft.specialty ?? null,
    education: draft.education ?? null,
    bio: draft.bio ?? null,
    helpsWith: draft.helpsWith ?? "both",
    experienceYears: draft.experienceYears ?? null,
    organization: draft.organization ?? null,
    address: draft.address as string,
    lat: draft.lat as number,
    lng: draft.lng as number,
    workHours: draft.workHours ?? "09:00 - 18:00",
  });
  return saved
    ? { name: saved.name, role: saved.role === "pharmacy" ? "pharmacy" : "specialist" }
    : null;
}

