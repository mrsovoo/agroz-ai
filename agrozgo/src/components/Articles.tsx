import React, { useState } from 'react';
import {
  ArrowUpRight,
  Calendar,
  Clock,
  BookOpen,
  Sparkles,
  X,
  CheckCircle2,
  Share2,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react';
import { AgroImage } from './ui';
import { ARTICLES } from '../data/content';

type ArticleType = (typeof ARTICLES)[0];

/**
 * Foydali Maqolalar & Kerakli Agro-Yangiliklar bo'limi:
 * 4 ta agro sektor bo'yicha amaliy tavsiyalar, me'yorlar va to'liq o'qish modali.
 */
export const Articles: React.FC = () => {
  const [selectedArticle, setSelectedArticle] = useState<ArticleType | null>(null);

  return (
    <section id="articles" className="py-16 sm:py-24 bg-cream-soft/60 border-t border-charcoal/5 scroll-mt-24">
      <div className="container-x">
        {/* Sarlavha qismi */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-14">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-agroGreen/15 border border-agroGreen/30 px-3.5 py-1 text-xs font-black text-agroGreen-800">
              <Sparkles className="h-3.5 w-3.5 text-agroGreen-700" />
              Kerakli Yangiliklar & Bilimlar
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-charcoal">
              Foydali Maqolalar & <span className="text-agroGreen">Agro-Tavsiyalar</span>
            </h2>
          </div>
          <p className="max-w-md text-xs sm:text-sm text-charcoal/65 sm:text-right leading-relaxed">
            Yetakchi agronomlar, veterinariya mutaxassislari va amaliyotchi fermerlar tajribalari hamda eng so‘nggi agro-yangiliklar.
          </p>
        </div>

        {/* 4 ta Zamonaviy Karta */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ARTICLES.map((a) => (
            <article
              key={a.id}
              onClick={() => setSelectedArticle(a)}
              className="group flex flex-col justify-between rounded-3xl bg-white p-5 border border-charcoal/10 shadow-xs transition-all duration-200 hover:border-agroGreen hover:shadow-soft cursor-pointer"
            >
              <div>
                {/* Rasm konteyneri */}
                <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-cream-soft">
                  <AgroImage
                    src={a.image}
                    alt={a.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 rounded-full bg-forest-dark/85 text-white backdrop-blur-md px-3 py-1 text-[10px] font-bold">
                    {a.category}
                  </span>
                  <span className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-forest-dark shadow-sm transition group-hover:bg-agroGreen group-hover:scale-110">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>

                {/* Metalar: Sana va Vaqt */}
                <div className="mt-4 flex items-center gap-2.5 text-[11px] font-semibold text-charcoal/50">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-agroGreen-700" /> {a.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-agroGreen-700" /> {a.readTime}
                  </span>
                </div>

                {/* Sarlavha */}
                <h3 className="mt-2 text-sm sm:text-base font-extrabold text-charcoal leading-snug group-hover:text-agroGreen-900 transition-colors line-clamp-2">
                  {a.title}
                </h3>

                {/* Qisqa tavsif */}
                <p className="mt-2 text-xs text-charcoal/65 leading-relaxed line-clamp-2">
                  {a.summary}
                </p>
              </div>

              {/* Muallif va O'qish harakati */}
              <div className="mt-5 flex items-center justify-between border-t border-charcoal/10 pt-3 text-xs">
                <span className="font-semibold text-charcoal/70 flex items-center gap-1.5 truncate max-w-[150px]">
                  <BookOpen className="h-3.5 w-3.5 text-agroGreen-700 shrink-0" />
                  <span className="truncate">{a.author.split('(')[0]}</span>
                </span>
                <span className="font-black text-agroGreen-800 flex items-center gap-1 shrink-0 group-hover:underline">
                  O‘qish <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* TO'LIQ MAQOLA VA TAVSIYANI KO'RISH MODALI */}
        {selectedArticle && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-forest-dark/70 p-4 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedArticle(null)}
          >
            <div
              className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-card border border-charcoal/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Yopish tugmasi */}
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                aria-label="Yopish"
                className="absolute top-5 right-5 grid h-9 w-9 place-items-center rounded-full bg-cream hover:bg-cream-warm text-charcoal transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Kategoriya & Meta */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="rounded-full bg-agroGreen/15 border border-agroGreen/30 text-agroGreen-800 px-3 py-1 text-xs font-black">
                  {selectedArticle.category}
                </span>
                <span className="text-xs text-charcoal/50 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-agroGreen-700" /> {selectedArticle.date}
                </span>
                <span className="text-xs text-charcoal/50 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-agroGreen-700" /> {selectedArticle.readTime}
                </span>
              </div>

              {/* Sarlavha */}
              <h3 className="text-xl sm:text-2xl font-black text-charcoal leading-snug">
                {selectedArticle.title}
              </h3>

              {/* Muallif */}
              <div className="mt-3 flex items-center gap-2 text-xs font-bold text-charcoal/70 bg-cream-soft p-3 rounded-xl border border-charcoal/5">
                <BookOpen className="h-4 w-4 text-agroGreen-700 shrink-0" />
                <span>Muallif: {selectedArticle.author}</span>
              </div>

              {/* Rasm */}
              <div className="mt-5 h-56 sm:h-64 w-full overflow-hidden rounded-2xl">
                <AgroImage
                  src={selectedArticle.image}
                  alt={selectedArticle.title}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Qisqa mazmuni */}
              <div className="mt-5">
                <h4 className="text-xs font-black uppercase tracking-wider text-agroGreen-800">
                  Umumiy Xulosa & Muammo
                </h4>
                <p className="mt-1.5 text-sm text-charcoal/80 leading-relaxed font-medium">
                  {selectedArticle.summary}
                </p>
              </div>

              {/* Amaliy Tavsiyalar va Me'yorlar */}
              <div className="mt-6 pt-5 border-t border-charcoal/10">
                <h4 className="text-xs font-black uppercase tracking-wider text-charcoal">
                  Mutaxassisning Amaliy Tavsiyalari:
                </h4>
                <div className="mt-3 space-y-2.5">
                  {selectedArticle.tips?.map((tip, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-2xl bg-cream-soft p-3.5 border border-charcoal/5 text-xs text-charcoal/85 leading-relaxed"
                    >
                      <CheckCircle2 className="h-4 w-4 text-agroGreen-700 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pastki CTA Tugmalari */}
              <div className="mt-8 pt-6 border-t border-charcoal/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <a
                  href="#products"
                  onClick={() => setSelectedArticle(null)}
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-agroGreen hover:bg-agroGreen-hover text-forest-dark font-black py-3 px-6 text-xs transition active:scale-95"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Tegishli Mahsulotlarni Ko‘rish</span>
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedArticle(null)}
                  className="w-full sm:w-auto rounded-xl border border-charcoal/15 bg-white hover:bg-cream-warm py-3 px-6 text-xs font-bold text-charcoal transition cursor-pointer"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
