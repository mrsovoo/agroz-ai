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
  getSpecialistByTelegramId,
  isSpecialistRole,
  upsertSpecialist,
  type SpecialistRole,
} from "@/lib/specialists";
import {
  PHARMACY_TYPE_KEYBOARD,
  SPECIALTY_KEYBOARD,
  ADDRESS_CONFIRM_KEYBOARD,
  CONFIRM_KEYBOARD,
  MEDICINE_CONFIRM_KEYBOARD,
  NEXT_STEP_KEYBOARD,
  ROLE_KEYBOARD,
  answerCallbackQuery,
  appKeyboard,
  askAddress,
  askAddressConfirm,
  askLocation,
  askMedicineName,
  askMedicinePhoto,
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
  medicineSavedMessage,
  needRegistrationMessage,
  onlyPharmacyMessage,
  profileMessage,
  roleQuestion,
  savedMessage,
  sendAuthMessage,
  sendAuthPhoto,
  welcomeMessage,
} from "@/lib/auth-bot";
import { reverseGeocode } from "@/lib/geocode";

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
  | "confirm"
  // Dorixona uchun dori qo'shish oqimi.
  | "med_photo"
  | "med_name"
  | "med_confirm";

type Draft = {
  role?: SpecialistRole;
  name?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  address?: string;
  specialty?: string;
  organization?: string;
  /** Dori qo'shish uchun vaqtinchalik maydonlar. */
  medPhotoFileId?: string;
  medName?: string;
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

  if (command === "/bekor") {
    await clearState(telegramId);
    await sendAuthMessage(chatId, cancelMessage());
    return;
  }

  if (command === "/yordam" || command === "/help") {
    await sendAuthMessage(chatId, helpMessage());
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
  await setState(telegramId, "role", {});
  await sendAuthMessage(chatId, roleQuestion(), { inline: ROLE_KEYBOARD });
}

/** Dorixona egasi dori qo'shishni boshlaydi (faqat role=pharmacy uchun). */
async function startMedicineAdd(chatId: number, telegramId: number): Promise<void> {
  const profile = await getSpecialistByTelegramId(telegramId);
  if (!profile) {
    await sendAuthMessage(chatId, needRegistrationMessage(), { inline: NEXT_STEP_KEYBOARD });
    return;
  }
  if (profile.role !== "pharmacy") {
    await sendAuthMessage(chatId, onlyPharmacyMessage());
    return;
  }
  await clearState(telegramId);
  await setState(telegramId, "med_photo", {});
  await sendAuthMessage(chatId, askMedicinePhoto());
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
      await sendAuthMessage(chatId, askName());
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
      step = "confirm";
      await setState(telegramId, step, draft);
      await answerCallbackQuery(query.id);
      await sendSummary(chatId, telegramId, draft);
      return;
    }

    // Dorini tasdiqlash yoki bekor qilish.
    if (data === "m:ok") {
      await answerCallbackQuery(query.id);
      const saved = await saveMedicine(telegramId, draft);
      if (!saved) {
        await sendAuthMessage(chatId, needRegistrationMessage(), { inline: NEXT_STEP_KEYBOARD });
        return;
      }
      await clearState(telegramId);
      await sendAuthMessage(chatId, medicineSavedMessage(saved.name, saved.total));
      return;
    }

    if (data === "m:no") {
      await answerCallbackQuery(query.id);
      await clearState(telegramId);
      await sendAuthMessage(chatId, cancelMessage());
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

    // Dorixona turi.
    if (data.startsWith("pt:")) {
      const value = data.slice(3);
      draft.specialty = value === "vet" ? "Vet dorixona" : "Agro dorixona";
      step = "confirm";
      await setState(telegramId, step, draft);
      await answerCallbackQuery(query.id);
      await sendSummary(chatId, telegramId, draft);
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
      await sendAuthMessage(chatId, savedMessage(saved.name), { inline: appKeyboard() });
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
      const name = cleanText(text, 120);
      if (!name) {
        await sendAuthMessage(chatId, askName());
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

    case "address": {
      const address = cleanText(text, 300);
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
      const address = cleanText(text, 300);
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
      await setState(telegramId, "confirm", draft);
      await sendSummary(chatId, telegramId, draft);
      return;
    }

    case "med_name": {
      const name = cleanText(text, 160);
      if (!name) {
        await sendAuthMessage(chatId, askMedicineName());
        return;
      }
      draft.medName = name;
      await setState(telegramId, "med_confirm", draft);
      const caption = medicineConfirmCaption(name);
      const sent = draft.medPhotoFileId
        ? await sendAuthPhoto(chatId, draft.medPhotoFileId, caption, {
            inline: MEDICINE_CONFIRM_KEYBOARD,
          })
        : false;
      // Rasm yuborilmasa ham, tasdiqlash so'raladi — oqim to'xtamaydi.
      if (!sent) {
        await sendAuthMessage(chatId, caption, { inline: MEDICINE_CONFIRM_KEYBOARD });
      }
      return;
    }

    case "med_photo":
      await sendAuthMessage(chatId, askMedicinePhoto());
      return;

    case "med_confirm":
      await sendAuthMessage(
        chatId,
        medicineConfirmCaption(draft.medName ?? ""),
        { inline: MEDICINE_CONFIRM_KEYBOARD },
      );
      return;

    case "organization": {
      const organization = cleanText(text, 200);
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
    await sendAuthMessage(chatId, askMedicinePhoto());
    return;
  }
  const draft = state.draft;
  draft.medPhotoFileId = best.file_id;
  await setState(telegramId, "med_name", draft);
  await sendAuthMessage(chatId, askMedicineName());
}

/** Dori tasdiqlanganda saqlaydi. Profil topilmasa `null`. */
async function saveMedicine(
  telegramId: number,
  draft: Draft,
): Promise<{ name: string; total: number } | null> {
  const name = draft.medName?.trim();
  if (!name) return null;
  const profile = await getSpecialistByTelegramId(telegramId);
  if (!profile || profile.role !== "pharmacy") return null;

  await addMedicine({
    specialistId: profile.id,
    name,
    photoFileId: draft.medPhotoFileId ?? null,
  });
  const total = await countMedicines(profile.id);
  return { name, total };
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

// ---------------------------------------------------------------------------
// Saqlash
// ---------------------------------------------------------------------------

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
      lat: draft.lat as number,
      lng: draft.lng as number,
      workHours: "09:00 - 18:00",
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
): Promise<{ name: string } | null> {
  if (requiredMissing(draft)) return null;
  const role: SpecialistRole = isSpecialistRole(draft.role) ? draft.role : "specialist";
  const saved = await upsertSpecialist({
    telegramId,
    name: draft.name as string,
    phone: draft.phone as string,
    role,
    specialty: draft.specialty ?? null,
    organization: draft.organization ?? null,
    address: draft.address as string,
    lat: draft.lat as number,
    lng: draft.lng as number,
    workHours: "09:00 - 18:00",
  });
  return saved ? { name: saved.name } : null;
}

