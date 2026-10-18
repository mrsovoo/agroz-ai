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
  Lock, 
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
  Sparkles
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

  // Tabs: web foydalanuvchilari uchun standart 'otp' tanlanadi
  const [tab, setTab] = useState<'otp' | 'login' | 'register'>(isTgOnboarding ? 'register' : 'otp');
  const [loading, setLoading] = useState(false);

  // Form states
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(telegramOnboarding?.first_name || '');
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('agro_vet');

  // OTP flow states
  const [otpStep, setOtpStep] = useState<'phone' | 'code'>('phone');
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(300); // 5 daqiqa
  const [otpBotUrl, setOtpBotUrl] = useState<string | null>(null);
  const [deliveredViaTelegram, setDeliveredViaTelegram] = useState(false);
  const [botName, setBotName] = useState<string | null>(null);

  // View mode: tashqi brauzerda to'g'ridan-to'g'ri Telegram tugmasi ko'rinadi
  const [viewMode, setViewMode] = useState<'telegram' | 'form'>(isTgOnboarding ? 'form' : 'telegram');

  // URL dan kelgan ?otp= parametrini tekshirish
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const codeFromUrl = urlParams.get('otp');
      if (codeFromUrl) {
        setOtpCode(codeFromUrl);
        setTab('otp');
        setOtpStep('code');
        setViewMode('form');
      }
    }
  }, []);

  // OTP timer taymerini hisoblash
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
  // Foydalanuvchi Telegram botda START bosganini avtomatik sezadi va kodsiz kiradi
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
              // Yangi foydalanuvchi — do'kon ochish qadamiga o'tkazamiz
              addToast('Telegram orqali tasdiqlandi! Endi do‘koningizni oching.', 'success');
              setTab('register');
              setOtpStep('phone');
            }
          }
        } catch {
          // orqa fondagi polling xatolariga e'tibor bermaymiz
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

  // 1. OTP kod so'rash
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

  // 2. OTP kodni tekshirish
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

  // 3. Standart Login / Register (Fallback)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isTgOnboarding) {
        if (!storeName.trim()) {
          addToast('Do‘kon nomini kiriting', 'error');
          setLoading(false);
          return;
        }
        if (!phone.trim()) {
          addToast('Telefon raqamingizni kiriting', 'error');
          setLoading(false);
          return;
        }

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
        tg.hapticImpact('medium');
        onSuccess();
      } else if (tab === 'login') {
        if (!phone.trim() || !password) {
          addToast('Telefon va parolni kiriting', 'error');
          setLoading(false);
          return;
        }

        const res = await api.auth.login({
          phone: phone.trim(),
          password,
        });

        if (res.token) {
          api.setToken(res.token);
        }
        setMerchant(res.merchant);
        addToast(`Xush kelibsiz, ${res.merchant.store_name}!`, 'success');
        tg.hapticImpact('medium');
        onSuccess();
      } else {
        // Register
        if (!phone.trim() || !storeName.trim() || !fullName.trim()) {
          addToast('Do‘kon nomi, mas‘ul shaxs va telefon raqamini to‘ldiring', 'error');
          setLoading(false);
          return;
        }

        const res = await api.auth.register({
          phone: phone.trim(),
          password: password.trim() ? password.trim() : undefined,
          full_name: fullName.trim(),
          store_name: storeName.trim(),
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
            <Store className="w-7 h-7" />
          </div>
        </div>
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Biznes<span className="text-emerald-600">GO</span> B2B
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 max-w-sm mx-auto">
          {isTgOnboarding
            ? 'Telegram hisobingiz uchun yangi do‘kon oching'
            : 'Agro, Vet, Yem va Ulgurji savdo uchun boshqaruv platformasi'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100 sm:px-10">
          {/* 1. PRIMARY VIEW: Telegram Orqali Ochish (Browser Visitor) */}
          {!isTgOnboarding && viewMode === 'telegram' ? (
            <div className="space-y-6 text-center py-2">
              <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-100 text-xs text-emerald-900 leading-relaxed text-left shadow-sm">
                <span className="font-bold text-sm block mb-1 text-emerald-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  BiznesGO B2B Platformasiga Xush Kelibsiz!
                </span>
                Kassa, ombor qoldiqlari va qarz daftari boshqaruvi to‘liq rasmiy <strong>@biznesgo_bot</strong> Telegram boti orqali ishlaydi. Login yoki parol kiritish shart emas.
              </div>

              {/* Grand Telegram CTA Button */}
              <a
                href="https://t.me/biznesgo_bot?start=launch"
                className="w-full py-4 px-6 rounded-2xl shadow-xl shadow-sky-500/30 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-extrabold text-base flex items-center justify-center gap-3 transition transform active:scale-[0.98] cursor-pointer"
              >
                <Bot className="w-6 h-6 text-white" />
                <span>Telegram Orqali Ochish</span>
                <ExternalLink className="w-5 h-5 text-white/80" />
              </a>

              <p className="text-xs text-slate-500 font-mono">
                👉 Rasmiy bot: <strong className="text-slate-800">@biznesgo_bot</strong>
              </p>

              {/* Feature Highlights */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700 font-semibold shadow-xs">
                  ⚡️ 1 bosishda kirish
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700 font-semibold shadow-xs">
                  🏪 Kassa & Ombor
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700 font-semibold shadow-xs">
                  📒 Qarz daftari
                </div>
              </div>

              {/* Alternative Web Option */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setViewMode('form')}
                  className="text-xs font-semibold text-slate-400 hover:text-emerald-700 transition"
                >
                  Brauzerda telefon raqam orqali kirish →
                </button>
              </div>
            </div>
          ) : (
            <>
              {!isTgOnboarding && (
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => setViewMode('telegram')}
                    className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Telegram orqali ochishga qaytish</span>
                  </button>
                </div>
              )}

              {/* Navigation Tabs (Web Browser) */}
              {!isTgOnboarding && (
                <div className="flex rounded-xl bg-slate-100 p-1 mb-6 text-xs sm:text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setTab('otp');
                      setOtpStep('phone');
                    }}
                    className={`flex-1 py-2 font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      tab === 'otp'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Bot className="w-4 h-4 text-emerald-600" />
                    <span>Telegram OTP</span>
                    <span className="hidden sm:inline px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                      Tezkor
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTab('login')}
                    className={`flex-1 py-2 font-semibold rounded-lg transition-all ${
                      tab === 'login'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Parol bilan
                  </button>

                  <button
                    type="button"
                    onClick={() => setTab('register')}
                    className={`flex-1 py-2 font-semibold rounded-lg transition-all ${
                      tab === 'register'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Yangi do‘kon
                  </button>
                </div>
              )}

          {/* 1. TELEGRAM OTP FLOW (Recommended) */}
          {tab === 'otp' && !isTgOnboarding && (
            <div>
              {otpStep === 'phone' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 text-xs text-emerald-800">
                    <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold block mb-0.5 text-emerald-900">Parolsiz xavfsiz kirish</strong>
                      Telefon raqamingizni kiriting, tasdiqlash kodi rasmiy <strong>@biznesgo_bot</strong> orqali yetkaziladi.
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Telefon raqami *
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-5 h-5" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(formatUzbekPhone(e.target.value))}
                        placeholder="+998 90 123 45 67"
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium tracking-wide text-slate-900"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Raqamni kiriting (masalan: 90 123 45 67) — +998 avtomatik qo‘yiladi
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-600/20 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Bot className="w-4 h-4" />
                        <span>Telegram orqali kirish</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {/* Status Banner */}
                  {deliveredViaTelegram ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-xs text-emerald-900">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Kod yuborildi!</span> Telegram ilovangizdagi{' '}
                        <strong className="text-emerald-700">@{botName || 'biznesgo_bot'}</strong> botini oching.
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 flex items-start gap-3 text-xs text-sky-900">
                      <Bot className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                      <div>
                        Telegram botga o‘ting va <strong>Start</strong> bosing — tizim sizni avtomatik taniydi:
                      </div>
                    </div>
                  )}

                  {/* Direct Telegram Bot Link Button */}
                  {otpBotUrl && (
                    <a
                      href={otpBotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl shadow-lg shadow-sky-500/20 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition active:scale-[0.99]"
                    >
                      <Bot className="w-5 h-5 text-white" />
                      <span>1-Tugma: Telegramda Tasdiqlash</span>
                      <ExternalLink className="w-4 h-4 text-white/80" />
                    </a>
                  )}

                  {/* Auto-polling waiting indicator */}
                  <div className="p-3 rounded-xl bg-slate-100/90 border border-slate-200 flex items-center justify-center gap-2 text-xs text-slate-700">
                    <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>Botda <strong>Start</strong> bosganingizda ushbu oyna <strong>avtomatik kiradi</strong></span>
                  </div>

                  <div className="relative my-1 text-center">
                    <span className="bg-white px-3 text-[11px] text-slate-400 uppercase font-semibold">yoki kodni qo‘lda kiriting</span>
                  </div>

                  {/* 6-digit Code Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        6-xonali Tasdiqlash Kodi *
                      </label>
                      <div className="flex items-center gap-1 text-xs font-mono font-medium text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{formatTimer(otpTimer)}</span>
                      </div>
                    </div>

                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoFocus
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="block w-full py-3 text-center tracking-[0.5em] text-2xl font-mono font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 text-slate-900"
                    />
                    <div className="mt-1 text-center text-[11px] text-slate-400">
                      Telefon: <strong className="text-slate-700">{phone}</strong>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || otpCode.length < 6}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-600/20 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Kodni Tasdiqlash va Kirish</span>
                      </>
                    )}
                  </button>

                  {/* Secondary Actions: Resend & Change Phone */}
                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setOtpStep('phone')}
                      className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
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
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Kodni qayta yuborish</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 2. PASSWORD LOGIN / REGISTER FLOW (Fallback) */}
          {(tab === 'login' || tab === 'register' || isTgOnboarding) && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {(isTgOnboarding || tab === 'register') && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
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
                    <p className="mt-1 text-xs text-slate-500 italic">
                      ⚠️ Diqqat: Tanlangan biznes turi ro‘yxatdan o‘tgach o‘zgartirilmaydi.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Do‘kon yoki Korxona nomi *
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Store className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="Masalan: AgroHimoya Samarqand"
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Mas'ul shaxs (Ism Familiya) *
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Masalan: Sardor Aliyev"
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Telefon raqami *
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(formatUzbekPhone(e.target.value))}
                    placeholder="+998 90 123 45 67"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-slate-900"
                  />
                </div>
              </div>

              {!isTgOnboarding && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    {tab === 'login' ? 'Parol *' : 'Parol (ixtiyoriy)'}
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type="password"
                      required={tab === 'login'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={tab === 'login' ? '••••••••' : 'Ixtiyoriy'}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {(isTgOnboarding || tab === 'register') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Manzil (ixtiyoriy)
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Shahar, tuman, bozor yoki ko‘cha"
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-600/20 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {isTgOnboarding
                        ? 'Do‘konni ochish'
                        : tab === 'login'
                        ? 'Kirish'
                        : 'Ro‘yxatdan o‘tish'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
            </>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Xavfsiz B2B Cloud Tizimi — Neon PostgreSQL & Telegram Bot Sync</span>
          </div>
        </div>
      </div>
    </div>
  );
};
