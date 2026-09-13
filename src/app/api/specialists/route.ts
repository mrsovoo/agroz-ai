import { NextResponse } from "next/server";
import { withApiErrors } from "@/lib/api";
import { listSpecialists } from "@/lib/specialists";
import { clampRadiusKm, parseCoords } from "@/lib/geo";

export const dynamic = "force-dynamic";

/**
 * `@agroz_auth_bot` orqali ro'yxatdan o'tgan mutaxassislar.
 *
 * `lat`/`lng` berilsa — faqat 5 km radius ichidagilar (masofa bo'yicha saralangan).
 * Radius parametri berilishi mumkin, lekin 5 km dan oshirilmaydi.
 */
export const GET = withApiErrors(async (req: Request) => {
  const url = new URL(req.url);
  const coords = parseCoords(url.searchParams.get("lat"), url.searchParams.get("lng"));
  const radiusKm = clampRadiusKm(url.searchParams.get("radius"));

  const items = await listSpecialists({
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
    radiusKm,
    role: url.searchParams.get("role"),
    // Tashxisdan keyin tavsiya etilgan dorilar bo'yicha filtrlash uchun.
    meds: url.searchParams.getAll("med").filter(Boolean),
  });

  return NextResponse.json(
    { items, radiusKm },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
});
