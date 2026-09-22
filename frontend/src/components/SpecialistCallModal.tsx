"use client";

import { useState } from "react";
import { X, UserRound, Phone, MapPin, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { createSpecialistCall } from "@/lib/specialist-calls";

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
  const [done, setDone] = useState(false);
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
      createSpecialistCall({
        specialistId: specialist.id,
        specialistName: specialist.organization || specialist.name,
        customerName: name.trim(),
        customerPhone: `+998${cleanDigits}`,
        problem: problem.trim(),
        address: address.trim() || undefined,
      });

      setDone(true);
      setTimeout(() => {
        setDone(false);
        onSuccess();
        onClose();
      }, 1800);
    } catch {
      setError("Chaqiruv yuborishda xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[480px] rounded-[24px] bg-white p-6 shadow-2xl animate-in zoom-in-95"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition"
        >
          <X size={18} />
        </button>

        {done ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3 animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-xl font-extrabold text-neutral-900">
              Chaqiruv yuborildi!
            </h3>
            <p className="mt-2 text-[14px] text-neutral-600 max-w-xs">
              <b>{specialist.organization || specialist.name}</b> siz bilan tez orada bog&apos;lanadi.
              Ish yakunlangach, baho va fikr bildirishingiz mumkin.
            </p>
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

