"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
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
import { getSpecialistCalls, saveSpecialistCalls, CALLS_EVENT, type SpecialistCall } from "@/lib/specialist-calls";
import { apiUrl } from "@/lib/api-config";

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
  isBusy?: boolean;
  medicines?: Medicine[];
};

const FILTERS = [
  { v: "all", l: "Hammasi" },
  { v: "agronom", l: "🌱 Agronomlar" },
  { v: "veterinar", l: "🐄 Veterinarlar" },
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

  const loadSpecialists = useCallback(() => {
    const params = new URLSearchParams();
    params.set("role", "specialist");
    if (coords) {
      params.set("lat", String(coords.lat));
      params.set("lng", String(coords.lng));
      params.set("radius", String(selectedRadius));
    }
    fetch(`/api/specialists?${params.toString()}`)
      .then((r) => r.json())
      .then((d: { items?: Specialist[]; radiusKm?: number }) => {
        setItems(Array.isArray(d?.items) ? d.items : []);
        setRadiusKm(typeof d?.radiusKm === "number" ? d.radiusKm : null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [coords, selectedRadius]);

  useEffect(() => {
    setLoading(true);
    loadSpecialists();

    // Mutaxassis band bo'lganini bilish uchun har 10 soniyada yangilab turish
    const timer = setInterval(() => {
      loadSpecialists();
    }, 10000);

    return () => clearInterval(timer);
  }, [loadSpecialists]);

  // Pending chaqiruvlar statusini serverdan sinxronlash (mutaxassis botda qabul qilganda yoki yakunlaganda)
  useEffect(() => {
    const pendingList = calls.filter((c) => c.status === "pending" && /^\d+$/.test(c.id));
    if (pendingList.length === 0) return;

    let cancelled = false;
    const checkStatuses = async () => {
      let changed = false;
      const updated = [...calls];
      for (const call of pendingList) {
        try {
          const res = await fetch(apiUrl(`/api/specialists/call/${call.id}/status`));
          if (!res.ok) continue;
          const data = await res.json();
          if (data.ok && data.status) {
            const idx = updated.findIndex((x) => x.id === call.id);
            if (idx !== -1) {
              if (data.status === "bajarildi" && updated[idx].status !== "completed") {
                updated[idx] = { ...updated[idx], status: "completed", completedAt: Date.now() };
                changed = true;
              } else if (data.status === "bekor" && updated[idx].status !== "cancelled") {
                updated[idx] = { ...updated[idx], status: "cancelled" };
                changed = true;
              }
            }
          }
        } catch {}
      }
      if (changed && !cancelled) {
        saveSpecialistCalls(updated);
        setCalls(updated);
        loadSpecialists();
      }
    };

    checkStatuses();
    const interval = setInterval(checkStatuses, 6000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [calls, loadSpecialists]);

  const visible = useMemo(() => {
    // Faqat haqiqiy mutaxassislar (dorixonalar butunlay chiqarib tashlangan)
    const specsOnly = items.filter((s) => s.role === "specialist");
    if (role === "all") return specsOnly;
    if (role === "agronom") {
      return specsOnly.filter(
        (s) =>
          s.helpsWith === "crop" ||
          (s.specialty && /agronom/i.test(s.specialty))
      );
    }
    if (role === "veterinar") {
      return specsOnly.filter(
        (s) =>
          s.helpsWith === "animal" ||
          (s.specialty && /veterinar/i.test(s.specialty))
      );
    }
    return specsOnly;
  }, [items, role]);

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

  const listToDisplay = visible.length > 0 ? visible : DEFAULT_SPECIALISTS;

  return (
    <div className="px-5 pt-3 pb-28">
      {/* Sahifa Sarlavhasi (Mockup bilan 1:1) */}
      <div className="pt-1 pb-2">
        <h1 className="text-[26px] font-bold text-neutral-900 tracking-tight">
          Mutaxassislar
        </h1>
      </div>

      {/* Filter tablari: Hammasi, Agronomlar, Veterinarlar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3.5 scrollbar-none">
        {FILTERS.map((f) => {
          const isActive = role === f.v;
          return (
            <button
              key={f.v}
              type="button"
              onClick={() => setRole(f.v)}
              className={`rounded-full px-4 py-1.5 text-[13.5px] font-bold transition-all shrink-0 ${
                isActive
                  ? "bg-[#039e1e] text-white shadow-xs"
                  : "bg-white text-neutral-600 border border-neutral-200/80 hover:bg-neutral-50"
              }`}
            >
              {f.l}
            </button>
          );
        })}
      </div>

      {/* Mutaxassis xizmati yakunlangan va hali baholanmagan chaqiruvlar bo'lsa */}
      {calls.filter((c) => c.status === "completed" && !c.stars).length > 0 && (
        <div className="mb-4 space-y-2">
          {calls
            .filter((c) => c.status === "completed" && !c.stars)
            .map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-2xl bg-emerald-50 p-3.5 border border-emerald-200"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0">
                    <CheckCircle2 size={16} />
                  </span>
                  <div>
                    <p className="text-[13px] font-bold text-emerald-950">
                      Xizmat yakunlandi: {c.specialistName}
                    </p>
                    <p className="text-[11.5px] text-emerald-800 font-medium">
                      Mutaxassis ishni yakunladi. Xizmat sifatini baholang!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRatingModalCall(c)}
                  className="rounded-xl bg-emerald-600 px-3 py-2 text-[12px] font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition shrink-0"
                >
                  Baholash
                </button>
              </div>
            ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#039e1e]" size={30} />
        </div>
      ) : (
        <ul className="space-y-3.5">
          {listToDisplay.map((s) => {
            const specialtyText = s.specialty || (s.role === "pharmacy" ? "Dorixona egasi" : "Veterinar");
            const expText = s.experienceYears ? `${s.experienceYears} yil` : "8 yil";
            const ratingText = s.ratingAvg ? s.ratingAvg.toFixed(1) : "4.5";

            return (
              <li
                key={s.id}
                className="rounded-[24px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-neutral-100/90 transition-all hover:shadow-md"
              >
                {/* Yuqori qism: Avatar, Mutaxassislik, Ism va Badge'lar */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Sariq/To'q sariq dumaloq kvadrat avatar (Mockup bilan 1:1) */}
                    <div className="h-14 w-14 shrink-0 rounded-2xl bg-[#ffad2a] flex items-center justify-center text-white shadow-2xs">
                      <span className="text-[20px] font-black text-white/90">
                        {s.name.slice(0, 1).toUpperCase()}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-[18px] font-bold text-neutral-900 leading-snug truncate">
                        {specialtyText}
                      </h3>
                      <p className="text-[13.5px] text-neutral-500 font-normal mt-0.5 truncate">
                        {s.name}
                      </p>
                    </div>
                  </div>

                  {/* O'ng tomondagi ikkita badge (Tajriba va Reyting) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="rounded-full bg-[#039e1e] px-2.5 py-0.5 text-[11.5px] font-bold text-white shadow-2xs">
                      {expText}
                    </span>
                    <span className="rounded-full bg-[#ff9f1c] px-2.5 py-0.5 text-[11.5px] font-bold text-white shadow-2xs">
                      {ratingText}
                    </span>
                  </div>
                </div>

                {/* Pastki qism: Ikkita teng button (Bog'lanish va Chaqirish) */}
                <div className="mt-3.5 grid grid-cols-2 gap-3">
                  <a
                    href={`tel:${s.phone.replace(/\s/g, "")}`}
                    className="flex items-center justify-center rounded-2xl bg-[#737373] py-3 text-[14.5px] font-bold text-white hover:bg-[#5f6368] active:scale-[0.98] transition shadow-2xs"
                  >
                    Bog&apos;lanish
                  </a>
                  <button
                    type="button"
                    onClick={() => setCallModalSpecialist(s)}
                    className="flex items-center justify-center rounded-2xl bg-[#039e1e] py-3 text-[14.5px] font-bold text-white hover:bg-[#028519] active:scale-[0.98] transition shadow-xs"
                  >
                    Chaqirish
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {/* Mutaxassisni chaqirish modali */}
      <SpecialistCallModal
        specialist={callModalSpecialist}
        isOpen={!!callModalSpecialist}
        onClose={() => setCallModalSpecialist(null)}
        onSuccess={() => {
          setCalls(getSpecialistCalls());
          loadSpecialists();
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
