"use client";

import { useState, useEffect } from "react";
import { X, UserRound, Phone, MapPin, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
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
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [problem, setProblem] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [callState, setCallState] = useState<"idle" | "sent" | "accepted" | "rejected">("idle");
  const [createdCallId, setCreatedCallId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !specialist) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setError("Iltimos, ismingizni kiriting");
      return;
    }
    const cleanDigits = phone.replace(/\D/g, "").replace(/^998/, "");
    if (cleanDigits.length !== 9) {
      setError("Telefon raqamingizni to'liq kiriting (9 xonali, masalan: 90 123 45 67)");
      return;
    }
    if (!problem.trim()) {
      setError("Muammo yoki kerakli xizmat haqida qisqa yozing");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      if (!specialist) return;

      // Geolocation orqali koordinatani olishga harakat qilamiz
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
      } catch {
        // Lokatsiya berilmasa ham davom etadi
      }

      const res = await fetch(apiUrl("/api/specialists/call"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialistId: specialist.id,
          customerName: name.trim(),
          customerPhone: `+998${cleanDigits}`,
          problem: problem.trim(),
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
      setCreatedCallId(callId);

      // Lokal tarix uchun ham saqlab qo'yamiz
      createSpecialistCall({
        id: String(callId),
        specialistId: specialist.id,
        specialistName: specialist.organization || specialist.name,
        customerName: name.trim(),
        customerPhone: `+998${cleanDigits}`,
        problem: problem.trim(),
        address: address.trim() || undefined,
      });

      setCallState("sent");
    } catch (err: any) {
      setError(err.message || "Chaqiruv yuborishda xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  }

  const handleModalClose = () => {
    setCallState("idle");
    setCreatedCallId(null);
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

        {callState === "sent" ? (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
              <CheckCircle2 size={38} />
            </div>
            <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 mb-2">
              ✅ So&apos;rov yetkazildi
            </span>
            <h3 className="text-xl font-extrabold text-neutral-900">
              Chaqiruv muvaffaqiyatli yuborildi!
            </h3>
            <p className="mt-2 text-[14px] text-neutral-600 max-w-xs leading-relaxed">
              <b>{specialist.organization || specialist.name}</b> ga Telegram orqali xabarnoma yuborildi. Mutaxassis chaqiruvni qabul qilishi bilan botingizga darhol xabar keladi.
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
        ) : callState === "accepted" ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4 animate-bounce">
              <CheckCircle2 size={38} />
            </div>
            <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 mb-2">
              ✅ Qabul qilindi
            </span>
            <h3 className="text-xl font-extrabold text-neutral-900">
              Mutaxassis chaqiruvni qabul qildi!
            </h3>
            <p className="mt-2 text-[14px] text-neutral-600 max-w-xs leading-relaxed">
              <b>{specialist.organization || specialist.name}</b> sizning chaqiruvingizni qabul qildi va tez orada bog&apos;lanadi.
            </p>
            <button
              onClick={handleModalClose}
              className="mt-6 rounded-2xl bg-[var(--brand-green)] px-8 py-3 text-xs font-bold text-white shadow-sm hover:brightness-105 active:scale-95 transition"
            >
              Ajoyib, tushunarli
            </button>
          </div>
        ) : callState === "rejected" ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
              <AlertCircle size={36} />
            </div>
            <h3 className="text-lg font-extrabold text-neutral-900">
              Mutaxassis ayni vaqtda qabul qila olmadi
            </h3>
            <p className="mt-2 text-[13px] text-neutral-600 max-w-xs">
              Mutaxassis bandligi tufayli chaqiruvni o&apos;tkazib yubordi. Iltimos, ro&apos;yxatdagi boshqa mutaxassisni tanlang.
            </p>
            <button
              onClick={handleModalClose}
              className="mt-6 rounded-2xl bg-neutral-900 px-8 py-2.5 text-xs font-bold text-white transition"
            >
              Boshqa mutaxassisni tanlash
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="space-y-3 pt-2">
              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-neutral-600">
                  <UserRound size={13} /> Ismingiz
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ism va familiyangiz"
                  className="ios-input mt-1 !p-3"
                  required
                />
              </div>

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
                    className="ios-input !bg-transparent !p-3 !pl-0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-neutral-600">
                  <AlertCircle size={13} /> Ekin yoki chorva muammosi
                </label>
                <textarea
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="Masalan: Pomidorda barg sarg'ayishi kuzatilyapti, joyiga kelib ko'rik kerak..."
                  className="ios-input mt-1 !p-3 h-20 resize-none text-[13px]"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-neutral-600">
                  <MapPin size={13} /> Manzilingiz / Mo&apos;ljal (ixtiyoriy)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Tuman, qishloq yoki xonadon"
                  className="ios-input mt-1 !p-3"
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
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-green)] py-3 text-[14px] font-bold text-white shadow-sm hover:brightness-105 active:scale-95 transition"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                <span>Chaqiruv yuborish</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

