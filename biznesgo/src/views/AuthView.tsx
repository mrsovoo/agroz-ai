import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';
import { tg } from '../lib/telegram';
import { BusinessType } from '../types';
import { 
  Store, 
  Sprout, 
  Scale, 
  Building2, 
  Wheat, 
  Wrench, 
  Phone, 
  User, 
  MapPin, 
  ArrowRight,
  ArrowLeft,
  ShieldCheck, 
  CheckCircle2, 
  Bot, 
  ExternalLink, 
  Clock, 
  RotateCcw, 
  Sparkles,
  Smartphone,
  Laptop
} from 'lucide-react';

interface AuthViewProps {
  onSuccess: () => void;
  telegramOnboarding?: {
    telegram_id: number;
    first_name: string;
    last_name?: string;
    username?: string;
  } | null;
}

const BUSINESS_TYPE_OPTIONS: { id: BusinessType; title: string; icon: React.ElementType }[] = [
  { id: 'agro_vet', title: 'Dorixona', icon: Sprout },
  { id: 'feed', title: 'Yem', icon: Scale },
  { id: 'warehouse', title: 'Ombor', icon: Building2 },
  { id: 'seeds', title: 'Urug‘', icon: Wheat },
  { id: 'machinery', title: 'Texnika', icon: Wrench },
];

