"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

export type ProductCardMedicine = CartStoreMedicine & {
  usage?: string | null;
  ratingAvg?: number | null;
  ratingCount?: number;
};

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
  const [notified, setNotified] = useState(false);

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

  const href = linkHref ?? `/dori/${medicine.id}`;
  const shortCity = getShortCity(pharmacy.address, pharmacy.name);
  const medRating = calculateMedicineRating(medicine.id);
  const isOutOfStock =
    (medicine.stock !== null && medicine.stock !== undefined && medicine.stock <= 0) ||
    medicine.status === "yoq";
  const isLowStock =
    medicine.stock !== null &&
    medicine.stock !== undefined &&
    medicine.stock > 0 &&
    medicine.stock <= 3;

  return (
    <div className="group flex w-full flex-col justify-between rounded-[24px] bg-[#f8f9fa] border border-neutral-100 p-3 shadow-2xs transition-all duration-200 active:scale-[0.98]">
      {/* Rasm maydoni — toza oq, yumaloq burchakli blok */}
      <div className="relative mb-2.5 flex h-[135px] w-full items-center justify-center overflow-hidden rounded-[18px] bg-white border border-neutral-100/80">
        <Link href={href} aria-label={medicine.name} className="block h-full w-full">
          {medicine.hasPhoto ? (
            <FadeImage
              src={medicine.photoVersion ? `/api/medicines/${medicine.id}/photo?v=${medicine.photoVersion}` : `/api/medicines/${medicine.id}/photo`}
              alt={medicine.name}
              className="h-full w-full bg-white transition-transform duration-300 group-hover:scale-105"
              fit="contain"
              fallback={
                <div className="flex h-full w-full items-center justify-center bg-white" />
              }
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white" />
          )}
        </Link>
      </div>

      {/* Ma'lumot: Nomi, Tavsifi, Narxi va + Savatga */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          {/* Nomi */}
          <Link href={href} className="block">
            <h3
              className="text-[15px] font-black leading-tight text-neutral-900 line-clamp-1 hover:text-[#039e1e] transition-colors"
              title={medicine.name}
            >
              {medicine.name}
            </h3>
          </Link>

          {/* Tavsifi */}
          <p className="mt-1 text-[11.5px] leading-tight text-neutral-500 line-clamp-2">
            {medicine.usage || "Tabiiy minerallarga boy ozuqa"}
          </p>
        </div>

        <div className="mt-3">
          {/* Narxi */}
          <p className="text-[15px] font-black text-neutral-900">
            {medicine.price
              ? new Intl.NumberFormat("uz-UZ").format(medicine.price).replace(/\s/g, ".") + " so'm"
              : "35.000 so'm"}
          </p>

          {/* + Savatga tugmasi */}
          <div className="mt-2">
            {qty > 0 ? (
              <div className="flex h-10 w-full items-center justify-between rounded-full bg-[#eaf5e1] border border-[#039e1e]/30 px-1 text-[#039e1e]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    changeQty(-1);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#039e1e] shadow-xs active:scale-90 transition font-black"
                  aria-label="Kamaytirish"
                >
                  <Minus size={14} strokeWidth={3} />
                </button>

                <span className="text-[13px] font-black tracking-tight select-none">
                  {qty} ta
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    changeQty(1);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#039e1e] text-white shadow-xs active:scale-90 transition font-black"
                  aria-label="Ko'paytirish"
                >
                  <Plus size={14} strokeWidth={3} />
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
                className="flex w-full items-center justify-center rounded-full bg-[#039e1e] hover:bg-[#028518] py-2.5 text-[13px] font-bold text-white shadow-2xs active:scale-95 transition-all"
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
