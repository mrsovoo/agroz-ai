import React, { useState } from 'react';
import { Search, MapPin, Loader2, Navigation, Store, ArrowUpRight } from 'lucide-react';
import { AgroImage, DarkButton, AgrozSymbol } from './ui';
import { IMAGES, HERO_METRICS, SEARCH_SUGGESTIONS, DEMO_RESULTS, SECTORS } from '../data/content';

type Status = 'idle' | 'locating' | 'searching' | 'done';

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
    <section id="top" className="relative overflow-hidden pt-[88px]">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-3xl bg-beige shadow-soft">
          {/* Fon rasm */}
          <AgroImage src={IMAGES.hero} alt="Oltin bug'doyzor" className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/85 to-cream/10" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-cream/80 to-transparent" />

          <div className="relative grid gap-10 px-5 py-10 sm:px-10 sm:py-14 lg:grid-cols-12 lg:px-14 lg:py-16">
            <div className="animate-fade-up lg:col-span-7">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-bold text-charcoal shadow-card">
                <AgrozSymbol className="h-4 w-4" color="#35ca56" />
                B2C Agro-Marketplace • Tez orada
              </span>

              <h1 className="mt-5 text-[2rem] font-extrabold leading-[1.1] tracking-tight text-charcoal sm:text-5xl lg:text-[3.4rem]">
                Fermer, Chorvador va Dehqonlar uchun{' '}
                <span className="font-semibold text-charcoal/55">Yagona Agro-Marketplace</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-charcoal/70 sm:text-lg">
                Eng yaqin vet-dorixonalar, yem do‘konlari, urug‘chilik va agro-texnika markazlarini
                to‘g‘ridan-to‘g‘ri ko‘ring va buyurtma bering.
              </p>

              {/* Qidiruv simulyatsiyasi */}
              <form
                onSubmit={runSearch}
                className="mt-7 flex max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-soft sm:flex-row sm:items-center sm:rounded-full"
              >
                <div className="flex flex-1 items-center gap-2 px-3">
                  <Search className="h-5 w-5 shrink-0 text-charcoal/40" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Mahsulot: yem, vaksina, urug‘..."
                    className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-charcoal/40"
                    aria-label="Mahsulot qidirish"
                  />
                </div>
                <button
                  type="button"
                  onClick={detectLocation}
                  className="flex items-center gap-2 rounded-full bg-beige px-3 py-2.5 text-left text-xs font-semibold text-charcoal/80 transition hover:bg-gold-soft sm:max-w-[210px]"
                  title="Joylashuvni aniqlash"
                >
                  {status === 'locating' ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gold-dark" />
                  ) : (
                    <MapPin className="h-4 w-4 shrink-0 text-gold-dark" />
                  )}
                  <span className="truncate">{status === 'locating' ? 'Aniqlanmoqda...' : location}</span>
                </button>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-full bg-charcoal px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-forest-light"
                >
                  {status === 'searching' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                  Topish
                </button>
              </form>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-charcoal/50">Ommabop:</span>
                {SEARCH_SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => runSearch(undefined, s)} className="chip hover:border-gold hover:bg-gold-soft">
                    {s}
                  </button>
                ))}
              </div>

              {status === 'done' && (
                <div className="mt-4 max-w-2xl animate-fade-up rounded-2xl bg-white/95 p-3 shadow-soft">
                  <p className="px-2 pb-2 text-xs font-semibold text-charcoal/50">
                    “{query || 'Barcha mahsulotlar'}” — {location} yaqinida {results.length} ta do‘kon (demo)
                  </p>
                  <ul className="divide-y divide-charcoal/5">
                    {results.map((r) => {
                      const s = sectorOf(r.sector);
                      return (
                        <li key={r.store} className="flex items-center gap-3 px-2 py-2.5">
                          <span className="grid h-9 w-9 place-items-center rounded-xl bg-beige text-lg">{s?.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold">{r.store}</p>
                            <p className="text-xs text-charcoal/55">
                              {s?.title} • {r.distance}
                            </p>
                          </div>
                          <span className="whitespace-nowrap text-sm font-extrabold text-gold-dark">{r.price}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className="mt-8">
                <DarkButton href="#sectors">Sektorlarni ko‘rish</DarkButton>
              </div>
            </div>

            {/* O'ng tomondagi suzuvchi karta (referensdagi kabi) */}
            <div className="hidden items-end justify-end lg:col-span-5 lg:flex">
              <div className="w-72 animate-fade-up rounded-2xl bg-charcoal p-3 text-white shadow-soft [animation-delay:200ms]">
                <div className="flex items-start justify-between gap-3 p-2">
                  <div>
                    <p className="text-sm font-bold leading-snug">AgrozGO — B2B do‘konlar bilan ulangan ekotizim</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-white/60">
                      BiznesGO kassasidagi real qoldiq va narxlar to‘g‘ridan-to‘g‘ri fermerga.
                    </p>
                  </div>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-charcoal">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
                <div className="relative mt-2 h-36 overflow-hidden rounded-xl">
                  <AgroImage src={IMAGES.tractor} alt="Agro-texnika" className="h-full w-full" />
                  <span className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-charcoal">
                    <Store className="h-3.5 w-3.5 text-forest-badge" /> Live sinxron
                  </span>
                </div>
              </div>
            </div>

            {/* Metrika kartalari */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:col-span-12 lg:max-w-xl">
              {HERO_METRICS.map((m) => (
                <div key={m.label} className={`metric-card ${m.highlight ? '!bg-gold-soft' : ''}`}>
                  <p className="text-xl font-extrabold sm:text-2xl">{m.value}</p>
                  <p className="mt-1 text-[11px] leading-tight text-charcoal/65 sm:text-xs">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

