"use client";

import { useEffect, useState } from "react";
import { Star, MessageSquare } from "lucide-react";
import { calculateMedicineRating, REVIEWS_EVENT } from "@/lib/medicine-reviews";

export default function MedicineRatingSummary({
  medicineId,
  initialAvg,
  initialCount,
}: {
  medicineId: number;
  initialAvg?: number | null;
  initialCount?: number | null;
}) {
  const [stats, setStats] = useState({
    avg: initialAvg ? Number(initialAvg.toFixed(1)) : 0,
    count: initialCount ?? 0,
  });

  useEffect(() => {
    const sync = () => {
      const calculated = calculateMedicineRating(medicineId);
      if (calculated.count > 0) {
        setStats({ avg: calculated.avg, count: calculated.count });
      } else if (initialAvg && initialAvg > 0) {
        setStats({ avg: Number(initialAvg.toFixed(1)), count: initialCount ?? 0 });
      } else {
        setStats({ avg: 0, count: 0 });
      }
    };
    sync();
    window.addEventListener(REVIEWS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(REVIEWS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [medicineId, initialAvg, initialCount]);

  return (
    <a
      href="#sharhlar"
      className="mt-2.5 inline-flex items-center gap-2 rounded-xl bg-amber-50/90 px-3 py-1.5 text-xs font-bold text-amber-900 border border-amber-200/80 hover:bg-amber-100 transition active:scale-95"
    >
      <div className="flex items-center gap-1">
        <Star size={13} className="fill-amber-400 text-amber-400" />
        <span>{stats.count > 0 ? stats.avg.toFixed(1) : "Yangi"}</span>
      </div>
      <span className="text-amber-300">•</span>
      <span className="flex items-center gap-1 text-[11.5px] text-amber-800">
        <MessageSquare size={12} />
        {stats.count > 0 ? `${stats.count} ta fikr va sharh` : "Fikr qoldirish"}
      </span>
    </a>
  );
}
