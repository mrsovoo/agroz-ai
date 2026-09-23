/**
 * `@agroz_auth_bot` orqali ro'yxatdan o'tgan mutaxassis va dorixona egalari
 * bilan ishlash: saqlash, yangilash, yaqin atrofdagilarni qidirish va
 * dorixona egalari qo'shgan dorilarni boshqarish.
 */

import { db } from "@/db";
import { specialistMedicines, specialistRatings, specialists } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { clampRadiusKm, distanceKm, roundKm } from "@/lib/geo";

/**
 * Tajriba va reytingga qarab tavsiya radiusi: asos 5 km, yuqori ishonchda
 * tajribali mutaxassislar uchun 15 km gacha kengayadi.
 */
export function recommendationRadiusKm(opts: {
  confidence: number | null;
  severity: string | null;
}): number {
  const confidence = opts.confidence ?? 0;
  const severe = opts.severity === "yuqori";
  // Yuqori ishonch yoki jiddiy holat — tajribalilarga 15 km gacha.
  if (confidence >= 80 || severe) return 15;
  // O'rta ishonch — 10 km.
  if (confidence >= 60) return 10;
  // Past ishonch — standart 5 km.
  return 5;
}

export const SPECIALIST_ROLES = ["specialist", "pharmacy"] as const;
export type SpecialistRole = (typeof SPECIALIST_ROLES)[number];

export function isSpecialistRole(value: unknown): value is SpecialistRole {
  return value === "specialist" || value === "pharmacy";
}

export type SpecialistInput = {
  telegramId: number;
  name: string;
  phone: string;
  role: SpecialistRole;
  specialty: string | null;
  education?: string | null;
  bio?: string | null;
  /** crop | animal | both — kimga yordam beradi. */
  helpsWith?: "crop" | "animal" | "both";
  experienceYears?: number | null;
  organization: string | null;
  address: string;
  lat: number;
  lng: number;
  workHours?: string | null;
};

export type MedicineDto = {
  id: number;
  name: string;
  status: string;
  hasPhoto: boolean;
  /** crop | animal | general — kim uchun. */
  type: string;
  /** Nima uchun ishlatiladi (mijozga ko'rinadi). */
  usage: string | null;
  /** Narx so'mda — dorixona egasi yozgan bo'lsa ko'rinadi. */
  price: number | null;
  /** Dori qoldig'i (dona/kg). */
  stock: number;
  stockUnit: string;
};

export type SpecialistDto = {
  id: number;
  name: string;
  phone: string;
  role: string;
  specialty: string | null;
  /** Qayerda o'qigan/tamomlagan. */
  education: string | null;
  /** Qisqa bio: nimalarni biladi, qanday yordam beradi. */
  bio: string | null;
  /** crop | animal | both — kimga yordam beradi. */
  helpsWith: string;
  /** Tajriba yillari. */
  experienceYears: number | null;
  organization: string | null;
  address: string;
  lat: number;
  lng: number;
  workHours: string | null;
  distanceKm: number | null;
  /**
   * `true` — foydalanuvchi radiusidan tashqarida: ko'rinadi, lekin qulflangan
   * holatda (yo'nalish o'rniga qo'ng'iroq tavsiya etiladi).
   */
  locked: boolean;
  /** Mutaxassis ayni vaqtda boshqa buyurtma ustida ishlayotgani (bandligi). */
  isBusy: boolean;
  /** Reyting: 1–5 yulduz o'rtachasi (ovoz bo'lmasa null). */
  ratingAvg: number | null;
  /** Reyting ovozlari soni. */
  ratingCount: number;
  medicines: MedicineDto[];
};

/** Telegram hisobi bo'yicha profilni yaratadi yoki yangilaydi (bitta profil qoidasi). */
export async function upsertSpecialist(input: SpecialistInput & { isApproved?: boolean }) {
  const existing = await getSpecialistByTelegramId(input.telegramId);
  const isApproved =
    input.isApproved !== undefined
      ? input.isApproved
      : (existing?.isApproved ?? false);

  const values = {
    telegramId: input.telegramId,
    name: input.name,
    phone: input.phone,
    role: input.role,
    specialty: input.specialty,
    education: input.education ?? null,
    bio: input.bio ?? null,
    helpsWith: input.helpsWith ?? "both",
    experienceYears: input.experienceYears ?? null,
    organization: input.organization,
    address: input.address,
    lat: input.lat,
    lng: input.lng,
    workHours: input.workHours ?? "09:00 - 18:00",
    isActive: true,
    isApproved,
    updatedAt: new Date(),
  };
  const rows = await db
    .insert(specialists)
    .values(values)
    .onConflictDoUpdate({ target: specialists.telegramId, set: values })
    .returning();
  return rows[0];
}

