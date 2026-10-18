import React, { useState } from 'react';
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
  ShieldCheck,
  CheckCircle2
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

const BUSINESS_TYPE_OPTIONS: { id: BusinessType; title: string; desc: string; icon: React.ElementType; color: string }[] = [
  {
    id: 'agro_vet',
    title: 'Agro-Vet dorixona',
    desc: 'O‘g‘itlar, himoya vositalari va veterinariya dori-darmonlari',
    icon: Sprout,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'feed',
    title: 'Yem-Ozuqa savdosi',
    desc: 'Chorva va parranda ozuqalari (Qop, tonna, kg hisobida)',
    icon: Scale,
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'warehouse',
    title: 'Ulgurji ombor',
    desc: 'Katta partiyalar, ulgurji & chakana narxlar, yirik qarzlar nazorati',
    icon: Building2,
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'seeds',
    title: 'Urug‘ va Ko‘chatlar',
    desc: 'Mavsumiy navlar, unuvchanlik foizi va sertifikatlar nazorati',
    icon: Wheat,
    color: 'from-lime-500 to-green-600',
  },
  {
    id: 'machinery',
    title: 'Agro-Texnika va Jihozlar',
    desc: 'Traktor ehtiyot qismlari, agregatlar va kafolatli uskunalar',
    icon: Wrench,
    color: 'from-slate-600 to-zinc-700',
  },
];

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess, telegramOnboarding }) => {
  const { setMerchant, addToast } = useStore();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  // Form states
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(telegramOnboarding?.first_name || '');
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('agro_vet');

  const isTgOnboarding = Boolean(telegramOnboarding);

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
        if (!phone.trim() || !password || !storeName.trim() || !fullName.trim()) {
          addToast('Barcha maydonlarni to‘ldiring', 'error');
          setLoading(false);
          return;
        }

        const res = await api.auth.register({
          phone: phone.trim(),
          password,
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
          {!isTgOnboarding && (
            <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
              <button
                type="button"
                onClick={() => setTab('login')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  tab === 'login'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tizimga kirish
              </button>
              <button
                type="button"
                onClick={() => setTab('register')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  tab === 'register'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Yangi do‘kon ochish
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {(isTgOnboarding || tab === 'register') && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Biznes yo‘nalishini tanlang *
                  </label>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {BUSINESS_TYPE_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = businessType === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => {
                            setBusinessType(opt.id);
                            tg.hapticImpact('light');
                          }}
                          className={`cursor-pointer rounded-xl border p-3 flex flex-col justify-between transition-all ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                              <Icon className="w-5 h-5" />
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            )}
                          </div>
                          <div className="mt-2">
                            <h4 className="text-sm font-bold text-slate-900">
                              {opt.title}
                            </h4>
                            <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                              {opt.desc}
                            </p>
                          </div>
                        </div>
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
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {!isTgOnboarding && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Parol *
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Xavfsiz B2B Cloud Tizimi — Neon PostgreSQL</span>
          </div>
        </div>
      </div>
    </div>
  );
};

