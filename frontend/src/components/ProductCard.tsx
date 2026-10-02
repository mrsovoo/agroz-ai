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
import { calculateMedicineRating } from "@/lib/medicine-reviews";
import { apiUrl } from "@/lib/api-config";

export type PharmacyMedicine = CartStoreMedicine & {
  usage?: string | null;
  ratingAvg?: number | null;
  ratingCount?: number;
  updatedAt?: string | null;
};

export type ProductCardMedicine = PharmacyMedicine;

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

  useEffect(() => {
    const sync = () => {
      setLiked(isFavorite(pharmacy.id, medicine.id));
      const cart = loadCart();
      const inLine = cart?.lines?.find((l) => l.medicine.id === medicine.id);
      setQty(inLine ? inLine.qty : 0);
    };
    sync();
    window.addEventListener(FAV_EVENT, sync);
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FAV_EVENT, sync);
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [pharmacy.id, medicine.id]);

  function add() {
    const cart = loadCart();
    const newPharmacy: CartStorePharmacy = {
      id: pharmacy.id,
      name: pharmacy.name,
      phone: pharmacy.phone,
      address: pharmacy.address ?? null,
    };

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
          <span className="text-[11px] font-bold text-emerald-900/80 tracking-tight">Ekin agro-mahsulotsi</span>
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
        <span className="text-[11px] font-bold text-neutral-600 tracking-tight">Agro agro-mahsulot</span>
      </div>
    );
  };

  const updatedText = formatMedicineUpdatedAt(medicine.updatedAt);

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex h-full w-full cursor-pointer flex-col justify-between rounded-[22px] bg-[#f8f9fa] border border-neutral-100 p-2.5 sm:p-3 shadow-2xs transition-all duration-200 hover:shadow-xs hover:border-neutral-200/80 active:scale-[0.99]"
    >
      {/* Rasm maydoni — balandligi oshirilgan (aspect-[3/4]), rasm va tur ikonkasi aniq va katta ko'rinadi */}
      <div className="relative mb-2.5 flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-[16px] bg-neutral-100/80 border border-neutral-200/60">
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

        <Link href={href} aria-label={medicine.name} className="block h-full w-full">
          {medicine.hasPhoto ? (
            <FadeImage
              src={medicine.photoVersion ? `/api/medicines/${medicine.id}/photo?v=${medicine.photoVersion}` : `/api/medicines/${medicine.id}/photo`}
              alt={medicine.name}
              className="h-full w-full transition-transform duration-300 group-hover:scale-105"
              fit="cover"
              fallback={renderPlaceholder()}
            />
          ) : (
            renderPlaceholder()
          )}
        </Link>
      </div>

      {/* Ma'lumot: Nomi, Tavsifi, Narxi va + Savatga */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          {/* Nomi */}
          <Link href={href} className="block">
            <h3
              className="text-[13.5px] sm:text-[14.5px] font-black leading-snug text-neutral-900 line-clamp-1 hover:text-[#039e1e] transition-colors"
              title={medicine.name}
            >
              {medicine.name}
            </h3>
          </Link>

          {/* Tavsifi */}
          {medicine.usage && (
            <p className="mt-1 text-[11px] sm:text-[11.5px] leading-tight text-neutral-500 line-clamp-2 min-h-[26px]">
              {medicine.usage}
            </p>
          )}
        </div>

        <div className="mt-2.5">
          {/* Narxi (agar narxi kiritilmagan bo'lsa "Kelishiladi") */}
          <div className="flex items-baseline justify-between gap-1">
            {medicine.price && medicine.price > 0 ? (
              <p className="text-[14px] sm:text-[15px] font-black text-neutral-900 tracking-tight">
                {new Intl.NumberFormat("uz-UZ").format(medicine.price).replace(/\s/g, ".")} so&apos;m
              </p>
            ) : (
              <span className="inline-flex items-center rounded-lg bg-neutral-200/70 px-2 py-0.5 text-[11.5px] sm:text-[12px] font-extrabold text-neutral-700 tracking-tight">
                Kelishiladi
              </span>
            )}
            {medicine.stockUnit && (
              <span className="text-[11px] text-neutral-400 font-medium">
                / {medicine.stockUnit}
              </span>
            )}
          </div>
          {updatedText && (
            <p className="mt-0.5 text-[10.5px] font-medium text-neutral-400">
              {updatedText}
            </p>
          )}

          {/* + Savatga tugmasi */}
          <div className="mt-2">
            {qty > 0 ? (
              <div className="flex h-11 min-h-[44px] w-full items-center justify-between rounded-full bg-[#eaf5e1] border border-[#039e1e]/30 px-0.5 text-[#039e1e]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    changeQty(-1);
                  }}
                  className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white text-[#039e1e] shadow-xs active:scale-90 transition font-black"
                  aria-label="Kamaytirish"
                >
                  <Minus size={15} strokeWidth={3} />
                </button>

                <span className="text-[12.5px] sm:text-[13px] font-black tracking-tight select-none">
                  {qty} ta
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    changeQty(1);
                  }}
                  className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-[#039e1e] text-white shadow-xs active:scale-90 transition font-black"
                  aria-label="Ko'paytirish"
                >
                  <Plus size={15} strokeWidth={3} />
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
                className="flex h-11 min-h-[44px] w-full items-center justify-center rounded-full bg-[#039e1e] hover:bg-[#028518] px-3 text-[12.5px] sm:text-[13px] font-bold text-white shadow-2xs active:scale-95 transition-all"
              >
                + Savatga
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

