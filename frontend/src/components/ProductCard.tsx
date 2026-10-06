"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Minus, Heart, Pill, Sprout, Syringe, MapPin, Star, Bell } from "lucide-react";
import FadeImage from "@/components/FadeImage";
import {
  loadCart,
  saveCart,
  notifyCartChanged,
  CART_EVENT,
  type CartStoreMedicine,
  type CartStorePharmacy,
  type CartStoreLine,
} from "@/lib/cart-store";
import { isFavorite, toggleFavorite, FAV_EVENT } from "@/lib/favorites-store";
import { calculateMedicineRating, REVIEWS_EVENT } from "@/lib/medicine-reviews";
import { apiUrl } from "@/lib/api-config";

export type PharmacyMedicine = CartStoreMedicine & {
  usage?: string | null;
  ratingAvg?: number | null;
  ratingCount?: number;
  updatedAt?: string | null;
};

export type ProductCardMedicine = PharmacyMedicine;

export function formatUnit(stockUnit?: string | null): string {
  if (!stockUnit) return "dona";
  const u = stockUnit.toLowerCase().trim();
  if (u === "kg" || u === "kilo" || u === "kilogram" || u === "кг") return "kg";
  if (u === "litr" || u === "l" || u === "liter" || u === "литр" || u === "л") return "litr";
  if (u === "dona" || u === "donasi" || u === "ta" || u === "дона" || u === "sht") return "dona";
  return u;
}

export function formatMedicineUpdatedAt(updatedAt?: string | null): string | null {
  if (!updatedAt) return null;
  const ts = new Date(updatedAt).getTime();
  if (!Number.isFinite(ts)) return null;
  const diffMs = Math.max(0, Date.now() - ts);
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Bugun yangilangan";
  if (diffDays === 1) return "1 kun oldin yangilangan";
  if (diffDays < 30) return `${diffDays} kun oldin yangilangan`;
  const months = Math.floor(diffDays / 30);
  return `${months} oy oldin yangilangan`;
}

export function getShortCity(address?: string | null, orgName?: string | null): string {
  const text = `${address || ""} ${orgName || ""}`.toLowerCase();
  if (text.includes("toshkent vil")) return "Toshkent vil.";
  if (
    text.includes("toshkent sh") ||
    text.includes("toshkent") ||
    text.includes("chilonzor") ||
    text.includes("sergeli") ||
    text.includes("yunusobod")
  ) {
    return "Toshkent sh.";
  }
  if (text.includes("samarqand")) return "Samarqand";
  if (text.includes("farg'ona") || text.includes("fargona") || text.includes("vodiy")) return "Farg'ona";
  if (text.includes("andijon")) return "Andijon";
  if (text.includes("namangan")) return "Namangan";
  if (text.includes("buxoro") || text.includes("zarafshon")) return "Buxoro";
  if (text.includes("navoiy")) return "Navoiy";
  if (text.includes("qashqadaryo") || text.includes("qarshi")) return "Qashqadaryo";
  if (text.includes("surxondaryo") || text.includes("termiz")) return "Surxondaryo";
  if (text.includes("xorazm") || text.includes("urganch")) return "Xorazm";
  if (text.includes("jizzax")) return "Jizzax";
  if (text.includes("sirdaryo") || text.includes("guliston")) return "Sirdaryo";
  if (text.includes("qoraqalpog'iston") || text.includes("nukus")) return "Qoraqalpog'iston";
  if (address) {
    const first = address.split(",")[0].trim();
    return first.length <= 16 ? first : first.slice(0, 14) + "..";
  }
  return "O'zbekiston";
}

