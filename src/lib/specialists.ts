/**
 * `@agroz_auth_bot` orqali ro'yxatdan o'tgan mutaxassis va dorixona egalari
 * bilan ishlash: saqlash, yangilash, yaqin atrofdagilarni qidirish va
 * dorixona egalari qo'shgan dorilarni boshqarish.
 */

import { db } from "@/db";
import { specialistMedicines, specialists } from "@/db/schema";
import { eq } from "drizzle-orm";
import { clampRadiusKm, distanceKm, roundKm } from "@/lib/geo";

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
};

export type SpecialistDto = {
  id: number;
  name: string;
  phone: string;
  role: string;
  specialty: string | null;
  organization: string | null;
  address: string;
  lat: number;
  lng: number;
  workHours: string | null;
  distanceKm: number | null;
  medicines: MedicineDto[];
};

/** Telegram hisobi bo'yicha profilni yaratadi yoki yangilaydi (bitta profil qoidasi). */
export async function upsertSpecialist(input: SpecialistInput) {
  const values = {
    telegramId: input.telegramId,
    name: input.name,
    phone: input.phone,
    role: input.role,
    specialty: input.specialty,
    organization: input.organization,
    address: input.address,
    lat: input.lat,
    lng: input.lng,
    workHours: input.workHours ?? "09:00 - 18:00",
    isActive: true,
    updatedAt: new Date(),
  };
  const rows = await db
    .insert(specialists)
    .values(values)
    .onConflictDoUpdate({ target: specialists.telegramId, set: values })
    .returning();
  return rows[0];
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

/** Dorixonaga yangi dori qo'shadi (rasm Telegram file_id sifatida saqlanadi). */
export async function addMedicine(params: {
  specialistId: number;
  name: string;
  photoFileId: string | null;
}) {
  const rows = await db
    .insert(specialistMedicines)
    .values({
      specialistId: params.specialistId,
      name: params.name,
      photoFileId: params.photoFileId,
      status: "bor",
    })
    .returning();
  return rows[0];
}

export async function countMedicines(specialistId: number): Promise<number> {
  const rows = await db
    .select({ id: specialistMedicines.id })
    .from(specialistMedicines)
    .where(eq(specialistMedicines.specialistId, specialistId));
  return rows.length;
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
 * - `coords` berilsa — faqat radius ichidagilar (radius 5 km dan oshmaydi).
 * - `meds` berilsa — faqat shu dorilarga ega dorixonalar qoladi.
 */
export async function listSpecialists(opts: {
  lat?: number | null;
  lng?: number | null;
  radiusKm?: unknown;
  role?: string | null;
  meds?: string[];
}): Promise<SpecialistDto[]> {
  const rows = await db.select().from(specialists).where(eq(specialists.isActive, true));
  const medicineRows = await db.select().from(specialistMedicines);

  const bySpecialist = new Map<number, MedicineDto[]>();
  for (const m of medicineRows) {
    const list = bySpecialist.get(m.specialistId) ?? [];
    list.push({ id: m.id, name: m.name, status: m.status, hasPhoto: Boolean(m.photoFileId) });
    bySpecialist.set(m.specialistId, list);
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

  const withMedicines = (s: (typeof filtered)[number], distance: number | null): SpecialistDto => ({
    id: s.id,
    name: s.name,
    phone: s.phone,
    role: s.role,
    specialty: s.specialty,
    organization: s.organization,
    address: s.address,
    lat: s.lat,
    lng: s.lng,
    workHours: s.workHours,
    distanceKm: distance,
    medicines: bySpecialist.get(s.id) ?? [],
  });

  if (!hasCoords) return filtered.map((s) => withMedicines(s, null));

  const lat = opts.lat as number;
  const lng = opts.lng as number;
  const radiusKm = clampRadiusKm(opts.radiusKm);

  return filtered
    .map((s) => withMedicines(s, roundKm(distanceKm(lat, lng, s.lat, s.lng))))
    .filter((s) => (s.distanceKm ?? Infinity) <= radiusKm)
    .sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
}
