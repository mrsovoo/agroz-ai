import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { specialistMedicines } from "../../db/schema.js";
import { requireTelegramAuth, requireRole } from "../../middleware/auth.js";
import { addMedicine } from "../../lib/specialists.js";
import { cleanStr, ensureSamePartner, parseSafePrice } from "./helpers.js";

const router = Router();

// GET /products va /medicines — Sotuvchining mahsulotlari (qoldig'i 0 bo'lganlari ham ko'rinadi)
router.get(
  ["/products", "/medicines"],
  requireTelegramAuth("business"),
  requireRole(["specialist", "pharmacy"]),
  async (req: any, res: any) => {
    try {
      const spec = ensureSamePartner(req, res);
      if (!spec) return;

      const rows = await db
        .select()
        .from(specialistMedicines)
        .where(eq(specialistMedicines.specialistId, spec.id))
        .orderBy(desc(specialistMedicines.id));

      return res.json({ ok: true, medicines: rows, products: rows });
    } catch (err) {
      console.error("[biznesgo:products:get error]:", err);
      return res.status(500).json({ ok: false, error: "Server xatosi yuz berdi" });
    }
  },
);

// POST /products va /medicines — Yangi mahsulot qo'shish
router.post(
  ["/products", "/medicines"],
  requireTelegramAuth("business"),
  requireRole(["specialist", "pharmacy"]),
  async (req: any, res: any) => {
    try {
      const spec = ensureSamePartner(req, res);
      if (!spec) return;

      const { name, type, usage, price, stock, stockUnit, photoData } = req.body || {};
      const cleanName = cleanStr(name, 150);
      if (!cleanName) {
        return res.status(400).json({ ok: false, error: "Mahsulot nomi kiritilishi shart" });
      }

      const cleanPhotoData =
        typeof photoData === "string" && photoData.startsWith("data:image/") ? photoData : null;

      const medicine = await addMedicine({
        specialistId: spec.id,
        name: cleanName,
        photoFileId: null,
        photoData: cleanPhotoData,
        type: type === "animal" || type === "crop" ? type : "general",
        usage: usage ? cleanStr(usage, 300) : null,
        price: parseSafePrice(price),
        stock: Number(stock) >= 0 ? Number(stock) : 10,
        stockUnit: cleanStr(stockUnit, 20) || "dona",
      });

      return res.json({ ok: true, medicine, product: medicine });
    } catch (err) {
      console.error("[biznesgo:products:post error]:", err);
      return res.status(500).json({ ok: false, error: "Server xatosi yuz berdi" });
    }
  },
);

// PATCH /products/:id va /medicines/:id — Mahsulotni tahrirlash yoki qoldiqni yangilash
router.patch(
  ["/products/:id", "/medicines/:id"],
  requireTelegramAuth("business"),
  requireRole(["specialist", "pharmacy"]),
  async (req: any, res: any) => {
    try {
      const spec = ensureSamePartner(req, res);
      if (!spec) return;

      const medId = Number(req.params.id);
      const [med] = await db
        .select()
        .from(specialistMedicines)
        .where(eq(specialistMedicines.id, medId))
        .limit(1);

      if (!med || med.specialistId !== spec.id) {
        return res.status(403).json({
          ok: false,
          error: "Mahsulot topilmadi yoki sizga tegishli emas",
        });
      }

      const { name, type, stockUnit, status, price, stock, usage, photoData } = req.body || {};
      const updates: Record<string, any> = { updatedAt: new Date() };

      if (name !== undefined) {
        const cleanN = cleanStr(name, 150);
        if (cleanN) updates.name = cleanN;
      }
      if (type === "crop" || type === "animal" || type === "general") updates.type = type;
      if (stockUnit !== undefined) {
        const cleanU = cleanStr(stockUnit, 20);
        if (cleanU) updates.stockUnit = cleanU;
      }
      if (status === "bor" || status === "yoq" || status === "qoralama") updates.status = status;
      if (price !== undefined) updates.price = parseSafePrice(price);
      if (stock !== undefined) {
        const nextStock = Number(stock) >= 0 ? Number(stock) : 0;
        updates.stock = nextStock;
        if (status === undefined && med.status !== "qoralama") {
          updates.status = nextStock <= 0 ? "yoq" : "bor";
        }
      }
      if (usage !== undefined) updates.usage = usage ? cleanStr(usage, 300) : null;
      if (photoData !== undefined) {
        updates.photoData =
          typeof photoData === "string" && photoData.startsWith("data:image/") ? photoData : null;
      }

      await db
        .update(specialistMedicines)
        .set(updates)
        .where(eq(specialistMedicines.id, medId));

      if (updates.status === "bor" || (updates.stock !== undefined && updates.stock > 0)) {
        import("../../lib/waitlist.js")
          .then(({ notifyMedicineAvailable }) => {
            notifyMedicineAvailable(medId).catch(() => {});
          })
          .catch(() => {});
      }

      const updatedMed = { ...med, ...updates };
      return res.json({ ok: true, medicine: updatedMed, product: updatedMed });
    } catch (err) {
      console.error("[biznesgo:products:patch error]:", err);
      return res.status(500).json({ ok: false, error: "Server xatosi yuz berdi" });
    }
  },
);

// DELETE /products/:id va /medicines/:id — Mahsulotni o'chirish
router.delete(
  ["/products/:id", "/medicines/:id"],
  requireTelegramAuth("business"),
  requireRole(["specialist", "pharmacy"]),
  async (req: any, res: any) => {
    try {
      const spec = ensureSamePartner(req, res);
      if (!spec) return;

      const medId = Number(req.params.id);
      const [med] = await db
        .select()
        .from(specialistMedicines)
        .where(eq(specialistMedicines.id, medId))
        .limit(1);

      if (!med || med.specialistId !== spec.id) {
        return res.status(403).json({
          ok: false,
          error: "Mahsulot topilmadi yoki sizga tegishli emas",
        });
      }

      await db
        .delete(specialistMedicines)
        .where(and(eq(specialistMedicines.id, medId), eq(specialistMedicines.specialistId, spec.id)));
      return res.json({ ok: true });
    } catch (err) {
      console.error("[biznesgo:products:delete error]:", err);
      return res.status(500).json({ ok: false, error: "Server xatosi yuz berdi" });
    }
  },
);

export default router;

