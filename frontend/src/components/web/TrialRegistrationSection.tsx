"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Send,
  Loader2,
  ShieldCheck,
  Building2,
  Sparkles,
  MapPin,
  Phone,
  User,
  Clock,
  Check,
  Lock,
} from "lucide-react";
import { apiFetch } from "@/lib/api-config";

const REGIONS = [
  "Toshkent shahri",
  "Toshkent viloyati",
  "Samarqand",
  "Farg‘ona",
  "Andijon",
  "Namangan",
  "Buxoro",
  "Qashqadaryo",
  "Surxondaryo",
  "Xorazm",
  "Navoiy",
  "Jizzax",
  "Sirdaryo",
  "Qoraqalpog‘iston",
];

export default function TrialRegistrationSection() {
  const router = useRouter();

  // Form maydonlari
  const [organization, setOrganization] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("Toshkent viloyati");
  const [storeType, setStoreType] = useState("Agro-dorixona");

  // Jarayon holatlari
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2-bosqich: Telegram tasdiqlash
  const [regData, setRegData] = useState<{
    token: string;
    sessionToken: string;
    startUrl: string;
    webCabinetUrl: string;
    botUsername: string;
    phone: string;
    organization: string;
  } | null>(null);

  const [verified, setVerified] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Telefon raqamni formatlash (+998 ...)
  const handlePhoneChange = (val: string) => {
    let digits = val.replace(/\D/g, "");
    if (!digits.startsWith("998")) {
      digits = "998" + digits;
    }
    digits = digits.slice(0, 12);

    let formatted = "+998";
    if (digits.length > 3) formatted += " " + digits.slice(3, 5);
    if (digits.length > 5) formatted += " " + digits.slice(5, 8);
    if (digits.length > 8) formatted += " " + digits.slice(8, 10);
    if (digits.length > 10) formatted += " " + digits.slice(10, 12);

    setPhone(formatted);
  };

  // 1-bosqich: Sinov versiyasini rasmiylashtirish
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 9) {
      setError("Iltimos, to‘liq telefon raqamingizni kiriting (+998 XX XXX XX XX)");
      return;
    }
    if (!organization.trim()) {
      setError("Do‘kon yoki agro-dorixona nomini kiriting");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/api/bot/partner/register-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || organization.trim(),
          phone: cleanPhone,
          organization: organization.trim(),
          specialty: storeType,
          address: region,
          role: "pharmacy",
        }),
      });

      const data = await res.json();
      if (data?.ok) {
        setRegData(data);
        setStep(2);
      } else {
        setError(data?.error || "Ro‘yxatdan o‘tishda xatolik yuz berdi");
      }
    } catch {
      setError("Server bilan aloqa uzildi. Internetni tekshiring.");
    } finally {
      setLoading(false);
    }
  };

  // 2-bosqich: Telegram bot tasdiqlashini fonda kuzatish (polling)
  useEffect(() => {
    if (step !== 2 || !regData?.token || verified) return;

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await apiFetch(
          `/api/bot/partner/check-registration?token=${encodeURIComponent(regData.token)}`
        );
        const data = await res.json();
        if (data?.ok && data.verified) {
          setVerified(true);
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);

          if (regData.sessionToken) {
            localStorage.setItem("agroz_business_token", regData.sessionToken);
          }
          setTimeout(() => {
            router.push(regData.webCabinetUrl || "/business");
          }, 1500);
        }
      } catch {}
    }, 2500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [step, regData, verified, router]);

  return (
    <div className="bg-white rounded-[36px] sm:rounded-[48px] p-6 sm:p-10 lg:p-12 border border-black/8 shadow-xl text-left">
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Chap ustun: 1 oylik tekin sinov afzalliklari */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 border border-emerald-200 px-3.5 py-1.5 rounded-full">
            <Clock size={14} className="text-emerald-700" />
            <span>30 kun mutlaqo bepul</span>
          </div>

          <h3 className="text-2xl sm:text-4xl font-extrabold text-[#191B1F] tracking-tight leading-[1.18]">
            Dorixona egalari uchun <br />
            <span className="text-emerald-700">1 oylik tekin sinov</span> versiyasini o‘rnating
          </h3>

          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-xl">
            Hech qanday bank kartasi talab qilinmaydi. Do‘koningiz ma’lumotlarini kiriting, Telegram orqali 1 bosishda tasdiqlang va shaxsiy biznes kabinetingizga kirib to‘liq boshqaruvni boshlang.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                <Check size={13} strokeWidth={3} />
              </div>
              <div className="text-xs text-zinc-700">
                <strong>Kunlik Kassa (POS):</strong> Naqd, plastik karta va nasiya savdolarining avtomatik balansi.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                <Check size={13} strokeWidth={3} />
              </div>
              <div className="text-xs text-zinc-700">
                <strong>Omborxona nazorati:</strong> Dori qoldiqlari, kirim narxi va yaroqlilik muddatlari ogohlantirishi.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                <Check size={13} strokeWidth={3} />
              </div>
              <div className="text-xs text-zinc-700">
                <strong>Xavfsiz Qarz daftari:</strong> Qog‘oz daftarsiz, shifrlangan bulutli mijozlar hisobi.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                <Check size={13} strokeWidth={3} />
              </div>
              <div className="text-xs text-zinc-700">
                <strong>Oylik hisobotlar:</strong> Savdo aylanmasi, xarajatlar va haqiqiy sof foyda hisoboti.
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-zinc-500">
            <Lock size={14} className="text-emerald-700" />
            <span>100% Shaxsiy va xavfsiz shifrlangan bulutli ERP</span>
          </div>
        </div>

        {/* O'ng ustun: Ariza Formasi yoki Telegram tasdiq bloki */}
        <div className="lg:col-span-6 bg-[#FAF9F5] rounded-3xl p-6 sm:p-8 border border-black/8 shadow-sm">
          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-base sm:text-lg font-bold text-[#191B1F]">
                  1 oylik bepul litsenziyani rasmiylashtirish
                </h4>
                <p className="text-xs text-zinc-500">
                  Ma’lumotlaringizni to‘ldiring va Telegram orqali tasdiqlang
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Do'kon nomi */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5">
                  <Building2 size={13} className="text-zinc-500" />
                  <span>Do‘kon / Dorixona nomi *</span>
                </label>
                <input
                  type="text"
                  required
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Masalan: Baraka Agro Kimyo MCHJ"
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Mas'ul shaxs */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5">
                  <User size={13} className="text-zinc-500" />
                  <span>Do‘kon egasi / Mas’ul shaxs</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ism va familiyangiz"
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Telefon raqam */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5">
                  <Phone size={13} className="text-zinc-500" />
                  <span>Telefon raqamingiz *</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              {/* Viloyat & Turi */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5">
                    <MapPin size={13} className="text-zinc-500" />
                    <span>Viloyat / Shahar</span>
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3 py-3 rounded-2xl bg-white border border-zinc-200 text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5">
                    <Store size={13} className="text-zinc-500" />
                    <span>Faoliyat turi</span>
                  </label>
                  <select
                    value={storeType}
                    onChange={(e) => setStoreType(e.target.value)}
                    className="w-full px-3 py-3 rounded-2xl bg-white border border-zinc-200 text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="Agro-dorixona">Agro-dorixona</option>
                    <option value="Urug‘ va o‘g‘it do‘koni">Urug‘ va o‘g‘it do‘koni</option>
                    <option value="Veterinariya dorixonasi">Veterinariya dorixonasi</option>
                    <option value="Universal agro-markaz">Universal agro-markaz</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-full bg-[#191B1F] hover:bg-black text-white font-bold text-xs sm:text-sm transition shadow-md active:scale-95 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-amber-400" />
                    <span>Rasmiylashtirilmoqda...</span>
                  </>
                ) : (
                  <>
                    <span>1 Oylik Bepul Sinovni Boshlash</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* 2-BOSQICH: Telegram tasdiqlash */
            <div className="space-y-6 text-center py-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                <Send size={24} />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-lg font-bold text-[#191B1F]">
                  Telegram orqali 1 bosishda tasdiqlang
                </h4>
                <p className="text-xs text-zinc-600 max-w-sm mx-auto leading-relaxed">
                  Hurmatli <strong>{regData?.organization}</strong> vakili, quyidagi tugma orqali rasmiy Telegram botimizga kiring va <strong>Start</strong> tugmasini bosing.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-black/8 space-y-2 text-left text-xs">
                <div className="flex justify-between text-zinc-500">
                  <span>Do‘kon:</span>
                  <span className="font-bold text-zinc-800">{regData?.organization}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Telefon:</span>
                  <span className="font-bold text-zinc-800">{regData?.phone}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Litsenziya:</span>
                  <span className="font-bold text-emerald-700">1 oy bepul (BETA)</span>
                </div>
              </div>

              <a
                href={regData?.startUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <Send size={15} />
                <span>Telegram orqali tasdiqlash</span>
              </a>

              <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 pt-1">
                {verified ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={16} />
                    <span>Muvaffaqiyatli tasdiqlandi! Kabinetga yo‘naltirilmoqda...</span>
                  </span>
                ) : (
                  <>
                    <Loader2 size={14} className="animate-spin text-zinc-400" />
                    <span>Telegram tasdiqlashi kutilmoqda...</span>
                  </>
                )}
              </div>

              {regData?.webCabinetUrl && (
                <div className="pt-2">
                  <a
                    href={regData.webCabinetUrl}
                    className="text-xs text-emerald-700 hover:text-emerald-900 font-bold underline"
                  >
                    Shaxsiy kabinetga to‘g‘ridan-to‘g‘ri o‘tish
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

