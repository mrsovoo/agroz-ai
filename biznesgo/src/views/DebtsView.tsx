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
  DollarSign
} from 'lucide-react';

export const DebtsView: React.FC = () => {
  const { addToast } = useStore();
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
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Repay Modal
  const [repayingDebt, setRepayingDebt] = useState<Debt | null>(null);
  const [repayAmount, setRepayAmount] = useState<number | ''>('');
  const [paymentType, setPaymentType] = useState<'cash' | 'card'>('cash');
  const [repayNotes, setRepayNotes] = useState('');
  const [submittingRepay, setSubmittingRepay] = useState(false);

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

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !debtAmount || Number(debtAmount) <= 0) {
      addToast('Mijoz ismi, telefon va qarz summasini to‘g‘ri kiriting', 'error');
      return;
    }

    try {
      setSubmittingAdd(true);
      await api.debts.create({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        amount: Number(debtAmount),
        due_date: dueDate || undefined,
        notes: notes.trim() || undefined,
      });

      addToast('Qarz muvaffaqiyatli yozildi', 'success');
      tg.hapticImpact('heavy');
      setIsAddModalOpen(false);
      setCustomerName('');
      setCustomerPhone('');
      setDebtAmount('');
      setDueDate('');
      setNotes('');
      fetchDebts();
    } catch (err: any) {
      addToast(err.message || 'Qarz yozishda xatolik', 'error');
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleOpenRepay = (debt: Debt) => {
    setRepayingDebt(debt);
    setRepayAmount(debt.remaining_amount);
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
      (d.notes && d.notes.toLowerCase().includes(q));

    if (!matchesQuery) return false;

    if (statusFilter === 'unpaid') return d.status !== 'paid';
    if (statusFilter === 'paid') return d.status === 'paid';
    return true;
  });

  const totalOutstanding = debts
    .filter((d) => d.status !== 'paid')
    .reduce((sum, d) => sum + Number(d.remaining_amount || 0), 0);

  const activeDebtorsCount = new Set(
    debts.filter((d) => d.status !== 'paid').map((d) => d.customer_id || d.customer_phone)
  ).size;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Qarz Daftari (Nasiyalar)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Xaridorlarning qarzlari, to‘lov muddatlari va hisob-kitoblar
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi qarz yozish</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
            Umumiy qaytarilmagan qarz
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-rose-700">
            {formatCurrency(totalOutstanding)}
          </div>
          <p className="text-xs text-rose-600/80 mt-1">
            Xaridorlar tomonidan qaytarilishi kutilayotgan mablag‘
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
            Hozirda qarzdorlik balansi mavjud bo‘lgan xaridorlar
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
            placeholder="Qarzdor ismi yoki telefon raqami..."
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
              Hozirda qarz daftaringiz toza yoki qidiruv bo‘yicha yozuv yo‘q.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4">Qarzdor shaxs</th>
                  <th className="py-3.5 px-4">Umumiy qarz</th>
                  <th className="py-3.5 px-4">To‘langan</th>
                  <th className="py-3.5 px-4">Qoldiq qarz</th>
                  <th className="py-3.5 px-4">Qaytarish muddati</th>
                  <th className="py-3.5 px-4">Holat</th>
                  <th className="py-3.5 px-4 text-right">To‘lov qilish</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDebts.map((debt) => {
                  const isPaid = debt.status === 'paid' || debt.remaining_amount <= 0;
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
                        {formatCurrency(debt.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-600">
                        {formatCurrency(debt.paid_amount || 0)}
                      </td>
                      <td className="py-3.5 px-4 font-black text-rose-600 text-sm">
                        {formatCurrency(debt.remaining_amount)}
                      </td>
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
                              <span className="text-[9px] uppercase px-1 py-0.2 bg-red-100 text-red-700 font-bold rounded">
                                Muddati o‘tgan
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">Belgilanmagan</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {isPaid ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>To‘langan</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>Qarzdor</span>
                            </>
                          )}
                        </span>
                      </td>
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
              placeholder="Masalan: Jamshid aka"
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
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Qaytarish muddati (Due date)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
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

          <div className="pt-2 flex items-center justify-end gap-2">
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
              {submittingAdd ? 'Yozilmoqda...' : 'Qarzni yozish'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Repay Modal */}
      {repayingDebt && (
        <Modal
          isOpen={Boolean(repayingDebt)}
          onClose={() => setRepayingDebt(null)}
          title="Qarz to‘lovini qabul qilish"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleRepay} className="space-y-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500">Mijoz:</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {repayingDebt.customer_name} ({repayingDebt.customer_phone})
              </div>
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-slate-500">Qolgan qarz:</span>
                <span className="font-extrabold text-rose-600">
                  {formatCurrency(repayingDebt.remaining_amount)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                To‘lanayotgan summa (so‘m) *
              </label>
              <input
                type="number"
                required
                min="1"
                max={repayingDebt.remaining_amount}
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                To‘lov turi:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentType('cash')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentType === 'cash'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Naqd pul</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('card')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentType === 'card'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
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

            <div className="pt-2 flex items-center justify-end gap-2">
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
        </Modal>
      )}
    </div>
  );
};

