"use client";

import { useState, useEffect } from "react";
import { X, UserRound, Phone, MapPin, Loader2, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import { createSpecialistCall } from "@/lib/specialist-calls";
import { apiUrl } from "@/lib/api-config";

export default function SpecialistCallModal({
  specialist,
  isOpen,
  onClose,
  onSuccess,
}: {
  specialist: {
    id: number;
    name: string;
    organization?: string | null;
    specialty?: string | null;
    phone: string;
    role?: string | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [callType, setCallType] = useState<"crop" | "animal">("crop");
  const [problemNote, setProblemNote] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<"form" | "confirm" | "sent">("form");
  const [error, setError] = useState<string | null>(null);

  // Avtomatik ravishda saqlangan mijoz ma'lumotlarini yuklash
  useEffect(() => {
    if (!isOpen) return;

    // 1. localStorage dan yuklash
    try {
      const savedName = localStorage.getItem("agroz_customer_name");
      const savedPhone = localStorage.getItem("agroz_customer_phone");
      const savedAddress = localStorage.getItem("agroz_customer_address");
      if (savedName) setName(savedName);
      if (savedPhone) setPhone(savedPhone);
      if (savedAddress) setAddress(savedAddress);
    } catch {}

    // 2. /api/profile dan yuklash (tizimga kirgan bo'lsa)
    fetch(apiUrl("/api/profile"), { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          if (data.user.name) setName((prev) => prev || data.user.name);
          if (data.user.phone) {
            const clean = data.user.phone.replace(/\D/g, "").replace(/^998/, "").slice(0, 9);
            setPhone((prev) => prev || clean);
          }
          if (data.user.region || data.user.district) {
            const fullAddr = [data.user.region, data.user.district].filter(Boolean).join(", ");
            setAddress((prev) => prev || fullAddr);
          }
        }
      })
      .catch(() => {});

    // Mutaxassis sohasiga mos chaqiruv turini avtomatik tanlash
    if (specialist) {
      const specText = `${specialist.specialty || ""} ${specialist.role || ""}`.toLowerCase();
      if (specText.includes("vet") || specText.includes("chorva") || specText.includes("mol")) {
        setCallType("animal");
      } else {
        setCallType("crop");
      }
    }

    setStep("form");
    setError(null);
  }, [isOpen, specialist]);

  if (!isOpen || !specialist) return null;

  const cleanDigits = phone.replace(/\D/g, "").replace(/^998/, "");

  function handleProceedToConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setError("Iltimos, ismingizni kiriting");
      return;
    }
    if (cleanDigits.length !== 9) {
      setError("Telefon raqamingizni to'liq kiriting (masalan: 90 123 45 67)");
      return;
    }

    // Keyingi safar qayta yozmaslik uchun saqlab qo'yamiz
    try {
      localStorage.setItem("agroz_customer_name", name.trim());
      localStorage.setItem("agroz_customer_phone", cleanDigits);
      if (address.trim()) localStorage.setItem("agroz_customer_address", address.trim());
    } catch {}

    setError(null);
    setStep("confirm");
  }

  async function handleConfirmSubmit() {
    if (!specialist) return;
    setBusy(true);
    setError(null);

    const problemDescription =
      callType === "crop"
        ? `🌾 Ekin (O'simliklar)` + (problemNote.trim() ? `: ${problemNote.trim()}` : " parvarishi va ko'rik xizmati")
        : `🐄 Chorva (Hayvonlar)` + (problemNote.trim() ? `: ${problemNote.trim()}` : " parvarishi va veterinariya ko'rigi");

    try {
      let userLat: number | undefined;
      let userLng: number | undefined;

      try {
        if (navigator.geolocation) {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
          });
          userLat = pos.coords.latitude;
          userLng = pos.coords.longitude;
        }
      } catch {}

      const res = await fetch(apiUrl("/api/specialists/call"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialistId: specialist.id,
          customerName: name.trim(),
          customerPhone: `+998${cleanDigits}`,
          problem: problemDescription,
          address: address.trim() || undefined,
          userLat,
          userLng,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Chaqiruv yuborib bo'lmadi");
      }

      const callId = Number(data.callId);

      // Lokal tarix uchun ham saqlab qo'yamiz
      createSpecialistCall({
        id: String(callId),
        specialistId: specialist.id,
        specialistName: specialist.organization || specialist.name,
        customerName: name.trim(),
        customerPhone: `+998${cleanDigits}`,
        problem: problemDescription,
        address: address.trim() || undefined,
      });

      setStep("sent");
    } catch (err: any) {
      setError(err.message || "Chaqiruv yuborishda xatolik yuz berdi");
      setStep("form");
    } finally {
      setBusy(false);
    }
  }

  const handleModalClose = () => {
    setStep("form");
    setError(null);
    onClose();
  };

  return (
    <div
      onClick={handleModalClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[480px] rounded-[24px] bg-white p-6 shadow-2xl animate-in zoom-in-95"
      >
        <button
          onClick={handleModalClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition"
        >
          <X size={18} />
        </button>

        {step === "sent" ? (
          <div className="flex flex-col items-center justify-center py-6 text-center animate-in fade-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4 animate-in zoom-in">
              <CheckCircle2 size={38} />
            </div>
            <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 mb-2">
              ✅ Chaqiruv muvaffaqiyatli yuborildi
            </span>
            <h3 className="text-xl font-extrabold text-neutral-900">
              Mutaxassisga xabar yetkazildi!
            </h3>
            <p className="mt-2 text-[14px] text-neutral-600 max-w-sm leading-relaxed">
              Hozirda <b>{specialist.organization || specialist.name}</b> ga chaqiruv yuborildi, tez orada siz bilan bog&apos;lanadi. Telegram botingizga ham bildirishnoma yuborildi.
            </p>
            <button
              onClick={() => {
                handleModalClose();
                onSuccess();
              }}
              className="mt-6 rounded-2xl bg-[var(--brand-green)] px-8 py-3 text-xs font-bold text-white shadow-sm hover:brightness-105 active:scale-95 transition"
            >
              Tushunarli
            </button>
          </div>
        ) : step === "confirm" ? (
          <div className="py-2 animate-in fade-in">
            <div className="text-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11.5px] font-bold text-emerald-800">
                <ShieldCheck size={14} /> Chaqiruvni tasdiqlash
              </span>
              <h2 className="mt-2.5 text-[20px] font-black text-neutral-900">
                Chaqiruvni tasdiqlaysizmi?
              </h2>
              <p className="mt-1 text-[13px] text-neutral-500">
                Quyidagi ma&apos;lumotlar mutaxassisga yuboriladi:
              </p>
            </div>

            <div className="mt-5 rounded-2xl bg-neutral-50 p-4 border border-neutral-200/80 space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-neutral-200/60">
                <span className="text-[12.5px] font-medium text-neutral-500">Mutaxassis</span>
                <span className="text-[13.5px] font-bold text-neutral-900 text-right">
                  {specialist.organization || specialist.name}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2.5 border-b border-neutral-200/60">
                <span className="text-[12.5px] font-medium text-neutral-500">Chaqiruv turi</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[12px] font-bold text-emerald-800">
                  {callType === "crop" ? "🌾 Ekin (O'simliklar)" : "🐄 Chorva (Hayvonlar)"}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2.5 border-b border-neutral-200/60">
                <span className="text-[12.5px] font-medium text-neutral-500">Mijoz</span>
                <span className="text-[13px] font-semibold text-neutral-800">
                  {name} (+998 {cleanDigits})
                </span>
              </div>

              {address.trim() && (
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-medium text-neutral-500">Manzil</span>
                  <span className="text-[12.5px] text-neutral-700 text-right max-w-[200px] truncate">
                    {address}
                  </span>
                </div>
              )}
            </div>

            {error && (
              <p className="mt-3 rounded-xl bg-red-50 p-2.5 text-[12.5px] font-semibold text-red-600 border border-red-200">
                {error}
              </p>
            )}

            <div className="mt-6 flex gap-2.5">
              <button
                type="button"
                onClick={() => setStep("form")}
                disabled={busy}
                className="flex-1 rounded-2xl bg-neutral-100 py-3 text-[13.5px] font-bold text-neutral-700 hover:bg-neutral-200 transition"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-green)] py-3 text-[13.5px] font-bold text-white shadow-sm hover:brightness-105 active:scale-95 transition"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                <span>Ha, tasdiqlash</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleProceedToConfirm} className="space-y-4">
            <div>
              <span className="rounded-full bg-[var(--brand-green-soft)] px-3 py-1 text-[11.5px] font-bold text-[var(--brand-green)]">
                Mutaxassisni chaqirish
              </span>
              <h2 className="mt-2 text-[19px] font-black text-neutral-900 leading-snug">
                {specialist.organization || specialist.name}
              </h2>
              {specialist.specialty && (
                <p className="text-[13px] text-neutral-500 font-medium">
                  {specialist.specialty}
                </p>
              )}
            </div>

            <div className="space-y-3.5 pt-1">
              {/* Qanday chaqiruv: Ekin yoki Chorva */}
              <div>
                <label className="block text-[12px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                  Qanday chaqiruv?
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCallType("crop")}
                    className={`flex items-center justify-center gap-2 rounded-2xl p-3.5 border-2 transition ${
                      callType === "crop"
                        ? "border-[var(--brand-green)] bg-emerald-50 text-[var(--brand-green)] font-extrabold shadow-xs"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 font-semibold"
                    }`}
                  >
                    <span className="text-xl">🌾</span>
                    <span className="text-[13.5px]">Ekin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCallType("animal")}
                    className={`flex items-center justify-center gap-2 rounded-2xl p-3.5 border-2 transition ${
                      callType === "animal"
                        ? "border-[var(--brand-green)] bg-emerald-50 text-[var(--brand-green)] font-extrabold shadow-xs"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 font-semibold"
                    }`}
                  >
                    <span className="text-xl">🐄</span>
                    <span className="text-[13.5px]">Chorva</span>
                  </button>
                </div>
              </div>

              {/* Ism */}
              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-neutral-600">
                  <UserRound size={13} /> Ismingiz
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ism va familiyangiz"
                  className="ios-input mt-1 !p-3 text-[13.5px]"
                  required
                />
              </div>

              {/* Telefon */}
              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-neutral-600">
                  <Phone size={13} /> Telefon raqamingiz
                </label>
                <div className="flex items-center rounded-2xl bg-[var(--brand-bg)] pl-3 mt-1">
                  <span className="pr-1 text-[14px] font-bold text-neutral-500">+998</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").replace(/^998/, "").slice(0, 9))
                    }
                    placeholder="90 123 45 67"
                    className="ios-input !bg-transparent !p-3 !pl-0 text-[13.5px]"
                    required
                  />
                </div>
              </div>

              {/* Izoh (ixtiyoriy) */}
              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-neutral-600">
                  <AlertCircle size={13} /> Qisqa izoh (ixtiyoriy)
                </label>
                <input
                  type="text"
                  value={problemNote}
                  onChange={(e) => setProblemNote(e.target.value)}
                  placeholder="Masalan: barg sarg'ayishi yoki ko'rik..."
                  className="ios-input mt-1 !p-3 text-[13px]"
                />
              </div>

              {/* Manzil (ixtiyoriy) */}
              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-neutral-600">
                  <MapPin size={13} /> Manzilingiz / Mo&apos;ljal (ixtiyoriy)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Tuman, qishloq yoki xonadon"
                  className="ios-input mt-1 !p-3 text-[13px]"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 p-2.5 text-[12.5px] font-semibold text-red-600 border border-red-200">
                {error}
              </p>
            )}

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl bg-neutral-100 py-3 text-[14px] font-bold text-neutral-700 hover:bg-neutral-200 transition"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-green)] py-3 text-[14px] font-bold text-white shadow-sm hover:brightness-105 active:scale-95 transition"
              >
                <span>Davom etish</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
