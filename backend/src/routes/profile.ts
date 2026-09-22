import { Router } from "express";
import { db } from "../db/index.js";
import { sessions, users, diagnoses } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { cleanText } from "../lib/validate.js";

const router = Router();

async function getUserFromReq(req: any) {
  const authHeader = req.headers.authorization;
  const sessionId = authHeader?.replace("Bearer ", "") || req.cookies?.agroz_session;
  if (!sessionId) return null;

  const s = (await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1))[0];
  if (!s) return null;

  const u = (await db.select().from(users).where(eq(users.id, s.userId)).limit(1))[0];
  return u ?? null;
}

// GET /api/profile
router.get("/", async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: "Avval tizimga kiring" });
    }

    const recentDiagnoses = await db
      .select()
      .from(diagnoses)
      .where(eq(diagnoses.userId, user.id))
      .orderBy(desc(diagnoses.id))
      .limit(10);

    res.json({ ok: true, user, diagnoses: recentDiagnoses });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// POST /api/profile
router.post("/", async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: "Avval tizimga kiring" });
    }

    const body = req.body || {};
    const name = cleanText(body.name, 120);
    const region = cleanText(body.region, 120);
    const district = cleanText(body.district, 120);

    const updated = await db
      .update(users)
      .set({
        name: name ?? user.name,
        region: region ?? user.region,
        district: district ?? user.district,
      })
      .where(eq(users.id, user.id))
      .returning();

    res.json({ ok: true, user: updated[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

export default router;
