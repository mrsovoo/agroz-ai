import React from 'react';
import uzLocale from './locales/uz.json';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-8">
      <header className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">{uzLocale.title}</h1>
          <p className="text-xs text-slate-400 font-medium">{uzLocale.subtitle}</p>
        </div>
        <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-full border border-slate-700">
          v0.0.0
        </span>
      </header>

      <main className="my-auto text-center space-y-4">
        <h2 className="text-xl font-semibold text-slate-200">{uzLocale.status_v0}</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Xavfsiz 2FA autentifikatsiyasi va hududiy audit jurnallari tayyorlanmoqda.
        </p>
      </main>

      <footer className="text-center text-xs text-slate-400 border-t border-slate-900 pt-4">
        &copy; 2026 AgrozGO Super Admin. Barcha huquqlar himoyalangan.
      </footer>
    </div>
  );
};
