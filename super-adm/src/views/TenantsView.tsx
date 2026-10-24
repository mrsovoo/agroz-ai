import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Send, 
  Globe, 
  ShieldCheck, 
  ShieldAlert, 
  UserCheck, 
  UserX, 
  ExternalLink, 
  Receipt, 
  X, 
  Loader2,
  DollarSign
} from 'lucide-react';
import { ResourceTable } from '../components/ResourceTable';
import { Tenant, ResourceConfig } from '../types';
import { adminApi } from '../lib/api';
import { formatUZS } from './DashboardView';

export const TenantsView: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Detail Modal State
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await adminApi.listTenants();
      setTenants(res.tenants);
    } catch (err: any) {
      setError(err.message || 'Dorixonalarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleOpenDetail = async (tenantId: string) => {
    setDetailLoading(true);
    try {
      const res = await adminApi.getTenantDetail(tenantId);
      setSelectedTenant(res.tenant);
    } catch (err: any) {
      alert(err.message || 'Batafsil ma\'lumotni yuklashda xatolik');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleStatus = async (tenant: Tenant) => {
    const nextStatus = tenant.status === 'active' ? 'suspended' : 'active';
    const reason = window.prompt(
      nextStatus === 'suspended'
        ? `"${tenant.name}" dorixonasini bloklash sababini kiriting (Audit jurnaliga yoziladi):`
        : `"${tenant.name}" dorixonasini faollashtirish sababini kiriting:`
    );

    if (reason === null) return;
    if (reason.trim().length < 5) {
      alert('Sabab kamida 5 ta belgidan iborat bo\'lishi shart');
      return;
    }

    try {
      await adminApi.toggleTenantStatus(tenant.id, nextStatus, reason.trim());
      await fetchTenants();
      if (selectedTenant && selectedTenant.id === tenant.id) {
        setSelectedTenant(prev => prev ? ({ ...prev, status: nextStatus, is_active: nextStatus === 'active' }) : null);
      }
    } catch (err: any) {
      alert(err.message || 'Holatni o\'zgartirishda xatolik yuz berdi');
    }
  };

  const tableConfig: ResourceConfig<Tenant> = {
    name: 'tenants',
    title: 'B2B Dorixonalar va Bizneslar',
    searchKeys: ['name', 'phone', 'address', 'region'],
    columns: [
      {
        key: 'name',
        header: 'Dorixona Nomi',
        render: (item) => (
          <div>
            <div className="font-semibold text-white text-xs">{item.name}</div>
            <div className="text-[10px] text-slate-400 font-mono">ID: {item.id}</div>
          </div>
        )
      },
      {
        key: 'phone',
        header: 'Telefon Raqami',
        isSensitive: true // Masked by default, clicks prompt for mandatory reason
      },
      {
        key: 'source',
        header: 'Ro\'yxatdan O\'tgan Manba',
        render: (item) => (
          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
            item.source === 'telegram_bot'
              ? 'bg-sky-950/60 text-sky-300 border-sky-800/60'
              : 'bg-purple-950/60 text-purple-300 border-purple-800/60'
          }`}>
            {item.source === 'telegram_bot' ? <Send className="w-3 h-3 text-sky-400" /> : <Globe className="w-3 h-3 text-purple-400" />}
            <span>{item.source === 'telegram_bot' ? 'Telegram Bot' : 'Veb Brauzer'}</span>
          </span>
        )
      },
      {
        key: 'region',
        header: 'Hudud (Viloyat)',
        render: (item) => (
          <div className="text-xs">
            <span className="font-medium text-slate-200">{item.region}</span>
            <div className="text-[10px] text-slate-400 max-w-xs truncate">{item.address}</div>
          </div>
        )
      },
      {
        key: 'total_revenue',
        header: 'Jami Daromad (Aylanma)',
        render: (item) => (
          <div className="text-xs">
            <span className="font-mono font-bold text-emerald-400">{formatUZS(item.total_revenue)}</span>
            <span className="text-[10px] text-slate-400 block font-mono">{item.sales_count} ta chek</span>
          </div>
        )
      },
      {
        key: 'status',
        header: 'Holati',
        render: (item) => (
          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
            item.status === 'active'
              ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60'
              : 'bg-red-950/50 text-red-300 border-red-800/60'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span>{item.status === 'active' ? 'Faol' : 'To\'xtatilgan'}</span>
          </span>
        )
      },
      {
        key: 'created_at',
        header: 'Qo\'shilgan Vaqt',
        render: (item) => (
          <span className="text-xs text-slate-400 font-mono">
            {new Date(item.created_at).toLocaleDateString('uz-UZ', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </span>
        )
      }
    ],
    filters: [
      {
        key: 'source',
        label: 'Manba',
        type: 'select',
        options: [
          { label: 'Telegram Bot', value: 'telegram_bot' },
          { label: 'Veb Brauzer', value: 'web_browser' }
        ]
      },
      {
        key: 'status',
        label: 'Holat',
        type: 'select',
        options: [
          { label: 'Faol', value: 'active' },
          { label: 'To\'xtatilgan', value: 'suspended' }
        ]
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <span>B2B Dorixonalar va Bizneslar Boshqaruvi</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ro'yxatdan o'tgan dorixonalar ro'yxati, kelib chiqish kanali (Telegram/Veb) va ularning savdo daromadlari
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-300 p-3 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Resource Table */}
      <ResourceTable
        config={tableConfig}
        data={tenants}
        loading={loading}
        onRefresh={fetchTenants}
        actions={(tenant) => (
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => handleOpenDetail(tenant.id)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-medium transition-colors"
            >
              Batafsil
            </button>
            <button
              onClick={() => handleToggleStatus(tenant)}
              className={`p-1 rounded border transition-colors ${
                tenant.status === 'active'
                  ? 'bg-red-950/40 border-red-800/60 text-red-300 hover:bg-red-900/50'
                  : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/50'
              }`}
              title={tenant.status === 'active' ? 'Bloklash' : 'Faollashtirish'}
            >
              {tenant.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      />

      {/* Dorixona Batafsil Kartochkasi Modali */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                  {selectedTenant.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{selectedTenant.name}</h3>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                    <span>ID: {selectedTenant.id}</span>
                    <span>•</span>
                    <span className="text-sky-400 font-medium">{selectedTenant.source_label}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedTenant(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
              {/* Metrikalar mini grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 block">Jami Savdo (Daromad)</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm mt-0.5 block">
                    {formatUZS(selectedTenant.stats?.total_revenue || selectedTenant.total_revenue)}
                  </span>
                </div>
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 block">Cheklar Soni</span>
                  <span className="font-mono font-bold text-white text-sm mt-0.5 block">
                    {selectedTenant.stats?.sales_count || selectedTenant.sales_count} ta
                  </span>
                </div>
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 block">O'rtacha Chek</span>
                  <span className="font-mono font-bold text-amber-300 text-sm mt-0.5 block">
                    {formatUZS(selectedTenant.stats?.average_check || 0)}
                  </span>
                </div>
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 block">Holati</span>
                  <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold mt-1 border ${
                    selectedTenant.status === 'active'
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                      : 'bg-red-950/60 text-red-300 border-red-800/60'
                  }`}>
                    <span>{selectedTenant.status === 'active' ? 'Faol' : 'To\'xtatilgan'}</span>
                  </span>
                </div>
              </div>

              {/* Asosiy ma'lumotlar */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Telefon Raqami</span>
                    <span className="font-mono text-slate-200">{selectedTenant.masked_phone || selectedTenant.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Hudud &amp; Manzil</span>
                    <span className="text-slate-200">{selectedTenant.region} — {selectedTenant.address}</span>
                  </div>
                </div>
              </div>

              {/* So'nggi Savdolar / Cheklar */}
              <div>
                <h4 className="font-semibold text-white text-xs mb-2.5 flex items-center space-x-1.5">
                  <Receipt className="w-3.5 h-3.5 text-blue-400" />
                  <span>So'nggi Amalga Oshirilgan Savdolar</span>
                </h4>
                <div className="bg-slate-800/40 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[11px] text-slate-300">
                    <thead className="bg-slate-950 text-slate-500 uppercase text-[9px]">
                      <tr>
                        <th className="px-3 py-2">Chek №</th>
                        <th className="px-3 py-2">To'lov Turi</th>
                        <th className="px-3 py-2 text-right">Summa</th>
                        <th className="px-3 py-2 text-right">Vaqt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {selectedTenant.recent_sales && selectedTenant.recent_sales.length > 0 ? (
                        selectedTenant.recent_sales.map(s => (
                          <tr key={s.id} className="hover:bg-slate-800/60">
                            <td className="px-3 py-2 font-medium text-slate-200">{s.receipt_number || s.id}</td>
                            <td className="px-3 py-2 text-slate-400 capitalize">{s.payment_type || 'Kassa'}</td>
                            <td className="px-3 py-2 text-right font-bold text-emerald-400">{formatUZS(s.total_amount)}</td>
                            <td className="px-3 py-2 text-right text-slate-500 text-[10px]">
                              {new Date(s.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                            Hozircha savdo cheklari yo'q (Toza 0 holat)
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <button
                onClick={() => handleToggleStatus(selectedTenant)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  selectedTenant.status === 'active'
                    ? 'bg-red-950/50 border-red-800/60 text-red-300 hover:bg-red-900/60'
                    : 'bg-emerald-950/50 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60'
                }`}
              >
                {selectedTenant.status === 'active' ? 'Akkauntni Bloklash' : 'Akkauntni Faollashtirish'}
              </button>

              <button
                onClick={() => setSelectedTenant(null)}
                className="px-4 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

