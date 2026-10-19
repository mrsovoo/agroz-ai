import React from 'react';
import { ArrowUpRight, Calendar, Clock } from 'lucide-react';
import { AgroImage } from './ui';
import { ARTICLES } from '../data/content';

export const Articles: React.FC = () => {
  return (
    <section id="articles" className="py-16 sm:py-24">
      <div className="container-x">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-agroGreen-800">
              Bilimlar & Yangiliklar
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-charcoal">
              Foydali Maqolalar & Agro-Tavsiyalar
            </h2>
          </div>
          <p className="max-w-md text-xs sm:text-sm text-charcoal/65">
            Yetakchi agronomlar, veterinariya mutaxassislari va muvaffaqiyatli fermerlar tajribalari.
          </p>
        </div>

        {/* 3 ta Karta (Referens 1:1) */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ARTICLES.map((a) => (
            <article
              key={a.id}
              className="group relative flex flex-col rounded-[32px] bg-white p-5 shadow-card border border-charcoal/5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-soft"
            >
              {/* Rasm konteyneri */}
              <div className="relative h-56 w-full overflow-hidden rounded-[24px] bg-cream-soft">
                <AgroImage
                  src={a.image}
                  alt={a.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute top-3.5 left-3.5 rounded-full bg-forest-dark/80 text-white backdrop-blur-md px-3 py-1 text-[11px] font-bold">
                  {a.category}
                </span>
                <span className="absolute top-3.5 right-3.5 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-forest-dark shadow-sm transition group-hover:bg-agroGreen group-hover:scale-110">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>

              {/* Matn qismi */}
              <div className="mt-5 flex flex-1 flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 text-[11px] font-semibold text-charcoal/50">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-agroGreen" /> {a.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-agroGreen" /> {a.readTime}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-black text-charcoal leading-snug group-hover:text-agroGreen-900 transition">
                    {a.title}
                  </h3>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-charcoal/5 pt-3 text-xs">
                  <span className="font-semibold text-charcoal/70">{a.author}</span>
                  <span className="font-bold text-agroGreen-800 group-hover:underline">O‘qish ➔</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

