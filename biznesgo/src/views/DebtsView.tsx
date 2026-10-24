import React, { useState, useEffect } from 'react';
import { api, formatUZS } from '../lib/api';
import { Customer } from '../types';
import {
  Users,
  Search,
  Plus,
  Calendar,
  AlertCircle,
  Banknote,
  Tractor,
  Phone,
  Clock,
  X
} from 'lucide-react';

export const DebtsView: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Qisman to'lov modali
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [repayAmount, setRepayAmount] = useState<string>('');
  const [newDueDate, setNewDueDate] = useState<string>('');
  const [repayNotes, setRepayNotes] = useState<string>('');
  const [repayLoading, setRepayLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Yangi mijoz qo'shish modali
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [farmProfile, setFarmProfile] = useState<string>('');
  const [initialDueDate, setInitialDueDate] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState<string>('');

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.getCustomers();
      setCustomers(data.customers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleRepayDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const amount = Number(repayAmount);
    if (!amount || amount <= 0) {
      setErrorMsg('To\'lov summasini to\'g\'ri kiriting');
      return;
    }

    setRepayLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.repayDebt({
        customer_id: selectedCustomer.id,
        amount,
        new_due_date: newDueDate || undefined,
        notes: repayNotes || undefined
      });

      setSuccessMsg(`To'lov qabul qilindi. Qolgan qarz: ${formatUZS(res.remaining_balance)}`);
      setSelectedCustomer(null);
      setRepayAmount('');
      setNewDueDate('');
      setRepayNotes('');
      loadCustomers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Xatolik yuz berdi');
    } finally {
      setRepayLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      alert('Ism va telefon raqami majburiy');
      return;
    }

    try {
      await api.createCustomer({
        name: newName.trim(),
        phone: newPhone.trim(),
        farm_profile: farmProfile.trim() || undefined,
        due_date: initialDueDate || undefined,
        notes: customerNotes || undefined
      });
      setIsAddCustomerOpen(false);
      setNewName('');
      setNewPhone('');
      setFarmProfile('');
      setInitialDueDate('');
      setCustomerNotes('');
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase()) ||
      (c.farm_profile && c.farm_profile.toLowerCase().includes(search.toLowerCase()))
  );

  const totalOutstandingDebt = customers.reduce((sum, c) => sum + Number(c.debt_balance), 0);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Yuqori Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Qarz Daftari (Agro-Vet CRM)</h2>
          <p className="text-xs text-slate-500 font-medium">
            Fermer va chorvadorlarning nasiyalari bevosita PostgreSQL da hisoblanadi
          </p>
        </div>

        <button
          onClick={() => setIsAddCustomerOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-full shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Fermer Qo'shish</span>
        </button>
      </div>

      {/* Jami Nasiya Kartasi & Qidiruv Birlashmasi */}
      <div className="bg-white border border-slate-200/80 rounded-[28px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Jami Nasiya Balansi
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {formatUZS(totalOutstandingDebt)}
            </div>
          </div>
        </div>

        {/* Qidiruv inputi */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Fermer ismi yoki telefoni..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200/80 rounded-full text-xs focus:ring-2 focus:ring-black font-medium placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-full"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Xabarnoma */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="font-bold ml-2">Yopish</button>
        </div>
      )}

      {/* Qarzdorlar Jadvali */}
      <div className="bg-white border border-slate-200/90 rounded-[28px] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-5">Fermer / Xaridor</th>
                <th className="py-3.5 px-4">Ekin / Chorva Profili</th>
                <th className="py-3.5 px-4">Telefon</th>
                <th className="py-3.5 px-4">Qarz Balansi</th>
                <th className="py-3.5 px-4">Qaytarish Muddati</th>
                <th className="py-3.5 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Qarzdorlar topilmadi
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const isOverdue = customer.status === 'overdue';
                  const isUrgent = customer.status === 'urgent';

                  return (
                    <tr key={customer.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-5 font-bold text-slate-900 text-sm">{customer.name}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5 text-slate-700">
                          <Tractor className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[170px]">{customer.farm_profile || 'Chorva / Ekin'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{customer.phone}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-950 font-mono text-sm">
                          {formatUZS(customer.debt_balance)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {customer.due_date ? (
                          <span
                            className={`inline-flex items-center space-x-1 font-mono font-bold text-[11px] px-2.5 py-0.5 rounded-full ${
                              isOverdue
                                ? 'bg-rose-100 text-rose-800'
                                : isUrgent
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            <span>{customer.due_date}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {customer.debt_balance > 0 ? (
                          <button
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setRepayAmount(String(customer.debt_balance));
                            }}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>To'lov olish</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                            Qarz yopiq
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TO'LOV QABUL QILISH MODALI */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[32px] max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200/90 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Qarz To'lovini Qabul Qilish</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedCustomer.name}</p>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Jami qarz</div>
                <div className="text-sm font-extrabold text-rose-700 font-mono">
                  {formatUZS(selectedCustomer.debt_balance)}
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRepayDebt} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">To'lanayotgan summa (so'm):</label>
                <input
                  type="number"
                  required
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Yangi qaytarish muddati (agar qarz qolsa):
                </label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Izoh (ixtiyoriy):</label>
                <input
                  type="text"
                  placeholder="Kassaga naqd berildi"
                  value={repayNotes}
                  onChange={(e) => setRepayNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={repayLoading}
                  className="flex-1 py-3 bg-black hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xs transition disabled:opacity-50"
                >
                  {repayLoading ? 'Qabul qilinmoqda...' : 'To\'lovni Tasdiqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* YANGI FERMER QO'SHISH MODALI */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[32px] max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200/90 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">
                Yangi Fermer / Chorvador Kiritish
              </h3>
              <button
                onClick={() => setIsAddCustomerOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Mijoz Ismi:</label>
                <input
                  type="text"
                  required
                  placeholder="Rustam aka"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Telefon raqami:</label>
                <input
                  type="tel"
                  required
                  placeholder="+998 90 123 45 67"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ekin / Chorva Profili:</label>
                <input
                  type="text"
                  placeholder="Masalan: 60 qoramol, 20 ga paxta"
                  value={farmProfile}
                  onChange={(e) => setFarmProfile(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">To'lov muddati (Due Date):</label>
                <input
                  type="date"
                  value={initialDueDate}
                  onChange={(e) => setInitialDueDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div className="flex space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-black hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xs transition"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
