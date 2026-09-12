import { Suspense } from "react";
import MapClient from "@/components/MapClient";

export const dynamic = "force-dynamic";

export default function MapPage() {
  return (
    <main>
      <Suspense fallback={<p className="p-6 text-slate-500">Xarita yuklanmoqda...</p>}>
        <MapClient />
      </Suspense>
    </main>
  );
}
