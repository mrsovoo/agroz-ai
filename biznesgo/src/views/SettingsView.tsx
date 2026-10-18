import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';
import { tg } from '../lib/telegram';
import { 
  Store, 
  Lock, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  LogOut, 
  User, 
  Send, 
  AlertCircle,
  Sprout,
  Scale,
  Building2,
  Wheat,
  Wrench,
  CheckCircle2
} from 'lucide-react';
import { BusinessType } from '../types';

const BUSINESS_TYPE_LABELS: Record<BusinessType, { title: string; icon: React.ElementType }> = {
  agro_vet: { title: 'Agro-Vet do‘kon / Dorixona', icon: Sprout },
  feed: { title: 'Yem-Ozuqa savdosi', icon: Scale },
  warehouse: { title: 'Ulgurji Ombor', icon: Building2 },
  seeds: { title: 'Urug‘ va Ko‘chat savdosi', icon: Wheat },
  machinery: { title: 'Agro-Texnika va Jihozlar', icon: Wrench },
};

export const SettingsView: React.FC = () => {
  const { merchant, setMerchant, addToast } = useStore();

  const [storeName, setStoreName] = useState(merchant?.store_name || '');
  const [phone, setPhone] = useState(merchant?.phone || '');
  const [address, setAddress] = useState(merchant?.address || '');
  const [saving, setSaving] = useState(false);

  // Password update (for web users)
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const businessMeta = merchant?.business_type 
    ? BUSINESS_TYPE_LABELS[merchant.business_type] 
    : { title: 'Noma‘lum', icon: Store };
  const BusinessIcon = businessMeta.icon;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !phone.trim()) {
      addToast('Do‘kon nomi va telefonni kiritish shart', 'error');
      return;
    }

    try {
      setSaving(true);
      const res = await api.auth.updateProfile({
        store_name: storeName.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });

      setMerchant(res.merchant);
      addToast('Sozlamalar muvaffaqiyatli saqlandi', 'success');
      tg.hapticImpact('medium');
    } catch (err: any) {
      addToast(err.message || 'Saqlashda xatolik yuz berdi', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      addToast('Barcha maydonlarni to‘ldiring', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('Yangi parollar mos kelmadi', 'error');
      return;
    }
    if (newPassword.length < 6) {
      addToast('Yangi parol kamida 6 ta belgidan iborat bo‘lsin', 'error');
      return;
    }

    try {
      setUpdatingPassword(true);
      await api.auth.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });

      addToast('Parol muvaffaqiyatli yangilandi', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      tg.hapticImpact('medium');
    } catch (err: any) {
      addToast(err.message || 'Parolni yangilashda xatolik', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Tizimdan chiqmoqchimisiz?')) {
      api.setToken(null);
      setMerchant(null);
      tg.hapticImpact('heavy');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Do‘kon Sozlamalari
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Boshqaruv profili, rekvizitlar va xavfsizlik sozlamalari
        </p>
      </div>

      {/* Locked Business Type Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <BusinessIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                Faol yo‘nalish
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>O‘zgarmas (Locked)</span>
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-1">
              {businessMeta.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Biznes turi ro‘yxatdan o‘tish chog‘ida tanlangan va tizim arxitekturasi aynan shunga moslashtirilgan.
            </p>
          </div>
        </div>
      </div>

      {/* Main Profile Form */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Store className="w-4 h-4 text-emerald-600" />
          <span>Asosiy ma'lumotlar</span>
        </h3>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Do‘kon / Savdo nuqtasi nomi *
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Telefon raqami *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Do‘kon manzili
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Viloyat, shahar, tuman, bozor nomi"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {saving ? 'Saqlanmoqda...' : 'O‘zgarishlarni saqlash'}
            </button>
          </div>
        </form>
      </div>

      {/* Security & Password (for Web users) */}
      {!tg.isTelegramWebApp() && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Xavfsizlik & Parol</span>
          </h3>

          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Amaldagi parol *
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Yangi parol *
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Yangi parolni tasdiqlang *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 flex justify-start">
              <button
                type="submit"
                disabled={updatingPassword}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm disabled:opacity-50 transition-all cursor-pointer"
              >
                {updatingPassword ? 'Yangilanmoqda...' : 'Parolni yangilash'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Telegram Session Status */}
      {tg.isTelegramWebApp() && (
        <div className="bg-sky-50 rounded-2xl border border-sky-200/80 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wide">
                Telegram sessiyasi faol
              </h4>
              <p className="text-xs text-sky-700 mt-0.5">
                Telegram Mini App orqali xavfsiz HMAC-SHA256 avtorizatsiyada ishlamoqdasiz.
              </p>
            </div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0" />
        </div>
      )}

      {/* Logout button */}
      <div className="pt-4 flex justify-end">
        <button
          onClick={handleLogout}
          className="px-5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Tizimdan chiqish</span>
        </button>
      </div>
    </div>
  );
};

