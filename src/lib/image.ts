import sharp from "sharp";

/**
 * Dori rasmlari uchun standart o'lcham va format.
 *
 * Dorixona egasi botda qanday rasm tashlasa — u avtomatik shu o'lchamga
 * keltiriladi: nisbati saqlanadi, yetmay qolgan joy **oq fon** bilan to'ldiriladi,
 * JPEG qilib siqiladi — natijada odatda 100–300 KB atrofida.
 */
export const MEDICINE_PHOTO_WIDTH = 1080;
export const MEDICINE_PHOTO_HEIGHT = 1450;
export const MEDICINE_PHOTO_QUALITY = 82;

/** Maksimal rasm hajmi (bayt) — bazaga yozishdan oldin. */
const MAX_PROCESSED_BYTES = 900 * 1024;

/**
 * Rasimni 1080×1450 o'lchamga keltiradi:
 * • nisbati saqlanadi (contain), yetmay qolgan joyga oq fon;
 * • JPEG sifat 82 bilan siqiladi, 900 KB dan kattarsa sifat pasaytiriladi;
 * • ulanish ma'lumotlari (EXIF) olib tashlanadi.
 *
 * Xatolik bo'lsa `null` qaytaradi — chaqiruvchi tomonda eski usulda davom etiladi.
 */
export async function normalizeMedicinePhoto(
  input: ArrayBuffer | Uint8Array,
): Promise<{ base64: string; sizeBytes: number } | null> {
  try {
    const resize = {
      width: MEDICINE_PHOTO_WIDTH,
      height: MEDICINE_PHOTO_HEIGHT,
      fit: "contain" as const,
      // Mayda rasmlar sifatini saqlash uchun kattalashtirmaymiz — oq canvas markazida qoladi.
      withoutEnlargement: true,
      background: "#ffffff",
    };

    let output = await sharp(input, { failOn: "none" })
      .resize(resize)
      .jpeg({ quality: MEDICINE_PHOTO_QUALITY, mozjpeg: true })
      .toBuffer();

    // Hali ham 900 KB dan katta bo'lsa — sifatni bosqichma-bosqich pasaytirish.
    for (const quality of [70, 60, 50, 40]) {
      if (output.byteLength <= MAX_PROCESSED_BYTES) break;
      output = await sharp(input, { failOn: "none" })
        .resize(resize)
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
    }

    // Baribir katta bo'lsa — bazaga yozmaymiz (file_id fallback qoladi).
    if (output.byteLength > MAX_PROCESSED_BYTES) return null;

    return { base64: output.toString("base64"), sizeBytes: output.byteLength };
  } catch {
    return null;
  }
}

/**
 * Telegram'dan rasmni yuklab, 1080×1450 ga normallashtiradi.
 * Bot tokeni DB (admin panel) yoki env'dan olinadi.
 */
export async function fetchTelegramPhoto(fileId: string): Promise<{ base64: string; sizeBytes: number } | null> {
  try {
    const { resolveAuthBotToken } = await import("@/lib/auth-bot");
    const token = await resolveAuthBotToken();
    if (!token) return null;

    const fileRes = await fetch(
      `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`,
      { cache: "no-store" },
    );
    const fileJson = (await fileRes.json()) as { ok?: boolean; result?: { file_path?: string } };
    const filePath = fileJson.result?.file_path;
    if (!fileJson.ok || !filePath) return null;

    const imgRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`, {
      cache: "no-store",
    });
    if (!imgRes.ok) return null;

    const buf = new Uint8Array(await imgRes.arrayBuffer());
    return await normalizeMedicinePhoto(buf);
  } catch {
    return null;
  }
}
