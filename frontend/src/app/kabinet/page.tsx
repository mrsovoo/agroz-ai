"use client";

import { useEffect } from "react";

const BIZNESGO_BASE_URL = (
  process.env.NEXT_PUBLIC_BIZNESGO_URL ||
  process.env.NEXT_PUBLIC_BUSINESS_URL ||
  "http://localhost:3002"
).replace(/\/+$/, "");

/**
 * AgrozGO ichidagi /kabinet yo'li BiznesGO mustaqil ilovasiga yo'naltiradi.
 * Barcha BiznesGO kodlari faqat `biznesgo/` papkasida saqlanadi.
 */
export default function KabinetRedirectPage() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search || "";
      window.location.replace(`${BIZNESGO_BASE_URL}/${search}`);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4 text-center">
      <div className="w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 font-black text-lg">
          B
        </div>
        <h1 className="text-base font-black text-zinc-900">BiznesGO paneliga yo‘naltirilmoqda...</h1>
        <p className="text-xs text-zinc-500">
          Sotuvchilar va hamkorlar kabineti alohida BiznesGO ilovasida ishlaydi.
        </p>
        <a
          href={BIZNESGO_BASE_URL}
          className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
        >
          BiznesGO’ni ochish →
        </a>
      </div>
    </div>
  );
}