export function formatUzbekPhone(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (!digits || digits === '998') return '';
  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  }
  digits = digits.slice(0, 9);
  if (digits.length === 0) return '';

  let res = '+998 ' + digits.slice(0, 2);
  if (digits.length > 2) res += ' ' + digits.slice(2, 5);
  if (digits.length > 5) res += ' ' + digits.slice(5, 7);
  if (digits.length > 7) res += ' ' + digits.slice(7, 9);
  return res;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess, telegramOnboarding }) => {
  const { setMerchant, addToast } = useStore();
  const isTgOnboarding = Boolean(telegramOnboarding);

  const [loading, setLoading] = useState(false);

  // Ro'yxatdan o'tish formasi holatlari
  const [isOnboardingForm, setIsOnboardingForm] = useState(isTgOnboarding);
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState(telegramOnboarding?.first_name || '');
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('agro_vet');

  // OTP oqimi holatlari (Noutbuk / Web orqali ulanish)
  const [showWebOtp, setShowWebOtp] = useState(false);
  const [otpStep, setOtpStep] = useState<'phone' | 'code'>('phone');
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(300); // 5 daqiqa
  const [otpBotUrl, setOtpBotUrl] = useState<string | null>(null);
  const [deliveredViaTelegram, setDeliveredViaTelegram] = useState(false);
  const [botName, setBotName] = useState<string | null>(null);

  // URL dan kelgan ?otp= parametrini tekshirish
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const codeFromUrl = urlParams.get('otp');
      if (codeFromUrl) {
        setOtpCode(codeFromUrl);
        setOtpStep('code');
        setShowWebOtp(true);
      }
    }
  }, []);

  // OTP taymerini hisoblash
  useEffect(() => {
    let interval: any = null;
    if (otpStep === 'code' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpStep, otpTimer]);

  // Seamless Telegram Auto-Login (Polling)
  // Foydalanuvchi Telegram botda START bosganida avtomatik sezadi va kodsiz tizimga kiritadi
  useEffect(() => {
    let pollInterval: any = null;
    let isChecking = false;

    if (otpStep === 'code' && phone.trim()) {
      pollInterval = setInterval(async () => {
        if (isChecking) return;
        isChecking = true;
        try {
          const res = await api.auth.checkOtp({
            phone: phone.trim(),
            code: otpCode.trim() || undefined,
          });

          if (res.verified) {
            clearInterval(pollInterval);
            if (res.registered && res.merchant && res.token) {
              api.setToken(res.token);
              setMerchant(res.merchant);
              addToast(`Xush kelibsiz, ${res.merchant.store_name}!`, 'success');
              tg.hapticImpact('heavy');
              onSuccess();
            } else if (!res.registered) {
              addToast('Telegram orqali tasdiqlandi! Endi do‘kon ma’lumotlarini kiriting.', 'success');
              setIsOnboardingForm(true);
              setShowWebOtp(false);
            }
          }
        } catch {
          // Fondagi polling xatolariga e'tibor bermaymiz
        } finally {
          isChecking = false;
        }
      }, 2000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [otpStep, phone, otpCode, onSuccess, setMerchant, addToast]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. Web orqali OTP kod yuborish
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone.trim()) {
      addToast('Telefon raqamingizni kiriting', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.sendOtp(phone.trim());
      setDeliveredViaTelegram(res.delivered_via_telegram);
      setBotName(res.bot_name);
      setOtpBotUrl(res.bot_url);
      setOtpTimer(res.expires_in_seconds || 300);
      setOtpStep('code');

      if (res.delivered_via_telegram) {
        addToast(res.message || 'Tasdiqlash kodi Telegram botingizga yuborildi', 'success');
      } else {
        addToast(res.message || 'Telegram bot orqali tasdiqlash havolasi tayyor', 'info');
      }
      tg.hapticImpact('light');
    } catch (err: any) {
      addToast(err.message || 'OTP kod yuborishda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2. OTP kodni qo'lda tekshirish
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      addToast('6-xonali tasdiqlash kodini to‘liq kiriting', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.verifyOtp({
        phone: phone.trim(),
        code: otpCode.trim(),
      });

      if (res.token) {
        api.setToken(res.token);
      }
      setMerchant(res.merchant);
      addToast(`Xush kelibsiz, ${res.merchant.store_name}!`, 'success');
      tg.hapticImpact('heavy');
      onSuccess();
    } catch (err: any) {
      addToast(err.message || 'Tasdiqlash kodi noto‘g‘ri yoki muddati tugagan', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 3. Do'kon ochish formasi (Telegram onboarding yoki OTP dan keyingi ro'yxatdan o'tish)
  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      addToast('Do‘kon nomini kiriting', 'error');
      return;
    }
    if (!phone.trim()) {
      addToast('Telefon raqamingizni kiriting', 'error');
      return;
    }

    setLoading(true);
    try {
      if (isTgOnboarding) {
        const res = await api.auth.telegramOnboard({
          telegram_id: telegramOnboarding!.telegram_id,
          store_name: storeName.trim(),
          business_type: businessType,
          phone: phone.trim(),
          address: address.trim(),
          full_name: fullName.trim() || telegramOnboarding!.first_name,
          username: telegramOnboarding!.username,
        });

        if (res.token) {
          api.setToken(res.token);
        }
        setMerchant(res.merchant);
        addToast(`Xush kelibsiz, ${res.merchant.store_name}!`, 'success');
        tg.hapticImpact('heavy');
        onSuccess();
      } else {
        const res = await api.auth.register({
          phone: phone.trim(),
          store_name: storeName.trim(),
          full_name: fullName.trim(),
          business_type: businessType,
          address: address.trim(),
        });

        if (res.token) {
          api.setToken(res.token);
        }
        setMerchant(res.merchant);
        addToast('Do‘koningiz muvaffaqiyatli ro‘yxatdan o‘tkazildi!', 'success');
        tg.hapticImpact('heavy');
        onSuccess();
      }
    } catch (err: any) {
      addToast(err.message || 'Xatolik yuz berdi', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center mb-4">
        <div className="inline-flex justify-center items-center gap-2 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-sky-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/25">
            <Store className="w-8 h-8" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Biznes<span className="text-emerald-600">GO</span> <span className="text-sky-600 text-2xl font-bold">B2B</span>
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto font-medium">
          Agro, Vet, Yem, Urug‘ va Ulgurji savdo do‘konlari uchun yagona aqlli boshqaruv tizimi
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-6 px-5 sm:px-8 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-100">
          
          {/* ======================================================== */}
          {/* 1. ONBOARDING / RO'YXATDAN O'TISH FORMASI               */}
          {/* ======================================================== */}
          {isOnboardingForm ? (
            <form onSubmit={handleOnboardSubmit} className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                {!isTgOnboarding && (
                  <button
                    type="button"
                    onClick={() => setIsOnboardingForm(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <h3 className="text-base font-bold text-slate-900">Yangi do‘kon ochish</h3>
                  <p className="text-xs text-slate-500">Do‘koningiz ma’lumotlarini kiriting va savdoni boshlang</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Biznes yo‘nalishini tanlang *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BUSINESS_TYPE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = businessType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setBusinessType(opt.id);
                          tg.hapticImpact('light');
                        }}
                        className={`cursor-pointer rounded-xl border p-2.5 flex items-center gap-2 transition-all text-left ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 font-bold shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-medium'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold truncate flex-1">
                          {opt.title}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Do‘kon yoki Korxona nomi *
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Store className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Masalan: AgroHimoya Samarqand"
                    className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mas'ul shaxs (Ism Familiya) *
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masalan: Sardor Aliyev"
                    className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Telefon raqami *
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(formatUzbekPhone(e.target.value))}
                    placeholder="+998 90 123 45 67"
                    className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Manzil (ixtiyoriy)
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Shahar, tuman, bozor yoki ko‘cha"
                    className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-600/20 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Do‘konni Yaratish va Ishni Boshlash</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ======================================================== */
            /* 2. ASOSIY WEB VIEW: LOYIHA HAQIDA VA 1-QADAM BOT          */
            /* ======================================================== */
            <div className="space-y-6">
              
              {/* Device Experience Explanation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Mobile & Telegram */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50/50 border border-sky-100 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-sky-900 font-bold text-xs mb-1.5">
                    <div className="p-1 rounded-lg bg-sky-500 text-white shadow-xs">
                      <Smartphone className="w-3.5 h-3.5" />
                    </div>
                    <span>Telefon orqali (Mobil)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Telegram bot orqali doimo cho‘ntagingizda: tezkor savdo, kassa cheklari va qarz daftari nazorati.
                  </p>
                </div>

                {/* 2. Laptop & Desktop */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs mb-1.5">
                    <div className="p-1 rounded-lg bg-emerald-600 text-white shadow-xs">
                      <Laptop className="w-3.5 h-3.5" />
                    </div>
                    <span>Noutbuk / Kompyuter</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Katta ekranda ombor qoldiqlari, tovarlarni ommaviy kiritish va batafsil moliyaviy hisobotlar.
                  </p>
                </div>
              </div>

              {/* 1-QADAM: BIZNESNI TASDIQLASH (Asosiy Tugma) */}
              <div className="p-5 rounded-3xl bg-slate-900 text-white text-center shadow-lg relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold mb-3 border border-sky-400/30">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>1-QADAM: BIZNESNI TASDIQLASH</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto mb-4">
                  Do‘koningizni faollashtirish va xavfsiz boshqarish uchun rasmiy Telegram botimizga ulaning.
                </p>

                {/* Grand CTA Button */}
                <a
                  href="https://t.me/biznesgo_bot?start=launch"
                  className="w-full py-3.5 px-5 rounded-2xl shadow-xl shadow-sky-500/30 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 transition transform active:scale-[0.98] cursor-pointer"
                >
                  <Bot className="w-5 h-5 text-white shrink-0" />
                  <span>Biznesni Tasdiqlash va Botga O‘tish</span>
                  <ExternalLink className="w-4 h-4 text-white/80 shrink-0" />
                </a>

                <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                  <span>Bot manzili:</span>
                  <strong className="text-sky-300 font-mono">@biznesgo_bot</strong>
                </div>
              </div>

              {/* Quick Feature Checklist */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-semibold text-slate-700 flex flex-col items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Parolsiz kirish</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-semibold text-slate-700 flex flex-col items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Kassa & Qarz</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-semibold text-slate-700 flex flex-col items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Doimiy sinxron</span>
                </div>
              </div>

              {/* Web Login via Phone Section (For Laptop / Desktop Browser) */}
              <div className="pt-4 border-t border-slate-100">
                {!showWebOtp ? (
                  <button
                    type="button"
                    onClick={() => setShowWebOtp(true)}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:text-slate-900 transition flex items-center justify-center gap-2"
                  >
                    <Laptop className="w-4 h-4 text-slate-500" />
                    <span>Noutbuk / Kompyuter brauzerida ochish →</span>
                  </button>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <Laptop className="w-4 h-4 text-emerald-600" />
                        <span>Noutbukda brauzer orqali ulanish</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowWebOtp(false)}
                        className="text-[11px] text-slate-400 hover:text-slate-600 font-medium"
                      >
                        Yopish
                      </button>
                    </div>

                    {otpStep === 'phone' ? (
                      <form onSubmit={handleSendOtp} className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                            Telefon raqamingiz
                          </label>
                          <div className="relative rounded-xl shadow-xs">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                              <Phone className="w-4 h-4" />
                            </div>
                            <input
                              type="tel"
                              required
                              value={phone}
                              onChange={(e) => setPhone(formatUzbekPhone(e.target.value))}
                              placeholder="+998 90 123 45 67"
                              className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-900"
                            />
                          </div>
                          <p className="mt-1 text-[10px] text-slate-500">
                            Raqamni kiriting — tasdiqlash kodi rasmiy botingizga boradi.
                          </p>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-2.5 px-4 rounded-xl shadow-xs text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Bot className="w-4 h-4" />
                              <span>Tasdiqlash kodini olish</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyOtp} className="space-y-3">
                        {deliveredViaTelegram ? (
                          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="block font-bold">Kod yuborildi!</strong>
                              Telegram ilovangizdagi <strong>@{botName || 'biznesgo_bot'}</strong> botini oching.
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-start gap-2">
                            <Bot className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                            <div>
                              Telegram botga kiring va <strong>Start</strong> bosing:
                            </div>
                          </div>
                        )}

                        {otpBotUrl && (
                          <a
                            href={otpBotUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition"
                          >
                            <Bot className="w-4 h-4" />
                            <span>Telegram Botni Ochish</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* Auto-detect info */}
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-center gap-2 text-[11px] text-slate-600">
                          <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                          <span>Botda tasdiqlansa, bu sahifa <strong>avtomatik ochiladi</strong></span>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                              6-xonali Tasdiqlash Kodi
                            </label>
                            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                              <Clock className="w-3 h-3 text-emerald-600" />
                              <span>{formatTimer(otpTimer)}</span>
                            </div>
                          </div>

                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            autoFocus
                            required
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="• • • • • •"
                            className="block w-full py-2.5 text-center tracking-[0.4em] text-xl font-mono font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading || otpCode.length < 6}
                          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                        >
                          {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" />
                              <span>Kodni Tasdiqlash</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setOtpStep('phone')}
                            className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                          >
                            <ArrowLeft className="w-3 h-3" />
                            <span>Raqamni o‘zgartirish</span>
                          </button>

                          <button
                            type="button"
                            disabled={otpTimer > 0 || loading}
                            onClick={() => handleSendOtp()}
                            className={`flex items-center gap-1 font-semibold ${
                              otpTimer > 0
                                ? 'text-slate-400 cursor-not-allowed'
                                : 'text-emerald-600 hover:text-emerald-700'
                            }`}
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Qayta yuborish</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Footer Security Badge */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xavfsiz B2B Cloud Tizimi — Neon DB & Telegram Bot Sync</span>
          </div>

        </div>
      </div>
    </div>
  );
};
