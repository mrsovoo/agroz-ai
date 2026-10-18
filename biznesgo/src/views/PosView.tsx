import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';
import { tg } from '../lib/telegram';
import { formatCurrency, formatDate } from '../lib/utils';
import { Product, Customer } from '../types';
import { FeedCalculatorModal } from '../components/FeedCalculatorModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Users, 
  Calculator, 
  ShoppingBag,
  Sparkles,
  AlertCircle,
  Tag,
  CheckCircle2
} from 'lucide-react';

export const PosView: React.FC = () => {
  const { 
    merchant, 
    cart, 
    addToCart, 
    updateCartItemQty, 
    removeFromCart, 
    clearCart,
    getCartTotal,
    addToast 
  } = useStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentType, setPaymentType] = useState<'cash' | 'card' | 'debt'>('cash');
  const [submitting, setSubmitting] = useState(false);

  // Debt modal / customer inputs
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [debtDueDate, setDebtDueDate] = useState('');

  // Modals
  const [feedCalcProduct, setFeedCalcProduct] = useState<Product | null>(null);
  const [receiptData, setReceiptData] = useState<any | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await api.products.list();
      setProducts(data);
    } catch (err: any) {
      addToast(err.message || 'Mahsulotlar yuklanmadi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.batch_number && p.batch_number.toLowerCase().includes(q))
    );
  });

  const cartTotal = getCartTotal();

  const handleCheckout = async () => {
    if (cart.length === 0) {
      addToast('Savat bo‘sh', 'error');
      return;
    }

    if (paymentType === 'debt') {
      if (!customerName.trim()) {
        addToast('Xaridor ismini kiriting (Nasiya uchun)', 'error');
        return;
      }
      if (!customerPhone.trim()) {
        addToast('Xaridor telefon raqamini kiriting', 'error');
        return;
      }
    }

    try {
      setSubmitting(true);
      tg.hapticImpact('medium');

      const payload = {
        payment_type: paymentType,
        items: cart.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
        customer_name: paymentType === 'debt' ? customerName.trim() : undefined,
        customer_phone: paymentType === 'debt' ? customerPhone.trim() : undefined,
        debt_due_date: paymentType === 'debt' && debtDueDate ? debtDueDate : undefined,
      };

      const res = await api.sales.create(payload);

      addToast('Sotuv muvaffaqiyatli amalga oshirildi!', 'success');
      tg.hapticImpact('heavy');

      // Show receipt modal
      setReceiptData({
        sale_id: res.sale?.id || Date.now(),
        items: [...cart],
        total: cartTotal,
        payment_type: paymentType,
        store_name: merchant?.store_name || 'BiznesGO Do‘kon',
        date: new Date().toISOString(),
        customer_name: customerName,
      });

      // Clear cart & inputs
      clearCart();
      setCustomerName('');
      setCustomerPhone('');
      setDebtDueDate('');
      setPaymentType('cash');

      // Refresh products stock
      fetchProducts();
    } catch (err: any) {
      addToast(err.message || 'Sotuvni yakunlashda xatolik', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isFeedBusiness = merchant?.business_type === 'feed';
  const isAgroVet = merchant?.business_type === 'agro_vet';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
      {/* Products Column (Catalog) */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        {/* Search header */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Mahsulot nomi, shtrix-kod, partiya raqami..."
              className="block w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap hidden sm:inline-block">
            {filteredProducts.length} ta mahsulot
          </span>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-2xl border border-slate-200/80">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500">Mahsulotlar yuklanmoqda...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">Mahsulot topilmadi</h3>
            <p className="text-xs text-slate-500 mt-1">
              Qidiruv so‘zini o‘zgartiring yoki "Ombor" bo‘limidan yangi mahsulot qo‘shing.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const inStock = product.stock_quantity > 0;
              const hasWholesale = Boolean(
                product.wholesale_price &&
                product.min_wholesale_quantity &&
                product.wholesale_price < product.price
              );

              return (
                <div
                  key={product.id}
                  className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md ${
                    inStock
                      ? 'border-slate-200/90 hover:border-emerald-400 cursor-pointer'
                      : 'border-slate-200 opacity-60'
                  }`}
                  onClick={() => {
                    if (inStock) {
                      addToCart(product);
                      tg.hapticImpact('light');
                    } else {
                      addToast('Bu mahsulot omborda qolmagan', 'warning');
                    }
                  }}
                >
                  <div className="p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {product.unit}
                      </span>
                      {hasWholesale && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600">
                          <Tag className="w-2.5 h-2.5" />
                          <span>Ulgurji</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                      {product.name}
                    </h4>

                    {/* Agro-Vet specific tags */}
                    {isAgroVet && (product.batch_number || product.expiry_date) && (
                      <div className="text-[10px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                        {product.batch_number && (
                          <div className="truncate">Partiya: <span className="font-mono">{product.batch_number}</span></div>
                        )}
                        {product.expiry_date && (
                          <div className="truncate text-amber-700">Muddat: {formatDate(product.expiry_date)}</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 pt-0 mt-auto">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="text-xs sm:text-sm font-extrabold text-emerald-700">
                        {formatCurrency(product.price)}
                      </span>
                      <span
                        className={`text-[10px] font-semibold ${
                          inStock ? 'text-slate-500' : 'text-rose-500'
                        }`}
                      >
                        {inStock ? `${product.stock_quantity} ${product.unit}` : 'Tugagan'}
                      </span>
                    </div>

                    {/* Feed business bag calculator button */}
                    {isFeedBusiness && product.bag_weight_kg && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFeedCalcProduct(product);
                        }}
                        className="mt-2 w-full py-1 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center gap-1 border border-amber-200/60"
                      >
                        <Calculator className="w-3 h-3" />
                        <span>Kg ga bo‘lib sotish</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart & Checkout Column */}
      <div className="lg:col-span-5 xl:col-span-4 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col h-full sticky top-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Savat</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                {cart.length}
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Tozalash</span>
              </button>
            )}
          </div>

          {/* Cart items list */}
          <div className="flex-1 overflow-y-auto max-h-[380px] divide-y divide-slate-100 py-2">
            {cart.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">Savat bo‘sh</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tovarlarni qo‘shish uchun chapdagi katalogdan tanlang
                </p>
              </div>
            ) : (
              cart.map((item) => {
                const isWholesale = Boolean(
                  item.product.wholesale_price &&
                  item.product.min_wholesale_quantity &&
                  item.quantity >= item.product.min_wholesale_quantity
                );

                return (
                  <div key={item.product.id} className="py-3 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h5 className="text-xs font-bold text-slate-900 truncate">
                          {item.product.name}
                        </h5>
                        {isWholesale && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-bold flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Ulgurji</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {formatCurrency(item.unit_price)} × {item.quantity} {item.product.unit}
                      </div>
                    </div>

                    {/* Qty controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          updateCartItemQty(item.product.id, item.quantity - 1);
                          tg.hapticImpact('light');
                        }}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          updateCartItemQty(item.product.id, val);
                        }}
                        className="w-12 py-1 text-center font-bold text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        onClick={() => {
                          updateCartItemQty(item.product.id, item.quantity + 1);
                          tg.hapticImpact('light');
                        }}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="w-20 text-right font-extrabold text-xs text-slate-900">
                      {formatCurrency(item.unit_price * item.quantity)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Checkout controls */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            {/* Total calculation */}
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Umumiy summa:
              </span>
              <span className="text-xl font-black text-slate-900">
                {formatCurrency(cartTotal)}
              </span>
            </div>

            {/* Payment method selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-2">
                To‘lov usuli:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentType('cash');
                    tg.hapticImpact('light');
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    paymentType === 'cash'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Naqd</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentType('card');
                    tg.hapticImpact('light');
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    paymentType === 'card'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Karta</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentType('debt');
                    tg.hapticImpact('light');
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    paymentType === 'debt'
                      ? 'border-rose-600 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Nasiya</span>
                </button>
              </div>
            </div>

            {/* Debt details if paymentType === 'debt' */}
            {paymentType === 'debt' && (
              <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                  <AlertCircle className="w-4 h-4" />
                  <span>Nasiya (Qarz daftari) tafsilotlari</span>
                </div>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Xaridor ismi (Masalan: Bobur aka) *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-rose-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    required
                    placeholder="Telefon raqami (+998...) *"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-rose-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-rose-700 mb-1">
                    Qaytarish muddati (Due date):
                  </label>
                  <input
                    type="date"
                    value={debtDueDate}
                    onChange={(e) => setDebtDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-rose-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white text-slate-700"
                  />
                </div>
              </div>
            )}

            {/* Checkout action button */}
            <button
              type="button"
              disabled={cart.length === 0 || submitting}
              onClick={handleCheckout}
              className="w-full py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/25 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Sotuvni yakunlash</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Feed Calculator Modal */}
      {feedCalcProduct && (
        <FeedCalculatorModal
          isOpen={Boolean(feedCalcProduct)}
          onClose={() => setFeedCalcProduct(null)}
          product={feedCalcProduct}
          onApply={(qtyInBags) => {
            addToCart(feedCalcProduct, qtyInBags);
            addToast(`${qtyInBags} qop miqdorda savatga qo‘shildi`, 'success');
            setFeedCalcProduct(null);
          }}
        />
      )}

      {/* Receipt Modal */}
      {receiptData && (
        <ReceiptModal
          isOpen={Boolean(receiptData)}
          onClose={() => setReceiptData(null)}
          data={receiptData}
        />
      )}
    </div>
  );
};

