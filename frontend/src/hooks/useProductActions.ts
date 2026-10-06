"use client";

import { useEffect, useState, useCallback } from "react";
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

export interface UseProductActionsMedicine {
  id: number;
  name: string;
  price?: number | null;
  type?: string | null;
  hasPhoto?: boolean;
  photoVersion?: string | null;
  usage?: string | null;
  stockUnit?: string | null;
  status?: string | null;
  ratingAvg?: number | null;
  ratingCount?: number;
}

export function useProductActions(
  medicine: UseProductActionsMedicine,
  pharmacy?: CartStorePharmacy | null,
) {
  const [liked, setLiked] = useState(false);
  const [qty, setQty] = useState(0);
  const [ratingStats, setRatingStats] = useState<{ avg: number; count: number }>({
    avg: 0,
    count: 0,
  });

  const effectivePharmacyId = pharmacy?.id ?? 1;

  const sync = useCallback(() => {
    if (pharmacy) {
      setLiked(isFavorite(effectivePharmacyId, medicine.id));
    }
    const cart = loadCart();
    const inLine = cart?.lines?.find((l) => l.medicine.id === medicine.id);
    setQty(inLine ? inLine.qty : 0);

    const calculated = calculateMedicineRating(medicine.id);
    if (calculated.count > 0) {
      setRatingStats({ avg: calculated.avg, count: calculated.count });
    } else if (medicine.ratingAvg && medicine.ratingAvg > 0) {
      setRatingStats({
        avg: Number(medicine.ratingAvg.toFixed(1)),
        count: medicine.ratingCount ?? 0,
      });
    } else {
      setRatingStats({ avg: 0, count: 0 });
    }
  }, [
    effectivePharmacyId,
    medicine.id,
    medicine.ratingAvg,
    medicine.ratingCount,
    pharmacy,
  ]);

  useEffect(() => {
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
  }, [sync]);

  const handleToggleFavorite = useCallback(() => {
    if (!pharmacy) return;
    const next = toggleFavorite(pharmacy.id, medicine.id);
    setLiked(next);
  }, [pharmacy, medicine.id]);

  const addToCart = useCallback(() => {
    if (!pharmacy) return;
    const cart = loadCart();
    const newPharmacy: CartStorePharmacy = {
      id: pharmacy.id,
      name: pharmacy.name,
      phone: pharmacy.phone,
      address: pharmacy.address ?? null,
    };

    const cartMed: CartStoreMedicine = {
      id: medicine.id,
      name: medicine.name,
      price: medicine.price ?? null,
      type: medicine.type ?? "general",
      hasPhoto: Boolean(medicine.hasPhoto),
      photoVersion: medicine.photoVersion ?? null,
      usage: medicine.usage ?? null,
      stockUnit: medicine.stockUnit ?? null,
      status: medicine.status ?? "bor",
    };

    if (
      cart &&
      cart.pharmacy &&
      cart.pharmacy.id !== pharmacy.id &&
      cart.lines.length > 0
    ) {
      if (
        !confirm(
          `Savatda boshqa agro-do'kon (${cart.pharmacy.name}) dorilari bor. Yangi agro-do'kon dorilari savatni almashtiradi. Davom etamizmi?`,
        )
      ) {
        return;
      }
      saveCart({
        pharmacy: newPharmacy,
        lines: [{ medicine: cartMed, pharmacy: newPharmacy, qty: 1 }],
      });
      notifyCartChanged();
      return;
    }

    if (!cart || !Array.isArray(cart.lines) || cart.lines.length === 0) {
      saveCart({
        pharmacy: newPharmacy,
        lines: [{ medicine: cartMed, pharmacy: newPharmacy, qty: 1 }],
      });
    } else {
      const existing = cart.lines.find((l) => l.medicine.id === medicine.id);
      const lines: CartStoreLine[] = existing
        ? cart.lines.map((l) =>
            l.medicine.id === medicine.id
              ? { ...l, qty: Math.min(99, l.qty + 1) }
              : l,
          )
        : [...cart.lines, { medicine: cartMed, pharmacy: newPharmacy, qty: 1 }];
      saveCart({ pharmacy: cart.pharmacy || newPharmacy, lines });
    }
    notifyCartChanged();
  }, [pharmacy, medicine]);

  const changeQty = useCallback(
    (delta: number) => {
      if (!pharmacy) return;
      const cart = loadCart();
      if (!cart || !Array.isArray(cart.lines) || cart.lines.length === 0) {
        if (delta > 0) addToCart();
        return;
      }
      const existing = cart.lines.find((l) => l.medicine.id === medicine.id);
      if (!existing) {
        if (delta > 0) addToCart();
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
          l.medicine.id === medicine.id
            ? { ...l, qty: Math.min(99, nextQty) }
            : l,
        );
        saveCart({ ...cart, lines });
      }
      notifyCartChanged();
    },
    [pharmacy, medicine, addToCart],
  );

  return {
    liked,
    qty,
    ratingStats,
    addToCart,
    changeQty,
    toggleFavorite: handleToggleFavorite,
  };
}

