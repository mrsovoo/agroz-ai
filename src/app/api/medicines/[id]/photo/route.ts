import { getMedicineById } from "@/lib/specialists";
import { resolveAuthBotToken } from "@/lib/auth-bot";

export const dynamic = "force-dynamic";

/**
 * Telegram getFile javobini qisqa muddatga keshlaymiz: file_path bir necha soat
 * o'zgarmaydi, shuning uchun har bir rasm so'rovida Telegram'ga qayta murojaat
 * qilish shart emas (file/bot/<token>/<path> havolasi o'zi ishlayveradi).
 */
const fileCache = new Map<string, { path: string; expires: number }>();
const FILE_TTL_MS = 30 * 60 * 1000; // 30 daqiqa
const FILE_CACHE_MAX = 500;

async function cachedFilePath(token: string, fileId: string): Promise<string | null> {
  const cached = fileCache.get(fileId);
  if (cached && cached.expires > Date.now()) return cached.path;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`,
      { cache: "no-store" },
    );
    const json = (await res.json()) as { ok?: boolean; result?: { file_path?: string } };
    const filePath = json.result?.file_path;
    if (!json.ok || !filePath) return null;

    // Kesh o'sib ketmasligi uchun eng eskisini o'chiramiz.
    if (fileCache.size >= FILE_CACHE_MAX) {
      const oldest = fileCache.keys().next().value;
      if (oldest !== undefined) fileCache.delete(oldest);
    }
    fileCache.set(fileId, { path: filePath, expires: Date.now() + FILE_TTL_MS });
    return filePath;
  } catch {
    return null;
  }
}

/**
 * Dori rasmini beradi.
 *
 * • Yangi dorilar: rasm botda qo'shishda 1080×1450 ga normallashtirilib bazaga
 *   yozilgan — base64'dan decode qilib to'g'ridan-to'g'ri beramiz (tez, Telegram
 *   so'rovisiz, doim bir xil o'lchamda).
 * • Eskilar (photoData yo'q): Telegram'dan proxy orqali uzatiladi (avvalgi usul).
 *
 * Bot tokeni **hech qachon** clientga chiqmaydi.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return new Response("not found", { status: 404 });

  const medicine = await getMedicineById(numericId);
  if (!medicine) return new Response("not found", { status: 404 });

  // 1) Bazadagi normallashtirilgan rasm — eng tez va ishonchli yo'l.
  if (medicine.photoData) {
    try {
      const bytes = Buffer.from(medicine.photoData, "base64");
      return new Response(new Uint8Array(bytes), {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      });
    } catch {
      // Base64 buzuk bo'lsa — Telegram proxy'ga o'tamiz.
    }
  }

  // 2) Eski usul: Telegram file_id orqali proxy.
  if (!medicine.photoFileId) return new Response("not found", { status: 404 });

  const token = await resolveAuthBotToken();
  if (!token) return new Response("bot sozlanmagan", { status: 503 });

  try {
    const filePath = await cachedFilePath(token, medicine.photoFileId);
    if (!filePath) return new Response("not found", { status: 404 });

    const imgRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`, {
      cache: "no-store",
    });
    if (!imgRes.ok || !imgRes.body) return new Response("not found", { status: 404 });

    return new Response(imgRes.body, {
      headers: {
        "Content-Type": imgRes.headers.get("content-type") ?? "image/jpeg",
        // Telegram fayl yo'llari o'zgarishi mumkin — uzoq keshlamaymiz.
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("[medicines] rasmni olishda xatolik:", err);
    return new Response("error", { status: 502 });
  }
}
