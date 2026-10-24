import React from 'react';
import { Building2, Layers, ShieldCheck, ArrowRight } from 'lucide-react';
import { AdminUser } from '../types';

interface DashboardPlaceholderProps {
  user: AdminUser;
  onNavigateToAdmins: () => void;
}

export const DashboardPlaceholder: React.FC<DashboardPlaceholderProps> = ({ user, onNavigateToAdmins }) => {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-slate-900 to-indigo-950/40 border border-blue-800/40 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-medium mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>1-bosqich yakunlandi: Poydevor &amp; Xavfsizlik</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Xush kelibsiz, {user.full_name}!
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Super Admin boshqaruv tizimi muvaffaqiyatli ishga tushdi. Hozirda 1-bosqich (Adminlar, RBAC ruxsatlar matritsasi, Sezgir ma'lumotlar audit jurnali) to'liq faol.
            </p>
          </div>

          <button
            onClick={onNavigateToAdmins}
            className="self-start md:self-auto flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-600/30 transition-all"
          >
            <span>Adminlarni ko'rish</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5-Phase Roadmap Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Super Admin Rivojlanish Rejasi</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-4">
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">1-bosqich (Tayyor)</div>
            <div className="font-semibold text-white text-xs mt-1">Poydevor &amp; RBAC</div>
            <p className="text-[11px] text-slate-400 mt-1">Kirish, 2FA (TOTP), Adminlar, Audit jurnali, Sezgir ma'lumotlar maskalanishi.</p>
          </div>

          <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-4">
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">2-bosqich (Navbatdagi)</div>
            <div className="font-semibold text-white text-xs mt-1">Boshqaruv</div>
            <p className="text-[11px] text-slate-400 mt-1">Dashboard, Dorixonalar (Bizneslar), Foydalanuvchilar, Bloklash/Faollashtirish.</p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 opacity-70">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">3-bosqich</div>
            <div className="font-semibold text-white text-xs mt-1">Katalog &amp; Ma'lumot</div>
            <p className="text-[11px] text-slate-400 mt-1">Yagona katalog, So'rovlarni tasdiqlash, Dublikatlarni birlashtirish.</p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 opacity-70">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">4-bosqich</div>
            <div className="font-semibold text-white text-xs mt-1">Pul &amp; Aloqa</div>
            <p className="text-[11px] text-slate-400 mt-1">Obunalar, Tariflar, Hisob-fakturalar, Telegram bot orqali e'lonlar, Support.</p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 opacity-70">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">5-bosqich</div>
            <div className="font-semibold text-white text-xs mt-1">Tizim &amp; B2C</div>
            <p className="text-[11px] text-slate-400 mt-1">Sektor sozlamalari, Feature flags, Tizim holati (Sentry/Backup), B2C moduli.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

