import { db } from "../db/index.js";
import { medicineWaitlist, specialistMedicines, specialists, users } from "../db/schema.js";
import { eq, and, or, sql } from "drizzle-orm";
import { escapeHtml } from "./tg-escape.js";
import { sendMessage, isBotConfigured, miniAppKeyboard, appBaseUrl } from "./telegram-bot.js";
import { sendToUser } from "./bot-sender.js";

/**
 * Xaridorni dori kelganda xabardor qilish ro'yxatiga (waitlist) qo'shadi.
 */
export async function addToMedicineWaitlist(params: {
  medicineId: number;
  telegramId?: number | null;
  phone?: string | null;
  userId?: number | null;
}): Promise<{ ok: boolean; alreadySubscribed?: boolean; error?: string }> {
  try {
    const { medicineId, telegramId, phone, userId } = params;
    if (!medicineId || (!telegramId && !phone && !userId)) {
      return { ok: false, error: "Xabarnoma uchun ma'lumot yetarli emas" };
    }

    // Allaqachon obuna bo'lganmi?
    const conditions = [
      eq(medicineWaitlist.medicineId, medicineId),
      eq(medicineWaitlist.isNotified, false),
    ];

    const matchParts: any[] = [];
    if (telegramId) matchParts.push(eq(medicineWaitlist.telegramId, telegramId));
    if (phone) matchParts.push(eq(medicineWaitlist.phone, phone));
    if (userId) matchParts.push(eq(medicineWaitlist.userId, userId));

    if (matchParts.length > 0) {
      conditions.push(or(...matchParts)!);
    }

    const [existing] = await db
      .select({ id: medicineWaitlist.id })
      .from(medicineWaitlist)
      .where(and(...conditions))
      .limit(1);

    if (existing) {
      return { ok: true, alreadySubscribed: true };
    }

    await db.insert(medicineWaitlist).values({
      medicineId,
      telegramId: telegramId ? Number(telegramId) : null,
      phone: phone || null,
      userId: userId || null,
      isNotified: false,
    });

    return { ok: true };
  } catch (err: any) {
    console.error("[waitlist] addToMedicineWaitlist error:", err);
    return { ok: false, error: err?.message || "Xatolik yuz berdi" };
  }
}

/**
 * Dori sotuvga qaytganda yoki zaxirasi to'ldirilganda kutayotgan mijozlarga xabar yuboradi.
 */
export async function notifyMedicineAvailable(medicineId: number): Promise<void> {
  try {
    // 1. Dori va dorixona tafsilotlarini olamiz
    const [medRow] = await db
      .select({
        id: specialistMedicines.id,
        name: specialistMedicines.name,
        price: specialistMedicines.price,
        stockUnit: specialistMedicines.stockUnit,
        pharmacyId: specialists.id,
        pharmacyName: specialists.organization,
        pharmacyOwner: specialists.name,
        pharmacyAddress: specialists.address,
        pharmacyPhone: specialists.phone,
      })
      .from(specialistMedicines)
      .innerJoin(specialists, eq(specialists.id, specialistMedicines.specialistId))
      .where(eq(specialistMedicines.id, medicineId))
      .limit(1);

    if (!medRow) return;

    // 2. Kutayotgan obunachilarni olamiz
    const subscribers = await db
      .select()
      .from(medicineWaitlist)
      .where(
        and(
          eq(medicineWaitlist.medicineId, medicineId),
          eq(medicineWaitlist.isNotified, false),
        ),
      );

    if (subscribers.length === 0) return;

    const pharmacyTitle = medRow.pharmacyName || medRow.pharmacyOwner || "Agro-do'kon";
    const priceText = medRow.price ? `${medRow.price.toLocaleString()} so'm` : "Kelishuv asosida";
    const baseWebUrl = (await appBaseUrl()) || "https://agrozgo.uz";
    const medUrl = `${baseWebUrl}/dori/${medRow.id}`;

    const messageText = [
      "🔔 <b>XUSHXABAR: SIZ KUTGAN DORI KELDI!</b>",
      "",
      `💊 <b>«${escapeHtml(medRow.name)}»</b> dori vositasi yana sotuvda mavjud!`,
      `🏪 <b>Do'kon:</b> ${escapeHtml(pharmacyTitle)}`,
      medRow.pharmacyAddress ? `📍 <b>Manzil:</b> ${escapeHtml(medRow.pharmacyAddress)}` : "",
      `💰 <b>Narxi:</b> ${priceText}`,
      "",
      "Mahsulot soni cheklangan bo'lishi mumkin. Hoziroq xarid qiling yoki bron qiling!",
    ]
      .filter(Boolean)
      .join("\n");

    const inlineKb = {
      inline_keyboard: [
        [{ text: "🛒 Dorini ko'rish va xarid qilish", url: medUrl }],
      ],
    };

    const hasBot = await isBotConfigured();

    for (const sub of subscribers) {
      let targetTelegramId = sub.telegramId ? Number(sub.telegramId) : null;

      // Agar telegramId bo'lmasa, userId orqali topamiz
      if (!targetTelegramId && sub.userId) {
        const [userRow] = await db
          .select({ telegramId: users.telegramId })
          .from(users)
          .where(eq(users.id, sub.userId))
          .limit(1);
        if (userRow?.telegramId) {
          targetTelegramId = Number(userRow.telegramId);
        }
      }

      if (targetTelegramId) {
        try {
          if (hasBot) {
            await sendMessage(targetTelegramId, messageText, { keyboard: inlineKb });
          } else {
            await sendToUser(targetTelegramId, messageText, { reply_markup: inlineKb });
          }
        } catch (e) {
          console.error(`[waitlist] Xabar yuborishda xato (TG: ${targetTelegramId}):`, e);
        }
      }
    }

    // 3. Xabarnoma yuborildi deb belgilaymiz
    const ids = subscribers.map((s) => s.id);
    if (ids.length > 0) {
      await db
        .update(medicineWaitlist)
        .set({ isNotified: true, notifiedAt: new Date() })
        .where(
          and(
            eq(medicineWaitlist.medicineId, medicineId),
            eq(medicineWaitlist.isNotified, false),
          ),
        );
    }

    console.log(`[waitlist] ${subscribers.length} ta kutayotgan mijozga «${medRow.name}» kelgani haqida xabar yuborildi.`);
  } catch (err) {
    console.error("[waitlist] notifyMedicineAvailable xatosi:", err);
  }
}
