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
import { Check, Heart, ShoppingCart } from "lucide-react";
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
    <div className="mx-auto flex aspect-[26/45] w-full max-w-[260px] flex-col overflow-hidden rounded-[22px] bg-white shadow-sm transition-transform active:scale-[0.99]">
      {/* Rasm oynasi: 250×350 (5:7), markazda, nisbat buzilmaydi */}
      <div className="relative mx-auto w-[96%] shrink-0">
        <Link href={href} aria-label={medicine.name} className="block">
          {medicine.hasPhoto ? (
            <FadeImage
              src={`/api/medicines/${medicine.id}/photo`}
              alt={medicine.name}
              className="aspect-[5/7] w-full bg-white"
              fit="contain"
              fallback={
                <div
                  className="flex h-full w-full items-center justify-center"
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
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80"
                    style={{
                      color: medicine.type === "animal" ? "var(--brand-ink)" : "var(--brand-green)",
                    }}
                  >
                    <ShoppingCart size={22} />
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
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80"
                style={{
                  color: medicine.type === "animal" ? "var(--brand-ink)" : "var(--brand-green)",
                }}
              >
                <ShoppingCart size={22} />
              </span>
            </div>
          )}
        </Link>

        {/* Tur belgisi */}
        <span
          className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm"
          style={{ background: badgeBg, color: badgeColor }}
        >
          {medicine.type === "animal" ? "🐄 Hayvon" : medicine.type === "crop" ? "🌱 Ekin" : "📦 Umumiy"}
        </span>

        {/* ❤️ Yoqtirish */}
        <button
          onClick={() => setLiked(toggleFavorite(pharmacy.id, medicine.id))}
          aria-label={liked ? "Yoqtirilganlardan olib tashlash" : "Yoqtirilganlarga qo'shish"}
          aria-pressed={liked}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm transition active:scale-90"
        >
          <Heart
            size={16}
            className={liked ? "text-[#e0245e]" : "text-[var(--brand-muted)]"}
            fill={liked ? "#e0245e" : "none"}
          />
        </button>
      </div>

      {/* Pastki qism: nomi, narxi, tavsifi, Savatga */}
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden px-2.5 pb-2 pt-1.5">
        <Link href={href} className="min-w-0">
          <p
            className="truncate text-[13px] font-bold leading-tight text-[var(--brand-ink)]"
            title={medicine.name}
          >
            {medicine.name}
          </p>
        </Link>
        {medicine.price ? (
          <p className="text-[14px] font-black leading-tight text-[var(--brand-green)]">
            {new Intl.NumberFormat("ru-RU").format(medicine.price).replace(/\u00a0/g, " ")} so&apos;m
          </p>
        ) : (
          <p className="text-[12px] font-bold leading-tight text-[var(--brand-muted)]">
            Narx so&apos;rang
          </p>
        )}
        {medicine.usage && (
          <p
            className="truncate text-[10.5px] leading-tight text-[var(--brand-muted)]"
            title={medicine.usage}
          >
            {medicine.usage}
          </p>
        )}
        <p className="truncate text-[10.5px] leading-tight text-[var(--brand-muted)]" title={pharmacy.name}>
          🏪 {pharmacy.name}
        </p>

        <button
          onClick={add}
          className={`mt-auto flex w-full items-center justify-center gap-1.5 rounded-xl py-1.5 text-[12px] font-bold transition active:scale-[0.97] ${
            qty > 0 ? "text-[var(--brand-green)]" : "text-white"
          }`}
          style={qty > 0 ? { background: "var(--brand-green-soft)" } : { background: "var(--brand-green)" }}
        >
          {qty > 0 ? <Check size={14} /> : <ShoppingCart size={14} />}
          {qty > 0 ? `Savatda (${qty})` : "Savatga"}
        </button>
      </div>
    </div>
  );
}
