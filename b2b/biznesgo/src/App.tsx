import React from 'react';
import uzLocale from './locales/uz.json';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-6">
      <header className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-emerald-400">{uzLocale.app_name}</h1>
          <p className="text-xs text-slate-400 font-medium">{uzLocale.sector_title}</p>
        </div>
        <span className="text-[11px] bg-emerald-950 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-800">
          v0.0.1
        </span>
      </header>

      <main className="my-auto text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl font-black">
          BG
        </div>
        <h2 className="text-2xl font-bold text-white">{uzLocale.welcome}</h2>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">{uzLocale.status_v0}</p>
      </main>

      <footer className="text-center text-xs text-slate-500 border-t border-slate-800 pt-4 flex items-center justify-between">
        <span>&copy; 2026 BiznesGO. Barcha huquqlar himoyalangan.</span>
        <span className="font-mono text-[10px] text-slate-500">v0.0.1</span>
      </footer>
    </div>
  );
};