export default function ProductCard({
  medicine,
  pharmacy,
  linkHref,
}: {
  medicine: ProductCardMedicine;
  pharmacy: CartStorePharmacy;
  linkHref?: string;
}) {
  const [liked, setLiked] = useState(false);
  const [qty, setQty] = useState(0);
  const [ratingStats, setRatingStats] = useState({ avg: 0, count: 0 });

  useEffect(() => {
    const sync = () => {
      setLiked(isFavorite(pharmacy.id, medicine.id));
      const cart = loadCart();
      const inLine = cart?.lines?.find((l) => l.medicine.id === medicine.id);
      setQty(inLine ? inLine.qty : 0);

      // Reyting hisoblash: avval mahsulotga qoldirilgan sharhlar, bo'lmasa mavjud reyting
      const calculated = calculateMedicineRating(medicine.id);
      if (calculated.count > 0) {
        setRatingStats({ avg: calculated.avg, count: calculated.count });
      } else if (medicine.ratingAvg && medicine.ratingAvg > 0) {
        setRatingStats({ avg: Number(medicine.ratingAvg.toFixed(1)), count: medicine.ratingCount ?? 0 });
      } else {
        setRatingStats({ avg: 0, count: 0 });
      }
    };
    sync();
    window.addEventListener(FAV_EVENT, sync);
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener(REVIEWS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FAV_EVENT, sync);
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener(REVIEWS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [pharmacy.id, medicine.id, medicine.ratingAvg, medicine.ratingCount]);

  function add() {
    const cart = loadCart();
    const newPharmacy: CartStorePharmacy = {
      id: pharmacy.id,
      name: pharmacy.name,
      phone: pharmacy.phone,
      address: pharmacy.address ?? null,
    };

    if (cart && cart.pharmacy && cart.pharmacy.id !== pharmacy.id && cart.lines.length > 0) {
      if (
        !confirm(
          `Savatda boshqa agro-do'kon (${cart.pharmacy.name}) dorilari bor. Yangi agro-do'kon dorilari savatni almashtiradi. Davom etamizmi?`,
        )
      ) {
        return;
      }
      saveCart({
        pharmacy: newPharmacy,
        lines: [{ medicine, pharmacy: newPharmacy, qty: 1 }],
      });
      notifyCartChanged();
      return;
    }

    if (!cart || !Array.isArray(cart.lines) || cart.lines.length === 0) {
      saveCart({
        pharmacy: newPharmacy,
        lines: [{ medicine, pharmacy: newPharmacy, qty: 1 }],
      });
    } else {
      const existing = cart.lines.find((l) => l.medicine.id === medicine.id);
      const lines: CartStoreLine[] = existing
        ? cart.lines.map((l) =>
            l.medicine.id === medicine.id ? { ...l, qty: Math.min(99, l.qty + 1) } : l,
          )
        : [...cart.lines, { medicine, pharmacy: newPharmacy, qty: 1 }];
      saveCart({ pharmacy: cart.pharmacy || newPharmacy, lines });
    }
    notifyCartChanged();
  }

  function changeQty(delta: number) {
    const cart = loadCart();
    if (!cart || !Array.isArray(cart.lines) || cart.lines.length === 0) {
      if (delta > 0) add();
      return;
    }
    const existing = cart.lines.find((l) => l.medicine.id === medicine.id);
    if (!existing) {
      if (delta > 0) add();
      return;
    }

    const nextQty = existing.qty + delta;
    if (nextQty <= 0) {
      const lines = cart.lines.filter((l) => l.medicine.id !== medicine.id);
      saveCart(
        lines.length > 0
          ? { pharmacy: lines[0].pharmacy || cart.pharmacy, lines }
          : null,
      );
    } else {
      const lines = cart.lines.map((l) =>
        l.medicine.id === medicine.id ? { ...l, qty: Math.min(99, nextQty) } : l,
      );
      saveCart({ ...cart, lines });
    }
    notifyCartChanged();
  }

  const router = useRouter();
  const href = linkHref ?? `/dori/${medicine.id}`;

  const handleCardClick = (e: React.MouseEvent) => {
    // Agar foydalanuvchi tugmani (savatga qo'shish, ayirish va h.k.) bosgan bo'lsa, sahifaga o'tmaydi
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    router.push(href);
  };

  const renderPlaceholder = () => {
    if (medicine.type === "crop") {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-emerald-50 via-[#f0fae8] to-green-100/60 p-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs border border-emerald-100/80">
            <Sprout size={28} className="text-[#039e1e]" />
          </div>
          <span className="text-[11px] font-bold text-emerald-900/80 tracking-tight">Ekin dorisi</span>
        </div>
      );
    }
    if (medicine.type === "animal") {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-amber-50 via-[#fff8eb] to-yellow-100/60 p-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs border border-amber-100/80">
            <Syringe size={28} className="text-amber-600" />
          </div>
          <span className="text-[11px] font-bold text-amber-900/80 tracking-tight">Veterinariya</span>
        </div>
      );
    }
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200/50 p-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs border border-neutral-200/60">
          <Pill size={28} className="text-neutral-500" />
        </div>
        <span className="text-[11px] font-bold text-neutral-600 tracking-tight">Agro dori</span>
      </div>
    );
  };

  const updatedText = formatMedicineUpdatedAt(medicine.updatedAt);

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex h-full w-full cursor-pointer flex-col justify-between rounded-[22px] bg-white border border-neutral-200/80 p-2.5 sm:p-3 shadow-2xs transition-all duration-200 hover:shadow-xs hover:border-emerald-400/80 active:scale-[0.99]"
    >
      {/* Rasm maydoni — toza, oq fonda, burchaklari kartochkaga mos (rounded-[16px]) */}
      <div className="relative mb-2.5 flex aspect-[1/1] w-full items-center justify-center overflow-hidden rounded-[16px] bg-white border border-neutral-200/80">
        {/* Tur ikonkasi va belgisi */}
        <div className="absolute top-2 left-2 z-10 pointer-events-none">
          {medicine.type === "crop" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-emerald-800 shadow-2xs border border-emerald-200/60">
              <Sprout size={11} className="text-[#039e1e]" /> Ekin
            </span>
          ) : medicine.type === "animal" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-amber-900 shadow-2xs border border-amber-200/60">
              <Syringe size={11} className="text-amber-600" /> Hayvon
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-neutral-700 shadow-2xs border border-neutral-200/60">
              <Pill size={11} className="text-neutral-500" /> Umumiy
            </span>
          )}
        </div>

        {/* Sevimlilar ❤️ tugmasi */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const next = toggleFavorite(pharmacy.id, medicine.id);
            setLiked(next);
          }}
          aria-label={liked ? "Yoqtirilganlardan o'chirish" : "Sevimlilarga qo'shish"}
          className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md shadow-2xs border border-black/5 hover:bg-white active:scale-90 transition"
        >
          <Heart
            size={16}
            className={liked ? "text-red-500 fill-red-500" : "text-neutral-400 hover:text-red-400"}
          />
        </button>

        <Link href={href} aria-label={medicine.name} className="block h-full w-full">
          {medicine.hasPhoto ? (
            <FadeImage
              src={medicine.photoVersion ? `/api/medicines/${medicine.id}/photo?v=${medicine.photoVersion}` : `/api/medicines/${medicine.id}/photo`}
              alt={medicine.name}
              className="h-full w-full transition-transform duration-300 group-hover:scale-105 p-1.5"
              fit="contain"
              fallback={renderPlaceholder()}
            />
          ) : (
            renderPlaceholder()
          )}
        </Link>
      </div>

      {/* Ma'lumot: Turgan manzil, Dori nomi, Tavsifi, Reyting, Narxi / donasi (kg / litr) va Savatga */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          {/* 1. O'sha turgan manzil (Dorixona nomi yo'q) */}
          <div className="flex items-center gap-1 text-[11px] sm:text-[11.5px] font-medium text-neutral-400 mb-1">
            <MapPin size={11} className="text-[#039e1e] shrink-0" />
            <span className="truncate">{getShortCity(pharmacy.address)}</span>
          </div>

          {/* 2. Dori Nomi */}
          <Link href={href} className="block group/title">
            <h3
              className="text-[14px] sm:text-[15px] font-black leading-snug text-neutral-900 line-clamp-1 group-hover/title:text-[#039e1e] transition-colors"
              title={medicine.name}
            >
              {medicine.name}
            </h3>
          </Link>

          {/* 3. Dorining nomi tagida qisqartirilgan ixcham tavsifi (To'liq tavsif ustiga bosganda chiqadi) */}
          <p className="mt-0.5 text-[11px] sm:text-[11.5px] leading-normal text-neutral-500 line-clamp-1 font-medium">
            {medicine.usage || "Qo'llanilishi bo'yicha batafsil ko'rish"}
          </p>
        </div>

        <div className="mt-2 pt-1.5 border-t border-neutral-100">
          {/* 4. Reyting va birligi */}
          <div className="flex items-center justify-between gap-1 mb-1">
            {ratingStats.count > 0 ? (
              <div className="inline-flex items-center gap-0.5 text-amber-500 font-extrabold text-[11px]">
                <Star size={11} className="fill-amber-400 text-amber-400" />
                <span>{ratingStats.avg.toFixed(1)}</span>
                <span className="text-[10px] text-neutral-400 font-medium">
                  ({ratingStats.count})
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-0.5 text-[10.5px] text-neutral-400 font-medium">
                <Star size={10} className="text-neutral-300" />
                <span>Yangi</span>
              </div>
            )}

            {/* Birlik (dona / kg / litr) */}
            <span className="text-[10.5px] sm:text-[11px] font-bold text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded-md">
              1 {formatUnit(medicine.stockUnit)}
            </span>
          </div>

          {/* 5. Narxi */}
          <div className="flex items-baseline gap-1">
            {medicine.price && medicine.price > 0 ? (
              <p className="text-[14.5px] sm:text-[15.5px] font-black text-neutral-900 tracking-tight">
                {new Intl.NumberFormat("uz-UZ").format(medicine.price).replace(/\s/g, ".")}{" "}
                <span className="text-[11.5px] font-bold text-neutral-500">so&apos;m</span>
              </p>
            ) : (
              <span className="inline-flex items-center rounded-lg bg-neutral-100 px-2 py-0.5 text-[11.5px] sm:text-[12px] font-bold text-neutral-700 tracking-tight">
                Kelishiladi
              </span>
            )}
          </div>

          {/* 6. Savatga qo'shish buttoni — toza va moslashuvchan */}
          <div className="mt-2.5">
            {qty > 0 ? (
              <div className="flex h-10 min-h-[40px] w-full items-center justify-between rounded-[14px] bg-[#eaf5e1] border border-[#039e1e]/25 px-1 text-[#039e1e] shadow-2xs">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    changeQty(-1);
                  }}
                  className="flex h-8 w-8 min-h-[32px] min-w-[32px] items-center justify-center rounded-[10px] bg-white text-[#039e1e] shadow-xs active:scale-90 transition font-black hover:bg-neutral-50"
                  aria-label="Kamaytirish"
                >
                  <Minus size={14} strokeWidth={2.8} />
                </button>

                <span className="text-[12px] sm:text-[12.5px] font-black tracking-tight select-none">
                  {qty} {formatUnit(medicine.stockUnit)}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    changeQty(1);
                  }}
                  className="flex h-8 w-8 min-h-[32px] min-w-[32px] items-center justify-center rounded-[10px] bg-[#039e1e] text-white shadow-xs active:scale-90 transition font-black hover:bg-[#028518]"
                  aria-label="Ko'paytirish"
                >
                  <Plus size={14} strokeWidth={2.8} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  add();
                }}
                className="flex h-10 min-h-[40px] w-full items-center justify-center gap-1.5 rounded-[14px] bg-[#039e1e] hover:bg-[#028518] px-3 text-[13px] font-black text-white shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all duration-150"
              >
                <Plus size={15} strokeWidth={2.8} />
                <span>Savatga</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

