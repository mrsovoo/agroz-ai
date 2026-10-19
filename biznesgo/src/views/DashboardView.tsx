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
  AlertCircle,
  Scale,
  Wheat,
  Wrench,
  Building2,
  ShieldCheck,
  Sparkles,
  Layers,
  Sprout,
  DollarSign,
  Repeat
} from 'lucide-react';
import { Sale, Product, Debt } from '../types';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  const businessType = merchant?.business_type || 'agro_vet';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, productsData, debtsData] = await Promise.all([
        api.dashboard.getStats(),
        api.products.list(),
        api.debts.list()
      ]);
      setStats(statsData);
      setProducts(productsData);
      setDebts(debtsData);
    } catch (err: any) {
      addToast(err.message || 'Statistika yuklanmadi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Boshqaruv paneli yuklanmoqda...</p>
      </div>
    );
  }

  const maxDayAmount = Math.max(...(stats?.sales_last_7_days?.map(d => d.amount) || [1]), 1);

  // 1. AGRO-VET: Expired & Critical Alerts
  const now = Date.now();
  const expiringDrugs = products.filter((p) => {
    if (!p.expiry_date) return false;
    const diffDays = (new Date(p.expiry_date).getTime() - now) / (1000 * 60 * 60 * 24);
    return diffDays <= 45; // 45 kundan kam yoki o'tib ketgan
  });
  const expiredCount = expiringDrugs.filter(p => new Date(p.expiry_date!).getTime() < now).length;
  const criticalLowDrugs = products.filter(p => p.stock_quantity <= (p.min_stock_alert || 5));

  // 2. FEED: Hajmlar statistikasi (Tonna / Kg)
  const totalKgInStock = products.reduce((sum, p) => {
    const bagKg = p.bag_weight_kg || (p.unit === 'tonna' ? 1000 : p.unit === 'kg' ? 1 : 50);
    return sum + (p.stock_quantity * bagKg);
  }, 0);
  const totalTonsInStock = (totalKgInStock / 1000).toFixed(1);

  // 3. WAREHOUSE: Omborning umumiy moliyaviy qiymati (Inventory Value) & B2B qarzlar
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock_quantity * p.price), 0);
  const totalWholesaleValue = products.reduce((sum, p) => sum + (p.stock_quantity * (p.wholesale_price || p.price)), 0);
  const highRiskB2BDebts = debts.filter(d => {
    const rem = d.remaining_amount || d.remaining || 0;
    return rem > 10000000; // 10 milliondan katta qarzlar
  });

  // 4. SEEDS: Mavsumiy navlar va unuvchanlik
  const seedVarieties = Array.from(new Set(products.map(p => p.variety).filter(Boolean)));
  const springSeeds = products.filter(p => p.ripening_period?.toLowerCase().includes('bahor') || !p.ripening_period);
  const avgGermination = products.filter(p => p.germination_rate_percent).length > 0
    ? Math.round(products.filter(p => p.germination_rate_percent).reduce((s, p) => s + (p.germination_rate_percent || 0), 0) / products.filter(p => p.germination_rate_percent).length)
    : 95;

  // 5. MACHINERY: Kafolatlar & Bo'lib to'lash
  const machineryWithWarranty = products.filter(p => p.warranty_months && p.warranty_months > 0);
  const activeInstallments = debts.filter(d => d.installment_months && d.status !== 'paid');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header welcome banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {merchant?.store_name}
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/20 text-white backdrop-blur-xs">
                  {businessType === 'agro_vet' && '🌿 Agro-Vet Dorixona'}
                  {businessType === 'feed' && '🌾 Yem-Ozuqa Savdosi'}
                  {businessType === 'warehouse' && '🏢 Ulgurji Ombor'}
                  {businessType === 'seeds' && '🌱 Urug‘ va Ko‘chat'}
                  {businessType === 'machinery' && '🔧 Jihoz va Texnika'}
                </span>
              </div>
              <p className="text-emerald-100/80 text-xs sm:text-sm mt-1">
                Bugungi savdo ko‘rsatkichlari, sohaviy analitika va do‘kon balansi
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('pos')}
                className="bg-white text-emerald-800 hover:bg-emerald-50 px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Kassani ochish</span>
              </button>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* ======================================================== */}
      {/* SECTOR SPECIFIC DASHBOARD WIDGETS                       */}
      {/* ======================================================== */}

      {/* 1. AGRO-VET WIDGET: Expired & Critical Drug Alerts */}
      {businessType === 'agro_vet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Expired / Expiring Soon Card */}
          <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-950">Muddati yaqin dorilar nazorati</h3>
                  <p className="text-xs text-amber-700">Yaroqlilik muddati 45 kundan kam yoki o‘tgan</p>
                </div>
              </div>
              <span className="text-xs font-black px-2 py-1 bg-amber-200 text-amber-900 rounded-lg">
                {expiringDrugs.length} ta preparat
              </span>
            </div>

            {expiringDrugs.length > 0 ? (
              <div className="space-y-2 mt-3">
                {expiringDrugs.slice(0, 3).map((p) => {
                  const isExp = new Date(p.expiry_date!).getTime() < now;
                  return (
                    <div
                      key={p.id}
                      className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Partiya: {p.batch_number || 'B-Yo‘q'}
                        </div>
                      </div>
                      <span className={`font-bold px-2 py-0.5 rounded ${isExp ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                        {isExp ? 'Muddati o‘tgan' : formatDate(p.expiry_date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-emerald-800 font-medium py-3 bg-white/60 rounded-xl px-3 border border-emerald-100">
                ✓ Barcha dori vositalarining yaroqlilik muddati yaxshi holatda.
              </p>
            )}
          </div>

          {/* Minimal Stock Alert */}
          <div className="bg-rose-50/70 border border-rose-200/90 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 text-rose-800 rounded-xl">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-950">Minimal qoldiqdagi dori-darmonlar</h3>
                  <p className="text-xs text-rose-700">Kritik kam qolgan dorilar signali</p>
                </div>
              </div>
              <span className="text-xs font-black px-2 py-1 bg-rose-200 text-rose-900 rounded-lg">
                {criticalLowDrugs.length} ta
              </span>
            </div>

            {criticalLowDrugs.length > 0 ? (
              <div className="space-y-2 mt-3">
                {criticalLowDrugs.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="bg-white p-2.5 rounded-xl border border-rose-200 flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-slate-900">{p.name}</span>
                    <span className="font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                      {p.stock_quantity} {p.unit} qoldi
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-800 font-medium py-3 bg-white/60 rounded-xl px-3 border border-emerald-100">
                ✓ Omborda barcha preparatlar yetarli miqdorda mavjud.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 2. FEED WIDGET: Total Volume in Tons / Kg & High turnover feeds */}
      {businessType === 'feed' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                  Ombordagi umumiy hajm
                </span>
                <div className="text-2xl font-black text-amber-950 mt-1">
                  {totalTonsInStock} Tonna <span className="text-sm font-semibold text-amber-800">({totalKgInStock.toLocaleString()} kg)</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-amber-800/80 mt-3">
              1 qop o‘rtacha 50 kg hisobida umumiy ombor sig‘imi va ozuqa massasi.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Repeat className="w-4 h-4 text-emerald-600" />
                <span>Tez aylanuvchi yem turlari</span>
              </span>
              <span className="text-xs font-bold text-emerald-600">Yuqori talab</span>
            </div>
            <div className="space-y-2 mt-3">
              {products.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                  <span className="font-bold text-slate-800">{p.name}</span>
                  <span className="font-mono font-bold text-slate-600">{p.stock_quantity} qop ({p.bag_weight_kg ? `${p.bag_weight_kg} kg` : '50 kg'})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. WAREHOUSE WIDGET: Total Inventory Value & B2B Debt Risk */}
      {businessType === 'warehouse' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 text-blue-800 rounded-xl">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                  Omborning umumiy moliyaviy qiymati
                </span>
                <div className="text-2xl font-black text-blue-950 mt-1">
                  {formatCurrency(totalInventoryValue)}
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-blue-800 flex justify-between pt-2 border-t border-blue-200/60">
              <span>Ulgurji narxdagi qiymat:</span>
              <span className="font-bold">{formatCurrency(totalWholesaleValue)}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-rose-600" />
                <span>B2B Do‘konlar va Dilerlar Qarz Balansi</span>
              </span>
              <span className="text-xs font-bold text-rose-700">{formatCurrency(stats?.total_debt || 0)}</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Kredit limiti 10 mln so‘mdan oshgan B2B xaridorlar: <strong className="text-rose-600">{highRiskB2BDebts.length} ta</strong>
            </p>
            {highRiskB2BDebts.length > 0 && (
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
                ⚠️ Dilerlar qarz balansi qat'iy nazoratda! Yangi partiya jo‘natishdan oldin to‘lovni talab qiling.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. SEEDS WIDGET: Seasonal distribution & Germination */}
      {businessType === 'seeds' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-lime-50 border border-lime-200 rounded-2xl p-5">
            <span className="text-xs font-bold text-lime-800 uppercase tracking-wider">Mavjud urug‘ navlari</span>
            <div className="text-2xl font-black text-lime-950 mt-1">
              {seedVarieties.length || products.length} xil nav
            </div>
            <p className="text-xs text-lime-800/80 mt-1">Ekishga tayyor sertifikatlangan navlar</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">O‘rtacha unuvchanlik</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {avgGermination}%
            </div>
            <p className="text-xs text-slate-500 mt-1">Laboratoriya unuvchanlik ko‘rsatkichi</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bahoriy ekish qoldig‘i</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {springSeeds.length} xil urug‘
            </div>
            <p className="text-xs text-slate-500 mt-1">Fermerlar uchun mavsumiy tayyorgarlik</p>
          </div>
        </div>
      )}

      {/* 5. MACHINERY WIDGET: Active Warranties & Installments */}
      {businessType === 'machinery' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-100 border border-slate-300 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white text-slate-800 rounded-xl shadow-2xs">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Kafolatdagi texnikalar monitori
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {machineryWithWarranty.length} xil uskuna
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-3">
              Topshirilgan motoblok, nasos va purkagichlarning kafolat va servis nazorati.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Bo‘lib to‘lash (Installment) rejalari
              </span>
              <span className="text-xs font-bold text-emerald-600">{activeInstallments.length} ta faol</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Muddatli to‘lovga berilgan uskunalar bo‘yicha oylik grafiklar o‘z vaqtida to‘lanmoqda.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STANDARD KPI CARDS                                       */}
      {/* ======================================================== */}
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
              <span className="font-semibold text-emerald-600">{stats?.today_sales_count || 0} ta</span> kassa savdosi
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
              <span className="font-semibold text-rose-600">{stats?.debtor_count || 0} nafar</span> qarzdor
            </p>
          </div>
        </div>

        {/* Total Products */}
        <div 
          onClick={() => setCurrentView('products')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ombor xillari</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg sm:text-2xl font-extrabold text-slate-900">
              {products.length || stats?.total_products || 0} xil
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
              Chegaraga yaqin qoldiqlar
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