/** Mutaxassis yoki dorixona profilining ma'lum maydonlarini qisman yangilash. */
export async function updateSpecialistFields(
  telegramId: number,
  fields: Partial<Omit<SpecialistInput, "telegramId">>,
) {
  const values = {
    ...fields,
    updatedAt: new Date(),
  };
  const rows = await db
    .update(specialists)
    .set(values)
    .where(eq(specialists.telegramId, telegramId))
    .returning();
  return rows[0] ?? null;
}

/**
 * Profilingizni o'chirish — foydalanuvchining o'zi o'chiradi.
 * Jadvaldan butunlay o'chiriladi (qayta ro'yxatdan o'tsa yangi profil yaratiladi).
 * Dorixonaning dorilari ham o'chadi.
 */
export async function deleteSpecialist(telegramId: number): Promise<boolean> {
  const profile = await getSpecialistByTelegramId(telegramId);
  if (!profile) return false;
  await db.delete(specialistMedicines).where(eq(specialistMedicines.specialistId, profile.id));
  await db.delete(specialists).where(eq(specialists.id, profile.id));
  return true;
}

/** Dorixonaning bittа dorini o'chirish. Egalik telegramId orqali tekshiriladi. */
export async function deleteMedicine(
  telegramId: number,
  medicineId: number,
): Promise<boolean> {
  const profile = await getSpecialistByTelegramId(telegramId);
  if (!profile || profile.role !== "pharmacy") return false;
  const rows = await db
    .delete(specialistMedicines)
    .where(
      and(
        eq(specialistMedicines.id, medicineId),
        eq(specialistMedicines.specialistId, profile.id),
      ),
    )
    .returning({ id: specialistMedicines.id });
  return rows.length > 0;
}

/**
 * Telefon raqam boshqa Telegram hisobida band emasligini tekshiradi.
 * Bir odam ikkita hisobdan ikkita profil yaratib mijozlarni chalg'itmasligi uchun.
 * `excludeTelegramId` — tahrirlashda o'zining eski hisobini hisobga olmaymiz.
 */
export async function findPhoneOwner(
  phone: string,
  excludeTelegramId?: number,
): Promise<{ telegramId: number; name: string; role: string } | null> {
  const rows = await db
    .select({
      telegramId: specialists.telegramId,
      name: specialists.name,
      role: specialists.role,
    })
    .from(specialists)
    .where(eq(specialists.phone, phone))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (excludeTelegramId !== undefined && row.telegramId === excludeTelegramId) return null;
  return row;
}

/** Dorixonaning barcha dorilari (o'chirish ro'yxati uchun). */
export async function listMedicines(telegramId: number) {
  const profile = await getSpecialistByTelegramId(telegramId);
  if (!profile || profile.role !== "pharmacy") return null;
  const rows = await db
    .select()
    .from(specialistMedicines)
    .where(eq(specialistMedicines.specialistId, profile.id))
    .orderBy(specialistMedicines.id);
  return { profile, medicines: rows };
}

