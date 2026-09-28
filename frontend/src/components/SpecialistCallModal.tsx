"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, Check, Star, Send, CheckCircle2, Clock } from "lucide-react";
import { createSpecialistCall, completeSpecialistCall } from "@/lib/specialist-calls";
import { apiUrl } from "@/lib/api-config";
import { getTelegramUser } from "@/lib/telegram";

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
  const [callId, setCallId] = useState(501);
  const [callProgress, setCallProgress] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("Telegram foydalanuvchisi");
  const [phone, setPhone] = useState("+998 90 123 45 67");
  const [address, setAddress] = useState("Toshkent viloyati, Zangiota tumani");

  // Reyting va sharh (3-bosqich: Yakunlandi bo'lganda)
  const [ratingStars, setRatingStars] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Avtomatik ravishda foydalanuvchi ma'lumotlarini yuklash va chaqiruvni shakllantirish
  useEffect(() => {
    if (!isOpen || !specialist) return;

    // Yangi ID generatsiya qilish (501 dan boshlab)
    const storedLastId = localStorage.getItem("agroz_last_call_id");
    const nextId = storedLastId ? Math.max(501, Number(storedLastId) + 1) : 501;
    setCallId(nextId);
    localStorage.setItem("agroz_last_call_id", String(nextId));
    setCallProgress(1);
    setRatingSubmitted(false);
    setReviewComment("");
    setRatingStars(5);

    // 1. Profil va Telegram ma'lumotlarini olish
    const tgUser = getTelegramUser();
    if (tgUser) {
      const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ");
      if (fullName || tgUser.username) {
        setName(fullName || tgUser.username || "Telegram foydalanuvchisi");
      }
    }

    try {
      const savedName = localStorage.getItem("agroz_customer_name");
      const savedPhone = localStorage.getItem("agroz_customer_phone");
      const savedAddress = localStorage.getItem("agroz_customer_address");
      if (savedName) setName(savedName);
      if (savedPhone) setPhone(savedPhone.startsWith("+") ? savedPhone : `+998${savedPhone}`);
      if (savedAddress) setAddress(savedAddress);
    } catch {}

    fetch(apiUrl("/api/profile"), {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          if (data.user.name) setName(data.user.name);
          if (data.user.phone) {
            setPhone(data.user.phone.startsWith("+") ? data.user.phone : `+${data.user.phone}`);
          }
          if (data.user.region || data.user.district) {
            setAddress([data.user.region, data.user.district].filter(Boolean).join(", "));
          }
        }
      })
      .catch(() => {});

    // 2. Chaqiruvni serverga va lokal bazaga qayd qilish
    const callRecord = {
      id: String(nextId),
      specialistId: specialist.id,
      specialistName: specialist.organization || specialist.name,
      customerName: name,
      customerPhone: phone,
      problem: `${specialist.specialty || "Mutaxassis"} ko'rigi va maslahati`,
      address: address,
    };
    createSpecialistCall(callRecord);

    fetch(apiUrl("/api/specialists/call"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        specialistId: specialist.id,
        customerName: name,
        customerPhone: phone,
        problem: callRecord.problem,
        address: address,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.callId) {
          setCallId(Number(d.callId));
        }
      })
      .catch(() => {});
  }, [isOpen, specialist]);

  // Real-time server polling: mutaxassis botda qabul qilganda yoki ishni bajarganda
  useEffect(() => {
    if (!isOpen || !callId) return;

    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(apiUrl(`/api/specialists/call/${callId}/status`));
        if (!res.ok) return;
        const d = await res.json();
        if (cancelled || !d?.ok || !d?.status) return;

        if (d.status === "qabul_qilindi") {
          setCallProgress((prev) => (prev < 2 ? 2 : prev));
        } else if (d.status === "bajarildi") {
          setCallProgress(3);
        }
      } catch {}
    }, 4000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isOpen, callId]);

  const handleNextStep = () => {
    setCallProgress((prev) => (prev === 1 ? 2 : prev === 2 ? 3 : 1));
  };

  const handleBack = useCallback(() => {
    onClose();
    onSuccess();
  }, [onClose, onSuccess]);

  const handleSubmitRating = async () => {
    if (!specialist || isSubmittingRating) return;
    setIsSubmittingRating(true);
    try {
      await completeSpecialistCall(String(callId), ratingStars, reviewComment);
      setRatingSubmitted(true);
      setTimeout(() => {
        handleBack();
      }, 1500);
    } catch (e) {
      console.error("[SpecialistCallModal] Baholash xatosi:", e);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  if (!isOpen || !specialist) return null;

  const specialistTitle = specialist.specialty || (specialist.role === "pharmacy" ? "Dorixona egasi" : "Agronom");

  return (
    <div className="fixed inset-0 z-[110] flex justify-center bg-neutral-50 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-[500px] min-h-[100dvh] flex flex-col justify-between px-5 pt-7 pb-28">
        <div>
          {/* 1. Orqaga tugmasi (Light UI) */}
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-[17px] font-semibold text-[#039e1e] hover:opacity-85 active:scale-95 transition"
          >
            <ChevronLeft size={22} className="stroke-[2.6] -ml-1" />
            <span>Orqaga</span>
          </button>

          {/* 2. Sarlavha: Chaqiruv #... va Mutaxassis nomi */}
          <div className="mt-4">
            <h1 className="text-[24px] font-bold text-neutral-900 tracking-tight leading-tight">
              Chaqiruv #{callId}
            </h1>
            <p className="text-[15px] font-normal text-neutral-500 mt-1">
              {specialistTitle} {specialist.name}
            </p>
          </div>

          {/* 3. 3-bosqichli status kartochkasi (Yorug' UI) */}
          <div className="mt-5 rounded-[22px] bg-white border border-neutral-200/90 p-5 shadow-xs space-y-4">
            {/* 1-bosqich: So'rov yuborildi */}
            <div className="flex items-center gap-3.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#039e1e] text-white shadow-xs">
                <Check size={16} className="stroke-[3]" />
              </div>
              <span className="text-[16px] font-bold text-neutral-900">
                So&apos;rov yuborildi
              </span>
            </div>

            {/* 2-bosqich: Qabul qilindi */}
            <div className="flex items-center gap-3.5">
              {callProgress >= 2 ? (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#039e1e] text-white shadow-xs">
                  <Check size={16} className="stroke-[3]" />
                </div>
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-neutral-300 bg-neutral-100" />
              )}
              <span
                className={`text-[16px] ${
                  callProgress >= 2 ? "font-bold text-neutral-900" : "font-medium text-neutral-400"
                }`}
              >
                Qabul qilindi
              </span>
            </div>

            {/* 3-bosqich: Yakunlandi */}
            <div className="flex items-center gap-3.5">
              {callProgress >= 3 ? (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#039e1e] text-white shadow-xs">
                  <Check size={16} className="stroke-[3]" />
                </div>
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-neutral-300 bg-neutral-100" />
              )}
              <span
                className={`text-[16px] ${
                  callProgress >= 3 ? "font-bold text-neutral-900" : "font-medium text-neutral-400"
                }`}
              >
                Yakunlandi
              </span>
            </div>
          </div>

          {/* 4. 3-bosqichga yetganda reyting va izoh qoldirish bo'limi */}
          {callProgress === 3 && (
            <div className="mt-5 rounded-[22px] bg-white border border-neutral-200/90 p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="text-center">
                <h3 className="text-[17px] font-bold text-neutral-900">
                  Xizmatni baholang va izoh qoldiring
                </h3>
                <p className="text-[13px] text-neutral-500 mt-1">
                  Mutaxassis xizmatidan qoniqdingizmi? Tajribangiz bilan bo&apos;lishing.
                </p>
              </div>

              {/* Yulduzlar */}
              <div className="flex items-center justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingStars(star)}
                    className="p-1.5 transition-transform hover:scale-115 active:scale-95"
                  >
                    <Star
                      size={32}
                      className={
                        star <= ratingStars
                          ? "fill-[#f59e0b] text-[#f59e0b] drop-shadow-2xs"
                          : "fill-neutral-200 text-neutral-300"
                      }
                    />
                  </button>
                ))}
              </div>

              {/* Izoh qoldirish */}
              <div>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Mutaxassis haqida izohingizni yozing (ixtiyoriy)..."
                  className="w-full rounded-xl border border-neutral-300/80 bg-neutral-50/60 p-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-[#039e1e] focus:bg-white focus:outline-none transition resize-none"
                />
              </div>

              {ratingSubmitted ? (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-center text-emerald-800 text-[14px] font-bold">
                  <CheckCircle2 size={18} className="text-[#039e1e]" />
                  <span>Rahmat! Baho va izohingiz qabul qilindi.</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitRating}
                  disabled={isSubmittingRating}
                  className="w-full rounded-xl bg-[#039e1e] py-3.5 text-center text-[15px] font-bold text-white shadow-xs hover:bg-[#028519] active:scale-[0.99] transition disabled:opacity-50"
                >
                  {isSubmittingRating ? "Yuborilmoqda..." : "Baholash va yakunlash"}
                </button>
              )}
            </div>
          )}

          {/* 5. Mutaxassis botiga kelgan xabar (real demo) */}
          <div className="mt-6">
            <p className="text-[13px] text-neutral-500 font-bold uppercase tracking-wider mb-2">
              Mutaxassis botiga kelgan xabar (demo):
            </p>

            <div className="rounded-2xl bg-[#f0f4f9] border border-blue-100/80 p-4.5 text-[#1e293b] shadow-2xs">
              <h4 className="text-[16px] font-bold text-[#1e3a8a] tracking-tight">
                Yangi chaqiruv #{callId}
              </h4>
              <p className="text-[14px] font-medium text-[#1e293b] mt-1.5">
                <span className="font-semibold text-neutral-600">Mijoz:</span> {name}
              </p>
              <p className="text-[14px] font-medium text-[#1e293b] mt-0.5">
                <span className="font-semibold text-neutral-600">Manzil:</span> {address}
              </p>
            </div>
          </div>
        </div>

        {/* 6. Mutaxassis sifatida: keyingi holat tugmasi (faqat test/demo uchun) */}
        <div className="mt-8 pt-4">
          <button
            type="button"
            onClick={handleNextStep}
            className="w-full rounded-2xl border border-[#039e1e] bg-white py-3.5 text-center text-[15px] font-bold text-[#039e1e] hover:bg-[#039e1e]/10 active:scale-[0.98] transition shadow-2xs"
          >
            Mutaxassis sifatida: keyingi holat
          </button>
        </div>
      </div>
    </div>
  );
}
