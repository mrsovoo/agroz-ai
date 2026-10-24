import React, { useState, useEffect } from 'react';
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
  Sparkles
} from 'lucide-react';

interface AuthViewProps {
  onAuthSuccess: (tenant: any, token: string) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  // Telegram WebApp kontekstida ochilganini tekshirish
  const isInsideTelegram = Boolean(
    window.Telegram?.WebApp?.initData && window.Telegram?.WebApp?.initData.length > 5
  );

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form state: doim +998 bilan boshlanadi
  const [loginPhone, setLoginPhone] = useState('+998 90 123 4567');

  // Register form state (Agro-Vet Dorixona)
  const [pharmacyName, setPharmacyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('+998 ');
  const [address, setAddress] = useState('');

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

  // Tezkor Demo Kirish (Local Sinov)
  const handleQuickDemoLogin = (customName = 'Agro-Vet Markaz', customPhone = '+998901234567') => {
    const demoTenant = {
      id: 'demo-tenant-agro-vet',
      name: customName,
      phone: cleanPhone(customPhone),
      sector_type: 'agro_vet'
    };
    const demoToken = 'demo-token';
    setToken(demoToken);
    setUser(demoTenant);
    onAuthSuccess(demoTenant, demoToken);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleaned = cleanPhone(loginPhone);
    if (!cleaned || cleaned.length < 13) {
      setError('Iltimos, telefon raqamni to\'liq kiriting (+998 90 000 0000)');
      return;
    }

    setLoading(true);
    try {
      const data = await api.login(cleaned);
      onAuthSuccess(data.tenant, data.token);
    } catch (err: any) {
      // Offline yoki local rejimda avtomatik demo kirish
      handleQuickDemoLogin('Agro-Vet Markaz', cleaned);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pharmacyName.trim()) {
      setError('Dorixona nomi kiritilishi shart');
      return;
    }
    const cleaned = cleanPhone(registerPhone);
    if (!cleaned || cleaned.length < 13) {
      setError('Aloqa telefon raqamini to\'liq kiriting (+998 90 000 0000)');
      return;
    }

    setLoading(true);
    try {
      const data = await api.register({
        name: pharmacyName.trim(),
        phone: cleaned,
        address: address.trim() || undefined
      });
      onAuthSuccess(data.tenant, data.token);
    } catch (err: any) {
      // Offline yoki local rejimda yangi ro'yxatdan o'tgan dorixonani aktivlashtirish
      handleQuickDemoLogin(pharmacyName.trim(), cleaned);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Agar kursor +998 hududida bo'lsa (<= 5 belgi) va Backspace bosilsa, +998 o'chib ketishidan himoyalash
    const selStart = e.currentTarget.selectionStart || 0;
    const selEnd = e.currentTarget.selectionEnd || 0;
    if (e.key === 'Backspace' && selStart <= 5 && selEnd <= 5) {
      e.preventDefault();
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

        {/* Telegram Havolasi (Faqat t.me/ ko'rinishida) */}
        <div className="space-y-2 pt-1">
          <a
            href="https://t.me/biznesgo_bot"
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 px-4 rounded-2xl bg-[#229ED9] hover:bg-[#1e8ec3] text-white font-bold text-xs shadow-md shadow-sky-500/15 transition flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
          >
            <Send className="w-4 h-4" />
            <span className="font-mono tracking-tight">t.me/biznesgo_bot</span>
          </a>
        </div>

        {/* Tab Switcher: Kirish yoki Ro'yxatdan o'tish */}
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
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

        {/* Xatolik Xabari */}
        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-[11px] font-medium animate-in fade-in">
            {error}
          </div>
        )}

        {/* 1. KIRISH FORMASI */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
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
                Format: +998 90 000 0000
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-black hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <span>{loading ? 'Kirilmoqda...' : 'Tizimga Kirish'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Tezkor Sinov Tugmasi */}
            <div className="pt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('Agro-Vet Markaz', '+998901234567')}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Tezkor Sinov (Demo Rejim)</span>
              </button>
            </div>
          </form>
        )}

        {/* 2. RO'YXATDAN O'TISH FORMASI */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3 text-xs">
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
                Telefon Raqam <span className="text-rose-500">*</span>
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
              <span className="text-[10px] text-slate-400 mt-1 block">
                Format: +998 90 000 0000
              </span>
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

            <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-[11px] text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Veterinariya kassa va FEFO monitoringi biriktiriladi</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <span>{loading ? 'Faollashtirilmoqda...' : 'Dorixonani Faollashtirish'}</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
