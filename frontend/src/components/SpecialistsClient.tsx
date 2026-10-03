"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Search,
  Loader2,
  MapPin,
  Phone,
  Star,
  Clock,
  CheckCircle2,
  Sparkles,
  User,
  ChevronLeft,
  Share2,
  Award,
  GraduationCap,
  ShieldCheck,
  Sprout,
  Stethoscope,
  X,
  Car,
} from "lucide-react";
import SpecialistCallModal from "@/components/SpecialistCallModal";
import SpecialistRatingModal from "@/components/SpecialistRatingModal";
import {
  SpecialistCard,
  SpecialistProfileModal,
  type Specialist,
} from "@/components/SpecialistCard";
import { getSpecialistCalls, saveSpecialistCalls, CALLS_EVENT, type SpecialistCall } from "@/lib/specialist-calls";
import { apiUrl } from "@/lib/api-config";

const CATEGORIES = [
  { v: "all", l: "Barchasi", icon: Sparkles },
  { v: "agronom", l: "Agronomlar", icon: Sprout },
  { v: "veterinar", l: "Veterinarlar", icon: Stethoscope },
  { v: "available", l: "Qabulga tayyor", icon: CheckCircle2 },
];

export default function SpecialistsClient({ initialRole = "all" }: { initialRole?: string }) {
  const [activeCategory, setActiveCategory] = useState(
    CATEGORIES.some((c) => c.v === initialRole) ? initialRole : "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<Specialist[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Tanlangan mutaxassis profilini ko'rish (Namunadagi ikkinchi ekran)
  const [selectedProfile, setSelectedProfile] = useState<Specialist | null>(null);

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

  // Foydalanuvchi joylashuvini olish
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {},
      { maximumAge: 5 * 60 * 1000, timeout: 8000, enableHighAccuracy: false }
    );
  }, []);

  const loadSpecialists = useCallback(() => {
    const params = new URLSearchParams();
    // Mutaxassislar bo'limida faqat malakali mutaxassislar (agronom, veterinar) ko'rsatiladi, dorixona egalari (pharmacy) chiqmaydi
    params.set("role", "specialist");
    if (coords) {
      params.set("lat", String(coords.lat));
      params.set("lng", String(coords.lng));
    }
    fetch(apiUrl(`/api/specialists?${params.toString()}`))
      .then((r) => r.json())
      .then((d: { items?: Specialist[] }) => {
        const list = Array.isArray(d?.items) ? d.items : [];
        // Qo'shimcha xavfsizlik filtri: dorixona egalari mutlaqo chiqmasligi kerak
        setItems(list.filter((s) => s.role === "specialist" || (s.role !== "pharmacy" && !s.organization)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [coords]);

  useEffect(() => {
    setLoading(true);
    loadSpecialists();

    // Jonli bandlik statusi (isBusy) uchun har 10 soniyada yangilab turish
    const timer = setInterval(() => {
      loadSpecialists();
    }, 10000);

    return () => clearInterval(timer);
  }, [loadSpecialists]);

  // Google Maps marshrutini ochish
  function openDirections(s: Specialist) {
    const origin = coords ? `${coords.lat},${coords.lng}` : "";
    const url = `https://www.google.com/maps/dir/?api=1${
      origin ? `&origin=${origin}` : ""
    }&destination=${s.lat},${s.lng}&travelmode=driving`;
    window.open(url, "_blank", "noopener");
  }

  // Filtrlangan mutaxassislar ro'yxati
  const filteredSpecialists = useMemo(() => {
    return items.filter((s) => {
      // 0. Dorixona egalari (pharmacy) mutaxassislar bo'limida mutlaqo ko'rinmasligi shart
      if (s.role === "pharmacy" || (s.role && s.role !== "specialist")) {
        return false;
      }

      // 1. Kategoriya (yo'nalish) bo'yicha aniq filtr
      if (activeCategory === "agronom") {
        const isAgronom =
          s.helpsWith === "crop" ||
          s.helpsWith === "both" ||
          (s.specialty && /agronom|dehqon|issiqxona|hosil|ekin|bog/i.test(s.specialty)) ||
          (s.bio && /dehqonchilik|issiqxona|agronom|ekin|bog/i.test(s.bio));
        if (!isAgronom) return false;
      } else if (activeCategory === "veterinar") {
        const isVet =
          s.helpsWith === "animal" ||
          s.helpsWith === "both" ||
          (s.specialty && /veterinar|chorva|parranda|hayvon/i.test(s.specialty)) ||
          (s.bio && /veterinar|chorva|parranda|hayvon/i.test(s.bio));
        if (!isVet) return false;
      } else if (activeCategory === "available") {
        if (s.isBusy) return false;
      }

      // 2. Qidiruv so'rovi bo'yicha filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchSpec = (s.specialty || "").toLowerCase().includes(q);
        const matchAddr = (s.address || "").toLowerCase().includes(q);
        const matchBio = (s.bio || "").toLowerCase().includes(q);
        return matchName || matchSpec || matchAddr || matchBio;
      }

      return true;
    });
  }, [items, activeCategory, searchQuery]);

  return (
    <div className="px-4 sm:px-5 pt-3 pb-32 max-w-xl mx-auto">
      {/* 1. Sarlavha (Header) */}
      <div className="pt-2 pb-1">
        <h1 className="text-[24px] sm:text-[26px] font-black text-neutral-900 tracking-tight leading-tight">
          Mutaxassislar
        </h1>
        <p className="text-[13px] sm:text-[13.5px] text-neutral-500 font-medium mt-0.5">
          Malakali agronom va veterinarlardan tezkor amaliy yordam
        </p>
      </div>

      {/* 2. Qidiruv qutisi */}
      <div className="mt-3.5 relative flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ism, soha yoki hudud bo'yicha qidirish..."
            className="w-full rounded-2xl bg-white border border-neutral-200/90 py-3 sm:py-3.5 pl-4 pr-10 text-[14.5px] sm:text-[15px] text-neutral-900 placeholder:text-neutral-400 shadow-2xs focus:border-[#039e1e] focus:bg-white focus:outline-none transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#039e1e] text-white shadow-xs">
          <Search size={18} />
        </div>
      </div>

      {/* 3. Kategoriyalar (Moslashuvchan gorizontal skroll — hech qachon qisilmaydi va buzilmaydi) */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2 px-0.5">
          <span className="text-[13.5px] font-bold text-neutral-800 tracking-tight">
            Yo&apos;nalishlar
          </span>
          <span className="text-[12px] font-semibold text-neutral-400">
            {filteredSpecialists.length} ta mutaxassis
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:-mx-5 sm:px-5">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.v;
            const Icon = cat.icon;
            return (
              <button
                key={cat.v}
                type="button"
                onClick={() => setActiveCategory(cat.v)}
                className={`inline-flex items-center gap-2 py-2.5 px-3.5 rounded-2xl border transition-all shrink-0 font-bold text-[12.5px] sm:text-[13px] active:scale-95 ${
                  isActive
                    ? "bg-[#039e1e] text-white border-[#039e1e] shadow-xs"
                    : "bg-white text-neutral-700 border-neutral-200/80 hover:bg-neutral-50 shadow-2xs"
                }`}
              >
                <Icon size={15} />
                <span>{cat.l}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Mutaxassis xizmati yakunlangan va hali baholanmagan chaqiruvlar bo'lsa */}
      {calls.filter((c) => c.status === "completed" && !c.stars).length > 0 && (
        <div className="mt-3 space-y-2">
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

      {/* 5. Mutaxassislar ro'yxati sarlavhasi */}
      <div className="mt-4 flex items-center justify-between px-0.5">
        <h2 className="text-[15.5px] font-black text-neutral-900 tracking-tight">
          Top Mutaxassislar
        </h2>
      </div>

      {/* 6. Kartochkalar ro'yxati */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#039e1e]" size={32} />
        </div>
      ) : filteredSpecialists.length === 0 ? (
        <div className="mt-4 rounded-3xl bg-white p-8 text-center border border-black/5 shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#039e1e]">
            <User size={28} />
          </div>
          <h3 className="mt-3 text-[17px] font-bold text-neutral-900">
            Mutaxassislar topilmadi
          </h3>
          <p className="mt-1 text-[13px] text-neutral-500 max-w-sm mx-auto">
            Ushbu yo&apos;nalishda hozircha mutaxassislar mavjud emas yoki qidiruv bo&apos;yicha ma&apos;lumot chiqmadi.
          </p>
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {filteredSpecialists.map((s) => (
            <li key={s.id}>
              <SpecialistCard
                specialist={s}
                onViewProfile={(spec) => setSelectedProfile(spec)}
                onCall={(spec) => setCallModalSpecialist(spec)}
              />
            </li>
          ))}
        </ul>
      )}

      {/* 7. MUTAXASSISNING TO'LIQ PROFILI (SCREEN 2) */}
      {selectedProfile && (
        <SpecialistProfileModal
          specialist={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onCall={(spec) => {
            setSelectedProfile(null);
            setCallModalSpecialist(spec);
          }}
          onRate={(spec) => {
            setRatingModalCall({
              id: `rate_${spec.id}`,
              specialistId: spec.id,
              specialistName: spec.name,
              customerName: "",
              customerPhone: "",
              problem: "",
              status: "completed",
              createdAt: Date.now(),
            });
          }}
        />
      )}

      {/* Mutaxassisni chaqirish modali (Forma) */}
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
                  ? { ...x, ratingAvg: avg, ratingCount: count ?? (x.ratingCount ? x.ratingCount + 1 : 1) }
                  : x
              )
            );
          }
        }}
      />
    </div>
  );
}
