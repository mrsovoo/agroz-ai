"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LocateFixed,
  Loader2,
  Lock,
  MapPin,
  Navigation,
  Phone,
  Stethoscope,
  Store,
  Map,
  UserRound,
  Pill,
  Star,
} from "lucide-react";
import { AUTH_BOT_URL, AUTH_BOT_USERNAME, RADIUS_OPTIONS } from "@/lib/constants";

type Medicine = { id: number; name: string; status: string; hasPhoto: boolean; price?: number | null };

/** Narxni qisqa ko'rinishda: 45000 → "45 000". */
function shortSum(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value).replace(/\u00a0/g, " ");
}

type Specialist = {
  id: number;
  name: string;
  phone: string;
  role: string;
  specialty: string | null;
  /** Qayerda o'qigan/tamomlagan. */
  education: string | null;
  /** Qisqa bio: nimalarni biladi, qanday yordam beradi. */
  bio: string | null;
  /** crop | animal | both — kimga yordam beradi. */
  helpsWith: string;
  /** Tajriba yillari. */
  experienceYears: number | null;
  organization: string | null;
  address: string;
  lat: number;
  lng: number;
  workHours: string | null;
  distanceKm: number | null;
  /** Radiusdan tashqarida — ko'rinadi, lekin qulflangan. */
  locked: boolean;
  ratingAvg: number | null;
  ratingCount: number;
  medicines?: Medicine[];
};

const FILTERS = [
  { v: "all", l: "Hammasi" },
  { v: "specialist", l: "Mutaxassislar" },
  { v: "pharmacy", l: "Dorixona egalari" },
];

function Stars({ avg, count }: { avg: number | null; count: number }) {
  if (!avg || count === 0) {
    return (
      <span className="text-[11.5px] font-semibold text-[var(--brand-muted)]">
        ★ Hali reyting yo&apos;q
      </span>
    );
  }
  const full = Math.round(avg);
  return (
    <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#b8860b]">
      <Star size={11} fill="currentColor" className="text-[#fcbd00]" />
      {avg.toFixed(1)}
      <span className="text-[var(--brand-muted)]">({count})</span>
      <span className="tracking-tight text-[#fcbd00]">{"★".repeat(full)}</span>
    </span>
  );
}

