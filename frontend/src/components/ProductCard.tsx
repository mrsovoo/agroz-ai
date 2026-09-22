"use client";

/**
 * Umumiy mahsulot kartochkasi — Uzum Market uslubida.
 *
 * • Aniq 260×450 nisbatida (aspect 26/45), maksimal kengligi 260px
 * • Ichida 250×350 (5:7) rasm oynasi — rasm nisbati buzilmaydi
 * • Pastki qism: nomi, narxi, tavsifi, dorixona nomi
 * • ❤️ like (yoqtirilganlar, localStorage) va 🛒 Savatga (umumiy savat)
 * • Kartochka/rasm ustiga bosilsa — /dori/[id] tafsilot sahifasi
 * • Bosh sahifa, Agro Bozor va tafsilotdagi "o'xshash mahsulotlar" shu komponentdan
 *   chiziladi — ko'rinish hamma joyda bir xil.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Heart, ShoppingCart, Star, Store } from "lucide-react";
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
  /** Qo'shimcha: tafsilot sahifasi uchun (ixtiyoriy). */
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
  /** Kartochka bosilganda ochiladigan sahifa (standart: /dori/[id]). */
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

  const ratingAvg = medicine.ratingAvg ?? pharmacy.ratingAvg ?? null;
  const ratingCount = medicine.ratingCount ?? pharmacy.ratingCount ?? 0;

  const href = linkHref ?? `/dori/${medicine.id}`;
  const badgeBg =
    medicine.type === "animal"
      ? "var(--brand-yellow-soft)"
      : medicine.type === "crop"
        ? "var(--brand-green-soft)"
        : "#ccfbf1";
  const badgeColor =
    medicine.type === "animal"
      ? "var(--brand-ink)"
      : medicine.type === "crop"
        ? "var(--brand-green)"
        : "#0d9488";

  return (
    <div className="group flex w-full flex-col justify-between overflow-hidden rounded-[20px] sm:rounded-[22px] border border-black/5 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md active:scale-[0.99]">
      {/* Rasm oynasi: 5:7 nisbat, markazda, nisbat buzilmaydi */}
      <div className="relative w-full shrink-0 overflow-hidden bg-neutral-50/50">
        <Link href={href} aria-label={medicine.name} className="block">
          {medicine.hasPhoto ? (
            <FadeImage
              src={`/api/medicines/${medicine.id}/photo`}
              alt={medicine.name}
              className="aspect-[5/7] w-full bg-white transition-transform duration-300 group-hover:scale-105"
              fit="contain"
              fallback={
                <div
                  className="flex aspect-[5/7] w-full items-center justify-center"
                  style={{
                    background:
                      medicine.type === "animal"
                        ? "linear-gradient(135deg,#fff7df,#ffedb3)"
                        : medicine.type === "crop"
                          ? "linear-gradient(135deg,#f0fae8,#dcf3cf)"
                          : "linear-gradient(135deg,#eefdf9,#d4f5ee)",
                  }}
                >
                  <span
                    className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/80 shadow-xs"
                    style={{
                      color: medicine.type === "animal" ? "var(--brand-ink)" : "var(--brand-green)",
                    }}
                  >
                    <ShoppingCart size={20} />
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
                    : medicine.type === "crop"
                      ? "linear-gradient(135deg,#f0fae8,#dcf3cf)"
                      : "linear-gradient(135deg,#eefdf9,#d4f5ee)",
              }}
            >
              <span
                className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/80 shadow-xs"
                style={{
                  color: medicine.type === "animal" ? "var(--brand-ink)" : "var(--brand-green)",
                }}
              >
                <ShoppingCart size={20} />
              </span>
            </div>
          )}
        </Link>

        {/* Tur belgisi */}
        <span
          className="absolute left-2 top-2 sm:left-2.5 sm:top-2.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] sm:text-[10.5px] font-bold shadow-xs backdrop-blur-xs"
          style={{ background: badgeBg, color: badgeColor }}
        >
          {medicine.type === "animal" ? "🐄 Chorva" : medicine.type === "crop" ? "🌱 Ekin" : "📦 Umumiy"}
        </span>

        {/* ❤️ Yoqtirish */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setLiked(toggleFavorite(pharmacy.id, medicine.id));
          }}
          aria-label={liked ? "Yoqtirilganlardan olib tashlash" : "Yoqtirilganlarga qo'shish"}
          aria-pressed={liked}
          className="absolute right-2 top-2 sm:right-2.5 sm:top-2.5 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/95 text-neutral-600 shadow-sm transition-transform active:scale-90 hover:scale-105 hover:bg-white"
        >
          <Heart
            size={15}
            className={liked ? "text-[#e0245e]" : "text-neutral-400"}
            fill={liked ? "#e0245e" : "none"}
          />
        </button>
      </div>

      {/* Pastki qism: nomi, reyting, nima uchun ekanligi, narxi, dorixona, Savatga */}
      <div className="flex flex-1 flex-col justify-between p-2.5 sm:p-3">
        <div className="space-y-1.5">
          {/* Nomi */}
          <Link href={href} className="group/title block">
            <h3
              className="line-clamp-2 min-h-[34px] sm:min-h-[38px] text-[12.5px] sm:text-[13.5px] font-bold leading-snug text-neutral-900 group-hover/title:text-[var(--brand-green)] transition-colors"
              title={medicine.name}
            >
              {medicine.name}
            </h3>
          </Link>

          {/* Reyting (yulduzchalar va baholar soni) */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 text-[11px] sm:text-[11.5px] font-black text-amber-500">
              <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />
              <span>{ratingAvg !== null && ratingAvg > 0 ? ratingAvg.toFixed(1) : "5.0"}</span>
            </div>
            <span className="text-[10px] sm:text-[10.5px] font-medium text-neutral-400">
              {ratingCount > 0 ? `(${ratingCount} baho)` : "(yangi)"}
            </span>
          </div>

          {/* Nima uchun ekanligi / Qo'llanilishi */}
          <div className="rounded-lg bg-emerald-50/80 px-2 py-1 border border-emerald-200/50">
            <div className="flex items-start gap-1">
              <span className="text-[9.5px] sm:text-[10px] font-extrabold uppercase tracking-wide text-emerald-800 shrink-0">
                Qo&apos;llanishi:
              </span>
              <p
                className="line-clamp-2 text-[10.5px] sm:text-[11px] font-medium leading-tight text-emerald-950"
                title={medicine.usage ?? undefined}
              >
                {medicine.usage || (medicine.type === "crop" ? "Ekin kasalliklari va zararkunandalarga qarshi" : medicine.type === "animal" ? "Chorva mollari va parrandalar salomatligi uchun" : "Agro va veterinariya vositasi")}
              </p>
            </div>
          </div>

          {/* Narxi */}
          <div className="pt-0.5 flex items-baseline gap-1.5">
            {medicine.price ? (
              <span className="text-[13.5px] sm:text-[15px] font-black leading-tight text-[var(--brand-green)]">
                {new Intl.NumberFormat("ru-RU").format(medicine.price).replace(/\u00a0/g, " ")} so&apos;m
              </span>
            ) : (
              <span className="text-[11.5px] sm:text-[12px] font-bold leading-tight text-neutral-500">
                Kelishilgan narxda
              </span>
            )}
          </div>

          {/* Dorixona ma'lumoti */}
          <p
            className="truncate text-[10.5px] sm:text-[11px] font-medium text-neutral-500 flex items-center gap-1"
            title={pharmacy.name}
          >
            <Store size={12} className="shrink-0 text-neutral-400" />
            <span className="truncate">{pharmacy.name}</span>
          </p>
        </div>

        {/* Savatga tugmasi */}
        <button
          type="button"
          onClick={add}
          className={`mt-2.5 flex h-8 sm:h-9 w-full items-center justify-center gap-1 sm:gap-1.5 rounded-xl text-[11px] sm:text-[12.5px] font-bold transition active:scale-[0.97] ${
            qty > 0
              ? "bg-[var(--brand-green-soft)] text-[var(--brand-green)] border border-[var(--brand-green)]/20"
              : "bg-[var(--brand-green)] text-white hover:brightness-105 shadow-xs"
          }`}
        >
          {qty > 0 ? <Check size={13} className="stroke-[3]" /> : <ShoppingCart size={13} />}
          <span>
            {qty > 0 ? (
              <>
                <span className="inline sm:hidden">Savatda ({qty})</span>
                <span className="hidden sm:inline">Savatda ({qty} ta)</span>
              </>
            ) : (
              <>
                <span className="inline sm:hidden">Savatga</span>
                <span className="hidden sm:inline">Savatga qo&apos;shish</span>
              </>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}
