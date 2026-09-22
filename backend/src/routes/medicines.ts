import { Router } from "express";
import { db } from "../db/index.js";
import { specialistMedicines, specialists, specialistRatings } from "../db/schema.js";
import { and, eq, ne, sql, ilike, or } from "drizzle-orm";
import { resolveAuthBotToken } from "../lib/auth-bot.js";

const router = Router();

// GET /api/medicines  — ro'yxat (home page showcase va /dorilar uchun)
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 48, 96);
    const type = typeof req.query.type === "string" ? req.query.type : null;
    const q = typeof req.query.q === "string" ? req.query.q.trim() : null;

    const conditions = [
      eq(specialistMedicines.status, "bor"),
      eq(specialists.isActive, true),
      eq(specialists.isApproved, true),
    ];
    if (type === "crop" || type === "animal") {
      conditions.push(eq(specialistMedicines.type, type));
    }
    if (q) {
      conditions.push(
        or(
          ilike(specialistMedicines.name, `%${q}%`),
          ilike(specialistMedicines.usage, `%${q}%`)
        )!
      );
    }

    const rows = await db
      .select({
        id: specialistMedicines.id,
        name: specialistMedicines.name,
        type: specialistMedicines.type,
        usage: specialistMedicines.usage,
        price: specialistMedicines.price,
        hasPhoto: sql<boolean>`(${specialistMedicines.photoFileId} is not null or ${specialistMedicines.photoData} is not null)`,
        pharmacyId: specialists.id,
        pharmacyName: sql<string>`coalesce(${specialists.organization}, ${specialists.name})`,
        pharmacyPhone: specialists.phone,
        pharmacyAddress: specialists.address,
        ratingAvg: sql<number | null>`(
          select avg(r.stars)::float from specialist_ratings r where r.specialist_id = ${specialists.id}
        )`,
        ratingCount: sql<number>`(
          select count(*)::int from specialist_ratings r where r.specialist_id = ${specialists.id}
        )`,
      })
      .from(specialistMedicines)
      .innerJoin(specialists, eq(specialists.id, specialistMedicines.specialistId))
      .where(and(...conditions))
      .orderBy(sql`${specialistMedicines.id} desc`)
      .limit(limit);

    const medicines = rows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      usage: r.usage,
      price: r.price,
      hasPhoto: Boolean(r.hasPhoto),
      pharmacyId: r.pharmacyId,
      pharmacyName: r.pharmacyName,
      pharmacyPhone: r.pharmacyPhone,
      pharmacyAddress: r.pharmacyAddress,
      ratingAvg: r.ratingAvg === null ? null : Number(r.ratingAvg),
      ratingCount: Number(r.ratingCount),
    }));

    res.json(medicines);
  } catch (err: any) {
    console.error("[medicines list error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

const fileCache = new Map<string, { path: string; expires: number }>();
const FILE_TTL_MS = 30 * 60 * 1000;

async function cachedFilePath(token: string, fileId: string): Promise<string | null> {
  const cached = fileCache.get(fileId);
  if (cached && cached.expires > Date.now()) return cached.path;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`
    );
    const json = (await res.json()) as { ok?: boolean; result?: { file_path?: string } };
    const filePath = json.result?.file_path;
    if (!json.ok || !filePath) return null;

    fileCache.set(fileId, { path: filePath, expires: Date.now() + FILE_TTL_MS });
    return filePath;
  } catch {
    return null;
  }
}

// GET /api/medicines/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(404).json({ error: "Dori topilmadi" });
    }

    const rows = await db
      .select({
        id: specialistMedicines.id,
        name: specialistMedicines.name,
        type: specialistMedicines.type,
        usage: specialistMedicines.usage,
        price: specialistMedicines.price,
        status: specialistMedicines.status,
        photoFileId: specialistMedicines.photoFileId,
        photoData: specialistMedicines.photoData,
        pharmacyId: specialists.id,
        pharmacyOrg: specialists.organization,
        pharmacyName: specialists.name,
        pharmacyPhone: specialists.phone,
        pharmacyAddress: specialists.address,
        workHours: specialists.workHours,
        ratingAvg: sql<number | null>`(
          select avg(r.stars)::float from specialist_ratings r where r.specialist_id = ${specialists.id}
        )`,
        ratingCount: sql<number>`(
          select count(*)::int from specialist_ratings r where r.specialist_id = ${specialists.id}
        )`,
      })
      .from(specialistMedicines)
      .innerJoin(specialists, eq(specialists.id, specialistMedicines.specialistId))
      .where(and(eq(specialistMedicines.id, id), eq(specialists.isActive, true)))
      .limit(1);

    const r = rows[0];
    if (!r || r.status !== "bor") {
      return res.status(404).json({ error: "Dori topilmadi" });
    }

    const medicine = {
      id: r.id,
      name: r.name,
      type: r.type,
      usage: r.usage,
      price: r.price,
      hasPhoto: Boolean(r.photoFileId || r.photoData),
      status: r.status,
      pharmacyId: r.pharmacyId,
      pharmacyOrg: r.pharmacyOrg,
      pharmacyName: r.pharmacyOrg ?? r.pharmacyName,
      pharmacyPhone: r.pharmacyPhone,
      pharmacyAddress: r.pharmacyAddress,
      workHours: r.workHours,
      ratingAvg: r.ratingAvg === null ? null : Number(r.ratingAvg),
      ratingCount: Number(r.ratingCount),
    };

    // O'xshash dorilar
    const similarRows = await db
      .select({
        id: specialistMedicines.id,
        name: specialistMedicines.name,
        type: specialistMedicines.type,
        usage: specialistMedicines.usage,
        price: specialistMedicines.price,
        status: specialistMedicines.status,
        photoFileId: specialistMedicines.photoFileId,
        photoData: specialistMedicines.photoData,
        pharmacyId: specialists.id,
        pharmacyOrg: specialists.organization,
        pharmacyName: specialists.name,
        pharmacyPhone: specialists.phone,
        pharmacyAddress: specialists.address,
        ratingAvg: sql<number | null>`(
          select avg(r.stars)::float from specialist_ratings r where r.specialist_id = ${specialists.id}
        )`,
        ratingCount: sql<number>`(
          select count(*)::int from specialist_ratings r where r.specialist_id = ${specialists.id}
        )`,
      })
      .from(specialistMedicines)
      .innerJoin(specialists, eq(specialists.id, specialistMedicines.specialistId))
      .where(
        and(
          eq(specialistMedicines.status, "bor"),
          eq(specialists.isActive, true),
          ne(specialistMedicines.id, medicine.id),
        )
      )
      .orderBy(
        sql`case when ${specialistMedicines.type} = ${medicine.type} then 0 else 1 end, ${specialistMedicines.id} desc`
      )
      .limit(8);

    const similar = similarRows.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      usage: s.usage,
      price: s.price,
      hasPhoto: Boolean(s.photoFileId || s.photoData),
      pharmacyId: s.pharmacyId,
      pharmacyName: s.pharmacyOrg ?? s.pharmacyName,
      pharmacyPhone: s.pharmacyPhone,
      pharmacyAddress: s.pharmacyAddress,
      ratingAvg: s.ratingAvg === null ? null : Number(s.ratingAvg),
      ratingCount: Number(s.ratingCount),
    }));

    res.json({ medicine, similar });
  } catch (err: any) {
    console.error("[medicine detail error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// GET /api/medicines/:id/photo
router.get("/:id/photo", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(404).send("Not found");

    const rows = await db
      .select()
      .from(specialistMedicines)
      .where(eq(specialistMedicines.id, id))
      .limit(1);

    const medicine = rows[0];
    if (!medicine) return res.status(404).send("Not found");

    if (medicine.photoData) {
      const comma = medicine.photoData.indexOf(",");
      const b64 = comma >= 0 ? medicine.photoData.slice(comma + 1) : medicine.photoData;
      const buf = Buffer.from(b64, "base64");
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return res.send(buf);
    }

    if (medicine.photoFileId) {
      const token = await resolveAuthBotToken();
      if (!token) return res.status(404).send("Not found");
      const filePath = await cachedFilePath(token, medicine.photoFileId);
      if (!filePath) return res.status(404).send("Not found");
      const tgRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
      if (!tgRes.ok) return res.status(404).send("Not found");
      const ab = await tgRes.arrayBuffer();
      res.setHeader("Content-Type", tgRes.headers.get("content-type") || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(Buffer.from(ab));
    }

    return res.status(404).send("Not found");
  } catch (err) {
    return res.status(404).send("Not found");
  }
});

export default router;

