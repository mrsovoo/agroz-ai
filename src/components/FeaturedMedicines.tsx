import { db } from "@/db";
import { specialistMedicines, specialists } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { Pill, Sprout, Store } from "lucide-react";
import FadeImage from "@/components/FadeImage";
import AddToCartButton from "@/components/AddToCartButton";
import { shortSum } from "@/lib/format";

/**
 * Bosh sahifadagi «Agro Bozor» bloki — so'nggi qo'shilgan 4 ta mavjud dori.
 * Kartochka: 250×350 gacha rasm, ostida nomi, narxi, tavsifi va «Savatga» tugmasi.
 * Savat umumiy — Agro Bozordagi savat bilan sinxron ishlaydi.
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
          <div key={m.id} className="flex h-full flex-col overflow-hidden rounded-[22px] bg-white shadow-sm">
            {/* Rasm — maksimal 250×350 px, markazda, nisbat buzilmaydi */}
            <a href="/dorilar" className="block" aria-label={m.name}>
              {m.hasPhoto ? (
                <FadeImage
                  src={`/api/medicines/${m.id}/photo`}
                  alt={m.name}
                  className="mx-auto aspect-[5/7] max-h-[350px] w-full max-w-[250px] bg-white p-2"
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
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80"
                        style={{ color: m.type === "animal" ? "var(--brand-ink)" : "var(--brand-green)" }}
                      >
                        {m.type === "animal" ? <Pill size={22} /> : <Sprout size={22} />}
                      </span>
                    </div>
                  }
                />
              ) : (
                <div
                  className="mx-auto flex aspect-[5/7] max-h-[350px] w-full max-w-[250px] items-center justify-center p-2"
                  style={{
                    background:
                      m.type === "animal"
                        ? "linear-gradient(135deg,#fff7df,#ffedb3)"
                        : "linear-gradient(135deg,#f0fae8,#dcf3cf)",
                  }}
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80"
                    style={{ color: m.type === "animal" ? "var(--brand-ink)" : "var(--brand-green)" }}
                  >
                    {m.type === "animal" ? <Pill size={22} /> : <Sprout size={22} />}
                  </span>
                </div>
              )}
            </a>

            {/* Nomi, narxi, tavsifi */}
            <div className="flex flex-1 flex-col p-3">
              <p className="line-clamp-2 text-[14px] font-bold leading-snug text-[var(--brand-ink)]">
                {m.name}
              </p>
              {m.price ? (
                <p className="mt-1 text-[14.5px] font-black text-[var(--brand-green)]">
                  {shortSum(m.price)} so&apos;m
                </p>
              ) : (
                <p className="mt-1 text-[12.5px] font-bold text-[var(--brand-muted)]">
                  Narx so&apos;rang
                </p>
              )}
              {m.usage && (
                <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-[var(--brand-muted)]">
                  {m.usage}
                </p>
              )}
              <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--brand-muted)]">
                <Store size={11} className="shrink-0" />
                <span className="line-clamp-1">{m.pharmacyName}</span>
              </p>

              {/* Savatga — umumiy savat (Agro Bozor bilan bir xil) */}
              <AddToCartButton
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
            </div>
          </div>
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
