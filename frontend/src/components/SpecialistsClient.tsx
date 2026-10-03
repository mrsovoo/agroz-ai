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
import { getSpecialistCalls, saveSpecialistCalls, CALLS_EVENT, type SpecialistCall } from "@/lib/specialist-calls";
import { apiUrl } from "@/lib/api-config";

type Medicine = { id: number; name: string; status: string; hasPhoto: boolean; price?: number | null };

type Specialist = {
  id: number;
  name: string;
  phone: string;
  role: string;
  specialty: string | null;
  education: string | null;
  bio: string | null;
  helpsWith: string;
  experienceYears: number | null;
  organization: string | null;
  address: string;
  lat: number;
  lng: number;
  workHours: string | null;
  distanceKm: number | null;
  locked: boolean;
  ratingAvg: number | null;
  ratingCount: number;
  isBusy?: boolean;
  medicines?: Medicine[];
};

const CATEGORIES = [
  { v: "all", l: "Barchasi", icon: Sparkles },
  { v: "agronom", l: "Agronomlar", icon: Sprout },
  { v: "veterinar", l: "Veterinarlar", icon: Stethoscope },
  { v: "available", l: "Qabulga tayyor", icon: CheckCircle2 },
];

/**
 * Mutaxassis avatari — ismning bosh harfi bilan va jonli bandlik statusi (🟢 Bo'sh / 🔴 Band)
 */
