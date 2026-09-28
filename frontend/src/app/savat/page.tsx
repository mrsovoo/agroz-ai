"use client";

import { useEffect } from "react";
import { openCart } from "@/lib/cart-store";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export default function SavatPage() {
  useEffect(() => {
    openCart();
  }, []);

  return (
    <div className="min-h-screen bg-white px-5 pt-12 pb-36 text-center flex flex-col items-center justify-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--brand-green-soft)] text-[var(--brand-green)] mb-3 shadow-xs">
        <ShoppingCart size={30} />
      </div>
      <h1 className="text-[22px] font-black text-neutral-900">Savat bo&apos;limi</h1>
      <p className="text-[14px] text-neutral-500 mt-1 max-w-xs">
        Savatingiz ochiq. Quyidagi tugma orqali dori vositalarini buyurtma qilishingiz mumkin.
      </p>
      <div className="mt-5 flex gap-2">
        <button
          onClick={() => openCart()}
          className="rounded-2xl bg-[#039e1e] px-5 py-2.5 text-[13.5px] font-bold text-white shadow-xs hover:bg-[#028519]"
        >
          Savatni ochish
        </button>
        <Link
          href="/dorilar"
          className="rounded-2xl border border-neutral-200 bg-white px-5 py-2.5 text-[13.5px] font-bold text-neutral-700 hover:bg-neutral-50"
        >
          Dorilar katalogi
        </Link>
      </div>
    </div>
  );
}