export default function SpecialistsClient({ initialRole = "all" }: { initialRole?: string }) {
  const [role, setRole] = useState(
    FILTERS.some((f) => f.v === initialRole) ? initialRole : "all",
  );
  const [items, setItems] = useState<Specialist[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [selectedRadius, setSelectedRadius] = useState<number>(5);
  const [loading, setLoading] = useState(true);
  const [locError, setLocError] = useState<string | null>(null);

  // Joylashuvni bir marta o'qiymiz — 5 km radius shunga nisbatan hisoblanadi.
  useEffect(() => {
    const fallback = () => {
      setCoords({ lat: 41.3111, lng: 69.2797 });
      setLocError("Lokatsiya ruxsati berilmagan — Toshkent markazi bo'yicha ko'rsatilmoqda");
    };
    if (!navigator.geolocation) {
      fallback();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocError(null);
      },
      fallback,
      { maximumAge: 5 * 60 * 1000, timeout: 8000, enableHighAccuracy: false },
    );
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (coords) {
      params.set("lat", String(coords.lat));
      params.set("lng", String(coords.lng));
      params.set("radius", String(selectedRadius));
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/specialists?${params.toString()}`)
      .then((r) => r.json())
      .then((d: { items?: Specialist[]; radiusKm?: number }) => {
        if (cancelled) return;
        setItems(Array.isArray(d?.items) ? d.items : []);
        setRadiusKm(typeof d?.radiusKm === "number" ? d.radiusKm : null);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [coords, selectedRadius]);

  const visible = useMemo(
    () => (role === "all" ? items : items.filter((s) => s.role === role)),
    [items, role],
  );
  const openCount = visible.filter((s) => !s.locked).length;

  // Qayta joylashuvni o'qish — ro'yxat avtomatik yangilanadi.
  function refreshLocation() {
    if (!navigator.geolocation) {
      setLocError("Brauzer lokatsiyani qo'llab-quvvatlamaydi");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocError(null);
      },
      () => setLocError("Lokatsiya ruxsati berilmagan"),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  function openDirections(s: Specialist) {
    const origin = coords ? `${coords.lat},${coords.lng}` : "";
    const url = `https://www.google.com/maps/dir/?api=1${origin ? `&origin=${origin}` : ""}&destination=${s.lat},${s.lng}&travelmode=driving`;
    window.open(url, "_blank", "noopener");
  }

  async function submitRating(s: Specialist, stars: number) {
    const res = await fetch("/api/specialists/rate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ specialistId: s.id, stars }),
    });
    if (res.ok) {
      const json = (await res.json()) as { ratingAvg: number; ratingCount: number };
      setItems((list) =>
        list.map((x) =>
          x.id === s.id
            ? { ...x, ratingAvg: json.ratingAvg, ratingCount: json.ratingCount }
            : x,
        ),
      );
    }
  }

  return (
    <div className="px-5 pb-6">
      <div className="flex items-start justify-between pt-3">
        <div>
          <p className="ios-sub">Yaqin atrofdagi yordam</p>
          <h1 className="ios-title">Mutaxassislar</h1>
          <p className="mt-1 text-[13px] font-medium text-[var(--brand-muted)]">
            {radiusKm ?? 5} km ichida: <b className="text-[var(--brand-green)]">{openCount} ta ochiq</b>
            {" · "}qolganlari masofadan qo&apos;ng&apos;iroq uchun
          </p>
        </div>
        <button
          onClick={refreshLocation}
          aria-label="Joylashuvni yangilash"
          className="mt-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--brand-green)] shadow-sm active:scale-95"
        >
          <LocateFixed size={20} />
        </button>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const active = role === f.v;
          return (
            <button
              key={f.v}
              onClick={() => setRole(f.v)}
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold transition active:scale-95 ${
                active ? "text-white" : "bg-white text-[var(--brand-ink)] shadow-sm"
              }`}
              style={active ? { background: "var(--brand-green)" } : undefined}
            >
              {f.l}
            </button>
          );
        })}
      </div>

      {/* Radius tanlash — qishloqda 5 km kam bo'lsa kengaytirish mumkin. */}
      <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1">
        <span className="shrink-0 text-[12px] font-bold text-[var(--brand-muted)]">Radius:</span>
        {RADIUS_OPTIONS.map((r) => {
          const active = selectedRadius === r;
          return (
            <button
              key={r}
              onClick={() => setSelectedRadius(r)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition active:scale-95 ${
                active ? "text-white" : "bg-white text-[var(--brand-ink)] shadow-sm"
              }`}
              style={active ? { background: "var(--brand-ink)" } : undefined}
            >
              {r} km
            </button>
          );
        })}
      </div>

      {locError && (
        <p className="mt-2 rounded-2xl bg-[var(--brand-yellow-soft)] p-2.5 px-3 text-[12px] font-medium text-[var(--brand-ink)]">
          {locError}
        </p>
      )}

      <Link
        // Faqat "Mutaxassislar" filtri tanlanganda xaritada ham shu tur ochiladi;
        // dorixona egalari xaritada dorixona sifatida ko'rinadi.
        href={role === "specialist" ? "/xarita?kind=specialist" : "/xarita"}
        className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-ink)] py-3.5 text-[14px] font-bold text-white active:scale-[0.98]"
      >
        <Map size={17} /> Xaritada ko&apos;rish
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-[13px] font-bold text-[var(--brand-muted)]">
          {loading ? "Yuklanmoqda..." : `${visible.length} ta natija`}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-14">
          <Loader2 className="animate-spin text-[var(--brand-green)]" size={28} />
        </div>
      ) : (
        <ul className="mt-2 space-y-3 web:grid web:grid-cols-2 web:gap-4 web:space-y-0">
          {visible.map((s) => {
            const isPharmacy = s.role === "pharmacy";
            const inRange = !s.locked;
            return (
              <li
                key={s.id}
                className="rounded-[22px] bg-white p-4 shadow-sm"
                style={s.locked ? { opacity: 0.92 } : undefined}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
                      style={{
                        background: isPharmacy ? "var(--brand-yellow-soft)" : "var(--brand-green-soft)",
                        color: isPharmacy ? "var(--brand-ink)" : "var(--brand-green)",
                      }}
                    >
                      {isPharmacy ? <Store size={20} /> : <UserRound size={20} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[16px] font-bold leading-tight text-[var(--brand-ink)]">
                        {s.organization ?? s.name}
                      </p>
                      {s.organization && (
                        <p className="mt-0.5 text-[13px] text-[var(--brand-muted)]">{s.name}</p>
                      )}
                      {s.specialty && (
                        <span
                          className="mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                          style={{
                            background: isPharmacy ? "var(--brand-yellow-soft)" : "var(--brand-green-soft)",
                            color: isPharmacy ? "var(--brand-ink)" : "var(--brand-green)",
                          }}
                        >
                          <Stethoscope size={11} /> {s.specialty}
                        </span>
                      )}
                      <p className="mt-1.5 flex items-start gap-1 text-[13px] text-[var(--brand-muted)]">
                        <MapPin size={13} className="mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{s.address}</span>
                      </p>
                      <div className="mt-1.5">
                        <Stars avg={s.ratingAvg} count={s.ratingCount} />
                      </div>
                      {isPharmacy && (s.medicines?.length ?? 0) > 0 && (
                        <>
                          <p
                            className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                            style={{ background: "var(--brand-green-soft)", color: "var(--brand-green)" }}
                          >
                            <Pill size={11} /> {s.medicines!.length} ta dori ro&apos;yxatda
                          </p>
                          {/* Narxi bor dorilar — mijoz narxni oldindan biladi. */}
                          {s.medicines!
                            .filter((m) => m.price && m.status === "bor")
                            .slice(0, 3)
                            .map((m) => (
                              <p
                                key={m.id}
                                className="mt-1 line-clamp-1 text-[11.5px] font-semibold text-[var(--brand-ink)]/75"
                              >
                                💊 {m.name} — {shortSum(m.price!)} so&apos;m
                              </p>
                            ))}
                        </>
                      )}
                      {/* Mutaxassislik tafsilotlari — mijoz kimga murojaat qilayotganini bilishi kerak. */}
                      {!isPharmacy && (s.helpsWith === "crop" || s.helpsWith === "animal" || s.helpsWith === "both") && (
                        <p className="mt-1.5 text-[12px] font-semibold text-[var(--brand-muted)]">
                          {s.helpsWith === "crop"
                            ? "🌱 Ekin bo'yicha yordam beradi"
                            : s.helpsWith === "animal"
                              ? "🐄 Chorva bo'yicha yordam beradi"
                              : "🌱🐄 Ekin va chorva bo'yicha"}
                        </p>
                      )}
                      {s.education && (
                        <p className="mt-1 line-clamp-1 text-[12px] text-[var(--brand-muted)]" title={s.education}>
                          🎓 {s.education}
                        </p>
                      )}
                      {s.bio && (
                        <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-[var(--brand-ink)]/80" title={s.bio}>
                          {s.bio}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {s.experienceYears !== null && s.experienceYears > 0 && (
                      <span
                        className="rounded-full px-2.5 py-1 text-[11.5px] font-bold"
                        style={{ background: "var(--brand-bg)", color: "var(--brand-ink)" }}
                        title="Tajriba yillari"
                      >
                        🏅 {s.experienceYears} yil
                      </span>
                    )}
                    {s.distanceKm !== null && (
                      <span
                        className="rounded-full px-2.5 py-1 text-[12px] font-bold text-white"
                        style={{
                          background: inRange ? "var(--brand-green)" : "var(--brand-muted)",
                        }}
                      >
                        {s.distanceKm.toFixed(1)} km
                      </span>
                    )}
                    {s.locked && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                        style={{ background: "var(--brand-red-soft)", color: "#d7263d" }}
                      >
                        <Lock size={10} /> {radiusKm ?? 5} km dan uzoq
                      </span>
                    )}
                  </div>
                </div>

                {/* Telefon har doim ko'rinadi — mijoz masofadan ham qo'ng'iroq qilishi mumkin. */}
                <div className="mt-3 flex gap-2">
                  <a
                    href={`tel:${s.phone.replace(/\s/g, "")}`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-3 text-[14px] font-bold text-white"
                    style={{ background: "var(--brand-green)" }}
                  >
                    <Phone size={15} /> {s.phone}
                  </a>
                  {inRange ? (
                    <button
                      onClick={() => openDirections(s)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[var(--brand-ink)] py-3 text-[14px] font-bold text-white"
                    >
                      <Navigation size={14} /> Yo&apos;nalish
                    </button>
                  ) : (
                    <div
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-3 text-[13px] font-bold text-[var(--brand-muted)]"
                      style={{ background: "var(--brand-bg)" }}
                      title="Yo'nalish faqat 5 km ichida ishlaydi"
                    >
                      <Lock size={13} /> Yo&apos;nalish yopiq
                    </div>
                  )}
                </div>

                {/* Reyting berish — bitta ovoz, qayta bossa yangilanadi. */}
                <div className="mt-2.5 flex items-center justify-between rounded-2xl bg-[var(--brand-bg)] px-3 py-2">
                  <span className="text-[12px] font-semibold text-[var(--brand-muted)]">
                    Reytingingizni bering:
                  </span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => submitRating(s, n)}
                        aria-label={`${n} yulduz`}
                        className="p-0.5 text-[#d1d1d6] transition hover:scale-110 hover:text-[#fcbd00] active:scale-95"
                      >
                        <Star
                          size={16}
                          fill={
                            s.ratingAvg && Math.round(s.ratingAvg) >= n ? "currentColor" : "none"
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
          {visible.length === 0 && (
            <li className="ios-card px-5 py-7 text-center">
              <span
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: "var(--brand-green-soft)", color: "var(--brand-green)" }}
              >
                {role === "pharmacy" ? <Store size={26} /> : <UserRound size={26} />}
              </span>
              <p className="mt-3 text-[16px] font-black text-[var(--brand-ink)]">
                {items.length === 0
                  ? "Hozircha ro'yxatdan o'tganlar yo'q"
                  : "Bu turdagi natija topilmadi"}
              </p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--brand-muted)]">
                Mutaxassislar va dorixona egalari ro&apos;yxatdan o&apos;tgach shu yerda ko&apos;rinadi.
                Ro&apos;yxatdan o&apos;tish bir daqiqada — ism, telefon va joylashuv yetarli.
              </p>
              <a
                href={AUTH_BOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-[14px] font-bold text-white"
                style={{ background: "var(--brand-green)" }}
              >
                <Phone size={15} /> @{AUTH_BOT_USERNAME} orqali ro&apos;yxatdan o&apos;tish
              </a>
              <button
                onClick={refreshLocation}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand-ink)] py-3 text-[14px] font-bold text-white"
              >
                <LocateFixed size={15} /> Joylashuvni yangilash
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
