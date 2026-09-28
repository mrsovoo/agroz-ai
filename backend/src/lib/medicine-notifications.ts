import { db } from "@/db";
import { specialistMedicines, specialists, specialistRatings, orders, orderItems } from "@/db/schema";
import { eq, and, isNull, lt, sql } from "drizzle-orm";
import { sendAuthMessage } from "@/lib/auth-bot";
import { sendMessage } from "@/lib/telegram-bot";

const MIN_IMAGE_SIZE = 400; // minimum 400x400 px
const NOTIFICATION_COOLDOWN_HOURS = 24; // 24 hours cooldown

interface MedicineNotificationData {
  medicineId: number;
  medicineName: string;
  pharmacyId: number;
  pharmacyName: string;
  pharmacyTelegramId: number;
  hasImage: boolean;
  imageWidth: number | null;
  imageHeight: number | null;
  hasPrice: boolean;
  price: number | null;
  imageNotifiedAt: Date | null;
  priceNotifiedAt: Date | null;
}

export async function checkPharmacyMedicines(pharmacyId: number): Promise<{
  imageNotifications: number;
  priceNotifications: number;
}> {
  let imageNotifications = 0;
  let priceNotifications = 0;

  // Get all active medicines for this pharmacy
  const meds = await db
    .select({
      id: specialistMedicines.id,
      name: specialistMedicines.name,
      photoFileId: specialistMedicines.photoFileId,
      photoData: specialistMedicines.photoData,
      price: specialistMedicines.price,
      imageNotifiedAt: specialistMedicines.imageNotifiedAt,
      priceNotifiedAt: specialistMedicines.priceNotifiedAt,
      imageWidth: specialistMedicines.imageWidth,
      imageHeight: specialistMedicines.imageHeight,
    })
    .from(specialistMedicines)
    .where(and(
      eq(specialistMedicines.specialistId, pharmacyId),
      eq(specialistMedicines.status, "bor")
    ));

  const pharmacy = await db
    .select({
      id: specialists.id,
      name: specialists.name,
      telegramId: specialists.telegramId,
      organization: specialists.organization,
      phone: specialists.phone,
    })
    .from(specialists)
    .where(eq(specialists.id, pharmacyId))
    .limit(1);

  if (!pharmacy[0]) return { imageNotifications: 0, priceNotifications: 0 };

  const pharmacyInfo = pharmacy[0];
  const pharmacyName = pharmacyInfo.organization || pharmacyInfo.name || "Dorixona";
  const telegramId = pharmacyInfo.telegramId;

  if (!telegramId) return { imageNotifications: 0, priceNotifications: 0 };

  const now = new Date();
  const cooldownMs = NOTIFICATION_COOLDOWN_HOURS * 60 * 60 * 1000;

  for (const med of meds) {
    const hasImage = !!(med.photoFileId || med.photoData);
    const hasPrice = med.price !== null && med.price > 0;
    const imageDimsOk = med.imageWidth && med.imageHeight && 
                        med.imageWidth >= 400 && med.imageHeight >= 400;

    // Check image notification
    const needsImageNotification = !med.imageNotifiedAt || 
      (med.imageNotifiedAt && (now.getTime() - med.imageNotifiedAt.getTime() > 24 * 60 * 60 * 1000));

    const needsPriceNotification = !med.priceNotifiedAt || 
      (med.priceNotifiedAt && (now.getTime() - med.priceNotifiedAt.getTime() > 24 * 60 * 60 * 1000));

    // Check if image is missing or too small
    const imageIssue = !med.photoFileId && !med.photoData || !imageDimsOk;
    const priceIssue = med.price === null || med.price <= 0;

    let message = "";
    let shouldNotify = false;
    let notifyType = "";

    if (imageIssue && priceIssue && needsImageNotification && needsPriceNotification) {
      message = `⚠️ <b>Diqqat!</b> "${med.name}" dori kartochkasi to'ldirilmagan:\n\n` +
        `🖼 <b>Rasm yo'q</b> (min 400×400 px)\n` +
        `💰 <b>Narx kiritilmagan</b> — mijozga "Kelishiladi" ko'rinmoqda\n\n` +
        `Iltimos, dorilar bo'limidan rasm va narxni to'ldiring.`;
      shouldNotify = true;
      notifyType = "both";
    } else if (imageIssue && needsImageNotification) {
      message = `🖼 <b>Rasm yo'q!</b> "${med.name}" dori kartochkasida rasm yo'q yoki juda kichik (min 400×400 px).\n\n` +
        `Iltimos, dorilar bo'limidan rasm yuklang.`;
      shouldNotify = true;
      notifyType = "image";
    } else if (priceIssue && needsPriceNotification) {
      message = `💰 <b>Narx yo'q!</b> "${med.name}" dorisining narxi kiritilmagan — mijozga "Kelishiladi" ko'rinmoqda.\n\n` +
        `Iltimos, dorilar bo'limidan narxni kiriting.`;
      shouldNotify = true;
      notifyType = "price";
    }

if (shouldNotify && telegramId) {
try {
            const inlineKeyboard = {
              inline_keyboard: [[
                { text: "📝 To'ldirish", url: "https://adm-agroz-ai-auth.vercel.app/pharmacy/medicines" },
                { text: "⏭ Keyinroq", callback_data: `dismiss_notification_${med.id}` }
              ]]
            };

            await sendAuthMessage(telegramId, message, { inline: inlineKeyboard });
        
        // Update notification timestamp
        if (notifyType === "image" || notifyType === "both") {
          await db.update(specialistMedicines)
            .set({ imageNotifiedAt: new Date() })
            .where(eq(specialistMedicines.id, med.id));
        }
        if (notifyType === "price" || notifyType === "both") {
          await db.update(specialistMedicines)
            .set({ priceNotifiedAt: new Date() })
            .where(eq(specialistMedicines.id, med.id));
        }
        
        if (notifyType === "image" || notifyType === "both") {
          console.log(`[notification] Image notification sent for medicine ${med.id} to pharmacy ${pharmacyId}`);
        }
        if (notifyType === "price" || notifyType === "both") {
          console.log(`[notification] Price notification sent for medicine ${med.id} to pharmacy ${pharmacyId}`);
        }
      } catch (err) {
        console.error(`[notification] Failed to send to pharmacy ${pharmacyId}:`, err);
      }
    }
  }

  return { imageNotifications, priceNotifications };
}

