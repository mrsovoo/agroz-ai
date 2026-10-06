"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Smartphone, Monitor } from "lucide-react";
import ProductCard, {
  ProductCardUI,
  type ProductCardMedicine,
} from "@/components/ProductCard";

// Namuna mahsulotlar turli holatlar uchun
const SAMPLE_PRODUCTS: Record<string, ProductCardMedicine> = {
  standard: {
    id: 101,
    name: "Biostimulyator Aminomax",
    price: 45000,
    type: "crop",
    usage: "Ekinlar rivojlanishi va ildiz otishini tezlashtiradi",
    stockUnit: "litr",
    hasPhoto: false, // placeholder ko'rinishi uchun
  },
  longName: {
    id: 102,
    name: "Super Fosfat Kompleks O'g'it va Biostimulyator MAX Plus 500ml",
    price: 85000,
    type: "crop",
    usage: "Issiqxona va ochiq dala pomidor, bodring uchun universal vosita",
    stockUnit: "dona",
    hasPhoto: false,
  },
  longPrice: {
    id: 103,
    name: "Gidroponika Avtomatik Tizimi",
    price: 1250000,
    type: "general",
    usage: "Avtomatik sug'orish va oziqlantirish agregati",
    stockUnit: "dona",
    hasPhoto: false,
  },
  animal: {
    id: 104,
    name: "Antibiotik Enrofloksatsin 10%",
    price: 32000,
    type: "animal",
    usage: "Qoramol va parrandalardagi yuqumli infeksiyalarga qarshi",
    stockUnit: "flakon",
    hasPhoto: false,
  },
  noRating: {
    id: 105,
    name: "Yangi Bio-Insektitsid X-2026",
    price: 60000,
    type: "crop",
    usage: "Zararkunandalarga qarshi ekologik toza himoya",
    stockUnit: "kg",
    hasPhoto: false,
  },
};

