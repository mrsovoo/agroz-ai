"use client";

import { useState } from "react";
import { X, Star, MessageSquare, Loader2, CheckCircle2 } from "lucide-react";
import { completeSpecialistCall, type SpecialistCall } from "@/lib/specialist-calls";

const STAR_LABELS: Record<number, string> = {
  1: "Juda qoniqarsiz",
  2: "Qoniqarsiz",
  3: "O'rtacha",
  4: "Yaxshi xizmat",
  5: "A'lo darajada! Tavsiya qilaman",
};

export default function SpecialistRatingModal({
  call,
  isOpen,
  onClose,
  onSuccess,
}: {
  call: SpecialistCall | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (avg?: number, count?: number) => void;
}) {
  const [stars, setStars] = useState(5);
  const [hoverStars, setHoverStars] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !call) return null;

  const currentStars = hoverStars ?? stars;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!call) return;

    setBusy(true);
    setError(null);

    try {
      const res = await completeSpecialistCall(call.id, stars, feedback);
      if (!res.ok) {
        throw new Error("Baholashni saqlab bo'lmadi");
      }

      setDone(true);
      setTimeout(() => {
        setDone(false);
        onSuccess(res.avg, res.count);
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || "Xatolik yuz berdi");
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
        className="relative w-full max-w-[460px] rounded-[24px] bg-white p-6 shadow-2xl animate-in zoom-in-95"
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
              Rahmat! Fikringiz qabul qilindi
            </h3>
            <p className="mt-2 text-[14px] text-neutral-600 max-w-xs">
              Sizning xolis bahoingiz va fikringiz mutaxassis reytingini shakllantirishda va boshqa
              fermerlarga yordam beradi.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center">
              <span className="rounded-full bg-amber-50 px-3 py-1 text-[11.5px] font-bold text-amber-700 border border-amber-200">
                Mutaxassis xizmatini baholash
              </span>
              <h2 className="mt-2 text-[19px] font-black text-neutral-900 leading-snug">
                {call.specialistName}
              </h2>
              <p className="text-[12.5px] text-neutral-500 mt-0.5">
                Mutaxassis bajargan ish natijasini baholang va fikringizni bildiring
              </p>
            </div>

            {/* Yulduzchalar */}
            <div className="flex flex-col items-center py-2">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setStars(n)}
                    onMouseEnter={() => setHoverStars(n)}
                    onMouseLeave={() => setHoverStars(null)}
                    className="p-1 text-neutral-300 transition hover:scale-115 active:scale-95"
                    aria-label={`${n} yulduz`}
                  >
                    <Star
                      size={34}
                      className={
                        n <= currentStars ? "text-amber-400 fill-amber-400" : "text-neutral-200"
                      }
                    />
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[13.5px] font-bold text-amber-600 min-h-[20px]">
                {STAR_LABELS[currentStars]}
              </p>
            </div>

            {/* Fikr va Sharh (Textarea) */}
            <div>
              <label className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-neutral-600">
                <MessageSquare size={13} /> Fikr va sharhingiz (ixtiyoriy)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Mutaxassis qanday xizmat ko'rsatdi? Masalan: O'z vaqtida keldi, ekin kasalligini to'g'ri aniqladi va maslahat berdi..."
                className="ios-input mt-1.5 !p-3 h-24 resize-none text-[13px]"
              />
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
                Keyinroq
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-green)] py-3 text-[14px] font-bold text-white shadow-sm hover:brightness-105 active:scale-95 transition"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                <span>Bahoni saqlash</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

