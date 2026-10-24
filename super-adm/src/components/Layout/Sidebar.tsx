import React from 'react';
import { 
  Users, 
  ShieldCheck, 
  FileText, 
  Building2, 
  Layers, 
  CreditCard, 
  MessageSquare, 
  Sliders, 
  Sparkles,
  Lock
} from 'lucide-react';
import { AdminUser } from '../../types';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  user: AdminUser;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, user }) => {
  const isSuperAdmin = user.role === 'super_admin';

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            S
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">BiznesGo</h1>
            <p className="text-[10px] text-blue-400 font-mono font-medium uppercase tracking-wider">Super Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 text-xs">
        {/* Phase 2: Boshqaruv & Katta Data Paneli */}
        <div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
            Boshqaruv &amp; Katta Data
          </div>
          <div className="space-y-1">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Layers className="w-4 h-4" />
                <span>Katta Data Paneli</span>
              </div>
              <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                Data
              </span>
            </button>

            <button
              onClick={() => onTabChange('tenants')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-all ${
                currentTab === 'tenants'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Building2 className="w-4 h-4" />
                <span>Bizneslar &amp; Daromad</span>
              </div>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                B2B
              </span>
            </button>
          </div>
        </div>

        {/* Phase 1 Core Foundation */}
        <div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
            Poydevor &amp; Xavfsizlik
          </div>
          <div className="space-y-1">
            <button
              onClick={() => onTabChange('admins')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-all ${
                currentTab === 'admins'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Users className="w-4 h-4" />
                <span>Adminlar va Rollar</span>
              </div>
              {isSuperAdmin && (
                <span className="text-[10px] bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded font-mono">
                  RBAC
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('audit')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-all ${
                currentTab === 'audit'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <FileText className="w-4 h-4" />
                <span>Audit Jurnali</span>
              </div>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                Log
              </span>
            </button>
          </div>
        </div>

        {/* Phase 3 & 4 Preview */}
        <div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
            Katalog &amp; Moliya (Reja)
          </div>
          <div className="space-y-1 text-slate-500">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-500 cursor-not-allowed">
              <div className="flex items-center space-x-2.5">
                <Layers className="w-4 h-4 opacity-50" />
                <span>Katalog &amp; Dublikat</span>
              </div>
              <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">3-bosqich</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-500 cursor-not-allowed">
              <div className="flex items-center space-x-2.5">
                <CreditCard className="w-4 h-4 opacity-50" />
                <span>Obuna &amp; To'lovlar</span>
              </div>
              <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">4-bosqich</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-500 cursor-not-allowed">
              <div className="flex items-center space-x-2.5">
                <MessageSquare className="w-4 h-4 opacity-50" />
                <span>Bot E'lonlari &amp; Support</span>
              </div>
              <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">4-bosqich</span>
            </div>
          </div>
        </div>

        {/* Phase 5 & B2C Future */}
        <div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
            Tizim &amp; Kelajak
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-500 cursor-not-allowed">
              <div className="flex items-center space-x-2.5">
                <Sliders className="w-4 h-4 opacity-50" />
                <span>Sektor sozlamalari</span>
              </div>
              <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">5-bosqich</span>
            </div>

            {/* B2C Module Disabled Pill */}
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950/40 border border-dashed border-slate-800 text-slate-600 cursor-not-allowed">
              <div className="flex items-center space-x-2.5">
                <Lock className="w-3.5 h-3.5 text-slate-600" />
                <span className="font-medium">B2C Moduli</span>
              </div>
              <span className="text-[9px] bg-amber-900/30 text-amber-500 px-1.5 py-0.5 rounded font-mono">
                O'chiq
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Profile Footprint */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 text-xs shrink-0">
              {user.full_name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">{user.full_name}</p>
              <div className="flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-mono uppercase">{user.role}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

