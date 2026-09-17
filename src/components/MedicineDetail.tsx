import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/db";
import { specialistMedicines, specialists } from "@/db/schema";
import { and, eq, ne, sql } from "drizzle-orm";
import { ArrowLeft, MapPin, Phone, Pill, ShieldCheck, Sprout, Store } from "lucide-react";
import FadeImage from "@/components/FadeImage";
import ProductCardActions from "@/components/ProductCardActions";
import ProductCard from "@/components/ProductCard";
import { shortSum } from "@/lib/format";

export type MedicineDetailData = {
  id: number;
  name: string;
  type: string;
  usage: string | null;
  price: number | null;
  hasPhoto: boolean;
  status: string;
  pharmacyId: number;
  pharmacyOrg: string | null;
  pharmacyName: string;
  pharmacyPhone: string;
  pharmacyAddress: string;
  workHours: string | null;
  ratingAvg: number | null;
  ratingCount: number;
};

export async function getMedicineDetail(id: number): Promise<MedicineDetailData | null> {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  const rows = await db
    .select({
      id: specialistMedicines.id,
      name: specialistMedicines.name,
      type: specialistMedicines.type,
      usage: specialistMedicines.usage,
      price: specialistMedicines.price,
      status: specialistMedicines.status,
      photoFileId: specialistMedicines.photoFileId,
      photoData: specialistMedicines.photoData,
      pharmacyId: specialists.id,
      pharmacyOrg: specialists.organization,
      pharmacyName: specialists.name,
      pharmacyPhone: specialists.phone,
      pharmacyAddress: specialists.address,
      workHours: specialists.workHours,
      ratingAvg: sql<number | null>`(
        select avg(r.stars)::float from specialist_ratings r where r.specialist_id = ${specialists.id}
      )`,
      ratingCount: sql<number>`(
        select count(*)::int from specialist_ratings r where r.specialist_id = ${specialists.id}
      )`,
    })
    .from(specialistMedicines)
    .innerJoin(specialists, eq(specialists.id, specialistMedicines.specialistId))
    .where(and(eq(specialistMedicines.id, id), eq(specialists.isActive, true)))
    .limit(1);
  const r = rows[0];
  if (!r || r.status !== "bor") return null;
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    usage: r.usage,
    price: r.price,
    hasPhoto: Boolean(r.photoFileId || r.photoData),
    status: r.status,
    pharmacyId: r.pharmacyId,
    pharmacyOrg: r.pharmacyOrg,
    pharmacyName: r.pharmacyOrg ?? r.pharmacyName,
    pharmacyPhone: r.pharmacyPhone,
    pharmacyAddress: r.pharmacyAddress,
    workHours: r.workHours,
    ratingAvg: r.ratingAvg === null ? null : Number(r.ratingAvg),
    ratingCount: Number(r.ratingCount),
  };
}

/** O'xshash mahsulotlar: avval xuddi shu turdagi, keyin boshqalar (shu mahsulotsiz). */
export async function getSimilarMedicines(
  medicine: MedicineDetailData,
  limit = 8,
): Promise<
  {
    id: number;
    name: string;
    type: string;
    usage: string | null;
    price: number | null;
    hasPhoto: boolean;
    pharmacyId: number;
    pharmacyName: string;
    pharmacyPhone: string;
  }[]
> {
  const rows = await db
    .select({
      id: specialistMedicines.id,
      name: specialistMedicines.name,
      type: specialistMedicines.type,
      usage: specialistMedicines.usage,
      price: specialistMedicines.price,
      status: specialistMedicines.status,
      photoFileId: specialistMedicines.photoFileId,
      photoData: specialistMedicines.photoData,
      pharmacyId: specialists.id,
      pharmacyOrg: specialists.organization,
      pharmacyName: specialists.name,
      pharmacyPhone: specialists.phone,
    })
    .from(specialistMedicines)
    .innerJoin(specialists, eq(specialists.id, specialistMedicines.specialistId))
    .where(
      and(
        eq(specialistMedicines.status, "bor"),
        eq(specialists.isActive, true),
        ne(specialistMedicines.id, medicine.id),
      ),
    )
    .orderBy(
      sql`case when ${specialistMedicines.type} = ${medicine.type} then 0 else 1 end, ${specialistMedicines.id} desc`,
    )
    .limit(Math.max(1, Math.min(12, limit)));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    usage: r.usage,
    price: r.price,
    hasPhoto: Boolean(r.photoFileId || r.photoData),
    pharmacyId: r.pharmacyId,
    pharmacyName: r.pharmacyOrg ?? r.pharmacyName,
    pharmacyPhone: r.pharmacyPhone,
  }));
}

