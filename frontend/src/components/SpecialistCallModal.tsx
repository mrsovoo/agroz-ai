"use client";

import { useState, useEffect } from "react";
import { X, UserRound, Phone, MapPin, Loader2, CheckCircle2, ShieldCheck, ArrowLeft } from "lucide-react";
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
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<"select" | "confirm" | "sent">("select");
  const [error, setError] = useState<string | null>(null);

  // Avtomatik ravishda foydalanuvchi ism va raqamini yuklash
  useEffect(() => {
    if (!isOpen) return;

    // 1. localStorage dan olish
    try {
      const savedName = localStorage.getItem("agroz_customer_name");
      const savedPhone = localStorage.getItem("agroz_customer_phone");
      const savedAddress = localStorage.getItem("agroz_customer_address");
      if (savedName) setName(savedName);
      if (savedPhone) setPhone(savedPhone);
      if (savedAddress) setAddress(savedAddress);
    } catch {}

    // 2. /api/profile dan olish (tizimga kirgan bo'lsa)
    const cookieSession = typeof document !== "undefined"
      ? document.cookie.split(";").find((c) => c.trim().startsWith("agroz_session="))?.split("=")[1]
      : undefined;

    fetch(apiUrl("/api/profile"), {
      credentials: "include",
      headers: cookieSession ? { Authorization: `Bearer ${cookieSession}` } : {},
      cache: "no-store",
    })
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

    setStep("select");
    setError(null);
  }, [isOpen]);

  if (!isOpen || !specialist) return null;

  const cleanDigits = phone.replace(/\D/g, "").replace(/^998/, "");

  // 1. Ekin yoki Chorvani bosganda
  function handleSelectType(type: "crop" | "animal") {
    setCallType(type);
    setError(null);
    setStep("confirm");
  }

  // 2. Tasdiqlash bosilganda mutaxassisni chaqirish
  async function handleConfirmSubmit() {
    if (!specialist) return;

    if (!name.trim() || name.trim().length < 2) {
      setError("Iltimos, ismingizni kiriting");
      return;
    }
    if (cleanDigits.length !== 9) {
      setError("Telefon raqamingizni to'liq kiriting (masalan: 90 123 45 67)");
      return;
    }

    setBusy(true);
    setError(null);

    // Ma'lumotlarni keyingi safar avto to'ldirish uchun eslab qolamiz
    try {
      localStorage.setItem("agroz_customer_name", name.trim());
      localStorage.setItem("agroz_customer_phone", cleanDigits);
      if (address.trim()) localStorage.setItem("agroz_customer_address", address.trim());
    } catch {}

    const problemDescription =
      callType === "crop"
        ? "🌾 Ekin (O'simliklar) bo'yicha ko'rik va xizmat"
        : "🐄 Chorva (Hayvonlar) bo'yicha veterinariya ko'rigi";

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
    } finally {
      setBusy(false);
    }
  }

  const handleModalClose = () => {
    setStep("select");
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
        className="relative w-full max-w-[460px] rounded-[24px] bg-white p-6 shadow-2xl animate-in zoom-in-95"
      >
        <button
          onClick={handleModalClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition"
        >
          <X size={18} />
        </button>

        {/* 3-BOSQICH: Chaqiruv muvaffaqiyatli yuborildi */}
        {step === "sent" ? (
          <div className="flex flex-col items-center justify-center py-6 text-center animate-in fade-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4 animate-in zoom-in">
              <CheckCircle2 size={38} />
            </div>
            <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 mb-2">
              ✅ Chaqiruv yuborildi
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
          /* 2-BOSQICH: Ekin/Chorva tanlangandan keyin TASDIQLASH */
          <div className="py-1 animate-in fade-in">
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => setStep("select")}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition"
                title="Orqaga qaytish"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[var(--brand-green)]">
                  <ShieldCheck size={13} /> Chaqiruvni tasdiqlash
                </span>
                <h2 className="text-[18px] font-black text-neutral-900 leading-tight">
                  Chaqiruvni tasdiqlaysizmi?
                </h2>
              </div>
            </div>

            {/* Mutaxassis va Chaqiruv kartochkasi */}
            <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-200/80 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200/60">
                <span className="text-[12.5px] font-medium text-neutral-500">Mutaxassis</span>
                <span className="text-[13.5px] font-bold text-neutral-900 text-right">
                  {specialist.organization || specialist.name}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-neutral-200/60">
                <span className="text-[12.5px] font-medium text-neutral-500">Chaqiruv turi</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[12.5px] font-bold text-emerald-800">
                  {callType === "crop" ? "🌾 Ekin (O'simliklar)" : "🐄 Chorva (Hayvonlar)"}
                </span>
              </div>

              {/* Ismni avto-to'ldirish / tahrirlash */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  <UserRound size={12} /> Ismingiz
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ismingizni kiriting"
                  className="ios-input !p-2.5 text-[13.5px] font-semibold bg-white"
                  required
                />
              </div>

              {/* Telefonni avto-to'ldirish / tahrirlash */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  <Phone size={12} /> Telefon raqamingiz
                </label>
                <div className="flex items-center rounded-2xl bg-white border border-neutral-200/80 pl-3">
                  <span className="pr-1 text-[13.5px] font-bold text-neutral-500">+998</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").replace(/^998/, "").slice(0, 9))
                    }
                    placeholder="90 123 45 67"
                    className="ios-input !border-0 !bg-transparent !p-2.5 !pl-0 text-[13.5px] font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Manzil (ixtiyoriy) */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  <MapPin size={12} /> Manzil (ixtiyoriy)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Tuman, qishloq yoki xonadon"
                  className="ios-input !p-2 text-[12.5px] bg-white"
                />
              </div>
            </div>

            {error && (
              <p className="mt-3 rounded-xl bg-red-50 p-2.5 text-[12.5px] font-semibold text-red-600 border border-red-200">
                {error}
              </p>
            )}

            {/* Tasdiqlash yoki Bekor qilish tugmalari */}
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={handleModalClose}
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
                <span>Tasdiqlash</span>
              </button>
            </div>
          </div>
        ) : (
          /* 1-BOSQICH: EKIN YOKI CHORVANI TANLASH */
          <div className="space-y-4 pt-1">
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

            <div className="pt-2">
              <label className="block text-[13px] font-extrabold uppercase tracking-wider text-neutral-700 mb-3 text-center">
                Qanday chaqiruv? Tanlang:
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectType("crop")}
                  className="group flex flex-col items-center justify-center gap-2 rounded-2xl p-5 border-2 border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 hover:border-emerald-500 active:scale-95 transition shadow-xs cursor-pointer text-center"
                >
                  <span className="text-4xl transition-transform group-hover:scale-110">🌾</span>
                  <span className="text-[16px] font-black text-emerald-900">Ekin</span>
                  <span className="text-[11.5px] font-semibold text-emerald-700">
                    O&apos;simliklar / Bog&apos;
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectType("animal")}
                  className="group flex flex-col items-center justify-center gap-2 rounded-2xl p-5 border-2 border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 hover:border-amber-500 active:scale-95 transition shadow-xs cursor-pointer text-center"
                >
                  <span className="text-4xl transition-transform group-hover:scale-110">🐄</span>
                  <span className="text-[16px] font-black text-amber-900">Chorva</span>
                  <span className="text-[11.5px] font-semibold text-amber-700">
                    Hayvonlar / Veterinariya
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={handleModalClose}
                className="w-full rounded-2xl bg-neutral-100 py-3 text-[13.5px] font-bold text-neutral-600 hover:bg-neutral-200 transition"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
