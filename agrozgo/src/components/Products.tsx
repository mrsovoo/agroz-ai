import React, { useState } from 'react';
import {
  Store,
  MapPin,
  X,
  CheckCircle2,
  ShieldCheck,
  Send,
  Zap,
  Filter,
  Check,
  Leaf,
  Wheat,
  Warehouse,
  Sprout,
  Wrench,
  Layers,
  Truck,
} from 'lucide-react';
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

const CATEGORIES = [
  { id: 'Barchasi', label: 'Barchasi', icon: Layers },
  { id: 'Agro-Vet', label: 'Agro-Vet', icon: Leaf },
  { id: 'Yem va Ozuqa', label: 'Yem va Ozuqa', icon: Wheat },
  { id: "Urug'chilik", label: "Urug'chilik", icon: Sprout },
  { id: 'Ulgurji Ombor', label: 'Ulgurji Ombor', icon: Warehouse },
  { id: 'Texnika va Jihozlar', label: 'Texnika', icon: Wrench },
];

export const Products: React.FC = () => {
  const [filter, setFilter] = useState('Barchasi');
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [isKgMode, setIsKgMode] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [orderSubmitted, setOrderSubmitted] = useState(false);

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
    <section id="products" className="py-16 sm:py-24 bg-cream-soft/60 border-y border-charcoal/5">
      <div className="container-x">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-agroGreen-800">
              Katalog & Narxlar
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-charcoal">
              Ommabop Mahsulotlar & Do‘konlar
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-charcoal/60 max-w-sm sm:text-right">
            BiznesGO POS kassa tizimiga ulangan agro-do‘konlarning real vaqtdagi ombor qoldiqlari va shaffof narxlari.
          </p>
        </div>

        {/* Dashboard 2-Ustunli Tuzilma (Chapda Dashboard filtr paneli, o'ngda mahsulotlar) */}
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          {/* CHAP: Zamonaviy Agro-Dashboard Filtr va Holat Paneli */}
          <aside className="lg:col-span-3 space-y-4">
            <div className="rounded-3xl bg-white p-5 border border-charcoal/10 shadow-sm">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-charcoal/10 text-xs font-black uppercase tracking-wider text-charcoal">
                <Filter className="h-4 w-4 text-agroGreen-700" /> Sektorlar Dashboardi
              </div>

              {/* Bo'limlar tugmalari */}
              <div className="flex flex-col gap-1.5">
                {CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  const isSelected = filter === c.id;
                  const count =
                    c.id === 'Barchasi'
                      ? PRODUCTS.length
                      : PRODUCTS.filter((p) => p.category === c.id).length;

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFilter(c.id)}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition cursor-pointer text-left ${
                        isSelected
                          ? 'bg-forest-dark text-white shadow-sm'
                          : 'bg-cream/50 text-charcoal/75 hover:bg-agroGreen-50 hover:text-agroGreen-900'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className={`h-4 w-4 ${isSelected ? 'text-agroGreen' : 'text-charcoal/40'}`} />
                        <span>{c.label}</span>
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-charcoal/5 text-charcoal/50'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Tizim Jonli Holati Vidjeti */}
              <div className="mt-5 pt-4 border-t border-charcoal/10 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal/40">
                  Marketplace Holati
                </span>

                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-charcoal/60 flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5 text-agroGreen-700" /> B2B Do‘konlar:
                  </span>
                  <span className="font-extrabold text-forest-dark">618+ faol</span>
                </div>

                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-charcoal/60 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-agroGreen-700" /> Ombor qoldig‘i:
                  </span>
                  <span className="font-extrabold text-agroGreen-800">100% Real-vaqt</span>
                </div>

                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-charcoal/60 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-agroGreen-700" /> Yetkazish:
                  </span>
                  <span className="font-extrabold text-forest-dark">1-3 soat</span>
                </div>
              </div>
            </div>
          </aside>

          {/* O'NG: Sodda, Zamonaviy va Real Rasmli Mahsulot Kartochkalari */}
          <main className="lg:col-span-9">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <article
                  key={p.id}
                  className="group flex flex-col justify-between rounded-3xl bg-white p-4 border border-charcoal/10 shadow-xs transition-colors duration-200 hover:border-agroGreen hover:shadow-soft"
                >
                  <div>
                    {/* Real agro-surat */}
                    <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-cream-soft">
                      <AgroImage
                        src={p.image}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute top-2.5 left-2.5 rounded-full bg-forest-dark/85 text-white backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold">
                        {p.category}
                      </span>
                    </div>

                    {/* Do'kon nomi va joylashuvi */}
                    <div className="mt-3 flex items-center justify-between text-[11px] text-charcoal/50">
                      <span className="font-semibold text-charcoal/80 flex items-center gap-1">
                        <Store className="h-3 w-3 text-agroGreen-700" /> {p.store}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" /> {p.location.split(',')[0]}
                      </span>
                    </div>

                    {/* Mahsulot nomi */}
                    <h4 className="mt-1.5 text-sm font-extrabold text-charcoal line-clamp-2 leading-snug">
                      {p.name}
                    </h4>

                    {/* Xususiyat va nishon */}
                    <p className="mt-1 text-[11px] text-agroGreen-800 font-semibold truncate">
                      ✓ {p.badge}
                    </p>
                  </div>

                  {/* Narx va Buyurtma Tugmasi */}
                  <div className="mt-4 pt-3 border-t border-charcoal/10 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-charcoal/40 line-through leading-none">{p.oldPrice}</p>
                      <p className="text-base font-black text-forest-dark mt-0.5">
                        {p.price} <span className="text-[10px] font-normal text-charcoal/50">/ {p.unit}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => openOrderModal(p)}
                      className="rounded-full bg-forest-dark hover:bg-agroGreen hover:text-forest-dark text-white px-3.5 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                    >
                      Buyurtma
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </main>
        </div>

        {/* Tezkor do'konga buyurtma berish modali */}
        {selectedProduct && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
            onClick={() => setSelectedProduct(null)}
          >
            <div
              className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-charcoal/10 animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full bg-cream hover:bg-charcoal/10 text-charcoal transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              {!orderSubmitted ? (
                <div>
                  <div className="flex items-center gap-3 border-b border-charcoal/10 pb-4">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-agroGreen-50 text-agroGreen-800 border border-agroGreen/20">
                      <Store className="h-5 w-5" />
                    </span>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-agroGreen-800">
                        To‘g‘ridan-to‘g‘ri Do‘konga Buyurtma
                      </span>
                      <h3 className="text-base font-black text-charcoal">{selectedProduct.store}</h3>
                      <p className="text-xs text-charcoal/50 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {selectedProduct.location}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleOrderSubmit} className="mt-4 space-y-4">
                    <div className="rounded-2xl bg-cream-soft p-3 border border-charcoal/5">
                      <p className="text-xs font-bold text-charcoal">{selectedProduct.name}</p>
                      <p className="text-sm font-black text-forest-dark mt-0.5">
                        {selectedProduct.price} <span className="text-xs font-normal text-charcoal/50">/ {selectedProduct.unit}</span>
                      </p>
                      <p className="text-[11px] text-agroGreen-800 font-semibold mt-1">✓ {selectedProduct.stock}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-charcoal/70">Ismingiz:</label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Azizbek"
                          className="mt-1 w-full rounded-xl border border-charcoal/15 bg-white px-3 py-2 text-xs outline-none focus:border-agroGreen"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-charcoal/70">Telefon raqamingiz:</label>
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(formatUzPhone(e.target.value))}
                          placeholder="+998 90 123 45 67"
                          className="mt-1 w-full rounded-xl border border-charcoal/15 bg-white px-3 py-2 text-xs outline-none focus:border-agroGreen"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-charcoal/80">Qabul qilish usuli:</label>
                        <span className="text-[10px] text-charcoal/40 font-medium">Sektor qoidalari</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDeliveryType('pickup')}
                          className={`flex flex-col items-start rounded-xl p-2.5 text-left border transition cursor-pointer ${
                            deliveryType === 'pickup'
                              ? 'bg-forest-dark text-white border-forest-dark shadow-xs'
                              : 'bg-white text-charcoal/80 border-charcoal/15 hover:border-agroGreen/40'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 text-xs font-black">
                            <Store className="h-3.5 w-3.5 text-agroGreen" /> Bron qilish & Olib ketish
                          </span>
                          <span className="mt-0.5 text-[10px] opacity-75 font-medium leading-tight">
                            Kichik tovarlar: do‘kondan borib olasiz
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeliveryType('delivery')}
                          className={`flex flex-col items-start rounded-xl p-2.5 text-left border transition cursor-pointer ${
                            deliveryType === 'delivery'
                              ? 'bg-forest-dark text-white border-forest-dark shadow-xs'
                              : 'bg-white text-charcoal/80 border-charcoal/15 hover:border-agroGreen/40'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 text-xs font-black">
                            <Truck className="h-3.5 w-3.5 text-amber" /> Sektor Logistikasi
                          </span>
                          <span className="mt-0.5 text-[10px] opacity-75 font-medium leading-tight">
                            Yirik partiya / Boshqa viloyat: sektor yetkazadi
                          </span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-agroGreen hover:bg-agroGreen-hover text-forest-dark font-black py-3 text-sm transition shadow-glow-green cursor-pointer active:scale-95"
                    >
                      <Send className="h-4 w-4" /> {deliveryType === 'pickup' ? 'Do‘konda Zaxiraga Bron Qilish' : 'Sektor Logistikasiga Buyurtma Berish'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="py-6 text-center animate-fade-up">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-agroGreen/20 text-agroGreen border border-agroGreen/30">
                    <Check className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 text-lg font-black text-charcoal">
                    {deliveryType === 'pickup' ? 'Mahsulot Bron Qilindi!' : 'Sektor Logistikasiga Qabul Qilindi!'}
                  </h3>
                  <p className="mt-2 text-xs text-charcoal/70 max-w-sm mx-auto leading-relaxed">
                    {deliveryType === 'pickup' ? (
                      <>
                        Buyurtmangiz <b>{selectedProduct.store}</b> kassa tizimida siz uchun zaxiraga olindi. Do‘konga borib navbatsiz olib ketishingiz mumkin.
                      </>
                    ) : (
                      <>
                        Yirik buyurtmangiz <b>{selectedProduct.store}</b> sektor transport bo‘limiga yetkazildi. Sektor xodimi yuk yetkazish vaqti va manzili bo‘yicha siz bilan bog‘lanadi.
                      </>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="mt-6 rounded-full bg-forest-dark text-white px-6 py-2 text-xs font-bold hover:bg-forest transition cursor-pointer"
                  >
                    Tushunarli
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
