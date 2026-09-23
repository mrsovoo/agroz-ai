import { Router } from "express";
import { db } from "../db/index.js";
import { specialists, specialistRatings } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";

const router = Router();

// GET /api/pharmacies — Xarita yoki boshqa komponentlar uchun dorixonalar ro'yxati
router.get("/", async (req, res) => {
  try {
    const kind = req.query.kind as string | undefined;

    // Dorixonalar specialists jadvalida role = 'pharmacy' sifatida saqlanadi
    const query = db
      .select({
        id: specialists.id,
        name: specialists.organization,
        specialistName: specialists.name,
        role: specialists.role,
        specialty: specialists.specialty,
        phone: specialists.phone,
        address: specialists.address,
        workHours: specialists.workHours,
        lat: specialists.lat,
        lng: specialists.lng,
        experienceYears: specialists.experienceYears,
        bio: specialists.bio,
        ratingAvg: sql<number>`coalesce(avg(${specialistRatings.stars}), 5.0)`,
        ratingCount: sql<number>`count(${specialistRatings.id})`,
      })
      .from(specialists)
      .leftJoin(specialistRatings, eq(specialists.id, specialistRatings.specialistId))
      .where(eq(specialists.role, "pharmacy"))
      .groupBy(specialists.id);

    const rows = await query;

    const items = rows.map((r) => {
      let pharmacyKind = "agro";
      if (r.specialty?.toLowerCase().includes("vet")) {
        pharmacyKind = "vet";
      } else if (r.specialty?.toLowerCase().includes("umumiy")) {
        pharmacyKind = "general";
      }

      return {
        id: r.id,
        name: r.name || r.specialistName || "Agro Dorixona",
        kind: pharmacyKind,
        lat: r.lat,
        lng: r.lng,
        phone: r.phone,
        address: r.address || "",
        specialist: r.specialistName,
        workHours: r.workHours || "08:00 - 18:00",
        ratingAvg: Number(r.ratingAvg) || 5.0,
        ratingCount: Number(r.ratingCount) || 0,
        stock: [],
        medicines: [],
      };
    });

    const filtered = kind && kind !== "all" 
      ? items.filter((i) => i.kind === kind || i.kind === "general")
      : items;

    res.json({ items: filtered });
  } catch (err: any) {
    console.error("[Pharmacies API error]:", err);
    res.status(500).json({ error: "Dorixonalarni yuklashda xatolik yuz berdi" });
  }
});

export default router;
