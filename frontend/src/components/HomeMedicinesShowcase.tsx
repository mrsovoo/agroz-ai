"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pill, Search, Sprout, Syringe, Sparkles, Store, Filter } from "lucide-react";
import ProductCard from "@/components/ProductCard";

export type ShowcaseMedicine = {
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
};

// O'zbekiston agro/vet bozoridagi 16 ta eng sara real preparatlar
export const DEFAULT_SHOWCASE_MEDICINES: ShowcaseMedicine[] = [
  {
    id: 101,
    name: "Ridomil Gold MZ 68 WG",
    type: "crop",
    price: 65000,
    usage: "Pomidor, kartoshka va uzumdagi fitoftoroz, peronosporoz va soxta un-shudringga qarshi tizimli fungitsid.",
    hasPhoto: false,
    pharmacyId: 1,
    pharmacyName: "Baraka Agro Ta'minot",
    pharmacyPhone: "+998 90 111 22 33",
    pharmacyAddress: "Toshkent vil., Zangiota tumani",
    ratingAvg: 4.9,
    ratingCount: 28,
  },
  {
    id: 102,
    name: "Score 250 EC (Skor)",
    type: "crop",
    price: 48000,
    usage: "Olma, nok, shaftoli va o'rikdagi parsha, un-shudring va barg buralishiga qarshi kuchli fungitsid.",
    hasPhoto: false,
    pharmacyId: 1,
    pharmacyName: "Baraka Agro Ta'minot",
    pharmacyPhone: "+998 90 111 22 33",
    pharmacyAddress: "Toshkent vil., Zangiota tumani",
    ratingAvg: 5.0,
    ratingCount: 19,
  },
  {
    id: 103,
    name: "Ivermektin 1% in'yeksiya",
    type: "animal",
    price: 38000,
    usage: "Qoramol, qo'y va echkilardagi gijja, teri osti bo'kayi, qo'tir va qon so'ruvchi parazitlarga qarshi.",
    hasPhoto: false,
    pharmacyId: 2,
    pharmacyName: "Dehqon Hamkori Do'koni",
    pharmacyPhone: "+998 91 222 33 44",
    pharmacyAddress: "Samarqand sh., Mirzo Ulug'bek 45",
    ratingAvg: 4.9,
    ratingCount: 34,
  },
  {
    id: 104,
    name: "Karate Zeon 050 CS",
    type: "crop",
    price: 35000,
    usage: "Mevali daraxtlar, g'alla va sabzavotlardagi shira, trips, olma qurti va kapalaklarga qarshi mikrokapsulali insektitsid.",
    hasPhoto: false,
    pharmacyId: 1,
    pharmacyName: "Baraka Agro Ta'minot",
    pharmacyPhone: "+998 90 111 22 33",
    pharmacyAddress: "Toshkent vil., Zangiota tumani",
    ratingAvg: 4.8,
    ratingCount: 15,
  },
  {
    id: 105,
    name: "Oksitetratsiklin 200 LA",
    type: "animal",
    price: 55000,
    usage: "Uzoq muddatli ta'sirga ega keng qamrovli antibiotik. Pnevmoniya, tuyoq chirishi va metritda qo'llaniladi.",
    hasPhoto: false,
    pharmacyId: 2,
    pharmacyName: "Dehqon Hamkori Do'koni",
    pharmacyPhone: "+998 91 222 33 44",
    pharmacyAddress: "Samarqand sh., Mirzo Ulug'bek 45",
    ratingAvg: 5.0,
    ratingCount: 22,
  },
  {
    id: 106,
    name: "Aktara 25 WG",
    type: "crop",
    price: 28000,
    usage: "Kolorado qo'ng'izi, o'simlik biti, oqqanot va so'ruvchi hasharotlarga qarshi ildizdan va bargdan ta'sir qiluvchi vosita.",
    hasPhoto: false,
    pharmacyId: 3,
    pharmacyName: "Vodiy Agro Kimyo",
    pharmacyPhone: "+998 93 333 44 55",
    pharmacyAddress: "Farg'ona sh., Al-Farg'oniy 88",
    ratingAvg: 4.9,
    ratingCount: 41,
  },
  {
    id: 107,
    name: "Nitoks 200 (Nita-Farm)",
    type: "animal",
    price: 48000,
    usage: "Qoramol va qo'ylarda nafas yo'llari, pnevmoniya va yuqumli kasalliklarda samarali antibiotik.",
    hasPhoto: false,
    pharmacyId: 4,
    pharmacyName: "Zarafshon Agro-Vet",
    pharmacyPhone: "+998 94 444 55 66",
    pharmacyAddress: "Buxoro sh., G'ijduvon 19",
    ratingAvg: 4.9,
    ratingCount: 18,
  },
  {
    id: 108,
    name: "Proclaim 05 SG (Prokleyim)",
    type: "crop",
    price: 72000,
    usage: "Pomidor kuyasi (Tuta absoluta), g'o'za tunlami va meva qurtlariga qarshi yuqori samarali insektitsid.",
    hasPhoto: false,
    pharmacyId: 3,
    pharmacyName: "Vodiy Agro Kimyo",
    pharmacyPhone: "+998 93 333 44 55",
    pharmacyAddress: "Farg'ona sh., Al-Farg'oniy 88",
    ratingAvg: 5.0,
    ratingCount: 27,
  },
  {
    id: 109,
    name: "Albendazol 10% suspenziya",
    type: "animal",
    price: 22000,
    usage: "Oshqozon-ichak va o'pka gijjalari, parazitlarga qarshi yalpi degelmintizatsiya.",
    hasPhoto: false,
    pharmacyId: 4,
    pharmacyName: "Zarafshon Agro-Vet",
    pharmacyPhone: "+998 94 444 55 66",
    pharmacyAddress: "Buxoro sh., G'ijduvon 19",
    ratingAvg: 4.8,
    ratingCount: 31,
  },
  {
    id: 110,
    name: "Amistar Top 325 SC",
    type: "crop",
    price: 115000,
    usage: "G'alla, poliz va sabzavotlardagi zang, antraknoz va alternariozga qarshi himoyalovchi va davolovchi fungitsid.",
    hasPhoto: false,
    pharmacyId: 5,
    pharmacyName: "Andijon Hosil Dorixonasi",
    pharmacyPhone: "+998 95 555 66 77",
    pharmacyAddress: "Andijon sh., Bobur shoh 102",
    ratingAvg: 5.0,
    ratingCount: 16,
  },
  {
    id: 111,
    name: "Butafosfan + B12 (Katosal)",
    type: "animal",
    price: 88000,
    usage: "Moddalar almashinuvini yaxshilovchi, darmonsizlik va tug'ruqdan keyingi charchoqni ketkazuvchi kuchli stimulyator.",
    hasPhoto: false,
    pharmacyId: 6,
    pharmacyName: "Chorva va Parranda Dori Markazi",
    pharmacyPhone: "+998 97 777 88 99",
    pharmacyAddress: "Toshkent sh., Sergeli tumani",
    ratingAvg: 4.9,
    ratingCount: 39,
  },
  {
    id: 112,
    name: "Previkur Energy (Bayer)",
    type: "crop",
    price: 95000,
    usage: "Bodring va pomidor ko'chatlaridagi ildiz chirishi va soxta un-shudringga qarshi ildizdan sug'oriladigan fungitsid.",
    hasPhoto: false,
    pharmacyId: 5,
    pharmacyName: "Andijon Hosil Dorixonasi",
    pharmacyPhone: "+998 95 555 66 77",
    pharmacyAddress: "Andijon sh., Bobur shoh 102",
    ratingAvg: 5.0,
    ratingCount: 24,
  },
  {
    id: 113,
    name: "Enrofloksatsin 10% eritma",
    type: "animal",
    price: 42000,
    usage: "Buzoq, qo'zichoq va parrandalarning kolibakterioz va ich ketish kasalliklariga qarshi ichiriladigan antibiotik.",
    hasPhoto: false,
    pharmacyId: 6,
    pharmacyName: "Chorva va Parranda Dori Markazi",
    pharmacyPhone: "+998 97 777 88 99",
    pharmacyAddress: "Toshkent sh., Sergeli tumani",
    ratingAvg: 4.8,
    ratingCount: 17,
  },
  {
    id: 114,
    name: "Koragen 20 SC (FMC)",
    type: "crop",
    price: 85000,
    usage: "Makkajo'xori, pomidor va olma qurtlariga qarshi yangi avlod insektitsidi. 3 haftagacha ta'sirini saqlaydi.",
    hasPhoto: false,
    pharmacyId: 3,
    pharmacyName: "Vodiy Agro Kimyo",
    pharmacyPhone: "+998 93 333 44 55",
    pharmacyAddress: "Farg'ona sh., Al-Farg'oniy 88",
    ratingAvg: 5.0,
    ratingCount: 33,
  },
  {
    id: 115,
    name: "Kalsiy borglyukonat 20%",
    type: "animal",
    price: 19000,
    usage: "Sigirlarda tug'ruq falaji (gipokalsiyemiya), raxit va osteomalyatsiyada iliq holda yuboriladi.",
    hasPhoto: false,
    pharmacyId: 4,
    pharmacyName: "Zarafshon Agro-Vet",
    pharmacyPhone: "+998 94 444 55 66",
    pharmacyAddress: "Buxoro sh., G'ijduvon 19",
    ratingAvg: 4.7,
    ratingCount: 14,
  },
  {
    id: 116,
    name: "Fitosporin-M (Biologik)",
    type: "crop",
    price: 18000,
    usage: "Tabiiy biologik fungitsid. Sabzavotlar meva berish davrida kimyoviy qoldiqsiz zamburug'larni davolaydi.",
    hasPhoto: false,
    pharmacyId: 5,
    pharmacyName: "Andijon Hosil Dorixonasi",
    pharmacyPhone: "+998 95 555 66 77",
    pharmacyAddress: "Andijon sh., Bobur shoh 102",
    ratingAvg: 4.9,
    ratingCount: 45,
  },
];

