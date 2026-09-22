"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Minus, Heart, Pill, Sprout, Syringe } from "lucide-react";
import FadeImage from "@/components/FadeImage";
import {
  loadCart,
  saveCart,
  notifyCartChanged,
  CART_EVENT,
  type CartStoreMedicine,
  type CartStorePharmacy,
} from "@/lib/cart-store";
import { isFavorite, toggleFavorite, FAV_EVENT } from "@/lib/favorites-store";

export type ProductCardMedicine = CartStoreMedicine & {
  usage?: string | null;
  ratingAvg?: number | null;
  ratingCount?: number;
};

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
      setQty(
        cart && cart.pharmacy.id === pharmacy.id
          ? (cart.lines.find((l) => l.medicine.id === medicine.id)?.qty ?? 0)
          : 0,
      );
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
    if (cart && cart.pharmacy.id !== pharmacy.id) {
      if (
        !confirm(
          `Savatda boshqa dorixona (${cart.pharmacy.name}) dorilari bor. Yangi dorixona dorilari savatni almashtiradi. Davom etamizmi?`,
        )
      ) {
        return;
      }
    }
    if (!cart || cart.pharmacy.id !== pharmacy.id) {
      saveCart({ pharmacy, lines: [{ medicine, qty: 1 }] });
    } else {
      const existing = cart.lines.find((l) => l.medicine.id === medicine.id);
      const lines = existing
        ? cart.lines.map((l) =>
            l.medicine.id === medicine.id ? { ...l, qty: Math.min(99, l.qty + 1) } : l,
          )
        : [...cart.lines, { medicine, qty: 1 }];
      saveCart({ ...cart, lines });
    }
    notifyCartChanged();
  }

  function changeQty(delta: number) {
    const cart = loadCart();
    if (!cart || cart.pharmacy.id !== pharmacy.id) {
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
      saveCart(lines.length > 0 ? { ...cart, lines } : null);
    } else {
      const lines = cart.lines.map((l) =>
        l.medicine.id === medicine.id ? { ...l, qty: Math.min(99, nextQty) } : l,
      );
      saveCart({ ...cart, lines });
    }
    notifyCartChanged();
  }

  const href = linkHref ?? `/dori/${medicine.id}`;

  return (
    <div className="group flex w-full flex-col justify-between overflow-hidden rounded-[18px] border border-black/8 bg-white shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Rasm oynasi — ixcham kvadrat (1:1) nisbatida */}
      <div className="relative w-full aspect-square overflow-hidden bg-neutral-50/60">
        <Link href={href} aria-label={medicine.name} className="block h-full w-full">
          {medicine.hasPhoto ? (
            <FadeImage
              src={`/api/medicines/${medicine.id}/photo`}
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
        </div>

        {/* Savatga qo'shish yoki - {soni} + hisoblagichi */}
        <div className="mt-2.5">
          {qty > 0 ? (
            <div className="flex h-8 w-full items-center justify-between rounded-xl bg-[var(--brand-green-soft)] border border-[var(--brand-green)]/25 p-0.5 text-[var(--brand-green)]">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  changeQty(-1);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[var(--brand-green)] shadow-2xs hover:bg-neutral-50 active:scale-85 transition font-black"
                aria-label="Kamaytirish"
              >
                <Minus size={13} strokeWidth={3} />
              </button>

              <span className="text-[12.5px] font-black tracking-tight select-none">
                {qty} ta
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  changeQty(1);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--brand-green)] text-white shadow-2xs hover:brightness-105 active:scale-85 transition font-black"
                aria-label="Ko'paytirish"
              >
                <Plus size={13} strokeWidth={3} />
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
              className="flex h-8 w-full items-center justify-center gap-1 rounded-xl bg-[var(--brand-green)] text-[12px] font-bold text-white shadow-2xs hover:brightness-105 active:scale-95 transition"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Savatga</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
