import React from 'react';
import {
  Leaf,
  Wheat,
  Warehouse,
  Sprout,
  Wrench,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

/**
 * 5 ta Agro-Sektor bo'limi — Referens dizaynga 1:1 mos keluvchi ko'rinish:
 * - Yuqori qism: "5 ta Agro-Sektor" sarlavhasi va o'ngda "Barcha sektorlar →" tugmasi
 * - Markazda: To'lqinsimon (wavy curve) bog'lovchi chiziq va 5 ta dumaloq oq karta
 * - Har bir karta ostida: 01, 02... raqamlari, sektor nomi va 2 qatorli qisqa tavsif
 */
const SECTOR_NODES = [
  {
    step: '01',
    id: 'agro-vet',
    title: 'Agro-Vet & Dorilar',
    desc: 'Partiya № va yaroqlilik muddati qat’iy nazorati bilan dori va vaksinalar.',
    icon: Leaf,
    tag: 'Vet-Dorixona',
  },
  {
    step: '02',
    id: 'feed',
    title: 'Yem va Ozuqalar',
    desc: 'Qoramol va parranda ozuqalari, omuxta yem va kepakni qoplab yoki kg-lab xarid.',
    icon: Wheat,
    tag: 'Ozuqa-Yem',
  },
  {
    step: '03',
    id: 'warehouse',
    title: 'Ombor & Qadoqlash',
    desc: 'Issiqxona plyonkalari, tomchilatib sug‘orish tizimlari va 2 bosqichli narx.',
    icon: Warehouse,
    tag: 'Ombor-Taralar',
  },
  {
    step: '04',
    id: 'seeds',
    title: 'Urug‘ va Ko‘chatlar',
    desc: 'Sertifikatlangan 98% unuvchanlik va nav tozaligi kafolati bilan.',
    icon: Sprout,
    tag: 'Elita Urug‘',
  },
  {
    step: '05',
    id: 'machinery',
    title: 'Jihozlar & Texnika',
    desc: 'Motobloklar, purkagichlar va suv nasoslari rasmiy S/N chek-kafolatida.',
    icon: Wrench,
    tag: 'Agro-Texnika',
  },
];

export const Sectors: React.FC = () => {
  return (
    <section id="sectors" className="py-12 sm:py-16 bg-cream-soft/40 border-y border-charcoal/5 scroll-mt-24">
      {/* Anchor target for #products */}
      <div id="products" className="-top-24 relative" />

      <div className="container-x">
        {/* ASOSIY REFERENS CONTAINER (Referens rasmga 1:1) */}
        <div className="relative overflow-hidden rounded-[32px] bg-white border border-charcoal/10 p-6 sm:p-10 lg:p-12 shadow-xs">
          
          {/* YUQORI QATOR: SARLAVHA VA "BARCHA SEKTORLAR →" TUGMASI */}
          <div className="flex items-center justify-between gap-4 mb-8 sm:mb-12">
            <div>
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-agroGreen-800 bg-agroGreen/15 border border-agroGreen/30 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                Ekotizim Qamrovi
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
                5 ta Agro-Sektor
              </h2>
            </div>

            <a
              href="#standards"
              className="rounded-full border border-charcoal/15 bg-white px-4 sm:px-5 py-2 text-xs font-bold text-charcoal hover:bg-cream-soft hover:border-agroGreen/40 transition shadow-xs inline-flex items-center gap-1.5 shrink-0 group"
            >
              <span>Barcha sektorlar</span>
              <ArrowRight className="h-3.5 w-3.5 text-agroGreen transition-transform group-hover:translate-x-1" />
            </a>
          </div>

          {/* 5 TA TUGUN VA TO'LQINSIMON (WAVY) BOG'LOVCHI CHIZIQ */}
          <div className="relative overflow-x-auto pb-4 scrollbar-none">
            <div className="relative min-w-[760px] lg:min-w-0 pt-4 pb-2">
              
              {/* TO'LQINSIMON SVG BOG'LOVCHI CHIZIQ (Sinusoidal Wave Connector) */}
              <div className="absolute top-[48px] sm:top-[56px] inset-x-0 h-16 pointer-events-none z-0">
                <svg
                  viewBox="0 0 1000 80"
                  preserveAspectRatio="none"
                  className="w-full h-full"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* To'lqinli bog'lovchi chiziq */}
                  <path
                    d="M 100,20 C 150,20 150,65 200,65 C 250,65 250,20 300,20 C 350,20 350,65 400,65 C 450,65 450,20 500,20 C 550,20 550,65 600,65 C 650,65 650,20 700,20 C 750,20 750,65 800,65 C 850,65 850,20 900,20"
                    fill="none"
                    stroke="#D5D0C2"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />

                  {/* To'lqinning pastki nuqtalaridagi yorqin oltin nishon nuqtachalari */}
                  <circle cx="200" cy="65" r="4.5" fill="#fead32" />
                  <circle cx="400" cy="65" r="4.5" fill="#fead32" />
                  <circle cx="600" cy="65" r="4.5" fill="#fead32" />
                  <circle cx="800" cy="65" r="4.5" fill="#fead32" />
                </svg>
              </div>

              {/* 5 TA SEKTOR TUGUNLARI (Teng 5 ustun) */}
              <div className="relative z-10 grid grid-cols-5 gap-3 sm:gap-6 text-center">
                {SECTOR_NODES.map((node) => {
                  const Icon = node.icon;
                  return (
                    <div
                      key={node.id}
                      className="group flex flex-col items-center cursor-pointer"
                    >
                      {/* OQ DUMALOQ KARTA (Circle Node with Icon) */}
                      <div className="grid h-16 w-16 sm:h-20 sm:w-20 place-items-center rounded-full bg-white shadow-soft border border-charcoal/10 transition-all duration-300 group-hover:scale-105 group-hover:border-agroGreen group-hover:shadow-glow-subtle">
                        <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-charcoal group-hover:text-agroGreen transition-colors" />
                      </div>

                      {/* MATNLAR: Raqam, Sarlavha va Tavsif */}
                      <div className="mt-5 sm:mt-6 px-1">
                        <span className="text-xs font-black text-charcoal/40 tracking-wider">
                          {node.step}
                        </span>
                        <h3 className="mt-1 text-xs sm:text-sm font-black text-charcoal group-hover:text-agroGreen-900 transition-colors leading-snug">
                          {node.title}
                        </h3>
                        <p className="mt-1.5 text-[11px] sm:text-xs text-charcoal/65 leading-relaxed line-clamp-2">
                          {node.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
