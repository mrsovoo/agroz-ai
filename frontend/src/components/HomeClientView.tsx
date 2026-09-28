"use client";

import { useState } from "react";
import Link from "next/link";
import AgrozLogo from "@/components/AgrozLogo";
import NotificationBell from "@/components/NotificationBell";
import WeatherCard from "@/components/WeatherCard";
import SpecialistCallModal from "@/components/SpecialistCallModal";
import { loadCart, saveCart, notifyCartChanged, type CartStorePharmacy, type CartStoreMedicine } from "@/lib/cart-store";
import { haptic } from "@/lib/telegram";
import { Sparkles, Check } from "lucide-react";

export type HomeMedicine = {
  id: number;
  name: string;
  usage?: string | null;
  price: number | null;
  hasPhoto?: boolean;
  photoUrl?: string | null;
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

// Fallback ma'lumotlar — rasmda ko'rsatilgan Bento Max va Veterinar
const DEFAULT_MEDICINES: HomeMedicine[] = [
  {
    id: 101,
    name: "Bento Max",
    usage: "Tabiiy minerallarga boy ozuqa",
    price: 35000,
    pharmacyId: 1,
    pharmacyName: "Agroz Dorixona",
    pharmacyPhone: "+998901234567",
    pharmacyAddress: "Toshkent shahri",
  },
  {
    id: 102,
    name: "Bento Max",
    usage: "Tabiiy minerallarga boy ozuqa",
    price: 35000,
    pharmacyId: 1,
    pharmacyName: "Agroz Dorixona",
    pharmacyPhone: "+998901234567",
    pharmacyAddress: "Toshkent shahri",
  },
];

const DEFAULT_SPECIALIST: HomeSpecialist = {
  id: 201,
  name: "Sohibjon Sulaymonov",
  phone: "+998901234567",
  specialty: "Veterinar",
  experienceYears: 8,
  ratingAvg: 4.5,
  role: "specialist",
};

export default function HomeClientView({
  initialMedicines = [],
  initialSpecialist,
}: {
  initialMedicines?: HomeMedicine[];
  initialSpecialist?: HomeSpecialist | null;
}) {
  const [medicines] = useState<HomeMedicine[]>(
    initialMedicines && initialMedicines.length >= 2 ? initialMedicines.slice(0, 2) : DEFAULT_MEDICINES
  );
  const [specialist] = useState<HomeSpecialist>(initialSpecialist || DEFAULT_SPECIALIST);

  const [callModalOpen, setCallModalOpen] = useState(false);
  const [addedIds, setAddedIds] = useState<number[]>([]);

  function handleAddToCart(med: HomeMedicine) {
    haptic("medium");
    const cart = loadCart();
    const pharmacy: CartStorePharmacy = {
      id: med.pharmacyId || 1,
      name: med.pharmacyName || "Agroz Dorixona",
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

    const lines = cart?.lines ? [...cart.lines] : [];
    const existingIndex = lines.findIndex((l) => l.medicine.id === med.id);
    if (existingIndex >= 0) {
      lines[existingIndex].qty += 1;
    } else {
      lines.push({ medicine: cartMedicine, pharmacy, qty: 1 });
    }

    saveCart({ pharmacy, lines });
    notifyCartChanged();

    // Tugmada bir muddat tasdiq animatsiyasi
    setAddedIds((prev) => [...prev, med.id]);
    setTimeout(() => {
      setAddedIds((prev) => prev.filter((id) => id !== med.id));
    }, 1200);
  }

  function formatPrice(sum?: number | null) {
    if (!sum) return "35.000 so'm";
    return new Intl.NumberFormat("uz-UZ").format(sum).replace(/\s/g, ".") + " so'm";
  }

  return (
    <div className="min-h-screen bg-white px-4 pt-3 pb-24 text-neutral-900">
      {/* 1. Header: AgrozGO + NotificationBell */}
      <header className="flex items-center justify-between py-2">
        <AgrozLogo className="h-8" />
        <NotificationBell />
      </header>

      {/* 2. Ob-havo kartasi: 3D Quyosh + 22 °C + Toshkent */}
      <div className="mt-3.5">
        <WeatherCard showDetails={false} />
      </div>

      {/* 3. Dorilar bo'limi */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-3 px-0.5">
          <h2 className="text-[20px] font-black tracking-tight text-neutral-900">Dorilar</h2>
          <Link
            href="/dorilar"
            className="text-[14px] font-bold text-[#039e1e] hover:underline active:opacity-80 transition"
          >
            Barchasi
          </Link>
        </div>

        {/* 2 ustunli kartalar */}
        <div className="grid grid-cols-2 gap-3.5">
          {medicines.map((med, idx) => {
            const isAdded = addedIds.includes(med.id);
            return (
              <div
                key={med.id || idx}
                className="flex flex-col justify-between rounded-[24px] bg-[#f8f9fa] border border-neutral-100 p-3 shadow-2xs transition active:scale-[0.98]"
              >
                <div>
                  {/* Rasm joyi — rasmda toza oq blok */}
                  <div className="relative mb-2.5 flex h-[135px] w-full items-center justify-center overflow-hidden rounded-[18px] bg-white border border-neutral-100/80">
                    {med.photoUrl ? (
                      <img
                        src={med.photoUrl}
                        alt={med.name}
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white" />
                    )}
                  </div>

                  {/* Nomi */}
                  <h3 className="text-[15px] font-black leading-tight text-neutral-900 line-clamp-1">
                    {med.name}
                  </h3>

                  {/* Tavsifi */}
                  <p className="mt-1 text-[11.5px] leading-tight text-neutral-500 line-clamp-2">
                    {med.usage || "Tabiiy minerallarga boy ozuqa"}
                  </p>
                </div>

                <div className="mt-3">
                  {/* Narxi */}
                  <p className="text-[15px] font-black text-neutral-900">
                    {formatPrice(med.price)}
                  </p>

                  {/* + Savatga tugmasi */}
                  <button
                    type="button"
                    onClick={() => handleAddToCart(med)}
                    className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-full py-2.5 text-[13px] font-bold text-white shadow-2xs transition-all active:scale-95 ${
                      isAdded ? "bg-emerald-700" : "bg-[#039e1e] hover:bg-[#028518]"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check size={15} strokeWidth={2.6} /> Qo&apos;shildi
                      </>
                    ) : (
                      "+ Savatga"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Mutaxassislar bo'limi */}
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
                {specialist.name ? specialist.name.charAt(0) : "V"}
              </div>

              <div>
                <h3 className="text-[17px] font-black leading-snug text-neutral-900">
                  {specialist.specialty || "Veterinar"}
                </h3>
                <p className="text-[12.5px] font-medium text-neutral-500 mt-0.5">
                  {specialist.name || "Sohibjon Sulaymonov"}
                </p>
              </div>
            </div>

            {/* Badgelar: 8 yil & 4.5 */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="rounded-full bg-[#028518] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-2xs">
                {specialist.experienceYears ?? 8} yil
              </span>
              <span className="rounded-full bg-[#f59e0b] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-2xs">
                {specialist.ratingAvg ? specialist.ratingAvg.toFixed(1) : "4.5"}
              </span>
            </div>
          </div>

          {/* 2 ta tugma: Bog'lanish & Chaqirish */}
          <div className="mt-3.5 grid grid-cols-2 gap-2.5">
            <a
              href={`tel:${specialist.phone || "+998901234567"}`}
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

      {/* 5. AI Tashxis bloki */}
      <section className="mt-4">
        <Link
          href="/tashxis"
          onClick={() => haptic("light")}
          className="flex items-center justify-between rounded-[24px] bg-[#f8f9fa] border border-neutral-100 p-3.5 shadow-2xs transition active:scale-[0.99] hover:border-neutral-200"
        >
          <div className="flex items-center gap-3">
            {/* Kulrang dumaloq kvadrat icon */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#71717a] text-white shadow-2xs">
              <Sparkles size={22} />
            </div>
            <div>
              <h3 className="text-[16px] font-black text-neutral-900 leading-tight">AI Tashxis</h3>
              <p className="mt-0.5 text-[12px] text-neutral-500">Rasm orqali kasallikni aniqlash</p>
            </div>
          </div>

          <span className="rounded-full bg-[#6b7280] px-3 py-1 text-[11.5px] font-medium text-white shadow-2xs">
            Tez kunda
          </span>
        </Link>
      </section>

      {/* Mutaxassis chaqirish modali */}
      <SpecialistCallModal
        specialist={{
          id: specialist.id,
          name: specialist.name,
          phone: specialist.phone,
          specialty: specialist.specialty,
        }}
        isOpen={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        onSuccess={() => setCallModalOpen(false)}
      />
    </div>
  );
}
