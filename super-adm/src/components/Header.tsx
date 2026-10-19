import React, { useState } from 'react';
import { Search, Bell, Key, Check, ShieldCheck, X } from 'lucide-react';
import { api } from '../lib/api';

interface HeaderProps {
  onSearch?: (q: string) => void;
  showKeyModal: boolean;
  setShowKeyModal: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearch, showKeyModal, setShowKeyModal }) => {
  const [keyInput, setKeyInput] = useState(api.getKey());
  const [saved, setSaved] = useState(false);
  const [searchVal, setSearchVal] = useState('');

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
            placeholder="Search your today analysis"
            className="w-full pl-11 pr-4 py-2.5 bg-white/90 rounded-full text-xs text-slate-800 placeholder-slate-400 shadow-xs border border-slate-200/50 focus:outline-none focus:ring-2 focus:ring-black/10 transition"
          />
        </div>

        {/* Right: Notifications & User Avatar */}
        <div className="flex items-center gap-3">
          {/* Notifications Pill */}
          <button
            onClick={() => setShowKeyModal(true)}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/90 rounded-full text-xs font-medium text-slate-700 shadow-xs border border-slate-200/50 hover:bg-white transition cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 text-slate-600" />
            <span>Notifications</span>
            <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 text-[10px] font-bold flex items-center justify-center">
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
            <span className="font-semibold text-slate-800">Admin</span>
          </button>

          {/* User Profile Avatar */}
          <div className="w-9 h-9 rounded-full ring-2 ring-white shadow-xs overflow-hidden cursor-pointer">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80"
              alt="Admin Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>

      {/* Admin Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSaveKey}
            className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Admin Kaliti (X-Admin-Key)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-black flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Super Admin API so'rovlarini tasdiqlash uchun maxfiy kalit. Kalit brauzeringizda xavfsiz saqlanadi.
            </p>

            <div>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Admin kalitini kiriting..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-black font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-black transition"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={saved}
                className="px-5 py-2 bg-black text-white hover:bg-neutral-800 text-xs font-semibold rounded-full shadow-sm transition flex items-center gap-1.5"
              >
                {saved ? <Check className="w-4 h-4" /> : null}
                <span>{saved ? 'Saqlandi' : 'Saqlash'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
