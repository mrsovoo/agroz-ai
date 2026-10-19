import React, { useEffect, useState } from 'react';
import { 
  Archive, 
  RotateCcw, 
  Download, 
  Search, 
  RefreshCw, 
  Users, 
  Store, 
  Bot, 
  CheckCircle2, 
  AlertTriangle,
  ArchiveRestore,
  UserCheck,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../lib/api';
import type { ArchiveItem, ArchiveStats } from '../types';

export const ArchiveView: React.FC = () => {
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [stats, setStats] = useState<ArchiveStats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'archived' | 'merchant' | 'specialist' | 'user'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'biznesgo_bot' | 'agroz_auth_bot'>('all');

  const loadArchive = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getArchive({
        search: search.trim() || undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        source: sourceFilter !== 'all' ? sourceFilter : undefined,
        limit: 200,
      });
      setItems(res.items);
      setTotal(res.total);
      setStats(res.stats);
    } catch (err: any) {
      setError(err.message || 'Arxivni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadArchive();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, typeFilter, sourceFilter]);

  // Arxivdan qayta tiklash (Restore)
  const handleRestore = async (merchantId: number, name: string) => {
    if (!window.confirm(`"${name}" do'konini arxivdan qayta tiklashni va faollashtirishni tasdiqlaysizmi?`)) {
      return;
    }

    try {
      setActionLoading(`restore_${merchantId}`);
      await api.restoreMerchant(merchantId);
      setSuccessMsg(`"${name}" do'koni muvaffaqiyatli qayta tiklandi!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadArchive();
    } catch (err: any) {
      alert(`Xatolik: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Arxivlash (Soft-delete)
  const handleArchive = async (merchantId: number, name: string) => {
    if (!window.confirm(`"${name}" do'konini arxivga o'tkazishni (Soft-delete) tasdiqlaysizmi?\nDo'kon ma'lumotlari o'chirilmaydi, faqat nofaol arxivga o'tadi.`)) {
      return;
    }

    try {
      setActionLoading(`archive_${merchantId}`);
      await api.archiveMerchant(merchantId);
      setSuccessMsg(`"${name}" do'koni arxivlandi!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadArchive();
    } catch (err: any) {
      alert(`Xatolik: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // CSV Export funksiyasi
  const handleExportCSV = () => {
    if (!items.length) {
      alert("Eksport qilish uchun ma'lumot yo'q");
      return;
    }

    const headers = [
      'ID',
      'Ismi / Do\'kon',
      'Egasi',
      'Telefon',
      'Telegram ID',
      'Yo\'nalishi',
      'Rol',
      'Manba',
      'Status',
      'Arxivlanganmi',
      'Ro\'yxatdan o\'tgan sana',
      'Arxivlangan sana'
    ];

    const rows = items.map((item) => [
      item.id,
      `"${(item.name || '').replace(/"/g, '""')}"`,
      `"${(item.owner_name || '').replace(/"/g, '""')}"`,
      `"${item.phone || ''}"`,
      `"${item.telegram_id || ''}"`,
      `"${item.business_type || ''}"`,
      `"${item.role || ''}"`,
      `"${item.source || ''}"`,
      `"${item.status || ''}"`,
      item.is_archived ? 'HA' : 'YO\'Q',
      `"${item.created_at ? new Date(item.created_at).toLocaleString('uz-UZ') : ''}"`,
      `"${item.archived_at ? new Date(item.archived_at).toLocaleString('uz-UZ') : ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `agroz_archive_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Arxiv va Foydalanuvchilar Bazasi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Neon DB dagi barcha foydalanuvchilar, dual-bot ro'yxatlari va arxivlangan profillar (Soft-delete)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadArchive}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-slate-900' : ''}`} />
            Yangilash
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!items.length}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold bg-black text-white hover:bg-slate-800 transition shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Excel / CSV Yuklab olish
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="p-5 rounded-[28px] bg-white border border-slate-200/60 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold text-slate-500">Jami Yozuvlar</span>
              <div className="w-7 h-7 rounded-full bg-[#F6F6F3] flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-slate-700" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900">{stats.total_all.toLocaleString()}</div>
          </div>

          <div className="p-5 rounded-[28px] bg-white border border-slate-200/60 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold text-amber-700">Arxivlanganlar</span>
              <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center">
                <ArchiveRestore className="w-3.5 h-3.5 text-amber-600" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-amber-600">{stats.total_archived.toLocaleString()}</div>
          </div>

          <div className="p-5 rounded-[28px] bg-white border border-slate-200/60 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold text-slate-500">BiznesGO</span>
              <div className="w-7 h-7 rounded-full bg-[#F6F6F3] flex items-center justify-center">
                <Store className="w-3.5 h-3.5 text-slate-700" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900">{stats.total_merchants.toLocaleString()}</div>
          </div>

          <div className="p-5 rounded-[28px] bg-white border border-slate-200/60 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold text-slate-500">Mutaxassislar</span>
              <div className="w-7 h-7 rounded-full bg-[#F6F6F3] flex items-center justify-center">
                <UserCheck className="w-3.5 h-3.5 text-slate-700" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900">{stats.total_specialists.toLocaleString()}</div>
          </div>

          <div className="p-5 rounded-[28px] bg-white border border-slate-200/60 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold text-slate-500">Telegram Bot</span>
              <div className="w-7 h-7 rounded-full bg-[#F6F6F3] flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-slate-700" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900">{stats.total_users.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-[28px] bg-white border border-slate-200/60 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Telefon, Ism yoki Telegram ID bo'yicha..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#F6F6F3] border-none rounded-full text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-300"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3.5 py-2 bg-[#F6F6F3] border-none rounded-full text-xs text-slate-700 font-semibold focus:outline-hidden cursor-pointer"
          >
            <option value="all">Barcha Turlar</option>
            <option value="archived">📦 Faqat Arxivlanganlar</option>
            <option value="merchant">🏪 Do'konlar (Merchants)</option>
            <option value="specialist">👨‍⚕️ Mutaxassislar</option>
            <option value="user">👤 Telegram Foydalanuvchilar</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as any)}
            className="px-3.5 py-2 bg-[#F6F6F3] border-none rounded-full text-xs text-slate-700 font-semibold focus:outline-hidden cursor-pointer"
          >
            <option value="all">Barcha Manbalar</option>
            <option value="biznesgo_bot">🤖 @biznesgo_bot</option>
            <option value="agroz_auth_bot">🤖 @agroz_auth_bot</option>
          </select>
        </div>
      </div>

      {/* Main Archive Table */}
      <div className="rounded-[32px] bg-white border border-slate-200/60 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F8F6] border-b border-slate-100 text-[11px] uppercase text-slate-400 font-bold tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Foydalanuvchi / Do'kon</th>
                <th className="px-5 py-3.5">Telefon</th>
                <th className="px-5 py-3.5">Telegram ID</th>
                <th className="px-5 py-3.5">Yo'nalishi</th>
                <th className="px-5 py-3.5">Manba</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Qayd Sanasi</th>
                <th className="px-5 py-3.5 text-right">Amallar</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading && !items.length ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-900" />
                    Baza yuklanmoqda...
                  </td>
                </tr>
              ) : !items.length ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Hech qanday ma'lumot topilmadi
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-slate-50/80 transition ${item.is_archived ? 'bg-amber-50/30' : ''}`}
                  >
                    {/* Name */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      {item.owner_name && item.owner_name !== item.name && (
                        <div className="text-[11px] text-slate-400">Egasi: {item.owner_name}</div>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="px-5 py-3.5 font-mono text-slate-600">
                      {item.phone || '—'}
                    </td>

                    {/* Telegram ID */}
                    <td className="px-5 py-3.5">
                      {item.telegram_id ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#F6F6F3] text-slate-700">
                          {item.telegram_id}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Business Type / Role */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700">
                        {item.business_type}
                      </span>
                    </td>

                    {/* Source Bot */}
                    <td className="px-5 py-3.5">
                      {item.source === 'biznesgo_bot' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          @biznesgo_bot
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                          @agroz_auth_bot
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      {item.is_archived ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Archive className="w-3 h-3" /> Arxivlangan
                        </span>
                      ) : item.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Faol
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {item.status === 'blocked' ? 'Bloklangan' : 'Nofaol'}
                        </span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="px-5 py-3.5 text-[11px] text-slate-400">
                      <div>{item.created_at ? new Date(item.created_at).toLocaleDateString('uz-UZ') : '—'}</div>
                      {item.is_archived && item.archived_at && (
                        <div className="text-[10px] text-amber-600 mt-0.5">
                          Arxiv: {new Date(item.archived_at).toLocaleDateString('uz-UZ')}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      {item.merchant_id ? (
                        item.is_archived ? (
                          <button
                            onClick={() => handleRestore(item.merchant_id!, item.name)}
                            disabled={actionLoading === `restore_${item.merchant_id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-black text-white hover:bg-slate-800 transition shadow-xs cursor-pointer"
                            title="Arxivdan qayta tiklash"
                          >
                            <RotateCcw className={`w-3 h-3 ${actionLoading === `restore_${item.merchant_id}` ? 'animate-spin' : ''}`} />
                            Tiklash
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchive(item.merchant_id!, item.name)}
                            disabled={actionLoading === `archive_${item.merchant_id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold text-slate-600 hover:text-amber-800 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 transition cursor-pointer"
                            title="Arxivlash (Soft-delete)"
                          >
                            <Archive className="w-3 h-3" />
                            Arxivlash
                          </button>
                        )
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Do'kon emas</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with Count */}
        <div className="p-4 bg-[#F8F8F6] border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <div>Jami ko'rsatilgan: <span className="font-bold text-slate-900">{items.length}</span> / {total}</div>
          <div>Barcha operatsiyalar Neon PostgreSQL orqali amalga oshiriladi</div>
        </div>
      </div>
    </div>
  );
};
