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
  TrendingUp,
  ReceiptText,
  Zap,
  Layers
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

  // Ro'yxatdan o'tish / Onboarding formasi holati
  const [isOnboardingForm, setIsOnboardingForm] = useState(isTgOnboarding);
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState(telegramOnboarding?.first_name || '');
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('agro_vet');

  // OTP oqimi holatlari
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
  // Foydalanuvchi Telegram botda START bosganida avtomatik sezadi va kodsiz kiradi
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
              addToast('Telegram orqali tasdiqlandi! Do‘koningizni oching.', 'success');
              setIsOnboardingForm(true);
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
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center">
      <div className="w-full min-h-screen flex flex-col lg:flex-row">
        
        {/* ======================================================== */}
        {/* CHAP TARAF: LOYIHA HAQIDA ZO'R VIZUAL TAQDIMOT           */}
        {/* ======================================================== */}
        <div className="lg:w-7/12 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 sm:p-10 lg:p-16 flex flex-col justify-between relative overflow-hidden text-white border-b lg:border-b-0 lg:border-r border-slate-800">
          
          {/* Ambient orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Logo */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                <Store className="w-7 h-7" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight block leading-none">
                  Biznes<span className="text-emerald-400">GO</span>
                </span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                  B2B Boshqaruv Tizimi
                </span>
              </div>
            </div>
          </div>

          {/* Center: Main Project Pitch & Visual Cards */}
          <div className="relative z-10 my-8 lg:my-auto max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Agro, Vet va Ulgurji Savdo Uchun Maxsus</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4 text-white">
              Do‘koningizni noutbuk va telefonda yagona tizimda boshqaring.
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8">
              Kassa savdolari, tovarlar qoldig‘i, qarz daftari va tushumlar hisoboti — ortiqcha qog‘ozbozliksiz, xavfsiz va aniq nazoratda.
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
                <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm mb-1.5">
                  <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span>Tezkor Kassa</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Shtrix-kod yoki qidiruv orqali 1 soniyada savdo qiling va xaridorga chek bering.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
                <div className="flex items-center gap-2.5 text-sky-400 font-bold text-sm mb-1.5">
                  <div className="p-1.5 rounded-xl bg-sky-500/20 text-sky-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span>Ombor & Qoldiqlar</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Dorixona, yem, urug‘ va texnika mahsulotlari sonini real vaqt rejimida kuzatib boring.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
                <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm mb-1.5">
                  <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
                    <ReceiptText className="w-4 h-4" />
                  </div>
                  <span>Qarz Daftari</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Nasiya savdolar, to‘lov muddatlari va qarzdorlar ro‘yxati har doim qo‘l ostingizda.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
                <div className="flex items-center gap-2.5 text-teal-400 font-bold text-sm mb-1.5">
                  <div className="p-1.5 rounded-xl bg-teal-500/20 text-teal-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span>Real-Vaqt Hisobotlar</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Kunlik, oylik tushumlar, sof foyda va eng ko‘p sotilgan tovarlar tahlili.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Security & Tech Note */}
          <div className="relative z-10 pt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Bulutli Neon PostgreSQL</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-sky-400" />
              <span>Telegram Bot Tezkor Sinxron</span>
            </div>
            <span>•</span>
            <span>100% Ma’lumotlar xavfsizligi</span>
          </div>

        </div>

        {/* ======================================================== */}
        {/* O'NG TARAF: KIRISH PANELI                                */}
        {/* ======================================================== */}
        <div className="lg:w-5/12 bg-slate-50 flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-md">
            
            <div className="bg-white py-8 px-6 sm:px-8 shadow-2xl shadow-slate-200/80 rounded-3xl border border-slate-100">
              
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
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Yangi do‘kon ochish</h3>
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
                        <span>Do‘konni Yaratish va Boshlash</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* ======================================================== */
                /* 2. KIRISH: BIZNESNI TASDIQLASH VA NOUTBUKDA ISHLASH       */
                /* ======================================================== */
                <div className="space-y-6">
                  
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      Tizimga Kirish
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Do‘koningizni boshqarish uchun bot orqali tasdiqlang yoki telefoningizni kiriting
                    </p>
                  </div>

                  {/* 1-QADAM: BIZNESNI TASDIQLASH (Asosiy Telegram Button) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px] font-black">1</span>
                      <span>Tezkor kirish (Tavsiya etiladi):</span>
                    </div>

                    <a
                      href="https://t.me/biznesgo_bot?start=launch"
                      className="w-full py-4 px-5 rounded-2xl shadow-xl shadow-sky-500/25 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-3 transition transform active:scale-[0.98] cursor-pointer"
                    >
                      <Bot className="w-6 h-6 text-white shrink-0" />
                      <span>Telegram orqali tasdiqlash</span>
                      <ExternalLink className="w-4 h-4 text-white/80 shrink-0" />
                    </a>

                    <p className="text-[11px] text-slate-500 leading-tight">
                      👉 <strong>@biznesgo_bot</strong> da <code>/start</code> bosing. Do‘koningiz avtomatik ochiladi.
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase font-bold text-slate-400">
                      <span className="bg-white px-3 text-[10px]">yoki telefon raqami bilan</span>
                    </div>
                  </div>

                  {/* Telefon orqali kirish (Noutbukda brauzerda ishlovchilar uchun) */}
                  <div className="space-y-3">
                    {otpStep === 'phone' ? (
                      <form onSubmit={handleSendOtp} className="space-y-3">
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
                              className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 bg-white"
                            />
                          </div>
                          <p className="mt-1 text-[11px] text-slate-400">
                            Raqamni kiriting — tasdiqlash kodi rasmiy Telegram botingizga yuboriladi
                          </p>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-3 px-4 rounded-xl shadow-md shadow-emerald-600/20 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <span>Tasdiqlash kodini olish</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyOtp} className="space-y-3.5">
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
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center gap-2 text-[11px] text-slate-600">
                          <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                          <span>Botda tasdiqlansa, ushbu sahifa <strong>avtomatik ochiladi</strong></span>
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
                            className="block w-full py-2.5 text-center tracking-[0.4em] text-xl font-mono font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-slate-900"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading || otpCode.length < 6}
                          className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
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
                            className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium cursor-pointer"
                          >
                            <ArrowLeft className="w-3 h-3" />
                            <span>Raqamni o‘zgartirish</span>
                          </button>

                          <button
                            type="button"
                            disabled={otpTimer > 0 || loading}
                            onClick={() => handleSendOtp()}
                            className={`flex items-center gap-1 font-semibold cursor-pointer ${
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

                </div>
              )}

              {/* Footer Security Badge */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Xavfsiz B2B Tizim — Neon DB & Bot Sync</span>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
