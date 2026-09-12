import { NextResponse } from "next/server";
import { db } from "@/db";
import { diagnoses } from "@/db/schema";
import { aiDiagnose } from "@/lib/ai";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = (await req.json()) as {
    category?: "crop" | "animal";
    text?: string;
    imageDataUrl?: string | null;
  };
  const category = body.category === "animal" ? "animal" : "crop";
  const text = (body.text ?? "").trim();
  const imageDataUrl = body.imageDataUrl ?? null;

  if (!text && !imageDataUrl) {
    return NextResponse.json(
      { error: "Rasm yuklang yoki muammoni yozing/gapiring" },
      { status: 400 },
    );
  }

  const result = await aiDiagnose({ category, text, imageDataUrl });
  const user = await getCurrentUser();

  const inserted = await db
    .insert(diagnoses)
    .values({
      userId: user?.id ?? null,
      category,
      inputText: text || null,
      hasImage: Boolean(imageDataUrl),
      diseaseName: result.disease,
      solution: [result.solution, result.prevention ? `Oldini olish: ${result.prevention}` : ""]
        .filter(Boolean)
        .join("\n\n"),
      medicines: JSON.stringify(result.medicines),
      severity: result.severity,
      source: result.source,
    })
    .returning({ id: diagnoses.id });

  return NextResponse.json({ ok: true, id: inserted[0].id, result });
}
