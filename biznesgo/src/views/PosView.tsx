import React, { useState, useEffect } from 'react';
import { api, formatUZS } from '../lib/api';
import { Product, CartItem, Customer } from '../types';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  AlertCircle,
  Calendar,
  Layers,
  User,
  CreditCard,
  Banknote,
  BookOpen,
  ArrowRight,
  FlaskConical,
  Tractor,
  X
} from 'lucide-react';

export const PosView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Checkout modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [paymentType, setPaymentType] = useState<'cash' | 'card' | 'debt'>('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('');
  const [farmProfile, setFarmProfile] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [checkoutNotes, setCheckoutNotes] = useState<string>('');
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  const [successReceipt, setSuccessReceipt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mahsulotlarni yuklash
  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts(search);
      setProducts(data.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await api.getCustomers();
      setCustomers(data.customers);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search]);

  useEffect(() => {
    loadCustomers();
  }, []);

  // Savatga qo'shish
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;

    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    if (existingIndex > -1) {
      const existing = cart[existingIndex];
      if (existing.quantity >= product.stock) {
        alert(`Omborda faqat ${product.stock} ta mavjud!`);
        return;
      }
      const updated = [...cart];
      updated[existingIndex] = {
        ...existing,
        quantity: existing.quantity + 1,
        total: (existing.quantity + 1) * product.price
      };
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          total: product.price
        }
      ]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) {
              alert(`Omborda faqat ${item.product.stock} ta mavjud!`);
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              total: newQty * item.product.price
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);

  // Sotuvni yakunlash (PostgreSQL tranzaksiyasi)
  const handleCompleteSale = async () => {
    if (cart.length === 0) return;

    if (paymentType === 'debt' && !selectedCustomerId && (!newCustomerName || !newCustomerPhone)) {
      setErrorMsg('Nasiyaga sotish uchun mijoz tanlang yoki yangi mijoz kiritishi shart!');
      return;
    }

    setCheckoutLoading(true);
    setErrorMsg(null);

    try {
      const result = await api.checkout({
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity
        })),
        payment_type: paymentType,
        customer_id: selectedCustomerId || undefined,
        customer_name: !selectedCustomerId ? newCustomerName : undefined,
        customer_phone: !selectedCustomerId ? newCustomerPhone : undefined,
        farm_profile: farmProfile || undefined,
        due_date: dueDate || undefined,
        notes: checkoutNotes || undefined
      });

      setSuccessReceipt(result.receipt_number);
      setCart([]);
      setIsCheckoutOpen(false);
      loadProducts();
      loadCustomers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Xatolik yuz berdi');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
      {/* CHAP TOMON: Mahsulotlar Ro'yxati va Qidiruv (7 ustun) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Qidiruv Paneli (Real-time Agro-Vet qidiruv) */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Preparat nomi, faol moddasi yoki partiyasi orqali qidirish... (masalan: iver)"
            className="w-full pl-10 pr-9 py-3 bg-white border border-slate-200/90 rounded-2xl text-xs focus:ring-2 focus:ring-black shadow-2xs font-medium placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-full"
              title="Tozalash"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {search && (
          <div className="text-[11px] font-semibold text-slate-500 px-1 flex items-center justify-between">
            <span>
              "{search}" bo'yicha: <strong className="text-slate-900">{products.length} ta</strong> dori topildi
            </span>
          </div>
        )}

        {/* Mahsulotlar Ro'yxati */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[calc(100vh-230px)] overflow-y-auto pr-1">
          {products.map((product) => {
            const isOutOfStock = product.stock <= 0;
            const isCritical = product.expiry_status === 'critical' || product.expiry_status === 'expired';

            return (
              <div
                key={product.id}
                onClick={() => !isOutOfStock && addToCart(product)}
                className={`bg-white rounded-2xl border p-3.5 transition flex flex-col justify-between ${
                  isOutOfStock
                    ? 'border-slate-200 opacity-60 cursor-not-allowed'
                    : 'border-slate-200/80 hover:border-black hover:shadow-xs cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-start space-x-3">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-11 h-11 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200/60 shadow-2xs"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-xs text-slate-900 truncate" title={product.name}>
                        {product.name}
                      </h4>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {product.active_ingredient || 'Faol modda'}
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 mt-1">
                        <span>{product.batch_number}</span>
                        <span>•</span>
                        <span className={isCritical ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                          {product.expiry_date}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Narx va Qo'shish */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-extrabold text-slate-900 font-mono">
                      {formatUZS(product.price)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Qoldiq:{' '}
                      <span
                        className={`font-bold font-mono ${
                          product.stock <= product.min_stock ? 'text-amber-600' : 'text-slate-700'
                        }`}
                      >
                        {product.stock} dona
                      </span>
                    </div>
                  </div>

                  {isOutOfStock ? (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg">
                      Tugagan
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="w-7 h-7 rounded-full bg-slate-100 text-slate-800 hover:bg-black hover:text-white transition flex items-center justify-center shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* O'NG TOMON: Kassa Savati (5 ustun) */}
      <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-[28px] p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-4 h-4 text-slate-900" />
            <h3 className="font-extrabold text-sm text-slate-900">Kassa Savati</h3>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full">
            {cart.length} xil dori
          </span>
        </div>

        {/* Savatdagi elementlar */}
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Savat bo'sh. Chap tomondan dori tanlang.
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between p-2.5 bg-slate-50/70 rounded-xl border border-slate-100 text-xs"
              >
                <div className="min-w-0 flex-1 mr-2">
                  <div className="font-bold text-slate-900 truncate">{item.product.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {formatUZS(item.product.price)} × {item.quantity}
                  </div>
                  <div className="text-slate-900 font-extrabold font-mono text-xs mt-0.5">
                    {formatUZS(item.total)}
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center font-bold font-mono">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 rounded text-rose-500 hover:bg-rose-50 ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Jami va To'lov Tugmasi */}
        <div className="border-t border-slate-100 pt-3 space-y-3">
          <div className="flex items-center justify-between text-slate-600 text-xs">
            <span>Jami summa:</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono">{formatUZS(cartTotal)}</span>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
            className="w-full py-3 bg-black hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>To'lovga O'tish</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MOBIL MOSLASHUV: Kassa Savati Pastki Qat'iy Bar (< lg ekranlar uchun) */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 inset-x-4 lg:hidden z-30 animate-in slide-in-from-bottom duration-200">
          <div className="bg-slate-950 text-white rounded-2xl p-3.5 shadow-2xl flex items-center justify-between border border-slate-800">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">
                Savatda: <span className="font-bold text-white">{cart.length} xil dori</span>
              </div>
              <div className="text-base font-extrabold font-mono text-emerald-400">
                {formatUZS(cartTotal)}
              </div>
            </div>

            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
            >
              <span>To'lovga O'tish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* TO'LOV MODALI (Naqd, Karta, Nasiya) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[32px] max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200/90 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900">Sotuvni Yakunlash</h3>
              <div className="text-base font-extrabold text-slate-900 font-mono">{formatUZS(cartTotal)}</div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                {errorMsg}
              </div>
            )}

            {/* To'lov Turi */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">To'lov turini tanlang:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentType('cash')}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-xs font-bold transition ${
                    paymentType === 'cash'
                      ? 'border-black bg-black text-white'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-4 h-4 mb-1" />
                  <span>Naqd</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentType('card')}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-xs font-bold transition ${
                    paymentType === 'card'
                      ? 'border-black bg-black text-white'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mb-1" />
                  <span>Karta</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentType('debt')}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-xs font-bold transition ${
                    paymentType === 'debt'
                      ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen className="w-4 h-4 mb-1 text-amber-600" />
                  <span>Nasiya</span>
                </button>
              </div>
            </div>

            {/* Agar NASIYA tanlansa: Mijoz, Ekin/Chorva profili va Due Date */}
            {paymentType === 'debt' && (
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2.5 text-xs">
                <div className="font-bold text-amber-900 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-amber-700" />
                  <span>Nasiyador Fermer / Chorvador:</span>
                </div>

                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-amber-300 rounded-xl"
                >
                  <option value="">-- Yangi fermerni kiritish --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) • {c.farm_profile || 'Profil'} • Qarz: {formatUZS(c.debt_balance)}
                    </option>
                  ))}
                </select>

                {!selectedCustomerId && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Fermer ismi"
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        className="p-2.5 bg-white border border-amber-300 rounded-xl"
                      />
                      <input
                        type="tel"
                        placeholder="+998 90 123 45 67"
                        value={newCustomerPhone}
                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                        className="p-2.5 bg-white border border-amber-300 rounded-xl font-mono"
                      />
                    </div>

                    {/* Ekin yoki Chorva profili */}
                    <div className="flex items-center space-x-1.5 bg-white p-2 border border-amber-300 rounded-xl">
                      <Tractor className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <input
                        type="text"
                        placeholder="Ekin / Chorva profili: 50 qoramol, 10 ga paxta..."
                        value={farmProfile}
                        onChange={(e) => setFarmProfile(e.target.value)}
                        className="w-full border-0 focus:outline-hidden text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Qarzni qaytarish qat'iy muddati */}
                <div>
                  <label className="text-[11px] font-bold text-amber-900 block mb-1">
                    Qaytarish qat'iy muddati (Due date):
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2.5 bg-white border border-amber-300 rounded-xl font-mono"
                  />
                </div>
              </div>
            )}

            <div className="flex space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={checkoutLoading}
                onClick={handleCompleteSale}
                className="flex-1 py-3 bg-black hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xs transition disabled:opacity-50"
              >
                {checkoutLoading ? 'Saqlanmoqda...' : 'Sotuvni Yakunlash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MUVAFFAQIYAT CHEK MODALI */}
      {successReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200/90">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Sotuv Muvaffaqiyatli Yakunlandi!</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Ombor qoldig'i PostgreSQL da avtomatik kamaytirildi.</p>
              <div className="mt-2.5 p-2 bg-slate-50 rounded-xl text-xs font-mono font-bold text-slate-800">
                Chek: {successReceipt}
              </div>
            </div>
            <button
              onClick={() => setSuccessReceipt(null)}
              className="w-full py-2.5 bg-black text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
            >
              Yangi Sotuvga O'tish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
