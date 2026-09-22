import { Router } from "express";
import { listSpecialists } from "../lib/specialists.js";
import { clampRadiusKm, parseCoords } from "../lib/geo.js";
import { rateSpecialist } from "../lib/specialists.js";
import crypto from "node:crypto";

const router = Router();

// GET /api/specialists
router.get("/", async (req, res) => {
  try {
    const latRaw = req.query.lat as string | undefined;
    const lngRaw = req.query.lng as string | undefined;
    const coords = parseCoords(latRaw, lngRaw);
    const radiusKm = clampRadiusKm(req.query.radius);

    const medsQuery = req.query.med;
    const meds = Array.isArray(medsQuery)
      ? (medsQuery as string[])
      : typeof medsQuery === "string"
      ? [medsQuery]
      : [];

    const items = await listSpecialists({
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      radiusKm,
      role: (req.query.role as string) || null,
      meds,
    });

    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.json({ items, radiusKm });
  } catch (err: any) {
    console.error("[specialists route error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// POST /api/specialists/rate
router.post("/rate", async (req, res) => {
  try {
    const body = req.body || {};
    const specialistId = Number(body.specialistId);
    const stars = Number(body.stars);

    if (!Number.isInteger(specialistId) || specialistId <= 0) {
      return res.status(400).json({ error: "Mutaxassis ID noto'g'ri" });
    }
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ error: "Baho 1 dan 5 gacha bo'lishi kerak" });
    }

    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "anon";
    const raterKey = crypto.createHash("sha256").update(`${ip}:specialist_rating`).digest("hex").slice(0, 32);

    const result = await rateSpecialist(specialistId, raterKey, stars);
    if (!result) {
      return res.status(404).json({ error: "Mutaxassis topilmadi" });
    }

    res.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("[rate error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

export default router;

