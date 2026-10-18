import React from 'react';
import { LayoutDashboard, Store, Send, ShieldAlert, Key } from 'lucide-react';

interface SidebarProps {
  currentView: 'dashboard' | 'merchants' | 'broadcast';
  onSelectView: (view: 'dashboard' | 'merchants' | 'broadcast') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSelectView }) => {
  const menuItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'merchants' as const, label: "Do'konlar (Merchants)", icon: Store },
    { id: 'broadcast' as const, label: 'Push Xabarnoma', icon: Send },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0">
      <div>
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/40">
            <ShieldAlert className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="font-bold text-white text-base tracking-tight">Super Admin</span>
            <span className="block text-[10px] text-emerald-400 uppercase font-mono tracking-widest font-semibold">BiznesGO B2B</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  active
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 text-xs text-slate-500 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-400 font-medium">
          <Key className="w-3.5 h-3.5 text-emerald-400" />
          <span>Super Admin Access</span>
        </div>
        <div>Neon DB • Railway • Dual Bot</div>
      </div>
    </aside>
  );
};

