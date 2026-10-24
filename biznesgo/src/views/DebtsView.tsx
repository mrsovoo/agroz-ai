import React, { useState, useEffect } from 'react';
import { api, formatUZS, formatUzbekPhone, cleanPhone } from '../lib/api';
import { Customer, Product } from '../types';
import {
  Users,
  Search,
  Plus,
  Minus,
  Calendar,
  AlertCircle,
  Banknote,
  Package,
  Phone,
  Clock,
  X,
  CheckCircle2,
  Tag
} from 'lucide-react';

export const DebtsView: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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

  // Yangi qarz / mijoz qo'shish modali
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('+998 ');
  
  // Mahsulot qidirish va qarz summasi
  const [productSearch, setProductSearch] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productQuantity, setProductQuantity] = useState<number>(1);
  const [debtAmount, setDebtAmount] = useState<string>('');
  const [initialDueDate, setInitialDueDate] = useState<string>('');

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

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCustomers();
    loadProducts();
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
    if (!newName.trim()) {
      alert('Mijoz ismi kiritilishi shart');
      return;
    }
    const cleaned = cleanPhone(newPhone);
    if (!cleaned || cleaned.length < 13) {
      alert('Iltimos, telefon raqamni to\'liq kiriting (+998 90 000 0000)');
      return;
    }

    const calculatedDebt = Number(debtAmount) || (selectedProduct ? selectedProduct.price * productQuantity : 0);
    const debtNote = selectedProduct
      ? `${selectedProduct.name} (${productQuantity} ta qarzga)`
      : productSearch.trim()
      ? `${productSearch.trim()} (qarzga)`
      : 'Dori preparatlari';

    try {
      await api.createCustomer({
        name: newName.trim(),
        phone: cleaned,
        debt_balance: calculatedDebt,
        due_date: initialDueDate || undefined,
        notes: debtNote,
        farm_profile: debtNote
      });

      setSuccessMsg(`Yangi qarz muvaffaqiyatli qo'shildi: ${newName} (${formatUZS(calculatedDebt)})`);
      setIsAddCustomerOpen(false);
      setNewName('');
      setNewPhone('+998 ');
      setProductSearch('');
      setSelectedProduct(null);
      setProductQuantity(1);
      setDebtAmount('');
      setInitialDueDate('');
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    }
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const selStart = e.currentTarget.selectionStart || 0;
    const selEnd = e.currentTarget.selectionEnd || 0;
    if (e.key === 'Backspace' && selStart <= 5 && selEnd <= 5) {
      e.preventDefault();
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase()) ||
      (c.notes && c.notes.toLowerCase().includes(search.toLowerCase())) ||
      (c.farm_profile && c.farm_profile.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredProducts = products.filter((p) =>
    productSearch.trim().length > 0 &&
    (p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
     p.sku?.toLowerCase().includes(productSearch.toLowerCase()) ||
     p.barcode?.includes(productSearch))
  );

  const totalOutstandingDebt = customers.reduce((sum, c) => sum + Number(c.debt_balance), 0);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Yuqori Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Qarz Daftari (Mijozlar CRM)</h2>
          <p className="text-xs text-slate-500 font-medium">
            Fermer va xaridorlarga qarzga berilgan dorilar va to'lov monitoringi
          </p>
        </div>

        <button
          onClick={() => {
            setIsAddCustomerOpen(true);
            setProductSearch('');
            setSelectedProduct(null);
            setProductQuantity(1);
            setDebtAmount('');
          }}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-full shadow-xs transition self-start sm:self-auto cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Qarz Qo'shish</span>
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
            placeholder="Fermer ismi, telefoni yoki dori..."
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
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center justify-between animate-in fade-in">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="font-bold ml-2 cursor-pointer">Yopish</button>
        </div>
      )}

      {/* Qarzdorlar Jadvali */}
      <div className="bg-white border border-slate-200/90 rounded-[28px] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-5">Fermer / Xaridor</th>
                <th className="py-3.5 px-4">Qarzga Berilgan Mahsulot</th>
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
                          <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px] font-medium">
                            {customer.notes || customer.farm_profile || 'Dori preparatlari'}
                          </span>
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
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer active:scale-95"
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
                  placeholder="Summa"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Yangi to'lov muddati (ixtiyoriy):</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Izoh:</label>
                <input
                  type="text"
                  placeholder="Masalan: Plastik karta orqali to'ladi"
                  value={repayNotes}
                  onChange={(e) => setRepayNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={repayLoading}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-xs transition flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
                >
                  <span>{repayLoading ? 'Qabul...' : 'Qabul Qilish'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* YANGI QARZ / MIJOZ QO'SHISH MODALI */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[32px] max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200/90 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Yangi Nasiya (Qarz) Rasmiylashtirish
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Mahsulotni tanlang va xaridor nomiga qarzga yozing
                </p>
              </div>
              <button
                onClick={() => setIsAddCustomerOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs">
              {/* Mijoz Ismi */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Mijoz (Fermer) Ismi <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Rustam Qodirov"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              {/* Telefon Raqam (+998 bilan) */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Telefon Raqami <span className="text-rose-500">*</span>:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="+998 90 000 0000"
                    value={newPhone}
                    onKeyDown={handlePhoneKeyDown}
                    onChange={(e) => setNewPhone(formatUzbekPhone(e.target.value))}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* MAHSULOT QIDIRISH (QARZGA BERILADIGAN DORI) */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>Qarzga Berilayotgan Mahsulot:</span>
                  {selectedProduct && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Tanlandi</span>
                    </span>
                  )}
                </label>
                
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Mahsulot yoki dori nomini qidiring..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      if (selectedProduct && e.target.value !== selectedProduct.name) {
                        setSelectedProduct(null);
                      }
                    }}
                    className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setProductSearch('');
                        setSelectedProduct(null);
                        setDebtAmount('');
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Avto-takliflar ro'yxati */}
                  {filteredProducts.length > 0 && !selectedProduct && (
                    <div className="absolute left-0 right-0 top-full mt-1 max-h-44 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-20 divide-y divide-slate-100">
                      {filteredProducts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedProduct(p);
                            setProductSearch(p.name);
                            setDebtAmount(String(p.price * productQuantity));
                          }}
                          className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition"
                        >
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{p.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {formatUZS(p.price)} • Qoldiq: {p.stock} ta
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            Qarzga tanlash
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tanlangan mahsulot va miqdori */}
                {selectedProduct && (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between animate-in fade-in">
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs">{selectedProduct.name}</div>
                      <div className="text-[11px] text-emerald-800 font-mono font-semibold">
                        {formatUZS(selectedProduct.price)} / {selectedProduct.unit || 'dona'}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 bg-white px-2 py-1 rounded-xl border border-emerald-200">
                      <button
                        type="button"
                        onClick={() => {
                          const newQ = Math.max(1, productQuantity - 1);
                          setProductQuantity(newQ);
                          setDebtAmount(String(selectedProduct.price * newQ));
                        }}
                        className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold text-xs px-1.5">{productQuantity}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newQ = productQuantity + 1;
                          setProductQuantity(newQ);
                          setDebtAmount(String(selectedProduct.price * newQ));
                        }}
                        className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Qarz Summasi */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Qarz Summasi (so'm) <span className="text-rose-500">*</span>:
                </label>
                <div className="relative">
                  <Banknote className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    required
                    placeholder="Masalan: 90000"
                    value={debtAmount}
                    onChange={(e) => setDebtAmount(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-extrabold text-sm text-slate-900"
                  />
                </div>
                {debtAmount && Number(debtAmount) > 0 && (
                  <span className="text-[10px] text-emerald-700 font-bold mt-1 block">
                    Qarzga yoziladi: {formatUZS(Number(debtAmount))}
                  </span>
                )}
              </div>

              {/* To'lov muddati */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Qaytarish Muddati:</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={initialDueDate}
                    onChange={(e) => setInitialDueDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              {/* Tugmalar */}
              <div className="flex space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-black hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xs transition cursor-pointer active:scale-95"
                >
                  Qarzga Yozish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
