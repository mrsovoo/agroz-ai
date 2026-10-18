import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { PlatformStats } from '../types';
import {
  Store,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Package,
  Layers,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('uz-UZ').format(Math.round(val)) + " so'm";
  };

  const businessTypeLabels: Record<string, string> = {
    agro_vet: 'Agro-Vet Dorixona',
    feed: 'Yem-Ozuqa',
    warehouse: 'Ombor & Ulgurji',
    seeds: "Urug' & Ko'chat",
    machinery: 'Jihoz & Texnika',
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
        <p className="text-slate-400">Platforma ko'rsatkichlari yuklanmoqda...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center max-w-lg mx-auto mt-10">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-red-200 mb-1">Xatolik</h3>
        <p className="text-slate-300 text-sm mb-4">{error}</p>
        <button
          onClick={loadStats}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg text-sm"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Super Admin Dashboard</h1>
          <p className="text-slate-400 text-sm">BiznesGO B2B platformasi umumiy faolligi va statistikasi</p>
        </div>
        <button
          onClick={loadStats}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium transition"
        >
          <RefreshCw className="w-4 h-4" />
          Yangilash
        </button>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stores */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-400">Jami Do'konlar</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{stats.merchants.total_merchants}</div>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle className="w-3.5 h-3.5" /> {stats.merchants.active_merchants} faol
            </span>
            <span className="flex items-center gap-1 text-red-400 font-medium">
              <XCircle className="w-3.5 h-3.5" /> {stats.merchants.blocked_merchants} blok
            </span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-400">Jami Savdo Summasi</span>
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{formatMoney(stats.sales.total_sales_amount)}</div>
          <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
            <span>Bugun: </span>
            <span className="text-emerald-400 font-semibold">{formatMoney(stats.sales.today_sales_amount)}</span>
          </div>
        </div>

        {/* Open Debts */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-400">Ochiq Qarzlar</span>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400">{formatMoney(stats.debts.total_open_debt_amount)}</div>
          <div className="text-xs text-slate-400 mt-2">
            Jami {stats.debts.open_debts_count} ta ochiq qarz yozuvi
          </div>
        </div>

        {/* Products & Inventory */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-400">Ombordagi Mahsulotlar</span>
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{stats.products.total_products_count} ta</div>
          <div className="text-xs text-slate-400 mt-2">
            Bahosi: {formatMoney(stats.products.total_inventory_value)}
          </div>
        </div>
      </div>

      {/* Grid: Business Types & Daily Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Type Distribution */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">Biznes Yo'nalishlari Bo'yicha</h2>
          </div>
          <div className="space-y-3">
            {stats.by_business_type.map((bt) => {
              const pct = stats.merchants.total_merchants > 0
                ? Math.round((bt.count / stats.merchants.total_merchants) * 100)
                : 0;
              return (
                <div key={bt.business_type} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300 font-medium">
                      {businessTypeLabels[bt.business_type] || bt.business_type}
                    </span>
                    <span className="text-slate-400 font-semibold">{bt.count} ta ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-700/60 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7-Day Sales Trend */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-semibold text-white">Oxirgi 7 Kunlik Savdolar</h2>
          </div>
          <div className="space-y-3">
            {stats.daily_trend.map((day) => {
              const maxAmount = Math.max(...stats.daily_trend.map((d) => d.amount), 1);
              const barWidth = Math.max(Math.round((day.amount / maxAmount) * 100), 4);
              return (
                <div key={day.date} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">{day.date}</span>
                    <span className="text-slate-200 font-medium">
                      {formatMoney(day.amount)} ({day.sales_count} savdo)
                    </span>
                  </div>
                  <div className="w-full bg-slate-700/60 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

