import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Key, 
  Check, 
  ShieldCheck, 
  X,
  Store,
  MessageSquare,
  MapPin,
  TrendingUp,
  ArrowRight,
  LogOut,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { api } from '../lib/api';

interface HeaderProps {
  onSearch?: (q: string) => void;
  showKeyModal: boolean;
  setShowKeyModal: (open: boolean) => void;
  onNavigate?: (view: 'dashboard' | 'merchants' | 'map' | 'broadcast' | 'archive' | 'support') => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onSearch, 
  showKeyModal, 
  setShowKeyModal,
  onNavigate,
  onLogout 
}) => {
  const adminProfile = api.getAdmin();
  const [activeModalTab, setActiveModalTab] = useState<'profile' | 'key'>('profile');
  const [keyInput, setKeyInput] = useState(api.getKey());
  const [saved, setSaved] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  // Credentials update state
  const [currentPass, setCurrentPass] = useState('');
  const [newUsername, setNewUsername] = useState(adminProfile?.username || 'admin');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isUpdatingCreds, setIsUpdatingCreds] = useState(false);
  const [credError, setCredError] = useState('');
  const [credSuccess, setCredSuccess] = useState('');

  const handleUpdateCreds = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredError('');
    setCredSuccess('');

    if (!currentPass || !newUsername.trim() || !newPass) {
      setCredError("Barcha maydonlarni to‘ldiring");
      return;
    }

    if (newPass !== confirmPass) {
      setCredError("Yangi parollar bir-biriga mos kelmadi");
      return;
    }

    if (newPass.length < 6) {
      setCredError("Yangi parol kamida 6 ta belgidan iborat bo‘lsin");
      return;
    }

    setIsUpdatingCreds(true);
    try {
      const res = await api.updateCredentials({
        current_password: currentPass,
        new_username: newUsername.trim(),
        new_password: newPass,
      });

      setCredSuccess(res.message || "Login va parol muvaffaqiyatli yangilandi!");
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setTimeout(() => {
        setCredSuccess('');
        setShowKeyModal(false);
      }, 1500);
    } catch (err: any) {
      setCredError(err.message || "Yangilashda xatolik yuz berdi");
    } finally {
      setIsUpdatingCreds(false);
    }
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    api.setKey(keyInput);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setShowKeyModal(false);
      window.location.reload();
    }, 800);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchVal.trim() && onNavigate) {
      onNavigate('merchants');
    }
  };

  return (
    <>
      <header className="h-20 bg-transparent flex items-center justify-between px-6 sm:px-10 shrink-0">
        {/* Left: Search pill */}
        <div className="relative w-72 sm:w-88">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchVal}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="Do‘kon, telefon yoki tahlillarni qidirish..."
            className="w-full pl-11 pr-4 py-2.5 bg-white/90 rounded-full text-xs text-slate-800 placeholder-slate-400 shadow-xs border border-slate-200/50 focus:outline-none focus:ring-2 focus:ring-black/10 transition"
          />
        </div>

        {/* Right: Notifications & User Avatar */}
        <div className="flex items-center gap-3 relative">
          {/* Notifications Pill */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/90 rounded-full text-xs font-medium text-slate-700 shadow-xs border border-slate-200/50 hover:bg-white transition cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 text-slate-600" />
            <span>Bildirishnomalar</span>
            <span className="w-5 h-5 rounded-full bg-[#22C55E] text-black text-[10px] font-black flex items-center justify-center">
              4
            </span>
          </button>

          {/* Admin Status Pill */}
          <button
            onClick={() => setShowKeyModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-white rounded-full text-xs font-medium text-slate-700 shadow-xs border border-slate-200/50 hover:bg-slate-50 transition cursor-pointer"
            title="Admin Kalitini tekshirish"
          >
            <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
            <span className="font-semibold text-slate-800">Super Admin</span>
          </button>

          {/* User Profile Avatar */}
          <div 
            onClick={() => setShowKeyModal(true)}
            className="w-9 h-9 rounded-full ring-2 ring-white shadow-xs overflow-hidden cursor-pointer" 
            title="Super Admin Profili & Kalit"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80"
              alt="Admin Profili"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Logout Chiqish Tugmasi */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-full text-xs font-bold transition cursor-pointer border border-rose-200 shadow-2xs"
              title="Tizimdan chiqish"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          )}

          {/* Bildirishnomalar Popover */}
          {showNotifications && (
            <div className="absolute right-0 top-14 z-50 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-black" />
                  <h4 className="text-xs font-bold text-slate-900">Platforma Bildirishnomalari</h4>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 hover:text-black flex items-center justify-center cursor-pointer text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {/* 1. Yangi do'konlar */}
                <div 
                  onClick={() => {
                    setShowNotifications(false);
                    if (onNavigate) onNavigate('merchants');
                  }}
                  className="p-3 bg-[#F8F8F6] rounded-2xl hover:bg-slate-100 transition cursor-pointer flex items-start gap-2.5"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Store className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Yangi B2B Do‘konlar</div>
                    <div className="text-[11px] text-slate-500">105 ta do‘kon bazada faol</div>
                  </div>
                </div>

                {/* 2. Yangi murojaatlar */}
                <div 
                  onClick={() => {
                    setShowNotifications(false);
                    if (onNavigate) onNavigate('support');
                  }}
                  className="p-3 bg-[#F8F8F6] rounded-2xl hover:bg-slate-100 transition cursor-pointer flex items-start gap-2.5"
                >
                  <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Murojaatlar & Chat</div>
                    <div className="text-[11px] text-slate-500">Telegram va Webdan kelgan xabarlar</div>
                  </div>
                </div>

                {/* 3. Viloyatlar qamrovi */}
                <div 
                  onClick={() => {
                    setShowNotifications(false);
                    if (onNavigate) onNavigate('map');
                  }}
                  className="p-3 bg-[#F8F8F6] rounded-2xl hover:bg-slate-100 transition cursor-pointer flex items-start gap-2.5"
                >
                  <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Hududiy Qamrov</div>
                    <div className="text-[11px] text-slate-500">14 ta viloyat bo‘yicha B2B xaritasi</div>
                  </div>
                </div>

                {/* 4. Neon DB Savdolari */}
                <div 
                  onClick={() => {
                    setShowNotifications(false);
                    if (onNavigate) onNavigate('dashboard');
                  }}
                  className="p-3 bg-[#F8F8F6] rounded-2xl hover:bg-slate-100 transition cursor-pointer flex items-start gap-2.5"
                >
                  <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Savdo Aylanmasi</div>
                    <div className="text-[11px] text-slate-500">53M+ UZS savdolar va kassa cheklari</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Super Admin Sozlamalari & Parol Yangilash Modali */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-5 h-5 text-[#22C55E]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">Super Admin Sozlamalari</h3>
                  <div className="text-[11px] text-slate-500">Login, parol va xavfsizlik boshqaruvi</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-black flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex p-1 bg-[#F6F6F3] rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveModalTab('profile')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeModalTab === 'profile'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Login va Parol</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('key')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeModalTab === 'key'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Tizim Kaliti</span>
              </button>
            </div>

            {/* TAB 1: Login va Parolni Yangilash */}
            {activeModalTab === 'profile' && (
              <form onSubmit={handleUpdateCreds} className="space-y-3.5 pt-1">
                {credError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{credError}</span>
                  </div>
                )}

                {credSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span className="font-semibold">{credSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hozirgi Parol (Tasdiqlash uchun)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                      placeholder="admin123"
                      required
                      className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
                    >
                      {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Yangi Login
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="admin"
                        required
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Yangi Parol
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        placeholder="Yangi parol..."
                        required
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Yangi Parolni Qayta Kiriting
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="Parolni tasdiqlang..."
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-black cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingCreds}
                    className="px-5 py-2.5 bg-black text-white hover:bg-slate-800 text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingCreds ? (
                      <span>Saqlanmoqda...</span>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                        <span>Login & Parolni Yangilash</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: Tizim Kaliti (X-Admin-Key) */}
            {activeModalTab === 'key' && (
              <form onSubmit={handleSaveKey} className="space-y-4 pt-1">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Super Admin API endpointlariga so‘rov yuborish uchun maxfiy kalitni kiriting:
                </p>

                <div className="space-y-1.5">
                  <input
                    type="password"
                    placeholder="AgrozAdmin_2026_Prod_9f3b8c"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Ushbu kalit brauzeringizning xavfsiz xotirasida (localStorage) saqlanadi.
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-black cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-black text-white hover:bg-neutral-800 text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {saved ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                        <span>Saqlandi!</span>
                      </>
                    ) : (
                      <span>Kalitni Saqlash</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
