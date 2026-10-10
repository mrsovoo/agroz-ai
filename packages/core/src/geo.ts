import { MAX_NEARBY_RADIUS_KM, NEARBY_RADIUS_KM } from "./constants";

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function roundKm(km: number): number {
  return Math.round(km * 10) / 10;
}

export function clampRadiusKm(raw: unknown): number {
  const value = typeof raw === "string" ? parseFloat(raw) : typeof raw === "number" ? raw : NaN;
  if (!Number.isFinite(value) || value <= 0) return NEARBY_RADIUS_KM;
  return Math.min(value, MAX_NEARBY_RADIUS_KM);
}

export function parseCoords(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  const a = typeof lat === "string" ? parseFloat(lat) : typeof lat === "number" ? lat : NaN;
  const b = typeof lng === "string" ? parseFloat(lng) : typeof lng === "number" ? lng : NaN;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (a < -90 || a > 90 || b < -180 || b > 180) return null;
  return { lat: a, lng: b };
}
