import Link from "next/link";
import { db } from "@/db";
import { specialistMedicines, specialists } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { ArrowRight, Pill, Sprout, Store } from "lucide-react";

/**
 * Bosh sahifadagi «Dorilar» bloki — so'nggi qo'shilgan 4 ta mavjud dori.
 * Har bir kartochka dorixona nomi va narxi bilan; «Barchasi» /dorilar sahifasiga olib boradi.
 */
export default async function FeaturedMedicines() {
  let items: {
    id: number;
    name: string;
    type: string;
    price: number | null;
    hasPhoto: boolean;
    pharmacyName: string;
  }[] = [];

  try {
    const rows = await db
      .select({
        id: specialistMedicines.id,
        name: specialistMedicines.name,
        type: specialistMedicines.type,
        price: specialistMedicines.price,
        photoFileId: specialistMedicines.photoFileId,
        pharmacyName: specialists.organization,
        contactName: specialists.name,
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
      hasPhoto: Boolean(r.photoFileId),
      pharmacyName: r.pharmacyName ?? r.contactName,
    }));
  } catch {
    // Baza bo'sh yoki ulanmagan — blok umuman ko'rinmaydi.
    return null;
  }

  if (items.length === 0) return null;

  return (
    <div className="mt-7 web:mt-10">
      <div className="flex items-end justify-between">
        <p className="ios-section-title m-0">Dorilar bozori</p>
        <Link
          href="/dorilar"
          className="flex items-center gap-1 text-[13px] font-bold text-[var(--brand-green)]"
        >
          Barchasi <ArrowRight size={14} />
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 web:grid-cols-4">
        {items.map((m) => (
          <Link key={m.id} href="/dorilar" className="block">
            <div className="hover-lift flex h-full flex-col rounded-[22px] bg-white p-3.5 shadow-sm transition-transform active:scale-[0.98]">
              <div className="flex items-start justify-between">
                {m.hasPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/medicines/${m.id}/photo`}
                    alt={m.name}
                    className="h-16 w-16 rounded-2xl object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span
                    className="flex h-16 w-16 items-center justify-center rounded-2xl"
                    style={{
                      background:
                        m.type === "animal" ? "var(--brand-yellow-soft)" : "var(--brand-green-soft)",
                      color: m.type === "animal" ? "var(--brand-ink)" : "var(--brand-green)",
                    }}
                  >
                    {m.type === "animal" ? <Pill size={26} /> : <Sprout size={26} />}
                  </span>
                )}
                {m.price ? (
                  <span className="rounded-full bg-[var(--brand-green-soft)] px-2 py-0.5 text-[11px] font-black text-[var(--brand-green)]">
                    {new Intl.NumberFormat("ru-RU").format(m.price).replace(/\u00a0/g, " ")} so&apos;m
                  </span>
                ) : null}
              </div>
              <p className="mt-2 line-clamp-2 text-[14.5px] font-bold leading-tight text-[var(--brand-ink)]">
                {m.name}
              </p>
              <p className="mt-auto flex items-center gap-1 pt-1.5 text-[11.5px] text-[var(--brand-muted)]">
                <Store size={11} className="shrink-0" />
                <span className="line-clamp-1">{m.pharmacyName}</span>
              </p>
            </div>
          </Link>
        ))}
      </div>

      <Link href="/dorilar" className="mt-3 block">
        <button className="ios-btn yellow w-full" style={{ padding: "15px", fontSize: 15 }}>
          <Pill size={17} /> Dorilar bozori — savatga qo&apos;shib buyurtma berish
        </button>
      </Link>
    </div>
  );
}
