import { Router } from "express";
import { reverseGeocodeDetails } from "../lib/geocode.js";
import { db } from "../db/index.js";
import { sessions, users } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = Router();

async function getUserFromReq(req: any) {
  const authHeader = req.headers.authorization;
  const cookieSession = req.headers.cookie
    ?.split(";")
    .find((c: string) => c.trim().startsWith("agroai_session=") || c.trim().startsWith("agroz_session="))
    ?.split("=")[1];
  const sessionId =
    authHeader?.replace("Bearer ", "") ||
    req.cookies?.agroai_session ||
    req.cookies?.agroz_session ||
    cookieSession;
  if (!sessionId) return null;

  try {
    const s = (await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1))[0];
    if (!s) return null;
    const u = (await db.select().from(users).where(eq(users.id, s.userId)).limit(1))[0];
    return u ?? null;
  } catch {
    return null;
  }
}

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

