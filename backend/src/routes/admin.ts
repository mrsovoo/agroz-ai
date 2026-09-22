import { Router } from "express";
import { db } from "../db/index.js";
import {
  users,
  specialists,
  specialistMedicines,
  orders,
  diagnoses,
  appSettings,
  adminSessions,
} from "../db/schema.js";
import { sql } from "drizzle-orm";
import { adminEnabled, adminLogin } from "../lib/admin-auth.js";

const router = Router();

// POST /api/admin/session (Login)
router.post("/session", async (req, res) => {
  if (!(await adminEnabled())) {
    return res.status(503).json({ error: "Admin panel o'chirilgan" });
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Login va parol kerak" });
  }

  const result = await adminLogin(username, password);
  if (!result.ok) {
    return res.status(401).json({ error: "Login yoki parol noto'g'ri" });
  }

  res.json({ ok: true, sessionId: result.sessionId });
});

// GET /api/admin/stats
router.get("/stats", async (_req, res) => {
  try {
    const [u, s, m, o, d] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(users),
      db.select({ count: sql<number>`count(*)::int` }).from(specialists),
      db.select({ count: sql<number>`count(*)::int` }).from(specialistMedicines),
      db.select({ count: sql<number>`count(*)::int` }).from(orders),
      db.select({ count: sql<number>`count(*)::int` }).from(diagnoses),
    ]);

    res.json({
      ok: true,
      stats: {
        users: u[0]?.count ?? 0,
        specialists: s[0]?.count ?? 0,
        medicines: m[0]?.count ?? 0,
        orders: o[0]?.count ?? 0,
        diagnoses: d[0]?.count ?? 0,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// GET /api/admin/settings
router.get("/settings", async (_req, res) => {
  try {
    const rows = await db.select().from(appSettings);
    const settings: Record<string, string | null> = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    res.json({ ok: true, settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// POST /api/admin/settings
router.post("/settings", async (req, res) => {
  try {
    const body = req.body || {};
    for (const [key, value] of Object.entries(body)) {
      if (typeof key === "string" && key.length > 0) {
        await db
          .insert(appSettings)
          .values({ key, value: String(value ?? "") })
          .onConflictDoUpdate({ target: appSettings.key, set: { value: String(value ?? "") } });
      }
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

export default router;
