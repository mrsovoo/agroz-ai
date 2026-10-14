"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  CloudSun,
  ShoppingCart,
  Users,
  Search,
  Sprout,
  ShieldCheck,
  Sparkles,
  MapPin,
  Star,
  ArrowRight,
  Filter,
  Check,
  RefreshCw,
  PhoneCall,
  Info,
} from "lucide-react";
import WeatherCard from "@/components/WeatherCard";
import ProductCard from "@/components/ProductCard";
import {
  SpecialistCard,
  SpecialistProfileModal,
  type Specialist,
} from "@/components/SpecialistCard";
import SpecialistCallModal from "@/components/SpecialistCallModal";
import { apiFetch } from "@/lib/api-config";
import { useI18n } from "@/lib/i18n";

type Medicine = {
  id: number;
  name: string;
  type?: string;
  usage?: string | null;
  price: number | null;
  stockUnit?: string | null;
  hasPhoto?: boolean;
  photoUrl?: string | null;
  photoVersion?: string | null;
  updatedAt?: string | null;
  pharmacyId?: number;
  pharmacyName?: string;
  pharmacyPhone?: string;
  pharmacyAddress?: string;
};

export default function AgrozGoWebClient() {
  const { lang, t } = useI18n();

  const [activeTab, setActiveTab] = useState<"all" | "weather" | "market" | "specialists">("all");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);

  // Bozor qidiruv va filtr
  const [marketSearch, setMarketSearch] = useState("");
  const [marketCategory, setMarketCategory] = useState<"all" | "crop" | "animal" | "fertilizer">("all");

  // Mutaxassislar filtr
  const [specRole, setSpecRole] = useState<"all" | "agronomist" | "veterinarian">("all");

  // Modallar
  const [selectedProfile, setSelectedProfile] = useState<Specialist | null>(null);
  const [callSpecialist, setCallSpecialist] = useState<Specialist | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [medRes, specRes] = await Promise.allSettled([
          apiFetch("/api/medicines?limit=50"),
          apiFetch("/api/specialists"),
        ]);

        if (isMounted) {
          if (medRes.status === "fulfilled" && medRes.value.ok) {
            const data = await medRes.value.json();
            if (Array.isArray(data)) {
              setMedicines(
                data.map((m: any) => ({
                  id: m.id,
                  name: m.name,
                  type: m.type || "crop",
                  usage: m.usage,
                  price: m.price,
                  stockUnit: m.stockUnit,
                  hasPhoto: Boolean(m.hasPhoto),
                  photoVersion: m.photoVersion,
                  pharmacyId: m.pharmacyId || 1,
                  pharmacyName: m.pharmacyName || m.organization || "Agroz Agro-do'kon",
                  pharmacyPhone: m.pharmacyPhone || m.phone || "",
                  pharmacyAddress: m.pharmacyAddress || m.address || "",
                }))
              );
            }
          }

          if (specRes.status === "fulfilled" && specRes.value.ok) {
            const data = await specRes.value.json();
            if (Array.isArray(data)) {
              setSpecialists(data);
            }
          }
        }
      } catch (err) {
        console.error("AgrozGO ma'lumotlarini yuklashda xatolik:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtrlangan mahsulotlar
  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const matchSearch =
        !marketSearch ||
        m.name.toLowerCase().includes(marketSearch.toLowerCase()) ||
        (m.usage && m.usage.toLowerCase().includes(marketSearch.toLowerCase())) ||
        (m.pharmacyName && m.pharmacyName.toLowerCase().includes(marketSearch.toLowerCase()));

      let matchCat = true;
      if (marketCategory === "crop") {
        matchCat = m.type === "crop" || !m.type;
      } else if (marketCategory === "animal") {
        matchCat = m.type === "animal" || m.type === "vet";
      } else if (marketCategory === "fertilizer") {
        matchCat = Boolean(
          (m.name && /o'g'it|ogit|azot|fosfor|kaliy|bio|gumus/i.test(m.name)) ||
          (m.usage && /o'g'it|ogit|oziq/i.test(m.usage))
        );
      }

      return matchSearch && matchCat;
    });
  }, [medicines, marketSearch, marketCategory]);

  // Filtrlangan mutaxassislar
  const filteredSpecialists = useMemo(() => {
    return specialists.filter((s) => {
      const isVet =
        s.helpsWith === "animal" ||
        Boolean(s.specialty && /veterinar|chorva|parranda|hayvon/i.test(s.specialty)) ||
        Boolean(s.bio && /veterinar|chorva|parranda|hayvon/i.test(s.bio));

      if (specRole === "agronomist") return !isVet;
      if (specRole === "veterinarian") return isVet;
      return true;
    });
  }, [specialists, specRole]);

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#191B1F] py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
        {/* =========================================================================
            1. TOP HERO BANNER: AgrozGO Web App taqdimoti
            ========================================================================= */}
        <div className="rounded-[32px] sm:rounded-[40px] bg-gradient-to-br from-[#191B1F] to-[#2A2E35] text-white p-6 sm:p-10 shadow-xl border border-black/10 relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl text-left">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300 bg-white/10 px-3.5 py-1 rounded-full border border-white/15">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>AgrozGO Web App • Jonli rejim</span>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Qishloq xo‘jaligi ilovasining to‘laqonli veb versiyasi
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Ob-havo ma’lumotlari, agro-tahlillar, sertifikatlangan dori-darmonlar bozori va professional agronom hamda veterinar mutaxassislarni yagona ekranda kuzating va chaqiring.
              </p>
            </div>

            {/* Tezkor Ko'rsatkichlar (Apple badges) */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 text-left border border-white/10 min-w-[95px] sm:min-w-[110px]">
                <CloudSun size={18} className="text-amber-400 mb-1" />
                <div className="text-base sm:text-lg font-black">Ob-havo</div>
                <div className="text-[10px] text-zinc-300 font-medium">Agro-tahlil bilan</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 text-left border border-white/10 min-w-[95px] sm:min-w-[110px]">
                <ShoppingCart size={18} className="text-emerald-400 mb-1" />
                <div className="text-base sm:text-lg font-black">Bozor</div>
                <div className="text-[10px] text-zinc-300 font-medium">Dorilar & Urug‘lar</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 text-left border border-white/10 min-w-[95px] sm:min-w-[110px]">
                <Users size={18} className="text-blue-400 mb-1" />
                <div className="text-base sm:text-lg font-black">Ekspertlar</div>
                <div className="text-[10px] text-zinc-300 font-medium">Dalaga chaqiruv</div>
              </div>
            </div>
          </div>

          {/* Fon naqshi */}
          <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* =========================================================================
            2. SECTION 1: OB-HAVO VA AGRO-TAHLIL KARTASI
            ========================================================================= */}
        <section id="ob-havo" className="space-y-4 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 pb-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full mb-1">
                <CloudSun size={13} />
                <span>Hududiy Ob-havo</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#191B1F]">
                Ekin va chorva uchun agrotexnik ob-havo
              </h2>
            </div>
            <p className="text-xs text-zinc-500 max-w-md">
              Joylashuvingizga mos harorat, namlik, shamol tezligi va dori purkash/ekish uchun agronomik tavsiyalar.
            </p>
          </div>

          {/* Standart ob-havo kartasi */}
          <WeatherCard />
        </section>

        {/* =========================================================================
            3. SECTION 2: AGRO BOZOR (DORILAR, O'G'ITLAR VA URUG'LAR)
            ========================================================================= */}
        <section id="bozor" className="space-y-6 text-left">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black/5 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full mb-1">
                <ShoppingCart size={13} />
                <span>Agroz Bozor</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-[#191B1F]">
                Preparatlar, o‘g‘itlar va dorilar katalogi
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                O‘zbekiston bo‘ylab sertifikatlangan agro-dorixonalar tovarlari, narxi va onlayn savatga qo‘shish imkoniyati.
              </p>
            </div>

            {/* Qidiruv qatori */}
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={marketSearch}
                onChange={(e) => setMarketSearch(e.target.value)}
                placeholder="Dori yoki preparat qidirish..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-zinc-200 text-xs font-semibold focus:outline-hidden focus:border-emerald-600 shadow-2xs"
              />
            </div>
          </div>

          {/* Kategoriya Tablari (Apple vector pills) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "all", label: "Barcha dorilar", count: medicines.length },
              { id: "crop", label: "O‘simlik himoyasi", count: medicines.filter((m) => m.type === "crop" || !m.type).length },
              { id: "animal", label: "Chorvachilik dorilari", count: medicines.filter((m) => m.type === "animal" || m.type === "vet").length },
              { id: "fertilizer", label: "O‘g‘itlar & Stimulyatorlar", count: medicines.filter((m) => /o'g'it|ogit|azot|fosfor|kaliy|bio|gumus/i.test(m.name)).length },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setMarketCategory(cat.id as any)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  marketCategory === cat.id
                    ? "bg-[#191B1F] text-white shadow-xs"
                    : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100"
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${marketCategory === cat.id ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"}`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Mahsulotlar to'ri (Grid) */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-64 rounded-3xl bg-white border border-black/5 animate-pulse p-4" />
              ))}
            </div>
          ) : filteredMedicines.length === 0 ? (
            <div className="rounded-3xl bg-white border border-black/5 p-12 text-center text-zinc-400 space-y-2">
              <ShoppingCart size={32} className="mx-auto text-zinc-300" />
              <div className="text-sm font-bold text-zinc-700">Mahsulotlar topilmadi</div>
              <p className="text-xs text-zinc-500">Boshqa so‘z yoki toifa bilan qidirib ko‘ring.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {filteredMedicines.map((med) => (
                <ProductCard
                  key={med.id}
                  variant="md"
                  medicine={{
                    id: med.id,
                    name: med.name,
                    price: med.price,
                    type: med.type || "general",
                    hasPhoto: Boolean(med.hasPhoto || med.photoUrl),
                    photoVersion: med.photoVersion,
                    usage: med.usage ?? null,
                    stockUnit: med.stockUnit,
                    updatedAt: med.updatedAt ?? null,
                    status: "bor",
                  }}
                  pharmacy={{
                    id: med.pharmacyId || 1,
                    name: med.pharmacyName || "Agroz Agro-do'kon",
                    phone: med.pharmacyPhone || "",
                    address: med.pharmacyAddress || null,
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* =========================================================================
            4. SECTION 3: MUTAXASSISLAR (AGRONOM VA VETERINARLAR)
            ========================================================================= */}
        <section id="mutaxassislar" className="space-y-6 text-left">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black/5 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full mb-1">
                <Users size={13} />
                <span>Malakali Mutaxassislar</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-[#191B1F]">
                Agronom va veterinar mutaxassislarni chaqiring
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                O‘simliklar himoyasi yoki chorva salomatligi bo‘yicha tajribali ekspertlar profilini ko‘ring va dalangizga chaqiring.
              </p>
            </div>

            {/* Filtr tugmalari */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSpecRole("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                  specRole === "all" ? "bg-[#191B1F] text-white" : "bg-white text-zinc-700 border border-zinc-200"
                }`}
              >
                Barchasi ({specialists.length})
              </button>
              <button
                type="button"
                onClick={() => setSpecRole("agronomist")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                  specRole === "agronomist" ? "bg-[#191B1F] text-white" : "bg-white text-zinc-700 border border-zinc-200"
                }`}
              >
                Agronomlar
              </button>
              <button
                type="button"
                onClick={() => setSpecRole("veterinarian")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                  specRole === "veterinarian" ? "bg-[#191B1F] text-white" : "bg-white text-zinc-700 border border-zinc-200"
                }`}
              >
                Veterinarlar
              </button>
            </div>
          </div>

          {/* Mutaxassislar Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-60 rounded-3xl bg-white border border-black/5 animate-pulse p-6" />
              ))}
            </div>
          ) : filteredSpecialists.length === 0 ? (
            <div className="rounded-3xl bg-white border border-black/5 p-12 text-center text-zinc-400 space-y-2">
              <Users size={32} className="mx-auto text-zinc-300" />
              <div className="text-sm font-bold text-zinc-700">Mutaxassislar topilmadi</div>
              <p className="text-xs text-zinc-500">Iltimos, boshqa toifani tanlang.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSpecialists.map((s) => (
                <SpecialistCard
                  key={s.id}
                  specialist={s}
                  onViewProfile={(spec) => setSelectedProfile(spec)}
                  onCall={(spec) => setCallSpecialist(spec)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Profil Modali */}
      {selectedProfile && (
        <SpecialistProfileModal
          specialist={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onCall={(s) => {
            setSelectedProfile(null);
            setCallSpecialist(s);
          }}
        />
      )}

      {/* Mutaxassisni chaqirish modali */}
      <SpecialistCallModal
        specialist={callSpecialist}
        isOpen={Boolean(callSpecialist)}
        onClose={() => setCallSpecialist(null)}
        onSuccess={() => setCallSpecialist(null)}
      />
    </div>
  );
}
