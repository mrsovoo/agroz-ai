"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
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
  Calendar,
  ChevronRight,
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

    // Agar avval saqlangan koordinatalar bo'lsa
    let cachedLat: number | undefined;
    let cachedLng: number | undefined;
    try {
      const sLat = sessionStorage.getItem("user_lat");
      const sLng = sessionStorage.getItem("user_lng");
      if (sLat && sLng) {
        cachedLat = parseFloat(sLat);
        cachedLng = parseFloat(sLng);
      }
    } catch {}

    if (cachedLat !== undefined && cachedLng !== undefined) {
      load(cachedLat, cachedLng);
      return;
    }

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPlace("Sizning hududingiz");
          try {
            sessionStorage.setItem("user_lat", String(pos.coords.latitude));
            sessionStorage.setItem("user_lng", String(pos.coords.longitude));
          } catch {}
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

  const currentSoilTemp = w?.soilTemp ?? (w ? Math.round(w.temp - 2) : 18);

  return (
    <div>
      <Link
        href="/ob-havo"
        prefetch={true}
        className="block group active:scale-[0.99] transition cursor-pointer"
        aria-label="7 kunlik ob-havo prognozini ochish"
      >
        <div
          className="relative overflow-hidden rounded-[24px] p-4 text-white shadow-[0_10px_28px_-8px_rgba(2,142,17,0.35)] transition-all group-hover:shadow-[0_12px_32px_-6px_rgba(2,142,17,0.45)]"
          style={{ background: "linear-gradient(135deg, #028e11 0%, #0ba324 50%, #4ca82b 100%)" }}
        >
          {/* Yuqori qator: Joylashuv + 7 kunlik prognoz ko'rish tugmasi */}
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white/95 truncate">
              <MapPin size={13} className="shrink-0 text-white" />
              <span className="truncate">{region || place || "Toshkent"} · Bugun</span>
            </p>

            <span className="shrink-0 flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white border border-white/25 backdrop-blur group-hover:bg-white/30 transition">
              <Calendar size={12} className="text-yellow-300" />
              <span>7 kunlik</span>
              <ChevronRight size={12} />
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

          {/* Pastki qatorda 7 kunlik ob-havoni ochish taklifi */}
          <div className="mt-2.5 flex items-center justify-between rounded-xl bg-black/20 border border-white/10 px-3 py-2 text-[12px] font-bold text-white transition group-hover:bg-black/30">
            <span className="flex items-center gap-1.5 truncate">
              <Sparkles size={14} className="shrink-0 text-yellow-300" />
              <span className="truncate">7 kunlik ob-havo va quyosh chiqishi</span>
            </span>
            <span className="shrink-0 flex items-center gap-0.5 text-[11.5px] font-extrabold text-yellow-300">
              Ko&apos;rish
              <ChevronRight size={13} />
            </span>
          </div>
        </div>
      </Link>

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
