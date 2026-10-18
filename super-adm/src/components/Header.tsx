import React, { useState } from 'react';
import { Key, Check, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';

export const Header: React.FC = () => {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState(api.getKey());
  const [saved, setSaved] = useState(false);

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

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="text-xs font-medium text-slate-300">Neon PostgreSQL • Production Connected</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowKeyModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition"
        >
          <Key className="w-3.5 h-3.5 text-emerald-400" />
          <span>Admin Kaliti</span>
        </button>

        <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-200">super_admin</span>
        </div>
      </div>

      {/* Admin Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={handleSaveKey} className="bg-slate-800 border border-slate-700 rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-emerald-400">
              <Key className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Admin Kalitini Sozlash</h3>
            </div>
            <p className="text-xs text-slate-400">
              API so'rovlari uchun ishlatiladigan `X-Admin-Key` sirli kalitini kiriting (brauzeringizda saqlanadi).
            </p>
            <div>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Admin kaliti..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-slate-300 font-medium"
              >
                Yopish
              </button>
              <button
                type="submit"
                className="flex items-center gap-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs text-white font-medium shadow"
              >
                {saved ? <Check className="w-3.5 h-3.5" /> : null}
                {saved ? 'Saqlandi' : 'Saqlash'}
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  );
};

