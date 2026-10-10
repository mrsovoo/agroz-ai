import { optionalAuth } from "../middleware/auth.js";
import { Router } from "express";
import { randomBytes } from "node:crypto";
import { db } from "../db/index.js";
import { diagnoses } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { aiDiagnose } from "../lib/ai.js";
import { cleanText } from "../lib/validate.js";
import rateLimit from "express-rate-limit";

const router = Router();

// Rate limiter logic based on user status
// Anonim uchun qattiqroq IP bo'yicha limiter (5/soat)
const diagnoseAnonLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { ok: false, error: "Tizimga kirmaganlar uchun soatlik limitga yetdingiz (5 ta). Iltimos, tizimga kiring." },
  keyGenerator: (req: any) => req.ip || req.connection?.remoteAddress || "unknown",
});

// Kirganlar uchun limiter (20/soat)
const diagnoseAuthLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { ok: false, error: "Juda ko'p so'rov yubordingiz (soatiga 20 ta). Iltimos, keyinroq urinib ko'ring." },
  keyGenerator: (req: any) => req.user?.id ? String(req.user.id) : "unknown",
});

// Kunlik 10 ta cheklovchi kirganlar uchun
const diagnoseUserDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 10,
  message: { ok: false, error: "Kunlik tashxis limitiga (10 ta) yetdingiz." },
  keyGenerator: (req: any) => req.user?.id ? String(req.user.id) : "unknown",
});

// Dinamik tarzda limiterni tanlaydigan middleware
const dynamicDiagnoseLimiter = (req: any, res: any, next: any) => {
  if (req.user?.id) {
    // Auth user limiters
    diagnoseAuthLimiter(req, res, (err: any) => {
      if (err) return next(err);
      diagnoseUserDailyLimiter(req, res, next);
    });
  } else {
    // Anon user limiter
    diagnoseAnonLimiter(req, res, next);
  }
};


router.post("/", optionalAuth, dynamicDiagnoseLimiter, async (req: any, res: any) => {
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
      if (imageDataUrl.length > 5 * 1024 * 1024 * 1.4) {
        return res.status(400).json({ ok: false, error: "Rasm hajmi 5MB dan oshmasligi kerak." });
      }
    }

    const user = req.user || null;
    const result = await aiDiagnose({ category, text, imageDataUrl });

    // Uzun tasodifiy token, kamida 128 bit (16 bytes = 32 chars in hex)
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
      id: inserted.id, // For frontend navigation
      viewToken: viewHash, // One-time view token for anonymous users
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

router.get("/:id", optionalAuth, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: "ID xato" });
    }
    
    // ViewToken can be passed in query, headers, or body. Usually query for GET.
    const viewToken = req.query.viewToken as string || req.headers["x-view-token"] as string;

    const rows = await db.select().from(diagnoses).where(eq(diagnoses.id, id)).limit(1);
    const item = rows[0];
    
    // 404 emas 403 o'rniga ishlatiladi to hide existence
    if (!item) return res.status(404).json({ ok: false, error: "Topilmadi" });
    
    // IDOR tekshiruvi:
    let isOwner = false;
    if (item.userId) {
      if (req.user?.id && item.userId === req.user.id) {
        isOwner = true;
      }
    } else {
      // Agar userId bo'lmasa, demak anonim qo'shgan. 
      // Faqat viewToken orqali ko'rish mumkin.
    }
    
    // Yoki to'g'ri viewToken bo'lsa
    if (viewToken && item.viewHash === viewToken) {
      isOwner = true;
    }
    
    if (!isOwner) {
      return res.status(404).json({ ok: false, error: "Topilmadi" }); // Ataylab 404
    }
    
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
