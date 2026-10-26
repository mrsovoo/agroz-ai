import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../app/providers/AppContext';
import { BiznesGoLogo } from '../../shared/components/BiznesGoLogo';
import { formatUzPhone } from '../../core/utils/phone';
import {
  ShieldCheck,
  Scale,
  Sparkles,
  FileText,
  Wrench,
  ArrowRight,
  CheckCircle2,
  Check,
  ArrowLeft,
  Store,
  Building2,
  Sprout,
  Phone,
  Lock,
  Send,
  Loader2,
  ExternalLink,
  RefreshCw,
  KeyRound,
} from 'lucide-react';
import type { SectorCode } from '../../core/types';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'https://api-backend-production-4420.up.railway.app';
const BOT_USERNAME = (import.meta as any).env?.VITE_BOT_USERNAME || 'biznesgo_bot';

export const RegisterPage: React.FC = () => {
  const { registerBusiness } = useApp();
  const navigate = useNavigate();

  // Web uchun: Login yoki Yangi Ro'yxatdan o'tish
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginPhone, setLoginPhone] = useState('90 838 37 72');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Telegram orqali tasdiqlash holati (Browser login)
  const [isWaitingTelegram, setIsWaitingTelegram] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const [botUrl, setBotUrl] = useState('');
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);

  // 3 ta bosqich (Ro'yxatdan o'tish uchun)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // 1-bosqich: Ism va Nomer (+998 avto)
  const [fullName, setFullName] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');

  // 2-bosqich: Sektorni tanlash
  const [selectedSector, setSelectedSector] = useState<SectorCode>('pharmacy');

  // 3-bosqich: Do'kon ma'lumotlari + Savdo turi (Chakana do'kon yoki Ulgurji ombor)
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [businessType, setBusinessType] = useState<'retail' | 'wholesale'>('retail');

  // Polling taymerini tozalash uchun ref
  const pollTimerRef = useRef<any>(null);

  interface SectorConfig {
    code: SectorCode;
    title: string;
    desc: string;
    icon: any;
    storePlaceholder: string;
  }

  const sectors: SectorConfig[] = [
    {
      code: 'pharmacy',
      title: 'Veterinariya & Agro Dorixona',
      desc: 'Dori partiyalari, FEFO va yaroqlilik muddati nazorati',
      icon: ShieldCheck,
      storePlaceholder: 'Masalan: Zangiota Vet-Agro Dorixonasi',
    },
    {
      code: 'feed',
      title: 'Yem-xashak & Ozuqa Do‘koni',
      desc: 'Kombikorm, kepak, 1 qopni ochib kg da sotish',
      icon: Scale,
      storePlaceholder: 'Masalan: Qibray Yem Ombori',
    },
    {
      code: 'seeds',
      title: 'Urug‘ & Ko‘chat Do‘koni / Issiqxona',
      desc: 'Navlar, unuvchanlik % va ko‘chat partiyalari',
      icon: Sparkles,
      storePlaceholder: 'Masalan: Namangan Urug‘chilik & Ko‘chatxonasi',
    },
    {
      code: 'greenhouse',
      title: 'Issiqxona Jihozlari & Bog‘dorchilik',
      desc: 'Metr/rulon hisobi va Smeta (BOM) kalkulyatori',
      icon: FileText,
      storePlaceholder: 'Masalan: Agro Plast Issiqxona mollari',
    },
    {
      code: 'machinery',
      title: 'Qishloq Xo‘jalik Texnikasi & Zapchast',
      desc: 'Seriya raqami (VIN), kafolat, servis va bo‘lib to‘lash',
      icon: Wrench,
      storePlaceholder: 'Masalan: AgroTex Servis & Ehtiyot qismlar',
    },
  ];

  const currentSectorObj = sectors.find((s) => s.code === selectedSector)!;

  // ========================================================
  // TELEGRAM BOT ORQALI KIRISHNI SO'RASH (LOGIN SESSION)
  // ========================================================
  const handleStartTelegramLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanDigits = loginPhone.replace(/\D/g, '');
    if (cleanDigits.length < 9) {
      setErrorMessage('Iltimos, to‘g‘ri telefon raqam kiriting');
      return;
    }

    const formattedPhone = cleanDigits.length === 9 ? `+998${cleanDigits}` : (loginPhone.startsWith('+') ? loginPhone : `+${loginPhone}`);

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/biznesgo/auth/login-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      const data = await res.json();
      if (data.success && data.token) {
        setSessionToken(data.token);
        const finalBotUrl = data.bot_url || `https://t.me/${BOT_USERNAME}?start=${data.token}`;
        setBotUrl(finalBotUrl);
        setIsWaitingTelegram(true);
        if (data.otpCode) {
          setDevCode(data.otpCode);
        }
      } else {
        setErrorMessage(data.error || 'Kirish so‘rovini yaratishda xatolik yuz berdi');
      }
    } catch (err: any) {
      // Backend ulanmasa ham xavfsiz davom etish
      const fallbackToken = 'login_' + Math.random().toString(36).substring(2, 10);
      setSessionToken(fallbackToken);
      setBotUrl(`https://t.me/${BOT_USERNAME}?start=${fallbackToken}`);
      setIsWaitingTelegram(true);
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================================
  // TELEGRAM TASDIQLASH POLLING (HAR 2 SONIYADA TEKSHIRISH)
  // ========================================================
  useEffect(() => {
    if (!isWaitingTelegram || !sessionToken) return;

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/biznesgo/auth/session/status?token=${sessionToken}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === 'approved') {
          clearInterval(pollTimerRef.current);
          if (data.token) {
            localStorage.setItem('biznesgo_token', data.token);
          }
          const tenant = data.tenant || {};
          registerBusiness({
            name: tenant.name || 'BiznesGO Do‘kon',
            phone: tenant.phone || `+998 ${loginPhone}`,
            sector: (tenant.sector_type as SectorCode) || 'pharmacy',
            address: tenant.address || undefined,
            storeType: 'retail',
          });
          navigate('/');
        }
      } catch (_) {
        // Polling network retry
      }
    }, 2000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isWaitingTelegram, sessionToken, loginPhone]);

  // ========================================================
  // OTP KOD BILAN DARHOL TASDIQLASH
  // ========================================================
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCodeInput.trim()) return;

    const cleanDigits = loginPhone.replace(/\D/g, '');
    const formattedPhone = cleanDigits.length === 9 ? `+998${cleanDigits}` : `+${cleanDigits}`;

    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/biznesgo/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          code: otpCodeInput.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.tenant) {
        if (data.token) localStorage.setItem('biznesgo_token', data.token);
        registerBusiness({
          name: data.tenant.name || 'BiznesGO Do‘kon',
          phone: data.tenant.phone || formattedPhone,
          sector: (data.tenant.sector_type as SectorCode) || 'pharmacy',
          address: data.tenant.address || undefined,
          storeType: 'retail',
        });
        navigate('/');
      } else {
        setErrorMessage(data.error || 'Tasdiqlash kodi noto‘g‘ri');
      }
    } catch (err: any) {
      setErrorMessage('Kodni tekshirishda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  // To'g'ridan-to'g'ri sinov rejimi
  const handleDirectDemoLogin = () => {
    const cleanDigits = loginPhone.replace(/\D/g, '');
    const formattedPhone = cleanDigits.length === 9 ? `+998${cleanDigits}` : `+${cleanDigits}`;

    registerBusiness({
      name: 'Agroz Farm',
      phone: formattedPhone || '+998908383772',
      sector: 'pharmacy',
      storeType: 'retail',
    });
    navigate('/');
  };

  // ========================================================
  // YANGI DO'KON RO'YXATDAN O'TISH BOSQICHLARI
  // ========================================================
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || phoneDigits.replace(/\s/g, '').length < 9) return;
    setCurrentStep(2);
  };

  const handleStep2Submit = () => {
    setCurrentStep(3);
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) return;

    const cleanDigits = phoneDigits.replace(/\D/g, '');
    const formattedPhone = cleanDigits.length === 9 ? `+998${cleanDigits}` : `+${cleanDigits}`;

    setIsLoading(true);
    try {
      await fetch(`${API_BASE}/api/biznesgo/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: storeName.trim(),
          phone: formattedPhone,
          sector_type: selectedSector,
          address: address.trim() || undefined,
        }),
      });
    } catch (_) {}

    registerBusiness({
      name: storeName.trim(),
      phone: formattedPhone,
      sector: selectedSector,
      address: address.trim() || undefined,
      storeType: businessType,
    });

    setIsLoading(false);
    navigate('/');
  };

  return (
    <div className="min-h-dvh bg-[#111215] flex items-center justify-center p-3 sm:p-6 antialiased">
      <div className="w-full max-w-4xl bg-white rounded-[28px] sm:rounded-[36px] overflow-hidden shadow-2xl flex flex-col lg:flex-row border border-neutral-100">
        
        {/* CHAP TOMON: Yashil Brend Banneri */}
        <div className="lg:w-[44%] bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-950 p-6 sm:p-10 flex flex-col justify-between text-white relative overflow-hidden min-h-[300px] lg:min-h-[580px]">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

          {/* Yuqori logotip */}
          <div className="relative z-10">
            <div className="bg-white/95 px-4 py-2 rounded-2xl inline-flex items-center shadow-md">
              <BiznesGoLogo className="h-6 sm:h-7 w-auto" />
            </div>
          </div>

          {/* O'rta qism */}
          <div className="relative z-10 my-auto py-6 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold">
              <span>BiznesGO B2B Platformasi</span>
              <Sprout className="h-3.5 w-3.5 text-emerald-200" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Savdo va Do‘koningizni Boshqaring
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm font-medium leading-relaxed max-w-sm">
              Kassa (POS), ombor partiyalari, qarz daftari va avtomatik Telegram hisobotlari — bir joyda.
            </p>
          </div>

          {/* Pastki qism: Telegram Bot tegi */}
          <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-xs">
            <span className="text-emerald-100 font-medium">Rasmiy Telegram Bot:</span>
            <span className="font-mono font-bold bg-white/20 px-2.5 py-1 rounded-xl">@{BOT_USERNAME}</span>
          </div>
        </div>

        {/* O'NG TOMON: Forma */}
        <div className="lg:w-[56%] p-6 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">
            
            {/* Tizimga kirish (Login) vs Yangi Ro'yxatdan o'tish (Web Switcher) */}
            <div className="flex bg-[#f7f7f5] p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setIsWaitingTelegram(false);
                }}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-white text-[#111215] shadow-xs'
                    : 'text-neutral-500 hover:text-[#111215]'
                }`}
              >
                Tizimga kirish
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setIsWaitingTelegram(false);
                }}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  authMode === 'register'
                    ? 'bg-white text-[#111215] shadow-xs'
                    : 'text-neutral-500 hover:text-[#111215]'
                }`}
              >
                Yangi do‘kon ochish
              </button>
            </div>

            {/* Xatolik xabari */}
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 animate-in fade-in">
                {errorMessage}
              </div>
            )}

            {/* ======================================================== */}
            {/* A. TIZIMGA KIRISH (TELEGRAM ORQALI TASDIQLASH)           */}
            {/* ======================================================== */}
            {authMode === 'login' && !isWaitingTelegram && (
              <form onSubmit={handleStartTelegramLogin} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-[#111215] tracking-tight">
                    Tizimga kirish
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                    Telefon raqamingizni kiriting. Tasdiqlash xabari <b>@{BOT_USERNAME}</b> botingizga yuboriladi.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">Telefon raqamingiz</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 flex items-center gap-1.5 text-sm font-bold text-neutral-800 pointer-events-none">
                      <Phone className="h-3.5 w-3.5 text-neutral-400" />
                      <span>+998</span>
                    </div>
                    <input
                      type="tel"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(formatUzPhone(e.target.value))}
                      placeholder="90 838 37 72"
                      required
                      autoFocus
                      className="w-full bg-[#f7f7f5] border-0 rounded-2xl py-3 pl-[5.5rem] pr-4 text-sm text-[#111215] font-bold tracking-wide focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#35ca56]/30 transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#111215] hover:bg-black text-white font-black text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-transform active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-[#35ca56]" />
                      <span>So‘rov yuborilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <span>Telegram orqali tasdiqlash</span>
                      <ArrowRight className="h-4 w-4 text-[#35ca56]" />
                    </>
                  )}
                </button>

                {/* To'g'ridan-to'g'ri sinash / tezkor kirish */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleDirectDemoLogin}
                    className="text-xs font-bold text-neutral-500 hover:text-emerald-700 transition-colors cursor-pointer"
                  >
                    yoki darhol sinov rejimida kirish (Agroz Farm)
                  </button>
                </div>

                {/* Telegram Launch App to'g'ridan-to'g'ri havolasi */}
                <div className="pt-4 border-t border-neutral-100 text-center space-y-2">
                  <p className="text-[11px] text-neutral-400 font-semibold">
                    Agar Telegram ichida bo‘lsangiz:
                  </p>
                  <a
                    href={`https://t.me/${BOT_USERNAME}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-2xl bg-[#eafaf0] text-[#1f7a34] hover:bg-[#d2f5dc] text-xs font-black transition-colors"
                  >
                    <span>@{BOT_USERNAME} botida ochish</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </form>
            )}

            {/* ======================================================== */}
            {/* A.2. TELEGRAM TASDIQLASH KUTILMOQDA (WAITING APPROVAL)   */}
            {/* ======================================================== */}
            {authMode === 'login' && isWaitingTelegram && (
              <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-black mb-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Telegram tasdiqlashi kutilmoqda</span>
                  </div>
                  <h3 className="text-xl font-black text-[#111215] tracking-tight">
                    Botingizdan tasdiqlang
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Biz <b>@{BOT_USERNAME}</b> orqali telefoningizga kirish so‘rovini yubordik. Quyidagi tugmani bosing:
                  </p>
                </div>

                {/* 1. Asosiy Telegramda ochish tugmasi */}
                <a
                  href={botUrl || `https://t.me/${BOT_USERNAME}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-[#35ca56] hover:bg-[#2cb24a] text-white font-black text-sm py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all active:scale-95 text-center"
                >
                  <Send className="h-4 w-4" />
                  <span>Telegram botda tasdiqlash</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                </a>

                {/* 2. 6 xonali OTP kod kiritish (alternativa) */}
                <form onSubmit={handleVerifyOtp} className="space-y-2 pt-2 border-t border-neutral-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-700">Yoki 6 xonali kodni kiriting:</label>
                    {devCode && (
                      <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
                        Kod: {devCode}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCodeInput}
                      onChange={(e) => setOtpCodeInput(e.target.value)}
                      placeholder="Masalan: 123456"
                      className="flex-1 bg-[#f7f7f5] rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-center tracking-widest text-[#111215] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#35ca56]/30"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || otpCodeInput.trim().length < 4}
                      className="bg-[#111215] hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl disabled:opacity-50 transition-colors"
                    >
                      Kodni tasdiqlash
                    </button>
                  </div>
                </form>

                {/* Orqaga qaytish */}
                <div className="pt-2 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setIsWaitingTelegram(false)}
                    className="text-neutral-400 hover:text-neutral-700 font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Raqamni o‘zgartirish</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDirectDemoLogin}
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    Sinov rejimi (Darhol kirish)
                  </button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* B. YANGI RO'YXATDAN O'TISH REJIMI                        */}
            {/* ======================================================== */}
            {authMode === 'register' && (
              <>
                <div className="space-y-1">
                  <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider">
                    {currentStep}-bosqich / 3 dan
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {currentStep === 1 && 'Shaxsiy ma’lumotlar'}
                    {currentStep === 2 && 'Faoliyat sohangizni tanlang'}
                    {currentStep === 3 && `${currentSectorObj.title}`}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {currentStep === 1 && 'Ismingiz va telefon raqamingizni kiriting.'}
                    {currentStep === 2 && 'Do‘koningiz qaysi soha bo‘yicha faoliyat olib boradi?'}
                    {currentStep === 3 && 'Savdo turi (do‘kon yoki ombor) va manzilni kiriting.'}
                  </p>
                </div>

                {/* 1-BOSQICH: Ism va Nomer */}
                {currentStep === 1 && (
                  <form onSubmit={handleStep1Submit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Ism va Familiyangiz</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Masalan: Sohibjon Sulaymonov"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Telefon raqamingiz</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 flex items-center gap-1.5 text-sm font-bold text-slate-800 pointer-events-none">
                          <Phone className="h-3.5 w-3.5 text-neutral-400" />
                          <span>+998</span>
                        </div>
                        <input
                          type="tel"
                          value={phoneDigits}
                          onChange={(e) => setPhoneDigits(formatUzPhone(e.target.value))}
                          placeholder="90 838 37 72"
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-[5.5rem] pr-4 text-sm text-slate-900 font-bold tracking-wide focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!fullName.trim() || phoneDigits.replace(/\s/g, '').length < 9}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md transition-all text-sm flex items-center justify-center gap-2 cursor-pointer mt-4"
                    >
                      Keyingi bosqich <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                )}

                {/* 2-BOSQICH: Sektorni tanlash */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                      {sectors.map((s) => {
                        const Icon = s.icon;
                        const isSelected = selectedSector === s.code;
                        return (
                          <div
                            key={s.code}
                            onClick={() => setSelectedSector(s.code)}
                            className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div
                              className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{s.title}</p>
                              <p className="text-[11px] text-slate-500 truncate">{s.desc}</p>
                            </div>
                            <div
                              className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="py-3 px-4 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleStep2Submit}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-2xl text-xs flex items-center justify-center gap-2"
                      >
                        Do‘kon ma’lumotlariga o‘tish <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 3-BOSQICH: Do'kon ma'lumotlari */}
                {currentStep === 3 && (
                  <form onSubmit={handleFinish} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Do‘kon / Korxona nomi</label>
                      <input
                        type="text"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder={currentSectorObj.storePlaceholder}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Faoliyat turi</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setBusinessType('retail')}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            businessType === 'retail'
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          <Store className="h-3.5 w-3.5" />
                          <span>Chakana Do‘kon</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setBusinessType('wholesale')}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            businessType === 'wholesale'
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          <Building2 className="h-3.5 w-3.5" />
                          <span>Ulgurji Ombor</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Manzil yoki Viloyat (ixtiyoriy)</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Masalan: Farg‘ona viloyati, Toshloq tumani"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="py-3 px-4 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading || !storeName.trim()}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <span>Do‘konni ochish</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