export default function ProductCardDevPreview() {
  const [quantities, setQuantities] = useState<Record<number, number>>({
    101: 0,
    102: 2, // Savatda 2 dona bor holat
    103: 0,
    104: 1,
    105: 0,
  });
  const [favorites, setFavorites] = useState<Record<number, boolean>>({
    101: true,
    102: false,
    103: false,
    104: true,
    105: false,
  });

  const handleQty = (id: number, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta),
    }));
  };

  const handleFav = (id: number) => {
    setFavorites((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="min-h-screen bg-neutral-100/70 p-4 sm:p-8 text-neutral-900 pb-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-xs border border-neutral-200">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-neutral-900"
              >
                <ArrowLeft size={14} /> Asosiyga
              </Link>
              <span className="text-neutral-300">|</span>
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-800">
                2-QADAM PREVIEW
              </span>
            </div>
            <h1 className="mt-1 text-xl sm:text-2xl font-black text-neutral-900">
              ProductCard UI Test & Preview Sahifasi
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500">
              Barcha 4 ta variant (lg, md, sm, row) va o&apos;lchamlar (150px, 180px, mobil 375px, kompyuter 1280px).
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-200">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Faqat ko&apos;rinish (Pure UI + State)</span>
          </div>
        </div>

        {/* 1-BO'LIM: 150px va 180px Kenglikdagi Tik Cho'zilgan Kartochkalar (User talabi) */}
        <div className="mb-8 rounded-2xl bg-white p-5 shadow-xs border border-neutral-200">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-neutral-900">
                1. Qat&apos;iy 150px va 180px kenglikda (Tik cho&apos;zilgan nisbat)
              </h2>
              <p className="text-xs text-neutral-500">
                Kenglik 150px bo&apos;lganda balandlik taxminan 220-240px, aspect-[4/5] rasm, nom line-clamp-2, narx va tugma bitta qatorda.
              </p>
            </div>
            <span className="hidden sm:inline-flex text-[11px] font-bold text-neutral-400 bg-neutral-100 px-2.5 py-1 rounded-lg">
              w: 150px / 180px
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-start">
            {/* 150px Kenglik — Standart (qty: 0, tugma "+") */}
            <div className="flex flex-col items-center">
              <span className="mb-1 text-[11px] font-bold text-neutral-400">
                150px (Standart &quot;+&quot;)
              </span>
              <div className="w-[150px]">
                <ProductCardUI
                  product={SAMPLE_PRODUCTS.standard}
                  variant="md"
                  city="Toshkent vil."
                  ratingAvg={4.8}
                  ratingCount={19}
                  isFavorite={favorites[101]}
                  qty={quantities[101]}
                  onAdd={() => handleQty(101, 1)}
                  onChangeQty={(d) => handleQty(101, d)}
                  onToggleFavorite={() => handleFav(101)}
                />
              </div>
            </div>

            {/* 150px Kenglik — Savatda (qty: 2, stepper [- 2 +]) */}
            <div className="flex flex-col items-center">
              <span className="mb-1 text-[11px] font-bold text-neutral-400">
                150px (Stepper [- 2 +])
              </span>
              <div className="w-[150px]">
                <ProductCardUI
                  product={SAMPLE_PRODUCTS.longName}
                  variant="md"
                  city="Samarqand"
                  ratingAvg={4.9}
                  ratingCount={42}
                  isFavorite={favorites[102]}
                  qty={quantities[102]}
                  onAdd={() => handleQty(102, 1)}
                  onChangeQty={(d) => handleQty(102, d)}
                  onToggleFavorite={() => handleFav(102)}
                />
              </div>
            </div>

            {/* 180px Kenglik — Uzun narx (1 250 000 so'm) */}
            <div className="flex flex-col items-center">
              <span className="mb-1 text-[11px] font-bold text-neutral-400">
                180px (Uzun narx)
              </span>
              <div className="w-[180px]">
                <ProductCardUI
                  product={SAMPLE_PRODUCTS.longPrice}
                  variant="md"
                  city="Farg'ona"
                  ratingAvg={5.0}
                  ratingCount={8}
                  isFavorite={favorites[103]}
                  qty={quantities[103]}
                  onAdd={() => handleQty(103, 1)}
                  onChangeQty={(d) => handleQty(103, d)}
                  onToggleFavorite={() => handleFav(103)}
                />
              </div>
            </div>

            {/* 180px Kenglik — Yangi / Reytingsiz */}
            <div className="flex flex-col items-center">
              <span className="mb-1 text-[11px] font-bold text-neutral-400">
                180px (Yangi dori)
              </span>
              <div className="w-[180px]">
                <ProductCardUI
                  product={SAMPLE_PRODUCTS.noRating}
                  variant="md"
                  city="Andijon"
                  ratingAvg={0}
                  ratingCount={0}
                  isFavorite={favorites[105]}
                  qty={quantities[105]}
                  onAdd={() => handleQty(105, 1)}
                  onChangeQty={(d) => handleQty(105, d)}
                  onToggleFavorite={() => handleFav(105)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2-BO'LIM: LG VARIANT (/dorilar katalogi formati) */}
        <div className="mb-8 rounded-2xl bg-white p-5 shadow-xs border border-neutral-200">
          <div className="mb-3">
            <h2 className="text-base font-black text-neutral-900">
              2. Variant: &quot;lg&quot; (/dorilar katalogi formati)
            </h2>
            <p className="text-xs text-neutral-500">
              Katta kartochka, to&apos;liq ma&apos;lumot, 1 qator tavsif (line-clamp-1), kattaroq shriftlar.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {Object.values(SAMPLE_PRODUCTS).slice(0, 4).map((p) => (
              <ProductCardUI
                key={`lg-${p.id}`}
                product={p}
                variant="lg"
                city="Toshkent sh."
                ratingAvg={4.7}
                ratingCount={14}
                isFavorite={favorites[p.id]}
                qty={quantities[p.id]}
                onAdd={() => handleQty(p.id, 1)}
                onChangeQty={(d) => handleQty(p.id, d)}
                onToggleFavorite={() => handleFav(p.id)}
              />
            ))}
          </div>
        </div>

        {/* 3-BO'LIM: SM VARIANT (Gorizontal slayder / Xarita) */}
        <div className="mb-8 rounded-2xl bg-white p-5 shadow-xs border border-neutral-200">
          <div className="mb-3">
            <h2 className="text-base font-black text-neutral-900">
              3. Variant: &quot;sm&quot; (Xarita & NearbyHelp gorizontal slayder)
            </h2>
            <p className="text-xs text-neutral-500">
              Ixcham w-[110px], rasm + 2 qator nom + narx.
            </p>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {Object.values(SAMPLE_PRODUCTS).map((p) => (
              <ProductCardUI
                key={`sm-${p.id}`}
                product={p}
                variant="sm"
              />
            ))}
          </div>
        </div>

        {/* 4-BO'LIM: ROW VARIANT (Savat va Buyurtma) */}
        <div className="mb-8 rounded-2xl bg-white p-5 shadow-xs border border-neutral-200">
          <div className="mb-3">
            <h2 className="text-base font-black text-neutral-900">
              4. Variant: &quot;row&quot; (Savat va Buyurtma gorizontal formati)
            </h2>
            <p className="text-xs text-neutral-500">
              Chapda rasm (h-14 w-14), o&apos;rtada nom + narx + birlik, o&apos;ngda actions slot.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 max-w-2xl">
            {/* Savatdagi element checkbox va stepper bilan */}
            <ProductCardUI
              product={SAMPLE_PRODUCTS.standard}
              variant="row"
              leading={
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#039e1e] text-white">
                  <Check size={12} strokeWidth={3} />
                </div>
              }
              actions={
                <div className="flex items-center rounded-xl bg-neutral-100 p-1">
                  <button
                    type="button"
                    onClick={() => handleQty(101, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-neutral-700 shadow-2xs font-bold"
                  >
                    -
                  </button>
                  <span className="px-2.5 text-xs font-black text-neutral-800">
                    {quantities[101] || 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQty(101, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-neutral-700 shadow-2xs font-bold"
                  >
                    +
                  </button>
                </div>
              }
            />

            {/* Buyurtma tasdig'idagi element */}
            <ProductCardUI
              product={SAMPLE_PRODUCTS.longPrice}
              variant="row"
              subtitle={
                <span className="text-[11px] text-neutral-400">
                  Agro-do&apos;kon: &quot;Baraka Hosil&quot; MCHJ
                </span>
              }
              actions={
                <span className="text-xs font-bold text-neutral-500">
                  x 1 dona
                </span>
              }
            />
          </div>
        </div>

        {/* 5-BO'LIM: RESPONSIVE GRID SIMULATSIYASI (375px Mobil vs To'liq Kenglik) */}
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-neutral-200">
          <div className="mb-4">
            <h2 className="text-base font-black text-neutral-900">
              5. Mobil (375px) va Kompyuter (Responsive Grid)
            </h2>
            <p className="text-xs text-neutral-500">
              Mobil telefon ekranida 2 ta ustun (grid-cols-2), kartochkalar balandligi bir xil va matnlar sig&apos;ishi:
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Mobil simulyator (aniq 375px kenglikda ramka ichida) */}
            <div className="w-full sm:w-[375px] shrink-0 rounded-3xl border-4 border-neutral-800 bg-neutral-50 p-3 shadow-md">
              <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-neutral-600 px-1">
                <span className="flex items-center gap-1">
                  <Smartphone size={12} /> 375px Mobil Ekran
                </span>
                <span className="text-emerald-700">grid-cols-2 (gap-2.5)</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <ProductCardUI
                  product={SAMPLE_PRODUCTS.standard}
                  variant="md"
                  city="Toshkent"
                  ratingAvg={4.8}
                  ratingCount={19}
                  isFavorite={favorites[101]}
                  qty={quantities[101]}
                  onAdd={() => handleQty(101, 1)}
                  onChangeQty={(d) => handleQty(101, d)}
                  onToggleFavorite={() => handleFav(101)}
                />
                <ProductCardUI
                  product={SAMPLE_PRODUCTS.longName}
                  variant="md"
                  city="Samarqand"
                  ratingAvg={4.9}
                  ratingCount={42}
                  isFavorite={favorites[102]}
                  qty={quantities[102]}
                  onAdd={() => handleQty(102, 1)}
                  onChangeQty={(d) => handleQty(102, d)}
                  onToggleFavorite={() => handleFav(102)}
                />
                <ProductCardUI
                  product={SAMPLE_PRODUCTS.longPrice}
                  variant="md"
                  city="Farg'ona"
                  ratingAvg={5.0}
                  ratingCount={8}
                  isFavorite={favorites[103]}
                  qty={quantities[103]}
                  onAdd={() => handleQty(103, 1)}
                  onChangeQty={(d) => handleQty(103, d)}
                  onToggleFavorite={() => handleFav(103)}
                />
                <ProductCardUI
                  product={SAMPLE_PRODUCTS.animal}
                  variant="md"
                  city="Buxoro"
                  ratingAvg={4.6}
                  ratingCount={3}
                  isFavorite={favorites[104]}
                  qty={quantities[104]}
                  onAdd={() => handleQty(104, 1)}
                  onChangeQty={(d) => handleQty(104, d)}
                  onToggleFavorite={() => handleFav(104)}
                />
              </div>
            </div>

            {/* Katta ekran grid ko'rinishi */}
            <div className="flex-1 w-full">
              <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-neutral-600 px-1">
                <span className="flex items-center gap-1">
                  <Monitor size={12} /> Katta ekran Grid (grid-cols-2 sm:grid-cols-3 xl:grid-cols-4)
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {Object.values(SAMPLE_PRODUCTS).map((p) => (
                  <ProductCardUI
                    key={`grid-${p.id}`}
                    product={p}
                    variant="md"
                    city="O'zbekiston"
                    ratingAvg={4.8}
                    ratingCount={12}
                    isFavorite={favorites[p.id]}
                    qty={quantities[p.id]}
                    onAdd={() => handleQty(p.id, 1)}
                    onChangeQty={(d) => handleQty(p.id, d)}
                    onToggleFavorite={() => handleFav(p.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

