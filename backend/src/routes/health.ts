import { Router } from "express";
import { pool } from "../db/index.js";

const router = Router();

router.get("/", async (_req, res) => {
  let dbOk = false;
  try {
    const p = pool.instance;
    const r = await p.query("SELECT 1 as alive");
    dbOk = r.rows[0]?.alive === 1;
  } catch {
    dbOk = false;
  }

  res.json({
    status: "ok",
    service: "agroz-ai-backend",
    version: "1.0.0",
    database: dbOk ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

export default router;
