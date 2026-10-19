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
  CheckCircle2,
  CreditCard,
  Calendar,
  Clock,
  Sparkles,
  HelpCircle,
  Bell,
  UserCheck,
  Mail
} from 'lucide-react';
import { BusinessType } from '../types';
import { 
  DEFAULT_SUBSCRIPTION_PLAN, 
  SECTOR_SUPPORT_CONTACTS, 
  PLATFORM_NEWS 
} from '../lib/supportAndTariff';

const BUSINESS_TYPE_LABELS: Record<BusinessType, { title: string; icon: React.ElementType }> = {
  agro_vet: { title: 'Agro-Vet dorixona', icon: Sprout },
  feed: { title: 'Yem-ozuqa savdosi', icon: Scale },
  warehouse: { title: 'Ulgurji ombor', icon: Building2 },
  seeds: { title: 'Urug‘ va ko‘chat', icon: Wheat },
  machinery: { title: 'Jihoz va texnika', icon: Wrench },
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

      {/* Oylik Tarif va Obuna (Subscription) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Oylik Tarif & Obuna</span>
          </h3>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {DEFAULT_SUBSCRIPTION_PLAN.status === 'active' ? 'Faol Obuna' : 'Sinov Davri'}
          </span>
        </div>

        <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Amaldagi reja</div>
            <h4 className="text-lg font-black text-white mt-0.5">{DEFAULT_SUBSCRIPTION_PLAN.plan_name}</h4>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-300">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Qolgan muddat: <b className="text-white">{DEFAULT_SUBSCRIPTION_PLAN.days_left} kun</b></span>
              <span className="text-slate-500">•</span>
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Tugash sanasi: {DEFAULT_SUBSCRIPTION_PLAN.expires_at}</span>
            </div>
          </div>

          <div className="sm:text-right shrink-0">
            <div className="text-2xl font-black text-emerald-400">
              {DEFAULT_SUBSCRIPTION_PLAN.price_uzs.toLocaleString()} <span className="text-xs text-slate-400 font-normal">so‘m / oy</span>
            </div>
            <button
              type="button"
              onClick={() => {
                tg.hapticImpact('light');
                window.open('https://t.me/biznesgo_support', '_blank');
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Tarifni uzaytirish</span>
            </button>
          </div>
        </div>

        <div className="pt-2">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Tarif imkoniyatlari:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DEFAULT_SUBSCRIPTION_PLAN.features.map((f, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sektor bo‘yicha Qo‘llab-quvvatlash va Shaxsiy Mutaxassis */}
      {(() => {
        const sectorContact = SECTOR_SUPPORT_CONTACTS[merchant?.business_type || 'agro_vet'] || SECTOR_SUPPORT_CONTACTS.agro_vet;
        return (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>Qo‘llab-quvvatlash & Sektor Mutaxassisi</span>
              </h3>
              <span className="text-xs font-semibold text-slate-500">24/7 Navbatchilik</span>
            </div>

            <div className="bg-gradient-to-r from-emerald-950 to-slate-900 text-white rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-emerald-900">
              <div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                  <UserCheck className="w-3 h-3" />
                  Sizning sektor kuratoringiz
                </div>
                <h4 className="text-base font-bold text-white">{sectorContact.specialist_name}</h4>
                <p className="text-xs text-emerald-300 font-medium">{sectorContact.specialist_role}</p>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  {sectorContact.working_hours}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <a
                  href={`tel:${sectorContact.phone.replace(/\s+/g, '')}`}
                  className="px-3.5 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Qo‘ng‘iroq</span>
                </a>
                <a
                  href={`https://t.me/${sectorContact.telegram_username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Telegram</span>
                </a>
                <a
                  href={`mailto:${sectorContact.email || 'info@biznesgo.uz'}`}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs border border-white/10 font-mono"
                >
                  <Mail className="w-3.5 h-3.5 text-emerald-300" />
                  <span>info@biznesgo.uz</span>
                </a>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Kurator yordam beradigan masalalar:</div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1 text-[11px]">
                {sectorContact.topics.map((t, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })()}

      {/* Platforma Yangiliklari va E'lonlar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-600" />
          <span>Platforma Yangiliklari va E'lonlar</span>
        </h3>

        <div className="space-y-2.5">
          {PLATFORM_NEWS.slice(0, 3).map((item) => (
            <div key={item.id} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {item.badge}
                </span>
                <span className="text-[11px] text-slate-400">{item.date}</span>
              </div>
              <h5 className="text-xs font-bold text-slate-900">{item.title}</h5>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{item.summary}</p>
            </div>
          ))}
        </div>
      </div>

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

