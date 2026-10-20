import React from 'react';
import { ArrowUpRight, Calendar, Clock, Newspaper, BookOpen } from 'lucide-react';
import { AgroImage, Eyebrow } from './ui';
import { ARTICLES } from '../data/content';

export const Articles: React.FC = () => {
  return (
    <section id="articles" className="py-16 sm:py-24 bg-cream-soft/60 border-t border-charcoal/5">
      <div className="container-x">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <Eyebrow>Bilimlar & Yangiliklar</Eyebrow>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-charcoal">
              Foydali Maqolalar & Agro-Tavsiyalar
            </h2>
          </div>
          <p className="max-w-md text-xs sm:text-sm text-charcoal/65 sm:text-right">
            Yetakchi agronomlar, veterinariya mutaxassislari va amaliyotchi fermerlar tajribalari hamda yangiliklari.
          </p>
        </div>

        {/* 3 ta Karta */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ARTICLES.map((a) => (
            <article
              key={a.id}
              className="group flex flex-col justify-between rounded-3xl bg-white p-5 border border-charcoal/10 shadow-xs transition-colors duration-200 hover:border-agroGreen hover:shadow-soft"
            >
              <div>
                {/* Rasm konteyneri */}
                <div className="relative h-52 w-full overflow-hidden rounded-2xl bg-cream-soft">
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

                {/* Metalar */}
                <div className="mt-4 flex items-center gap-3 text-[11px] font-semibold text-charcoal/50">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-agroGreen-700" /> {a.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-agroGreen-700" /> {a.readTime}
                  </span>
                </div>

                {/* Sarlavha */}
                <h3 className="mt-2 text-base font-extrabold text-charcoal leading-snug group-hover:text-forest-dark transition-colors line-clamp-2">
                  {a.title}
                </h3>
              </div>

              {/* Muallif va harakat */}
              <div className="mt-5 flex items-center justify-between border-t border-charcoal/10 pt-3 text-xs">
                <span className="font-semibold text-charcoal/70 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-agroGreen-700" /> {a.author}
                </span>
                <span className="font-black text-agroGreen-800 flex items-center gap-1 group-hover:underline">
                  O‘qish <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
