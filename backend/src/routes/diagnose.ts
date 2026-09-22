import { Router } from "express";
import { createHash, randomBytes } from "node:crypto";
import { db } from "../db/index.js";
import { diagnoses } from "../db/schema.js";
import { aiDiagnose } from "../lib/ai.js";
import { isImageDataUrl, dataUrlBytes } from "../lib/validate.js";
import { MAX_DIAGNOSIS_TEXT, MAX_IMAGE_BYTES } from "../lib/constants.js";
import { eq } from "drizzle-orm";

const router = Router();

// POST /api/diagnose
router.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    const category = body.category === "animal" ? "animal" : "crop";
    const text = typeof body.text === "string" ? body.text.trim().slice(0, MAX_DIAGNOSIS_TEXT) : "";
    const imageDataUrl = body.imageDataUrl ?? null;

    if (!text && !imageDataUrl) {
      return res.status(400).json({ error: "Rasm yuklang yoki muammoni yozing/gapiring" });
    }

    if (imageDataUrl) {
      if (!isImageDataUrl(imageDataUrl)) {
        return res.status(400).json({ error: "Rasm formati qo'llab-quvvatlanmaydi" });
      }
      if (dataUrlBytes(imageDataUrl) > MAX_IMAGE_BYTES) {
        return res.status(413).json({ error: "Rasm juda katta. Iltimos, kichikroq rasm tanlang." });
      }
    }

    const result = await aiDiagnose({ category, text, imageDataUrl });

    const viewToken = randomBytes(24).toString("hex");
    const viewHash = createHash("sha256").update(viewToken).digest("hex");

    const solutionText = [result.solution, result.prevention ? `Oldini olish: ${result.prevention}` : ""]
      .filter(Boolean)
      .join("\n\n");
    const medicinesJson = JSON.stringify(result.medicines);

    let insertedId = Date.now();
    try {
      const inserted = await db
        .insert(diagnoses)
        .values({
          userId: null,
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

      if (inserted && inserted[0]?.id) {
        insertedId = inserted[0].id;
      }
    } catch (dbErr) {
      console.warn("[diagnose] Baza yozishda ogohlantirish:", dbErr);
    }

    res.json({
      ok: true,
      id: insertedId,
      result,
      viewToken,
    });
  } catch (err: any) {
    console.error("[diagnose error]:", err);
    res.status(500).json({ error: err.message || "Tashxis jarayonida xatolik yuz berdi" });
  }
});

// GET /api/diagnose/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(404).json({ error: "Tashxis topilmadi" });
    }

    const rows = await db
      .select()
      .from(diagnoses)
      .where(eq(diagnoses.id, id))
      .limit(1);

    const diag = rows[0];
    if (!diag) {
      return res.status(404).json({ error: "Tashxis topilmadi" });
    }

    res.json({ diagnosis: diag });
  } catch (err: any) {
    console.error("[get diagnosis error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

export default router;
