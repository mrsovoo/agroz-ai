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
  ArrowLeft,
  CheckCircle2, 
  Bot, 
  Clock, 
  RotateCcw, 
  Zap,
  Package,
  BookOpen
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
  // Foydalanuvchi Telegram botda tasdiqlaganda avtomatik sezadi va kodsiz kiradi
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
              addToast('Tasdiqlandi! Do‘koningizni oching.', 'success');
              setIsOnboardingForm(true);
            }
          }
        } catch {
          // Fondagi tekshiruv xatolarini jimgina o'tkazamiz
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
      setOtpTimer(res.expires_in_seconds || 300);
      setOtpStep('code');
      addToast(res.message || 'Tasdiqlash kodi yuborildi', 'success');
      tg.hapticImpact('light');
    } catch (err: any) {
      addToast(err.message || 'Kod yuborishda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2. OTP kodni qo'lda tekshirish
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      addToast('6-xonali kodni to‘liq kiriting', 'error');
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
      addToast(err.message || 'Tasdiqlash kodi noto‘g‘ri', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 3. Do'kon ochish formasi
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
        addToast('Do‘koningiz yaratildi!', 'success');
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
        {/* CHAP TARAF: SOF VA CHIROYLI LOYIHA TAQDIMOTI             */}
        {/* ======================================================== */}
        <div className="lg:w-7/12 bg-slate-950 p-8 sm:p-12 lg:p-16 flex flex-col justify-between text-white border-b lg:border-b-0 lg:border-r border-slate-800">
          
          {/* Brand Logo */}
          <div>
            <div className="inline-flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                <Store className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black tracking-tight">
                Biznes<span className="text-emerald-500">GO</span>
              </span>
            </div>
          </div>

          {/* Center: Main Message */}
          <div className="my-10 lg:my-auto max-w-lg">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4 text-white">
              Do‘kon savdosi va hisob-kitobini oson boshqaring.
            </h1>

            <p className="text-base text-slate-400 leading-relaxed mb-8 font-normal">
              Dorixona, yem, urug‘ va qishloq xo‘jaligi do‘konlari uchun qulay kassa, ombor va qarz daftari.
            </p>

            {/* Clean Feature List */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-950/80 text-emerald-400 shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Tezkor kassa va chek</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Savdoni tez va xatosiz hisoblash hamda xaridorga chek berish.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-sky-950/80 text-sky-400 shrink-0 mt-0.5">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Ombor va tovarlar hisobi</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Qaysi mahsulot qancha qolganini doimiy aniq bilib turish.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-950/80 text-amber-400 shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Qarz daftari</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Nasiya savdolar, to‘lov muddatlari va qarzdorlar ro‘yxati.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Note */}
          <div className="pt-6 border-t border-slate-900 text-xs text-slate-500">
            Telefon va kompyuter orqali bir xil qulay ishlaydi.
          </div>

        </div>

        {/* ======================================================== */}
        {/* O'NG TARAF: SOF VA ODDIY KIRISH KARTASI                  */}
        {/* ======================================================== */}
        <div className="lg:w-5/12 bg-slate-50 flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-md">
            
            <div className="bg-white py-8 px-6 sm:px-8 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80">
              
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
                      <h3 className="text-lg font-bold text-slate-900">Do‘kon ochish</h3>
                      <p className="text-xs text-slate-500">Ma’lumotlarni kiriting va savdoni boshlang</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Biznes yo‘nalishi *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
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
                            className={`cursor-pointer rounded-xl p-3 flex items-center gap-2.5 transition-all text-left ${
                              isSelected
                                ? 'border-2 border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                                : 'border border-slate-300 hover:border-slate-400 bg-white text-slate-900 font-semibold'
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-slate-900 whitespace-nowrap">
                              {opt.title}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-auto" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Do‘kon nomi *
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
                        placeholder="Masalan: AgroHimoya"
                        className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Ismingiz *
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
                        placeholder="Masalan: Sardor"
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
                        placeholder="Shahar, bozor yoki ko‘cha"
                        className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                    ) : (
                      'Do‘konni ochish'
                    )}
                  </button>
                </form>
              ) : (
                /* ======================================================== */
                /* 2. KIRISH: TELEGRAM YOKI TELEFON RAQAM                  */
                /* ======================================================== */
                <div className="space-y-6">
                  
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      Kirish
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Do‘koningizni boshqarish uchun tizimga kiring
                    </p>
                  </div>

                  {/* Asosiy Telegram Button */}
                  <a
                    href="https://t.me/biznesgo_bot?start=launch"
                    className="w-full py-3.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm flex items-center justify-center gap-2.5 transition active:scale-[0.99] cursor-pointer shadow-sm"
                  >
                    <Bot className="w-5 h-5 text-white shrink-0" />
                    <span>Telegram orqali kirish</span>
                  </a>

                  {/* Divider */}
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs font-medium text-slate-400">
                      <span className="bg-white px-3 text-[11px]">yoki telefon raqami bilan</span>
                    </div>
                  </div>

                  {/* Telefon orqali kirish */}
                  <div>
                    {otpStep === 'phone' ? (
                      <form onSubmit={handleSendOtp} className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Telefon raqami
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
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer"
                        >
                          {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                          ) : (
                            'Kodni yuborish'
                          )}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyOtp} className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold text-slate-700">
                              Tasdiqlash kodi
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
                          className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer"
                        >
                          {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                          ) : (
                            'Tasdiqlash'
                          )}
                        </button>

                        <div className="flex items-center justify-between pt-1 text-xs">
                          <button
                            type="button"
                            onClick={() => setOtpStep('phone')}
                            className="text-slate-500 hover:text-slate-800 cursor-pointer"
                          >
                            Raqamni o‘zgartirish
                          </button>

                          <button
                            type="button"
                            disabled={otpTimer > 0 || loading}
                            onClick={() => handleSendOtp()}
                            className={`flex items-center gap-1 font-semibold cursor-pointer ${
                              otpTimer > 0
                                ? 'text-slate-300 cursor-not-allowed'
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

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
