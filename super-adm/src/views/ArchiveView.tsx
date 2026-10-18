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
  UserCheck
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

    // UTF-8 BOM qo'shish (Excelda to'g'ri ochilishi uchun)
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
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Archive className="w-7 h-7 text-emerald-400" />
            Arxiv va Foydalanuvchilar Bazasi
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Neon DB dagi barcha foydalanuvchilar, dual-bot ro'yxatlari va arxivlangan profillar (Soft-delete)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadArchive}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition border border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            Yangilash
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!items.length}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-950/40"
          >
            <Download className="w-4 h-4" />
            Excel / CSV Yuklab olish
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Jami Yozuvlar</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.total_all.toLocaleString()}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-amber-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-amber-400 text-xs mb-1">
              <ArchiveRestore className="w-4 h-4" />
              <span>Arxivlanganlar</span>
            </div>
            <div className="text-2xl font-bold text-amber-400">{stats.total_archived.toLocaleString()}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Store className="w-4 h-4 text-teal-400" />
              <span>BiznesGO Sotuvchilar</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.total_merchants.toLocaleString()}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <UserCheck className="w-4 h-4 text-sky-400" />
              <span>Agroz Mutaxassislar</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.total_specialists.toLocaleString()}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>Telegram Mijozlar</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.total_users.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Telefon, Ism yoki Telegram ID bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Barcha Turlar</option>
            <option value="archived">📦 Faqat Arxivlanganlar</option>
            <option value="merchant">🏪 Do'konlar (Merchants)</option>
            <option value="specialist">👨‍⚕️ Mutaxassislar</option>
            <option value="user">👤 Telegram Foydalanuvchilar</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Barcha Manbalar</option>
            <option value="biznesgo_bot">🤖 @biznesgo_bot</option>
            <option value="agroz_auth_bot">🤖 @agroz_auth_bot</option>
          </select>
        </div>
      </div>

      {/* Main Archive Table */}
      <div className="rounded-2xl bg-slate-800/40 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-xs uppercase text-slate-400 font-semibold tracking-wider">
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

            <tbody className="divide-y divide-slate-800/60">
              {loading && !items.length ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                    Baza yuklanmoqda...
                  </td>
                </tr>
              ) : !items.length ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Hech qanday ma'lumot topilmadi
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-slate-800/50 transition ${item.is_archived ? 'bg-amber-950/10' : ''}`}
                  >
                    {/* Name */}
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-white">{item.name}</div>
                      {item.owner_name && item.owner_name !== item.name && (
                        <div className="text-xs text-slate-400">Egasi: {item.owner_name}</div>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="px-5 py-3.5 font-mono text-slate-300">
                      {item.phone || '—'}
                    </td>

                    {/* Telegram ID */}
                    <td className="px-5 py-3.5">
                      {item.telegram_id ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-slate-300">
                          {item.telegram_id}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Business Type / Role */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-800 text-slate-300 border border-slate-700/80">
                        {item.business_type}
                      </span>
                    </td>

                    {/* Source Bot */}
                    <td className="px-5 py-3.5">
                      {item.source === 'biznesgo_bot' ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          @biznesgo_bot
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          @agroz_auth_bot
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      {item.is_archived ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <Archive className="w-3 h-3" /> Arxivlangan
                        </span>
                      ) : item.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Faol
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          {item.status === 'blocked' ? 'Bloklangan' : 'Nofaol'}
                        </span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      <div>{item.created_at ? new Date(item.created_at).toLocaleDateString('uz-UZ') : '—'}</div>
                      {item.is_archived && item.archived_at && (
                        <div className="text-[10px] text-amber-400/80 mt-0.5">
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 transition"
                            title="Arxivdan qayta tiklash"
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${actionLoading === `restore_${item.merchant_id}` ? 'animate-spin' : ''}`} />
                            Tiklash
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchive(item.merchant_id!, item.name)}
                            disabled={actionLoading === `archive_${item.merchant_id}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/30 transition"
                            title="Arxivlash (Soft-delete)"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            Arxivlash
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-slate-600 italic">Do'kon emas</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with Count */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>Jami ko'rsatilgan: <span className="font-semibold text-white">{items.length}</span> / {total}</div>
          <div>Barcha operatsiyalar Neon PostgreSQL orqali amalga oshiriladi</div>
        </div>
      </div>
    </div>
  );
};
