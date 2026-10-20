import React, { useRef } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { AgroImage } from './ui';

/**
 * Zamonaviy agrotexnologiyalar bo'limi — Referens dizaynga 1:1 mos keluvchi ko'rinish:
 * - Orqa fonda yengil ulkan "Our Product" suv belgisi (watermark)
 * - Pog'onali (staggered) joylashgan zamonaviy foto-kartochkalar va pastki shaffof glassmorphism paneli
 * - Pastki qismda: "Want to explore more of our smart farming products?" + "View More →" tugmasi
 * - O'ng burchakda: dumaloq slider strelkalari (< va >)
 */
const SMART_PRODUCTS = [
  {
    id: 'aerocrop-drone',
    title: 'AeroCrop X1 - Smart Drone',
    desc: 'High-resolution drone for monitoring, mapping, and real-time analysis.',
    image: '/images/agro-drone.jpg',
    stagger: false,
  },
  {
    id: 'agritrak-pro',
    title: 'AgriTrak Pro',
    desc: 'Autonomous tractor with GPS precision for land preparation and seeding.',
    image: '/images/tractor.jpg',
    stagger: true, // Referensdagi kabi pastroqqa siljigan (staggered)
  },
  {
    id: 'hydrogrow-kit',
    title: 'HydroGrow Kit',
    desc: 'All-in-one smart hydroponic kit with automated nutrient and light control.',
    image: '/images/seedlings.jpg',
    stagger: false,
  },
  {
    id: 'farmbot-sens',
    title: 'FarmBot Smart Controller',
    desc: 'AI-powered precision irrigation and real-time soil analysis sensor.',
    image: '/images/smart-controller.jpg',
    stagger: true, // Staggered offset
  },
];

export const Technology: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <section id="technology" className="py-16 sm:py-24 bg-white/60 border-b border-charcoal/5 scroll-mt-24">
      <div className="container-x">
        {/* Bo'lim Sarlavhasi */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-agroGreen/30 bg-agroGreen/15 px-3.5 py-1 text-xs font-black text-agroGreen-800">
              <Sparkles className="h-3.5 w-3.5 text-agroGreen-700" />
              Smart Agro-Infratuzilma
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-charcoal leading-[1.14]">
              Zamonaviy agrotexnologiyalar bilan <br className="hidden sm:inline" />
              <span className="text-agroGreen">savdo yangi cho‘qqida</span>
            </h2>
          </div>
        </div>

        {/* ASOSIY REFERENS BOX (Fonda "Our Product" yozuvi bilan) */}
        <div className="relative overflow-hidden rounded-[36px] bg-[#F7F5EE] border border-charcoal/10 p-6 sm:p-10 lg:p-12 shadow-xs">
          
          {/* ORQA FONDA ULKAN SUV BELGISI (Watermark Typography - Referens 1:1) */}
          <div className="pointer-events-none absolute top-8 sm:top-12 left-1/2 -translate-x-1/2 text-[70px] sm:text-[130px] lg:text-[165px] font-black text-charcoal/[0.04] tracking-tight select-none whitespace-nowrap">
            Our Product
          </div>

          {/* FOTO-KARTOCHKALAR LENTASI (Staggered Wave) */}
          <div
            ref={scrollRef}
            className="relative z-10 flex gap-5 overflow-x-auto pb-4 pt-2 scrollbar-none snap-x snap-mandatory"
          >
            {SMART_PRODUCTS.map((prod) => (
              <div
                key={prod.id}
                className={`group relative flex-none w-[270px] sm:w-[310px] h-[370px] sm:h-[420px] rounded-[30px] overflow-hidden shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-soft snap-start ${
                  prod.stagger ? 'sm:mt-8' : ''
                }`}
              >
                {/* Asosiy Rasm */}
                <AgroImage
                  src={prod.image}
                  alt={prod.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Yengil gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* PASTKI SHAFSHOF GLASSMORPHISM QUTICHA (Referens 1:1) */}
                <div className="absolute inset-x-3.5 bottom-3.5 rounded-2xl bg-black/45 backdrop-blur-md p-4 text-white border border-white/15">
                  <h4 className="text-sm sm:text-base font-extrabold text-white leading-snug">
                    {prod.title}
                  </h4>
                  <p className="mt-1 text-[11px] sm:text-xs text-white/80 leading-relaxed line-clamp-2">
                    {prod.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* PASTKI STRIP (Referensdagi chapdagi savol + tugma va o'ngdagi slider tugmalari) */}
          <div className="relative z-10 mt-10 pt-6 border-t border-charcoal/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            
            {/* Chap tomon: Savol va "View More →" tugmasi */}
            <div>
              <p className="text-sm sm:text-base font-black text-charcoal">
                Want to explore more of our smart farming products?
              </p>
              <div className="mt-2.5">
                <a
                  href="#sectors"
                  className="inline-flex items-center gap-2 rounded-full bg-agroGreen hover:bg-agroGreen-hover text-forest-dark font-black px-5 py-2.5 text-xs transition shadow-sm active:scale-95 group"
                >
                  <span>View More</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </div>

            {/* O'ng tomon: Slider strelkalari (< va >) */}
            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={scrollLeft}
                aria-label="Oldingi mahsulot"
                className="grid h-10 w-10 place-items-center rounded-full border border-charcoal/15 bg-white text-charcoal hover:bg-cream-soft transition shadow-xs active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={scrollRight}
                aria-label="Keyingi mahsulot"
                className="grid h-10 w-10 place-items-center rounded-full bg-agroGreen text-forest-dark hover:bg-agroGreen-hover transition shadow-sm active:scale-95 cursor-pointer"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
