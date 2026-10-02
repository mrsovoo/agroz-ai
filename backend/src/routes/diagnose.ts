import { Router } from "express";
import { randomBytes } from "node:crypto";
import { db } from "../db/index.js";
import { diagnoses } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { aiDiagnose } from "../lib/ai.js";
import { getUserFromReq } from "../lib/user-auth.js";
import { cleanText } from "../lib/validate.js";
import rateLimit from "express-rate-limit";

const router = Router();

// IP bo'yicha soatiga 20 ta
const diagnoseIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { ok: false, error: "Juda ko'p so'rov yubordingiz. Iltimos, keyinroq urinib ko'ring." },
  keyGenerator: (req: any) => req.ip || req.connection.remoteAddress || "unknown",
});

// Foydalanuvchiga kuniga 10 ta
const diagnoseUserLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 10,
  message: { ok: false, error: "Kunlik tashxis limitiga (10 ta) yetdingiz." },
  keyGenerator: (req: any) => req.userIdForRateLimit || "unauth",
});

router.post("/", diagnoseIpLimiter, async (req: any, res: any, next) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ ok: false, error: "Tizimga kirish talab etiladi." });
    }
    req.userIdForRateLimit = String(user.id);
    next();
  } catch (err) {
    next(err);
  }
}, diagnoseUserLimiter, async (req: any, res: any) => {
  try {
    const body = req.body || {};
    const category = body.category === "animal" ? "animal" : "crop";
    const text = typeof body.text === "string" ? cleanText(body.text, 1000) || "" : "";
    const imageDataUrl =
      typeof body.imageDataUrl === "string" && body.imageDataUrl.startsWith("data:image/")
        ? body.imageDataUrl
        : null;

    if (!text && !imageDataUrl) {
      return res.status(400).json({ ok: false, error: "Matn yoki rasm kiriting." });
    }

    if (imageDataUrl) {
      if (!/data:image\/(jpeg|png|webp);base64,/.test(imageDataUrl)) {
        return res.status(400).json({ ok: false, error: "Faqat jpeg, png yoki webp rasm ruxsat etilgan." });
      }
      // calculate approximate size ~ 4/3 of original size. max 5MB = 5242880 bytes. base64 string length <= 5242880 * 1.37
      if (imageDataUrl.length > 5 * 1024 * 1024 * 1.4) {
        return res.status(400).json({ ok: false, error: "Rasm hajmi 5MB dan oshmasligi kerak." });
      }
    }

    const user = await getUserFromReq(req);

    const result = await aiDiagnose({ category, text, imageDataUrl });

    const viewHash = randomBytes(16).toString("hex");

    const [inserted] = await db.insert(diagnoses).values({
      userId: user?.id ?? null,
      category,
      inputText: text || null,
      hasImage: Boolean(imageDataUrl),
      diseaseName: result.disease,
      solution: result.solution,
      medicines: JSON.stringify(result.medicines || []),
      severity: result.severity || "orta",
      confidence: result.confidence ?? 70,
      source: result.source || "ai",
      viewHash,
    }).returning();

    return res.json({
      ok: true,
      diagnosis: {
        id: inserted.id,
        category,
        disease: result.disease,
        solution: result.solution,
        medicines: result.medicines,
        severity: result.severity,
        prevention: result.prevention,
        confidence: result.confidence,
        source: result.source,
        hasImage: Boolean(imageDataUrl),
        createdAt: inserted.createdAt,
        disclaimer: "Bu dastlabki maslahat, aniq tashxis emas. Muhim holatda mutaxassisga murojaat qiling.",
      },
    });
  } catch (err: any) {
    console.error("[diagnose error]:", err);
    return res.status(500).json({ ok: false, error: "Server xatosi" });
  }
});

router.get("/:id", async (req, res) => {
  // Omitted get route changes for brevity as it is basically the same.
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: "ID xato" });
    }
    const rows = await db.select().from(diagnoses).where(eq(diagnoses.id, id)).limit(1);
    const item = rows[0];
    if (!item) return res.status(404).json({ ok: false, error: "Topilmadi" });
    
    return res.json({
      ok: true,
      diagnosis: {
        id: item.id,
        category: item.category,
        disease: item.diseaseName,
        solution: item.solution,
        medicines: JSON.parse(item.medicines || "[]"),
        severity: item.severity,
        confidence: item.confidence,
        source: item.source,
        hasImage: item.hasImage,
        createdAt: item.createdAt,
        disclaimer: "Bu dastlabki maslahat...",
      },
    });
  } catch (err: any) {
    res.status(500).json({ ok: false });
  }
});

export default router;