function SpecialistAvatar({
  name,
  isVeterinar,
  isBusy,
  size = "md",
}: {
  name: string;
  isVeterinar?: boolean;
  isBusy?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const initial = (name.trim().charAt(0) || "A").toUpperCase();
  const sizeClasses =
    size === "lg"
      ? "w-24 h-24 text-3xl rounded-[28px]"
      : size === "sm"
      ? "w-11 h-11 text-base rounded-xl"
      : "w-14 h-14 text-xl rounded-2xl";

  const dotClasses =
    size === "lg"
      ? "w-5 h-5 -bottom-1 -right-1 border-[3px]"
      : "w-3.5 h-3.5 -bottom-0.5 -right-0.5 border-2";

  return (
    <div className="relative shrink-0">
      <div
        className={`${sizeClasses} flex items-center justify-center font-black text-white shadow-xs select-none transition-transform group-hover:scale-105 ${
          isVeterinar
            ? "bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 shadow-amber-500/20"
            : "bg-gradient-to-br from-emerald-500 via-[#039e1e] to-teal-600 shadow-emerald-500/20"
        }`}
      >
        <span>{initial}</span>
      </div>
      <span
        title={isBusy ? "Hozir band (Chaqiruvda)" : "Qabulga tayyor (Bo'sh)"}
        className={`absolute rounded-full border-white ${dotClasses} ${
          isBusy ? "bg-red-500 ring-2 ring-red-200" : "bg-emerald-500 ring-2 ring-emerald-200"
        }`}
      />
    </div>
  );
}

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
    if (coords) {
      params.set("lat", String(coords.lat));
      params.set("lng", String(coords.lng));
    }
    // Barcha malakali mutaxassis va maslahatchilarni olamiz
    fetch(apiUrl(`/api/specialists?${params.toString()}`))
      .then((r) => r.json())
      .then((d: { items?: Specialist[] }) => {
        setItems(Array.isArray(d?.items) ? d.items : []);
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
        const matchOrg = (s.organization || "").toLowerCase().includes(q);
        return matchName || matchSpec || matchAddr || matchBio || matchOrg;
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
          {filteredSpecialists.map((s) => {
            const isVet =
              s.role === "veterinarian" ||
              /veterinar/i.test(s.specialty || "") ||
              s.helpsWith === "animal";

            const specialtyText =
              s.specialty || (isVet ? "Veterinar vrach" : "Bosh agronom");

            const expText = s.experienceYears
              ? s.experienceYears >= 10
                ? "10+ yil"
                : `${s.experienceYears} yil`
              : null;

            const ratingText = s.ratingAvg && s.ratingAvg > 0 ? s.ratingAvg.toFixed(1) : null;
            const shortAddress = s.address ? s.address.split(",")[0].trim() : "O'zbekiston";
            const distText = typeof s.distanceKm === "number" ? `${s.distanceKm.toFixed(1)} km` : null;

            return (
              <li
                key={s.id}
                onClick={() => setSelectedProfile(s)}
                className="group rounded-[24px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-neutral-100/90 transition-all hover:shadow-md hover:border-emerald-300/60 active:scale-[0.99] cursor-pointer flex flex-col justify-between"
              >
                {/* Yuqori qism: Avatar (Ism bosh harfi), Mutaxassislik, Ism va Badge'lar */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <SpecialistAvatar
                      name={s.name}
                      isVeterinar={isVet}
                      isBusy={s.isBusy}
                      size="md"
                    />

                    <div className="min-w-0 flex-1">
                      <span className="text-[12px] font-bold text-neutral-500 tracking-tight block truncate">
                        {specialtyText}
                      </span>
                      <h3 className="text-[16.5px] sm:text-[17px] font-black text-neutral-900 leading-snug truncate group-hover:text-[#039e1e] transition-colors">
                        {s.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-[12px] text-neutral-500">
                        <span className="inline-flex items-center gap-0.5 truncate">
                          <MapPin size={12} className="text-[#039e1e] shrink-0" />
                          <span className="truncate">{shortAddress}</span>
                        </span>
                        {distText && (
                          <>
                            <span className="text-neutral-300">•</span>
                            <span className="font-semibold text-emerald-700 shrink-0">
                              {distText}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* O'ng tomonda reyting va tajriba */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {ratingText ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-black text-amber-700 border border-amber-200/80 shadow-2xs">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        <span>{ratingText}</span>
                      </span>
                    ) : (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500">
                        Yangi
                      </span>
                    )}
                    {expText && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200/60">
                        {expText}
                      </span>
                    )}
                  </div>
                </div>

                {/* Mutaxassis xizmat ko'rsatish yo'nalishi / Bio */}
                {s.bio && (
                  <p className="mt-2 text-[12px] leading-relaxed text-neutral-500 line-clamp-1 italic bg-neutral-50/80 rounded-xl px-2.5 py-1">
                    &ldquo;{s.bio}&rdquo;
                  </p>
                )}

                {/* Pastki qism: 2 ta tugma (Profil va Chaqirish) */}
                <div className="mt-3.5 pt-3 border-t border-neutral-100 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProfile(s);
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-neutral-100 py-2.5 text-[13px] font-bold text-neutral-700 hover:bg-neutral-200 active:scale-95 transition"
                  >
                    <User size={14} />
                    <span>Profil</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCallModalSpecialist(s);
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-[#039e1e] py-2.5 text-[13px] font-bold text-white shadow-xs hover:bg-[#028519] active:scale-95 transition"
                  >
                    <span>Chaqirish</span>
                    <span>➔</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* ========================================================================= */}
      {/* 7. MUTAXASSISNING TO'LIQ PROFILI (SCREEN 2 - Namunadagi o'ng ekran) */}
      {/* ========================================================================= */}
      {selectedProfile && (
        <div className="fixed inset-0 z-[105] flex justify-center bg-neutral-900/40 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-[500px] min-h-[100dvh] flex flex-col justify-between bg-white px-5 pt-6 pb-28">
            <div>
              {/* Yuqori qism: Orqaga qaytish va Ulashish */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedProfile(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:scale-95 transition"
                >
                  <ChevronLeft size={22} className="stroke-[2.6]" />
                </button>
                <span className="text-[13px] font-bold text-neutral-400">
                  Mutaxassis profili
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.share) {
                      navigator
                        .share({
                          title: selectedProfile.name,
                          text: `${selectedProfile.specialty || "Mutaxassis"} ${selectedProfile.name} — Agroz AI`,
                          url: window.location.href,
                        })
                        .catch(() => {});
                    }
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:scale-95 transition"
                >
                  <Share2 size={18} />
                </button>
              </div>

              {/* Markaziy qism: Katta Avatar, Ism va Mutaxassislik */}
              <div className="mt-6 flex flex-col items-center text-center">
                <SpecialistAvatar
                  name={selectedProfile.name}
                  isVeterinar={
                    selectedProfile.role === "veterinarian" ||
                    /veterinar/i.test(selectedProfile.specialty || "") ||
                    selectedProfile.helpsWith === "animal"
                  }
                  isBusy={selectedProfile.isBusy}
                  size="lg"
                />

                <div className="mt-3.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold text-neutral-600 bg-neutral-100">
                    {selectedProfile.isBusy ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <span>Chaqiruvda (Hozir band)</span>
                      </>
                    ) : (
                      <>
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>Qabulga tayyor (Bo&apos;sh)</span>
                      </>
                    )}
                  </span>
                </div>

                <h2 className="mt-2.5 text-[24px] font-black text-neutral-900 tracking-tight leading-tight">
                  {selectedProfile.name}
                </h2>
                <p className="mt-1 text-[14.5px] font-semibold text-neutral-500">
                  {selectedProfile.specialty || "Qishloq xo'jaligi mutaxassisi"}
                </p>
                {selectedProfile.organization && (
                  <p className="text-[12.5px] text-neutral-400 font-medium">
                    {selectedProfile.organization}
                  </p>
                )}
              </div>

              {/* 4 ta haqiqiy va ishlaydigan tezkor tugmalar (Ortiqcha Telegram linklari olib tashlangan) */}
              <div className="mt-6 grid grid-cols-4 gap-2.5 sm:gap-3">
                {/* 1. Telefon orqali to'g'ridan-to'g'ri bog'lanish */}
                <a
                  href={`tel:${selectedProfile.phone.replace(/\s/g, "")}`}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/70 shadow-xs group-hover:bg-amber-100 group-active:scale-90 transition">
                    <Phone size={20} />
                  </div>
                  <span className="text-[11px] font-bold text-neutral-600">Qo&apos;ng&apos;iroq</span>
                </a>

                {/* 2. Chaqiruv buyurtma qilish */}
                <button
                  type="button"
                  onClick={() => {
                    const s = selectedProfile;
                    setSelectedProfile(null);
                    setCallModalSpecialist(s);
                  }}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-emerald-50 text-[#039e1e] border border-emerald-200/70 shadow-xs group-hover:bg-emerald-100 group-active:scale-90 transition">
                    <Car size={20} />
                  </div>
                  <span className="text-[11px] font-bold text-neutral-600">Chaqirish</span>
                </button>

                {/* 3. Xarita / Manzil */}
                <button
                  type="button"
                  onClick={() => openDirections(selectedProfile)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/70 shadow-xs group-hover:bg-rose-100 group-active:scale-90 transition">
                    <MapPin size={20} />
                  </div>
                  <span className="text-[11px] font-bold text-neutral-600">Manzil</span>
                </button>

                {/* 4. Baholash */}
                <button
                  type="button"
                  onClick={() => {
                    setRatingModalCall({
                      id: `rate_${selectedProfile.id}`,
                      specialistId: selectedProfile.id,
                      specialistName: selectedProfile.name,
                      customerName: "",
                      customerPhone: "",
                      problem: "",
                      status: "completed",
                      createdAt: Date.now(),
                    });
                  }}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/70 shadow-xs group-hover:bg-blue-100 group-active:scale-90 transition">
                    <Star size={20} className="fill-blue-500" />
                  </div>
                  <span className="text-[11px] font-bold text-neutral-600">
                    {selectedProfile.ratingAvg ? `★ ${selectedProfile.ratingAvg.toFixed(1)}` : "Baholash"}
                  </span>
                </button>
              </div>

              {/* Haqida (About) bo'limi */}
              <div className="mt-6 rounded-2xl bg-neutral-50/80 p-4 border border-neutral-100 space-y-1.5">
                <h4 className="text-[14px] font-bold text-neutral-900 tracking-tight">
                  Haqida
                </h4>
                <p className="text-[13px] leading-relaxed text-neutral-600">
                  {selectedProfile.bio ||
                    `${selectedProfile.name} — fermer va dehqonlar uchun o'z sohasida yuqori malakali agro maslahat va joyiga chiqib ko'rik o'tkazish bilan shug'ullanuvchi rasmiy tasdiqlangan mutaxassis.`}
                </p>
              </div>

              {/* Tajriba va Ta'lim kartalari */}
              <div className="mt-3.5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-neutral-50/80 p-3.5 border border-neutral-100 flex items-start gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-700">
                    <Award size={18} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-neutral-400 block uppercase">
                      Tajriba
                    </span>
                    <span className="text-[13px] font-extrabold text-neutral-900">
                      {selectedProfile.experienceYears
                        ? `${selectedProfile.experienceYears} yil staj`
                        : "5+ yil tajriba"}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl bg-neutral-50/80 p-3.5 border border-neutral-100 flex items-start gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100/70 text-blue-700">
                    <GraduationCap size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-neutral-400 block uppercase">
                      Ta&apos;lim
                    </span>
                    <span
                      className="text-[12px] font-extrabold text-neutral-900 truncate block"
                      title={selectedProfile.education || "Oliy ma'lumotli"}
                    >
                      {selectedProfile.education || "Oliy agrar ta'lim"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Qabul vaqti va Manzil */}
              <div className="mt-3.5 rounded-2xl bg-neutral-50/80 p-4 border border-neutral-100 space-y-2.5">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-2 text-neutral-500 font-medium">
                    <Clock size={16} className="text-[#039e1e]" />
                    <span>Ish / Qabul vaqti:</span>
                  </span>
                  <span className="font-extrabold text-neutral-900">
                    {selectedProfile.workHours || "08:00 – 19:00"}
                  </span>
                </div>

                <div className="flex items-start justify-between text-[13px] pt-2 border-t border-neutral-200/60 gap-3">
                  <span className="flex items-center gap-2 text-neutral-500 font-medium shrink-0">
                    <MapPin size={16} className="text-[#039e1e]" />
                    <span>Manzili:</span>
                  </span>
                  <span className="font-medium text-neutral-800 text-right break-words">
                    {selectedProfile.address || "Toshkent viloyati"}
                  </span>
                </div>
              </div>

              {/* Huquqiy himoya / O'RQ-547 kafolat belgisi */}
              <div className="mt-4 flex items-center justify-center gap-1.5 text-[11.5px] text-neutral-400 font-medium">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>AgrozGO tomonidan rasmiy tasdiqlangan va akkreditatsiyalangan</span>
              </div>
            </div>

            {/* Pastki bar: Katta "Chaqirish" (Appointment) tugmasi */}
            <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center gap-3">
              <a
                href={`tel:${selectedProfile.phone.replace(/\s/g, "")}`}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-800 hover:bg-neutral-200 active:scale-95 transition"
                title="Qo'ng'iroq qilish"
              >
                <Phone size={22} />
              </a>

              <button
                type="button"
                onClick={() => {
                  const spec = selectedProfile;
                  setSelectedProfile(null);
                  setCallModalSpecialist(spec);
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#039e1e] py-4 text-[16px] font-black text-white shadow-md hover:bg-[#028518] active:scale-[0.99] transition"
              >
                <span>Mutaxassisni chaqirish</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        </div>
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
                  ? { ...x, ratingAvg: avg, ratingCount: count ?? x.ratingCount + 1 }
                  : x
              )
            );
          }
        }}
      />
    </div>
  );
}
