"use client";

import React from "react";
import {
  MapPin,
  Star,
  Award,
  GraduationCap,
  Clock,
  Phone,
  ShieldCheck,
  CheckCircle2,
  User,
  Car,
  ArrowLeft,
  Share2,
} from "lucide-react";

export type Specialist = {
  id: number;
  name: string;
  phone: string;
  role: string;
  specialty: string | null;
  education?: string | null;
  bio?: string | null;
  helpsWith?: string;
  experienceYears?: number | null;
  organization?: string | null;
  address: string;
  lat: number;
  lng: number;
  workHours?: string | null;
  distanceKm?: number | null;
  locked?: boolean;
  ratingAvg?: number | null;
  ratingCount?: number;
  isBusy?: boolean;
};

/**
 * Mutaxassis avatari (Ism bosh harfi, yo'nalishiga qarab gradient va jonli status belgisi)
 */
export function SpecialistAvatar({
  name,
  isVeterinar,
  isBusy,
  size = "md",
}: {
  name: string;
  isVeterinar: boolean;
  isBusy?: boolean;
  size?: "md" | "lg";
}) {
  const initial = (name?.trim()?.charAt(0) || "M").toUpperCase();
  const dimClasses = size === "lg" ? "h-20 w-20 text-3xl rounded-[26px]" : "h-14 w-14 text-xl rounded-2xl";
  const dotClasses = size === "lg" ? "bottom-0 right-0 h-4 w-4 border-2" : "bottom-0 right-0 h-3.5 w-3.5 border-2";

  return (
    <div className="relative shrink-0">
      <div
        className={`flex ${dimClasses} items-center justify-center font-black text-white shadow-xs select-none transition-transform group-hover:scale-105 ${
          isVeterinar
            ? "bg-gradient-to-br from-[#0284c7] via-[#0369a1] to-[#075985]"
            : "bg-gradient-to-br from-[#039e1e] via-[#028518] to-[#016812]"
        }`}
      >
        <span>{initial}</span>
      </div>
      <span
        title={isBusy ? "Hozir band (Chaqiruvda)" : "Qabulga tayyor (Bo'sh)"}
        className={`absolute rounded-full border-white ${dotClasses} ${
          isBusy ? "bg-red-500 ring-2 ring-red-200" : "bg-emerald-500 ring-2 ring-emerald-200"
        }`}
      />
    </div>
  );
}

/**
 * Yagona standart Mutaxassis kartochkasi:
 * Asosiy sahifa (Home) va Mutaxassislar bo'limida bir xil dizayn, faqat haqiqiy ma'lumotlar bilan ishlaydi.
 */
