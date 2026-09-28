"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, Check } from "lucide-react";
import { createSpecialistCall } from "@/lib/specialist-calls";
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

  // Avtomatik ravishda foydalanuvchi ma'lumotlarini yuklash va chaqiruvni shakllantirish
  useEffect(() => {
    if (!isOpen || !specialist) return;

    // Yangi ID generatsiya qilish (501 dan boshlab)
    const storedLastId = localStorage.getItem("agroz_last_call_id");
    const nextId = storedLastId ? Math.max(501, Number(storedLastId) + 1) : 501;
    setCallId(nextId);
    localStorage.setItem("agroz_last_call_id", String(nextId));
    setCallProgress(1);

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

  const handleNextStep = () => {
    setCallProgress((prev) => (prev === 1 ? 2 : prev === 2 ? 3 : 1));
  };

  const handleBack = useCallback(() => {
    onClose();
    onSuccess();
  }, [onClose, onSuccess]);

  if (!isOpen || !specialist) return null;

  const specialistTitle = specialist.specialty || (specialist.role === "pharmacy" ? "Dorixona egasi" : "Agronom");

  return (
    <div className="fixed inset-0 z-[110] flex justify-center bg-[#121212] overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-[500px] min-h-[100dvh] flex flex-col justify-between px-5 pt-7 pb-28">
        <div>
          {/* 1. Orqaga tugmasi (Mockup bilan 1:1) */}
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-[17px] font-semibold text-[#22c55e] hover:opacity-85 active:scale-95 transition"
          >
            <ChevronLeft size={22} className="stroke-[2.6] -ml-1" />
            <span>Orqaga</span>
          </button>

          {/* 2. Sarlavha: Chaqiruv #... va Mutaxassis nomi */}
          <div className="mt-4">
            <h1 className="text-[24px] font-bold text-white tracking-tight leading-tight">
              Chaqiruv #{callId}
            </h1>
            <p className="text-[15px] font-normal text-neutral-400 mt-1">
              {specialistTitle} {specialist.name}
            </p>
          </div>

          {/* 3. 3-bosqichli status kartochkasi (Mockup bilan 1:1) */}
          <div className="mt-5 rounded-[22px] bg-[#222225] border border-neutral-800/80 p-5 shadow-sm space-y-4">
            {/* 1-bosqich: So'rov yuborildi */}
            <div className="flex items-center gap-3.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#22c55e] text-black">
                <Check size={15} className="stroke-[3]" />
              </div>
              <span className="text-[16px] font-bold text-white">
                So&apos;rov yuborildi
              </span>
            </div>

            {/* 2-bosqich: Mutaxassis qabul qildi */}
            <div className="flex items-center gap-3.5">
              {callProgress >= 2 ? (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#22c55e] text-black">
                  <Check size={15} className="stroke-[3]" />
                </div>
              ) : (
                <div className="h-6 w-6 shrink-0 rounded-full border-2 border-neutral-600 bg-transparent" />
              )}
              <span
                className={`text-[16px] ${
                  callProgress >= 2 ? "font-bold text-white" : "font-medium text-neutral-400"
                }`}
              >
                Mutaxassis qabul qildi
              </span>
            </div>

            {/* 3-bosqich: Aloqaga chiqdi */}
            <div className="flex items-center gap-3.5">
              {callProgress >= 3 ? (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#22c55e] text-black">
                  <Check size={15} className="stroke-[3]" />
                </div>
              ) : (
                <div className="h-6 w-6 shrink-0 rounded-full border-2 border-neutral-600 bg-transparent" />
              )}
              <span
                className={`text-[16px] ${
                  callProgress >= 3 ? "font-bold text-white" : "font-medium text-neutral-400"
                }`}
              >
                Aloqaga chiqdi
              </span>
            </div>
          </div>

          {/* 4. Mutaxassis botiga kelgan xabar (demo) */}
          <div className="mt-7">
            <p className="text-[14.5px] text-neutral-400 font-normal mb-2.5">
              Mutaxassis botiga kelgan xabar (demo):
            </p>

            <div className="rounded-2xl bg-[#eef4fa] p-4.5 text-[#1e293b] shadow-sm">
              <h4 className="text-[16px] font-bold text-[#1e3a8a] tracking-tight">
                Yangi chaqiruv #{callId}
              </h4>
              <p className="text-[14.5px] font-medium text-[#1e293b] mt-1">
                Mijoz: {name}
              </p>
              <p className="text-[14.5px] font-medium text-[#1e293b] mt-0.5">
                Manzil: {address}
              </p>
            </div>
          </div>
        </div>

        {/* 5. Mutaxassis sifatida: keyingi holat tugmasi */}
        <div className="mt-8 pt-4">
          <button
            type="button"
            onClick={handleNextStep}
            className="w-full rounded-2xl border border-[#22c55e] bg-transparent py-3.5 text-center text-[15px] font-bold text-[#22c55e] hover:bg-[#22c55e]/10 active:scale-[0.98] transition shadow-2xs"
          >
            Mutaxassis sifatida: keyingi holat
          </button>
        </div>
      </div>
    </div>
  );
}
