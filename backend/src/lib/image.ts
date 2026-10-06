import sharp from "sharp";

/**
 * Dori rasmlari uchun standart o'lcham va format.
 *
 * Dorixona egasi botda qanday rasm tashlasa — u avtomatik shu o'lchamga
 * keltiriladi: nisbati saqlanadi, yetmay qolgan joy **oq fon** bilan to'ldiriladi,
 * JPEG qilib siqiladi — natijada odatda 100–300 KB atrofida.
 */
export const MEDICINE_PHOTO_WIDTH = 1200;
export const MEDICINE_PHOTO_HEIGHT = 1200;
export const MEDICINE_PHOTO_QUALITY = 85;

/** Maksimal rasm hajmi (bayt) — bazaga yozishdan oldin. */
const MAX_PROCESSED_BYTES = 900 * 1024;

/**
 * Rasmni moslashtiradi:
 * • EXIF bo'yicha to'g'ri buriladi (.rotate()) — telefon orqali tik/yotiq olingan rasmlar uchun;
 * • Sun'iy oq fon (letterbox white bars) qo'shilmaydi (fit: 'inside') — haqiqiy mahsulot tasviri toza saqlanadi;
 * • Katta rasmlar 1200x1200px ichiga mutanosib ravishda keltiriladi;
 * • JPEG sifatida siqiladi.
 */
export async function normalizeMedicinePhoto(
  input: ArrayBuffer | Uint8Array,
): Promise<{ base64: string; sizeBytes: number } | null> {
  try {
    let output = await sharp(input, { failOn: "none" })
      .rotate()
      .resize({
        width: MEDICINE_PHOTO_WIDTH,
        height: MEDICINE_PHOTO_HEIGHT,
        fit: "inside",
        withoutEnlargement: true,
      })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: MEDICINE_PHOTO_QUALITY, mozjpeg: true })
      .toBuffer();

    // Hali ham 900 KB dan katta bo'lsa — sifatni bosqichma-bosqich pasaytirish.
    for (const quality of [75, 65, 55, 45]) {
      if (output.byteLength <= MAX_PROCESSED_BYTES) break;
      output = await sharp(input, { failOn: "none" })
        .rotate()
        .resize({
          width: MEDICINE_PHOTO_WIDTH,
          height: MEDICINE_PHOTO_HEIGHT,
          fit: "inside",
          withoutEnlargement: true,
        })
        .flatten({ background: "#ffffff" })
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
    );
    const fileJson = (await fileRes.json()) as { ok?: boolean; result?: { file_path?: string } };
    const filePath = fileJson.result?.file_path;
    if (!fileJson.ok || !filePath) return null;

    const imgRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
    if (!imgRes.ok) return null;

    const buf = new Uint8Array(await imgRes.arrayBuffer());
    return await normalizeMedicinePhoto(buf);
  } catch {
    return null;
  }
}
