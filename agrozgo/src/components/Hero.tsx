import React, { useState } from 'react';
import { Search, MapPin, Loader2, Navigation, ArrowRight, ArrowUpRight, Sparkles, Star } from 'lucide-react';
import { AgroImage, AgrozSymbol } from './ui';
import { IMAGES, SEARCH_SUGGESTIONS, DEMO_RESULTS, SECTORS, BIZNESGO_URL } from '../data/content';

type Status = 'idle' | 'locating' | 'searching' | 'done';

const AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80',
];

export const Hero: React.FC = () => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('Toshkent, Chilonzor');
  const [status, setStatus] = useState<Status>('idle');

  // Standalone simulyatsiya: brauzer geolokatsiyasi so'raladi, natijalar statik.
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
        {/* Asosiy Katta Kavisli Bento Frama (Referens dizayn 1:1) */}
        <div className="relative overflow-hidden rounded-[32px] sm:rounded-[44px] border border-forest-border/20 bg-forest-dark shadow-2xl">
          {/* Orqa fon: yam-yashil terrasa ekinzorlari manzarasi */}
          <AgroImage
            src={IMAGES.aerial}
            alt="Yashil agro-ekinzorlar manzarasi"
            className="absolute inset-0 h-full w-full object-cover opacity-85 scale-105 transition-transform duration-1000"
          />
          {/* Yumshoq qoraytiruvchi va kontrast gradientlar */}
          <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/95 via-forest-dark/35 to-forest-dark/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-forest-dark/80 via-transparent to-forest-dark/70" />

          {/* Yuqori qism: Sarlavha + O'ngdagi Yashil Rating Kartasi */}
          <div className="relative p-6 sm:p-10 lg:p-14">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
              {/* Chap Sarlavha */}
              <div className="lg:col-span-8 animate-fade-up">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-md shadow-sm">
                  <AgrozSymbol className="h-4 w-4" color="#35ca56" />
                  Kelajak Agro-Ekotizimi • B2C & B2B
                </span>

                <h1 className="mt-5 text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
                  Kelajak qishloq <br className="hidden sm:inline" />
                  xo‘jaligi{' '}
                  <span className="inline-grid h-10 w-10 sm:h-14 sm:w-14 place-items-center rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-xl sm:text-2xl align-middle shadow-glow-subtle">
                    🌾
                  </span>
                </h1>

                <p className="mt-5 max-w-xl text-base sm:text-lg text-white/85 leading-relaxed font-medium">
                  Fermer, chorvador va dehqonlar uchun yagona aqlli Agro-Marketplace.
                  Eng yaqin vet-dorixonalar, yem, urug‘chilik va zamonaviy agro-texnikalar bir joyda.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <a
                    href="#sectors"
                    className="group inline-flex items-center gap-3 rounded-full border border-white/40 bg-white/15 px-6 py-3.5 text-sm font-extrabold text-white backdrop-blur-md transition hover:bg-white hover:text-forest-dark active:scale-95 shadow-sm"
                  >
                    Barcha mahsulotlar
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </a>
                  <a
                    href="#technology"
                    className="inline-flex items-center gap-2 rounded-full bg-agroGreen hover:bg-agroGreen-hover text-forest-dark font-extrabold px-6 py-3.5 text-sm transition shadow-glow-green active:scale-95"
                  >
                    <Sparkles className="h-4 w-4" />
                    Texnologiyalarni ko‘rish
                  </a>
                </div>
              </div>

              {/* O'ngdagi Yashil 4.9* Rating Kartasi (Referensdagi yorqin yashil bento card) */}
              <div className="flex justify-start lg:justify-end lg:col-span-4">
                <div className="w-full sm:w-72 rounded-[28px] bg-agroGreen p-6 text-forest-dark shadow-glow-green animate-fade-up [animation-delay:150ms] relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-4xl font-black tracking-tight text-white flex items-center gap-1">
                        4.9 <Star className="h-7 w-7 fill-white text-white inline" />
                      </p>
                      <p className="text-xs font-bold text-forest-dark/85 mt-1">1,200+ Fermerlar Bahosi</p>
                    </div>
                  </div>

                  {/* Overlapping mijozlar avatarlari */}
                  <div className="mt-5 flex -space-x-2.5 overflow-hidden">
                    {AVATARS.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt="Fermer fikri"
                        className="inline-block h-9 w-9 rounded-full ring-2 ring-agroGreen object-cover shadow-sm"
                      />
                    ))}
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-forest-dark text-[11px] font-black text-white ring-2 ring-agroGreen">
                      +1k
                    </span>
                  </div>

                  {/* Pastki: Google Review "G" va yulduzcha ramzi */}
                  <div className="mt-6 flex items-center justify-between border-t border-forest-dark/15 pt-4">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-base font-black text-forest-dark shadow-sm">
                      G
                    </span>
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-forest-dark text-agroGreen shadow-sm">
                      ✳
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pastki Bento Kartochkalar (Referensdagi 2 ta Off-White Cream bento card) */}
            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              {/* Chap Karta: Agro-Vet */}
              <div className="group relative flex flex-col sm:flex-row items-center gap-5 rounded-[28px] bg-[#F7F5EE] p-5 sm:p-6 text-charcoal shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                <div className="relative h-36 w-full sm:w-40 shrink-0 overflow-hidden rounded-2xl bg-white border border-charcoal/5">
                  <AgroImage
                    src={IMAGES.drone}
                    alt="Agro-Vet dori-darmonlari"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-agroGreen-800 bg-agroGreen/15 px-2.5 py-0.5 rounded-full">
                    Agro-Vet & Dorixonalar
                  </span>
                  <h3 className="mt-2 text-xl font-black text-charcoal">Enrofloksatsin & Dorilar</h3>
                  <p className="mt-1 text-xs text-charcoal/70 leading-relaxed">
                    Vaksinalar, antibiotiklar va premikslar — partiya raqami va yaroqlilik muddati nazorati bilan.
                  </p>
                  <a
                    href="#products"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-charcoal/20 bg-white px-4 py-2 text-xs font-bold text-charcoal hover:bg-forest-dark hover:text-white transition"
                  >
                    Mahsulotlarni ko‘rish
                  </a>
                </div>
                {/* Tepada ulagich yashil dumaloq belgi */}
                <span className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full bg-agroGreen text-forest-dark shadow-sm group-hover:scale-110 transition">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>

              {/* O'ng Karta: Smart Remote Controller & BiznesGO */}
              <div className="group relative flex flex-col sm:flex-row items-center gap-5 rounded-[28px] bg-[#F7F5EE] p-5 sm:p-6 text-charcoal shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                <div className="flex-1 min-w-0 order-2 sm:order-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-agroGreen-800 bg-agroGreen/15 px-2.5 py-0.5 rounded-full">
                    BiznesGO (B2B) Do‘konlar
                  </span>
                  <h3 className="mt-2 text-xl font-black text-charcoal">Smart POS & Kassa</h3>
                  <p className="mt-1 text-xs text-charcoal/70 leading-relaxed">
                    Do‘kon kassasi, ombor qoldiqlari va CRM qarz daftari AgrozGO marketplace bilan real vaqtda bog‘langan.
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

          {/* Ommabop qidiruvlar */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-charcoal/50">Ommabop:</span>
            {SEARCH_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => runSearch(undefined, s)}
                className="rounded-full border border-charcoal/10 bg-white px-3 py-1 text-xs font-semibold text-charcoal/70 transition hover:border-agroGreen hover:bg-agroGreen-50 hover:text-agroGreen-900 cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Qidiruv natijalari popup */}
          {status === 'done' && (
            <div className="mt-4 animate-fade-up rounded-2xl bg-white p-3.5 shadow-soft border border-agroGreen/30">
              <p className="px-2 pb-2 text-xs font-bold text-agroGreen-900 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-agroGreen" />
                “{query || 'Barcha mahsulotlar'}” — {location} yaqinida {results.length} ta do‘kon topildi (ko‘rgazmali)
              </p>
              <ul className="divide-y divide-charcoal/5">
                {results.map((r) => {
                  const s = sectorOf(r.sector);
                  return (
                    <li key={r.store} className="flex items-center gap-3 px-2 py-2.5">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-agroGreen-50 text-lg border border-agroGreen/20">
                        {s?.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-charcoal">{r.store}</p>
                        <p className="text-xs text-charcoal/60">
                          {s?.title} • <span className="text-agroGreen-700 font-semibold">{r.distance}</span>
                        </p>
                      </div>
                      <span className="whitespace-nowrap text-sm font-extrabold text-agroGreen-800 bg-agroGreen/10 px-2.5 py-1 rounded-lg border border-agroGreen/20">
                        {r.price}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
