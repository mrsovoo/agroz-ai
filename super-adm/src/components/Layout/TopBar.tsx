import React from 'react';
import { LogOut, Shield, ShieldCheck, Settings } from 'lucide-react';
import { AdminUser } from '../../types';

interface TopBarProps {
  title: string;
  user: AdminUser;
  onLogout: () => void;
  onOpenSettings?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ title, user, onLogout, onOpenSettings }) => {
  const is2FA = Boolean(user.two_factor_enabled || user.is_2fa_enabled);

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <span>admin.biznesgo.uz</span>
          <span>/</span>
          <span className="text-blue-400 font-medium">{title}</span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Security badge: 2FA */}
        <div className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
          is2FA 
            ? 'bg-emerald-950/50 border-emerald-800/60 text-emerald-300' 
            : 'bg-slate-800/60 border-slate-700 text-slate-400'
        }`}>
          <ShieldCheck className={`w-3.5 h-3.5 ${is2FA ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span>{is2FA ? '2FA Faol' : '2FA O\'chiq'}</span>
        </div>

        {/* Role & Name Badge */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-xs">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold text-slate-200">{user.username || 'admin'}</span>
          <span className="text-slate-500">({user.role})</span>
        </div>

        {/* Sozlamalar (Parol & Profil) */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            title="Profil va parol sozlamalari"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-medium transition-all"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Sozlamalar</span>
          </button>
        )}

        {/* Logout */}
        <button
          onClick={onLogout}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 border border-slate-700 hover:border-red-800/60 text-slate-300 hover:text-red-300 text-xs font-medium transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Chiqish</span>
        </button>
      </div>
    </header>
  );
};