export default async function MedicineDetail({ medicine }: { medicine: MedicineDetailData }) {
  const similar = await getSimilarMedicines(medicine, 8);

  return (
    <main className="px-5 pb-6">
      {/* Orqaga */}
      <Link
        href="/dorilar"
        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[13px] font-bold text-[var(--brand-ink)] shadow-sm active:scale-95"
      >
        <ArrowLeft size={15} /> Bozorga qaytish
      </Link>

      {/* Mahsulot: chapda rasm, o'ngda ma'lumot (katta ekranda ustma-ust emas) */}
      <div className="mt-3 grid gap-4 web:grid-cols-[420px_minmax(0,1fr)] web:gap-8">
        {/* Katta rasm — 5:7 (250×350 proportsiyasining kattalashtirilgani), oq fon */}
        <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
          {medicine.hasPhoto ? (
            <FadeImage
              src={`/api/medicines/${medicine.id}/photo`}
              alt={medicine.name}
              className="aspect-[5/7] w-full bg-white"
              fit="contain"
              fallback={
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{
                    background:
                      medicine.type === "animal"
                        ? "linear-gradient(135deg,#fff7df,#ffedb3)"
                        : "linear-gradient(135deg,#f0fae8,#dcf3cf)",
                  }}
                >
                  <span
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80"
                    style={{ color: medicine.type === "animal" ? "var(--brand-ink)" : "var(--brand-green)" }}
                  >
                    <Pill size={30} />
                  </span>
                </div>
              }
            />
          ) : (
            <div
              className="flex aspect-[5/7] w-full items-center justify-center"
              style={{
                background:
                  medicine.type === "animal"
                    ? "linear-gradient(135deg,#fff7df,#ffedb3)"
                    : "linear-gradient(135deg,#f0fae8,#dcf3cf)",
              }}
            >
              <span
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80"
                style={{ color: medicine.type === "animal" ? "var(--brand-ink)" : "var(--brand-green)" }}
              >
                <Pill size={30} />
              </span>
            </div>
          )}
        </div>

        {/* Ma'lumotlar */}
        <div className="ios-card p-5 web:self-start">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-[20px] font-black leading-tight text-[var(--brand-ink)] web:text-[26px]">
              {medicine.name}
            </h1>
            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{
                background:
                  medicine.type === "animal"
                    ? "var(--brand-yellow-soft)"
                    : medicine.type === "crop"
                      ? "var(--brand-green-soft)"
                      : "#ccfbf1",
                color:
                  medicine.type === "animal"
                    ? "var(--brand-ink)"
                    : medicine.type === "crop"
                      ? "var(--brand-green)"
                      : "#0d9488",
              }}
            >
              {medicine.type === "animal" ? "🐄 Hayvon" : medicine.type === "crop" ? "🌱 Ekin" : "📦 Umumiy"}
            </span>
          </div>

          {medicine.price ? (
            <p className="mt-2 text-[24px] font-black text-[var(--brand-green)] web:text-[30px]">
              {shortSum(medicine.price)} so&apos;m
            </p>
          ) : (
            <p className="mt-2 text-[18px] font-black text-[var(--brand-muted)]">Narx so&apos;rang</p>
          )}

          {/* Tavsif */}
          <div className="mt-3 rounded-2xl bg-[var(--brand-bg)] p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">
              Tavsif
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-[var(--brand-ink)]">
              {medicine.usage ?? "Bu dori uchun tavsif kiritilmagan."}
            </p>
          </div>

          {/* Dorixona */}
          <div className="mt-3 rounded-2xl border border-[var(--brand-sep)] p-3.5">
            <p className="flex items-center gap-1.5 text-[15px] font-bold text-[var(--brand-ink)]">
              <Store size={15} /> {medicine.pharmacyName}
            </p>
            <p className="mt-1 flex items-start gap-1.5 text-[12.5px] text-[var(--brand-muted)]">
              <MapPin size={13} className="mt-0.5 shrink-0" />
              {medicine.pharmacyAddress}
            </p>
            <p className="mt-0.5 text-[12.5px] text-[var(--brand-muted)]">
              🕘 {medicine.workHours ?? "09:00 - 18:00"}
            </p>
            {medicine.ratingCount > 0 && medicine.ratingAvg !== null && (
              <p className="mt-1 text-[12.5px] font-bold text-[#b8860b]">
                ★ {medicine.ratingAvg.toFixed(1)}{" "}
                <span className="font-semibold text-[var(--brand-muted)]">
                  ({medicine.ratingCount} baho)
                </span>
              </p>
            )}
            <a
              href={`tel:${medicine.pharmacyPhone.replace(/\s/g, "")}`}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-bold text-white"
              style={{ background: "var(--brand-green)" }}
            >
              <Phone size={13} /> Qo&apos;ng&apos;iroq qilish
            </a>
          </div>

          <p className="mt-2.5 flex items-center gap-1.5 text-[11.5px] leading-relaxed text-[var(--brand-muted)]">
            <ShieldCheck size={13} className="shrink-0" />
            Buyurtma dorixona egasiga Telegram orqali yetib boradi — holatini telefon raqamingiz
            bilan kuzatasiz.
          </p>

          {/* Savatga / yoqtirish */}
          <ProductCardActions
            medicine={{
              id: medicine.id,
              name: medicine.name,
              price: medicine.price,
              type: medicine.type,
              hasPhoto: medicine.hasPhoto,
              usage: medicine.usage,
              status: "bor",
            }}
            pharmacy={{
              id: medicine.pharmacyId,
              name: medicine.pharmacyName,
              phone: medicine.pharmacyPhone,
            }}
          />
        </div>
      </div>

      {/* O'xshash mahsulotlar */}
      {similar.length > 0 && (
        <section className="mt-7 web:mt-10">
          <p className="ios-section-title">O&apos;xshash mahsulotlar</p>
          <div className="mt-1 grid grid-cols-2 gap-3 web:grid-cols-4">
            {similar.map((s) => (
              <ProductCard
                key={s.id}
                medicine={{
                  id: s.id,
                  name: s.name,
                  price: s.price,
                  type: s.type,
                  hasPhoto: s.hasPhoto,
                  usage: s.usage,
                  status: "bor",
                }}
                pharmacy={{ id: s.pharmacyId, name: s.pharmacyName, phone: s.pharmacyPhone }}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
