import { getMedicineById } from "@/lib/specialists";
import { authBotToken } from "@/lib/auth-bot";

export const dynamic = "force-dynamic";

/**
 * Dori rasmini Telegram'dan uzatadi.
 *
 * Rasm `file_id` sifatida saqlanadi; bot tokeni **hech qachon** clientga
 * chiqmasligi kerak, shuning uchun rasmni shu route orqali proxy qilamiz.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return new Response("not found", { status: 404 });

  const medicine = await getMedicineById(numericId);
  if (!medicine?.photoFileId) return new Response("not found", { status: 404 });

  const token = authBotToken();
  if (!token) return new Response("bot sozlanmagan", { status: 503 });

  try {
    const fileRes = await fetch(
      `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(medicine.photoFileId)}`,
      { cache: "no-store" },
    );
    const fileJson = (await fileRes.json()) as { ok?: boolean; result?: { file_path?: string } };
    const filePath = fileJson.result?.file_path;
    if (!fileJson.ok || !filePath) return new Response("not found", { status: 404 });

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
