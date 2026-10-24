import React from 'react';
import { AlertTriangle, Wallet, Users } from 'lucide-react';
import { formatUZS } from '../lib/api';
import { BiznesGoLogo } from './BiznesGoLogo';

interface HeaderProps {
  todayRevenue: number;
  criticalExpiryCount: number;
  totalDebt: number;
  onNavigateTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  todayRevenue,
  criticalExpiryCount,
  totalDebt,
  onNavigateTab
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Rasmiy BiznesGO Logotipi va Sektor Tag */}
        <div className="flex items-center space-x-3">
          <BiznesGoLogo className="h-8 w-auto shrink-0" />
          <div className="hidden sm:block border-l border-slate-200 pl-3">
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Agro-Vet Dorixona
            </span>
            <p className="text-[10px] text-slate-400 font-medium">B2B 1-Sektor</p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center space-x-3">
          {/* Bugungi Kassa */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-[10px] uppercase font-bold text-emerald-700">Kassa</div>
              <div className="text-xs font-bold text-emerald-950 font-mono">{formatUZS(todayRevenue)}</div>
            </div>
          </div>

          {/* 30 Kunlik FEFO Ogohlantirish */}
          <button
            onClick={() => onNavigateTab('dashboard')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition ${
              criticalExpiryCount > 0
                ? 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <AlertTriangle className={`w-4 h-4 ${criticalExpiryCount > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold text-slate-500">FEFO Muddat</div>
              <div className="text-xs font-bold">
                {criticalExpiryCount > 0 ? (
                  <span className="text-rose-700">{criticalExpiryCount} ta xavf (≤30 kun)</span>
                ) : (
                  <span>Joyida</span>
                )}
              </div>
            </div>
          </button>

          {/* Qarz balansi */}
          <button
            onClick={() => onNavigateTab('debts')}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
          >
            <Users className="w-4 h-4 text-slate-600" />
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold text-slate-500">Nasiya</div>
              <div className="text-xs font-bold text-slate-900 font-mono">{formatUZS(totalDebt)}</div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
