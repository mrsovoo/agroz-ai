import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Merchant, BusinessType } from '../types';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Trash2,
  RotateCcw,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Phone,
  Store,
  Archive,
  ArrowUpRight,
  ShieldAlert,
  X,
  Download,
  MapPin,
  Package,
  Layers,
  Receipt
} from 'lucide-react';

interface MerchantsViewProps {
  searchQuery?: string;
}

export const MerchantsView: React.FC<MerchantsViewProps> = ({ searchQuery = '' }) => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchQuery);
  const [businessType, setBusinessType] = useState('');
  const [status, setStatus] = useState('');
  const [total, setTotal] = useState(0);

  // Modal / action state
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Merchant | null>(null);
  const [confirmReset, setConfirmReset] = useState<Merchant | null>(null);
  const [subscriptionModal, setSubscriptionModal] = useState<Merchant | null>(null);
  const [newSubDate, setNewSubDate] = useState('');
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Sync external search query from Header
  useEffect(() => {
    if (searchQuery !== undefined && searchQuery !== search) {
      setSearch(searchQuery);
    }
  }, [searchQuery]);

  const loadMerchants = async () => {
    setLoading(true);
    try {
      const data = await api.getMerchants({ search, business_type: businessType, status });
      setMerchants(data.merchants);
      setTotal(data.total);
    } catch (err: any) {
      showNotification(err.message || 'Yuklashda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMerchants();
  }, [search, businessType, status]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleToggleStatus = async (merchant: Merchant) => {
    setActionLoading(merchant.id);
    try {
      const updated = await api.updateMerchantStatus(merchant.id, { is_active: !merchant.is_active });
      setMerchants((prev) =>
        prev.map((m) => (m.id === merchant.id ? { ...m, is_active: updated.is_active } : m))
      );
      if (selectedMerchant?.id === merchant.id) {
        setSelectedMerchant((prev) => prev ? { ...prev, is_active: updated.is_active } : null);
      }
      showNotification(`"${merchant.store_name}" holati yangilandi (${updated.is_active ? 'Faol' : 'Bloklangan'})`);
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveSubscription = async () => {
    if (!subscriptionModal) return;
    setActionLoading(subscriptionModal.id);
    try {
      const updated = await api.updateMerchantStatus(subscriptionModal.id, {
        subscription_until: newSubDate || null,
      });
      setMerchants((prev) =>
        prev.map((m) => (m.id === subscriptionModal.id ? { ...m, subscription_until: updated.subscription_until } : m))
      );
      if (selectedMerchant?.id === subscriptionModal.id) {
        setSelectedMerchant((prev) => prev ? { ...prev, subscription_until: updated.subscription_until } : null);
      }
      showNotification(`"${subscriptionModal.store_name}" obunasi saqlandi`);
      setSubscriptionModal(null);
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetData = async () => {
    if (!confirmReset) return;
    setActionLoading(confirmReset.id);
    try {
      const res = await api.resetMerchant(confirmReset.id);
      setMerchants((prev) =>
        prev.map((m) => (m.id === confirmReset.id ? { ...m, sales_count: 0, total_sales: 0, open_debts_count: 0, total_open_debt: 0 } : m))
      );
      if (selectedMerchant?.id === confirmReset.id) {
        setSelectedMerchant((prev) => prev ? { ...prev, sales_count: 0, total_sales: 0, open_debts_count: 0, total_open_debt: 0 } : null);
      }
      showNotification(`"${confirmReset.store_name}" test ma'lumotlari tozalandi (${res.deleted_sales} savdo, ${res.deleted_debts} qarz)`);
      setConfirmReset(null);
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteMerchant = async () => {
    if (!confirmDelete) return;
    setActionLoading(confirmDelete.id);
    try {
      await api.deleteMerchant(confirmDelete.id);
      setMerchants((prev) => prev.filter((m) => m.id !== confirmDelete.id));
      setTotal((t) => t - 1);
      if (selectedMerchant?.id === confirmDelete.id) {
        setSelectedMerchant(null);
      }
      showNotification(`"${confirmDelete.store_name}" va uning barcha ma'lumotlari o'chirildi`);
      setConfirmDelete(null);
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async (m: Merchant) => {
    if (!window.confirm(`"${m.store_name}" do'konini arxivlashni (Soft-delete) tasdiqlaysizmi?\nDo'kon ma'lumotlari saqlanib qoladi.`)) return;
    setActionLoading(m.id);
    try {
      await api.archiveMerchant(m.id);
      showNotification(`"${m.store_name}" arxivlandi`);
      await loadMerchants();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (m: Merchant) => {
    if (!window.confirm(`"${m.store_name}" do'konini arxivdan qayta tiklashni tasdiqlaysizmi?`)) return;
    setActionLoading(m.id);
    try {
      await api.restoreMerchant(m.id);
      showNotification(`"${m.store_name}" arxivdan qayta tiklandi`);
      await loadMerchants();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportCSV = () => {
    if (!merchants.length) return;

    const headers = ['ID', 'Do‘kon Nomi', 'Egasi', 'Sektor', 'Telefon', 'Tovarlar Soni', 'Jami Savdo', 'Ochiq Qarz', 'Obuna Muddati', 'Holat'];
    const rows = merchants.map((m) => [
      m.id,
      `"${m.store_name}"`,
      `"${m.owner_name || ''}"`,
      `"${businessTypeLabels[m.business_type] || m.business_type}"`,
      `"${m.phone}"`,
      m.products_count || 0,
      m.total_sales || 0,
      m.total_open_debt || 0,
      `"${m.subscription_until ? m.subscription_until.split('T')[0] : ''}"`,
      m.is_archived ? 'Arxivlangan' : m.is_active ? 'Faol' : 'Bloklangan',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `biznesgo_dokonlar_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('uz-UZ').format(Math.round(val || 0)) + " so'm";
  };

  const businessTypeLabels: Record<BusinessType, string> = {
    agro_vet: 'Agro-Vet',
    feed: 'Yem-Ozuqa',
    warehouse: 'Ulgurji Ombor',
    seeds: "Urug‘chilik",
    machinery: 'Jihoz & Texnika',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-xs font-semibold transition-all ${
            notification.type === 'success'
              ? 'bg-black text-white border border-slate-700'
              : 'bg-rose-600 text-white'
          }`}
        >
          {notification.text}
        </div>
      )}

      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Do‘konlar<br />Boshqaruvi
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Barcha ro‘yxatdan o‘tgan B2B savdo nuqtalari ({total} ta)</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadMerchants}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200/80 rounded-full text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yangilash</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-full text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Bento Controls & Filters Bar */}
      <div className="bg-white rounded-[28px] p-4 sm:p-5 shadow-xs border border-slate-200/60 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Do'kon nomi, telefon yoki egasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200/70 rounded-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full sm:w-auto bg-white border border-slate-200/80 rounded-full px-4 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
          >
            <option value="">Barcha yo'nalishlar</option>
            <option value="agro_vet">Agro-Vet Dorixona</option>
            <option value="feed">Yem-Ozuqa</option>
            <option value="warehouse">Ombor / Ulgurji</option>
            <option value="seeds">Urug' & Ko'chat</option>
            <option value="machinery">Jihoz & Texnika</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full sm:w-auto bg-white border border-slate-200/80 rounded-full px-4 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
          >
            <option value="">Barcha statuslar</option>
            <option value="active">Faol do'konlar</option>
            <option value="blocked">Bloklanganlar</option>
            <option value="archived">📦 Arxivlanganlar</option>
          </select>
        </div>
      </div>

      {/* Merchants Bento Table */}
      <div className="bg-white rounded-[32px] p-4 sm:p-7 shadow-xs border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="text-[11px] font-semibold uppercase text-slate-400 border-b border-slate-100">
              <tr>
                <th className="pb-3 font-semibold">Do'kon / Egasi</th>
                <th className="pb-3 font-semibold">Yo'nalish</th>
                <th className="pb-3 font-semibold">Telefon</th>
                <th className="pb-3 font-semibold">Tovar</th>
                <th className="pb-3 font-semibold">Savdo</th>
                <th className="pb-3 font-semibold">Qarz</th>
                <th className="pb-3 font-semibold">Obuna</th>
                <th className="pb-3 font-semibold">Holat</th>
                <th className="pb-3 font-semibold text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-black" />
                    Do'konlar ro'yxati yuklanmoqda...
                  </td>
                </tr>
              ) : merchants.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    Bunday parametrlar bo'yicha do'kon topilmadi
                  </td>
                </tr>
              ) : (
                merchants.map((m) => (
                  <tr 
                    key={m.id} 
                    onClick={() => setSelectedMerchant(m)}
                    className="hover:bg-slate-50/70 transition cursor-pointer"
                  >
                    <td className="py-3.5 font-bold text-slate-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-800">
                        {m.store_name ? m.store_name[0].toUpperCase() : 'D'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 hover:underline">{m.store_name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{m.owner_name || 'Noma‘lum'} (ID: {m.id})</div>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {businessTypeLabels[m.business_type] || m.business_type}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-700 font-medium">
                      <a 
                        href={`tel:${m.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline font-mono"
                      >
                        {m.phone}
                      </a>
                    </td>
                    <td className="py-3.5 font-semibold text-slate-800">
                      {m.products_count || 0}
                    </td>
                    <td className="py-3.5 font-bold text-slate-900">
                      {formatMoney(m.total_sales)}
                    </td>
                    <td className="py-3.5 font-semibold text-rose-600">
                      {m.total_open_debt > 0 ? formatMoney(m.total_open_debt) : '—'}
                    </td>
                    <td className="py-3.5 text-[11px] text-slate-500">
                      {m.subscription_until ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSubscriptionModal(m);
                            setNewSubDate(m.subscription_until ? m.subscription_until.split('T')[0] : '');
                          }}
                          className="hover:underline font-semibold text-slate-800 cursor-pointer"
                        >
                          {m.subscription_until.split('T')[0]}
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSubscriptionModal(m);
                            setNewSubDate('');
                          }}
                          className="text-slate-400 hover:text-black hover:underline cursor-pointer"
                        >
                          + Belgilash
                        </button>
                      )}
                    </td>
                    <td className="py-3.5">
                      {m.is_archived ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                          Arxivlangan
                        </span>
                      ) : m.is_active ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Faol
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                          Bloklangan
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleStatus(m)}
                          disabled={actionLoading === m.id}
                          title={m.is_active ? "Bloklash" : "Faollashtirish"}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
                            m.is_active
                              ? 'bg-slate-100 text-slate-600 hover:text-rose-600 hover:bg-rose-50'
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          }`}
                        >
                          {m.is_active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => setConfirmReset(m)}
                          disabled={actionLoading === m.id}
                          title="Test savdolar va qarzlarni tozalash (Reset)"
                          className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:text-amber-600 hover:bg-amber-50 flex items-center justify-center transition cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        {m.is_archived ? (
                          <button
                            onClick={() => handleRestore(m)}
                            disabled={actionLoading === m.id}
                            title="Arxivdan qayta tiklash"
                            className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-200 flex items-center justify-center transition cursor-pointer"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchive(m)}
                            disabled={actionLoading === m.id}
                            title="Arxivlash (Soft-delete)"
                            className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:text-purple-600 hover:bg-purple-50 flex items-center justify-center transition cursor-pointer"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => setConfirmDelete(m)}
                          disabled={actionLoading === m.id}
                          title="To'liq o'chirish (Cascade)"
                          className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Do'kon Tafsilotlari Modali (Row Click Modal) */}
      {selectedMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center text-lg font-black">
                  {selectedMerchant.store_name ? selectedMerchant.store_name[0] : 'D'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedMerchant.store_name}</h3>
                  <div className="text-xs text-slate-400">ID: #{selectedMerchant.id} • {selectedMerchant.owner_name || 'Noma‘lum egasi'}</div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedMerchant(null)} 
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-black flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Asosiy ko'rsatkichlar kartochkalari */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-[#F8F8F6] rounded-2xl">
                <span className="text-slate-400 text-[10px] block">Biznes Yo‘nalishi</span>
                <span className="font-bold text-slate-900">{businessTypeLabels[selectedMerchant.business_type] || selectedMerchant.business_type}</span>
              </div>
              <div className="p-3 bg-[#F8F8F6] rounded-2xl">
                <span className="text-slate-400 text-[10px] block">Telefon</span>
                <a href={`tel:${selectedMerchant.phone}`} className="font-bold text-emerald-600 font-mono hover:underline">
                  {selectedMerchant.phone}
                </a>
              </div>
              <div className="p-3 bg-[#F8F8F6] rounded-2xl">
                <span className="text-slate-400 text-[10px] block">Jami Savdolar</span>
                <span className="font-bold text-slate-900">{formatMoney(selectedMerchant.total_sales)}</span>
              </div>
              <div className="p-3 bg-[#F8F8F6] rounded-2xl">
                <span className="text-slate-400 text-[10px] block">Ochiq Qarz</span>
                <span className="font-bold text-rose-600">{formatMoney(selectedMerchant.total_open_debt)}</span>
              </div>
            </div>

            {/* Manzil va Qoldiqlar */}
            <div className="p-3.5 bg-[#F8F8F6] rounded-2xl space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Manzil:</span>
                <span className="text-slate-600 font-normal">{selectedMerchant.address || 'Manzil kiritilmagan'}</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Package className="w-3.5 h-3.5 text-slate-500" />
                <span>Faol Mahsulotlar:</span>
                <span className="text-slate-600 font-normal">{selectedMerchant.products_count} ta tovar</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Obuna muddati:</span>
                <span className="text-slate-600 font-normal">
                  {selectedMerchant.subscription_until ? selectedMerchant.subscription_until.split('T')[0] : 'Belgilanmagan'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <CheckCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>Holat:</span>
                <span className={`font-bold ${selectedMerchant.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedMerchant.is_archived ? 'Arxivlangan' : selectedMerchant.is_active ? 'Faol' : 'Bloklangan'}
                </span>
              </div>
            </div>

            {/* Amallar Tugmalari */}
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                onClick={() => handleToggleStatus(selectedMerchant)}
                className={`flex-1 py-2.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedMerchant.is_active
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                {selectedMerchant.is_active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                <span>{selectedMerchant.is_active ? 'Bloklash' : 'Faollashtirish'}</span>
              </button>

              <button
                onClick={() => {
                  setSubscriptionModal(selectedMerchant);
                  setNewSubDate(selectedMerchant.subscription_until ? selectedMerchant.subscription_until.split('T')[0] : '');
                }}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-xs font-bold transition cursor-pointer"
              >
                Obuna berish
              </button>

              <button
                onClick={() => setConfirmReset(selectedMerchant)}
                className="py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-xs font-bold transition cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {subscriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Obuna Muddatini Belgilash</h3>
              <button onClick={() => setSubscriptionModal(null)} className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-black flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              "{subscriptionModal.store_name}" uchun obuna amal qilish muddati
            </p>
            <input
              type="date"
              value={newSubDate}
              onChange={(e) => setNewSubDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setSubscriptionModal(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-black">
                Bekor qilish
              </button>
              <button
                onClick={handleSaveSubscription}
                disabled={actionLoading !== null}
                className="px-5 py-2 bg-black text-white hover:bg-neutral-800 text-xs font-semibold rounded-full shadow-sm"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-sm font-bold text-slate-900">Ma'lumotlarni Reset qilish</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              "{confirmReset.store_name}" do'konining barcha kassa savdolari va qarz yozuvlari tozalanadi (0 ga tushiriladi). Do'kon va tovarlar saqlanadi.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setConfirmReset(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-black">
                Bekor qilish
              </button>
              <button
                onClick={handleResetData}
                disabled={actionLoading !== null}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-full shadow-sm"
              >
                Ha, tozalash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-sm font-bold text-slate-900">Do'konni To'liq O'chirish (Cascade)</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              "{confirmDelete.store_name}" do'koni va uning barcha tovarlari, savdo cheklari, mijozlar va qarzlari Neon PostgreSQL bazasidan to'liq o'chiriladi. Bu amalni qaytarib bo'lmaydi!
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-black">
                Bekor qilish
              </button>
              <button
                onClick={handleDeleteMerchant}
                disabled={actionLoading !== null}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-full shadow-sm"
              >
                Ha, to'liq o'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
