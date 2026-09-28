import { Router } from "express";
import { requireAdmin } from "./admin.js";
import { checkAllPharmacies, resetImageNotification, resetPriceNotification, updateMedicineImageDims } from "../lib/medicine-notifications.js";

const router = Router();

// POST /api/admin/medicine-notifications/check — Manual trigger for notifications
router.post("/check", requireAdmin, async (req, res) => {
  try {
    const result = await checkAllPharmacies();
    res.json({ ok: true, message: "Notifications check completed" });
  } catch (err: any) {
    console.error("[medicine-notifications check error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// POST /api/admin/medicine-notifications/reset-image/:id — Reset image notification
router.post("/reset-image/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Noto'g'ri dori ID" });
    }
    await resetImageNotification(id);
    res.json({ ok: true, message: "Image notification reset" });
  } catch (err: any) {
    console.error("[reset-image error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// POST /api/admin/medicine-notifications/reset-price/:id — Reset price notification
router.post("/reset-price/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Noto'g'ri dori ID" });
    }
    await resetPriceNotification(id);
    res.json({ ok: true, message: "Price notification reset" });
  } catch (err: any) {
    console.error("[reset-price error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// POST /api/admin/medicine-notifications/update-image-dims — Update image dimensions
router.post("/update-image-dims", requireAdmin, async (req, res) => {
  try {
    const { medicineId, width, height } = req.body;
    const id = Number(medicineId);
    const w = Number(width);
    const h = Number(height);
    
    if (!Number.isSafeInteger(id) || id <= 0 || !Number.isInteger(w) || w <= 0 || !Number.isInteger(h) || h <= 0) {
      return res.status(400).json({ error: "Noto'g'ri parametrlar" });
    }
    
    await updateMedicineImageDims(id, w, h);
    res.json({ ok: true, message: "Image dimensions updated" });
  } catch (err: any) {
    console.error("[update-image-dims error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

export default router;