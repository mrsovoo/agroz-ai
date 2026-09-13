import { NextResponse } from "next/server";
import { db } from "@/db";
import { medicines, pharmacies, pharmacyStocks } from "@/db/schema";
import { eq, ilike, or, inArray } from "drizzle-orm";
import { ensureSeed } from "@/lib/seed";
import { withApiErrors } from "@/lib/api";
import { clampRadiusKm, distanceKm, parseCoords, roundKm } from "@/lib/geo";

export const dynamic = "force-dynamic";

export type PharmacyDto = {
  id: number;
  name: string;
  kind: string;
  lat: number;
  lng: number;
  phone: string;
  address: string;
  specialist: string | null;
  workHours: string | null;
  distanceKm: number | null;
  stock: { medicine: string; status: string; price: number | null }[];
};

export const GET = withApiErrors(async (req: Request) => {
  await ensureSeed();
  const url = new URL(req.url);
  const coords = parseCoords(url.searchParams.get("lat"), url.searchParams.get("lng"));
  // Yaqin atrof qidiruvi 5 km bilan cheklangan — undan uzoq nuqtalar qaytarilmaydi.
  const radiusKm = clampRadiusKm(url.searchParams.get("radius"));
  const kind = url.searchParams.get("kind");
  const meds = url.searchParams.getAll("med").filter(Boolean);

  const allPharmacies = await db.select().from(pharmacies);
  const filtered = kind && kind !== "all" ? allPharmacies.filter((p) => p.kind === kind) : allPharmacies;

  let stockMap = new Map<number, { medicine: string; status: string; price: number | null }[]>();
  if (meds.length > 0) {
    const matched = await db
      .select()
      .from(medicines)
      .where(or(...meds.map((m) => ilike(medicines.name, `%${m.split(" ")[0]}%`))));
    if (matched.length > 0) {
      const ids = matched.map((m) => m.id);
      const stocks = await db
        .select()
        .from(pharmacyStocks)
        .where(inArray(pharmacyStocks.medicineId, ids));
      const nameById = new Map(matched.map((m) => [m.id, m.name]));
      stockMap = new Map();
      for (const s of stocks) {
        const list = stockMap.get(s.pharmacyId) ?? [];
        list.push({
          medicine: nameById.get(s.medicineId) ?? "",
          status: s.status,
          price: s.price,
        });
        stockMap.set(s.pharmacyId, list);
      }
    }
  }

  const items: PharmacyDto[] = filtered
    .map((p) => ({
      id: p.id,
      name: p.name,
      kind: p.kind,
      lat: p.lat,
      lng: p.lng,
      phone: p.phone,
      address: p.address,
      specialist: p.specialist,
      workHours: p.workHours,
      distanceKm: coords ? roundKm(distanceKm(coords.lat, coords.lng, p.lat, p.lng)) : null,
      stock: stockMap.get(p.id) ?? [],
    }))
    // Koordinata bo'lsa faqat radius ichidagilar qoladi (masofa noma'lum bo'lsa — hammasi).
    .filter((p) => p.distanceKm === null || p.distanceKm <= radiusKm)
    .sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));

  return NextResponse.json(
    { items, radiusKm },
    // Dorixonalar ro'yxati tez o'zgarmaydi — CDN'da 5 daqiqa keshlaymiz.
    // Kuchsiz internetda qayta ochishlar deyarli bir zumda bo'ladi.
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
});

export const POST = withApiErrors(async (req: Request) => {
  const body = (await req.json()) as { id?: number };
  if (!body.id) return NextResponse.json({ error: "id kerak" }, { status: 400 });
  const rows = await db
    .select()
    .from(pharmacyStocks)
    .innerJoin(medicines, eq(medicines.id, pharmacyStocks.medicineId))
    .where(eq(pharmacyStocks.pharmacyId, body.id));
  return NextResponse.json({
    items: rows.map((r) => ({
      medicine: r.medicines.name,
      type: r.medicines.type,
      status: r.pharmacy_stocks.status,
      price: r.pharmacy_stocks.price,
    })),
  });
});
