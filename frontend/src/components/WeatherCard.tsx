"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import {
  Wind,
  Droplets,
  CloudRain,
  Sun,
  Moon,
  ThermometerSun,
  TriangleAlert,
  CheckCircle2,
  Sprout,
  PawPrint,
  Sparkles,
  MapPin,
  Leaf,
  RefreshCw,
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
  level: "ok" | "caution" | "warning" | "danger";
  advice: string;
  adviceNight?: string;
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
  const [mode, setMode] = useState<"day" | "night">("day");
  const [place, setPlace] = useState("Hudud aniqlanmoqda");
  const [region, setRegion] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("");

  const loadWeather = useCallback((lat?: number, lng?: number) => {
    setIsRefreshing(true);
    const q = lat !== undefined && lng !== undefined ? `?lat=${lat}&lng=${lng}` : "";
    
    fetch(`/api/weather${q}`)
      .then((r) => r.json())
      .then((d: Weather) => {
        if (typeof d?.temp === "number") {
          setW(d);
          // Real vaqt rejimiga (Open-Meteo isDay ko'rsatkichiga) avtomatik moslashish
          setMode(d.isDay === false ? "night" : "day");
          setLoadFailed(false);

          const now = new Date();
          const timeStr = now.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
          setLastUpdatedTime(timeStr);
        } else {
          setW(null);
          setLoadFailed(true);
        }
      })
      .catch(() => {
        setW(null);
        setLoadFailed(true);
      })
      .finally(() => {
        setIsRefreshing(false);
      });

    if (showRegion && lat !== undefined && lng !== undefined) {
      fetch(`/api/location?lat=${lat}&lng=${lng}`)
        .then((r) => r.json())
        .then((d: { place?: string | null }) => setRegion(d?.place ?? null))
        .catch(() => setRegion(null));
    }
  }, [showRegion]);

  useEffect(() => {
    let currentLat: number | undefined;
    let currentLng: number | undefined;

    const startLoad = () => {
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setPlace("Sizning hududingiz");
            currentLat = pos.coords.latitude;
            currentLng = pos.coords.longitude;
            loadWeather(currentLat, currentLng);
          },
          () => {
            setPlace("Toshkent");
            loadWeather();
          },
          { timeout: 8000, maximumAge: 15 * 60 * 1000, enableHighAccuracy: false },
        );
      } else {
        setPlace("Toshkent");
        loadWeather();
      }
    };

    startLoad();

    // Har 30 daqiqada (30 * 60 * 1000 ms) real-vaqt rejimida ob-havoni avtomatik yangilash
    const REFRESH_INTERVAL = 30 * 60 * 1000;
    const interval = setInterval(() => {
      loadWeather(currentLat, currentLng);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [loadWeather]);

  const isNight = mode === "night";

  return (
    <div>
      <div
        className="overflow-hidden rounded-[28px] p-5 text-white transition-all duration-500 shadow-xl"
        style={{
          background: isNight
            ? "linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#312e81 100%)"
            : "linear-gradient(135deg,#028e11 0%,#0a9c1b 50%,#76b44d 100%)",
        }}
      >
        {/* Yuqori qatlam: Joylashuv, Real-time ko'rsatkich va Kun/Tun almashtirish */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="flex items-center gap-1.5 text-[13px] font-medium text-white/90">
                {isNight ? (
                  <span className="flex items-center gap-1 font-bold text-indigo-200">
                    <Moon size={14} className="text-amber-300" /> Kechasi (Tun)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-bold text-amber-200">
                    <Sun size={14} /> Kunduzi (Kun)
                  </span>
                )}
                · {place}
              </p>

              {/* Real-time status belgisi */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2 py-0.5 text-[10.5px] font-bold text-white backdrop-blur-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Real-vaqt {lastUpdatedTime ? `(${lastUpdatedTime})` : ""}
              </span>
            </div>

            {/* Quyosh chiqishi va botishi ma'lumoti */}
            {w && (
              <p className="mt-1 text-[11.5px] font-medium text-white/75 flex items-center gap-2">
                {isNight ? (
                  <>🌙 Quyosh chiqishi: <b className="text-amber-200">{w.sunrise ?? "06:15"}</b></>
                ) : (
                  <>☀️ Quyosh botishi: <b className="text-amber-200">{w.sunset ?? "18:45"}</b></>
                )}
              </p>
            )}

            <div className="mt-2 flex items-end gap-2">
              <span className="text-[54px] font-black leading-none tracking-tight">
                {w
                  ? isNight
                    ? (w.tempNight ?? Math.round(w.temp - 7))
                    : (w.tempDay ?? w.temp)
                  : "—"}
              </span>
              <span className="pb-2 text-2xl font-semibold text-white/80">°C</span>
              {w && (
                <span className="mb-2 text-[11.5px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white/90 backdrop-blur-xs">
                  {isNight ? "Tungi harorat" : "Kunduzgi harorat"}
                </span>
              )}
            </div>
          </div>

          {/* Kun/Tun almashtirish tugmasi va qo'lda yangilash */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => setMode((prev) => (prev === "day" ? "night" : "day"))}
              title={isNight ? "Kunlik rejimga o'tish" : "Tungi rejimga o'tish"}
              aria-label="Kun va Tun rejimini almashtirish"
              className={`group relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-full transition-all duration-300 active:scale-90 ${
                isNight
                  ? "bg-indigo-950 text-amber-300 border border-amber-300/30 shadow-[0_0_15px_rgba(252,189,0,0.3)] hover:scale-105"
                  : "bg-[var(--brand-yellow)] text-[var(--brand-ink)] shadow-md hover:scale-105"
              }`}
            >
              {isRefreshing ? (
                <RefreshCw size={22} className="animate-spin text-white" />
              ) : isNight ? (
                <Moon size={24} strokeWidth={2.2} className="text-amber-300 transition-transform duration-300 group-hover:-rotate-12" />
              ) : (
                <Sun size={24} strokeWidth={2.2} className="transition-transform duration-300 group-hover:rotate-45" />
              )}
            </button>
            <span className="mt-1 text-[10px] font-extrabold text-white/75 tracking-tight">
              {isNight ? "Kun ga o'tish" : "Tun ga o'tish"}
            </span>
          </div>
        </div>

        {/* Shamol, Namlik, Yog'in */}
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

        {/* Aniq agronomik maslahat (Sof real tavsiya matni) */}
        <div
          className="mt-4 flex items-start gap-2.5 rounded-[18px] px-4 py-3 text-[14px] font-semibold leading-snug transition-colors duration-300"
          style={{
            background: isNight ? "rgba(255, 255, 255, 0.15)" : "var(--brand-yellow)",
            color: isNight ? "#ffffff" : "var(--brand-ink)",
            backdropFilter: isNight ? "blur(12px)" : "none",
          }}
        >
          <span className="mt-0.5 shrink-0">
            {w ? (isNight ? <Moon size={18} className="text-amber-300" /> : levelIcon[w.level]) : null}
          </span>
          <span>
            {w ? (
              isNight ? (
                w.adviceNight ?? w.advice
              ) : (
                w.advice
              )
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
