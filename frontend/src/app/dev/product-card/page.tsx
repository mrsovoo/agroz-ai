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
  transparentPng: {
    id: 106,
    name: "Shaffof PNG Dori (Fonsiz Flakon)",
    price: 55000,
    type: "crop",
    usage: "Shaffof PNG fonida qora bo'lmasdan toza oq fonda turish testi",
    stockUnit: "dona",
    hasPhoto: true,
  },
  whiteJpg: {
    id: 107,
    name: "Oq Fonli JPG Mahsulot",
    price: 95000,
    type: "general",
    usage: "Standart oq fonli mahsulot tasviri",
    stockUnit: "dona",
    hasPhoto: true,
  },
  shortName: {
    id: 108,
    name: "Urea 46%",
    price: 38000,
    type: "crop",
    usage: "Azotli o'g'it, bir qatorli qisqa nom",
    stockUnit: "kg",
    hasPhoto: false,
  },
  noPrice: {
    id: 109,
    name: "Agro Dron X-500 Sug'orish Tizimi",
    price: null, // "Kelishiladi" holati
    type: "general",
    usage: "Maydonlarni havodan dori sepish agregati",
    stockUnit: "komplekt",
    hasPhoto: false,
  },
};

// Shaffof PNG namunasi (hech qanday fonsiz / transparent alpha)
const TRANSPARENT_PNG_DATA_URL =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 240' width='200' height='240'><path d='M80 20 h40 v20 h-40 z M70 40 h60 v25 h-60 z M45 65 h110 v140 c0 15 -10 20 -20 20 h-70 c-10 0 -20 -5 -20 -20 z' fill='%23028e11'/><rect x='60' y='95' width='80' height='75' rx='8' fill='%23ffffff' stroke='%23039e1e' stroke-width='3'/><text x='100' y='142' font-family='sans-serif' font-size='20' font-weight='bold' text-anchor='middle' fill='%23028e11'>PNG</text></svg>";

// Oq fonli JPG namunasi
const WHITE_JPG_DATA_URL =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 240' width='200' height='240'><rect width='100%25' height='100%25' fill='%23ffffff'/><circle cx='100' cy='120' r='60' fill='%23fcbd00'/><rect x='70' y='100' width='60' height='40' rx='6' fill='%23323232'/><text x='100' y='126' font-family='sans-serif' font-size='16' font-weight='bold' text-anchor='middle' fill='%23ffffff'>JPG</text></svg>";

