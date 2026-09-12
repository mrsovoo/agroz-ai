import { NextResponse } from "next/server";
import { db } from "@/db";
import { medicines, pharmacies, pharmacyStocks } from "@/db/schema";
import { eq, ilike, or, inArray } from "drizzle-orm";
import { ensureSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

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

export async function GET(req: Request) {
  await ensureSeed();
  const url = new URL(req.url);
  const lat = parseFloat(url.searchParams.get("lat") ?? "");
  const lng = parseFloat(url.searchParams.get("lng") ?? "");
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

  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
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
      distanceKm: hasCoords ? Math.round(distanceKm(lat, lng, p.lat, p.lng) * 10) / 10 : null,
      stock: stockMap.get(p.id) ?? [],
    }))
    .sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
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
}
