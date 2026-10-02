import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, MapPin, Phone, Pill, ShieldCheck, Sprout, Store } from "lucide-react";
import FadeImage from "@/components/FadeImage";
import ProductCardActions from "@/components/ProductCardActions";
import ProductCard from "@/components/ProductCard";
import MedicineReviewsSection from "@/components/MedicineReviewsSection";
import MedicineRatingSummary from "@/components/MedicineRatingSummary";
import { shortSum } from "@/lib/format";
import { apiUrl } from "@/lib/api-config";

export type MedicineDetailData = {
  id: number;
  name: string;
  type: string;
  usage: string | null;
  price: number | null;
  stockUnit?: string | null;
  hasPhoto: boolean;
  photoVersion?: string | null;
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
  try {
    const [medRes, specRes] = await Promise.allSettled([
      fetch(apiUrl(`/api/medicines/${id}`), { cache: "no-store" }),
      fetch(apiUrl("/api/specialists"), { cache: "no-store" }),
    ]);

    if (medRes.status === "fulfilled" && medRes.value.ok) {
      const data = (await medRes.value.json()) as { medicine?: MedicineDetailData };
      if (data?.medicine) return data.medicine;
    }

    if (specRes.status === "fulfilled" && specRes.value.ok) {
      const sData = await specRes.value.json();
      const list = Array.isArray(sData) ? sData : (sData?.items || sData?.specialists || []);
      for (const p of list) {
        if (Array.isArray(p.medicines)) {
          for (const m of p.medicines) {
            if (Number(m.id) === id) {
              return {
                id: m.id,
                name: m.name,
                type: m.type || "general",
                usage: m.usage ?? null,
                price: m.price ?? null,
                stockUnit: m.stockUnit ?? "dona",
                hasPhoto: Boolean(m.hasPhoto),
                photoVersion: m.photoVersion ?? null,
                status: m.status || "bor",
                pharmacyId: p.id,
                pharmacyOrg: p.organization ?? null,
                pharmacyName: p.organization || p.name || "Agroz Agro-do&apos;kon",
                pharmacyPhone: p.phone || "",
                pharmacyAddress: p.address || "",
                workHours: p.workHours ?? "09:00 - 18:00",
                ratingAvg: p.ratingAvg ?? null,
                ratingCount: p.ratingCount ?? 0,
              };
            }
          }
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/** O'xshash mahsulotlar: backend API /api/medicines/:id va /api/specialists dan olinadi */
export async function getSimilarMedicines(
  medicine: MedicineDetailData,
  limit = 8,
): Promise<MedicineDetailData[]> {
  try {
    const [medRes, specRes] = await Promise.allSettled([
      fetch(apiUrl(`/api/medicines/${medicine.id}`), { cache: "no-store" }),
      fetch(apiUrl("/api/specialists"), { cache: "no-store" }),
    ]);

    const simMap = new Map<number, MedicineDetailData>();

    if (medRes.status === "fulfilled" && medRes.value.ok) {
      const data = (await medRes.value.json()) as { similar?: MedicineDetailData[] };
      if (Array.isArray(data?.similar)) {
        for (const s of data.similar) {
          if (s.id !== medicine.id) {
            simMap.set(s.id, s);
          }
        }
      }
    }

    if (specRes.status === "fulfilled" && specRes.value.ok) {
      const sData = await specRes.value.json();
      const list = Array.isArray(sData) ? sData : (sData?.items || sData?.specialists || []);
      for (const p of list) {
        if (Array.isArray(p.medicines)) {
          for (const m of p.medicines) {
            if (m.id === medicine.id || m.status === "yoq") continue;
            if (!simMap.has(m.id)) {
              simMap.set(m.id, {
                id: m.id,
                name: m.name,
                type: m.type || "general",
                usage: m.usage ?? null,
                price: m.price ?? null,
                stockUnit: m.stockUnit ?? "dona",
                hasPhoto: Boolean(m.hasPhoto),
                photoVersion: m.photoVersion ?? null,
                status: m.status || "bor",
                pharmacyId: p.id,
                pharmacyOrg: p.organization ?? null,
                pharmacyName: p.organization || p.name || "Agroz Agro-do&apos;kon",
                pharmacyPhone: p.phone || "",
                pharmacyAddress: p.address || "",
                workHours: p.workHours ?? "09:00 - 18:00",
                ratingAvg: p.ratingAvg ?? null,
                ratingCount: p.ratingCount ?? 0,
              });
            }
          }
        }
      }
    }

    const allSimilar = Array.from(simMap.values());
    allSimilar.sort((a, b) => {
      const aSameType = a.type === medicine.type ? 0 : 1;
      const bSameType = b.type === medicine.type ? 0 : 1;
      if (aSameType !== bSameType) return aSameType - bSameType;

      const aSamePh = a.pharmacyId === medicine.pharmacyId ? 0 : 1;
      const bSamePh = b.pharmacyId === medicine.pharmacyId ? 0 : 1;
      if (aSamePh !== bSamePh) return aSamePh - bSamePh;

      return Math.random() - 0.5;
    });

    return allSimilar.slice(0, limit);
  } catch {
    return [];
  }
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
        <ArrowLeft size={15} /> Dorilarga qaytish
      </Link>

      {/* Mahsulot: chapda rasm, o'ngda ma'lumot (katta ekranda ustma-ust emas) */}
      <div className="mt-3 grid gap-4 web:grid-cols-[420px_minmax(0,1fr)] web:gap-8">
        {/* Katta rasm — 5:7 (250×350 proportsiyasining kattalashtirilgani), oq fon */}
        <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
          {medicine.hasPhoto ? (
            <FadeImage
              src={medicine.photoVersion ? `/api/medicines/${medicine.id}/photo?v=${medicine.photoVersion}` : `/api/medicines/${medicine.id}/photo`}
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

          {/* Reyting va sharhlar havolasi */}
          <div className="flex items-center">
            <MedicineRatingSummary
              medicineId={medicine.id}
              initialAvg={medicine.ratingAvg}
              initialCount={medicine.ratingCount}
            />
          </div>

          {medicine.price != null && medicine.price > 0 ? (
            <p className="mt-2 text-[24px] font-black text-[var(--brand-green)] web:text-[30px]">
              {shortSum(medicine.price)} so&apos;m
            </p>
          ) : (
            <p className="mt-2 text-[16px] font-bold text-[var(--brand-muted)]">Narxi ko&apos;rsatilmagan</p>
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

          {/* Agro-do&apos;kon */}
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
            Buyurtma agro-do&apos;kon egasiga Telegram orqali yetib boradi — holatini telefon raqamingiz
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
              photoVersion: medicine.photoVersion,
              usage: medicine.usage,
              status: "bor",
            }}
            pharmacy={{
              id: medicine.pharmacyId,
              name: medicine.pharmacyName,
              phone: medicine.pharmacyPhone,
              address: medicine.pharmacyAddress,
            }}
          />
        </div>
      </div>

      {/* Fermer va dehqonlar fikrlari va reytingi */}
      <MedicineReviewsSection medicineId={medicine.id} medicineName={medicine.name} />

      {/* O'xshash mahsulotlar */}
      {similar.length > 0 && (
        <section className="mt-7 web:mt-10">
          <p className="ios-section-title">O&apos;xshash mahsulotlar</p>
          <div className="mt-2 grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 web:grid-cols-4 web:gap-4.5">
            {similar.map((s) => (
              <ProductCard
                key={s.id}
                medicine={{
                  id: s.id,
                  name: s.name,
                  price: s.price,
                  type: s.type,
                  hasPhoto: s.hasPhoto,
                  photoVersion: s.photoVersion,
                  usage: s.usage,
                  stockUnit: s.stockUnit,
                  status: "bor",
                }}
                pharmacy={{
                  id: s.pharmacyId,
                  name: s.pharmacyName,
                  phone: s.pharmacyPhone,
                  address: s.pharmacyAddress,
                  ratingAvg: s.ratingAvg,
                  ratingCount: s.ratingCount,
                }}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
