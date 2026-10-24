import React from 'react';
import { LogOut, Shield, ShieldCheck } from 'lucide-react';
import { AdminUser } from '../../types';

interface TopBarProps {
  title: string;
  user: AdminUser;
  onLogout: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ title, user, onLogout }) => {
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

      <div className="flex items-center space-x-4">
        {/* Security badge: 2FA */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>2FA Faol (TOTP)</span>
        </div>

        {/* Role Badge */}
        <div className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-xs">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold text-slate-200">{user.role}</span>
        </div>

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

