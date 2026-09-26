"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Snowflake, CloudRain, Wind, SunMedium, AlertTriangle } from "lucide-react";
import type { WeatherAlert, AlertType } from "@/lib/weather-alerts";

function alertIcon(type: AlertType) {
  switch (type) {
    case "frost":
      return <Snowflake size={15} className="text-cyan-600 shrink-0 animate-pulse" />;
    case "heavy_rain":
      return <CloudRain size={15} className="text-blue-600 shrink-0" />;
    case "storm_wind":
      return <Wind size={15} className="text-amber-600 shrink-0" />;
    case "heatwave":
      return <SunMedium size={15} className="text-orange-600 shrink-0" />;
    default:
      return <AlertTriangle size={15} className="text-amber-600 shrink-0" />;
  }
}

export default function CompactAlertStrip({ initialRegion = "Toshkent" }: { initialRegion?: string }) {
  const [alert, setAlert] = useState<WeatherAlert | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/weather/alerts?region=${encodeURIComponent(initialRegion)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.ok && Array.isArray(data.alerts) && data.alerts.length > 0) {
          setAlert(data.alerts[0]);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [initialRegion]);

  if (!alert) return null;

  return (
    <div className="mt-3">
      <Link
        href="/bildirishnomalar"
        className="group flex items-center justify-between gap-3 rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white px-3.5 py-2.5 shadow-xs transition hover:border-amber-400 active:scale-[0.99]"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping shrink-0" />
          {alertIcon(alert.type)}
          <p className="truncate text-[13px] font-bold text-amber-950">
            <span className="font-extrabold text-red-700 mr-1.5">[Shoshilinch]</span>
            {alert.region}: {alert.title}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-[12px] font-extrabold text-[var(--brand-green)] group-hover:underline">
          Ko&apos;rish <ChevronRight size={14} />
        </span>
      </Link>
    </div>
  );
}

