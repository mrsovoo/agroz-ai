import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Pill, ShieldCheck, Sprout, Store, Clock, Star, Package } from "lucide-react";
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
    <div className="min-h-screen bg-[#FAF9F5] text-[#191B1F] pb-24 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
        {/* Breadcrumb & Sarlavha */}
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-6">
          <Link href="/" className="hover:text-black transition">
            AgrozGO
          </Link>
          <span>/</span>
          <Link href="/dorilar" className="hover:text-black transition">
            Mahsulotlar
          </Link>
          <span>/</span>
          <span className="text-zinc-900 truncate max-w-xs">{medicine.name}</span>
        </div>

        {/* Mahsulot Asosiy Bloki: 2 ustunli Apple Bento Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[480px_minmax(0,1fr)] gap-8 items-start">
          {/* Chap ustun: Katta toza rasm kartasi */}
          <div className="overflow-hidden rounded-3xl bg-white p-4 sm:p-6 border border-black/8 shadow-xs flex items-center justify-center">
            {medicine.hasPhoto ? (
              <FadeImage
                src={medicine.photoVersion ? `/api/medicines/${medicine.id}/photo?v=${medicine.photoVersion}` : `/api/medicines/${medicine.id}/photo`}
                alt={medicine.name}
                className="aspect-square w-full object-contain bg-white"
                fit="contain"
                fallback={
                  <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400">
                    <Pill size={48} />
                  </div>
                }
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400">
                <Pill size={48} />
              </div>
            )}
          </div>

          {/* O'ng ustun: Mahsulot ma'lumotlari */}
          <div className="rounded-3xl bg-white p-6 sm:p-8 border border-black/8 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF9F5] border border-black/5 text-zinc-800">
                {medicine.type === "animal" ? (
                  <>
                    <ShieldCheck size={13} className="text-amber-500" />
                    <span>Chorva & Veterinariya</span>
                  </>
                ) : medicine.type === "crop" ? (
                  <>
                    <Sprout size={13} className="text-emerald-600" />
                    <span>Ekin & O‘g‘it</span>
                  </>
                ) : (
                  <>
                    <Package size={13} className="text-teal-600" />
                    <span>Umumiy agro-vosita</span>
                  </>
                )}
              </span>

              {/* Reyting va sharhlar */}
              <MedicineRatingSummary
                medicineId={medicine.id}
                initialAvg={medicine.ratingAvg}
                initialCount={medicine.ratingCount}
              />
            </div>

            <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#191B1F] tracking-tight leading-tight">
                {medicine.name}
              </h1>

              {medicine.price != null && medicine.price > 0 ? (
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-[#191B1F] tracking-tight">
                    {shortSum(medicine.price)}
                  </span>
                  <span className="text-base font-bold text-zinc-500">so‘m</span>
                  {medicine.stockUnit && (
                    <span className="text-xs font-medium text-zinc-400">/ {medicine.stockUnit}</span>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm font-bold text-zinc-500">Narxi kelishuv asosida</p>
              )}
            </div>

            {/* Tavsif */}
            <div className="rounded-2xl bg-[#FAF9F5] p-4 border border-black/5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Mahsulot tavsifi & Qo‘llash bo‘yicha yo‘riqnoma
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-700 font-medium">
                {medicine.usage ?? "Ushbu dori vositasi uchun batafsil qo‘llanma do‘kon xodimi tomonidan taqdim etiladi."}
              </p>
            </div>

            {/* Sotuvchi Agro-do'kon kartochkasi */}
            <div className="rounded-2xl bg-[#FAF9F5] p-4 border border-black/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-800 shadow-2xs border border-black/5">
                    <Store size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">{medicine.pharmacyName}</h4>
                    <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={11} /> {medicine.pharmacyAddress}
                    </p>
                  </div>
                </div>

                <a
                  href={`tel:${medicine.pharmacyPhone.replace(/\s/g, "")}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-xs font-bold text-zinc-800 border border-black/8 hover:bg-zinc-50 transition shadow-2xs"
                >
                  <Phone size={12} />
                  <span>Qo‘ng‘iroq</span>
                </a>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-black/5 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <Clock size={12} /> Ish vaqti: {medicine.workHours ?? "09:00 - 18:00"}
                </span>
                {medicine.ratingCount > 0 && medicine.ratingAvg !== null && (
                  <span className="flex items-center gap-1 font-bold text-amber-700">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    <span>{medicine.ratingAvg.toFixed(1)}</span>
                    <span className="text-zinc-400 font-normal">({medicine.ratingCount} baho)</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
              <span>AgrozGO kafolati: mahsulot haqiqiyligi va to‘g‘ridan-to‘g‘ri ombordan yetkazilishi tekshirilgan.</span>
            </div>

            {/* Savatga qo'shish va sevimliga olish harakatlari */}
            <div className="pt-2">
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
        </div>

        {/* Fermer va dehqonlar sharhlari */}
        <div className="mt-12">
          <MedicineReviewsSection medicineId={medicine.id} medicineName={medicine.name} />
        </div>

        {/* O'xshash mahsulotlar */}
        {similar.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#191B1F] tracking-tight">
                O‘xshash preparatlar
              </h2>
              <Link href="/dorilar" className="text-xs font-bold text-zinc-600 hover:text-black">
                Barchasini ko‘rish →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
              {similar.map((s) => (
                <ProductCard
                  key={s.id}
                  variant="md"
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
      </div>
    </div>
  );
}