export default function HomeMedicinesShowcase({
  initialMedicines = [],
}: {
  initialMedicines?: ShowcaseMedicine[];
}) {
  const [filter, setFilter] = useState<"all" | "crop" | "animal">("all");
  const [query, setQuery] = useState("");

  const allItems = initialMedicines.length > 0 ? initialMedicines : DEFAULT_SHOWCASE_MEDICINES;

  const filtered = useMemo(() => {
    return allItems.filter((m) => {
      if (filter === "crop" && m.type !== "crop") return false;
      if (filter === "animal" && m.type !== "animal") return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchName = m.name.toLowerCase().includes(q);
        const matchUsage = (m.usage || "").toLowerCase().includes(q);
        const matchPh = m.pharmacyName.toLowerCase().includes(q);
        return matchName || matchUsage || matchPh;
      }
      return true;
    });
  }, [allItems, filter, query]);

  return (
    <section className="mt-7 web:mt-9">
      {/* Sarlavha va ko'proq havolasi */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--brand-green-soft)] text-[var(--brand-green)]">
              <Pill size={16} />
            </span>
            <h2 className="text-[20px] font-black tracking-tight text-neutral-900 web:text-[24px]">
              Dori vositalari katalogi
            </h2>
          </div>
          <p className="mt-0.5 text-[13px] text-neutral-500 font-medium">
            Sertifikatlangan dori vositalari, fungitsidlar, vaksinalar va o&apos;g&apos;itlar
          </p>
        </div>

        <Link
          href="/dorilar"
          className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-[var(--brand-green)] hover:underline self-start sm:self-auto"
        >
          <span>Barcha dorilar ({allItems.length})</span>
          <span>→</span>
        </Link>
      </div>

      {/* Filterlar va Qidiruv */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter tugmalari */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-bold transition-all ${
              filter === "all"
                ? "bg-neutral-900 text-white shadow-xs"
                : "bg-white text-neutral-600 border border-black/8 hover:bg-neutral-50"
            }`}
          >
            <Sparkles size={14} />
            <span>Barchasi</span>
            <span className="text-[11px] opacity-70">({allItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("crop")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-bold transition-all ${
              filter === "crop"
                ? "bg-[var(--brand-green)] text-white shadow-xs"
                : "bg-white text-neutral-600 border border-black/8 hover:bg-neutral-50"
            }`}
          >
            <Sprout size={14} />
            <span>Ekinlar uchun</span>
            <span className="text-[11px] opacity-70">
              ({allItems.filter((m) => m.type === "crop").length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("animal")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-bold transition-all ${
              filter === "animal"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-white text-neutral-600 border border-black/8 hover:bg-neutral-50"
            }`}
          >
            <Syringe size={14} />
            <span>Hayvonlar uchun</span>
            <span className="text-[11px] opacity-70">
              ({allItems.filter((m) => m.type === "animal").length})
            </span>
          </button>
        </div>

        {/* Qidiruv input */}
        <div className="relative w-full sm:max-w-[280px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Dori nomi yoki dorixona..."
            className="w-full rounded-xl border border-black/8 bg-white py-2 pl-9 pr-4 text-[13px] font-medium text-neutral-800 placeholder-neutral-400 shadow-2xs focus:border-[var(--brand-green)] focus:outline-none"
          />
        </div>
      </div>

      {/* Kartochkalar to'plami */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 web:grid-cols-4 web:gap-4.5">
        {filtered.slice(0, 12).map((m) => (
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

      {/* Bo'sh holat */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-10 text-center border border-black/5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400 mb-2">
            <Search size={24} />
          </div>
          <p className="text-[15px] font-bold text-neutral-800">Dori vositasi topilmadi</p>
          <p className="text-[13px] text-neutral-500 mt-1">
            Boshqa nom bilan qidirib ko&apos;ring yoki toifani o&apos;zgartiring
          </p>
          <button
            onClick={() => {
              setFilter("all");
              setQuery("");
            }}
            className="mt-4 rounded-xl bg-neutral-900 px-4 py-2 text-[12.5px] font-bold text-white hover:bg-neutral-800"
          >
            Filtrni tozalash
          </button>
        </div>
      )}

      {/* Barcha dorilarga o'tish tugmasi */}
      <div className="mt-5">
        <Link href="/dorilar" className="block">
          <button className="ios-btn yellow flex w-full items-center justify-center gap-2 py-3.5 text-[15px] font-bold shadow-xs hover:brightness-105 active:scale-[0.99] transition">
            <Store size={18} />
            <span>Barcha dorilar katalogiga o&apos;tish ({allItems.length} ta dori)</span>
          </button>
        </Link>
      </div>
    </section>
  );
}

