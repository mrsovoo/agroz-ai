"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AgrozLogo from "@/components/AgrozLogo";
import NotificationBell from "@/components/NotificationBell";
import WeatherCard from "@/components/WeatherCard";
import SpecialistCallModal from "@/components/SpecialistCallModal";
import ProductCard from "@/components/ProductCard";
import {
  loadCart,
  saveCart,
  notifyCartChanged,
  CART_EVENT,
  type CartStorePharmacy,
  type CartStoreMedicine,
} from "@/lib/cart-store";
import { haptic } from "@/lib/telegram";
import { Minus, Plus } from "lucide-react";

export type HomeMedicine = {
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

export type HomeSpecialist = {
  id: number;
  name: string;
  phone: string;
  specialty: string | null;
  experienceYears: number | null;
  ratingAvg: number | null;
  role?: string;
};

export default function HomeClientView({
  initialMedicines = [],
  initialSpecialist,
}: {
  initialMedicines?: HomeMedicine[];
  initialSpecialist?: HomeSpecialist | null;
}) {
  const [medicines, setMedicines] = useState<HomeMedicine[]>(initialMedicines || []);
  const [displayedMedicines, setDisplayedMedicines] = useState<HomeMedicine[]>(() => {
    if (initialMedicines && initialMedicines.length > 0) {
      return [...initialMedicines].sort(() => 0.5 - Math.random()).slice(0, 4);
    }
    return [];
  });
  const [specialist] = useState<HomeSpecialist | null>(initialSpecialist || null);

  useEffect(() => {
    // Har gal Asosiy sahifa ochilganda yoki yangilanganda 4 ta tasodifiy dorilar tanlanadi
    async function fetchRandomMedicines() {
      try {
        const res = await fetch(`/api/medicines?limit=30&random=1&_t=${Date.now()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const list: HomeMedicine[] = data.map((m: any) => ({
            id: m.id,
            name: m.name,
            type: m.type,
            usage: m.usage,
            price: m.price,
            stockUnit: m.stockUnit,
            hasPhoto: Boolean(m.hasPhoto),
            photoVersion: m.photoVersion,
            photoUrl: m.hasPhoto ? `/api/medicines/${m.id}/photo` : null,
            pharmacyId: m.pharmacyId,
            pharmacyName: m.pharmacyName,
            pharmacyPhone: m.pharmacyPhone,
            pharmacyAddress: m.pharmacyAddress,
          }));
          const shuffled = [...list].sort(() => 0.5 - Math.random());
          setDisplayedMedicines(shuffled.slice(0, 4));
          setMedicines(list);
          return;
        }
      } catch {}

      // Fallback
      if (initialMedicines && initialMedicines.length > 0) {
        const shuffled = [...initialMedicines].sort(() => 0.5 - Math.random());
        setDisplayedMedicines(shuffled.slice(0, 4));
      }
    }

    fetchRandomMedicines();
  }, [initialMedicines]);

  const [callModalOpen, setCallModalOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  useEffect(() => {
    const sync = () => {
      const cart = loadCart();
      const map: Record<number, number> = {};
      if (cart?.lines) {
        for (const line of cart.lines) {
          map[line.medicine.id] = line.qty;
        }
      }
      setQuantities(map);
    };
    sync();
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function changeQty(med: HomeMedicine, delta: number) {
    haptic(delta > 0 ? "medium" : "light");
    const cart = loadCart();
    const pharmacy: CartStorePharmacy = {
      id: med.pharmacyId || 1,
      name: med.pharmacyName || "Agroz Agro-do'kon",
      phone: med.pharmacyPhone || "+998901234567",
      address: med.pharmacyAddress || "Toshkent",
    };

    const cartMedicine: CartStoreMedicine = {
      id: med.id,
      name: med.name,
      price: med.price,
      type: "agro",
      hasPhoto: !!med.photoUrl,
      usage: med.usage || null,
      status: "bor",
    };

    let lines = cart?.lines ? [...cart.lines] : [];
    const existingIndex = lines.findIndex((l) => l.medicine.id === med.id);

    if (existingIndex >= 0) {
      const newQty = lines[existingIndex].qty + delta;
      if (newQty <= 0) {
        lines = lines.filter((l) => l.medicine.id !== med.id);
      } else {
        lines[existingIndex].qty = Math.min(99, newQty);
      }
    } else if (delta > 0) {
      lines.push({ medicine: cartMedicine, pharmacy, qty: 1 });
    }

    saveCart({ pharmacy, lines });
    notifyCartChanged();
  }

  function formatPrice(sum?: number | null) {
    if (!sum || sum <= 0) return "Kelishilgan narxda";
    return new Intl.NumberFormat("uz-UZ").format(sum).replace(/\s/g, ".") + " so'm";
  }

  return (
    <div className="min-h-screen bg-white px-4 pt-3 pb-24 text-neutral-900">
      {/* 1. Header: AgrozGO + Ekranimga + NotificationBell */}
      <header className="flex items-center justify-between py-2">
        <AgrozLogo className="h-8" />
        <div className="flex items-center gap-2">
          <NotificationBell />
        </div>
      </header>

      {/* 2. Ob-havo kartasi: 3D Quyosh + 22 °C + Agro tahlil */}
      <div className="mt-3.5">
        <WeatherCard />
      </div>

      {/* 3. Dorilar bo'limi */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-3 px-0.5">
          <h2 className="text-[20px] font-black tracking-tight text-neutral-900">Dorilar</h2>
          <Link
            href="/dorilar"
            className="text-[14px] font-bold text-[#039e1e] hover:underline active:opacity-80 transition inline-flex items-center gap-1"
          >
            <span>Barchasi</span>
            {medicines.length > 0 && <span>({medicines.length})</span>}
            <span>→</span>
          </Link>
        </div>

        {/* Dorilar kartalari (aniq 4 ta dorilar ko'rsatiladi va har kirganda yangilanadi) */}
        {displayedMedicines.length === 0 ? (
          <div className="rounded-2xl border border-neutral-100 bg-[#f8f9fa] p-6 text-center text-[13px] text-neutral-400">
            Hozircha dorilar mavjud emas
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5">
            {displayedMedicines.slice(0, 4).map((med, idx) => (
              <ProductCard
                key={med.id || idx}
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

      {/* 4. Mutaxassislar bo'limi — faqat real mutaxassis borligini tekshiradi */}
      {specialist && (
        <section className="mt-6">
          <div className="flex items-center justify-between mb-3 px-0.5">
            <h2 className="text-[20px] font-black tracking-tight text-neutral-900">Mutaxasislar</h2>
            <Link
              href="/mutaxassislar"
              className="text-[14px] font-bold text-[#039e1e] hover:underline active:opacity-80 transition"
            >
              Barchasi
            </Link>
          </div>

          {/* Mutaxassis kartasi */}
          <div className="rounded-[24px] bg-[#f8f9fa] border border-neutral-100 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Sariq/olovrang avatar */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#f59e0b] to-[#ea580c] text-white shadow-2xs font-black text-xl">
                  {specialist?.name?.charAt(0) ?? "V"}
                </div>

                <div>
                  <h3 className="text-[17px] font-black leading-snug text-neutral-900">
                    {specialist?.specialty || "Veterinar"}
                  </h3>
                  <p className="text-[12.5px] font-medium text-neutral-500 mt-0.5">
                    {specialist?.name ?? "—"}
                  </p>
                </div>
              </div>

              {/* Badgelar: tajriba yillari & reyting */}
              <div className="flex items-center gap-1.5 shrink-0">
                {specialist?.experienceYears != null && specialist.experienceYears > 0 && (
                  <span className="rounded-full bg-[#028518] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-2xs">
                    {specialist.experienceYears >= 10 ? "10+ yil" : `${specialist.experienceYears} yil`}
                  </span>
                )}
                {specialist?.ratingAvg && specialist.ratingAvg > 0 ? (
                  <span className="rounded-full bg-[#f59e0b] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-2xs">
                    ★ {specialist.ratingAvg.toFixed(1)}
                  </span>
                ) : (
                  <span className="rounded-full bg-neutral-200/80 px-2 py-0.5 text-[10.5px] font-bold text-neutral-600">
                    Yangi
                  </span>
                )}
              </div>
            </div>

            {/* 2 ta tugma: Bog'lanish & Chaqirish */}
            <div className="mt-3.5 grid grid-cols-2 gap-2.5">
              <a
                href={`tel:${specialist?.phone ?? ""}`}
                onClick={() => haptic("light")}
                className="flex items-center justify-center rounded-xl bg-[#6b7280] hover:bg-[#4b5563] py-2.5 text-[14px] font-bold text-white transition active:scale-95 shadow-2xs"
              >
                Bog&apos;lanish
              </a>
              <button
                type="button"
                onClick={() => {
                  haptic("medium");
                  setCallModalOpen(true);
                }}
                className="flex items-center justify-center rounded-xl bg-[#039e1e] hover:bg-[#028518] py-2.5 text-[14px] font-bold text-white transition active:scale-95 shadow-2xs"
              >
                Chaqirish
              </button>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
