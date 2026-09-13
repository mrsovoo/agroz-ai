import { Suspense } from "react";
import type { Metadata } from "next";
import MapClient from "@/components/MapClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dorixonalar xaritasi",
  description:
    "GPS bo'yicha eng yaqin agro va veterinariya dorixonalari, dori mavjudligi va yo'nalish.",
};

export default function MapPage() {
  return (
    <main>
      <Suspense fallback={<p className="p-6 text-slate-500">Xarita yuklanmoqda...</p>}>
        <MapClient />
      </Suspense>
    </main>
  );
}
