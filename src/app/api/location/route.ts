import { NextResponse } from "next/server";
import { withApiErrors } from "@/lib/api";
import { reverseGeocode } from "@/lib/geocode";

export const dynamic = "force-dynamic";

/**
 * Koordinatadan hudud nomini oladi ("Toshkent sh., Yunusobod" kabi).
 *
 * Nominatim'ning ishlatish siyosatiga rioya qilamiz: natija 1 soatga kesh
 * qilinadi, ya'ni bir hudud uchun daqiqada bir necha so'rov ketmaydi.
 */
export const GET = withApiErrors(async (req: Request) => {
  const url = new URL(req.url);
  const lat = parseFloat(url.searchParams.get("lat") ?? "");
  const lng = parseFloat(url.searchParams.get("lng") ?? "");

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ ok: false, place: null }, { status: 400 });
  }

  const place = await reverseGeocode(lat, lng);

  const isFull = url.searchParams.get("full") === "1";
  // Agar full=1 bo'lsa to'liq manzil, aks holda dastlabki 2 qism ("Toshkent sh., Mirzo Ulug'bek").
  const short = place ? place.split(",").slice(0, 2).join(",").trim() : null;
  const address = isFull ? place : short;

  return NextResponse.json(
    { ok: Boolean(address), place: address },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } },
  );
});
