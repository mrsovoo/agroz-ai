"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Star,
  MessageSquare,
  BadgeCheck,
  Plus,
  Send,
  UserRound,
  MapPin,
  Sparkles,
  ThumbsUp,
} from "lucide-react";
import {
  getAllMedicineReviews,
  addMedicineReview,
  calculateMedicineRating,
  REVIEWS_EVENT,
  type MedicineReview,
} from "@/lib/medicine-reviews";

const REGIONS = [
  "Toshkent viloyati",
  "Toshkent shahri",
  "Samarqand",
  "Farg'ona",
  "Andijon",
  "Namangan",
  "Buxoro",
  "Qashqadaryo",
  "Surxondaryo",
  "Xorazm",
  "Jizzax",
  "Navoiy",
  "Sirdaryo",
  "Qoraqalpog'iston",
];

const ROLES = ["Fermer", "Bog'bon", "Polizchi dehqon", "Chorvador", "Issiqxonachi", "Mulkdor"];

export default function MedicineReviewsSection({ medicineId, medicineName }: { medicineId: number; medicineName: string }) {
  const [reviews, setReviews] = useState<MedicineReview[]>([]);
  const [ratingStats, setRatingStats] = useState({ avg: 0, count: 0 });
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [region, setRegion] = useState(REGIONS[0]);
  const [role, setRole] = useState(ROLES[0]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const loadData = useCallback(() => {
    setReviews(getAllMedicineReviews(medicineId));
    setRatingStats(calculateMedicineRating(medicineId));
  }, [medicineId]);

  useEffect(() => {
    loadData();
    window.addEventListener(REVIEWS_EVENT, loadData);
    window.addEventListener("storage", loadData);
    return () => {
      window.removeEventListener(REVIEWS_EVENT, loadData);
      window.removeEventListener("storage", loadData);
    };
  }, [loadData]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;

    addMedicineReview({
      medicineId,
      authorName: name.trim(),
      authorRegion: region,
      authorRole: role,
      rating,
      comment: comment.trim(),
      verifiedPurchase: true,
    });

    setSubmitted(true);
    setComment("");
    setTimeout(() => {
      setSubmitted(false);
      setShowForm(false);
    }, 1500);
  }

  return (
    <section className="mt-8 rounded-[24px] bg-white p-5 shadow-sm web:p-7">
      {/* Sarlavha va Statistika */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-black/5 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
              <Star size={16} fill="currentColor" />
            </span>
            <h2 className="text-[19px] font-black tracking-tight text-neutral-900 web:text-[22px]">
              Fermer va dehqonlar fikrlari
            </h2>
          </div>
          <p className="mt-1 text-[13px] text-neutral-500 font-medium">
            Preparatni amalda qo&apos;llagan dehqonlarning xolis baholari va natijalari
          </p>
        </div>

        {/* Reyting ko'rsatkichi */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-[26px] font-black text-neutral-900 leading-none">
                {ratingStats.count > 0 ? ratingStats.avg : "0.0"}
              </span>
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={15}
                    fill={s <= Math.round(ratingStats.avg) ? "currentColor" : "none"}
                    className={s <= Math.round(ratingStats.avg) ? "text-amber-400" : "text-neutral-200"}
                  />
                ))}
              </div>
            </div>
            <p className="text-[12px] font-bold text-neutral-500 mt-0.5">
              {ratingStats.count > 0
                ? `${ratingStats.count} ta baho`
                : "Hali baho yo'q"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 rounded-2xl bg-[var(--brand-green)] px-4 py-2.5 text-[13px] font-bold text-white shadow-xs hover:brightness-105 active:scale-95 transition"
          >
            <Plus size={15} />
            <span>Fikr bildirish</span>
          </button>
        </div>
      </div>

      {/* Fikr qoldirish formasi */}
      {showForm && (
        <div className="mt-5 rounded-2xl bg-neutral-50 p-4 border border-black/5 animate-in fade-in">
          {submitted ? (
            <div className="flex items-center justify-center gap-2 py-4 text-emerald-700 font-bold text-[14px]">
              <ThumbsUp size={18} />
              <span>Rahmat! Fikringiz muvaffaqiyatli saqlandi.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-neutral-800">
                  {medicineName} uchun o&apos;z bahoingizni bering:
                </span>
                {/* Yulduzchalar */}
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      className="p-0.5 transition hover:scale-110 active:scale-95"
                    >
                      <Star
                        size={22}
                        className={n <= rating ? "text-amber-400 fill-amber-400" : "text-neutral-300"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11.5px] font-bold text-neutral-600 uppercase tracking-wider">
                    Ismingiz
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masalan: Ilhom aka"
                    className="ios-input mt-1 !p-2.5 text-[13px]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11.5px] font-bold text-neutral-600 uppercase tracking-wider">
                    Hududingiz
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="ios-input mt-1 !p-2.5 text-[13px] appearance-none"
                  >
                    {REGIONS.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11.5px] font-bold text-neutral-600 uppercase tracking-wider">
                    Mashg&apos;ulotingiz
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="ios-input mt-1 !p-2.5 text-[13px] appearance-none"
                  >
                    {ROLES.map((ro) => (
                      <option key={ro}>{ro}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11.5px] font-bold text-neutral-600 uppercase tracking-wider">
                  Amaliy tajribangiz va fikringiz
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Preparat qanday natija berdi? Qaysi ekin yoki chorvaga qancha me'yorda sepdingiz? Boshqa dehqonlarga tavsiyangiz..."
                  className="ios-input mt-1 !p-3 h-20 resize-none text-[13px]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl bg-neutral-200 px-4 py-2 text-[12.5px] font-bold text-neutral-700 hover:bg-neutral-300"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-[var(--brand-green)] px-5 py-2 text-[12.5px] font-bold text-white shadow-xs hover:brightness-105 active:scale-95 transition"
                >
                  <Send size={14} />
                  <span>Fikrni chop etish</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Sharhlar ro'yxati */}
      <div className="mt-5 space-y-3.5">
        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/70 p-5 text-center">
            <MessageSquare size={22} className="mx-auto text-neutral-300" />
            <p className="mt-2 text-[13px] font-bold text-neutral-600">Hali fikr bildirilmagan</p>
            <p className="mt-1 text-[12px] text-neutral-500">
              Birinchi real bahoni xariddan keyin foydalanuvchi qoldiradi.
            </p>
          </div>
        ) : reviews.map((rev) => (
          <div
            key={rev.id}
            className="rounded-2xl border border-black/5 bg-neutral-50/70 p-4 transition hover:bg-neutral-50"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-extrabold text-emerald-800 text-[14px]">
                  {rev.authorName.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[14px] font-bold text-neutral-900">{rev.authorName}</p>
                    {rev.verifiedPurchase && (
                      <span
                        className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700 border border-emerald-200"
                        title="Haqiqiy xarid qilgan dehqon"
                      >
                        <BadgeCheck size={12} className="text-emerald-600" />
                        <span>Fermer tekshiruvi</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11.5px] text-neutral-500 font-medium">
                    {rev.authorRole} · {rev.authorRegion} · <span className="opacity-80">{rev.createdAt}</span>
                  </p>
                </div>
              </div>

              {/* Yulduzchalar */}
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={13}
                    fill={s <= rev.rating ? "currentColor" : "none"}
                    className={s <= rev.rating ? "text-amber-400" : "text-neutral-200"}
                  />
                ))}
              </div>
            </div>

            <p className="mt-2.5 text-[13.5px] leading-relaxed text-neutral-800">
              {rev.comment}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
