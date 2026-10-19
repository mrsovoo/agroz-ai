import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';
import { tg } from '../lib/telegram';
import { formatCurrency, formatDate } from '../lib/utils';
import { Debt, Customer } from '../types';
import { Modal } from '../components/Modal';
import { 
  Users, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Phone, 
  Calendar,
  CreditCard,
  Banknote,
  DollarSign,
  AlertTriangle,
  ShieldAlert,
  Sprout,
  Scale,
  Building2,
  Wheat,
  Wrench,
  Sparkles,
  Repeat,
  CheckCircle,
  XCircle
} from 'lucide-react';

export const DebtsView: React.FC = () => {
  const { merchant, addToast } = useStore();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all');

  // Add Debt Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [debtAmount, setDebtAmount] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Sector specific form fields
  // 1. Agro-Vet: Ekin/Chorva profili
  const [cropOrAnimalProfile, setCropOrAnimalProfile] = useState('');

  // 2. Feed: Yem xarid chastotasi
  const [feedFrequencyDays, setFeedFrequencyDays] = useState<number | ''>(7);

  // 3. Warehouse: Kredit limiti
  const [creditLimit, setCreditLimit] = useState<number | ''>(10000000);

  // 4. Seeds: Ekish mavsumi
  const [plantingSeason, setPlantingSeason] = useState<'bahor' | 'kuz' | 'doimiy'>('bahor');

  // 5. Machinery: Bo'lib to'lash oylari va kafolat servis sanasi
  const [installmentMonths, setInstallmentMonths] = useState<number | ''>(6);
  const [warrantyServiceDate, setWarrantyServiceDate] = useState('');

  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Repay Modal
  const [repayingDebt, setRepayingDebt] = useState<Debt | null>(null);
  const [repayAmount, setRepayAmount] = useState<number | ''>('');
  const [paymentType, setPaymentType] = useState<'cash' | 'card'>('cash');
  const [repayNotes, setRepayNotes] = useState('');
  const [submittingRepay, setSubmittingRepay] = useState(false);

  const businessType = merchant?.business_type || 'agro_vet';

  const fetchDebts = async () => {
    try {
      setLoading(true);
      const data = await api.debts.list();
      setDebts(data);
    } catch (err: any) {
      addToast(err.message || 'Qarzlar yuklanmadi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  const resetAddForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setDebtAmount('');
    setDueDate('');
    setNotes('');
    setCropOrAnimalProfile('');
    setFeedFrequencyDays(7);
    setCreditLimit(10000000);
    setPlantingSeason('bahor');
    setInstallmentMonths(6);
    setWarrantyServiceDate('');
  };

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !debtAmount || Number(debtAmount) <= 0) {
      addToast('Mijoz ismi, telefon va qarz summasini to‘g‘ri kiriting', 'error');
      return;
    }

    // Warehouse uchun kredit limitini tekshirish
    if (businessType === 'warehouse' && creditLimit !== '') {
      const existingCustomerDebts = debts
        .filter((d) => d.customer_phone === customerPhone.trim() && d.status !== 'paid')
        .reduce((sum, d) => sum + Number(d.remaining_amount || d.remaining || 0), 0);

      const totalProjected = existingCustomerDebts + Number(debtAmount);
      if (totalProjected > Number(creditLimit)) {
        if (!window.confirm(`⚠️ DIQQAT! Xaridorning jami qarzi (${formatCurrency(totalProjected)}) belgilangan kredit limitidan (${formatCurrency(Number(creditLimit))}) oshib ketadi. Baribir tasdiqlaysizmi?`)) {
          return;
        }
      }
    }

    // Agro-Vet uchun qat'iy due_date nazorati
    if (businessType === 'agro_vet' && !dueDate) {
      addToast('Agro-Vet do‘konida qarz qaytarish muddati (due_date) ko‘rsatilishi shart!', 'error');
      return;
    }

    try {
      setSubmittingAdd(true);
      let calculatedMonthly = undefined;
      if (businessType === 'machinery' && installmentMonths && Number(installmentMonths) > 0) {
        calculatedMonthly = Math.round(Number(debtAmount) / Number(installmentMonths));
      }

      await api.debts.create({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        amount: Number(debtAmount),
        due_date: dueDate || undefined,
        notes: notes.trim() || undefined,
        // Sektorga xos CRM maydonlar
        crop_or_animal_profile: cropOrAnimalProfile.trim() || undefined,
        feed_frequency_days: feedFrequencyDays !== '' ? Number(feedFrequencyDays) : undefined,
        credit_limit: creditLimit !== '' ? Number(creditLimit) : undefined,
        installment_months: installmentMonths !== '' ? Number(installmentMonths) : undefined,
        monthly_payment: calculatedMonthly,
        warranty_service_date: warrantyServiceDate || undefined,
        planting_season: plantingSeason || undefined,
      } as any);

      addToast('Qarz muvaffaqiyatli yozildi', 'success');
      tg.hapticImpact('heavy');
      setIsAddModalOpen(false);
      resetAddForm();
      fetchDebts();
    } catch (err: any) {
      addToast(err.message || 'Qarz yozishda xatolik', 'error');
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleOpenRepay = (debt: Debt) => {
    setRepayingDebt(debt);
    setRepayAmount(debt.remaining_amount || debt.remaining || debt.total_amount);
    setPaymentType('cash');
    setRepayNotes('');
  };

  const handleRepay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayingDebt || !repayAmount || Number(repayAmount) <= 0) {
      addToast('To‘lov summasini kiriting', 'error');
      return;
    }

    try {
      setSubmittingRepay(true);
      await api.debts.repay(repayingDebt.id, {
        amount: Number(repayAmount),
        payment_type: paymentType,
        notes: repayNotes.trim() || undefined,
      });

      addToast('Qarz to‘lovi qabul qilindi!', 'success');
      tg.hapticImpact('heavy');
      setRepayingDebt(null);
      fetchDebts();
    } catch (err: any) {
      addToast(err.message || 'To‘lovni qabul qilishda xatolik', 'error');
    } finally {
      setSubmittingRepay(false);
    }
  };

  const filteredDebts = debts.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      (d.customer_name && d.customer_name.toLowerCase().includes(q)) ||
      (d.customer_phone && d.customer_phone.toLowerCase().includes(q)) ||
      (d.notes && d.notes.toLowerCase().includes(q)) ||
      (d.crop_or_animal_profile && d.crop_or_animal_profile.toLowerCase().includes(q));

    if (!matchesQuery) return false;

    if (statusFilter === 'unpaid') return d.status !== 'paid';
    if (statusFilter === 'paid') return d.status === 'paid';
    return true;
  });

  const totalOutstanding = debts
    .filter((d) => d.status !== 'paid')
    .reduce((sum, d) => sum + Number(d.remaining_amount || d.remaining || 0), 0);

  const activeDebtorsCount = new Set(
    debts.filter((d) => d.status !== 'paid').map((d) => d.customer_id || d.customer_phone)
  ).size;

  const overdueCount = debts.filter(
    (d) => d.status !== 'paid' && d.due_date && new Date(d.due_date).getTime() < Date.now()
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Qarz Daftari & Mijozlar (CRM)
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              {businessType === 'agro_vet' && '🌿 Agro-Vet Profil'}
              {businessType === 'feed' && '🌾 Yem Xarid Davri'}
              {businessType === 'warehouse' && '🏢 B2B Kredit Limiti'}
              {businessType === 'seeds' && '🌱 Ekish Mavsumi'}
              {businessType === 'machinery' && '🔧 Bo‘lib to‘lash'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Xaridorlar qarzlari, to‘lov grafigi va sektorga mos xarid eslatmalari
          </p>
        </div>
        <button
          onClick={() => {
            resetAddForm();
            setIsAddModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi qarz yozish</span>
        </button>
      </div>

      {/* Sektorga Xos CRM & Qarz Eslatmalari Banneri */}
      {businessType === 'agro_vet' && overdueCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="p-2 bg-rose-100 text-rose-700 rounded-xl shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-900">
              ⚠️ Qarz qaytarish muddati o‘tgan {overdueCount} ta mijoz mavjud!
            </h3>
            <p className="text-xs text-rose-700 mt-0.5">
              Agro-Vet dorixonasida mavsumiy ekin va hosil yig‘im muddatlariga qat'iy e'tibor bering. Mijozlar bilan bog‘laning.
            </p>
          </div>
        </div>
      )}

      {businessType === 'feed' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-0.5">
            <Repeat className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900">
              🌾 Yem sotib olish davriyligi (Har 7–10 kunda)
            </h3>
            <p className="text-xs text-amber-700 mt-0.5">
              Chorvador va parrandachilar odatda har haftada ozuqa sotib oladi. Qarzini qisman to‘lagan mijozlar ro‘yxatini nazorat qiling.
            </p>
          </div>
        </div>
      )}

      {businessType === 'warehouse' && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-xl shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-blue-900">
              🏢 B2B Do‘konlar va Kredit Limiti nazorati
            </h3>
            <p className="text-xs text-blue-700 mt-0.5">
              Dilerlar va do‘konlarga berilgan kredit limitlari hisoblanadi. Limitdan oshgan holatlarda yangi tovar berish cheklanadi.
            </p>
          </div>
        </div>
      )}

      {businessType === 'seeds' && (
        <div className="bg-lime-50 border border-lime-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="p-2 bg-lime-100 text-lime-800 rounded-xl shrink-0 mt-0.5">
            <Wheat className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-lime-900">
              🌱 Ekish mavsumi va Fermerlar CRM xabarnomalari
            </h3>
            <p className="text-xs text-lime-800 mt-0.5">
              Bahoriy va kuzgi ekish mavsumlariga tayyorgarlik ko‘rayotgan xo‘jaliklarga urug‘ navlari va unuvchanlik bo‘yicha eslatmalar yuborish.
            </p>
          </div>
        </div>
      )}

      {businessType === 'machinery' && (
        <div className="bg-slate-100 border border-slate-300 rounded-2xl p-4 flex items-start gap-3">
          <div className="p-2 bg-slate-200 text-slate-800 rounded-xl shrink-0 mt-0.5">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              🔧 Bo‘lib to‘lash (Installment) & Texnik Kafolat Servisi
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Katta qiymatli motoblok, nasos va texnikalar bo‘yicha oylik to‘lovlar va kafolat xizmati muddatlari nazorati.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
            Umumiy ochiq qarz
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-rose-700">
            {formatCurrency(totalOutstanding)}
          </div>
          <p className="text-xs text-rose-600/80 mt-1">
            Qaytarilishi kutilayotgan umumiy balans
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Faol qarzdorlar
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
            {activeDebtorsCount} nafar
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Qarzdorlik yozuvi mavjud mijozlar
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Muddati o‘tganlar
          </span>
          <div className={`mt-2 text-2xl sm:text-3xl font-black ${overdueCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {overdueCount} ta
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Qaytarish sanasi kechikkan qarzlar
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Mijoz ismi, telefon, ekin/profil yoki izoh..."
            className="block w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Status tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Barchasi
          </button>
          <button
            onClick={() => setStatusFilter('unpaid')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'unpaid'
                ? 'bg-white text-rose-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Faol qarzlar
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'paid'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Yopilganlar
          </button>
        </div>
      </div>

      {/* Debts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Qarz daftari yuklanmoqda...</p>
          </div>
        ) : filteredDebts.length === 0 ? (
          <div className="py-20 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">Qarzlar topilmadi</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Hozirda qarz daftaringiz toza yoki qidiruv so‘rovingizga mos yozuv yo‘q.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4">Qarzdor shaxs / Mijoz</th>
                  <th className="py-3.5 px-4">Umumiy qarz</th>
                  <th className="py-3.5 px-4">To‘langan</th>
                  <th className="py-3.5 px-4">Qoldiq qarz</th>

                  {/* Sektorga mos ustunlar */}
                  {businessType === 'agro_vet' && (
                    <th className="py-3.5 px-4">Ekin / Chorva profili</th>
                  )}
                  {businessType === 'feed' && (
                    <th className="py-3.5 px-4">Xarid chastotasi</th>
                  )}
                  {businessType === 'warehouse' && (
                    <th className="py-3.5 px-4">Kredit Limiti</th>
                  )}
                  {businessType === 'seeds' && (
                    <th className="py-3.5 px-4">Ekish mavsumi</th>
                  )}
                  {businessType === 'machinery' && (
                    <th className="py-3.5 px-4">Bo‘lib to‘lash grafigi</th>
                  )}

                  <th className="py-3.5 px-4">Qaytarish muddati</th>
                  <th className="py-3.5 px-4">Holat</th>
                  <th className="py-3.5 px-4 text-right">To‘lov olish</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDebts.map((debt) => {
                  const remaining = debt.remaining_amount ?? debt.remaining ?? (debt.total_amount - (debt.paid_amount || 0));
                  const isPaid = debt.status === 'paid' || remaining <= 0;
                  const isOverdue =
                    !isPaid &&
                    debt.due_date &&
                    new Date(debt.due_date).getTime() < Date.now();

                  return (
                    <tr key={debt.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {debt.customer_name || 'Noma‘lum xaridor'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{debt.customer_phone || '—'}</span>
                        </div>
                        {debt.notes && (
                          <div className="text-[10px] text-slate-400 italic mt-0.5">
                            "{debt.notes}"
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        {formatCurrency(debt.total_amount || debt.total_debt || 0)}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-emerald-600">
                        {formatCurrency(debt.paid_amount || 0)}
                      </td>

                      <td className="py-3.5 px-4 font-black text-rose-600 text-sm">
                        {formatCurrency(remaining)}
                      </td>

                      {/* Sektor 1: Agro-Vet (Ekin / Chorva profili) */}
                      {businessType === 'agro_vet' && (
                        <td className="py-3.5 px-4 text-slate-600">
                          {debt.crop_or_animal_profile ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">
                              <Sprout className="w-3 h-3" />
                              <span>{debt.crop_or_animal_profile}</span>
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      )}

                      {/* Sektor 2: Feed (Yem sotib olish davriyligi) */}
                      {businessType === 'feed' && (
                        <td className="py-3.5 px-4 text-slate-600">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">
                            <Repeat className="w-3 h-3" />
                            <span>Har {debt.feed_frequency_days || 7} kunda</span>
                          </span>
                        </td>
                      )}

                      {/* Sektor 3: Warehouse (Kredit Limiti) */}
                      {businessType === 'warehouse' && (
                        <td className="py-3.5 px-4 text-slate-600">
                          {debt.credit_limit ? (
                            <div>
                              <div className="font-bold text-blue-900">
                                {formatCurrency(debt.credit_limit)}
                              </div>
                              {remaining > debt.credit_limit && (
                                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1 py-0.5 rounded">
                                  Limit oshgan!
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">10 000 000 so‘m (standart)</span>
                          )}
                        </td>
                      )}

                      {/* Sektor 4: Seeds (Ekish mavsumi) */}
                      {businessType === 'seeds' && (
                        <td className="py-3.5 px-4 text-slate-600">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-lime-50 text-lime-800 border border-lime-200 text-[11px] font-bold">
                            <Wheat className="w-3 h-3" />
                            <span>{debt.planting_season === 'kuz' ? 'Kuzgi ekish' : 'Bahoriy ekish'}</span>
                          </span>
                        </td>
                      )}

                      {/* Sektor 5: Machinery (Bo'lib to'lash) */}
                      {businessType === 'machinery' && (
                        <td className="py-3.5 px-4 text-slate-600">
                          {debt.installment_months ? (
                            <div>
                              <div className="font-bold text-slate-900">{debt.installment_months} oyga bo‘lingan</div>
                              {debt.monthly_payment && (
                                <div className="text-[11px] text-emerald-700 font-semibold">
                                  {formatCurrency(debt.monthly_payment)} / oy
                                </div>
                              )}
                            </div>
                          ) : (
                            'Standart nasiya'
                          )}
                        </td>
                      )}

                      {/* Qaytarish muddati */}
                      <td className="py-3.5 px-4">
                        {debt.due_date ? (
                          <div
                            className={`flex items-center gap-1 font-semibold ${
                              isOverdue ? 'text-red-600' : 'text-slate-600'
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(debt.due_date)}</span>
                            {isOverdue && (
                              <span className="text-[9px] uppercase px-1 py-0.5 bg-red-100 text-red-700 font-bold rounded">
                                Muddati o‘tgan
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">Belgilanmagan</span>
                        )}
                      </td>

                      {/* Holat */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : isOverdue
                              ? 'bg-red-100 text-red-800'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {isPaid ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>To‘langan</span>
                            </>
                          ) : isOverdue ? (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              <span>Kechikkan</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>Faol qarz</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Amallar */}
                      <td className="py-3.5 px-4 text-right">
                        {!isPaid && (
                          <button
                            onClick={() => handleOpenRepay(debt)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                          >
                            To‘lov olish
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Debt Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Qarz yozish (Nasiya berish)"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddDebt} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Xaridor ismi *
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Masalan: Jamshid aka (Fermer)"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Telefon raqami *
            </label>
            <input
              type="tel"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+998 90 123 45 67"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Qarz summasi (so‘m) *
            </label>
            <input
              type="number"
              required
              min="100"
              value={debtAmount}
              onChange={(e) => setDebtAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="500 000"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-black text-rose-700"
            />
          </div>

          {/* Sektorga mos maxsus CRM bloklari */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h5 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sohaviy CRM ma’lumotlari</span>
            </h5>

            {/* Agro-Vet: Ekin yoki chorva profili */}
            {businessType === 'agro_vet' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Ekin yoki chorva profili *
                </label>
                <input
                  type="text"
                  value={cropOrAnimalProfile}
                  onChange={(e) => setCropOrAnimalProfile(e.target.value)}
                  placeholder="Masalan: Paxta 15 gektar, Qoramol 30 bosh"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* Feed: Yem xarid chastotasi */}
            {businessType === 'feed' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Yem xarid qilish chastotasi (kun)
                </label>
                <select
                  value={feedFrequencyDays}
                  onChange={(e) => setFeedFrequencyDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value={7}>Har 7 kunda (Haftalik)</option>
                  <option value={10}>Har 10 kunda</option>
                  <option value={14}>Har 14 kunda (2 haftada bir)</option>
                  <option value={30}>Har 30 kunda (Oylik)</option>
                </select>
              </div>
            )}

            {/* Warehouse: Kredit Limiti */}
            {businessType === 'warehouse' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Kredit Limiti (so‘m)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500000"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="10 000 000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Ushbu limit oshsa, yangi tovar berish cheklanadi.
                </p>
              </div>
            )}

            {/* Seeds: Ekish mavsumi */}
            {businessType === 'seeds' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Ekish mavsumi
                </label>
                <select
                  value={plantingSeason}
                  onChange={(e) => setPlantingSeason(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lime-500 font-semibold"
                >
                  <option value="bahor">Bahoriy ekish mavsumi</option>
                  <option value="kuz">Kuzgi ekish mavsumi</option>
                  <option value="doimiy">Doimiy (Issiqxona / To‘xtovsiz)</option>
                </select>
              </div>
            )}

            {/* Machinery: Bo'lib to'lash oylari */}
            {businessType === 'machinery' && (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Bo‘lib to‘lash muddati (oy)
                  </label>
                  <select
                    value={installmentMonths}
                    onChange={(e) => setInstallmentMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-500 font-bold"
                  >
                    <option value={3}>3 oyga bo‘lib to‘lash</option>
                    <option value={6}>6 oyga bo‘lib to‘lash</option>
                    <option value={12}>12 oyga bo‘lib to‘lash</option>
                    <option value={24}>24 oyga bo‘lib to‘lash</option>
                  </select>
                </div>
                {debtAmount && installmentMonths && (
                  <div className="text-xs font-bold text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    Oylik to‘lov: {formatCurrency(Math.round(Number(debtAmount) / Number(installmentMonths)))} / oy
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Qaytarish muddati (Due date) {businessType === 'agro_vet' ? '*' : ''}
            </label>
            <input
              type="date"
              required={businessType === 'agro_vet'}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Izoh / Sabab
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Masalan: 2 qop yem va dorilar olib ketdi"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={submittingAdd}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
            >
              {submittingAdd ? 'Saqlanmoqda...' : 'Qarzni yozish'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Repay Modal */}
      <Modal
        isOpen={Boolean(repayingDebt)}
        onClose={() => setRepayingDebt(null)}
        title="Qarz to‘lovini qabul qilish"
        maxWidth="max-w-md"
      >
        {repayingDebt && (
          <form onSubmit={handleRepay} className="space-y-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Xaridor:</span>
                <span className="font-bold text-slate-900">{repayingDebt.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Qoldiq qarz:</span>
                <span className="font-extrabold text-rose-600">
                  {formatCurrency(repayingDebt.remaining_amount || repayingDebt.remaining || 0)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                To‘lov summasi (so‘m) *
              </label>
              <input
                type="number"
                required
                min="100"
                max={repayingDebt.remaining_amount || repayingDebt.remaining || repayingDebt.total_amount}
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-black text-emerald-800 text-base"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                To‘lov turi *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentType('cash')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    paymentType === 'cash'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>Naqd pul</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('card')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    paymentType === 'card'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Plastik karta</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Izoh (ixtiyoriy)
              </label>
              <input
                type="text"
                value={repayNotes}
                onChange={(e) => setRepayNotes(e.target.value)}
                placeholder="Masalan: Bir qismini qaytardi"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRepayingDebt(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={submittingRepay}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
              >
                {submittingRepay ? 'Qabul qilinmoqda...' : 'To‘lovni qabul qilish'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
