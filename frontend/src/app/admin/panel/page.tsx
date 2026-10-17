"use client";

import { useEffect } from "react";

const ADMIN_BASE_URL = (
  process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001"
).replace(/\/+$/, "");

/**
 * AgrozGO ichidagi /admin/panel yo'li alohida `admin/` ilovasiga yo'naltiradi.
 */
export default function AdminRedirectPage() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search || "";
      window.location.replace(`${ADMIN_BASE_URL}/${search}`);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4 text-center">
      <div className="w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs space-y-3">
        <h1 className="text-base font-black text-zinc-900">Admin panelga yo‘naltirilmoqda...</h1>
        <a
          href={ADMIN_BASE_URL}
          className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 transition"
        >
          Admin panelni ochish →
        </a>
      </div>
    </div>
  );
}