export default function ProductCardDevPreview() {
  const [quantities, setQuantities] = useState<Record<number, number>>({
    101: 0,
    102: 2, // Savatda 2 dona bor holat
    103: 0,
    104: 1,
    105: 0,
    106: 0,
    107: 0,
    108: 0,
    109: 0,
  });
  const [favorites, setFavorites] = useState<Record<number, boolean>>({
    101: true,
    102: false,
    103: false,
    104: true,
    105: false,
    106: false,
    107: true,
    108: false,
    109: false,
  });

  const [previewWidth, setPreviewWidth] = useState<number>(375);

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

        {/* YANGI BO'LIM: RASM FONI VA FORMAT SINOVI (Shaffof PNG vs Oq Fonli JPG vs Rasmsiz Placeholder) */}
        <div className="mb-8 rounded-2xl bg-white p-5 shadow-xs border border-neutral-200">
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-900">
                QORA FON MUAMMOSI TEKSHIRUVI
              </span>
            </div>
            <h2 className="mt-1 text-base font-black text-neutral-900">
              0. Shaffof PNG, Oq Fonli JPG va Rasmsiz Holat
            </h2>
            <p className="text-xs text-neutral-500">
              Shaffof PNG rasm ortida qora fon chiqmasligi, konteyner bg-white va rasm object-contain + p-2 padding bilan toza oq fonda joylashishi:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Shaffof PNG (fonsiz) */}
            <div className="flex flex-col items-center">
              <span className="mb-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                1. Shaffof PNG (Fonsiz flakon)
              </span>
              <div className="w-full max-w-[200px]">
                <ProductCardUI
                  product={SAMPLE_PRODUCTS.transparentPng}
                  photoSrc={TRANSPARENT_PNG_DATA_URL}
                  variant="md"
                  city="Toshkent"
                  ratingAvg={4.9}
                  ratingCount={11}
                  isFavorite={favorites[106]}
                  qty={quantities[106]}
                  onAdd={() => handleQty(106, 1)}
                  onChangeQty={(d) => handleQty(106, d)}
                  onToggleFavorite={() => handleFav(106)}
                />
              </div>
            </div>

            {/* 2. Oq Fonli JPG */}
            <div className="flex flex-col items-center">
              <span className="mb-1 text-[11px] font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-md">
                2. Oq Fonli JPG Mahsulot
              </span>
              <div className="w-full max-w-[200px]">
                <ProductCardUI
                  product={SAMPLE_PRODUCTS.whiteJpg}
                  photoSrc={WHITE_JPG_DATA_URL}
                  variant="md"
                  city="Samarqand"
                  ratingAvg={4.8}
                  ratingCount={25}
                  isFavorite={favorites[107]}
                  qty={quantities[107]}
                  onAdd={() => handleQty(107, 1)}
                  onChangeQty={(d) => handleQty(107, d)}
                  onToggleFavorite={() => handleFav(107)}
                />
              </div>
            </div>

            {/* 3. Rasmsiz Holat (Placeholder) */}
            <div className="flex flex-col items-center">
              <span className="mb-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                3. Rasmsiz (Toza Placeholder)
              </span>
              <div className="w-full max-w-[200px]">
                <ProductCardUI
                  product={SAMPLE_PRODUCTS.standard}
                  variant="md"
                  city="Andijon"
                  ratingAvg={4.7}
                  ratingCount={15}
                  isFavorite={favorites[101]}
                  qty={quantities[101]}
                  onAdd={() => handleQty(101, 1)}
                  onChangeQty={(d) => handleQty(101, d)}
                  onToggleFavorite={() => handleFav(101)}
                />
              </div>
            </div>
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

        {/* 5-BO'LIM: RESPONSIVE GRID VA MAXSUS HOLATLAR TEKSHIRUVI (360px, 375px, 390px, 768px, 1280px) */}
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-neutral-200">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-900">
                  7-BAND SINOVI
                </span>
                <span className="text-xs text-neutral-400">
                  360px, 375px, 390px, 768px, 1280px
                </span>
              </div>
              <h2 className="mt-1 text-base font-black text-neutral-900">
                5. Mobil va Desktop Kengliklarida 8 Ta Maxsus Holat
              </h2>
              <p className="text-xs text-neutral-500">
                Uzun nom (2 qator), bir qatorli nom, uzun narx (1 250 000 so&apos;m), narxsiz (&quot;Kelishiladi&quot;), reytingli, reytingsiz, rasmsiz va shaffof PNG:
              </p>
            </div>

            {/* Kenglik tanlash tugmalari */}
            <div className="flex items-center gap-1.5 rounded-xl bg-neutral-100 p-1 text-xs font-bold">
              {[360, 375, 390, 768, 1280].map((w) => (
                <button
                  key={`w-btn-${w}`}
                  type="button"
                  onClick={() => setPreviewWidth(w)}
                  className={`rounded-lg px-2.5 py-1 transition ${
                    previewWidth === w
                      ? "bg-white text-neutral-900 shadow-2xs font-black"
                      : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  {w}px
                </button>
              ))}
            </div>
          </div>

          {/* Tanlangan kenglikdagi ramka */}
          <div className="flex flex-col items-center">
            <div className="mb-2 flex items-center justify-between w-full max-w-full text-xs text-neutral-500 px-1 font-semibold">
              <span className="flex items-center gap-1.5">
                <Smartphone size={14} className="text-neutral-700" />
                Simulyator kengligi: <strong className="text-neutral-900">{previewWidth}px</strong>
                {previewWidth <= 420 ? " (Telefon - 2 ustun)" : previewWidth <= 800 ? " (Planshet - 3 ustun)" : " (Desktop - 4-5 ustun)"}
              </span>
              <span className="text-emerald-700 font-bold">
                Katalog kartochkalari
              </span>
            </div>

            <div
              style={{ width: previewWidth >= 1280 ? "100%" : `${previewWidth}px` }}
              className="max-w-full rounded-3xl border-4 border-neutral-800 bg-neutral-50 p-3 shadow-md transition-all duration-200"
            >
              <div
                className={`grid gap-2.5 ${
                  previewWidth <= 420
                    ? "grid-cols-2"
                    : previewWidth <= 800
                    ? "grid-cols-3"
                    : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                }`}
              >
                {/* 1. Uzun nom (2 qator) + reytingli */}
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

                {/* 2. Bir qatorli qisqa nom (min-h 2.4em tufayli tekis turadi) */}
                <ProductCardUI
                  product={SAMPLE_PRODUCTS.shortName}
                  variant="md"
                  city="Toshkent vil."
                  ratingAvg={4.7}
                  ratingCount={8}
                  isFavorite={favorites[108]}
                  qty={quantities[108]}
                  onAdd={() => handleQty(108, 1)}
                  onChangeQty={(d) => handleQty(108, d)}
                  onToggleFavorite={() => handleFav(108)}
                />

                {/* 3. Uzun narx (1 250 000 so'm) + savat stepper */}
                <ProductCardUI
                  product={SAMPLE_PRODUCTS.longPrice}
                  variant="md"
                  city="Farg'ona"
                  ratingAvg={5.0}
                  ratingCount={14}
                  isFavorite={favorites[103]}
                  qty={quantities[103]}
                  onAdd={() => handleQty(103, 1)}
                  onChangeQty={(d) => handleQty(103, d)}
                  onToggleFavorite={() => handleFav(103)}
                />

                {/* 4. Narxsiz holat ("Kelishiladi", text-[12px] font-semibold text-gray-500) */}
                <ProductCardUI
                  product={SAMPLE_PRODUCTS.noPrice}
                  variant="md"
                  city="Namangan"
                  ratingAvg={4.5}
                  ratingCount={6}
                  isFavorite={favorites[109]}
                  qty={quantities[109]}
                  onAdd={() => handleQty(109, 1)}
                  onChangeQty={(d) => handleQty(109, d)}
                  onToggleFavorite={() => handleFav(109)}
                />

                {/* 5. Standart mahsulot (reytingli: yulduz + 4.8 + (19) chapda, 1 litr o'ngda) */}
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

                {/* 6. Reytingsiz mahsulot (bo'sh yulduzcha va "Yangi"siz, faqat 1 kg o'ngda) */}
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

                {/* 7. Rasmsiz mahsulot (veterinariya toza placeholder) */}
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

                {/* 8. Shaffof PNG mahsulot (oq fonda toza turish testi) */}
                <ProductCardUI
                  product={SAMPLE_PRODUCTS.transparentPng}
                  photoSrc={TRANSPARENT_PNG_DATA_URL}
                  variant="md"
                  city="Qashqadaryo"
                  ratingAvg={4.9}
                  ratingCount={11}
                  isFavorite={favorites[106]}
                  qty={quantities[106]}
                  onAdd={() => handleQty(106, 1)}
                  onChangeQty={(d) => handleQty(106, d)}
                  onToggleFavorite={() => handleFav(106)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

