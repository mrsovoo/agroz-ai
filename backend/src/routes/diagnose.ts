import { Router } from "express";

const router = Router();

// POST /api/diagnose
router.post("/", async (_req, res) => {
  return res.status(503).json({
    ok: false,
    error: "Tashxis xizmati tez orada ishga tushadi",
  });
});

// GET /api/diagnose/:id
router.get("/:id", async (_req, res) => {
  return res.status(503).json({
    ok: false,
    error: "Tashxis xizmati tez orada ishga tushadi",
  });
});

export default router;

