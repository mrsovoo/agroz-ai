import { Router } from "express";
import { reverseGeocodeDetails } from "../lib/geocode.js";
import { db } from "../db/index.js";
import { sessions, users } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = Router();

import { getUserFromReq } from "../lib/user-auth.js";

// GET /api/location
router.get("/", async (req, res) => {
  try {
    const lat = parseFloat((req.query.lat as string) ?? "");
    const lng = parseFloat((req.query.lng as string) ?? "");

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ ok: false, place: null });
    }

    const { formatted, region, district } = await reverseGeocodeDetails(lat, lng);
    const isFull = req.query.full === "1";
    const short = formatted ? formatted.split(",").slice(0, 2).join(",").trim() : null;
    const address = isFull ? formatted : short;

    // Agar foydalanuvchi tizimga kirgan bo'lsa, viloyat va tumanini avtomatik bazaga yozamiz
    if (region) {
      try {
        const user = await getUserFromReq(req);
        if (user) {
          const updateData: { region?: string; district?: string } = {};
          if (!user.region || user.region !== region) {
            updateData.region = region;
          }
          if (district && (!user.district || user.district !== district)) {
            updateData.district = district;
          }
          if (Object.keys(updateData).length > 0) {
            await db.update(users).set(updateData).where(eq(users.id, user.id));
          }
        }
      } catch (userUpdateErr) {
        console.warn("[location] user region update xatosi:", userUpdateErr);
      }
    }

    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");
    res.json({ ok: Boolean(address), place: address, region, district });
  } catch (err: any) {
    console.error("[location error]:", err);
    res.status(500).json({ ok: false, error: err.message || "Manzilni aniqlab bo'lmadi" });
  }
});

export default router;