export function SpecialistCard({
  specialist,
  onViewProfile,
  onCall,
}: {
  specialist: Specialist;
  onViewProfile?: (s: Specialist) => void;
  onCall?: (s: Specialist) => void;
}) {
  const isVet =
    specialist.helpsWith === "animal" ||
    Boolean(specialist.specialty && /veterinar|chorva|parranda|hayvon/i.test(specialist.specialty)) ||
    Boolean(specialist.bio && /veterinar|chorva|parranda|hayvon/i.test(specialist.bio));

  const specialtyText =
    specialist.specialty || (isVet ? "Veterinar vrach" : "Agronom maslahatchi");

  const ratingText =
    specialist.ratingAvg && specialist.ratingAvg > 0 ? specialist.ratingAvg.toFixed(1) : null;

  // Haqiqiy ma'lumot: agar tajriba kiritilmagan bo'lsa, soxta "5+ yil" qo'yilmaydi!
  const expText =
    specialist.experienceYears != null && specialist.experienceYears > 0
      ? `${specialist.experienceYears} yil staj`
      : null;

  return (
    <div className="rounded-[24px] bg-white border border-neutral-100 p-4 shadow-sm hover:shadow-md transition-all group">
      {/* Yuqori qism: Avatar, Mutaxassislik, Ism va Badge'lar */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <SpecialistAvatar
            name={specialist.name}
            isVeterinar={isVet}
            isBusy={specialist.isBusy}
          />
          <div className="min-w-0">
            <span className="text-[12px] font-bold text-neutral-500 tracking-tight block truncate">
              {specialtyText}
            </span>
            <h3 className="text-[16.5px] sm:text-[17px] font-black text-neutral-900 leading-snug truncate group-hover:text-[#039e1e] transition-colors">
              {specialist.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-[12px] text-neutral-500">
              <span className="flex items-center gap-1 truncate max-w-[140px]">
                <MapPin size={12} className="text-neutral-400 shrink-0" />
                <span className="truncate">{specialist.address || "O'zbekiston"}</span>
              </span>
              {specialist.distanceKm != null && (
                <span className="font-semibold text-neutral-600 shrink-0">
                  • {specialist.distanceKm < 1 ? "<1 km" : `${specialist.distanceKm.toFixed(1)} km`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* O'ng tomonda reyting va tajriba */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {ratingText ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-black text-amber-700 border border-amber-200/80 shadow-2xs">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              <span>{ratingText}</span>
            </span>
          ) : (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500">
              Yangi
            </span>
          )}
          {expText && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200/60">
              {expText}
            </span>
          )}
        </div>
      </div>

      {/* Mutaxassis xizmat ko'rsatish yo'nalishi / Bio (faqat mutaxassis o'zi kiritgan bo'lsa) */}
      {specialist.bio && (
        <p className="mt-2 text-[12px] leading-relaxed text-neutral-500 line-clamp-1 italic bg-neutral-50/80 rounded-xl px-2.5 py-1">
          &ldquo;{specialist.bio}&rdquo;
        </p>
      )}

      {/* Pastki qism: 2 ta tugma (Profil va Chaqirish) */}
      <div className="mt-3.5 pt-3 border-t border-neutral-100 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onViewProfile?.(specialist)}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 py-2.5 text-[13px] font-black text-neutral-700 active:scale-95 transition"
        >
          <User size={14} />
          <span>Profil</span>
        </button>

        <button
          type="button"
          onClick={() => onCall?.(specialist)}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-[#039e1e] hover:bg-[#028518] py-2.5 text-[13px] font-black text-white shadow-xs active:scale-95 transition"
        >
          <Car size={14} />
          <span>Chaqirish</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Mutaxassisning to'liq profili (Screen 2 modali):
 * UI moslashuvi: yuqori va o'rta qism to'liq scroll bo'ladi,
 * pastdagi "Telefon" va "Mutaxassisni chaqirish" tugmalari STICKY bo'lib, ekrandan chiqib ketmaydi.
 */
export function SpecialistProfileModal({
  specialist,
  onClose,
  onCall,
  onRate,
}: {
  specialist: Specialist;
  onClose: () => void;
  onCall: (s: Specialist) => void;
  onRate?: (s: Specialist) => void;
}) {
  const isVet =
    specialist.helpsWith === "animal" ||
    Boolean(specialist.specialty && /veterinar|chorva|parranda|hayvon/i.test(specialist.specialty)) ||
    Boolean(specialist.bio && /veterinar|chorva|parranda|hayvon/i.test(specialist.bio));

  const specialtyText =
    specialist.specialty || (isVet ? "Veterinar vrach" : "Agronom maslahatchi");

  function openDirections() {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${specialist.lat},${specialist.lng}&travelmode=driving`;
    window.open(url, "_blank", "noopener");
  }

  return (
    <div className="fixed inset-0 z-[105] flex justify-center bg-neutral-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-[500px] h-[100dvh] flex flex-col bg-white overflow-hidden shadow-2xl">
        {/* 1. Header (Sticky Top Bar) */}
        <div className="shrink-0 flex items-center justify-between px-5 pt-4 pb-3 border-b border-neutral-100 bg-white z-10">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:scale-90 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-[15px] font-black text-neutral-800">
            Mutaxassis profili
          </span>
          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: specialist.name,
                  text: `${specialist.name} — AgrozGO dagi ${specialtyText}`,
                  url: window.location.href,
                }).catch(() => {});
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:scale-90 transition"
          >
            <Share2 size={18} />
          </button>
        </div>

        {/* 2. Scrollable Body — ma'lumotlar bu yerda mustaqil va bemalol aylanadi */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Avatar va Asosiy ism */}
          <div className="flex flex-col items-center text-center">
            <SpecialistAvatar
              name={specialist.name}
              isVeterinar={isVet}
              isBusy={specialist.isBusy}
              size="lg"
            />
            <div className="mt-3.5">
              <span className="inline-flex items-center gap-1 text-[13px] font-bold text-[#039e1e] bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200/60">
                <CheckCircle2 size={13} />
                <span>{specialtyText}</span>
              </span>
              <h2 className="text-[22px] font-black text-neutral-900 mt-1 leading-tight">
                {specialist.name}
              </h2>
              <div className="flex items-center justify-center gap-2 mt-1 text-[13px] text-neutral-500">
                <span className="flex items-center gap-1">
                  <MapPin size={13} className="text-neutral-400" />
                  <span>{specialist.address || "O'zbekiston"}</span>
                </span>
                {specialist.distanceKm != null && (
                  <span className="font-semibold text-neutral-700">
                    • {specialist.distanceKm < 1 ? "<1 km" : `${specialist.distanceKm.toFixed(1)} km`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 4 ta haqiqiy va ishlaydigan tezkor tugmalar */}
          <div className="grid grid-cols-4 gap-2.5">
            {/* 1. Qo'ng'iroq */}
            <a
              href={`tel:${specialist.phone.replace(/\s/g, "")}`}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-800 border border-neutral-200/80 shadow-xs group-hover:bg-neutral-200 group-active:scale-90 transition">
                <Phone size={19} />
              </div>
              <span className="text-[11px] font-bold text-neutral-600">Qo&apos;ng&apos;iroq</span>
            </a>

            {/* 2. Chaqirish */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onCall(specialist);
              }}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#039e1e] border border-emerald-200/70 shadow-xs group-hover:bg-emerald-100 group-active:scale-90 transition">
                <Car size={19} />
              </div>
              <span className="text-[11px] font-bold text-neutral-600">Chaqirish</span>
            </button>

            {/* 3. Manzil / Xarita */}
            <button
              type="button"
              onClick={openDirections}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/70 shadow-xs group-hover:bg-amber-100 group-active:scale-90 transition">
                <MapPin size={19} />
              </div>
              <span className="text-[11px] font-bold text-neutral-600">Manzil</span>
            </button>

            {/* 4. Baholash */}
            <button
              type="button"
              onClick={() => onRate?.(specialist)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/70 shadow-xs group-hover:bg-blue-100 group-active:scale-90 transition">
                <Star size={19} className="fill-blue-500" />
              </div>
              <span className="text-[11px] font-bold text-neutral-600">
                {specialist.ratingAvg ? `★ ${specialist.ratingAvg.toFixed(1)}` : "Baholash"}
              </span>
            </button>
          </div>

          {/* Mutaxassis haqida tavsif (faqat o'zi kiritgan bo'lsa) */}
          <div className="rounded-2xl bg-neutral-50/80 p-4 border border-neutral-100">
            <h4 className="text-[12px] font-black uppercase text-neutral-400 tracking-wider mb-1.5">
              Mutaxassis haqida
            </h4>
            <p className="text-[13px] leading-relaxed text-neutral-700 font-medium">
              {specialist.bio ? specialist.bio : "Mutaxassis tomonidan xizmatlar tavsifi hozircha kiritilmagan."}
            </p>
          </div>

          {/* Tajriba va Ta'lim kartalari — haqiqiy ma'lumotlar bilan */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-neutral-50/80 p-3.5 border border-neutral-100 flex items-start gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-700">
                <Award size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-neutral-400 block uppercase">
                  Tajriba
                </span>
                <span className="text-[13px] font-extrabold text-neutral-900">
                  {specialist.experienceYears != null && specialist.experienceYears > 0
                    ? `${specialist.experienceYears} yil staj`
                    : "Ko'rsatilmagan"}
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-neutral-50/80 p-3.5 border border-neutral-100 flex items-start gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100/70 text-blue-700">
                <GraduationCap size={18} />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-neutral-400 block uppercase">
                  Ta&apos;lim
                </span>
                <span
                  className="text-[12px] font-extrabold text-neutral-900 truncate block"
                  title={specialist.education || undefined}
                >
                  {specialist.education ? specialist.education : "Ko'rsatilmagan"}
                </span>
              </div>
            </div>
          </div>

          {/* Qabul vaqti va Manzil */}
          <div className="rounded-2xl bg-neutral-50/80 p-4 border border-neutral-100 space-y-2.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2 text-neutral-500 font-medium">
                <Clock size={16} className="text-[#039e1e]" />
                <span>Ish / Qabul vaqti:</span>
              </span>
              <span className="font-extrabold text-neutral-900">
                {specialist.workHours || "Kelishuv asosida"}
              </span>
            </div>

            <div className="flex items-start justify-between text-[13px] pt-2 border-t border-neutral-200/60 gap-3">
              <span className="flex items-center gap-2 text-neutral-500 font-medium shrink-0">
                <MapPin size={16} className="text-[#039e1e]" />
                <span>Manzili:</span>
              </span>
              <span className="font-medium text-neutral-800 text-right break-words">
                {specialist.address || "O'zbekiston"}
              </span>
            </div>
          </div>

          {/* Huquqiy himoya kafolati */}
          <div className="flex items-center justify-center gap-1.5 text-[11.5px] text-neutral-400 font-medium pb-2">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>AgrozGO tomonidan rasmiy tasdiqlangan va akkreditatsiyalangan</span>
          </div>
        </div>

        {/* 3. Sticky Bottom Action Bar — HAR DOIM EKRANDA, HECH QACHON CHIQIB KETMAYDI */}
        <div className="shrink-0 bg-white/95 backdrop-blur-md px-5 pt-3 pb-6 border-t border-neutral-100 flex items-center gap-3 shadow-lg z-20">
          <a
            href={`tel:${specialist.phone.replace(/\s/g, "")}`}
            className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-800 hover:bg-neutral-200 active:scale-95 transition"
            title="Qo'ng'iroq qilish"
          >
            <Phone size={21} />
          </a>

          <button
            type="button"
            onClick={() => {
              onClose();
              onCall(specialist);
            }}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#039e1e] py-3.5 text-[15px] font-black text-white shadow-md hover:bg-[#028518] active:scale-[0.99] transition"
          >
            <span>Mutaxassisni chaqirish</span>
            <span>➔</span>
          </button>
        </div>
      </div>
    </div>
  );
}
