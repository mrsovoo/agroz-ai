"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AgrozLogo from "@/components/AgrozLogo";
import NotificationBell from "@/components/NotificationBell";
import WeatherCard from "@/components/WeatherCard";
import SpecialistCallModal from "@/components/SpecialistCallModal";
import {
  loadCart,
  saveCart,
  notifyCartChanged,
  CART_EVENT,
  type CartStorePharmacy,
  type CartStoreMedicine,
} from "@/lib/cart-store";
import { haptic } from "@/lib/telegram";
import { Sparkles, Minus, Plus } from "lucide-react";

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

export default function HomeClientView({
  initialMedicines = [],
  initialSpecialist,
}: {
  initialMedicines?: HomeMedicine[];
  initialSpecialist?: HomeSpecialist | null;
}) {
  const [medicines] = useState<HomeMedicine[]>(initialMedicines || []);
  const [specialist] = useState<HomeSpecialist | null>(initialSpecialist || null);

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

        {/* 2 ustunli kartalar yoki bo'sh holat */}
        {medicines.length === 0 ? (
          <div className="rounded-2xl border border-neutral-100 bg-[#f8f9fa] p-6 text-center text-[13px] text-neutral-400">
            Hozircha dorilar mavjud emas
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5">
            {medicines.map((med, idx) => {
              const qty = quantities[med.id] || 0;
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
                    {med.usage && (
                      <p className="mt-1 text-[11.5px] leading-tight text-neutral-500 line-clamp-2">
                        {med.usage}
                      </p>
                    )}
                  </div>

                  <div className="mt-3">
                    {/* Narxi */}
                    <p className="text-[15px] font-black text-neutral-900">
                      {formatPrice(med.price)}
                    </p>

                    {/* + Savatga yoki - 1 + tugmasi */}
                    <div className="mt-2">
                      {qty > 0 ? (
                        <div className="flex h-10 w-full items-center justify-between rounded-full bg-[#eaf5e1] border border-[#039e1e]/30 px-1 text-[#039e1e]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              changeQty(med, -1);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#039e1e] shadow-xs active:scale-90 transition font-black"
                            aria-label="Kamaytirish"
                          >
                            <Minus size={14} strokeWidth={3} />
                          </button>

                          <span className="text-[13px] font-black tracking-tight select-none">
                            {qty} ta
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              changeQty(med, 1);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#039e1e] text-white shadow-xs active:scale-90 transition font-black"
                            aria-label="Ko'paytirish"
                          >
                            <Plus size={14} strokeWidth={3} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => changeQty(med, 1)}
                          className="flex w-full items-center justify-center rounded-full bg-[#039e1e] hover:bg-[#028518] py-2.5 text-[13px] font-bold text-white shadow-2xs active:scale-95 transition-all"
                        >
                          + Savatga
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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

      {/* Mutaxassis chaqirish modali — faqat real mutaxassis bo'lsa */}
      {specialist && (
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
      )}
    </div>
  );
}
