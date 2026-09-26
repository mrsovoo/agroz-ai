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
    <div className="group flex w-full flex-col justify-between overflow-hidden rounded-[18px] border border-black/8 bg-white shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Rasm oynasi — ixcham kvadrat (1:1) nisbatida */}
      <div className="relative w-full aspect-square overflow-hidden bg-neutral-50/60">
        <Link href={href} aria-label={medicine.name} className="block h-full w-full">
          {medicine.hasPhoto ? (
            <FadeImage
              src={medicine.photoVersion ? `/api/medicines/${medicine.id}/photo?v=${medicine.photoVersion}` : `/api/medicines/${medicine.id}/photo`}
              alt={medicine.name}
              className="h-full w-full bg-white transition-transform duration-300 group-hover:scale-105"
              fit="contain"
              fallback={
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{
                    background:
                      medicine.type === "animal"
                        ? "linear-gradient(135deg,#fff8e6,#ffefc2)"
                        : "linear-gradient(135deg,#f0fbe8,#def5d2)",
                  }}
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 shadow-2xs"
                    style={{
                      color: medicine.type === "animal" ? "#b45309" : "var(--brand-green)",
                    }}
                  >
                    {medicine.type === "animal" ? <Syringe size={22} /> : <Sprout size={22} />}
                  </span>
                </div>
              }
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-emerald-50/50 text-[var(--brand-green)]">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[var(--brand-green)] shadow-2xs border border-emerald-100">
                {medicine.type === "animal" ? <Syringe size={22} /> : <Sprout size={22} />}
              </span>
            </div>
          )}
        </Link>

        {/* ❤️ Yoqtirish tugmasi */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setLiked(toggleFavorite(pharmacy.id, medicine.id));
          }}
          aria-label={liked ? "Yoqtirilganlardan olib tashlash" : "Yoqtirilganlarga qo'shish"}
          aria-pressed={liked}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-neutral-600 shadow-2xs backdrop-blur-xs transition-transform active:scale-90 hover:bg-white"
        >
          <Heart
            size={14}
            className={liked ? "text-[#e0245e]" : "text-neutral-400"}
            fill={liked ? "#e0245e" : "none"}
          />
        </button>

        {/* Tur belgisi */}
        <span className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
          {medicine.type === "animal" ? "Chorva" : "Ekin"}
        </span>

        {isOutOfStock && (
          <span className="absolute left-2 bottom-2 rounded-md bg-rose-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs backdrop-blur-xs">
            Tugagan
          </span>
        )}
      </div>

      {/* Ma'lumot: Dori nomi, Narxi va Savatga / Hisoblagich (- soni +) */}
      <div className="flex flex-1 flex-col justify-between p-2.5 sm:p-3">
        <div>
          {/* Dori nomi */}
          <Link href={href} className="block">
            <h3
              className="line-clamp-2 min-h-[32px] text-[12px] sm:text-[13px] font-bold leading-snug text-neutral-900 hover:text-[var(--brand-green)] transition-colors"
              title={medicine.name}
            >
              {medicine.name}
            </h3>
          </Link>

          {/* Dorixona manzili va dori reytingi */}
          <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-neutral-500">
            <span className="flex items-center gap-1 truncate max-w-[65%]">
              <MapPin size={11} className="shrink-0 text-[var(--brand-green)]" />
              <span className="truncate">{shortCity}</span>
            </span>
            <span className="flex items-center gap-0.5 text-amber-600 font-bold shrink-0">
              <Star size={11} className="text-amber-400 fill-amber-400" />
              <span>{medRating.avg}</span>
            </span>
          </div>

          {/* Narxi */}
          <div className="mt-1 flex items-baseline">
            {medicine.price ? (
              <span className="text-[13.5px] sm:text-[14.5px] font-black text-neutral-950">
                {new Intl.NumberFormat("ru-RU").format(medicine.price).replace(/\u00a0/g, " ")}{" "}
                <span className="text-[11px] font-bold text-neutral-500">so&apos;m</span>
              </span>
            ) : (
              <span className="text-[11.5px] font-bold text-neutral-500">Kelishiladi</span>
            )}
          </div>
          {isLowStock && (
            <p className="mt-0.5 text-[10.5px] font-bold text-amber-700">
              ⚠️ Faqat {medicine.stock} {medicine.stockUnit || "dona"} qoldi
            </p>
          )}
        </div>

        {/* Savatga qo'shish yoki Tugagan bo'lsa Kelganda xabar berish */}
        <div className="mt-2.5">
          {isOutOfStock ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setNotified(true);
                alert(
                  `Xabarnoma olindi! "${medicine.name}" dori vositasi dorixonaga kelganda sizga Telegram orqali xabar yuboriladi.`,
                );
              }}
              className={`flex h-9 sm:h-9.5 w-full items-center justify-center gap-1.5 rounded-xl border text-[11.5px] font-bold transition active:scale-95 ${
                notified
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-neutral-300 bg-neutral-100 text-neutral-750 hover:bg-neutral-200"
              }`}
            >
              <Bell size={13} className={notified ? "text-emerald-600 fill-emerald-600" : "text-neutral-500"} />
              <span>{notified ? "Xabar beriladi ✓" : "Kelganda xabar berish"}</span>
            </button>
          ) : qty > 0 ? (
            <div className="flex h-9 sm:h-9.5 w-full items-center justify-between rounded-xl bg-[var(--brand-green-soft)] border border-[var(--brand-green)]/30 p-0.5 text-[var(--brand-green)]">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  changeQty(-1);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[var(--brand-green)] shadow-xs hover:bg-neutral-50 active:scale-90 transition font-black"
                aria-label="Kamaytirish"
              >
                <Minus size={15} strokeWidth={3} />
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
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-green)] text-white shadow-xs hover:brightness-105 active:scale-90 transition font-black"
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
              className="flex h-9 sm:h-9.5 w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--brand-green)] text-[13px] font-black text-white shadow-xs hover:brightness-105 active:scale-95 transition"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Savatga solish</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
