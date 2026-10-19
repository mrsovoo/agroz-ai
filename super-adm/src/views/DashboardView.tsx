import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { PlatformStats, RecentSaleItem } from '../types';
import {
  Calendar,
  SlidersHorizontal,
  ArrowUpRight,
  RefreshCw,
  Search,
  ChevronDown,
  X,
  Store,
  DollarSign,
  TrendingUp,
  Receipt,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate?: (view: 'dashboard' | 'merchants' | 'map' | 'broadcast' | 'archive' | 'support') => void;
}

const UZ_DAYS = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];

const SECTOR_LABELS: Record<string, string> = {
  agro_vet: 'Agro-Vet',
  feed: 'Yem-Ozuqa',
  warehouse: 'Ulgurji Ombor',
  seeds: 'Urug‘chilik',
  machinery: 'Jihoz & Texnika',
};

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'Oylik' | 'Haftalik'>('Oylik');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('Joriy Oy, 2026');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<RecentSaleItem | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Statistikani yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('uz-UZ').format(Math.round(val || 0)) + " so'm";
  };

  const formatUZS = (val: number) => {
    if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(1) + 'B';
    if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
    if (val >= 1_000) return (val / 1_000).toFixed(1) + 'K';
    return String(Math.round(val));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px]">
        <RefreshCw className="w-8 h-8 text-black animate-spin mb-3" />
        <p className="text-slate-500 text-xs font-medium">Boshqaruv tahlillari yuklanmoqda...</p>
      </div>
    );
  }

  // Real hisoblangan ma'lumotlar (Neon DB dan)
  const totalSalesAmount = stats?.sales?.total_sales_amount || 0;
  const todayRevenue = stats?.sales?.today_sales_amount || 0;
  const activeMerchants = stats?.merchants?.active_merchants || 0;
  const totalMerchants = stats?.merchants?.total_merchants || 0;

  // Real kunlik savdo trendi (Oxirgi 7 kun Neon DB'dan)
  const trendData = stats?.daily_trend || [];
  const maxTrendAmount = Math.max(...trendData.map((t) => t.amount), 1);

  const days = trendData.length > 0
    ? trendData.map((t) => {
        const d = new Date(t.date);
        const dayLabel = UZ_DAYS[d.getDay()] || 'Dush';
        const isPeak = t.amount === maxTrendAmount && t.amount > 0;
        const heightPct = maxTrendAmount > 0 
          ? Math.max(16, Math.min(96, Math.round((t.amount / maxTrendAmount) * 94))) + '%' 
          : '16%';
        return {
          label: dayLabel,
          height: heightPct,
          isPeak,
          value: t.amount > 0 ? formatUZS(t.amount) : '0',
          fullDate: t.date,
          amount: t.amount,
          salesCount: t.sales_count,
        };
      })
    : [
        { label: 'Dush', height: '48%', isPeak: false, value: '0', fullDate: '', amount: 0, salesCount: 0 },
        { label: 'Sesh', height: '62%', isPeak: false, value: '0', fullDate: '', amount: 0, salesCount: 0 },
        { label: 'Chor', height: '38%', isPeak: false, value: '0', fullDate: '', amount: 0, salesCount: 0 },
        { label: 'Pay', height: '94%', isPeak: true, value: '0', fullDate: '', amount: 0, salesCount: 0 },
        { label: 'Jum', height: '42%', isPeak: false, value: '0', fullDate: '', amount: 0, salesCount: 0 },
        { label: 'Shan', height: '58%', isPeak: false, value: '0', fullDate: '', amount: 0, salesCount: 0 },
      ];

  // Real sektorlar matritsasi (stats.by_business_type asosida)
  const byTypeMap: Record<string, { count: number; active_count: number }> = {};
  (stats?.by_business_type || []).forEach((b) => {
    byTypeMap[b.business_type] = { count: b.count, active_count: b.active_count };
  });

  const channels = [
    { 
      key: 'agro_vet', 
      name: 'Agro-Vet', 
      stats: byTypeMap['agro_vet'] || { count: 0, active_count: 0 },
      cells: ['bg-[#22C55E]', 'bg-[#22C55E]', 'bg-slate-300', 'bg-black'] 
    },
    { 
      key: 'feed', 
      name: 'Yem-Ozuqa', 
      stats: byTypeMap['feed'] || { count: 0, active_count: 0 },
      cells: ['bg-slate-200/80', 'bg-[#22C55E]', 'bg-black', 'bg-black'] 
    },
    { 
      key: 'warehouse', 
      name: 'Ulgurji Ombor', 
      stats: byTypeMap['warehouse'] || { count: 0, active_count: 0 },
      cells: ['bg-[#22C55E]', 'bg-[#22C55E]', 'bg-slate-300', 'bg-slate-600'] 
    },
    { 
      key: 'seeds', 
      name: 'Urug‘chilik', 
      stats: byTypeMap['seeds'] || { count: 0, active_count: 0 },
      cells: ['bg-slate-300', 'bg-slate-200/80', 'bg-slate-500', 'bg-black'] 
    },
    { 
      key: 'machinery', 
      name: 'Jihoz & Texnika', 
      stats: byTypeMap['machinery'] || { count: 0, active_count: 0 },
      cells: ['bg-slate-200/80', 'bg-[#22C55E]', 'bg-black', 'bg-slate-400'] 
    },
  ];

  // Real savdolar (stats.recent_sales dan)
  const recentSalesList = stats?.recent_sales || [];

  const handleExportCSV = () => {
    const headers = ['Operatsiya ID', 'Do‘kon', 'Sektor', 'Summa (so‘m)', 'To‘lov Turi', 'Sana'];
    const rows = recentSalesList.map((s) => [
      s.id,
      `"${s.store_name}"`,
      `"${SECTOR_LABELS[s.business_type] || s.business_type}"`,
      s.amount,
      s.payment_type === 'debt' ? 'Nasiya' : 'To‘landi',
      `"${new Date(s.created_at).toLocaleString('uz-UZ')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `biznesgo_savdolar_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">
      {/* Sarlavha & Filtrlar Boshqaruvi */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Savdolar<br />Tahlili
          </h1>
        </div>

        {/* Boshqaruv tugmalari */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sana oralig'i Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-xs font-semibold text-slate-800 shadow-xs border border-slate-200/60 hover:bg-slate-50 cursor-pointer transition"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-400 font-normal">Sana:</span>
              <span>{selectedDateRange}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showDateDropdown && (
              <div className="absolute top-10 right-0 z-40 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 space-y-1 text-xs">
                {['Bugun', 'Oxirgi 7 kun', 'Joriy Oy, 2026', 'Jami Davr'].map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setSelectedDateRange(range);
                      setShowDateDropdown(false);
                      loadStats();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer font-medium ${
                      selectedDateRange === range ? 'bg-black text-white font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Voronka Davri Pill */}
          <button
            onClick={() => {
              setSelectedPeriod((prev) => (prev === 'Oylik' ? 'Haftalik' : 'Oylik'));
              loadStats();
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-full text-xs font-semibold text-slate-800 shadow-xs border border-slate-200/60 hover:bg-slate-50 cursor-pointer transition"
            title="Voronka davrini almashtirish (Oylik / Haftalik)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>{selectedPeriod}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Eksport tugmasi */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-full text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <span>Excel / CSV Eksport</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3 ta Yuqori Bento Kartochkasi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Kartochka 1: Qora Asosiy Kartochka */}
        <div 
          onClick={() => onNavigate && onNavigate('merchants')}
          className="bg-black text-white rounded-[32px] p-6 sm:p-7 shadow-lg flex flex-col justify-between min-h-[175px] relative overflow-hidden group cursor-pointer"
          title="Do'konlar bo'limiga o'tish"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-400">
              Yechib olish uchun mavjud
            </span>
            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {formatCurrency(totalSalesAmount).replace(" so'm", "")}
              <span className="text-lg font-bold text-slate-400 ml-1">SO'M</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              Aylanma • {activeMerchants} ta faol agro-do‘kon savdosi
            </p>
          </div>
        </div>

        {/* Kartochka 2: Bugungi tushum */}
        <div 
          onClick={() => onNavigate && onNavigate('merchants')}
          className="bg-white text-slate-900 rounded-[32px] p-6 sm:p-7 shadow-xs border border-slate-200/60 flex flex-col justify-between min-h-[175px] group hover:shadow-md transition cursor-pointer"
          title="Do'konlar bo'limiga o'tish"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-500">
              Bugungi tushum
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              {formatCurrency(todayRevenue).replace(" so'm", "")}
              <span className="text-lg font-bold text-slate-400 ml-1">SO'M</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              Kassa • Bugungi savdo va to‘lov tushumlari
            </p>
          </div>
        </div>

        {/* Kartochka 3: Bugungi faol seanslar / Do'konlar */}
        <div 
          onClick={() => onNavigate && onNavigate('merchants')}
          className="bg-white text-slate-900 rounded-[32px] p-6 sm:p-7 shadow-xs border border-slate-200/60 flex flex-col justify-between min-h-[175px] group hover:shadow-md transition cursor-pointer"
          title="Do'konlar bo'limiga o'tish"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-500">
              Faol savdo nuqtalari
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              {activeMerchants}
              <span className="text-xl font-medium text-slate-400 ml-2">do‘kon</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              Platforma • Jami ro‘yxatdan o‘tgan: {totalMerchants} ta
            </p>
          </div>
        </div>
      </div>

      {/* O'rta qator: Savdo Voronkasi va Sektorlar Matritsasi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chap Bento: Savdo Voronkasi Diagrammasi */}
        <div className="bg-white rounded-[32px] p-6 sm:p-7 shadow-xs border border-slate-200/60 flex flex-col justify-between">
          {/* Card Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Savdo Voronkasi</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">Real Neon DB haftalik savdo dinamikasi</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedPeriod((prev) => (prev === 'Oylik' ? 'Haftalik' : 'Oylik'))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
              >
                <span>{selectedPeriod}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Diagramma ustunlari */}
          <div className="h-56 sm:h-60 flex items-end justify-between gap-1.5 sm:gap-3 px-1 sm:px-3 pt-8 pb-2">
            {days.map((d, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-3 h-full justify-end">
                {/* Ustun */}
                <div 
                  className="w-full max-w-[56px] relative flex flex-col items-center justify-end h-full"
                  title={`${d.fullDate}: ${formatCurrency(d.amount)} (${d.salesCount} ta savdo)`}
                >
                  {d.isPeak && (
                    <div className="absolute -top-7 px-3 py-0.5 rounded-full bg-black text-white text-[11px] font-bold tracking-tight shadow-md animate-bounce">
                      {d.value}
                    </div>
                  )}
                  <div
                    style={{ height: d.height }}
                    className={`w-full rounded-2xl transition-all duration-500 cursor-pointer ${
                      d.isPeak
                        ? 'bg-[#22C55E] shadow-sm hover:brightness-105'
                        : 'bg-slate-200/70 hover:bg-slate-300'
                    }`}
                  ></div>
                </div>

                {/* Kun nomi */}
                <span
                  className={`text-xs font-semibold ${
                    d.isPeak ? 'text-[#22C55E]' : 'text-slate-400'
                  }`}
                >
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* O'ng Bento: Yo'nalishlar Bo'yicha Matritsa (Heatmap) */}
        <div className="bg-white rounded-[32px] p-6 sm:p-7 shadow-xs border border-slate-200/60 flex flex-col justify-between">
          {/* Card Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Buyurtmalar & Yo‘nalishlar</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">5 ta biznes sektori bo‘yicha faollik ko‘rsatkichlari</p>
            </div>

            <button
              onClick={() => onNavigate && onNavigate('map')}
              className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-black cursor-pointer"
            >
              <span>Xaritada ko‘rish</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Matritsa paneli */}
          <div className="space-y-3 my-auto">
            {channels.map((ch) => (
              <div 
                key={ch.key} 
                onClick={() => onNavigate && onNavigate('merchants')}
                className="flex items-center gap-4 p-2 rounded-2xl hover:bg-slate-50 transition cursor-pointer"
                title={`${ch.name}: Jami ${ch.stats.count} ta do'kon (${ch.stats.active_count} faol)`}
              >
                <div className="w-28 text-xs font-semibold text-slate-800 truncate">
                  <div>{ch.name}</div>
                  <div className="text-[10px] text-slate-400">{ch.stats.count} ta do‘kon</div>
                </div>
                <div className="flex-1 grid grid-cols-4 gap-2.5">
                  {ch.cells.map((cellColor, cIdx) => (
                    <div
                      key={cIdx}
                      className={`h-9 rounded-2xl ${cellColor} transition-transform hover:scale-105 cursor-pointer shadow-2xs`}
                    ></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pastki Bento: So'nggi Savdo Operatsiyalari (Real Neon DB Transactions) */}
      <div className="bg-white rounded-[32px] p-6 sm:p-7 shadow-xs border border-slate-200/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">So‘nggi Savdo Operatsiyalari</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Real Neon DB kassa cheklari va qarz to‘lovlari ({recentSalesList.length} ta operatsiya)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadStats()}
              className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 bg-white hover:bg-slate-50 cursor-pointer"
              title="Yangilash"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Eksport</span>
            </button>
          </div>
        </div>

        {/* Jadval */}
        <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
          <table className="w-full text-left text-xs min-w-[620px]">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 text-[11px] font-semibold uppercase">
                <th className="pb-3 font-semibold">Do‘kon / Hamkor</th>
                <th className="pb-3 font-semibold">Sektor</th>
                <th className="pb-3 font-semibold">Summa</th>
                <th className="pb-3 font-semibold">Holat</th>
                <th className="pb-3 font-semibold">Vaqt</th>
                <th className="pb-3 font-semibold text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentSalesList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Hozircha savdolar yozuvi mavjud emas
                  </td>
                </tr>
              ) : (
                recentSalesList.map((tx) => (
                  <tr 
                    key={tx.id} 
                    onClick={() => setSelectedTransaction(tx)}
                    className="hover:bg-slate-50/70 transition cursor-pointer"
                  >
                    <td className="py-3.5 font-bold text-slate-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 font-bold">
                        {tx.store_name ? tx.store_name[0] : 'D'}
                      </div>
                      <div>
                        <div>{tx.store_name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">Savdo #{tx.id}</div>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {SECTOR_LABELS[tx.business_type] || tx.business_type}
                      </span>
                    </td>
                    <td className="py-3.5 font-bold text-slate-900">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`px-3 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.payment_type !== 'debt'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {tx.payment_type !== 'debt' ? 'To‘landi' : 'Nasiya'}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-500 font-medium">
                      {new Date(tx.created_at).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' }) + ', ' + new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTransaction(tx);
                        }}
                        className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:text-black hover:bg-slate-200 inline-flex items-center justify-center transition cursor-pointer"
                        title="Tafsilotlarni ko'rish"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Savdo Tafsilotlari Modali */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Savdo Cheki #{selectedTransaction.id}</h3>
              </div>
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-black flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-[#F8F8F6] rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Do‘kon nomi:</span>
                <span className="font-bold text-slate-900">{selectedTransaction.store_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sektor:</span>
                <span className="font-semibold text-slate-800">{SECTOR_LABELS[selectedTransaction.business_type] || selectedTransaction.business_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">To‘lov turi:</span>
                <span className="font-semibold text-slate-800 uppercase">{selectedTransaction.payment_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sana va vaqt:</span>
                <span className="text-slate-700">{new Date(selectedTransaction.created_at).toLocaleString('uz-UZ')}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-700">Jami Summa:</span>
                <span className="font-black text-slate-900 text-sm">{formatCurrency(selectedTransaction.amount)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedTransaction(null);
                  if (onNavigate) onNavigate('merchants');
                }}
                className="w-full py-2.5 bg-black hover:bg-slate-800 text-white rounded-full text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Do‘kon profiliga o‘tish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
