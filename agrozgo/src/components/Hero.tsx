import React, { useState } from 'react';
import { Search, MapPin, Loader2, Navigation, ArrowRight, ArrowUpRight, Sparkles, Building2, Store, Users, ShoppingBag, Truck } from 'lucide-react';
import { AgroImage, AgrozSymbol } from './ui';
import { IMAGES, SEARCH_SUGGESTIONS, DEMO_RESULTS, SECTORS, BIZNESGO_URL } from '../data/content';

type Status = 'idle' | 'locating' | 'searching' | 'done';

export const Hero: React.FC = () => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('Toshkent, Chilonzor');
  const [status, setStatus] = useState<Status>('idle');

  const detectLocation = () => {
    setStatus('locating');
    const finish = (label: string) => {
      setLocation(label);
      setStatus('idle');
    };
    if (!('geolocation' in navigator)) return finish('Toshkent, Chilonzor');
    navigator.geolocation.getCurrentPosition(
      (pos) => finish(`${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)} (joriy joy)`),
      () => finish('Toshkent, Chilonzor'),
      { timeout: 5000 }
    );
  };

  const runSearch = (e?: React.FormEvent, value?: string) => {
    e?.preventDefault();
    if (value !== undefined) setQuery(value);
    setStatus('searching');
    window.setTimeout(() => setStatus('done'), 700);
  };

  const results = DEMO_RESULTS.default;
  const sectorOf = (id: string) => SECTORS.find((s) => s.id === id);

  return (
    <section id="top" className="relative overflow-hidden pt-24 sm:pt-28 pb-10">
      <div className="container-x">
        {/* Asosiy Katta Kavisli Bento Frama */}
        <div className="relative overflow-hidden rounded-[32px] sm:rounded-[44px] border border-forest-border/20 bg-forest-dark shadow-2xl">
          {/* Orqa fon: yam-yashil terrasa ekinzorlari manzarasi */}
          <AgroImage
            src={IMAGES.aerial}
            alt="Yashil agro-ekinzorlar manzarasi"
            className="absolute inset-0 h-full w-full object-cover opacity-85 scale-105 transition-transform duration-1000"
          />
          {/* Yumshoq qoraytiruvchi va kontrast gradientlar */}
          <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/95 via-forest-dark/35 to-forest-dark/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-forest-dark/85 via-forest-dark/40 to-forest-dark/75" />

          {/* Yuqori qism: Sarlavha va Katta Hero Matni */}
          <div className="relative p-6 sm:p-10 lg:p-14">
            <div className="max-w-3xl animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-md shadow-sm">
                <AgrozSymbol className="h-4 w-4" color="#fead32" />
                Agro-Marketplace & B2B Kassa Ekotizimi
              </span>

              <h1 className="mt-5 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
                Fermer, Chorvador va Dehqonlar uchun <br className="hidden sm:inline" />
                <span className="text-agroGreen">Agro-Marketplace</span>
              </h1>

              <p className="mt-4 max-w-2xl text-base sm:text-lg text-white/85 leading-relaxed font-medium">
                Do‘konlar uchun raqamli POS kassa, fermerlar uchun esa eng yaqin dorixona, yem, urug‘ va texnikalarni bitta joyda jamlagan yagona ekotizim.
              </p>

              {/* 3 TA ASOSIY METRIKA */}
              <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-3.5 text-white">
                  <div className="flex items-center gap-1.5">
                    <Store className="h-4 w-4 text-agroGreen" />
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Ulangan Do‘konlar</span>
                  </div>
                  <p className="mt-1 text-2xl font-black text-white">1 200+</p>
                  <p className="text-[11px] text-white/70 font-medium leading-snug">POS kassa & real ombor qoldig‘i</p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-3.5 text-white">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-agroGreen" />
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Faol Fermerlar</span>
                  </div>
                  <p className="mt-1 text-2xl font-black text-white">50 000+</p>
                  <p className="text-[11px] text-white/70 font-medium leading-snug">Respublika bo‘ylab xaridorlar</p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-3.5 text-white">
                  <div className="flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-agroGreen" />
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Xarid & Logistika</span>
                  </div>
                  <p className="mt-1 text-2xl font-black text-white">Bron & Sektor</p>
                  <p className="text-[11px] text-white/70 font-medium leading-snug">Kichik: o‘zi olib ketadi • Yirik: sektor yetkazadi</p>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-4">
                <a
                  href="#sectors"
                  className="group inline-flex items-center gap-3 rounded-full border border-white/40 bg-white/15 px-6 py-3 text-sm font-extrabold text-white backdrop-blur-md transition hover:bg-white hover:text-forest-dark active:scale-95 shadow-sm"
                >
                  Barcha 5 ta sektor
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </a>
                <a
                  href="#products"
                  className="inline-flex items-center gap-2 rounded-full bg-agroGreen hover:bg-agroGreen-hover text-forest-dark font-extrabold px-6 py-3 text-sm transition shadow-glow-green active:scale-95"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Mahsulotlar katalogi
                </a>
              </div>
            </div>

            {/* B2C va B2B ni BITTADA TUSHUNTIRUVCHI 2 TA ASOSIY BENTO KARTA */}
            <div className="mt-12">
              {/* Ekotizim tushuntiruvchi ixcham yashil strip */}
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-black/50 border border-white/15 px-4 py-1.5 text-xs text-white/80 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-agroGreen" />
                <span className="font-semibold text-agroGreen">Ekotizim qanday ishlaydi?</span>
                <span className="hidden sm:inline text-white/70">Do‘konlar BiznesGO (B2B) da tovar kiritadi, Fermerlar esa AgrozGO (B2C) orqali xarid qiladi.</span>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* 1. AGROZGO (B2C) — FERMERLAR UCHUN */}
                <div className="group relative flex flex-col sm:flex-row items-center gap-5 rounded-[28px] bg-[#F7F5EE] p-5 sm:p-6 text-charcoal shadow-xl transition-all duration-300 hover:shadow-2xl border border-charcoal/5">
                  <div className="relative h-36 w-full sm:w-40 shrink-0 overflow-hidden rounded-2xl bg-white border border-charcoal/5">
                    <AgroImage
                      src={IMAGES.livestock}
                      alt="AgrozGO fermerlar ilovasi"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-forest-dark bg-agroGreen px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs">
                      <Users className="h-3 w-3" /> AgrozGO (B2C) — Fermerlar Uchun
                    </span>
                    <h3 className="mt-2 text-lg font-black text-charcoal leading-snug">
                      Tezkor bron qilish & Sektor logistikasi
                    </h3>
                    <p className="mt-1 text-xs text-charcoal/70 leading-relaxed">
                      Kichik tovarlarni yaqin do‘kondan zaxiraga bron qilib, o‘zingiz borib olasiz. Yirik partiya va texnikalarni esa sektorning o‘zi yetkazib beradi.
                    </p>
                    <a
                      href="#products"
                      className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-charcoal/20 bg-white px-4 py-2 text-xs font-bold text-charcoal hover:bg-forest-dark hover:text-white transition"
                    >
                      Katalogda ko‘rish <ArrowRight className="h-3 w-3" />
                    </a>
                  </div>
                  <span className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full bg-agroGreen text-forest-dark shadow-sm group-hover:scale-110 transition">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>

                {/* 2. BIZNESGO (B2B) — DO'KONLAR VA DORIXONALAR UCHUN */}
                <div className="group relative flex flex-col sm:flex-row items-center gap-5 rounded-[28px] bg-[#F7F5EE] p-5 sm:p-6 text-charcoal shadow-xl transition-all duration-300 hover:shadow-2xl border border-charcoal/5">
                  <div className="flex-1 min-w-0 order-2 sm:order-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white bg-forest-dark px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs">
                      <Store className="h-3 w-3 text-agroGreen" /> BiznesGO (B2B) — Do‘konlar Uchun
                    </span>
                    <h3 className="mt-2 text-lg font-black text-charcoal leading-snug">
                      Smart POS kassa, ombor va qarz daftari
                    </h3>
                    <p className="mt-1 text-xs text-charcoal/70 leading-relaxed">
                      Agro-do‘kon egasi kassa va ombor hisobini BiznesGO’da yuritadi. Tizimdagi tovarlar avtomatik AgrozGO marketplace fermerlariga ko‘rinadi.
                    </p>
                    <a
                      href={BIZNESGO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-forest-dark text-white px-5 py-2 text-xs font-bold hover:bg-forest transition shadow-sm"
                    >
                      Do‘konni ulash <ArrowRight className="h-3.5 w-3.5 text-agroGreen" />
                    </a>
                  </div>
                  <div className="relative h-36 w-full sm:w-40 shrink-0 overflow-hidden rounded-2xl bg-white border border-charcoal/5 order-1 sm:order-2">
                    <AgroImage
                      src={IMAGES.controller}
                      alt="BiznesGO Smart kassa boshqaruvi"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <span className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full bg-forest-dark text-agroGreen shadow-sm group-hover:scale-110 transition">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Qidiruv Simulyatori (Fermerlar uchun do'konlar va mahsulotlar qidiruvi) */}
        <div className="mt-8 rounded-3xl bg-white/95 p-4 sm:p-6 shadow-card border border-charcoal/5 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-agroGreen-50 text-agroGreen-800 border border-agroGreen/20">
                <Search className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-extrabold text-charcoal">Yaqin atrofdagi tovarlar va dorixonalarni qidiring</p>
                <p className="text-xs text-charcoal/50">Vaksina, yem, nasos yoki urug‘larni real vaqtda toping</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={detectLocation}
                className="flex items-center gap-2 rounded-full bg-cream-soft border border-charcoal/10 px-3.5 py-2 text-xs font-semibold text-charcoal/80 transition hover:border-agroGreen/40 hover:bg-agroGreen-50"
              >
                {status === 'locating' ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-agroGreen-700" />
                ) : (
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-agroGreen-700" />
                )}
                <span className="truncate max-w-[150px]">{status === 'locating' ? 'Aniqlanmoqda...' : location}</span>
              </button>
            </div>
          </div>

          <form onSubmit={runSearch} className="mt-4 flex flex-col sm:flex-row gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-2xl bg-cream-soft px-4 py-2.5 border border-charcoal/5">
              <Search className="h-4 w-4 text-charcoal/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Mahsulot nomi yoki toifa (masalan: omuxta yem, vaksina, urug‘)..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-charcoal/40"
              />
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-2xl bg-agroGreen hover:bg-agroGreen-hover text-forest-dark font-extrabold px-7 py-3 text-sm transition shadow-glow-subtle cursor-pointer active:scale-95"
            >
              {status === 'searching' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
              Qidirish
            </button>
          </form>

          {/* Qidiruv bo'yicha tezkor teglar */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-charcoal/60">
            <span className="font-semibold text-charcoal/40">Ommabop qidiruvlar:</span>
            {SEARCH_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => runSearch(undefined, s)}
                className="rounded-full bg-cream px-3 py-1 text-[11px] font-semibold text-charcoal/70 transition hover:bg-agroGreen hover:text-forest-dark cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Qidiruv natijalari simulyatsiyasi */}
          {status === 'done' && (
            <div className="mt-6 border-t border-charcoal/10 pt-5 animate-fade-up">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold uppercase tracking-wider text-charcoal/60">
                  Topilgan natijalar ({results.length} ta do‘kon)
                </p>
                <span className="text-[11px] text-agroGreen-800 font-bold bg-agroGreen-50 px-2 py-0.5 rounded-md">
                  Real ombor qoldig‘i
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {results.map((r) => {
                  const s = sectorOf(r.sector);
                  const Icon = s?.icon || Store;
                  return (
                    <div
                      key={r.store}
                      className="rounded-2xl border border-charcoal/10 bg-cream-soft p-4 transition hover:border-agroGreen/40 hover:bg-white"
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-agroGreen-900 border border-charcoal/5">
                          <Icon className="h-3 w-3 text-agroGreen-700" /> {s?.title.split(' ')[0]}
                        </span>
                        <span className="text-[11px] font-bold text-charcoal/50">{r.distance}</span>
                      </div>
                      <p className="mt-2 text-sm font-extrabold text-charcoal">{r.store}</p>
                      <p className="text-xs text-charcoal/60">{r.address}</p>
                      <p className="mt-2 text-[11px] font-semibold text-agroGreen-800">✓ {r.price}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
