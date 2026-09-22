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
  Clock,
  UserCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { RADIUS_OPTIONS, AUTH_BOT_URL } from "@/lib/constants";
import SpecialistCallModal from "@/components/SpecialistCallModal";
import SpecialistRatingModal from "@/components/SpecialistRatingModal";
import { getSpecialistCalls, CALLS_EVENT, type SpecialistCall } from "@/lib/specialist-calls";

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

export const DEFAULT_SPECIALISTS: Specialist[] = [];

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

  // Mutaxassis chaqirish va xizmatni yakunlab baholash statelari
  const [calls, setCalls] = useState<SpecialistCall[]>([]);
  const [callModalSpecialist, setCallModalSpecialist] = useState<Specialist | null>(null);
  const [ratingModalCall, setRatingModalCall] = useState<SpecialistCall | null>(null);

  useEffect(() => {
    const sync = () => setCalls(getSpecialistCalls());
    sync();
    window.addEventListener(CALLS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CALLS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

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

      {/* Bo'limlar — mobilda 2 ustun, kompyuterda 4 ustun, to'liq moslashuvchan */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
        {FILTERS.map((f) => {
          const active = role === f.v;
          return (
            <button
              key={f.v}
              onClick={() => setRole(f.v)}
              className={`flex items-center justify-center rounded-2xl py-2.5 px-2 text-center text-[12.5px] sm:text-[14px] font-bold transition-all active:scale-95 border ${
                active
                  ? "bg-[var(--brand-green)] text-white border-[var(--brand-green)] shadow-xs"
                  : "bg-white text-neutral-800 border-neutral-200/80 hover:bg-neutral-50"
              }`}
            >
              <span className="truncate">{f.l}</span>
            </button>
          );
        })}
      </div>

      {/* Standart 5 km radius ko'rsatkichi */}
      <div className="mt-2.5 flex items-center justify-between rounded-xl bg-white px-3 py-2 text-[12px] text-[var(--brand-muted)] shadow-xs">
        <span className="flex items-center gap-1.5 font-bold">
          <MapPin size={13} className="text-[var(--brand-green)]" />
          Yaqin atrof radiusi: <b className="text-[var(--brand-ink)]">5 km</b>
        </span>
        <span className="rounded-full border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
          Eng yaqin mutaxassislar
        </span>
      </div>

      {locError && (
        <p className="mt-2 rounded-2xl bg-[var(--brand-yellow-soft)] p-2.5 px-3 text-[12px] font-medium text-[var(--brand-ink)]">
          {locError}
        </p>
      )}

      {/* Faol chaqiruvlar bannerni ko'rsatish */}
      {calls.filter((c) => c.status === "pending").length > 0 && (
        <div className="mt-3 space-y-2">
          {calls
            .filter((c) => c.status === "pending")
            .map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-2xl bg-amber-50 p-3.5 border border-amber-200"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white">
                    <Clock size={16} />
                  </span>
                  <div>
                    <p className="text-[13px] font-bold text-amber-950">
                      Chaqiruv faol: {c.specialistName}
                    </p>
                    <p className="text-[11.5px] text-amber-800 font-medium">
                      Ish yakunlandimi? Baholang va fikringizni qoldiring
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRatingModalCall(c)}
                  className="rounded-xl bg-amber-500 px-3 py-2 text-[12px] font-bold text-white shadow-xs hover:bg-amber-600 active:scale-95 transition"
                >
                  Yakunlash
                </button>
              </div>
            ))}
        </div>
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
      ) : visible.length === 0 ? (
        <div className="mt-4 rounded-3xl bg-white p-6 sm:p-8 text-center border border-black/5 shadow-xs">
          <span
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "var(--brand-green-soft)", color: "var(--brand-green)" }}
          >
            <UserRound size={32} />
          </span>

          <p className="mt-3.5 text-[18px] font-bold text-[var(--brand-ink)]">
            {role === "crop"
              ? "Hozircha yaqin atrofda agronomlar ro'yxatdan o'tmagan"
              : role === "animal"
              ? "Hozircha yaqin atrofda veterinarlar ro'yxatdan o'tmagan"
              : role === "pharmacy"
              ? "Hozircha yaqin atrofda dorixonalar ro'yxatdan o'tmagan"
              : "Hozircha bu hududda mutaxassislar ro'yxatdan o'tmagan"}
          </p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-neutral-600 max-w-md mx-auto">
            {role === "crop"
              ? "Yaqin 5 km radiusda o'simlikshunos agronomlar hali ro'yxatdan o'tmagan yoki hozirda band."
              : role === "animal"
              ? "Yaqin 5 km radiusda chorva mollari bo'yicha veterinarlar hali ro'yxatdan o'tmagan."
              : role === "pharmacy"
              ? "Yaqin 5 km radiusda agro-dorixonalar topilmadi."
              : "Yaqin 5 km radiusda faol agronom, veterinar yoki dorixonalar hali ro'yxatdan o'tmagan."}
          </p>

          {/* Mutaxassis va dorixonalar uchun ro'yxatdan o'tish chaqirig'i */}
          <div className="mt-6 rounded-2xl bg-emerald-50/70 p-5 text-left border border-emerald-200/80 max-w-lg mx-auto">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-green)] text-white">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-emerald-950">
                  Siz agronom, veterinar yoki dorixona egasimisiz?
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-emerald-900/90">
                  Agroz tarmog&apos;iga qo&apos;shiling! O&apos;z xizmatingizni taqdim eting, buyurtma va chaqiruvlarni qabul qiling hamda dehqonlarga yordam bering.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <a
                href={AUTH_BOT_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-green)] px-5 py-3 text-center text-[13.5px] font-bold text-white shadow-xs hover:brightness-105 active:scale-95 transition"
              >
                <span>Ro&apos;yxatdan o&apos;tish (@agroz_auth_bot)</span>
              </a>
              <a
                href={AUTH_BOT_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-4 py-3 text-center text-[12.5px] font-semibold text-emerald-900 hover:bg-emerald-50/50 active:scale-95 transition"
              >
                <span>Profilga kirish / Boshqarish</span>
              </a>
            </div>
          </div>
        </div>
      ) : (
        <ul className="mt-2 space-y-3 web:grid web:grid-cols-2 web:gap-4 web:space-y-0">
          {visible.map((s) => {
            const isPharmacy = s.role === "pharmacy";
            const inRange = !s.locked;
            const activeCall = calls.find(
              (c) => c.specialistId === s.id && c.status === "pending",
            );
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

                {/* Mutaxassisni chaqirish yoki chaqiruv yakunlanganda baholash */}
                {!isPharmacy && (
                  <div className="mt-2.5">
                    {activeCall ? (
                      <div className="flex flex-col gap-2 rounded-2xl bg-amber-50 p-3 border border-amber-200">
                        <div className="flex items-center gap-1.5 text-[12px] font-bold text-amber-800">
                          <Clock size={13} className="shrink-0" />
                          <span>Chaqiruv yuborilgan (Jarayonda)</span>
                        </div>
                        <button
                          onClick={() => setRatingModalCall(activeCall)}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2.5 text-[13px] font-extrabold text-white shadow-xs hover:bg-amber-600 active:scale-95 transition"
                        >
                          <CheckCircle2 size={15} />
                          <span>Ishni yakunlash va baholash</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setCallModalSpecialist(s)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[var(--brand-ink)] py-3 text-[13.5px] font-bold text-white shadow-xs hover:bg-neutral-800 active:scale-95 transition"
                      >
                        <UserCheck size={16} />
                        <span>Mutaxassisni chaqirish</span>
                      </button>
                    )}
                  </div>
                )}
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
              <button
                onClick={refreshLocation}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand-ink)] py-3 text-[14px] font-bold text-white"
              >
                <LocateFixed size={15} /> Joylashuvni yangilash
              </button>
            </li>
          )}
        </ul>
      )}
      {/* Mutaxassisni chaqirish modali */}
      <SpecialistCallModal
        specialist={callModalSpecialist}
        isOpen={!!callModalSpecialist}
        onClose={() => setCallModalSpecialist(null)}
        onSuccess={() => {
          setCalls(getSpecialistCalls());
        }}
      />

      {/* Xizmatni yakunlash va baholash modali */}
      <SpecialistRatingModal
        call={ratingModalCall}
        isOpen={!!ratingModalCall}
        onClose={() => setRatingModalCall(null)}
        onSuccess={(avg, count) => {
          setCalls(getSpecialistCalls());
          if (typeof avg === "number" && ratingModalCall) {
            setItems((list) =>
              list.map((x) =>
                x.id === ratingModalCall.specialistId
                  ? { ...x, ratingAvg: avg, ratingCount: count ?? x.ratingCount + 1 }
                  : x,
              ),
            );
          }
        }}
      />
    </div>
  );
}
