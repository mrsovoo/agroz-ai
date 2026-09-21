import { db } from "@/db";
import { specialistMedicines, specialists } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { Pill } from "lucide-react";
import ProductCard from "@/components/ProductCard";

/**
 * Bosh sahifadagi «Agro Bozor» bloki — so'nggi qo'shilgan 4 ta mavjud dori.
 * Kartochkalar **ProductCard** bilan chiziladi — Agro Bozor va tafsilot
 * sahifasidagi «o'xshash mahsulotlar» bilan aynan bir xil ko'rinishda:
 * 260×450 kartochka, 250×350 rasm, nom, narx, tavsif, ❤️ va 🛒 Savatga.
 */
export default async function FeaturedMedicines() {
  let items: {
    id: number;
    name: string;
    type: string;
    price: number | null;
    usage: string | null;
    hasPhoto: boolean;
    pharmacyId: number;
    pharmacyName: string;
    pharmacyPhone: string;
  }[] = [];

  try {
    const rows = await db
      .select({
        id: specialistMedicines.id,
        name: specialistMedicines.name,
        type: specialistMedicines.type,
        price: specialistMedicines.price,
        usage: specialistMedicines.usage,
        photoFileId: specialistMedicines.photoFileId,
        photoData: specialistMedicines.photoData,
        pharmacyId: specialists.id,
        pharmacyOrg: specialists.organization,
        pharmacyName: specialists.name,
        pharmacyPhone: specialists.phone,
      })
      .from(specialistMedicines)
      .innerJoin(specialists, eq(specialists.id, specialistMedicines.specialistId))
      .where(and(eq(specialistMedicines.status, "bor"), eq(specialists.isActive, true)))
      .orderBy(sql`${specialistMedicines.id} DESC`)
      .limit(4);
    items = rows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      price: r.price,
      usage: r.usage,
      hasPhoto: Boolean(r.photoFileId || r.photoData),
      pharmacyId: r.pharmacyId,
      pharmacyName: r.pharmacyOrg ?? r.pharmacyName,
      pharmacyPhone: r.pharmacyPhone,
    }));
  } catch {
    // Baza bo'sh yoki ulanmagan — blok umuman ko'rinmaydi.
    return null;
  }

  if (items.length === 0) return null;

  return (
    <div className="mt-7 web:mt-10">
      <div className="flex items-end justify-between">
        <p className="ios-section-title m-0">Agro Bozor</p>
        <a
          href="/dorilar"
          className="flex items-center gap-1 text-[13px] font-bold text-[var(--brand-green)]"
        >
          Barchasi →
        </a>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 web:grid-cols-4">
        {items.map((m) => (
          <ProductCard
            key={m.id}
            medicine={{
              id: m.id,
              name: m.name,
              price: m.price,
              type: m.type,
              hasPhoto: m.hasPhoto,
              usage: m.usage,
              status: "bor",
            }}
            pharmacy={{ id: m.pharmacyId, name: m.pharmacyName, phone: m.pharmacyPhone }}
          />
        ))}
      </div>

      <a href="/dorilar" className="mt-3 block">
        <button className="ios-btn yellow w-full" style={{ padding: "15px", fontSize: 15 }}>
          <Pill size={17} /> Agro Bozorga o&apos;tish — savatga qo&apos;shib buyurtma berish
        </button>
      </a>
    </div>
  );
}