export async function getSpecialistByTelegramId(telegramId: number) {
  const rows = await db
    .select()
    .from(specialists)
    .where(eq(specialists.telegramId, telegramId))
    .limit(1);
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Dorilar (faqat dorixona egalari qo'shadi)
// ---------------------------------------------------------------------------

/**
 * Dorixonaga yangi dori qo'shadi (rasm Telegram file_id, turi va ishlatilishi bilan).
 * `photoData` — normallashtirilgan rasm (1080×1450 JPEG base64), bo'lsa bazaga yoziladi.
 */
export async function addMedicine(params: {
  specialistId: number;
  name: string;
  photoFileId: string | null;
  photoData?: string | null;
  type?: "crop" | "animal" | "general";
  usage?: string | null;
  /** Narx so'mda (ixtiyoriy). */
  price?: number | null;
  stock?: number;
  stockUnit?: string;
}) {
  const rows = await db
    .insert(specialistMedicines)
    .values({
      specialistId: params.specialistId,
      name: params.name,
      photoFileId: params.photoFileId,
      photoData: params.photoData ?? null,
      type: params.type ?? "general",
      usage: params.usage ?? null,
      price: params.price ?? null,
      stock: params.stock !== undefined ? Math.max(0, params.stock) : 10,
      stockUnit: params.stockUnit || "dona",
      status: (params.stock !== undefined && params.stock <= 0) ? "yoq" : "bor",
    })
    .returning();
  return rows[0];
}

/** Dorining bor/yoq statusini almashtiradi. Egalik tekshiriladi. */
export async function setMedicineStatus(
  telegramId: number,
  medicineId: number,
  status: "bor" | "yoq",
): Promise<boolean> {
  const profile = await getSpecialistByTelegramId(telegramId);
  if (!profile || profile.role !== "pharmacy") return false;
  const rows = await db
    .update(specialistMedicines)
    .set({ status })
    .where(
      and(
        eq(specialistMedicines.id, medicineId),
        eq(specialistMedicines.specialistId, profile.id),
      ),
    )
    .returning({ id: specialistMedicines.id });
  return rows.length > 0;
}

/** Dorining narxini yangilaydi (null — narx olib tashlanadi). Egalik tekshiriladi. */
export async function setMedicinePrice(
  telegramId: number,
  medicineId: number,
  price: number | null,
): Promise<boolean> {
  const profile = await getSpecialistByTelegramId(telegramId);
  if (!profile || profile.role !== "pharmacy") return false;
  const rows = await db
    .update(specialistMedicines)
    .set({ price })
    .where(
      and(
        eq(specialistMedicines.id, medicineId),
        eq(specialistMedicines.specialistId, profile.id),
      ),
    )
    .returning({ id: specialistMedicines.id });
  return rows.length > 0;
}

export async function countMedicines(specialistId: number): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(specialistMedicines)
    .where(eq(specialistMedicines.specialistId, specialistId));
  return Number(rows[0]?.count ?? 0);
}

export async function getMedicineById(id: number) {
  const rows = await db
    .select()
    .from(specialistMedicines)
    .where(eq(specialistMedicines.id, id))
    .limit(1);
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Qidiruv
// ---------------------------------------------------------------------------

/**
 * Faol mutaxassis/dorixona egalarini qaytaradi.
 *
 * - `coords` berilsa — masofa hisoblanadi va `locked` belgilanadi: radius
 *   ichidagilar ochiq, tashqaridagilar ham RO'YXATDA QOLADI lekin qulflangan
 *   holatda ko'rinadi (mijoz telefon qilishi mumkin).
 * - `meds` berilsa — faqat shu dorilarga ega dorixonalar qoladi.
 * - Saralash: avval ochiq (masofa bo'yicha), keyin qulflanganlar (reyting,
 *   keyin masofa bo'yicha).
 */
export async function listSpecialists(opts: {
  lat?: number | null;
  lng?: number | null;
  radiusKm?: unknown;
  role?: string | null;
  meds?: string[];
}): Promise<SpecialistDto[]> {
  const rows = await db
    .select()
    .from(specialists)
    .where(and(eq(specialists.isActive, true), eq(specialists.isApproved, true)));
  const [medicineRows, ratingRows] = await Promise.all([
    db.select().from(specialistMedicines),
    db
      .select({
        specialistId: specialistRatings.specialistId,
        avg: sql<number>`avg(${specialistRatings.stars})::float`,
        count: sql<number>`count(*)::int`,
      })
      .from(specialistRatings)
      .groupBy(specialistRatings.specialistId),
  ]);

  const bySpecialist = new Map<number, MedicineDto[]>();
  for (const m of medicineRows) {
    const list = bySpecialist.get(m.specialistId) ?? [];
    list.push({
      id: m.id,
      name: m.name,
      status: m.status,
      hasPhoto: Boolean(m.photoFileId || m.photoData),
      type: m.type,
      usage: m.usage,
      price: m.price ?? null,
      stock: m.stock ?? 10,
      stockUnit: m.stockUnit ?? "dona",
    });
    bySpecialist.set(m.specialistId, list);
  }

  const ratingBySpecialist = new Map<number, { avg: number; count: number }>();
  for (const r of ratingRows) {
    ratingBySpecialist.set(r.specialistId, { avg: Number(r.avg), count: r.count });
  }

  const role = opts.role && isSpecialistRole(opts.role) ? opts.role : null;
  let filtered = role ? rows.filter((s) => s.role === role) : rows;

  // Dori bo'yicha filtr — ro'yxatdagi dorixonalar shu dorilarga ega bo'lishi kerak.
  const wanted = (opts.meds ?? []).map((m) => m.trim().toLowerCase()).filter(Boolean);
  if (wanted.length > 0) {
    filtered = filtered.filter((s) => {
      const meds = bySpecialist.get(s.id) ?? [];
      return wanted.some((w) =>
        meds.some((m) => m.status === "bor" && m.name.toLowerCase().includes(w)),
      );
    });
  }

  const hasCoords =
    typeof opts.lat === "number" &&
    Number.isFinite(opts.lat) &&
    typeof opts.lng === "number" &&
    Number.isFinite(opts.lng);

  const withMeta = (s: (typeof filtered)[number], distance: number | null, locked: boolean): SpecialistDto => ({
    id: s.id,
    name: s.name,
    phone: s.phone,
    role: s.role,
    specialty: s.specialty,
    education: s.education,
    bio: s.bio,
    helpsWith: s.helpsWith ?? "both",
    experienceYears: s.experienceYears ?? null,
    organization: s.organization,
    address: s.address,
    lat: s.lat,
    lng: s.lng,
    workHours: s.workHours,
    distanceKm: distance,
    locked,
    isBusy: s.isBusy ?? false,
    ratingAvg: ratingBySpecialist.get(s.id)?.avg ?? null,
    ratingCount: ratingBySpecialist.get(s.id)?.count ?? 0,
    medicines: bySpecialist.get(s.id) ?? [],
  });

  if (!hasCoords) {
    // Lokatsiyasiz: reyting bo'yicha (ko'p ovozli va yuqori), keyin yangi qo'shilganlar.
    return filtered
      .map((s) => withMeta(s, null, false))
      .sort((a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0) || b.ratingCount - a.ratingCount);
  }

  const lat = opts.lat as number;
  const lng = opts.lng as number;
  const radiusKm = clampRadiusKm(opts.radiusKm);

  const withDistance = filtered.map((s) => {
    const d = roundKm(distanceKm(lat, lng, s.lat, s.lng));
    // Tajribali (5+ yil) va reytingi yaxshi (4+) mutaxassislar uchun radius kengayadi
    // (lekin 25 km dan oshmaydi).
    const extended =
      radiusKm < 15 &&
      (s.experienceYears ?? 0) >= 5 &&
      (ratingBySpecialist.get(s.id)?.count ?? 0) > 0 &&
      (ratingBySpecialist.get(s.id)?.avg ?? 0) >= 4;
    const limit = extended ? Math.min(radiusKm * 3, 15) : radiusKm;
    return withMeta(s, d, d > limit);
  });

  const open = withDistance
    .filter((s) => !s.locked)
    .sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
  const locked = withDistance
    .filter((s) => s.locked)
    .sort(
      (a, b) =>
        (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0) ||
        b.ratingCount - a.ratingCount ||
        (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999),
    );
  return [...open, ...locked];
}

// ---------------------------------------------------------------------------
// Reyting (1–5 yulduz)
// ---------------------------------------------------------------------------

/**
 * Mijoz ovozini saqlaydi. Bir mijoz (anonim kalit) bir mutaxassisdga bitta ovoz —
 * qayta bersa yangilanadi. Yangi o'rtachani qaytaradi.
 */
export async function rateSpecialist(
  specialistId: number,
  raterKey: string,
  stars: number,
): Promise<{ avg: number; count: number } | null> {
  const clamped = Math.max(1, Math.min(5, Math.round(stars)));
  const exists = await db
    .select({ id: specialists.id })
    .from(specialists)
    .where(and(eq(specialists.id, specialistId), eq(specialists.isActive, true)))
    .limit(1);
  if (!exists[0]) return null;

  await db
    .insert(specialistRatings)
    .values({ specialistId, raterKey, stars: clamped, createdAt: new Date() })
    .onConflictDoUpdate({
      target: [specialistRatings.specialistId, specialistRatings.raterKey],
      set: { stars: clamped },
    });

  const agg = await db
    .select({
      avg: sql<number>`avg(${specialistRatings.stars})::float`,
      count: sql<number>`count(*)::int`,
    })
    .from(specialistRatings)
    .where(eq(specialistRatings.specialistId, specialistId));
  const row = agg[0];
  return row ? { avg: Number(row.avg), count: row.count } : null;
}
