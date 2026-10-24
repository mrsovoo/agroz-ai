import React, { useState, useEffect, useRef } from 'react';
import { api, setToken, setUser, formatUzbekPhone, cleanPhone } from '../lib/api';
import { BiznesGoLogo } from '../components/BiznesGoLogo';
import {
  Pill,
  Store,
  Phone,
  User,
  MapPin,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Send,
  Lock,
  ArrowLeft,
  RotateCw,
  Loader2,
  ExternalLink
} from 'lucide-react';

interface AuthViewProps {
  onAuthSuccess: (tenant: any, token: string) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'phone' | 'otp' | 'waiting_bot'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Form states
  const [loginPhone, setLoginPhone] = useState('+998 ');
  const [otpCode, setOtpCode] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [cooldown, setCooldown] = useState(0);

  // Register form state (Agro-Vet Dorixona)
  const [pharmacyName, setPharmacyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('+998 ');
  const [address, setAddress] = useState('');

  // Waiting Bot Session state
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionBotUrl, setSessionBotUrl] = useState<string | null>(null);
  const pollIntervalRef = useRef<any>(null);

  // Cooldown timer for OTP
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Clean polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Telegram WebApp ichida ochilganda avtomatik autentifikatsiya
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg?.initData && tg.initData.length > 5) {
      setLoading(true);
      api.telegramAuth(tg.initData)
        .then((data) => {
          onAuthSuccess(data.tenant, data.token);
        })
        .catch((err) => {
          console.warn('Telegram avto-kirishda xatolik:', err);
          if (tg.initDataUnsafe?.user) {
            const u = tg.initDataUnsafe.user;
            setOwnerName(`${u.first_name || ''} ${u.last_name || ''}`.trim());
          }
        })
        .finally(() => setLoading(false));
    }
  }, []);

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const selStart = e.currentTarget.selectionStart || 0;
    const selEnd = e.currentTarget.selectionEnd || 0;
    if (e.key === 'Backspace' && selStart <= 5 && selEnd <= 5) {
      e.preventDefault();
    }
  };

  // 1. KIRISH: Telefon kiritilgach Telegram bot orqali OTP so'rash
  const handleSendLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const cleaned = cleanPhone(loginPhone);
    if (!cleaned || cleaned.length < 13) {
      setError('Iltimos, telefon raqamni to\'liq kiriting (+998 90 000 0000)');
      return;
    }

    setLoading(true);
    try {
      const res = await api.sendOtp(cleaned);
      setStep('otp');
      setCooldown(60);
      setOtpCode('');
      setInfoMessage(
        res.sent_to_bot
          ? 'Tasdiqlash kodi Telegram botingizga (@biznesgo_bot) yuborildi'
          : 'Tasdiqlash kodi tayyorlandi. @biznesgo_bot ga /start bosing.'
      );
    } catch (err: any) {
      setError(err.message || 'Tasdiqlash kodini yuborishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // 2. KIRISH: OTP kodni tasdiqlash
  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleaned = cleanPhone(loginPhone);
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setError('Iltimos, 6 xonali tasdiqlash kodini to\'liq kiriting');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyOtp(cleaned, otpCode.trim(), rememberDevice);
      onAuthSuccess(res.tenant, res.token);
    } catch (err: any) {
      setError(err.message || 'Tasdiqlash kodi noto\'g\'ri yoki muddati tugagan');
    } finally {
      setLoading(false);
    }
  };

  // 3. RO'YXATDAN O'TISH: Ma'lumotlarni kiritib, to'g'ridan-to'g'ri Telegram Botga o'tish
  const handleRegisterToBot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pharmacyName.trim()) {
      setError('Dorixona nomini kiritishingiz shart');
      return;
    }

    const cleaned = cleanPhone(registerPhone);
    if (!cleaned || cleaned.length < 13) {
      setError('Aloqa telefon raqamini to\'liq kiriting (+998 90 000 0000)');
      return;
    }

    setLoading(true);
    try {
      const session = await api.createRegisterSession({
        name: pharmacyName.trim(),
        owner_name: ownerName.trim() || undefined,
        phone: cleaned,
        address: address.trim() || undefined
      });

      setSessionToken(session.token);
      setSessionBotUrl(session.bot_url);
      setStep('waiting_bot');

      // Botga o'tish (yangi oynada ochish)
      window.open(session.bot_url, '_blank');

      // Brauzerda tasdiqlashni kutish (har 2 soniyada tekshirish)
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusRes = await api.checkSessionStatus(session.token);
          if (statusRes.status === 'approved' && statusRes.token && statusRes.tenant) {
            clearInterval(pollIntervalRef.current);
            setToken(statusRes.token, rememberDevice);
            setUser(statusRes.tenant, rememberDevice);
            onAuthSuccess(statusRes.tenant, statusRes.token);
          } else if (statusRes.status === 'expired') {
            clearInterval(pollIntervalRef.current);
            setError('Tasdiqlash vaqti tugadi. Iltimos qaytadan urinib ko\'ring.');
            setStep('phone');
          }
        } catch (_) {}
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Ro\'yxatdan o\'tish sessiyasini yaratishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return;
    const cleaned = cleanPhone(loginPhone);
    setLoading(true);
    setError(null);
    try {
      const res = await api.sendOtp(cleaned);
      setCooldown(60);
      setInfoMessage(
        res.sent_to_bot
          ? 'Yangi tasdiqlash kodi Telegram botingizga yuborildi'
          : 'Yangi kod tayyorlandi. @biznesgo_bot ga /start bosing.'
      );
    } catch (err: any) {
      setError(err.message || 'Qayta kod yuborishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fafafa] flex items-center justify-center p-4 sm:p-6 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Yuqori Qism: Logo va Sektor Belgisi */}
        <div className="flex flex-col items-center text-center space-y-2">
          <BiznesGoLogo className="h-8 w-auto" />
          <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
            <Pill className="w-3.5 h-3.5 text-emerald-600" />
            <span>Agro-Vet Dorixona</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Kassa, ombor va muddat monitoringi
          </p>
        </div>

        {/* Tab Switcher: Faqat oddiy qadamda ko'rinadi */}
        {step === 'phone' && (
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setInfoMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Kirish
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setInfoMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Yangi Dorixona
            </button>
          </div>
        )}

        {/* Xatolik Xabari */}
        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-[11px] font-medium animate-in fade-in">
            {error}
          </div>
        )}

        {/* Ma'lumot Xabari */}
        {infoMessage && (
          <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl text-[11px] font-medium animate-in fade-in">
            {infoMessage}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 1. KIRISH REJIMI (Minimal: Faqat telefon + Eslab qolish + OTP)           */}
        {/* ========================================================================= */}
        {mode === 'login' && step === 'phone' && (
          <form onSubmit={handleSendLoginOtp} className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Telefon Raqam
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="+998 90 000 0000"
                  value={loginPhone}
                  onKeyDown={handlePhoneKeyDown}
                  onChange={(e) => setLoginPhone(formatUzbekPhone(e.target.value))}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-black tracking-wide"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Tasdiqlash kodi Telegram (@biznesgo_bot) orqali keladi
              </span>
            </div>

            {/* Qurilmani eslab qolish katakchasi */}
            <div className="flex items-center space-x-2 pt-1 select-none">
              <input
                type="checkbox"
                id="remember_login"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="w-4 h-4 rounded text-black border-slate-300 focus:ring-black cursor-pointer"
              />
              <label htmlFor="remember_login" className="text-[11px] font-medium text-slate-600 cursor-pointer">
                Ushbu qurilmani eslab qolish
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-black hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <span>{loading ? 'Yuborilmoqda...' : 'Kodni Olish'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* KIRISH: OTP KODINI KIRITISH */}
        {mode === 'login' && step === 'otp' && (
          <form onSubmit={handleVerifyLoginOtp} className="space-y-4 text-xs animate-in fade-in duration-200">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-sky-50 border border-sky-200 text-[#229ED9] flex items-center justify-center mx-auto mb-2">
                <Lock className="w-5 h-5 text-[#229ED9]" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Telegram Kodini Kiriting</h3>
              <p className="text-[11px] text-slate-500">
                <span className="font-bold text-slate-700">{loginPhone}</span> raqamiga biriktirilgan Telegram (@biznesgo_bot) hisobiga kod yuborildi.
              </p>
            </div>

            <div>
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                placeholder="••••••"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full py-3 bg-slate-50 border-2 border-slate-200 focus:border-black rounded-2xl font-mono font-bold text-center text-xl tracking-widest text-slate-900 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="w-full py-3 rounded-2xl bg-black hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <span>{loading ? 'Tekshirilmoqda...' : 'Tasdiqlash va Kirish'}</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setError(null);
                  setInfoMessage(null);
                }}
                className="flex items-center space-x-1 text-slate-500 hover:text-slate-900 font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Raqamni o'zgartirish</span>
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={cooldown > 0 || loading}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-bold disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{cooldown > 0 ? `${cooldown}s` : 'Qayta yuborish'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* 2. YANGI DORIXONA REJIMI (Barcha ma'lumotlar + Eng tagida Bot Tasdiqlash) */}
        {/* ========================================================================= */}
        {mode === 'register' && step === 'phone' && (
          <form onSubmit={handleRegisterToBot} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Dorixona Nomi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Masalan: Agro-Vet Markaz"
                  value={pharmacyName}
                  onChange={(e) => setPharmacyName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Mas'ul Shaxs F.I.Sh.
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Masalan: Rustam Qodirov"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Aloqa Telefon Raqam <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="+998 90 000 0000"
                  value={registerPhone}
                  onKeyDown={handlePhoneKeyDown}
                  onChange={(e) => setRegisterPhone(formatUzbekPhone(e.target.value))}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold text-slate-900 text-xs tracking-wide"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Manzil
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Viloyat, tuman..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs"
                />
              </div>
            </div>

            {/* Qurilmani eslab qolish katakchasi */}
            <div className="flex items-center space-x-2 pt-1 select-none">
              <input
                type="checkbox"
                id="remember_register"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="remember_register" className="text-[11px] font-medium text-slate-600 cursor-pointer">
                Ushbu qurilmani eslab qolish
              </label>
            </div>

            <div className="p-2 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-[11px] text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Veterinariya kassa va FEFO monitoringi biriktiriladi (toza 0 holatda)</span>
            </div>

            {/* ENG TAGIDA: TELEGRAM BOTGA O'TIB TASDIQLASH TUGMASI */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-[#229ED9] hover:bg-[#1e8ec3] text-white font-bold text-xs shadow-md shadow-sky-500/20 transition flex items-center justify-center space-x-2 cursor-pointer active:scale-98 disabled:opacity-50 mt-1"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Bog\'lanmoqda...' : 'Telegram Botda Tasdiqlash va Ochish'}</span>
            </button>
          </form>
        )}

        {/* RO'YXATDAN O'TISH: TELEGRAM BOTDA TASDIQLASHNI KUTISH */}
        {mode === 'register' && step === 'waiting_bot' && (
          <div className="space-y-4 text-center py-2 animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-full bg-sky-50 border-2 border-sky-200 text-[#229ED9] flex items-center justify-center mx-auto relative">
              <Send className="w-7 h-7 text-[#229ED9] -translate-x-0.5 translate-y-0.5" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                <Loader2 className="w-3 h-3 text-white animate-spin" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">Telegram orqali Tasdiqlash Kutilmoqda...</h3>
              <p className="text-[11px] text-slate-500">
                <span className="font-bold text-slate-700">{pharmacyName}</span> dorixonasi ma'lumotlari botga uzatildi.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-[11px] text-slate-600 text-left space-y-1 font-mono">
              <div>🏢 Dorixona: <span className="font-bold text-slate-800">{pharmacyName}</span></div>
              <div>📱 Telefon: <span className="font-bold text-slate-800">{registerPhone}</span></div>
              <div className="text-[10px] text-emerald-700 pt-1">
                Botda "Tasdiqlash" bosilishi bilan brauzer avtomatik toza 0 holatda ochiladi.
              </div>
            </div>

            {sessionBotUrl && (
              <a
                href={sessionBotUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>Telegram Botni Qayta Ochish</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                setStep('phone');
              }}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold pt-1"
            >
              &larr; Orqaga qaytish va tahrirlash
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
