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
  ArrowRight,
  CheckCircle2, 
  Bot, 
  Clock, 
  RotateCcw, 
  Zap,
  Package,
  BookOpen,
  Navigation,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle
} from 'lucide-react';

interface AuthViewProps {
  onSuccess: () => void;
  telegramOnboarding?: {
    telegram_id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    phone?: string;
  } | null;
}

const BUSINESS_TYPE_OPTIONS: { 
  id: BusinessType; 
  title: string; 
  desc: string; 
  icon: React.ElementType 
}[] = [
  { 
    id: 'agro_vet', 
    title: 'Agro-Vet dorixona', 
    desc: 'O‘g‘itlar, kimyoviy himoya va dori-darmonlar', 
    icon: Sprout 
  },
  { 
    id: 'feed', 
    title: 'Yem-ozuqa savdosi', 
    desc: 'Chorva va parranda yemlari, don va kepak', 
    icon: Scale 
  },
  { 
    id: 'warehouse', 
    title: 'Ulgurji ombor', 
    desc: 'Katta partiyalar, optom savdo va tarqatish', 
    icon: Building2 
  },
  { 
    id: 'seeds', 
    title: 'Urug‘ va ko‘chat', 
    desc: 'Ekin urug‘lari, nihol va ko‘chatlar', 
    icon: Wheat 
  },
  { 
    id: 'machinery', 
    title: 'Jihoz va texnika', 
    desc: 'Uskunalar, purkagich va ehtiyot qismlar', 
    icon: Wrench 
  },
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

  // Ro'yxatdan o'tish / Onboarding 3 bosqichli holat
  const [isOnboardingForm, setIsOnboardingForm] = useState(isTgOnboarding);
  const [onboardStep, setOnboardStep] = useState<1 | 2 | 3>(1);

  // Formalar ma'lumotlari
  const [businessType, setBusinessType] = useState<BusinessType>('agro_vet');
  const [storeName, setStoreName] = useState('');
  const [fullName, setFullName] = useState(telegramOnboarding?.first_name || '');
  const [phone, setPhone] = useState(
    telegramOnboarding?.phone ? formatUzbekPhone(telegramOnboarding.phone) : ''
  );
  
  // 3-bosqich: Manzil, lokatsiya va parol
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [password, setPassword] = useState('');

  // Web Kirish rejimi: 'password' yoki 'otp'
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // OTP oqimi holatlari
  const [otpStep, setOtpStep] = useState<'phone' | 'code'>('phone');
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(60); // 1 daqiqa
  const [deliveredViaTelegram, setDeliveredViaTelegram] = useState(false);
  const [otpBotUrl, setOtpBotUrl] = useState<string | null>(null);

  // Eslab qolingan telefon raqamni yuklash
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPhone = localStorage.getItem('biznesgo_remember_phone');
      if (savedPhone && !phone) {
        setPhone(formatUzbekPhone(savedPhone));
      }

      const urlParams = new URLSearchParams(window.location.search);
      const codeFromUrl = urlParams.get('otp');
      if (codeFromUrl) {
        setOtpCode(codeFromUrl);
        setOtpStep('code');
        setLoginMode('otp');
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

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Reverse geocoding orqali yozma manzilni avtomatik topish
  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          setAddress(data.display_name);
          return;
        }
      }
      setAddress(`Do‘kon koordinatalari: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
    } catch (e) {
      setAddress(`Do‘kon koordinatalari: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
    } finally {
      setDetectingLocation(false);
    }
  };

  // 1. Geolokatsiyani aniqlash (Brauzer va Telegram ruxsatlari bilan)
  const handleGetLocation = () => {
    setLocationPermissionDenied(false);

    // Agar Telegram WebApp LocationManager mavjud bo'lsa
    const wa = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
    if (wa && (wa as any).LocationManager) {
      setDetectingLocation(true);
      try {
        (wa as any).LocationManager.init(() => {
          (wa as any).LocationManager.getLocation((data: any) => {
            if (data && data.latitude && data.longitude) {
              setLat(data.latitude);
              setLng(data.longitude);
              tg.hapticImpact('medium');
              addToast('Lokatsiya muvaffaqiyatli aniqlandi!', 'success');
              reverseGeocode(data.latitude, data.longitude);
            } else {
              fallbackBrowserGeolocation();
            }
          });
        });
        return;
      } catch (e) {
        fallbackBrowserGeolocation();
        return;
      }
    }

    fallbackBrowserGeolocation();
  };

  const fallbackBrowserGeolocation = () => {
    if (!navigator.geolocation) {
      setDetectingLocation(false);
      addToast('Brauzeringiz geolokatsiyani qo‘llab-quvvatlamaydi. Manzilni qo‘lda kiriting.', 'error');
      return;
    }

    setDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        setLat(latitude);
        setLng(longitude);
        setLocationPermissionDenied(false);
        tg.hapticImpact('medium');
        addToast('Lokatsiya muvaffaqiyatli aniqlandi!', 'success');
        await reverseGeocode(latitude, longitude);
      },
      (err) => {
        setDetectingLocation(false);
        if (err.code === 1) { // PERMISSION_DENIED
          setLocationPermissionDenied(true);
          addToast('Brauzerda lokatsiyaga ruxsat berilmadi. Manzilni qo‘lda yozishingiz mumkin.', 'warning');
        } else if (err.code === 2) { // POSITION_UNAVAILABLE
          addToast('Qurilma joylashuvini aniqlab bo‘lmadi. GPS yoqilganligini tekshiring.', 'error');
        } else if (err.code === 3) { // TIMEOUT
          addToast('Joylashuvni aniqlash vaqti tugadi. Qayta urinib ko‘ring.', 'error');
        } else {
          addToast('Lokatsiyani aniqlashda xatolik: ' + err.message, 'error');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  // 2. 2-bosqichdan 3-bosqichga o'tish
  const handleStep2Next = () => {
    if (!storeName.trim()) {
      addToast('Do‘kon nomini kiriting', 'error');
      return;
    }
    if (!fullName.trim()) {
      addToast('Mas’ul shaxs ismini kiriting', 'error');
      return;
    }
    if (!phone.trim()) {
      addToast('Telefon raqamingizni kiriting', 'error');
      return;
    }
    tg.hapticImpact('light');
    setOnboardStep(3);
  };

  // 3. Web orqali Parol bilan kirish
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      addToast('Telefon raqamingizni kiriting', 'error');
      return;
    }
    if (!loginPassword.trim()) {
      addToast('Parolingizni kiriting', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.login({
        phone: phone.trim(),
        password: loginPassword.trim(),
      });

      if (rememberMe) {
        localStorage.setItem('biznesgo_remember_phone', phone.trim());
      } else {
        localStorage.removeItem('biznesgo_remember_phone');
      }

      if (res.token) {
        api.setToken(res.token);
      }
      setMerchant(res.merchant);
      addToast(`Xush kelibsiz, ${res.merchant.store_name}!`, 'success');
      tg.hapticImpact('heavy');
      onSuccess();
    } catch (err: any) {
      addToast(err.message || 'Telefon yoki parol noto‘g‘ri', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 4. Web orqali OTP kod yuborish
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone.trim()) {
      addToast('Telefon raqamingizni kiriting', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.sendOtp(phone.trim());
      setOtpTimer(res.expires_in_seconds || 60);
      setDeliveredViaTelegram(res.delivered_via_telegram);
      setOtpBotUrl(res.bot_url);
      setOtpStep('code');
      addToast(res.message || 'Tasdiqlash kodi yuborildi', 'success');
      tg.hapticImpact('light');
    } catch (err: any) {
      addToast(err.message || 'Kod yuborishda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 5. OTP kodni tekshirish
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

      if (res.needs_onboarding || !res.merchant) {
        if (res.phone) {
          setPhone(formatUzbekPhone(res.phone));
        }
        if (res.user?.name && res.user.name !== 'Sotuvchi') {
          setFullName(res.user.name);
        }
        setIsOnboardingForm(true);
        setOnboardStep(1);
        addToast(res.message || 'Tasdiqlandi! Do‘koningiz ma’lumotlarini kiriting.', 'success');
        tg.hapticImpact('medium');
        return;
      }

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

  // 6. Do'kon ochishni yakunlash (3-bosqich tasdiqlash)
  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      addToast('Do‘kon nomini kiriting', 'error');
      setOnboardStep(2);
      return;
    }
    if (!phone.trim()) {
      addToast('Telefon raqamingizni kiriting', 'error');
      setOnboardStep(2);
      return;
    }
    if (!lat || !lng || !address.trim()) {
      addToast('Iltimos, avval "Lokatsiyani aniqlash" tugmasi orqali do‘kon joylashuvini tasdiqlang', 'error');
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
          lat,
          lng,
          password: password.trim() || undefined,
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
          lat,
          lng,
          password: password.trim() || undefined,
        });

        if (rememberMe) {
          localStorage.setItem('biznesgo_remember_phone', phone.trim());
        }

        if (res.token) {
          api.setToken(res.token);
        }
        setMerchant(res.merchant);
        addToast('Do‘koningiz muvaffaqiyatli ochildi!', 'success');
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
        {/* CHAP TARAF: FAQAT NOUTBUK/DESKTOPDA CHIQADI              */}
        {/* ======================================================== */}
        <div className="hidden lg:flex lg:w-7/12 bg-slate-950 p-8 sm:p-12 lg:p-16 flex-col justify-between text-white border-r border-slate-800">
          
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
        {/* O'NG TARAF: KIRISH VA RO'YXATDAN O'TISH KARTASI          */}
        {/* ======================================================== */}
        <div className="w-full lg:w-5/12 bg-slate-50 flex items-center justify-center p-4 sm:p-8 lg:p-12 min-h-screen">
          <div className="w-full max-w-md">
            
            <div className="bg-white py-8 px-6 sm:px-8 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80">
              
              {/* ======================================================== */}
              {/* 1. ONBOARDING / RO'YXATDAN O'TISH (3 BOSQICH)            */}
              {/* ======================================================== */}
              {isOnboardingForm ? (
                <div className="space-y-4">
                  
                  {/* Bosqich progress chizig'i (3 ta oddiy segment) */}
                  <div className="grid grid-cols-3 gap-1.5 mb-1">
                    <div className={`h-1.5 rounded-full transition-all ${onboardStep >= 1 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                    <div className={`h-1.5 rounded-full transition-all ${onboardStep >= 2 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                    <div className={`h-1.5 rounded-full transition-all ${onboardStep >= 3 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                  </div>

                  {/* Bosqich sarlavhasi va indikatori */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      {onboardStep > 1 ? (
                        <button
                          type="button"
                          onClick={() => setOnboardStep((prev) => (prev - 1) as any)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                          title="Ortga"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                      ) : !isTgOnboarding ? (
                        <button
                          type="button"
                          onClick={() => setIsOnboardingForm(false)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                          title="Kirishga qaytish"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                      ) : null}
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          {onboardStep === 1 && 'Biznes yo‘nalishi'}
                          {onboardStep === 2 && 'Do‘kon ma’lumotlari'}
                          {onboardStep === 3 && 'Manzil va lokatsiya'}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {onboardStep === 1 && 'Sohangizni tanlang'}
                          {onboardStep === 2 && 'Do‘kon nomi va mas’ul shaxs'}
                          {onboardStep === 3 && 'Do‘kon joylashuvini tasdiqlang'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      {onboardStep} / 3
                    </span>
                  </div>

                  {/* ==================== 1-BOSQICH ==================== */}
                  {onboardStep === 1 && (
                    <div className="space-y-3 pt-1">
                      <div className="space-y-2">
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
                              className={`w-full cursor-pointer rounded-xl p-2.5 sm:p-3 flex items-center justify-between border transition-all text-left ${
                                isSelected
                                  ? 'border-2 border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs'
                                  : 'border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white text-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                    isSelected ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <div className={`text-sm font-bold leading-tight ${isSelected ? 'text-emerald-950' : 'text-slate-900'}`}>
                                    {opt.title}
                                  </div>
                                  <div className="text-xs text-slate-500 leading-tight mt-0.5">
                                    {opt.desc}
                                  </div>
                                </div>
                              </div>
                              <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-3 transition-all ${
                                  isSelected
                                    ? 'border-emerald-600 bg-emerald-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          tg.hapticImpact('light');
                          setOnboardStep(2);
                        }}
                        className="w-full mt-3 py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2 cursor-pointer transition shadow-xs active:scale-[0.99]"
                      >
                        <span>Keyingisi</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* ==================== 2-BOSQICH ==================== */}
                  {onboardStep === 2 && (
                    <div className="space-y-4 pt-1">
                      {/* Tanlangan yo'nalish belgisi */}
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Tanlangan yo‘nalish:</span>
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {BUSINESS_TYPE_OPTIONS.find((b) => b.id === businessType)?.title}
                        </span>
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
                            placeholder="Masalan: AgroHimoya yoki Baraka Ulgurji"
                            className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Mas’ul shaxs (Ismingiz) *
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
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Telefon raqami *
                          </label>
                          {phone && (
                            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Tasdiqlangan
                            </span>
                          )}
                        </div>
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

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setOnboardStep(1)}
                          className="py-3 px-4 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                        >
                          Ortga
                        </button>
                        <button
                          type="button"
                          onClick={handleStep2Next}
                          className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-[0.99]"
                        >
                          <span>Keyingisi</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ==================== 3-BOSQICH ==================== */}
                  {onboardStep === 3 && (
                    <form onSubmit={handleOnboardSubmit} className="space-y-4 pt-1">
                      
                      {/* Geolokatsiya tugmasi va Ruxsat xabarlari */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Xaritadagi lokatsiya
                        </label>
                        <button
                          type="button"
                          disabled={detectingLocation}
                          onClick={handleGetLocation}
                          className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                            lat && lng
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {detectingLocation ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                              <span>Lokatsiya aniqlanmoqda...</span>
                            </>
                          ) : lat && lng ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Lokatsiya aniqlandi ✓ ({lat.toFixed(4)}, {lng.toFixed(4)})</span>
                            </>
                          ) : (
                            <>
                              <Navigation className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Lokatsiyani aniqlash (Ruxsat berish)</span>
                            </>
                          )}
                        </button>

                        {/* Ruxsat so'ralayotgan paytdagi yo'riqnoma */}
                        {detectingLocation && (
                          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2">
                            <span className="text-base leading-none">🔔</span>
                            <div className="text-[11px] leading-relaxed">
                              Brauzeringiz ekranda <b>"Joylashuvdan foydalanishga ruxsat berasizmi?"</b> deb so‘raydi. Iltimos, <b>"Ruxsat berish" (Allow)</b> tugmasini bosing.
                            </div>
                          </div>
                        )}

                        {/* Ruxsat rad etilganda ko'rsatiladigan yordam */}
                        {locationPermissionDenied && (
                          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-1.5">
                            <div className="font-bold flex items-center gap-1.5 text-amber-900">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              Brauzerda lokatsiyaga ruxsat berilmadi
                            </div>
                            <p className="text-[11px] leading-relaxed text-amber-800">
                              Manzilni avtomatik aniqlash uchun brauzer qidiruv qatoridagi 🔒 (qulf/sozlamalar) belgisini bosib, <b>"Joylashuv" (Location)</b> ruxsatini yoqing.
                            </p>
                            <button
                              type="button"
                              onClick={handleGetLocation}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 hover:text-amber-950 underline cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Qayta ruxsat so‘rash
                            </button>
                          </div>
                        )}

                        {!detectingLocation && !locationPermissionDenied && !lat && (
                          <p className="text-[11px] text-slate-500">
                            Tugmani bosing, brauzerdan ruxsat so‘raladi va do‘kon manzili avtomatik aniqlanadi.
                          </p>
                        )}
                      </div>

                      {/* Do'kon manzili (Faqat lokatsiya orqali avtomatik yoziladi) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Do‘kon manzili (Avtomatik) *
                          </label>
                          {address ? (
                            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Lokatsiyadan olindi
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-400">
                              Qo‘lda kiritilmaydi
                            </span>
                          )}
                        </div>
                        <div className="relative rounded-xl shadow-xs">
                          <div className="absolute top-3 left-3 flex items-start pointer-events-none text-slate-400">
                            <MapPin className={`w-4 h-4 ${address ? 'text-emerald-600' : 'text-slate-400'}`} />
                          </div>
                          <textarea
                            rows={2}
                            readOnly
                            value={address}
                            placeholder="Yuqoridagi 'Lokatsiyani aniqlash' tugmasini bosing, do‘koningiz manzili bu yerga avtomatik yoziladi..."
                            className={`block w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm font-medium transition-colors select-none ${
                              address
                                ? 'bg-emerald-50/40 border-emerald-300 text-slate-900'
                                : 'bg-slate-100/80 border-slate-200 text-slate-500 cursor-not-allowed'
                            }`}
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Do‘kon manzili faqat GPS/Geolokatsiya orqali avtomatik belgilanadi (tashqaridan o‘zboshimchalik bilan yozilmaydi).
                        </p>
                      </div>

                      {/* Web Parol (ixtiyoriy yoki kelajakda web orqali kirish uchun) */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Web orqali kirish paroli (ixtiyoriy)
                        </label>
                        <div className="relative rounded-xl shadow-xs">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Kamida 6 ta belgi (Web brauzerda kirish uchun)"
                            className="block w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setOnboardStep(2)}
                          className="py-3 px-4 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                        >
                          Ortga
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-[0.99]"
                        >
                          {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                          ) : (
                            <>
                              <span>Do‘konni ochish</span>
                              <CheckCircle2 className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                </div>
              ) : (
                /* ======================================================== */
                /* 2. KIRISH: PAROL, TELEGRAM YOKI OTP                     */
                /* ======================================================== */
                <div className="space-y-5">
                  
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      Kirish
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Do‘koningizni boshqarish uchun tizimga kiring
                    </p>
                  </div>

                  {/* Asosiy Telegram Button (Launch App) */}
                  <a
                    href="https://t.me/biznesgo_bot?start=launch"
                    className="w-full py-3.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm flex items-center justify-center gap-2.5 transition active:scale-[0.99] cursor-pointer shadow-sm"
                  >
                    <Bot className="w-5 h-5 text-white shrink-0" />
                    <span>Telegram orqali kirish (Launch App)</span>
                  </a>

                  {/* Divider */}
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs font-medium text-slate-400">
                      <span className="bg-white px-3 text-[11px]">yoki Web orqali kirish</span>
                    </div>
                  </div>

                  {/* Tablar: Parol bilan / OTP bilan */}
                  <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setLoginMode('password')}
                      className={`flex-1 py-2 text-center rounded-lg transition cursor-pointer ${
                        loginMode === 'password'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Parol bilan kirish
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginMode('otp')}
                      className={`flex-1 py-2 text-center rounded-lg transition cursor-pointer ${
                        loginMode === 'otp'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Kodni tasdiqlash
                    </button>
                  </div>

                  {/* FORM 1: Parol bilan kirish (Remember Me bilan) */}
                  {loginMode === 'password' ? (
                    <form onSubmit={handlePasswordLogin} className="space-y-3.5">
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

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Parol
                        </label>
                        <div className="relative rounded-xl shadow-xs">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="Parolingizni kiriting"
                            className="block w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Eslab qolish checkboxi */}
                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-700 select-none">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                          />
                          <span>Meni eslab qolish</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => setLoginMode('otp')}
                          className="text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
                        >
                          Parolni unutdingizmi?
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer shadow-xs"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                        ) : (
                          'Kirish'
                        )}
                      </button>
                    </form>
                  ) : (
                    /* FORM 2: OTP orqali kirish */
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
                          {deliveredViaTelegram ? (
                            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Kodingiz <strong>@biznesgo_bot</strong> ga yuborildi.</span>
                            </div>
                          ) : otpBotUrl ? (
                            <div className="space-y-1.5">
                              <p className="text-xs text-slate-600">
                                Kodingizni olish uchun botni oching:
                              </p>
                              <a
                                href={otpBotUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                              >
                                <Bot className="w-4 h-4 text-white" />
                                <span>@biznesgo_bot da kodni ko‘rish</span>
                              </a>
                            </div>
                          ) : null}

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
                  )}

                  {/* Ro'yxatdan o'tishga havola */}
                  <div className="pt-2 text-center border-t border-slate-100">
                    <p className="text-xs text-slate-500">
                      Do‘koningiz hali ro‘yxatdan o‘tmaganmi?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setIsOnboardingForm(true);
                          setOnboardStep(1);
                        }}
                        className="font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                      >
                        Yangi do‘kon ochish
                      </button>
                    </p>
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
