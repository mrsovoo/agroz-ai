"use client";

import { use, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Store,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  Search,
  ShoppingBag,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Star,
  UserCheck,
  MessageCircle,
  HelpCircle,
  Package,
} from "lucide-react";
import { apiFetch } from "@/lib/api-config";

type StoreData = {
  id: number;
  name: string;
  organization?: string | null;
  role: "pharmacy" | "specialist" | "both";
  specialty?: string | null;
  phone: string;
  address?: string | null;
  workHours?: string | null;
  bio?: string | null;
  experienceYears?: number | null;
  login: string;
  isApproved: boolean;
  ratingAvg: number;
  ratingCount: number;
  medicines: Array<{
    id: number;
    name: string;
    type: string;
    usage?: string | null;
    status: string;
    price?: number | null;
    stock: number;
    stockUnit: string;
    hasPhoto?: boolean;
    photoData?: string | null;
  }>;
};

export default function StorePublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const rawSlug = resolvedParams?.slug || "";
  const cleanSlug = decodeURIComponent(rawSlug).replace(/^@/, "").toLowerCase().trim();

  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Qidiruv va Filtr
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "crop" | "animal" | "general">("all");
  const [orderModalMed, setOrderModalMed] = useState<StoreData["medicines"][0] | null>(null);

  useEffect(() => {
    if (!cleanSlug) {
      setError("Do'kon manzili noto'g'ri ko'rsatilgan");
      setLoading(false);
      return;
    }

    async function fetchStore() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/api/bot/partner/store/${cleanSlug}`);
        const data = await res.json();
        if (data?.ok && data.store) {
          setStore(data.store);
        } else {
          setError(data?.error || "Ushbu manzil bo'yicha do'kon yoki mutaxassis topilmadi");
        }
      } catch {
        setError("Internet aloqasini tekshiring yoki keyinroq qayta urinib ko'ring");
      } finally {
        setLoading(false);
      }
    }

    fetchStore();
  }, [cleanSlug]);

  const filteredMedicines = useMemo(() => {
    if (!store?.medicines) return [];
    return store.medicines.filter((m) => {
      const matchSearch =
        !searchQuery.trim() ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.usage && m.usage.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchType =
        selectedType === "all" ||
        m.type === selectedType ||
        (selectedType === "crop" && (m.type === "ekin" || m.type === "crop")) ||
        (selectedType === "animal" && (m.type === "chorva" || m.type === "animal"));

      return matchSearch && matchType;
    });
  }, [store?.medicines, searchQuery, selectedType]);

  const displayName = store?.organization || store?.name || "Agro-Do‘kon";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-4">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent" />
        <p className="mt-4 text-xs font-semibold text-zinc-500 font-mono">Do‘kon ma’lumotlari yuklanmoqda...</p>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 rounded-3xl bg-zinc-200/80 flex items-center justify-center text-zinc-400 mb-4">
          <HelpCircle size={32} />
        </div>
        <h1 className="text-xl font-black text-zinc-900 tracking-tight">Do‘kon topilmadi</h1>
        <p className="text-xs text-zinc-500 mt-2 max-w-sm leading-relaxed">
          {error || `“@${cleanSlug}” manzili bo‘yicha agro-do‘kon yoki mutaxassis mavjud emas.`}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5 justify-center">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-black text-white text-xs font-bold transition shadow-xs"
          >
            Bosh sahifaga qaytish
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-2xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 text-xs font-bold transition"
          >
            O‘z do‘koningizni oching
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] antialiased">
      {/* 1. Yuqori navigatsiya paneli */}
      <header className="sticky top-0 z-30 border-b border-[#E5E5EA] bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center font-black text-sm shadow-xs group-hover:scale-105 transition-transform">
              A
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-extrabold tracking-tight text-zinc-900 leading-tight">
                Agroz <span className="text-emerald-700">Business</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">Rasmiy Do‘kon Vitrinasi</span>
            </div>
          </Link>

          <Link
            href={`/?login=${encodeURIComponent(store.login)}`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/80 text-[11px] font-bold text-zinc-800 transition"
          >
            <span>Kabinetga kirish</span>
            <ExternalLink size={12} className="text-zinc-500" />
          </Link>
        </div>
      </header>

      {/* 2. Asosiy Do'kon Profili (Hero) */}
      <section className="bg-gradient-to-b from-white via-zinc-50/50 to-transparent border-b border-zinc-100 py-8 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            {/* Chap tomon: Asosiy ma'lumotlar */}
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-zinc-900 text-white flex items-center justify-center text-3xl sm:text-4xl shadow-md shrink-0">
                {store.role === "specialist" ? "🌾" : "🏪"}
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                    {displayName}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                    <ShieldCheck size={12} className="text-emerald-600" />
                    <span>Tasdiqlangan</span>
                  </span>
                </div>

                <p className="text-xs text-zinc-500 font-medium">
                  {store.specialty || (store.role === "specialist" ? "Agronom mutaxassis" : "Agro-do‘kon va dorixona")}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-600 pt-1">
                  {store.address && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-zinc-400 shrink-0" />
                      <span>{store.address}</span>
                    </div>
                  )}

                  {store.workHours && (
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-zinc-400 shrink-0" />
                      <span className="font-mono">{store.workHours}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star size={13} fill="currentColor" />
                    <span className="text-zinc-800">{Number(store.ratingAvg || 5.0).toFixed(1)}</span>
                    <span className="text-zinc-400 font-normal">({store.ratingCount || 1} ta baho)</span>
                  </div>
                </div>

                {store.bio && (
                  <p className="text-xs text-zinc-600 pt-2 leading-relaxed max-w-2xl font-normal">
                    {store.bio}
                  </p>
                )}
              </div>
            </div>

            {/* O'ng tomon: Tezkor aloqa tugmalari */}
            <div className="flex sm:flex-col gap-2 shrink-0 pt-2 sm:pt-0">
              <a
                href={`tel:${store.phone}`}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition active:scale-98"
              >
                <Phone size={15} />
                <span>Qo‘ng‘iroq qilish</span>
              </a>

              <div className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl bg-zinc-100 text-zinc-600 text-[11px] font-mono font-medium">
                <span>@{store.login}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Mahsulotlar Katalogi (Agro-do'kon yoki universal bo'lsa) */}
      {(store.role === "pharmacy" || store.role === "both") && (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-zinc-900 tracking-tight flex items-center gap-2">
                <ShoppingBag size={18} className="text-emerald-700" />
                <span>Do‘kondagi mahsulotlar</span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                  {filteredMedicines.length} ta
                </span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Sifatli o‘g‘itlar, himoya vositalari va preparatlar</p>
            </div>

            {/* Qidiruv qutisi */}
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Dori yoki preparat qidirish..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-2xl border border-zinc-200 bg-white focus:outline-none focus:border-black transition"
              />
            </div>
          </div>

          {/* Kategoriya filtri */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedType("all")}
              className={`px-3.5 py-1.5 rounded-full transition shrink-0 ${
                selectedType === "all"
                  ? "bg-zinc-900 text-white"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              Barchasi ({store.medicines.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedType("crop")}
              className={`px-3.5 py-1.5 rounded-full transition shrink-0 ${
                selectedType === "crop"
                  ? "bg-zinc-900 text-white"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              🌾 Ekinlar / O‘simliklar
            </button>
            <button
              type="button"
              onClick={() => setSelectedType("animal")}
              className={`px-3.5 py-1.5 rounded-full transition shrink-0 ${
                selectedType === "animal"
                  ? "bg-zinc-900 text-white"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              🐾 Chorvachilik
            </button>
          </div>

          {/* Mahsulotlar to'ri */}
          {filteredMedicines.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMedicines.map((med) => (
                <div
                  key={med.id}
                  className="rounded-3xl border border-zinc-200/90 bg-white p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow group"
                >
                  <div className="space-y-3">
                    {/* Rasm yoki placeholder */}
                    <div className="relative aspect-square w-full rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center overflow-hidden">
                      {med.photoData ? (
                        <img
                          src={med.photoData}
                          alt={med.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-zinc-300">
                          <Package size={32} />
                          <span className="text-[10px] font-mono text-zinc-400">Rasm yo‘q</span>
                        </div>
                      )}
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-[10px] font-bold text-zinc-700 shadow-xs">
                        {med.type === "crop" ? "🌾 Ekin" : med.type === "animal" ? "🐾 Chorva" : "Umumiy"}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 leading-snug line-clamp-2">
                        {med.name}
                      </h3>
                      {med.usage && (
                        <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                          {med.usage}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-100 mt-3 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-base font-black text-emerald-800">
                        {med.price ? `${med.price.toLocaleString("uz-UZ")} so‘m` : "Kelishilgan narx"}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-medium">
                        / {med.stockUnit || "dona"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setOrderModalMed(med)}
                      className="w-full flex items-center justify-center gap-1.5 rounded-2xl bg-zinc-900 hover:bg-black text-white text-xs font-bold py-2.5 transition active:scale-98 shadow-xs"
                    >
                      <Phone size={13} />
                      <span>Xarid qilish</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center rounded-3xl bg-white border border-zinc-200">
              <Package size={36} className="mx-auto text-zinc-300 mb-2" />
              <p className="text-sm font-bold text-zinc-700">Mahsulot topilmadi</p>
              <p className="text-xs text-zinc-400 mt-1">Qidiruv so‘zini o‘zgartiring yoki filtrni tozalang</p>
            </div>
          )}
        </main>
      )}

      {/* 4. Mutaxassis xizmatlari (agar Mutaxassis bo'lsa) */}
      {store.role === "specialist" && (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 space-y-4 shadow-xs">
            <h2 className="text-lg font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <UserCheck size={20} className="text-emerald-700" />
              <span>Mutaxassislik xizmatlari va ko‘rik</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                <span className="text-zinc-400 font-bold uppercase text-[10px] block">Mutaxassislik tajribasi</span>
                <span className="text-sm font-bold text-zinc-900 mt-1 block">
                  {store.experienceYears ? `${store.experienceYears} yil amaliy tajriba` : "Ko‘p yillik tajribali mutaxassis"}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                <span className="text-zinc-400 font-bold uppercase text-[10px] block">Xizmat hududi</span>
                <span className="text-sm font-bold text-zinc-900 mt-1 block">
                  {store.address || "Belgilangan tuman va viloyat bo‘yicha"}
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed pt-2">
              Ekinlaringiz yoki chorva mollaringiz kasalliklari, agronomik maslahat va dala ko‘rigi bo‘yicha to‘g‘ridan-to‘g‘ri qo‘ng‘iroq qiling.
            </p>

            <a
              href={`tel:${store.phone}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition"
            >
              <Phone size={15} />
              <span>Mutaxassis bilan bog‘lanish ({store.phone})</span>
            </a>
          </div>
        </main>
      )}

      {/* 5. Tezkor Xarid / Buyurtma Modali */}
      {orderModalMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-sm rounded-[28px] border border-zinc-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Tezkor buyurtma
              </span>
              <h3 className="text-base font-black text-zinc-900 pt-1">{orderModalMed.name}</h3>
              <p className="text-sm font-extrabold text-emerald-800">
                {orderModalMed.price ? `${orderModalMed.price.toLocaleString("uz-UZ")} so‘m` : "Kelishilgan narx"}
              </p>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed text-center">
              Ushbu mahsulotni bron qilish yoki xarid qilish uchun to‘g‘ridan-to‘g‘ri do‘kon bilan bog‘laning:
            </p>

            <div className="space-y-2 pt-1">
              <a
                href={`tel:${store.phone}`}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
              >
                <Phone size={15} />
                <span>Qo‘ng‘iroq qilish ({store.phone})</span>
              </a>

              <button
                type="button"
                onClick={() => setOrderModalMed(null)}
                className="w-full py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Footer */}
      <footer className="border-t border-zinc-200 bg-white py-8 mt-12 text-center text-xs text-zinc-500 space-y-2">
        <p className="font-medium">
          © {new Date().getFullYear()} <b>{displayName}</b> — Barcha huquqlar himoyalangan.
        </p>
        <p className="text-[11px] text-zinc-400">
          Ushbu vitrina{" "}
          <Link href="/" className="text-emerald-700 font-bold hover:underline">
            Agroz Business
          </Link>{" "}
          ekotizimida yaratilgan.
        </p>
      </footer>
    </div>
  );
}

