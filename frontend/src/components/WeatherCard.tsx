"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Wind,
  Droplets,
  CloudRain,
  Sun,
  Sprout,
  PawPrint,
  Sparkles,
  MapPin,
  Leaf,
  Moon,
} from "lucide-react";

type AdviceScope = "crop" | "animal" | "both";
type Tip = { id: string; scope: AdviceScope; title: string; body: string };

type Weather = {
  temp: number;
  tempDay?: number;
  tempNight?: number;
  isDay?: boolean;
  sunrise?: string;
  sunset?: string;
  wind: number;
  humidity: number;
  rain: number;
  soilTemp?: number;
  sprayStatus?: "good" | "moderate" | "bad";
  sprayLabel?: string;
  sprayReason?: string;
  frostRisk?: boolean;
  agroAdvice?: string;
  level: "ok" | "caution" | "warning" | "danger";
  advice: string;
  adviceNight?: string;
  tips?: Tip[];
};

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
  showDetails = true,
}: {
  showTips?: boolean;
  showRegion?: boolean;
  showDetails?: boolean;
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

      // Real ogohlantirishlar
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

      // Manzilni aniqlash
      if (lat !== undefined && lng !== undefined) {
        fetch(`/api/location?lat=${lat}&lng=${lng}`)
          .then((r) => r.json())
          .then((d: { place?: string | null; region?: string | null }) => {
            if (d?.region) {
              setRegion(d.region);
              setPlace(d.region);
            } else if (d?.place) {
              setPlace(d.place);
              setRegion(d.place);
            }
          })
          .catch(() => {});
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

  const sprayBadge = (() => {
    if (!w) return { label: "🌿 Agro-mahsulot: Qulay", bg: "bg-white/20 text-white border-white/25" };
    if (w.sprayStatus === "bad" || w.rain > 0.2 || w.wind > 5.5) {
      return {
        label: "🛑 Agro-mahsulot sepmang",
        bg: "bg-red-500/85 text-white border-red-400/50 shadow-xs",
      };
    }
    if (w.sprayStatus === "moderate" || w.wind > 3.5) {
      return {
        label: "⚠️ Agro-mahsulot: Ehtiyotkorlik",
        bg: "bg-amber-400/90 text-neutral-900 border-amber-300 shadow-xs",
      };
    }
    return {
      label: "🌿 Agro-mahsulot: Qulay",
      bg: "bg-emerald-950/30 text-emerald-100 border-emerald-300/40 backdrop-blur shadow-2xs",
    };
  })();

  const currentSoilTemp = w?.soilTemp ?? (w ? Math.round(w.temp - 2) : 18);
  const adviceText =
    activeAlert?.title ||
    w?.agroAdvice ||
    w?.advice ||
    "Shamol sokin va havo ochiq. Agro-mahsulot va o'g'it purkash uchun ayni fursat.";

  return (
    <div>
      <div
        className="relative overflow-hidden rounded-[24px] p-4 text-white shadow-[0_10px_28px_-8px_rgba(2,142,17,0.35)] transition-all"
        style={{ background: "linear-gradient(135deg, #028e11 0%, #0ba324 50%, #4ca82b 100%)" }}
      >
        {/* Yuqori qator: Joylashuv + Agro-mahsulot purkash badgi */}
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white/95 truncate">
            <MapPin size={13} className="shrink-0 text-white" />
            <span className="truncate">{region || place || "Toshkent"} · Bugun</span>
          </p>

          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold border transition ${sprayBadge.bg}`}
          >
            {sprayBadge.label}
          </span>
        </div>

        {/* O'rta qator: Asosiy harorat + 3D Quyosh */}
        <div className="mt-1 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-[44px] font-black leading-none tracking-tight">
                {w ? (w.temp > 0 ? `+${w.temp}` : w.temp) : "+22"}
              </span>
              <span className="text-xl font-bold text-white/90">°C</span>
            </div>

            <p className="mt-1 flex items-center gap-2 text-[12px] font-medium text-white/90">
              <span className="flex items-center gap-1">
                <Sun size={12} className="text-yellow-300" />
                Kunduzi: +{w?.tempDay ?? 26}°
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Moon size={12} className="text-sky-200" />
                Kechasi: +{w?.tempNight ?? 14}°
              </span>
            </p>
          </div>

          {/* Yilcham 3D Quyosh illustratsiyasi (52x52) */}
          <div className="relative pr-1 shrink-0">
            <svg
              viewBox="0 0 100 100"
              className="w-[54px] h-[54px] drop-shadow-[0_4px_10px_rgba(251,191,36,0.45)]"
            >
              <defs>
                <radialGradient id="sunGradCompact" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#fff5a5" />
                  <stop offset="45%" stopColor="#ffb703" />
                  <stop offset="100%" stopColor="#fb8500" />
                </radialGradient>
              </defs>
              <g fill="#ffc300">
                <rect x="47" y="5" width="6" height="14" rx="3" />
                <rect x="47" y="81" width="6" height="14" rx="3" />
                <rect x="5" y="47" width="14" height="6" rx="3" />
                <rect x="81" y="47" width="14" height="6" rx="3" />
                <rect x="18" y="18" width="6" height="14" rx="3" transform="rotate(-45 21 25)" />
                <rect x="76" y="76" width="6" height="14" rx="3" transform="rotate(-45 79 83)" />
                <rect x="76" y="18" width="6" height="14" rx="3" transform="rotate(45 79 25)" />
                <rect x="18" y="76" width="6" height="14" rx="3" transform="rotate(45 21 83)" />
              </g>
              <circle cx="50" cy="50" r="27" fill="url(#sunGradCompact)" />
            </svg>
          </div>
        </div>

        {/* 4 ta ixcham parametr: Shamol, Namlik, Yog'in, Tuproq harorati */}
        <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
          <div className="rounded-xl bg-white/15 py-1.5 px-1 backdrop-blur border border-white/10">
            <div className="flex items-center justify-center gap-0.5 text-[10.5px] opacity-85">
              <Wind size={10} /> Shamol
            </div>
            <p className="text-[13px] font-extrabold mt-0.5 leading-tight">{w ? `${w.wind} m/s` : "—"}</p>
          </div>

          <div className="rounded-xl bg-white/15 py-1.5 px-1 backdrop-blur border border-white/10">
            <div className="flex items-center justify-center gap-0.5 text-[10.5px] opacity-85">
              <Droplets size={10} /> Namlik
            </div>
            <p className="text-[13px] font-extrabold mt-0.5 leading-tight">{w ? `${w.humidity}%` : "—"}</p>
          </div>

          <div className="rounded-xl bg-white/15 py-1.5 px-1 backdrop-blur border border-white/10">
            <div className="flex items-center justify-center gap-0.5 text-[10.5px] opacity-85">
              <CloudRain size={10} /> Yog'in
            </div>
            <p className="text-[13px] font-extrabold mt-0.5 leading-tight">{w ? `${w.rain} mm` : "—"}</p>
          </div>

          <div className="rounded-xl bg-white/15 py-1.5 px-1 backdrop-blur border border-white/10">
            <div className="flex items-center justify-center gap-0.5 text-[10.5px] opacity-85">
              <Sprout size={10} /> Tuproq
            </div>
            <p className="text-[13px] font-extrabold mt-0.5 leading-tight">{w ? `+${currentSoilTemp}°` : "—"}</p>
          </div>
        </div>

        {/* Pastki qisqa agro tavsiya */}
        <div className="mt-2.5 flex items-start gap-1.5 rounded-xl bg-black/15 border border-white/10 px-2.5 py-1.5 text-[12px] font-medium leading-snug text-white/95">
          <span className="shrink-0 mt-0.5">💡</span>
          <span className="line-clamp-2">{adviceText}</span>
        </div>
      </div>

      {/* Hudud va mavsumga qarab batafsil maslahatlar (agar showTips bo'lsa) */}
      {showTips && (
        <div className="mt-5">
          <p className="ios-section-title m-0 flex items-center gap-1.5">
            <Leaf size={14} /> Turgan joyingiz uchun maslahatlar
          </p>

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
        </div>
      )}
    </div>
  );
}
