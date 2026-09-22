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
} from "lucide-react";
import { RADIUS_OPTIONS } from "@/lib/constants";
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

export const DEFAULT_SPECIALISTS: Specialist[] = [
  {
    id: 1,
    name: "Baraka Agro Ta'minot",
    organization: "Agro Kimyo Baraka MCHJ",
    phone: "+998 90 111 22 33",
    role: "pharmacy",
    specialty: "O'simliklar himoyasi kimyoviy va biologik vositalari",
    education: "Toshkent Davlat Agrar Universiteti",
    bio: "Sertifikatlangan fungitsidlar, insektitsidlar, urug'lar va tomchilatib sug'orish o'g'itlari.",
    helpsWith: "crop",
    experienceYears: 10,
    address: "Toshkent viloyati, Zangiota tumani, Bo'zsuv MFY, 12-uy",
    lat: 41.25,
    lng: 69.18,
    workHours: "08:00 - 19:00",
    distanceKm: 2.4,
    locked: false,
    ratingAvg: 4.9,
    ratingCount: 38,
    medicines: [
      { id: 101, name: "Ridomil Gold MZ 68 WG", status: "bor", hasPhoto: false, price: 65000 },
      { id: 102, name: "Score 250 EC (Skor)", status: "bor", hasPhoto: false, price: 48000 },
      { id: 104, name: "Karate Zeon 050 CS", status: "bor", hasPhoto: false, price: 35000 },
    ],
  },
  {
    id: 2,
    name: "Dr. Alisher Qodirov",
    organization: null,
    phone: "+998 90 100 20 30",
    role: "specialist",
    specialty: "Bosh agronom, O'simliklar himoyasi eksperti (PhD)",
    education: "Toshkent Davlat Agrar Universiteti",
    bio: "15 yillik tajribaga ega agronom. Pomidor, bodring, g'alla va bog'dorchilik kasalliklarini erta aniqlash va davolash.",
    helpsWith: "crop",
    experienceYears: 15,
    address: "Toshkent shahri, Chilonzor tumani, Bunyodkor shoh ko'chasi",
    lat: 41.278,
    lng: 69.201,
    workHours: "09:00 - 18:00",
    distanceKm: 3.1,
    locked: false,
    ratingAvg: 5.0,
    ratingCount: 42,
  },
  {
    id: 3,
    name: "Dehqon Hamkori Do'koni",
    organization: "Dehqon Hamkori Agrovet MCHJ",
    phone: "+998 91 222 33 44",
    role: "pharmacy",
    specialty: "Ekinlar va chorva mollari uchun barcha dori vositalari",
    education: "Samarqand Davlat Veterinariya Universiteti",
    bio: "Ekin va chorva dori-darmonlari, sifatli o'g'itlar va yem qo'shimchalari.",
    helpsWith: "both",
    experienceYears: 14,
    address: "Samarqand shahri, Mirzo Ulug'bek ko'chasi, 45-uy",
    lat: 39.6542,
    lng: 66.9597,
    workHours: "08:30 - 18:30",
    distanceKm: 4.2,
    locked: false,
    ratingAvg: 4.9,
    ratingCount: 29,
    medicines: [
      { id: 103, name: "Ivermektin 1% in'yeksiya", status: "bor", hasPhoto: false, price: 38000 },
      { id: 105, name: "Oksitetratsiklin 200 LA", status: "bor", hasPhoto: false, price: 55000 },
    ],
  },
  {
    id: 4,
    name: "Dilshod Ergashev",
    organization: null,
    phone: "+998 91 200 30 40",
    role: "specialist",
    specialty: "Veterinariya bosh vrachi, Jarroh",
    education: "SamDVMU Veterinariya fakulteti",
    bio: "Qoramol va qo'ylarning yuqumli va ichki kasalliklari, tug'ruq asoratlari, mastit va oqsoqlikni samarali davolash.",
    helpsWith: "animal",
    experienceYears: 18,
    address: "Toshkent viloyati, Yangiyo'l tumani, Markaziy shifoxona yaqinida",
    lat: 41.116,
    lng: 69.05,
    workHours: "08:00 - 19:00",
    distanceKm: 4.8,
    locked: false,
    ratingAvg: 5.0,
    ratingCount: 36,
  },
  {
    id: 5,
    name: "Vodiy Agro Kimyo",
    organization: "Farg'ona Hosil Dorixona XK",
    phone: "+998 93 333 44 55",
    role: "pharmacy",
    specialty: "Fungitsidlar, insektitsidlar va o'sish stimulyatorlari",
    education: "Andijon Qishloq Xo'jaligi Instituti",
    bio: "Bog'bonlar va polizchilar uchun import va litsenziyalangan preparatlar.",
    helpsWith: "crop",
    experienceYears: 8,
    address: "Farg'ona shahri, Al-Farg'oniy ko'chasi, 88-uy",
    lat: 40.3864,
    lng: 71.7864,
    workHours: "08:00 - 18:00",
    distanceKm: 3.5,
    locked: false,
    ratingAvg: 4.8,
    ratingCount: 25,
    medicines: [
      { id: 106, name: "Aktara 25 WG", status: "bor", hasPhoto: false, price: 28000 },
      { id: 108, name: "Proclaim 05 SG", status: "bor", hasPhoto: false, price: 72000 },
      { id: 114, name: "Koragen 20 SC", status: "bor", hasPhoto: false, price: 85000 },
    ],
  },
  {
    id: 6,
    name: "Ozodbek Mirzayev",
    organization: null,
    phone: "+998 93 300 40 50",
    role: "specialist",
    specialty: "Fitopatolog, Issiqxona va ochiq maydon maslahatchisi",
    education: "TDAU Qishloq xo'jaligi fanlari nomzodi",
    bio: "Fitoftoroz, un-shudring, klasterosporioz va virusli kasalliklarga qarshi kurash sxemalari.",
    helpsWith: "crop",
    experienceYears: 12,
    address: "Samarqand shahri, Dahbed ko'chasi",
    lat: 39.662,
    lng: 66.97,
    workHours: "09:00 - 17:30",
    distanceKm: 5.1,
    locked: false,
    ratingAvg: 4.9,
    ratingCount: 21,
  },
  {
    id: 7,
    name: "Zarafshon Agro-Vet",
    organization: "Buxoro Chorva Ta'minot MCHJ",
    phone: "+998 94 444 55 66",
    role: "pharmacy",
    specialty: "Veterinariya preparatlari, vaksina va antibiotiklar",
    education: "SamDVMU",
    bio: "Qorako'lchilik va qoramolchilik uchun eng samarali dori vositalari.",
    helpsWith: "animal",
    experienceYears: 16,
    address: "Buxoro shahri, G'ijduvon ko'chasi, 19-uy",
    lat: 39.7747,
    lng: 64.4286,
    workHours: "09:00 - 18:00",
    distanceKm: 2.9,
    locked: false,
    ratingAvg: 4.9,
    ratingCount: 31,
    medicines: [
      { id: 107, name: "Nitoks 200", status: "bor", hasPhoto: false, price: 48000 },
      { id: 109, name: "Albendazol 10%", status: "bor", hasPhoto: false, price: 22000 },
      { id: 115, name: "Kalsiy borglyukonat 20%", status: "bor", hasPhoto: false, price: 19000 },
    ],
  },
  {
    id: 8,
    name: "Sanjar Toirov",
    organization: null,
    phone: "+998 94 400 50 60",
    role: "specialist",
    specialty: "Chorva mollari parvarishi va oziqlantirish eksperti",
    education: "SamDVMU Zooinjeneriya fakulteti",
    bio: "Sut va go'sht qoramollarining ozuqa ratsionini hisoblash, mahsuldorlikni oshirish.",
    helpsWith: "animal",
    experienceYears: 10,
    address: "Buxoro viloyati, Vobkent tumani",
    lat: 40.03,
    lng: 64.51,
    workHours: "08:30 - 18:00",
    distanceKm: 3.8,
    locked: false,
    ratingAvg: 4.8,
    ratingCount: 19,
  },
  {
    id: 9,
    name: "Andijon Hosil Dorixonasi",
    organization: "Agro Servis Vodiy MCHJ",
    phone: "+998 95 555 66 77",
    role: "pharmacy",
    specialty: "Issiqxona va dala ekinlari dorilari",
    education: "TDAU Andijon filiali",
    bio: "Pomidor, bodring, ko'katlar va g'alla uchun samarali kimyoviy va biologik preparatlar.",
    helpsWith: "crop",
    experienceYears: 11,
    address: "Andijon shahri, Bobur shoh ko'chasi, 102-uy",
    lat: 40.7821,
    lng: 72.3442,
    workHours: "08:00 - 19:00",
    distanceKm: 4.1,
    locked: false,
    ratingAvg: 5.0,
    ratingCount: 44,
    medicines: [
      { id: 110, name: "Amistar Top 325 SC", status: "bor", hasPhoto: false, price: 115000 },
      { id: 112, name: "Previkur Energy", status: "bor", hasPhoto: false, price: 95000 },
      { id: 116, name: "Fitosporin-M", status: "bor", hasPhoto: false, price: 18000 },
    ],
  },
  {
    id: 10,
    name: "Gulchehra Rahimova",
    organization: null,
    phone: "+998 97 500 60 70",
    role: "specialist",
    specialty: "Agrokimyogar, Tuproq tahlili va o'g'itlash eksperti",
    education: "O'zMU Biologiya-tuproqshunoslik",
    bio: "Tuproq unumdorligini oshirish, NPK me'yorlarini belgilash va mikroelementlar tahlili.",
    helpsWith: "crop",
    experienceYears: 14,
    address: "Farg'ona shahri, Sayilgoh ko'chasi",
    lat: 40.389,
    lng: 71.782,
    workHours: "09:00 - 18:00",
    distanceKm: 4.5,
    locked: false,
    ratingAvg: 4.9,
    ratingCount: 27,
  },
  {
    id: 11,
    name: "Chorva va Parranda Dori Markazi",
    organization: "Vet Servis Toshkent XK",
    phone: "+998 97 777 88 99",
    role: "pharmacy",
    specialty: "Chorva va parrandachilik dori-darmonlari",
    education: "SamDVMU",
    bio: "Veterinariya preparatlari, vaksinalar, premikslar va dezinfeksiya vositalari.",
    helpsWith: "animal",
    experienceYears: 12,
    address: "Toshkent shahri, Sergeli tumani, Yangi Sergeli yo'li, 7-bino",
    lat: 41.225,
    lng: 69.218,
    workHours: "08:30 - 20:00",
    distanceKm: 3.2,
    locked: false,
    ratingAvg: 4.9,
    ratingCount: 35,
    medicines: [
      { id: 111, name: "Butafosfan + B12", status: "bor", hasPhoto: false, price: 88000 },
      { id: 113, name: "Enrofloksatsin 10%", status: "bor", hasPhoto: false, price: 42000 },
    ],
  },
  {
    id: 12,
    name: "Bekzod Ismoilov",
    organization: null,
    phone: "+998 99 600 70 80",
    role: "specialist",
    specialty: "Veterinar-epizootolog, Parrandachilik eksperti",
    education: "SamDVMU",
    bio: "Parrandachilik fermalari va chorva podalarida emlash taqvimi, profilaktika va davolash.",
    helpsWith: "both",
    experienceYears: 9,
    address: "Andijon shahri, Mashinasozlar ko'chasi",
    lat: 40.77,
    lng: 72.33,
    workHours: "08:00 - 18:00",
    distanceKm: 5.0,
    locked: false,
    ratingAvg: 4.8,
    ratingCount: 18,
  },
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
        setItems(Array.isArray(d?.items) && d.items.length > 0 ? d.items : DEFAULT_SPECIALISTS);
        setRadiusKm(typeof d?.radiusKm === "number" ? d.radiusKm : null);
      })
      .catch(() => {
        if (!cancelled) setItems(DEFAULT_SPECIALISTS);
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
