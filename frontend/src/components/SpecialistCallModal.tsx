"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  Check,
  Star,
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  Loader2,
  Navigation,
  User,
  ShieldCheck,
} from "lucide-react";
import { createSpecialistCall, completeSpecialistCall } from "@/lib/specialist-calls";
import { apiUrl, apiFetch } from "@/lib/api-config";
import { getTelegramUser } from "@/lib/telegram";

export default function SpecialistCallModal({
  specialist,
  isOpen,
  onClose,
  onSuccess,
}: {
  specialist: {
    id: number;
    callId?: number | string | null;
    status?: string | null;
    name: string;
    organization?: string | null;
    specialty?: string | null;
    phone: string;
    role?: string | null;
    helpsWith?: string | null;
    customerName?: string | null;
    customerAddress?: string | null;
    problem?: string | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  // Rejim: "form" (yangi ariza to'ldirish) yoki "tracking" (chaqiruvni kuzatish)
  const [mode, setMode] = useState<"form" | "tracking">("form");

  // Forma maydonlari
  const [name, setName] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [address, setAddress] = useState("");
  const [problem, setProblem] = useState("");
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Kuzatuv maydonlari
  const [callId, setCallId] = useState<number | string | null>(null);
  const [callProgress, setCallProgress] = useState<1 | 2 | 3>(1);
  const [isCancelled, setIsCancelled] = useState(false);

  // Reyting va sharh (3-bosqich: Yakunlandi bo'lganda)
  const [ratingStars, setRatingStars] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Mutaxassis sohasi (veterinar yoki agronom)
  const isVeterinar =
    specialist?.role === "veterinarian" ||
    /veterinar/i.test(specialist?.specialty || "") ||
    specialist?.helpsWith === "animal";

  // Modal ochilganda ma'lumotlarni tayyorlash
  useEffect(() => {
    if (!isOpen || !specialist) return;

    setFormError(null);
    setIsSubmitting(false);

    // Agar mavjud chaqiruv tarixidan ochilgan bo'lsa (callId allaqachon mavjud)
    if (specialist.callId) {
      setMode("tracking");
      setCallId(specialist.callId);
      const st = specialist.status;
      if (st === "completed" || st === "bajarildi") {
        setCallProgress(3);
        setIsCancelled(false);
      } else if (st === "tasdiqlandi" || st === "qabul_qilindi") {
        setCallProgress(2);
        setIsCancelled(false);
      } else if (st === "bekor" || st === "cancelled") {
        setIsCancelled(true);
      } else {
        setCallProgress(1);
        setIsCancelled(false);
      }
      if (specialist.customerName) setName(specialist.customerName);
      if (specialist.customerAddress) setAddress(specialist.customerAddress);
      if (specialist.problem) setProblem(specialist.problem);
      setRatingSubmitted(false);
      setReviewComment("");
      setRatingStars(5);
      return;
    }

    // Yangi chaqiruv shakli:
    setMode("form");
    setCallProgress(1);
    setIsCancelled(false);
    setRatingSubmitted(false);
    setReviewComment("");
    setRatingStars(5);
    setProblem("");

    // 1. Foydalanuvchining avval saqlangan ma'lumotlarini yuklash
    let initialName = "";
    let initialPhone = "";
    let initialAddress = "";

    try {
      initialName = localStorage.getItem("agroz_customer_name") || "";
      initialPhone = localStorage.getItem("agroz_customer_phone") || "";
      initialAddress = localStorage.getItem("agroz_customer_address") || "";
    } catch {}

    // Telegram foydalanuvchisi ma'lumotlari
    const tgUser = getTelegramUser();
    if (tgUser && !initialName) {
      const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ");
      if (fullName) initialName = fullName;
    }

    if (initialName) setName(initialName);
    if (initialPhone) {
      const clean = initialPhone.replace(/\D/g, "").replace(/^998/, "").slice(-9);
      setPhoneDigits(clean);
    }
    if (initialAddress) setAddress(initialAddress);

    // 2. Serverdagi profil ma'lumotlarini olish (avto-to'ldirish)
    apiFetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          if (data.user.name && !initialName) setName(data.user.name);
          if (data.user.phone && !initialPhone) {
            const clean = data.user.phone.replace(/\D/g, "").replace(/^998/, "").slice(-9);
            setPhoneDigits(clean);
          }
          if ((data.user.region || data.user.district) && !initialAddress) {
            setAddress([data.user.region, data.user.district].filter(Boolean).join(", "));
          }
        }
      })
      .catch(() => {});
  }, [isOpen, specialist]);

  // Real-time server polling: mutaxassis botda qabul qilganda yoki ishni bajarganda
  useEffect(() => {
    if (!isOpen || !callId || mode !== "tracking") return;

    let cancelled = false;
    const phoneFull = `+998${phoneDigits}`;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          apiUrl(`/api/specialists/call/${callId}/status?phone=${encodeURIComponent(phoneFull)}`)
        );
        if (!res.ok) return;
        const d = await res.json();
        if (cancelled || !d?.ok || !d?.status) return;

        if (d.status === "qabul_qilindi") {
          setIsCancelled(false);
          setCallProgress((prev) => (prev < 2 ? 2 : prev));
        } else if (d.status === "bajarildi") {
          setIsCancelled(false);
          setCallProgress(3);
        } else if (d.status === "bekor") {
          setIsCancelled(true);
        }
      } catch {}
    }, 4000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isOpen, callId, mode, phoneDigits]);

  // Geolokatsiyani aniqlash (GPS)
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setFormError("Brauzeringiz geolokatsiyani qo'llab-quvvatlamaydi.");
      return;
    }
    setIsLocating(true);
    setFormError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLat(lat);
        setUserLng(lng);
        if (!address.trim()) {
          setAddress(`📍 Joylashuv aniqlandi (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn("[geolocation error]:", err);
        setFormError("Joylashuvni aniqlashga ruxsat berilmadi. Manzilni qo'lda yozib qoldiring.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Formani yuborish
  const handleSubmitCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!specialist || isSubmitting) return;

    setFormError(null);

    const cleanName = name.trim();
    if (cleanName.length < 2) {
      setFormError("Iltimos, ism va familiyangizni to'liq kiriting.");
      return;
    }

    const cleanDigits = phoneDigits.replace(/\D/g, "");
    if (cleanDigits.length !== 9) {
      setFormError("Iltimos, 9 xonali telefon raqamingizni to'liq kiriting (masalan: 90 123 45 67).");
      return;
    }

    const cleanAddress = address.trim();
    if (cleanAddress.length < 3) {
      setFormError("Iltimos, yetib borish manzilini (viloyat, tuman, ko'cha) kiriting.");
      return;
    }

    const cleanProblem = problem.trim();
    if (cleanProblem.length < 5) {
      setFormError("Iltimos, muammo yoki chaqiruv sababini batafsilroq yozing (kamida 5 ta belgi).");
      return;
    }

    setIsSubmitting(true);
    const phoneFull = `+998${cleanDigits}`;

    // Ma'lumotlarni keyingi safar uchun eslab qolish
    try {
      localStorage.setItem("agroz_customer_name", cleanName);
      localStorage.setItem("agroz_customer_phone", phoneFull);
      localStorage.setItem("agroz_customer_address", cleanAddress);
    } catch {}

    try {
      const res = await fetch(apiUrl("/api/specialists/call"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialistId: specialist.id,
          customerName: cleanName,
          customerPhone: phoneFull,
          problem: cleanProblem,
          address: cleanAddress,
          userLat: userLat || undefined,
          userLng: userLng || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Chaqiruv yuborilmadi. Iltimos, qayta urinib ko'ring.");
      }

      const newId = data.callId || Date.now();
      setCallId(newId);

      // Lokal omborga saqlash
      createSpecialistCall({
        id: String(newId),
        specialistId: specialist.id,
        specialistName: specialist.organization || specialist.name,
        customerName: cleanName,
        customerPhone: phoneFull,
        problem: cleanProblem,
        address: cleanAddress,
      });

      // Tracking rejimiga o'tish
      setMode("tracking");
      setCallProgress(1);
    } catch (err: any) {
      setFormError(err.message || "Tarmoq xatosi yuz berdi. Iltimos, internetni tekshiring.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = useCallback(() => {
    onClose();
    onSuccess();
  }, [onClose, onSuccess]);

  const handleSubmitRating = async () => {
    if (!specialist || !callId || isSubmittingRating) return;
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

  const specialistTitle =
    specialist.specialty || (isVeterinar ? "Veterinar" : "Agronom");

  return (
    <div className="fixed inset-0 z-[110] flex justify-center bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-[520px] h-[100dvh] flex flex-col justify-between bg-neutral-50 overflow-hidden shadow-2xl">
        {/* 1. Header (Sticky Top) */}
        <div className="shrink-0 bg-white/95 backdrop-blur-md px-5 py-3.5 border-b border-neutral-200/80 flex items-center justify-between z-10">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-[15.5px] font-semibold text-[#039e1e] hover:opacity-85 active:scale-95 transition"
          >
            <ChevronLeft size={22} className="stroke-[2.6] -ml-1" />
            <span>Orqaga</span>
          </button>
          <span className="text-[12px] font-mono font-medium text-neutral-400">
            {mode === "form" ? "Chaqiruv arizasi" : `Chaqiruv #${callId}`}
          </span>
        </div>

        {/* 2. Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Mutaxassis qisqa kartochkasi */}
          <div className="rounded-2xl bg-white p-3.5 border border-neutral-200/80 shadow-xs flex items-center gap-3.5">
            <div className="h-12 w-12 shrink-0 rounded-2xl bg-[#ffad2a] flex items-center justify-center text-white shadow-2xs font-bold text-lg">
              {isVeterinar ? "🐾" : "🌱"}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-neutral-900 text-[16px] truncate leading-tight">
                {specialist.organization || specialist.name}
              </h3>
              <p className="text-[13px] text-neutral-500 mt-0.5 truncate font-medium">
                {specialistTitle}
              </p>
            </div>
            <a
              href={`tel:${specialist.phone.replace(/\s/g, "")}`}
              className="h-10 w-10 shrink-0 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700 hover:bg-neutral-200 active:scale-95 transition"
              title="Qo'ng'iroq qilish"
            >
              <Phone size={18} />
            </a>
          </div>

          {/* 3. A) FORMA REJIMI: Ma'lumotlarni kiritish */}
          {mode === "form" && (
            <form id="specialist-call-form" onSubmit={handleSubmitCall} className="mt-5 space-y-4">
              <div>
                <h1 className="text-[21px] font-bold text-neutral-900 tracking-tight leading-tight">
                  Mutaxassisni chaqirish
                </h1>
                <p className="text-[13px] text-neutral-500 mt-1">
                  Mutaxassis ko&apos;rikka tez yetib borishi uchun ma&apos;lumotlarni tasdiqlang:
                </p>
              </div>

              {formError && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 p-3.5 border border-red-200 text-red-800 text-[13px] font-medium animate-in fade-in">
                  <AlertCircle size={18} className="shrink-0 text-red-600 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Mijoz profili: Ism va telefon (ro'yxatdan o'tgan / botdagi profil) */}
              <div className="rounded-2xl bg-white p-4 border border-neutral-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User size={14} className="text-emerald-600" />
                    <span>Mening profilim</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    Tasdiqlangan
                  </span>
                </div>

                <div className="flex items-center gap-3.5 pt-0.5">
                  <div className="h-11 w-11 shrink-0 rounded-full bg-emerald-600 text-white font-bold text-[17px] flex items-center justify-center shadow-xs">
                    {(name.trim() ? name.trim().charAt(0) : "M").toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15.5px] font-bold text-neutral-900 truncate">
                      {name.trim() || "Ism ko'rsatilmagan"}
                    </div>
                    <div className="text-[13.5px] font-mono font-medium text-neutral-500 mt-0.5 flex items-center gap-1.5">
                      <Phone size={13} className="text-neutral-400" />
                      <span>{phoneDigits ? `+998 ${phoneDigits}` : "Telefon kiritilmagan"}</span>
                    </div>
                  </div>
                </div>

                {/* Profil to'liq bo'lmaganda yoki o'zgartirish kerak bo'lganda qo'shimcha kiritish */}
                {(!name.trim() || phoneDigits.length !== 9) && (
                  <div className="pt-2 border-t border-neutral-100 space-y-2.5">
                    <div>
                      <label className="text-[12px] font-medium text-neutral-600 block mb-1">
                        Ismingiz:
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ism va familiyangiz..."
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-[14px] text-neutral-900 focus:border-[#039e1e] focus:bg-white focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-neutral-600 block mb-1">
                        Telefon raqamingiz:
                      </label>
                      <div className="flex items-center rounded-xl border border-neutral-200 bg-neutral-50 overflow-hidden focus-within:border-[#039e1e] focus-within:bg-white transition">
                        <span className="px-3 py-2 text-[13.5px] font-bold font-mono text-neutral-600 bg-neutral-100 border-r border-neutral-200">
                          +998
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength={9}
                          value={phoneDigits}
                          onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, "").slice(0, 9))}
                          placeholder="90 123 45 67"
                          className="w-full px-3 py-2 text-[14px] font-mono text-neutral-900 bg-transparent focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Manzil input & Joylashuv aniqlash */}
              <div className="rounded-2xl bg-white p-4 border border-neutral-200/80 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[12.5px] font-bold text-neutral-700 flex items-center gap-1.5">
                    <MapPin size={15} className="text-emerald-600" />
                    <span>Yetib borish manzili *</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#039e1e] hover:underline disabled:opacity-50"
                  >
                    {isLocating ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Navigation size={12} />
                    )}
                    <span>Joylashuvimni aniqlash</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Viloyat, tuman, mahalla, ko'cha yoki mo'ljal..."
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-[14.5px] text-neutral-900 placeholder:text-neutral-400 focus:border-[#039e1e] focus:bg-white focus:outline-none transition"
                />
              </div>

              {/* 3. Muammo / Chaqirish sababi (Faqat yozish uchun keng textarea) */}
              <div className="rounded-2xl bg-white p-4 border border-neutral-200/80 shadow-xs space-y-2">
                <label className="text-[12.5px] font-bold text-neutral-700 flex items-center gap-1.5">
                  <FileText size={15} className="text-emerald-600" />
                  <span>Chaqirish sababi / Muammo haqida yozing *</span>
                </label>

                <textarea
                  required
                  rows={4}
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder={
                    isVeterinar
                      ? "Chaqirish sababini yozing (masalan: molning tana harorati yuqori, 2 kundan beri ovqat yemayapti, ko'rik va ukol kerak)..."
                      : "Chaqirish sababini yozing (masalan: issiqxonadagi pomidor barglarida dog'lar paydo bo'ldi, o'g'it va dori sepish bo'yicha mutaxassis ko'rigi zarur)..."
                  }
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 p-3.5 text-[14.5px] text-neutral-900 placeholder:text-neutral-400 focus:border-[#039e1e] focus:bg-white focus:outline-none transition resize-none leading-relaxed"
                />
                <p className="text-[11.5px] text-neutral-400">
                  Muammoni qanchalik aniq yozsangiz, mutaxassis shunchalik tayyorgarlik bilan yetib keladi.
                </p>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11.5px] text-neutral-400 font-medium pt-1">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Ma&apos;lumotlaringiz shifrlangan va mutaxassisga to&apos;g&apos;ridan-to&apos;g&apos;ri yetkaziladi</span>
              </div>
            </form>
          )}

          {/* 3. B) KUZATUV REJIMI (Tracking): Chaqiruv statusi */}
          {mode === "tracking" && (
            <div className="mt-5 space-y-4">
              <div>
                <h1 className="text-[24px] font-bold text-neutral-900 tracking-tight leading-tight">
                  Chaqiruv #{callId}
                </h1>
                <p className="text-[14px] text-neutral-500 mt-1">
                  Mutaxassis sizning arizangizni ko&apos;rib chiqmoqda.
                </p>
              </div>

              {/* Bekor qilingan holati */}
              {isCancelled && (
                <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-red-900">
                  <div className="flex items-center gap-2 font-bold text-[15px]">
                    <AlertCircle size={20} className="text-red-600" />
                    <span>Chaqiruv bekor qilindi</span>
                  </div>
                  <p className="text-[13px] text-red-700 mt-1">
                    Ushbu chaqiruv mutaxassis yoki tizim tomonidan bekor qilindi. Boshqa mutaxassisga murojaat qilishingiz mumkin.
                  </p>
                </div>
              )}

              {/* 3-bosqichli status kartochkasi */}
              {!isCancelled && (
                <div className="rounded-2xl bg-white border border-neutral-200/90 p-5 shadow-xs space-y-4">
                  {/* 1-bosqich: So'rov yuborildi */}
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#039e1e] text-white shadow-xs">
                      <Check size={16} className="stroke-[3]" />
                    </div>
                    <div>
                      <span className="text-[15px] font-bold text-neutral-900 block leading-tight">
                        So&apos;rov yuborildi
                      </span>
                      <span className="text-[12px] text-neutral-500">
                        Mutaxassis botiga bildirishnoma yetkazildi
                      </span>
                    </div>
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
                    <div>
                      <span
                        className={`text-[15px] block leading-tight ${
                          callProgress >= 2 ? "font-bold text-neutral-900" : "font-medium text-neutral-400"
                        }`}
                      >
                        Qabul qilindi
                      </span>
                      <span className="text-[12px] text-neutral-500">
                        {callProgress >= 2
                          ? "Mutaxassis chaqiruvni tasdiqladi va yo'lga chiqdi"
                          : "Mutaxassis tasdiqlashi kutilmoqda"}
                      </span>
                    </div>
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
                    <div>
                      <span
                        className={`text-[15px] block leading-tight ${
                          callProgress >= 3 ? "font-bold text-neutral-900" : "font-medium text-neutral-400"
                        }`}
                      >
                        Yakunlandi
                      </span>
                      <span className="text-[12px] text-neutral-500">
                        {callProgress >= 3 ? "Xizmat to'liq ko'rsatildi" : "Xizmat ko'rsatilgach yakunlanadi"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Yuborilgan ma'lumotlar xulosasi */}
              <div className="rounded-2xl bg-white border border-neutral-200/90 p-4.5 shadow-xs space-y-2.5 text-[13.5px]">
                <h4 className="text-[12px] font-bold text-neutral-400 uppercase tracking-wider">
                  Chaqiruv tafsilotlari
                </h4>
                <div className="flex items-center justify-between text-neutral-800">
                  <span className="text-neutral-500">Mijoz:</span>
                  <span className="font-bold">{name || "Ko'rsatilmagan"}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-800">
                  <span className="text-neutral-500">Telefon:</span>
                  <span className="font-mono font-bold">+998 {phoneDigits}</span>
                </div>
                <div className="flex items-start justify-between text-neutral-800 gap-3">
                  <span className="text-neutral-500 shrink-0">Manzil:</span>
                  <span className="font-medium text-right break-words">{address}</span>
                </div>
                {problem && (
                  <div className="pt-2 border-t border-neutral-100">
                    <span className="text-[12px] text-neutral-500 block">Muammo tavsifi:</span>
                    <p className="mt-1 font-medium text-neutral-800 italic bg-neutral-50 rounded-xl p-2.5">
                      &ldquo;{problem}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Mutaxassis bilan tezkor bog'lanish */}
              <a
                href={`tel:${specialist.phone.replace(/\s/g, "")}`}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-3.5 text-center text-[15px] font-bold text-white shadow-xs hover:bg-neutral-800 active:scale-95 transition"
              >
                <Phone size={18} />
                <span>Mutaxassisga qo&apos;ng&apos;iroq qilish</span>
              </a>

              {/* 4. 3-bosqichga yetganda reyting va izoh qoldirish bo'limi */}
              {callProgress === 3 && (
                <div className="rounded-2xl bg-white border border-neutral-200/90 p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
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
            </div>
          )}
        </div>

        {/* 3. Pinned Bottom Bar: Har doim pastki navigatsiya paneli ustida mahkam turadi */}
        <div className="shrink-0 bg-white/95 backdrop-blur-md px-5 pt-3.5 pb-6 border-t border-neutral-200/90 shadow-lg z-20">
          {mode === "form" ? (
            <button
              type="submit"
              form="specialist-call-form"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-[#039e1e] py-4 text-center text-[16px] font-bold text-white shadow-md hover:bg-[#028519] active:scale-[0.99] transition disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Yuborilmoqda...</span>
                </>
              ) : (
                <>
                  <span>Chaqiruvni tasdiqlash</span>
                  <span className="text-lg">➔</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleBack}
              className="w-full rounded-2xl bg-neutral-900 py-3.5 text-center text-[15px] font-bold text-white shadow-md hover:bg-neutral-800 active:scale-[0.99] transition"
            >
              Oynani yopish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
