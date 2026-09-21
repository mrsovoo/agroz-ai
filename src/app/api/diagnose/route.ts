import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { db } from "@/db";
import { diagnoses } from "@/db/schema";
import { aiDiagnose } from "@/lib/ai";
import { getCurrentUser } from "@/lib/session";
import { clientIp, dataUrlBytes, isImageDataUrl } from "@/lib/validate";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { MAX_DIAGNOSIS_TEXT, MAX_IMAGE_BYTES } from "@/lib/constants";
import { withApiErrors } from "@/lib/api";
import { saveInMemoryDiagnosis } from "@/lib/in-memory-store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = withApiErrors(async (req: Request) => {
  const body = (await req.json().catch(() => ({}))) as {
    category?: "crop" | "animal";
    text?: string;
    imageDataUrl?: string | null;
  };

  const category = body.category === "animal" ? "animal" : "crop";
  const text = typeof body.text === "string" ? body.text.trim().slice(0, MAX_DIAGNOSIS_TEXT) : "";
  const imageDataUrl = body.imageDataUrl ?? null;

  const user = await getCurrentUser();
  const limiterKey = user ? `diagnose:user:${user.id}` : `diagnose:ip:${clientIp(req)}`;
  const limit = rateLimit(limiterKey, 15, 60 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  if (!text && !imageDataUrl) {
    return NextResponse.json(
      { error: "Rasm yuklang yoki muammoni yozing/gapiring" },
      { status: 400 },
    );
  }

  if (imageDataUrl) {
    if (!isImageDataUrl(imageDataUrl)) {
      return NextResponse.json({ error: "Rasm formati qo'llab-quvvatlanmaydi" }, { status: 400 });
    }
    if (dataUrlBytes(imageDataUrl) > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Rasm juda katta. Iltimos, kichikroq rasm tanlang." },
        { status: 413 },
      );
    }
  }

  const result = await aiDiagnose({ category, text, imageDataUrl });

  // Anonim tashxis (userId=null) faqat imzolangan token bilan ko'riladi: bazada
  // tokenning SHA-256 hash'i saqlanadi, o'zi esa bir marta API javobida qaytadi.
  // ID'ni bilgan istalgan odam boshqaning tashxisini sanab ko'ra olmaydi.
  const viewToken = user ? null : randomBytes(24).toString("hex");
  const viewHash = viewToken
    ? createHash("sha256").update(viewToken).digest("hex")
    : null;

  const solutionText = [result.solution, result.prevention ? `Oldini olish: ${result.prevention}` : ""]
    .filter(Boolean)
    .join("\n\n");
  const medicinesJson = JSON.stringify(result.medicines);

  let insertedId: number = Date.now();

  try {
    const inserted = await db
      .insert(diagnoses)
      .values({
        userId: user?.id ?? null,
        category,
        inputText: text || null,
        hasImage: Boolean(imageDataUrl),
        diseaseName: result.disease,
        solution: solutionText,
        medicines: medicinesJson,
        severity: result.severity,
        confidence: result.confidence,
        source: result.source,
        viewHash,
      })
      .returning({ id: diagnoses.id });

    if (inserted && inserted.length > 0 && typeof inserted[0]?.id === "number") {
      insertedId = inserted[0].id;
    }
  } catch (dbErr) {
    console.warn("[diagnose] Baza yozishda ogohlantirish, xotirada saqlanadi:", dbErr);
  }

  // Sahifa `/natija/[id]` ga yo'naltirilganda zudlik bilan topilishi uchun xotiraga ham saqlaymiz
  saveInMemoryDiagnosis({
    id: insertedId,
    userId: user?.id ?? null,
    category,
    inputText: text || null,
    hasImage: Boolean(imageDataUrl),
    diseaseName: result.disease,
    solution: solutionText,
    medicines: medicinesJson,
    severity: result.severity,
    confidence: result.confidence,
    source: result.source,
    viewHash,
    createdAt: new Date(),
  });

  const response: {
    ok: boolean;
    id: number;
    result: typeof result;
    viewToken?: string;
  } = { ok: true, id: insertedId, result };
  if (viewToken) response.viewToken = viewToken;

  return NextResponse.json(response);
});
