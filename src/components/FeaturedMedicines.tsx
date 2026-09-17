import Link from "next/link";
import FadeImage from "@/components/FadeImage";
import { db } from "@/db";
import { specialistMedicines, specialists } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { ArrowRight, Pill, Sprout, Store } from "lucide-react";

/**
 * Bosh sahifadagi «Agro Bozor» bloki — so'nggi qo'shilgan 4 ta mavjud dori.
 * Kartochka: rasm tepada, ostida dori nomi, narxi va dorixona nomi.
 * «Barchasi» /dorilar (Agro Bozor) sahifasiga olib boradi.
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
        photoData: specialistMedicines.photoData,
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
      hasPhoto: Boolean(r.photoFileId || r.photoData),
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
        <p className="ios-section-title m-0">Agro Bozor</p>
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
            <div className="flex h-full flex-col overflow-hidden rounded-[22px] bg-white shadow-sm transition-transform hover-lift active:scale-[0.98]">
              {/* Rasm tepada — portret (3:4), shimmer + fade-in bilan (yo'q bo'lsa rangli placeholder) */}
              {m.hasPhoto ? (
                <FadeImage
                  src={`/api/medicines/${m.id}/photo`}
                  alt={m.name}
                  className="aspect-[3/4] w-full bg-white"
                  fit="contain"
                  fallback={
                    <div
                      className="flex h-full w-full items-center justify-center"
                      style={{
                        background:
                          m.type === "animal"
                            ? "linear-gradient(135deg,#fff7df,#ffedb3)"
                            : "linear-gradient(135deg,#f0fae8,#dcf3cf)",
                      }}
                    >
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80"
                        style={{ color: m.type === "animal" ? "var(--brand-ink)" : "var(--brand-green)" }}
                      >
                        {m.type === "animal" ? <Pill size={20} /> : <Sprout size={20} />}
                      </span>
                    </div>
                  }
                />
              ) : (
                <div
                  className="flex aspect-[3/4] w-full items-center justify-center"
                  style={{
                    background:
                      m.type === "animal"
                        ? "linear-gradient(135deg,#fff7df,#ffedb3)"
                        : "linear-gradient(135deg,#f0fae8,#dcf3cf)",
                  }}
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80"
                    style={{ color: m.type === "animal" ? "var(--brand-ink)" : "var(--brand-green)" }}
                  >
                    {m.type === "animal" ? <Pill size={20} /> : <Sprout size={20} />}
                  </span>
                </div>
              )}
              <div className="flex flex-1 flex-col p-3">
                <p className="line-clamp-2 text-[14px] font-bold leading-snug text-[var(--brand-ink)]">
                  {m.name}
                </p>
                {m.price ? (
                  <p className="mt-1 text-[14.5px] font-black text-[var(--brand-green)]">
                    {new Intl.NumberFormat("ru-RU").format(m.price).replace(/\u00a0/g, " ")} so&apos;m
                  </p>
                ) : (
                  <p className="mt-1 text-[12.5px] font-bold text-[var(--brand-muted)]">
                    Narx so&apos;rang
                  </p>
                )}
                <p className="mt-auto flex items-center gap-1 pt-1.5 text-[11.5px] text-[var(--brand-muted)]">
                  <Store size={11} className="shrink-0" />
                  <span className="line-clamp-1">{m.pharmacyName}</span>
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Link href="/dorilar" className="mt-3 block">
        <button className="ios-btn yellow w-full" style={{ padding: "15px", fontSize: 15 }}>
          <Pill size={17} /> Agro Bozorga o&apos;tish — savatga qo&apos;shib buyurtma berish
        </button>
      </Link>
    </div>
  );
}
