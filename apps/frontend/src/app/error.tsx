"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RotateCcw, TriangleAlert } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] kutilmagan xato:", error);
  }, [error]);

  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center px-5 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[var(--brand-red-soft)] text-[#d7263d]">
        <TriangleAlert size={32} />
      </div>
      <h1 className="ios-title mt-4">Xatolik yuz berdi</h1>
      <p className="mt-2 max-w-[340px] text-[15px] text-[var(--brand-muted)]">
        Kechirasiz, sahifani yuklashda muammo bo&apos;ldi. Qaytadan urinib ko&apos;ring.
      </p>
      <div className="mt-6 w-full max-w-[340px] space-y-3">
        <button onClick={reset} className="ios-btn">
          <RotateCcw size={18} /> Qaytadan urinish
        </button>
        <Link href="/" className="block">
          <button className="ios-btn secondary">
            <Home size={18} /> Bosh sahifa
          </button>
        </Link>
      </div>
    </main>
  );
}
