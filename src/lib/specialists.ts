/**
 * `@agroz_auth_bot` orqali ro'yxatdan o'tgan mutaxassis va dorixona egalari
 * bilan ishlash: saqlash, yangilash va yaqin atrofdagilarni qidirish.
 */

import { db } from "@/db";
import { specialists } from "@/db/schema";
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

/**
 * Faol mutaxassis/dorixona egalarini qaytaradi.
 * `coords` berilsa — faqat radius ichidagilar, masofa bo'yicha saralangan holda.
 * Radius hech qachon 5 km dan oshmaydi.
 */
export async function listSpecialists(opts: {
  lat?: number | null;
  lng?: number | null;
  radiusKm?: unknown;
  role?: string | null;
}): Promise<SpecialistDto[]> {
  const rows = await db.select().from(specialists).where(eq(specialists.isActive, true));

  const role = opts.role && isSpecialistRole(opts.role) ? opts.role : null;
  const filtered = role ? rows.filter((s) => s.role === role) : rows;

  const hasCoords =
    typeof opts.lat === "number" &&
    Number.isFinite(opts.lat) &&
    typeof opts.lng === "number" &&
    Number.isFinite(opts.lng);

  if (!hasCoords) {
    return filtered.map((s) => ({
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
      distanceKm: null,
    }));
  }

  const lat = opts.lat as number;
  const lng = opts.lng as number;
  const radiusKm = clampRadiusKm(opts.radiusKm);

  return filtered
    .map((s) => ({
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
      distanceKm: roundKm(distanceKm(lat, lng, s.lat, s.lng)),
    }))
    .filter((s) => (s.distanceKm ?? Infinity) <= radiusKm)
    .sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
}