export async function checkAllPharmacies(): Promise<void> {
  const pharmacies = await db
    .select({ id: specialists.id })
    .from(specialists)
    .where(and(
      eq(specialists.role, "pharmacy"),
      eq(specialists.isActive, true),
      eq(specialists.isApproved, true)
    ));

  let totalImage = 0;
  let totalPrice = 0;

  for (const ph of pharmacies) {
    const result = await checkPharmacyMedicines(ph.id);
    totalImage += result.imageNotifications;
    totalPrice += result.priceNotifications;
  }

  console.log(`[medicine-notifications] Total sent: ${totalImage} image, ${totalPrice} price notifications`);
}

// Reset notification timestamp when image/price is added
export async function resetImageNotification(medicineId: number): Promise<void> {
  await db.update(specialistMedicines)
    .set({ imageNotifiedAt: null })
    .where(eq(specialistMedicines.id, medicineId));
}

export async function resetPriceNotification(medicineId: number): Promise<void> {
  await db.update(specialistMedicines)
    .set({ priceNotifiedAt: null })
    .where(eq(specialistMedicines.id, medicineId));
}

// Update image dimensions after upload
export async function updateMedicineImageDims(
  medicineId: number, 
  width: number, 
  height: number
): Promise<void> {
  await db.update(specialistMedicines)
    .set({ imageWidth: width, imageHeight: height })
    .where(eq(specialistMedicines.id, medicineId));
}