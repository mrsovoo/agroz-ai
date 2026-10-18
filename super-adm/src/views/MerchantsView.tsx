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
} from 'lucide-react';

export const MerchantsView: React.FC = () => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [status, setStatus] = useState('');
  const [total, setTotal] = useState(0);

  // Modal / action state
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Merchant | null>(null);
  const [confirmReset, setConfirmReset] = useState<Merchant | null>(null);
  const [subscriptionModal, setSubscriptionModal] = useState<Merchant | null>(null);
  const [newSubDate, setNewSubDate] = useState('');
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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
      showNotification(`"${merchant.store_name}" holati o'zgartirildi: ${updated.is_active ? 'Faol' : 'Bloklangan'}`);
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
      showNotification(`"${confirmDelete.store_name}" va uning barcha ma'lumotlari o'chirildi`);
      setConfirmDelete(null);
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('uz-UZ').format(Math.round(val || 0)) + " so'm";
  };

  const businessTypeLabels: Record<BusinessType, string> = {
    agro_vet: 'Agro-Vet',
    feed: 'Yem',
    warehouse: 'Ombor',
    seeds: "Urug'",
    machinery: 'Texnika',
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl text-sm font-medium transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {notification.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Do'konlar Boshqaruvi</h1>
          <p className="text-slate-400 text-sm">Barcha ro'yxatdan o'tgan B2B do'konlar (jami {total} ta)</p>
        </div>
        <button
          onClick={loadMerchants}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium transition"
        >
          <RefreshCw className="w-4 h-4" />
          Yangilash
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Do'kon nomi, telefon yoki egasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
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
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">Barcha statuslar</option>
            <option value="active">Faol do'konlar</option>
            <option value="blocked">Bloklanganlar</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3.5">ID / Do'kon</th>
                <th className="px-4 py-3.5">Yo'nalish</th>
                <th className="px-4 py-3.5">Aloqa</th>
                <th className="px-4 py-3.5">Mahsulot</th>
                <th className="px-4 py-3.5">Savdo</th>
                <th className="px-4 py-3.5">Qarz</th>
                <th className="px-4 py-3.5">Obuna</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    Do'konlar ro'yxati yuklanmoqda...
                  </td>
                </tr>
              ) : merchants.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    Mos keladigan do'konlar topilmadi.
                  </td>
                </tr>
              ) : (
                merchants.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-750 transition">
                    {/* Store info */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-emerald-400" />
                        {m.store_name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        ID: {m.id} • {m.address || 'Manzil belgilanmagan'}
                      </div>
                    </td>

                    {/* Business type */}
                    <td className="px-4 py-3.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-200">
                        {businessTypeLabels[m.business_type] || m.business_type}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 text-slate-200 font-mono text-xs">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {m.phone}
                      </div>
                      <div className="text-xs text-slate-400">{m.owner_name || '—'}</div>
                    </td>

                    {/* Products */}
                    <td className="px-4 py-3.5 font-medium text-slate-200">
                      {m.products_count} ta
                    </td>

                    {/* Sales */}
                    <td className="px-4 py-3.5 text-emerald-400 font-medium">
                      {formatMoney(m.total_sales)}
                    </td>

                    {/* Debts */}
                    <td className="px-4 py-3.5 text-amber-400 font-medium">
                      {formatMoney(m.total_open_debt)}
                    </td>

                    {/* Subscription */}
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => {
                          setSubscriptionModal(m);
                          setNewSubDate(m.subscription_until ? m.subscription_until.slice(0, 10) : '');
                        }}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 underline"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        {m.subscription_until ? m.subscription_until.slice(0, 10) : 'Belgilash'}
                      </button>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <button
                        disabled={actionLoading === m.id}
                        onClick={() => handleToggleStatus(m)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                          m.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        }`}
                      >
                        {m.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> Faol
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Blok
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {/* Reset data */}
                      <button
                        title="Savdo va qarzlarni 0 qilish (Reset)"
                        disabled={actionLoading === m.id}
                        onClick={() => setConfirmReset(m)}
                        className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg transition"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        title="Do'konni to'liq o'chirish (Cascade)"
                        disabled={actionLoading === m.id}
                        onClick={() => setConfirmDelete(m)}
                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-7 h-7" />
              <h3 className="text-lg font-bold text-white">Do'konni o'chirish</h3>
            </div>
            <p className="text-sm text-slate-300">
              Siz haqiqatan ham <strong className="text-white">"{confirmDelete.store_name}"</strong> do'konini va
              unga tegishli <span className="text-red-400 font-semibold">barcha mahsulotlar, savdolar va qarzlarni</span> butunlay
              o'chirib tashlamoqchimisiz?
            </p>
            <p className="text-xs text-slate-500">Bu amalni ortga qaytarib bo'lmaydi!</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 font-medium"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleDeleteMerchant}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm text-white font-medium shadow"
              >
                Ha, butunlay o'chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <RotateCcw className="w-7 h-7" />
              <h3 className="text-lg font-bold text-white">Savdolarni 0 ga tushirish (Reset)</h3>
            </div>
            <p className="text-sm text-slate-300">
              <strong className="text-white">"{confirmReset.store_name}"</strong> do'konining barcha test
              savdolari, cheklari va qarzlari o'chiriladi. Do'kon profili va mahsulotlar qoldig'i saqlab qolinadi.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmReset(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 font-medium"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleResetData}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm text-white font-medium shadow"
              >
                Savdo & Qarzlarni tozalash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {subscriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-blue-400">
              <Calendar className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Obuna muddati</h3>
            </div>
            <p className="text-xs text-slate-400">
              "{subscriptionModal.store_name}" do'koni uchun ruxsat etilgan xizmat ko'rsatish sanasini belgilang.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Amal qilish sanasi:</label>
              <input
                type="date"
                value={newSubDate}
                onChange={(e) => setNewSubDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSubscriptionModal(null)}
                className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-slate-300 font-medium"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSaveSubscription}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs text-white font-medium shadow"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

