import { Router } from "express";
import { getNewsFeed } from "../lib/news.js";

const router = Router();

// GET /api/news
router.get("/", async (_req, res) => {
  try {
    const items = await getNewsFeed();
    res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=1800");
    res.json({ items });
  } catch (err: any) {
    console.error("[news error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

export default router;

