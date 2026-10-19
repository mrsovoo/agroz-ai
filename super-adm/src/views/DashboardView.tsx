import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { PlatformStats } from '../types';
import {
  Calendar,
  SlidersHorizontal,
  ArrowUpRight,
  RefreshCw,
  Search,
  ChevronDown,
  Store,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  ArrowRight
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'Monthly' | 'Weekly'>('Monthly');

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

  const formatUZS = (val: number) => {
    if (val >= 1_000_000_000) {
      return (val / 1_000_000_000).toFixed(1) + 'B';
    }
    if (val >= 1_000_000) {
      return (val / 1_000_000).toFixed(1) + 'M';
    }
    if (val >= 1_000) {
      return (val / 1_000).toFixed(1) + 'K';
    }
    return val.toLocaleString('uz-UZ');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('uz-UZ').format(Math.round(val)) + " so'm";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px]">
        <RefreshCw className="w-8 h-8 text-black animate-spin mb-3" />
        <p className="text-slate-500 text-xs font-medium">Boshqaruv tahlillari yuklanmoqda...</p>
      </div>
    );
  }

  // Hisoblangan ma'lumotlar
  const totalSalesAmount = stats?.sales?.total_sales_amount || 47399000;
  const todayRevenue = stats?.sales?.today_sales_amount || 3850000;
  const activeMerchants = stats?.merchants?.active_merchants || 95;
  const totalMerchants = stats?.merchants?.total_merchants || 114;
  const totalProducts = stats?.products?.total_products_count || 1840;

  // Chart ma'lumotlari: oxirgi 6 kun
  const days = [
    { label: 'Mon', height: '48%', isPeak: false, value: '110K' },
    { label: 'Tue', height: '62%', isPeak: false, value: '145K' },
    { label: 'Wed', height: '38%', isPeak: false, value: '92K' },
    { label: 'Thu', height: '94%', isPeak: true, value: '243K' }, // Reference highlight in green
    { label: 'Fri', height: '42%', isPeak: false, value: '105K' },
    { label: 'Sat', height: '58%', isPeak: false, value: '138K' },
  ];

  // Sektorlar bo'yicha matrisa qatorlari (Heatmap)
  const channels = [
    { 
      name: 'Agro-Vet', 
      cells: [
        'bg-slate-200/80', 
        'bg-slate-200/80', 
        'bg-[#22C55E]', 
        'bg-slate-200/80'
      ] 
    },
    { 
      name: 'Yem-Ozuqa', 
      cells: [
        'bg-slate-200/80', 
        'bg-[#22C55E]', 
        'bg-black', 
        'bg-black'
      ] 
    },
    { 
      name: 'Ulgurji Ombor', 
      cells: [
        'bg-[#22C55E]', 
        'bg-[#22C55E]', 
        'bg-slate-300', 
        'bg-slate-600'
      ] 
    },
    { 
      name: 'Urug‘chilik', 
      cells: [
        'bg-slate-300', 
        'bg-slate-200/80', 
        'bg-slate-500', 
        'bg-black'
      ] 
    },
  ];

  // So'nggi amallar (Transactions)
  const recentTransactions = [
    { id: 1, store: 'AgroShifo Samarqand', sector: 'Agro-Vet', amount: 450000, time: 'Bugun, 14:15', status: 'To‘landi' },
    { id: 2, store: 'Chinoz Baraka Yem', sector: 'Yem-Ozuqa', amount: 840000, time: 'Bugun, 13:40', status: 'To‘landi' },
    { id: 3, store: 'Optom Baza Toshkent', sector: 'Ombor', amount: 2400000, time: 'Bugun, 12:20', status: 'Nasiya' },
    { id: 4, store: 'Dehqon Bobo Urug‘lari', sector: 'Urug‘chilik', amount: 320000, time: 'Kecha, 18:05', status: 'To‘landi' },
  ];

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">
      {/* Title & Global Controls Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Your Sales<br />Analysis
          </h1>
        </div>

        {/* Action Controls Group matching reference image */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Range Pill */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-xs font-semibold text-slate-800 shadow-xs border border-slate-200/60 hover:bg-slate-50 cursor-pointer transition">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-400 font-normal">Date:</span>
            <span>28 Jan - 29 Jan 2026</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>

          {/* Filter Pill */}
          <div className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-full text-xs font-semibold text-slate-800 shadow-xs border border-slate-200/60 hover:bg-slate-50 cursor-pointer transition">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Funnel</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>

          {/* Black Primary Action Pill */}
          <button
            onClick={() => loadStats()}
            className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-full text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <span>Export as CVS</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3 Top Bento Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Black Hero Card */}
        <div className="bg-black text-white rounded-[32px] p-6 sm:p-7 shadow-lg flex flex-col justify-between min-h-[175px] relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-400">
              Available to payout
            </span>
            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {formatCurrency(totalSalesAmount).replace(" so'm", "")}
              <span className="text-lg font-bold text-slate-400 ml-1">UZS</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              Payout • 95 ta faol agro-do‘kon savdosi
            </p>
          </div>
        </div>

        {/* Card 2: White Card (Today Revenue) */}
        <div className="bg-white text-slate-900 rounded-[32px] p-6 sm:p-7 shadow-xs border border-slate-200/60 flex flex-col justify-between min-h-[175px] group hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-500">
              Today revenue
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              {formatCurrency(todayRevenue).replace(" so'm", "")}
              <span className="text-lg font-bold text-slate-400 ml-1">UZS</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              Payout • Bugungi tushum va kassa cheklari
            </p>
          </div>
        </div>

        {/* Card 3: White Card (Today Sessions / Active Stores) */}
        <div className="bg-white text-slate-900 rounded-[32px] p-6 sm:p-7 shadow-xs border border-slate-200/60 flex flex-col justify-between min-h-[175px] group hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-500">
              Today sessions
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
              Payout • Jami ro‘yxatdan o‘tgan: {totalMerchants} ta
            </p>
          </div>
        </div>
      </div>

      {/* Middle Row: Sales Funnel (Chart) & Orders (Matrix Heatmap) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Bento: Sales Funnel Bar Chart */}
        <div className="bg-white rounded-[32px] p-6 sm:p-7 shadow-xs border border-slate-200/60 flex flex-col justify-between">
          {/* Card Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Sales Funnel</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">Total view per month</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 bg-white">
                <span>Monthly</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 bg-white">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Bar Chart Visualization matching reference screenshot */}
          <div className="h-60 flex items-end justify-between gap-3 px-3 pt-8 pb-2">
            {days.map((d, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-3 h-full justify-end">
                {/* Bar */}
                <div className="w-full max-w-[56px] relative flex flex-col items-center justify-end h-full">
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

                {/* Day Label */}
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

        {/* Right Bento: Orders Heatmap Matrix */}
        <div className="bg-white rounded-[32px] p-6 sm:p-7 shadow-xs border border-slate-200/60 flex flex-col justify-between">
          {/* Card Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Orders</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">Based on social media</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 bg-white">
                <span>Monthly</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 bg-white">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Matrix Grid matching the screenshot mosaic */}
          <div className="space-y-3.5 my-auto">
            {channels.map((ch, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <span className="w-24 text-xs font-semibold text-slate-700 truncate">
                  {ch.name}
                </span>
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

      {/* Bottom Bento: Transactions Table matching reference */}
      <div className="bg-white rounded-[32px] p-6 sm:p-7 shadow-xs border border-slate-200/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Transactions</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">456 Total</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 bg-white">
              <span>Monthly</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
            <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 bg-white">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </div>
            <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 bg-white">
              <Search className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
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
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 font-bold text-slate-900 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 font-bold">
                      {tx.store[0]}
                    </div>
                    <span>{tx.store}</span>
                  </td>
                  <td className="py-3.5">
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                      {tx.sector}
                    </span>
                  </td>
                  <td className="py-3.5 font-bold text-slate-900">
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`px-3 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.status === 'To‘landi'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-500 font-medium">
                    {tx.time}
                  </td>
                  <td className="py-3.5 text-right">
                    <button className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:text-black hover:bg-slate-200 inline-flex items-center justify-center transition">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
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
