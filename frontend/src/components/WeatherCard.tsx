"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Wind,
  Droplets,
  CloudRain,
  Sun,
  ThermometerSun,
  TriangleAlert,
  CheckCircle2,
  Sprout,
  PawPrint,
  Sparkles,
  MapPin,
  Leaf,
} from "lucide-react";

type AdviceScope = "crop" | "animal" | "both";
type Tip = { id: string; scope: AdviceScope; title: string; body: string };

type Weather = {
  temp: number;
  wind: number;
  humidity: number;
  rain: number;
  level: "ok" | "caution" | "warning" | "danger";
  advice: string;
  tips?: Tip[];
};

const levelIcon: Record<Weather["level"], ReactNode> = {
  ok: <CheckCircle2 size={18} strokeWidth={2.4} />,
  caution: <ThermometerSun size={18} strokeWidth={2.4} />,
  warning: <TriangleAlert size={18} strokeWidth={2.4} />,
  danger: <TriangleAlert size={18} strokeWidth={2.4} />,
};

/** Maslahat qaysi sohaga tegishli ekaniga qarab rang va belgi. */
const scopeStyle: Record<AdviceScope, { bg: string; fg: string; icon: ReactNode; label: string }> = {
  crop: {
    bg: "var(--brand-green-soft)",
    fg: "var(--brand-green)",
    icon: <Sprout size={16} />,
    label: "Ekinlar uchun",
  },
  animal: {
    bg: "var(--brand-yellow-soft)",
    fg: "var(--brand-ink)",
    icon: <PawPrint size={16} />,
    label: "Chorva uchun",
  },
  both: { bg: "#dbeafe", fg: "#2563eb", icon: <Sparkles size={16} />, label: "Umumiy" },
};

export default function WeatherCard({
  showTips = false,
  showRegion = false,
}: {
  /** Hudud va mavsumga qarab to'liq maslahatlarni ko'rsatish (Maslahatlar sahifasi). */
  showTips?: boolean;
  /** Teskari geokodlash orqali hudud nomini ko'rsatish. */
  showRegion?: boolean;
}) {
  const [w, setW] = useState<Weather | null>(null);
  const [place, setPlace] = useState("Hudud aniqlanmoqda");
  const [region, setRegion] = useState<string | null>(null);
  const [activeAlert, setActiveAlert] = useState<{ title: string; region: string } | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const load = (lat?: number, lng?: number) => {
      const q = lat !== undefined && lng !== undefined ? `?lat=${lat}&lng=${lng}` : "";
      fetch(`/api/weather${q}`)
        .then((r) => r.json())
        .then((d: Weather) => {
          if (typeof d?.temp === "number") {
            setW(d);
            setLoadFailed(false);
          } else {
            setW(null);
            setLoadFailed(true);
          }
        })
        .catch(() => {
          setW(null);
          setLoadFailed(true);
        });

      // Real ogohlantirishlar mavjudligini tekshirish (sun'iy sample=1 siz)
      fetch(`/api/weather/alerts${q}`)
        .then((r) => r.json())
        .then((d) => {
          if (d?.ok && Array.isArray(d.alerts) && d.alerts.length > 0) {
            setActiveAlert({ title: d.alerts[0].title, region: d.alerts[0].region });
          } else {
            setActiveAlert(null);
          }
        })
        .catch(() => setActiveAlert(null));

      if (showRegion && lat !== undefined && lng !== undefined) {
        fetch(`/api/location?lat=${lat}&lng=${lng}`)
          .then((r) => r.json())
          .then((d: { place?: string | null }) => setRegion(d?.place ?? null))
          .catch(() => setRegion(null));
      }
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
        { timeout: 8000, maximumAge: 15 * 60 * 1000, enableHighAccuracy: false },
      );
    } else {
      setPlace("Toshkent");
      load();
    }
  }, [showRegion]);

  return (
    <div>
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
          <span className="mt-0.5 shrink-0">
            {activeAlert ? <TriangleAlert size={18} strokeWidth={2.4} className="text-red-700" /> : w ? levelIcon[w.level] : null}
          </span>
          <span>
            {activeAlert ? (
              <>
                <b className="font-extrabold text-red-700 mr-1">⚠️ Diqqat ({activeAlert.region}):</b>
                {activeAlert.title}
              </>
            ) : w ? (
              w.advice
            ) : loadFailed ? (
              "Ob-havo hozircha olinmadi — keyinroq qayta urinib ko'ring."
            ) : (
              "Ob-havo yuklanmoqda..."
            )}
          </span>
        </div>
      </div>

      {/* Hudud va mavsumga qarab maslahatlar */}
      {showTips && (
        <>
          <div className="mt-5 flex items-center justify-between gap-2">
            <p className="ios-section-title m-0 flex items-center gap-1.5">
              <Leaf size={14} /> Turgan joyingiz uchun maslahatlar
            </p>
          </div>

          {region && (
            <p className="mt-1 flex items-center gap-1 text-[12.5px] font-medium text-[var(--brand-muted)]">
              <MapPin size={12} /> {region}
            </p>
          )}

          {!w?.tips || w.tips.length === 0 ? (
            <p className="ios-card mt-2 p-4 text-[14px] text-[var(--brand-muted)]">
              {loadFailed
                ? "Maslahatlar uchun ob-havo ma'lumoti olinmadi."
                : "Maslahatlar yuklanmoqda..."}
            </p>
          ) : (
            <ul className="mt-2 space-y-2.5">
              {w.tips.map((t) => {
                const s = scopeStyle[t.scope] ?? scopeStyle.both;
                return (
                  <li key={t.id} className="ios-card flex items-start gap-3 p-4">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]"
                      style={{ background: s.bg, color: s.fg }}
                    >
                      {s.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold leading-tight text-[var(--brand-ink)]">
                        {t.title}
                      </p>
                      <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--brand-muted)]">
                        {t.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
