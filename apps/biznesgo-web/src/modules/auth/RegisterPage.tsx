import React, { useState } from 'react';
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
} from 'lucide-react';
import type { SectorCode } from '../../core/types';

export const RegisterPage: React.FC = () => {
  const { registerBusiness } = useApp();
  const navigate = useNavigate();

  // Web uchun: Login yoki Yangi Ro'yxatdan o'tish
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginPhone, setLoginPhone] = useState('90 123 45 67');
  const [loginPassword, setLoginPassword] = useState('123456');

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
  const [businessType, setBusinessType] = useState<'retail' | 'wholesale'>('retail'); // Do'kon yoki Ulgurji

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

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || phoneDigits.replace(/\s/g, '').length < 9) return;
    setCurrentStep(2);
  };

  const handleStep2Submit = () => {
    setCurrentStep(3);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerBusiness({
      name: 'Agro Biznes Markazi',
      phone: loginPhone.startsWith('+998') ? loginPhone : `+998 ${loginPhone}`,
      sector: 'pharmacy',
      storeType: 'retail',
    });
    navigate('/');
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) return;

    registerBusiness({
      name: storeName,
      phone: `+998 ${phoneDigits}`,
      sector: selectedSector,
    });

    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#1c1d21] flex items-center justify-center p-3 sm:p-6 antialiased">
      <div className="w-full max-w-5xl bg-white rounded-[28px] sm:rounded-[36px] overflow-hidden shadow-2xl flex flex-col lg:flex-row border border-slate-100">
        
        {/* CHAP TOMON: Yashil Brend Banneri */}
        <div className="lg:w-[46%] bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-950 p-6 sm:p-10 flex flex-col justify-between text-white relative overflow-hidden min-h-[360px] lg:min-h-[620px]">
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
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Biznesingizni boshlang
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm font-medium leading-relaxed max-w-sm">
              Savdo, ombor, qarzlar daftari va kassa hisobotlarini o‘z sohangizga moslashtirilgan holda boshqaring.
            </p>
          </div>

          {/* Pastki qism: 3 ta qadam indikatori */}
          <div className="relative z-10 grid grid-cols-3 gap-2 pt-4">
            <div
              className={`p-3 rounded-2xl transition-all ${
                currentStep === 1
                  ? 'bg-white text-slate-900 shadow-lg'
                  : 'bg-white/15 backdrop-blur-md text-white border border-white/10'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 ${
                  currentStep === 1 ? 'bg-emerald-600 text-white' : 'bg-white/30 text-white'
                }`}
              >
                1
              </div>
              <p className="text-[11px] font-bold leading-tight">Ism va Nomer</p>
            </div>

            <div
              className={`p-3 rounded-2xl transition-all ${
                currentStep === 2
                  ? 'bg-white text-slate-900 shadow-lg'
                  : 'bg-white/15 backdrop-blur-md text-white border border-white/10'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 ${
                  currentStep === 2 ? 'bg-emerald-600 text-white' : 'bg-white/30 text-white'
                }`}
              >
                2
              </div>
              <p className="text-[11px] font-bold leading-tight">Sektorni tanlash</p>
            </div>

            <div
              className={`p-3 rounded-2xl transition-all ${
                currentStep === 3
                  ? 'bg-white text-slate-900 shadow-lg'
                  : 'bg-white/15 backdrop-blur-md text-white border border-white/10'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 ${
                  currentStep === 3 ? 'bg-emerald-600 text-white' : 'bg-white/30 text-white'
                }`}
              >
                3
              </div>
              <p className="text-[11px] font-bold leading-tight">Do‘kon ma’lumotlari</p>
            </div>
          </div>
        </div>

        {/* O'NG TOMON: Forma */}
        <div className="lg:w-[54%] p-6 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">
            
            {/* Tizimga kirish (Login) vs Yangi Ro'yxatdan o'tish (Web Switcher) */}
            <div className="flex bg-[#f7f7f5] p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-white text-[#111215] shadow-xs'
                    : 'text-neutral-500 hover:text-[#111215]'
                }`}
              >
                Tizimga kirish (Login)
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  authMode === 'register'
                    ? 'bg-white text-[#111215] shadow-xs'
                    : 'text-neutral-500 hover:text-[#111215]'
                }`}
              >
                Yangi do‘kon ochish
              </button>
            </div>

            {/* A. TIZIMGA KIRISH (LOGIN & PAROL REJIMI) */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-2xl font-extrabold text-[#111215] tracking-tight">
                    Xush kelibsiz
                  </h3>
                  <p className="text-xs text-neutral-400 font-medium">
                    Do‘koningizni boshqarish uchun telefon raqam va parolni kiriting.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">Telefon raqam yoki Login</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 flex items-center gap-1.5 text-sm font-bold text-neutral-800 pointer-events-none">
                      <Phone className="h-3.5 w-3.5 text-neutral-400" />
                      <span>+998</span>
                    </div>
                    <input
                      type="tel"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(formatUzPhone(e.target.value))}
                      placeholder="90 123 45 67"
                      required
                      className="w-full bg-[#f7f7f5] border-0 rounded-2xl py-3 pl-[5.5rem] pr-4 text-sm text-[#111215] font-bold tracking-wide focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#35ca56]/30 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">Parol</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 flex items-center text-neutral-400 pointer-events-none">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Parolingizni kiriting"
                      required
                      className="w-full bg-[#f7f7f5] border-0 rounded-2xl py-3 pl-11 pr-4 text-sm text-[#111215] font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#35ca56]/30 transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#111215] hover:bg-black text-white font-extrabold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-transform active:scale-95"
                >
                  <span>Tizimga kirish</span>
                  <ArrowRight className="h-4 w-4 text-[#35ca56]" />
                </button>

                {/* Telegram Launch App havolasi */}
                <div className="pt-3 border-t border-neutral-100 text-center space-y-2">
                  <p className="text-[11px] text-neutral-400 font-semibold">
                    yoki Telegram orqali bitta bosishda oching:
                  </p>
                  <a
                    href="https://t.me/biznesgo_bot"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-2xl bg-[#eafaf0] text-[#1f7a34] hover:bg-[#d2f5dc] text-xs font-black transition-colors"
                  >
                    <span>Telegram Launch App orqali kirish</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </form>
            )}

            {/* B. YANGI RO'YXATDAN O'TISH REJIMI */}
            {authMode === 'register' && (
              <>
                {/* Sarlavha */}
                <div className="space-y-1">
                  <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider">
                    {currentStep}-bosqich / 3 dan
                  </span>
                  <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {currentStep === 1 && 'Shaxsiy ma’lumotlar'}
                    {currentStep === 2 && 'Faoliyat sohangizni tanlang'}
                    {currentStep === 3 && `${currentSectorObj.title}`}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {currentStep === 1 && 'Ismingiz va telefon raqamingizni kiriting.'}
                    {currentStep === 2 && 'Do‘koningiz qaysi soha bo‘yicha faoliyat olib boradi?'}
                    {currentStep === 3 && 'Savdo turi (do‘kon yoki ulgurji ombor) va manzilni kiriting.'}
                  </p>
                </div>

            {/* 1-BOSQICH: Ism va Nomer (+998 avto) */}
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
                      placeholder="90 123 45 67"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-[5.5rem] pr-4 text-sm text-slate-900 font-bold tracking-wide focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!fullName.trim() || phoneDigits.replace(/\s/g, '').length < 9}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white font-bold py-3.5 px-6 rounded-2xl shadow-md shadow-emerald-600/25 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  Keyingi bosqich <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}

            {/* 2-BOSQICH: Sektorni tanlash */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
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

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" /> Orqaga
                  </button>
                  <button
                    type="button"
                    onClick={handleStep2Submit}
                    className="w-2/3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-2xl shadow-md shadow-emerald-600/25 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Tanlandi, davom etish <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* 3-BOSQICH: Do'kon yoki Ulgurji Ombor tanlovi */}
            {currentStep === 3 && (
              <form onSubmit={handleFinish} className="space-y-4">
                {/* Savdo turi: Do'kon yoki Ulgurji ombor */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Savdo faoliyati turi</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => setBusinessType('retail')}
                      className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                        businessType === 'retail'
                          ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <Store className={`h-5 w-5 ${businessType === 'retail' ? 'text-emerald-700' : 'text-slate-500'}`} />
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-tight">Chakana Do‘kon</p>
                        <p className="text-[10px] text-slate-500">Do‘kon & savdo joyi</p>
                      </div>
                    </div>

                    <div
                      onClick={() => setBusinessType('wholesale')}
                      className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                        businessType === 'wholesale'
                          ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <Building2 className={`h-5 w-5 ${businessType === 'wholesale' ? 'text-emerald-700' : 'text-slate-500'}`} />
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-tight">Ulgurji Ombor</p>
                        <p className="text-[10px] text-slate-500">Optom ombor & tarqatish</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Do'kon nomi */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {businessType === 'wholesale' ? 'Ulgurji ombor / Kompaniya nomi' : 'Do‘kon / Savdo nuqtasi nomi'}
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder={
                      businessType === 'wholesale'
                        ? 'Masalan: Agro Optom Markaziy Ombor'
                        : currentSectorObj.storePlaceholder
                    }
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                  />
                </div>

                {/* Manzil */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Manzil (Viloyat / Tuman)</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Masalan: Toshkent viloyati, Zangiota tumani"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" /> Orqaga
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-2xl shadow-md shadow-emerald-600/25 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Do‘konni ochish <CheckCircle2 className="h-4 w-4" />
                  </button>
                </div>
              </form>
            )}
            </>
          )}

            <p className="text-center text-[11px] text-slate-400 pt-1">
              BiznesGO — agro va savdo bizneslari uchun qulay boshqaruv platformasi.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
