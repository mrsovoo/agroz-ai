import React, { useState } from 'react';
import { ArrowUpRight, Star, Store, MapPin, X, CheckCircle2, ShieldCheck, ShoppingCart, Send } from 'lucide-react';
import { AgroImage } from './ui';
import { PRODUCTS } from '../data/content';

type ProductType = (typeof PRODUCTS)[0];

const formatUzPhone = (value: string) => {
  let d = value.replace(/\D/g, '');
  if (d.startsWith('998')) d = d.slice(3);
  d = d.slice(0, 9);
  if (!d) return '+998 ';
  let r = '+998 ' + d.slice(0, 2);
  if (d.length > 2) r += ' ' + d.slice(2, 5);
  if (d.length > 5) r += ' ' + d.slice(5, 7);
  if (d.length > 7) r += ' ' + d.slice(7, 9);
  return r;
};

export const Products: React.FC = () => {
  const [filter, setFilter] = useState('Barchasi');
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [isKgMode, setIsKgMode] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  const categories = [
    'Barchasi',
    'Agro-Vet',
    'Yem va Ozuqa',
    "Urug'chilik",
    'Ulgurji Ombor',
    'Texnika va Jihozlar',
  ];

  const filtered =
    filter === 'Barchasi' ? PRODUCTS : PRODUCTS.filter((p) => p.category === filter);

  const openOrderModal = (p: ProductType) => {
    setSelectedProduct(p);
    setOrderQuantity(1);
    setIsKgMode(false);
    setOrderSubmitted(false);
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerPhone || customerPhone.replace(/\D/g, '').length < 9) return;
    setOrderSubmitted(true);
  };

  return (
    <section id="products" className="py-16 sm:py-24 bg-cream-soft/60 border-y border-forest/5">
      <div className="container-x">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-agroGreen-800">
              Katalog & Narxlar
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-charcoal">
              Ommabop Mahsulotlar & Do‘konlar
            </h2>
          </div>

          {/* Kategoriya filter pills */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFilter(c)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer ${
                  filter === c
                    ? 'bg-forest-dark text-white shadow-sm'
                    : 'bg-white text-charcoal/70 hover:bg-agroGreen-50 hover:text-agroGreen-900 border border-charcoal/10'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Mahsulot Kartalari Grid */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <article
              key={p.id}
              className="group relative flex flex-col rounded-[28px] bg-white p-4 sm:p-5 shadow-card border border-charcoal/5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-soft"
            >
              {/* Rasm konteyneri */}
              <div className="relative h-52 w-full overflow-hidden rounded-2xl bg-cream-soft flex items-center justify-center p-3">
                <AgroImage
                  src={p.image}
                  alt={p.name}
                  className="h-full w-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 rounded-full bg-agroGreen px-3 py-1 text-[10px] font-black text-forest-dark shadow-sm">
                  {p.badge}
                </span>
                <span
                  onClick={() => openOrderModal(p)}
                  className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-forest-dark shadow-sm transition group-hover:bg-agroGreen group-hover:scale-110 cursor-pointer"
                  title="Buyurtma berish"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>

              {/* Ma'lumotlar */}
              <div className="mt-4 flex flex-1 flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-charcoal/50">
                    <span className="font-semibold text-agroGreen-900">{p.category}</span>
                    <span className="flex items-center gap-1 font-bold text-charcoal">
                      <Star className="h-3.5 w-3.5 fill-amber text-amber" /> {p.rating}
                    </span>
                  </div>

                  <h3 className="mt-1.5 text-base font-black text-charcoal leading-snug group-hover:text-agroGreen-900 transition line-clamp-2">
                    {p.name}
                  </h3>

                  {/* Do'kon va manzil */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-charcoal/70 bg-cream/40 rounded-xl px-2.5 py-1.5">
                    <span className="flex items-center gap-1.5 font-bold truncate">
                      <Store className="h-3 w-3 text-agroGreen-800 shrink-0" />
                      <span className="truncate">{p.store}</span>
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-charcoal/50 shrink-0">
                      <MapPin className="h-2.5 w-2.5 text-forest/40" />
                      <span>{p.location}</span>
                    </span>
                  </div>

                  {/* Kafolat / Saqlash ma'lumoti */}
                  <p className="mt-2 text-[11px] font-medium text-charcoal/65 flex items-center gap-1.5 line-clamp-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-agroGreen-700 shrink-0" />
                    <span>{p.guaranteeDetail}</span>
                  </p>

                  <p className="mt-1 text-[11px] font-medium text-agroGreen-800 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-agroGreen" />
                    {p.stock}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-charcoal/5 pt-3">
                  <div>
                    <span className="text-[11px] text-charcoal/40 line-through mr-1.5">{p.oldPrice}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-black text-forest-dark">{p.price}</span>
                      {p.unit && <span className="text-[11px] font-bold text-charcoal/50">/ {p.unit}</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openOrderModal(p)}
                    className="rounded-full bg-cream-soft hover:bg-agroGreen px-3.5 py-1.5 text-xs font-bold text-charcoal hover:text-forest-dark transition cursor-pointer active:scale-95"
                  >
                    Xarid qilish
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Interaktiv Do'konga Buyurtma Berish Modali (Direct Store Order Flow Demo) */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-dark/70 backdrop-blur-sm animate-fade-up">
            <div className="relative w-full max-w-lg overflow-hidden rounded-[32px] bg-white p-6 sm:p-8 shadow-2xl border border-charcoal/10">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full bg-cream-soft text-charcoal/60 hover:bg-cream-warm hover:text-charcoal transition"
                aria-label="Yopish"
              >
                <X className="h-4 w-4" />
              </button>

              {!orderSubmitted ? (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-agroGreen-800 uppercase tracking-widest">
                    <ShoppingCart className="h-4 w-4" /> To‘g‘ridan-to‘g‘ri Do‘konga Buyurtma
                  </div>

                  <h3 className="mt-2 text-xl font-black text-charcoal">
                    {selectedProduct.name}
                  </h3>

                  <div className="mt-2 flex items-center gap-2 text-xs text-charcoal/70 bg-cream-soft px-3 py-1.5 rounded-xl">
                    <Store className="h-3.5 w-3.5 text-agroGreen-800" />
                    <span className="font-bold">{selectedProduct.store}</span>
                    <span>•</span>
                    <MapPin className="h-3 w-3 text-forest/40" />
                    <span>{selectedProduct.location}</span>
                  </div>

                  <form onSubmit={handleOrderSubmit} className="mt-5 space-y-4">
                    {/* Miqdor va Yem kalkulyatori */}
                    {selectedProduct.category === 'Yem va Ozuqa' && (
                      <div className="rounded-2xl bg-amber-50/60 border border-amber/30 p-3">
                        <div className="flex items-center justify-between text-xs font-bold text-charcoal mb-2">
                          <span>Sotib olish shakli:</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setIsKgMode(false)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                !isKgMode ? 'bg-forest-dark text-white' : 'bg-white text-charcoal/70'
                              }`}
                            >
                              Butun qop (50 kg)
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsKgMode(true)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                isKgMode ? 'bg-forest-dark text-white' : 'bg-white text-charcoal/70'
                              }`}
                            >
                              Kg-lab bo‘lib olish
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-charcoal/70">
                          {isKgMode
                            ? '1 kg uchun narx: 4 400 so‘m (minimal: 5 kg)'
                            : '1 qop (50 kg) uchun narx: 220 000 so‘m'}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-charcoal">
                        Miqdor ({isKgMode ? 'kg' : selectedProduct.unit}):
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setOrderQuantity((q) => Math.max(1, q - 1))}
                          className="grid h-8 w-8 place-items-center rounded-lg bg-cream-soft font-black text-charcoal hover:bg-cream-warm"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm font-black text-charcoal">
                          {orderQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setOrderQuantity((q) => q + 1)}
                          className="grid h-8 w-8 place-items-center rounded-lg bg-cream-soft font-black text-charcoal hover:bg-cream-warm"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Xaridor ma'lumotlari */}
                    <div>
                      <label className="text-xs font-semibold text-charcoal/70">Ismingiz:</label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Masalan: Sardor Aliyev"
                        className="mt-1 w-full rounded-xl border border-charcoal/10 bg-cream-soft px-3.5 py-2.5 text-sm outline-none focus:border-agroGreen focus:ring-1 focus:ring-agroGreen"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-charcoal/70">Telefon raqamingiz:</label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onFocus={() => !customerPhone && setCustomerPhone('+998 ')}
                        onChange={(e) => setCustomerPhone(formatUzPhone(e.target.value))}
                        placeholder="+998 90 000 00 00"
                        className="mt-1 w-full rounded-xl border border-charcoal/10 bg-cream-soft px-3.5 py-2.5 text-sm font-bold outline-none focus:border-agroGreen focus:ring-1 focus:ring-agroGreen"
                      />
                    </div>

                    {/* Qabul qilish usuli */}
                    <div>
                      <label className="text-xs font-semibold text-charcoal/70">Yetkazish usuli:</label>
                      <div className="mt-1 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDeliveryType('pickup')}
                          className={`rounded-xl border p-2 text-xs font-bold transition text-center ${
                            deliveryType === 'pickup'
                              ? 'border-agroGreen bg-agroGreen-50 text-forest-dark'
                              : 'border-charcoal/10 bg-white text-charcoal/70'
                          }`}
                        >
                          🏪 Do‘kondan olib ketish
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeliveryType('delivery')}
                          className={`rounded-xl border p-2 text-xs font-bold transition text-center ${
                            deliveryType === 'delivery'
                              ? 'border-agroGreen bg-agroGreen-50 text-forest-dark'
                              : 'border-charcoal/10 bg-white text-charcoal/70'
                          }`}
                        >
                          🚚 Yetkazib berish
                        </button>
                      </div>
                    </div>

                    {/* Buyurtma yuborish tugmasi */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest-dark py-3.5 text-sm font-bold text-white transition hover:bg-forest shadow-md active:scale-95 cursor-pointer"
                      >
                        <Send className="h-4 w-4 text-agroGreen" />
                        Do‘konga buyurtma yuborish
                      </button>
                      <p className="mt-2 text-center text-[10px] text-charcoal/50">
                        * Buyurtma to‘g‘ridan-to‘g‘ri do‘konning BiznesGO POS kassa dasturiga zaxiraga yuboriladi.
                      </p>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="py-6 text-center">
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-agroGreen-100 text-agroGreen-700">
                    <CheckCircle2 className="h-9 w-9 text-agroGreen" />
                  </span>
                  <h4 className="mt-4 text-xl font-black text-charcoal">
                    Buyurtmangiz do‘konga yuborildi!
                  </h4>
                  <p className="mt-2 text-xs text-charcoal/70 max-w-sm mx-auto leading-relaxed">
                    Xaridingiz to‘g‘ridan-to‘g‘ri <b className="text-charcoal">{selectedProduct.store}</b> do‘konining BiznesGO kassasiga qabul qilindi. Do‘kon xodimi tez orada siz bilan bog‘lanadi.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="mt-6 rounded-full bg-forest-dark px-6 py-2.5 text-xs font-bold text-white hover:bg-forest transition"
                  >
                    Yopish
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
