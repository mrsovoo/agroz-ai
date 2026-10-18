import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  AlertTriangle, 
  Package, 
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Sale } from '../types';

interface DashboardStats {
  today_revenue: number;
  today_sales_count: number;
  total_products: number;
  low_stock_count: number;
  total_debt: number;
  debtor_count: number;
  sales_last_7_days: { date: string; amount: number; count: number }[];
  recent_sales: Sale[];
  expiring_products?: any[];
}

export const DashboardView: React.FC = () => {
  const { merchant, setCurrentView, addToast } = useStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.dashboard.getStats();
      setStats(data);
    } catch (err: any) {
      addToast(err.message || 'Statistika yuklanmadi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Boshqaruv paneli yuklanmoqda...</p>
      </div>
    );
  }

  const isAgroVet = merchant?.business_type === 'agro_vet';
  const expiring = stats?.expiring_products || [];
  const maxDayAmount = Math.max(...(stats?.sales_last_7_days?.map(d => d.amount) || [1]), 1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header welcome banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-100 border border-emerald-400/30 backdrop-blur-sm mb-2">
                B2B Savdo & Ombor Tizimi
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                {merchant?.store_name}
              </h1>
              <p className="text-emerald-100/80 text-xs sm:text-sm mt-1">
                Bugungi savdo ko‘rsatkichlari va ombor hisob-kitoblari
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('pos')}
                className="bg-white text-emerald-800 hover:bg-emerald-50 px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Tezkor Kassa</span>
              </button>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Agro-Vet Expiry Warning Banner */}
      {isAgroVet && expiring.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-900">
                Muddati yaqinlashayotgan preparatlar ({expiring.length} ta)
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Ushbu dorilarning yaroqlilik muddati 30 kundan kam qolgan yoki o‘tib bo‘lgan. Iltimos, nazorat qiling.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {expiring.slice(0, 4).map((p: any) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 bg-white border border-amber-300 px-2.5 py-1 rounded-lg text-xs font-medium text-amber-800 shadow-2xs"
                  >
                    <span>{p.name}</span>
                    <span className="text-slate-400">|</span>
                    <span className="font-mono text-red-600 font-semibold">{formatDate(p.expiry_date)}</span>
                  </span>
                ))}
                {expiring.length > 4 && (
                  <button
                    onClick={() => setCurrentView('products')}
                    className="text-xs font-bold text-amber-800 hover:underline px-2 py-1"
                  >
                    Barchasi ({expiring.length}) →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bugungi tushum</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg sm:text-2xl font-extrabold text-slate-900">
              {formatCurrency(stats?.today_revenue || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="font-semibold text-emerald-600">{stats?.today_sales_count || 0} ta</span> sotuv amalga oshirildi
            </p>
          </div>
        </div>

        {/* Total Outstanding Debt */}
        <div 
          onClick={() => setCurrentView('debts')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Qarz daftari</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg sm:text-2xl font-extrabold text-rose-600">
              {formatCurrency(stats?.total_debt || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="font-semibold text-rose-600">{stats?.debtor_count || 0} nafar</span> faol qarzdor
            </p>
          </div>
        </div>

        {/* Total Products */}
        <div 
          onClick={() => setCurrentView('products')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ombor qoldig‘i</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg sm:text-2xl font-extrabold text-slate-900">
              {stats?.total_products || 0} xil
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Ombordagi tovar turlari soni
            </p>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div 
          onClick={() => setCurrentView('products')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kam qolganlar</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg sm:text-2xl font-extrabold text-amber-600">
              {stats?.low_stock_count || 0} ta
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Qoldig‘i 5 tadan kam qolgan tovarlar
            </p>
          </div>
        </div>
      </div>

      {/* 7-Day Sales Trend & Recent Sales Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7 Days Trend (Bar chart) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Haftalik savdo dinamikasi</span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Oxirgi 7 kundagi umumiy tushum
          </p>

          <div className="space-y-3">
            {stats?.sales_last_7_days && stats.sales_last_7_days.length > 0 ? (
              stats.sales_last_7_days.map((day, idx) => {
                const percent = Math.min(100, Math.round((day.amount / maxDayAmount) * 100));
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{formatDate(day.date)}</span>
                      <span className="font-bold text-slate-900">{formatCurrency(day.amount)}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-8 text-center">Hali ma'lumot yo‘q</p>
            )}
          </div>
        </div>

        {/* Recent Sales List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Oxirgi kassa sotuvlari</span>
            </h3>
            <button
              onClick={() => setCurrentView('pos')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>Kassani ochish</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-3">Chek №</th>
                  <th className="py-3 px-3">Vaqt</th>
                  <th className="py-3 px-3">To‘lov turi</th>
                  <th className="py-3 px-3 text-right">Summa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.recent_sales && stats.recent_sales.length > 0 ? (
                  stats.recent_sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-medium text-slate-800">
                        #{sale.id}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(sale.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sale.payment_type === 'cash'
                              ? 'bg-emerald-50 text-emerald-700'
                              : sale.payment_type === 'card'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {sale.payment_type === 'cash'
                            ? 'Naqd'
                            : sale.payment_type === 'card'
                            ? 'Plastik karta'
                            : 'Nasiya (Qarz)'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {formatCurrency(sale.total_amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Bugun hali sotuv amalga oshirilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

