/** Geografik masofa hisoblash va radius cheklash (Haversine). */

import { MAX_NEARBY_RADIUS_KM, NEARBY_RADIUS_KM } from "@/lib/constants";

/**
 * Ikki koordinata orasidagi masofa (kilometr).
 * Haversine formulasi — Yer radiusi 6371 km.
 */
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Masofani 0.1 km aniqlikda yaxlitlaydi. */
export function roundKm(km: number): number {
  return Math.round(km * 10) / 10;
}

/**
 * So'rovdagi radiusni o'qiydi va **hech qachon** `MAX_NEARBY_RADIUS_KM`dan
 * oshirmaydi — yaqin atrof qidiruvi maksimal 5 km bilan cheklangan.
 */
export function clampRadiusKm(raw: unknown): number {
  const value = typeof raw === "string" ? parseFloat(raw) : typeof raw === "number" ? raw : NaN;
  if (!Number.isFinite(value) || value <= 0) return NEARBY_RADIUS_KM;
  return Math.min(value, MAX_NEARBY_RADIUS_KM);
}

/** So'rovdagi lat/lng juftligi haqiqiy koordinata ekanini tekshiradi. */
export function parseCoords(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  const a = typeof lat === "string" ? parseFloat(lat) : typeof lat === "number" ? lat : NaN;
  const b = typeof lng === "string" ? parseFloat(lng) : typeof lng === "number" ? lng : NaN;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (a < -90 || a > 90 || b < -180 || b > 180) return null;
  return { lat: a, lng: b };
}
