"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Wind, Droplets, CloudRain, Sun, ThermometerSun, TriangleAlert, CheckCircle2 } from "lucide-react";

type Weather = {
  temp: number;
  wind: number;
  humidity: number;
  rain: number;
  level: "ok" | "caution" | "warning" | "danger";
  advice: string;
};

const levelIcon: Record<Weather["level"], ReactNode> = {
  ok: <CheckCircle2 size={18} strokeWidth={2.4} />,
  caution: <ThermometerSun size={18} strokeWidth={2.4} />,
  warning: <TriangleAlert size={18} strokeWidth={2.4} />,
  danger: <TriangleAlert size={18} strokeWidth={2.4} />,
};

export default function WeatherCard() {
  const [w, setW] = useState<Weather | null>(null);
  const [place, setPlace] = useState("Hudud aniqlanmoqda");

  useEffect(() => {
    const load = (lat?: number, lng?: number) => {
      const q = lat && lng ? `?lat=${lat}&lng=${lng}` : "";
      fetch(`/api/weather${q}`)
        .then((r) => r.json())
        .then((d: Weather) => setW(typeof d?.temp === "number" ? d : null))
        .catch(() => setW(null));
    };

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPlace("Sizning hududingiz");
          load(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          setPlace("Toshkent");
          load();
        },
        // Kuchsiz qurilmalar uchun: GPS'ni uzoq ushlamaymiz, keshdagi joylashuv
        // bo'lsa darhol ishlatamiz va ob-havoni ko'rsatishni kechiktirmaymiz.
        { timeout: 8000, maximumAge: 15 * 60 * 1000, enableHighAccuracy: false },
      );
    } else {
      setPlace("Toshkent");
      load();
    }
  }, []);

  return (
    <div
      className="overflow-hidden rounded-[28px] p-5 text-white shadow-[0_20px_40px_-20px_rgba(2,142,17,0.45)]"
      style={{ background: "linear-gradient(135deg,#028e11 0%,#0a9c1b 50%,#76b44d 100%)" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-white/80">
            <Sun size={14} /> Bugun · {place}
          </p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-[54px] font-black leading-none tracking-tight">
              {w ? w.temp : "—"}
            </span>
            <span className="pb-2 text-2xl font-semibold text-white/80">°C</span>
          </div>
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--brand-ink)]"
          style={{ background: "var(--brand-yellow)" }}
        >
          <Sun size={22} strokeWidth={2.2} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-white/15 py-2.5 backdrop-blur">
          <div className="flex items-center justify-center gap-1 text-[11px] opacity-80">
            <Wind size={11} /> Shamol
          </div>
          <p className="text-base font-bold">{w ? `${w.wind} m/s` : "—"}</p>
        </div>
        <div className="rounded-2xl bg-white/15 py-2.5 backdrop-blur">
          <div className="flex items-center justify-center gap-1 text-[11px] opacity-80">
            <Droplets size={11} /> Namlik
          </div>
          <p className="text-base font-bold">{w ? `${w.humidity}%` : "—"}</p>
        </div>
        <div className="rounded-2xl bg-white/15 py-2.5 backdrop-blur">
          <div className="flex items-center justify-center gap-1 text-[11px] opacity-80">
            <CloudRain size={11} /> Yog'in
          </div>
          <p className="text-base font-bold">{w ? `${w.rain} mm` : "—"}</p>
        </div>
      </div>

      <div
        className="mt-4 flex items-start gap-2.5 rounded-[18px] px-4 py-3 text-[14px] font-semibold leading-snug"
        style={{ background: "var(--brand-yellow)", color: "var(--brand-ink)" }}
      >
        <span className="mt-0.5 shrink-0">{w ? levelIcon[w.level] : null}</span>
        <span>{w ? w.advice : "Ob-havo yuklanmoqda..."}</span>
      </div>
    </div>
  );
}
