import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpRight, Star } from 'lucide-react';
import { AgroImage } from './ui';
import { PRODUCTS } from '../data/content';

export const Products: React.FC = () => {
  const [filter, setFilter] = useState('Barchasi');
  const categories = ['Barchasi', 'Agro-Texnika', 'Yem va Ozuqa', "Urug'chilik"];

  const filtered =
    filter === 'Barchasi' ? PRODUCTS : PRODUCTS.filter((p) => p.category === filter);

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

        {/* 4 ta Mahsulot Kartasi (Referens 1:1) */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                <span className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-forest-dark shadow-sm transition group-hover:bg-agroGreen group-hover:scale-110">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>

              {/* Ma'lumotlar */}
              <div className="mt-4 flex flex-1 flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-charcoal/50">
                    <span>{p.category}</span>
                    <span className="flex items-center gap-1 font-bold text-charcoal">
                      <Star className="h-3.5 w-3.5 fill-amber text-amber" /> {p.rating}
                    </span>
                  </div>
                  <h3 className="mt-1.5 text-base font-black text-charcoal leading-snug group-hover:text-agroGreen-900 transition">
                    {p.name}
                  </h3>
                  <p className="mt-1 text-[11px] font-medium text-agroGreen-800 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-agroGreen" />
                    {p.stock}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-charcoal/5 pt-3">
                  <div>
                    <span className="text-[11px] text-charcoal/40 line-through mr-1.5">{p.oldPrice}</span>
                    <span className="text-base font-black text-forest-dark">{p.price}</span>
                  </div>
                  <a
                    href="#contact"
                    className="rounded-full bg-cream-soft hover:bg-agroGreen px-3.5 py-1.5 text-xs font-bold text-charcoal hover:text-forest-dark transition"
                  >
                    Xarid qilish
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
