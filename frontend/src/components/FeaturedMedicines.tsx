import { Pill } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { apiUrl } from "@/lib/api-config";

/**
 * Bosh sahifadagi «Agro Bozor» bloki — so'nggi qo'shilgan 4 ta mavjud dori.
 * Backend API (/api/specialists) orqali yuklanadi.
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
    pharmacyAddress: string;
    ratingAvg: number | null;
    ratingCount: number;
  }[] = [];

  try {
    const res = await fetch(apiUrl("/api/specialists?role=pharmacy"), {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = (await res.json()) as { items?: any[] };
      const pharmacies = Array.isArray(data?.items) ? data.items : [];
      const collected: typeof items = [];

      for (const p of pharmacies) {
        for (const m of p.medicines || []) {
          if (m.status !== "bor") continue;
          collected.push({
            id: m.id,
            name: m.name,
            type: m.type,
            price: m.price,
            usage: m.usage,
            hasPhoto: Boolean(m.hasPhoto),
            pharmacyId: p.id,
            pharmacyName: p.organization || p.name,
            pharmacyPhone: p.phone,
            pharmacyAddress: p.address,
            ratingAvg: p.ratingAvg,
            ratingCount: p.ratingCount || 0,
          });
          if (collected.length >= 4) break;
        }
        if (collected.length >= 4) break;
      }
      items = collected;
    }
  } catch {
    return null;
  }

  if (items.length === 0) return null;

  return (
    <div className="mt-7 web:mt-10">
      <div className="flex items-end justify-between">
        <p className="ios-section-title m-0">Dorilar</p>
        <a
          href="/dorilar"
          className="flex items-center gap-1 text-[13px] font-bold text-[var(--brand-green)]"
        >
          Barchasi →
        </a>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3.5 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 web:grid-cols-4 web:gap-4.5">
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
            pharmacy={{
              id: m.pharmacyId,
              name: m.pharmacyName,
              phone: m.pharmacyPhone,
              address: m.pharmacyAddress,
              ratingAvg: m.ratingAvg,
              ratingCount: m.ratingCount,
            }}
          />
        ))}
      </div>

      <a href="/dorilar" className="mt-3 block">
        <button className="ios-btn yellow w-full" style={{ padding: "15px", fontSize: 15 }}>
          <Pill size={17} /> Barcha dorilarni ko&apos;rish — buyurtma berish
        </button>
      </a>
    </div>
  );
}
