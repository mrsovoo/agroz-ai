import { Router } from "express";
import { reverseGeocode } from "../lib/geocode.js";

const router = Router();

// GET /api/location
router.get("/", async (req, res) => {
  try {
    const lat = parseFloat((req.query.lat as string) ?? "");
    const lng = parseFloat((req.query.lng as string) ?? "");

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ ok: false, place: null });
    }

    const place = await reverseGeocode(lat, lng);
    const isFull = req.query.full === "1";
    const short = place ? place.split(",").slice(0, 2).join(",").trim() : null;
    const address = isFull ? place : short;

    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");
    res.json({ ok: Boolean(address), place: address });
  } catch (err: any) {
    console.error("[location error]:", err);
    res.status(500).json({ ok: false, error: err.message || "Manzilni aniqlab bo'lmadi" });
  }
});

export default router;

