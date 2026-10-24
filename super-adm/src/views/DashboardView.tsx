import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Send, 
  Globe, 
  MapPin, 
  Receipt, 
  RefreshCw, 
  ArrowUpRight, 
  ShieldCheck, 
  Clock,
  ChevronRight
} from 'lucide-react';
import { adminApi } from '../lib/api';
import { DashboardData } from '../types';

interface DashboardViewProps {
  onNavigateToTenants: () => void;
}

export function formatUZS(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(Math.round(amount || 0)) + " so'm";
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateToTenants }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getDashboardMetrics();
      setData(res as any);
    } catch (err: any) {
      setError(err.message || 'Metrikalarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-mono">Katta Data Paneli yuklanmoqda...</span>
      </div>
    );
  }

  const summary = data?.summary || {
    total_tenants: 0,
    active_tenants: 0,
    total_revenue: 0,
    today_revenue: 0,
    total_sales_count: 0,
    average_check: 0
  };

  const sources = data?.sources || {
    telegram_bot: 0,
    web_browser: 0,
    telegram_percentage: 0,
    web_percentage: 0
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>B2B Katta Data va Boshqaruv Paneli</span>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono">
              Real-vaqt
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Barcha ro'yxatdan o'tgan dorixonalar, ularning qayerdan (Telegram/Veb) kelganligi va umumiy daromadlari tahlili
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yangilash</span>
          </button>

          <button
            onClick={onNavigateToTenants}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-600/30 transition-all"
          >
            <span>Barcha Bizneslar</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-300 p-3 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* 1. KATTA METRIKALAR (KPI CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Jami Dorixonalar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Jami B2B Dorixonalar</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white font-mono">{summary.total_tenants}</span>
            <span className="text-xs text-slate-400 ml-1.5">ta biznes</span>
          </div>
          <div className="mt-2 flex items-center space-x-1.5 text-[11px] text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{summary.active_tenants} tasi faol faoliyatda</span>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-600/5 rounded-full blur-xl group-hover:bg-blue-600/10 transition-all" />
        </div>

        {/* Jami Aylanma (Gross Revenue) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Jami Savdo Aylanmasi (GMV)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-emerald-400 font-mono tracking-tight">
              {formatUZS(summary.total_revenue)}
            </span>
          </div>
          <div className="mt-2 flex items-center space-x-1.5 text-[11px] text-slate-400">
            <Receipt className="w-3.5 h-3.5 text-blue-400" />
            <span>{summary.total_sales_count} ta chek orqali amalga oshgan</span>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-600/5 rounded-full blur-xl group-hover:bg-emerald-600/10 transition-all" />
        </div>

        {/* Bugungi Tushum */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Bugungi Kunlik Aylanma</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-amber-300 font-mono tracking-tight">
              {formatUZS(summary.today_revenue)}
            </span>
          </div>
          <div className="mt-2 flex items-center space-x-1.5 text-[11px] text-slate-400">
            <span>O'rtacha chek:</span>
            <span className="font-mono text-slate-200 font-semibold">{formatUZS(summary.average_check)}</span>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-amber-600/5 rounded-full blur-xl group-hover:bg-amber-600/10 transition-all" />
        </div>

        {/* Manbalar: Bot vs Veb */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Ro'yxatdan O'tish Manbasi</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-[#229ED9]">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-xl font-bold text-white font-mono">{sources.telegram_bot}</span>
              <span className="text-xs text-sky-400 ml-1">Bot ({sources.telegram_percentage}%)</span>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-white font-mono">{sources.web_browser}</span>
              <span className="text-xs text-slate-400 ml-1">Veb ({sources.web_percentage}%)</span>
            </div>
          </div>
          <div className="mt-2.5 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
            <div className="bg-[#229ED9] h-full" style={{ width: `${sources.telegram_percentage}%` }} />
            <div className="bg-slate-600 h-full" style={{ width: `${sources.web_percentage}%` }} />
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-sky-600/5 rounded-full blur-xl group-hover:bg-sky-600/10 transition-all" />
        </div>
      </div>

      {/* 2. O'RTA QISM: MANBALAR & HUDUDLAR TAHLILI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Qayerdan o'tganligi: Manba taqsimoti */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
              <Send className="w-4 h-4 text-sky-400" />
              <span>Ro'yxatdan O'tgan Manbalar (Kanallar)</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Jami: {summary.total_tenants} ta</span>
          </div>

          <div className="space-y-3">
            {/* Telegram Bot */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#229ED9]/15 border border-[#229ED9]/30 flex items-center justify-center text-[#229ED9]">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-xs">Telegram Bot (@biznesgo_bot)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Bot orqali telefon va WebApp tasdiqlagan dorixonalar</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-sky-300 font-mono">{sources.telegram_bot}</span>
                <span className="text-xs text-slate-400 block font-mono">{sources.telegram_percentage}%</span>
              </div>
            </div>

            {/* Veb Brauzer */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-xs">Veb Brauzer (Veb Panel)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Brauzer orqali to'g'ridan-to'g'ri ro'yxatdan o'tganlar</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-purple-300 font-mono">{sources.web_browser}</span>
                <span className="text-xs text-slate-400 block font-mono">{sources.web_percentage}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Viloyatlar va Hududlar bo'yicha taqsimot */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Hududlar Kesimida Dorixonalar &amp; Daromad</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">{data?.regions?.length || 0} ta hudud</span>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {data?.regions?.map((reg, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-800/40 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2.5 transition-all text-xs">
                <div className="flex items-center space-x-2.5">
                  <span className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center text-[10px] font-mono text-slate-400 font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-medium text-slate-200">{reg.region}</span>
                    <span className="ml-2 text-[10px] text-slate-400 font-mono">({reg.tenant_count} ta dorixona)</span>
                  </div>
                </div>
                <div className="font-mono font-semibold text-emerald-400">
                  {formatUZS(reg.total_revenue)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. QUYI QISM: ENG KO'P DAROMAD QILAYOTGAN TOP DORIXONALAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Eng Ko'p Daromad Qilayotgan TOP Dorixonalar</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">B2B platforma orqali amalga oshirilgan savdo aylanmalari bo'yicha yetakchilar</p>
          </div>
          <button
            onClick={onNavigateToTenants}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
          >
            <span>Barchasini ko'rish</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3 font-semibold">O'rin</th>
                <th className="px-4 py-3 font-semibold">Dorixona Nomi</th>
                <th className="px-4 py-3 font-semibold">Hudud (Viloyat)</th>
                <th className="px-4 py-3 font-semibold">Manba</th>
                <th className="px-4 py-3 font-semibold">Cheklar Soni</th>
                <th className="px-4 py-3 font-semibold text-right">Jami Aylanma (Daromad)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {data?.top_tenants?.map((t, idx) => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-400">
                    <span className={`w-5 h-5 rounded-md inline-flex items-center justify-center text-[10px] ${
                      idx === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      idx === 1 ? 'bg-slate-700 text-slate-200' :
                      idx === 2 ? 'bg-amber-900/30 text-amber-600' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-white">
                    {t.name}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {t.region}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                      t.source === 'telegram_bot'
                        ? 'bg-sky-950/50 text-sky-300 border-sky-800/60'
                        : 'bg-purple-950/50 text-purple-300 border-purple-800/60'
                    }`}>
                      {t.source === 'telegram_bot' ? <Send className="w-2.5 h-2.5 text-sky-400" /> : <Globe className="w-2.5 h-2.5 text-purple-400" />}
                      <span>{t.source === 'telegram_bot' ? 'Telegram Bot' : 'Veb Brauzer'}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">
                    {t.sales_count} ta
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-400 text-right">
                    {formatUZS(t.total_revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

