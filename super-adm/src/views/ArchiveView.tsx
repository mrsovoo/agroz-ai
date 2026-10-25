import React, { useState, useEffect } from 'react';
import {
  Archive,
  Search,
  Database,
  Building2,
  Users,
  UserCheck,
  FileCheck2,
  Bot,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  Zap,
  Eye,
  X,
  RefreshCw,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { adminApi } from '../lib/api';

export const ArchiveView: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [summary, setSummary] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [activatingUid, setActivatingUid] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string>('');
  const [showFullPhones, setShowFullPhones] = useState<boolean>(true);

  const loadArchive = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getNeonArchiveAll();
      setSummary(res.summary);
      setItems(res.items || []);
    } catch (err: any) {
      setError(err.message || 'Neon DB arxivini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArchive();
  }, []);

  const handleActivateInBiznesGo = async (item: any) => {
    if (!item.phone || item.phone.startsWith('tg:')) {
      alert('Faollashtirish uchun haqiqiy telefon raqami mavjud bo\'lishi kerak');
      return;
    }
    setActivatingUid(item.uid);
    setActionMessage('');
    try {
      const res = await adminApi.activateNeonArchiveItem({
        phone: item.phone,
        name: item.name,
        owner_name: item.owner_name || item.name,
        address: item.address !== 'Kiritilmagan' ? item.address : item.region,
        telegram_id: item.telegram_id,
        sector_type: 'agro_vet'
      });
      setActionMessage(res.message);
      await loadArchive();
    } catch (err: any) {
      alert(err.message || 'Faollashtirishda xatolik');
    } finally {
      setActivatingUid(null);
    }
  };

  const filteredItems = items.filter((item) => {
    if (activeCategory === 'deleted_profile') {
      if (item.category !== 'deleted_profile' && !item.delete_reason) {
        return false;
      }
    } else if (activeCategory !== 'all' && item.category !== activeCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = String(item.name || '').toLowerCase().includes(q);
      const matchOwner = String(item.owner_name || '').toLowerCase().includes(q);
      const matchPhone = String(item.phone || '').toLowerCase().includes(q);
      const matchTg = String(item.telegram_id || '').toLowerCase().includes(q);
      const matchRegion = String(item.region || '').toLowerCase().includes(q);
      const matchAddr = String(item.address || '').toLowerCase().includes(q);
      const matchDeleteReason = String(item.delete_reason || '').toLowerCase().includes(q);
      return matchName || matchOwner || matchPhone || matchTg || matchRegion || matchAddr || matchDeleteReason;
    }
    return true;
  });

  const categories = [
    { id: 'all', label: 'Barcha Yozuvlar', count: items.length, icon: Database },
    {
      id: 'biznesgo_store',
      label: "BiznesGO Do'konlari",
      count: items.filter((i) => i.category === 'biznesgo_store').length,
      icon: Building2
    },
    {
      id: 'deleted_profile',
      label: "O'chirilgan Profillar (Bot)",
      count: items.filter((i) => i.category === 'deleted_profile' || Boolean(i.delete_reason)).length,
      icon: Trash2
    },
    {
      id: 'farmer_user',
      label: 'Bot / Fermer Foydalanuvchilari',
      count: items.filter((i) => i.category === 'farmer_user').length,
      icon: Users
    },
    {
      id: 'specialist',
      label: 'Agro/Vet Mutaxassislar',
      count: items.filter((i) => i.category === 'specialist').length,
      icon: UserCheck
    },
    {
      id: 'data_consent',
      label: "O'RQ-547 Rozilik Bitimlari",
      count: items.filter((i) => i.category === 'data_consent').length,
      icon: FileCheck2
    },
    {
      id: 'bot_session',
      label: 'Telegram Bot Holatlari',
      count: items.filter((i) => i.category === 'bot_session').length,
      icon: Bot
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
            <Archive className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-lg font-bold text-white">
                Neon PostgreSQL Ma'lumotlar Arxivi
              </h2>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Neon Cloud DB
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Neon bazada oldin ro'yxatdan o'tgan barcha BiznesGO do'konlari, fermer/bot foydalanuvchilari, agro-vet mutaxassislari va rozilik bitimlari arxivi.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFullPhones(!showFullPhones)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-2 transition-all"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>{showFullPhones ? 'Raqamlarni yashirish' : "To'liq raqamlarni ko'rsatish"}</span>
          </button>
          <button
            onClick={loadArchive}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yangilash</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-4 flex items-center justify-between text-emerald-200 text-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage('')} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-950/60 border border-rose-500/40 rounded-xl p-4 text-rose-200 text-xs">
          {error}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] text-slate-400">BiznesGO Do'konlari</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {summary?.biznesgo_stores_count ?? 0} ta
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">biznesgo_merchants</div>
        </div>
        <div className="bg-slate-900/90 border border-rose-500/30 rounded-xl p-4">
          <div className="text-[11px] text-rose-300">O'chirilgan Profillar (Bot)</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">
            {summary?.deleted_profiles_count ?? 0} ta
          </div>
          <div className="text-[10px] text-rose-400/70 mt-1 font-mono">deleted_profiles + sabab</div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] text-slate-400">Bot / Fermer Foydalanuvchilar</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">
            {summary?.farmer_users_count ?? 0} ta
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">users jadvali</div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] text-slate-400">Agro/Vet Mutaxassislar</div>
          <div className="text-2xl font-bold text-purple-400 mt-1">
            {summary?.specialists_count ?? 0} ta
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">specialists jadvali</div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] text-slate-400">Rozilik Bitimlari (O'RQ-547)</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {summary?.consents_count ?? 0} ta
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">data_consents jadvali</div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] text-slate-400">Bot Sessiyalari</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">
            {summary?.bot_sessions_count ?? 0} ta
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">bot_states jadvali</div>
        </div>
      </div>

      {/* Category Filter Tabs & Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    active ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ism, do'kon nomi, telefon raqami (+998...), Telegram ID yoki viloyat bo'yicha qidirish..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Archive Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Foydalanuvchi / Do'kon</th>
                <th className="py-3.5 px-4">Neon Jadvali (Manba)</th>
                <th className="py-3.5 px-4">Telefon &amp; Telegram ID</th>
                <th className="py-3.5 px-4">Hudud &amp; Manzil</th>
                <th className="py-3.5 px-4">BiznesGO Holati</th>
                <th className="py-3.5 px-4 text-right">Arxiv &amp; Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Neon DB arxivi yuklanmoqda...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Qidiruv bo'yicha yozuvlar topilmadi
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.uid} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100">{item.name}</div>
                      {item.owner_name && item.owner_name !== item.name && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Mas'ul: {item.owner_name}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {item.created_at
                            ? new Date(item.created_at).toLocaleString('uz-UZ')
                            : 'Noma\'lum vaqt'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium border ${
                          item.category === 'deleted_profile'
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : item.category === 'biznesgo_store'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : item.category === 'specialist'
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                            : item.category === 'farmer_user'
                            ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                            : item.category === 'data_consent'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {item.category_label}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono">
                        Tur: {item.role_or_type}
                      </div>
                      {item.delete_reason && (
                        <div className="mt-1.5 px-2 py-1 rounded bg-rose-950/70 border border-rose-500/30 text-[10px] text-rose-200 max-w-xs">
                          <span className="font-semibold text-rose-400">O'chirish sababi:</span> {item.delete_reason}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center space-x-1.5 text-slate-200">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{showFullPhones ? item.phone : item.masked_phone}</span>
                      </div>
                      {item.second_phone && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Qo'shimcha: {item.second_phone}
                        </div>
                      )}
                      {item.telegram_id && (
                        <div className="text-[10px] text-indigo-400 mt-0.5">
                          TG ID: {item.telegram_id}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1 text-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{item.region}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 max-w-xs truncate">
                        {item.address}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {item.category === 'deleted_profile' || item.delete_reason ? (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Botdan O'chirilgan</span>
                        </span>
                      ) : item.is_biznesgo_active ? (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>BiznesGO Faol (0-holat)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          Faqat Arxivda
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedItem(item)}
                          title="Neon Arxiv ma'lumotlarini ko'rish"
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition-all text-xs font-medium"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          <span>Arxiv</span>
                        </button>

                        {!item.is_biznesgo_active && item.phone && !item.phone.startsWith('tg:') && (
                          <button
                            onClick={() => handleActivateInBiznesGo(item)}
                            disabled={activatingUid === item.uid}
                            title="BiznesGO B2B platformasida do'kon sifatida faollashtirish"
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-all text-xs font-medium"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>
                              {activatingUid === item.uid ? 'Ulanyapti...' : 'Faollashtirish'}
                            </span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Archive Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                  <Archive className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Neon DB Arxiv Kartochkasi: {selectedItem.name}
                  </h3>
                  <p className="text-[11px] text-indigo-400 font-mono">
                    Manba jadvali: {selectedItem.raw_data?.source_table}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                  <div className="text-[10px] text-slate-500 uppercase">Nomi / F.I.Sh</div>
                  <div className="text-sm font-semibold text-white mt-1">{selectedItem.name}</div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                  <div className="text-[10px] text-slate-500 uppercase">Mas'ul Shaxs</div>
                  <div className="text-sm font-semibold text-slate-200 mt-1">
                    {selectedItem.owner_name || selectedItem.name}
                  </div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                  <div className="text-[10px] text-slate-500 uppercase">Telefon Raqami</div>
                  <div className="text-sm font-mono font-semibold text-emerald-400 mt-1">
                    {selectedItem.phone}
                  </div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                  <div className="text-[10px] text-slate-500 uppercase">Telegram Chat ID</div>
                  <div className="text-sm font-mono font-semibold text-indigo-400 mt-1">
                    {selectedItem.telegram_id || 'Biriktirilmagan'}
                  </div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 sm:col-span-2">
                  <div className="text-[10px] text-slate-500 uppercase">Manzil va Hudud</div>
                  <div className="text-xs text-slate-200 mt-1">
                    {selectedItem.region} — {selectedItem.address}
                  </div>
                </div>
                {selectedItem.delete_reason && (
                  <div className="bg-rose-950/50 border border-rose-500/40 rounded-xl p-4 sm:col-span-2 space-y-1.5">
                    <div className="flex items-center space-x-2 text-rose-300 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Profil Telegram Bot Orqali O'chirilgan</span>
                    </div>
                    <div className="text-xs text-rose-100">
                      <span className="text-rose-400 font-semibold">Keltirilgan sabab:</span>{' '}
                      {selectedItem.delete_reason}
                    </div>
                    {selectedItem.deleted_at && (
                      <div className="text-[11px] text-rose-300/80 font-mono">
                        O'chirilgan vaqti: {new Date(selectedItem.deleted_at).toLocaleString('uz-UZ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="text-[11px] font-semibold text-slate-300 mb-2 flex items-center justify-between">
                  <span>Neon DB Asl Yozuvi (Raw JSON):</span>
                  <span className="text-[10px] font-mono text-indigo-400">
                    PostgreSQL / neondb
                  </span>
                </div>
                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-72">
                  {JSON.stringify(selectedItem.raw_data, null, 2)}
                </pre>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <div>
                {!selectedItem.is_biznesgo_active &&
                  selectedItem.phone &&
                  !selectedItem.phone.startsWith('tg:') && (
                    <button
                      onClick={() => {
                        handleActivateInBiznesGo(selectedItem);
                        setSelectedItem(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-2"
                    >
                      <Zap className="w-4 h-4" />
                      <span>BiznesGO B2B Sifatida Faollashtirish</span>
                    </button>
                  )}
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
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

