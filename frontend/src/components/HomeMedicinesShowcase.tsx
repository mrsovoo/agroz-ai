"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Pill, Search, Sprout, Syringe, Sparkles, Store, Filter } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { AUTH_BOT_URL } from "@/lib/constants";
import { apiUrl } from "@/lib/api-config";

export type ShowcaseMedicine = {
  id: number;
  name: string;
  type: string;
  price: number | null;
  usage: string | null;
  hasPhoto: boolean;
  photoVersion?: string | null;
  pharmacyId: number;
  pharmacyName: string;
  pharmacyPhone: string;
  pharmacyAddress: string;
  ratingAvg: number | null;
  ratingCount: number;
};

export default function HomeMedicinesShowcase({
  initialMedicines = [],
}: {
  initialMedicines?: ShowcaseMedicine[];
}) {
  const [filter, setFilter] = useState<"all" | "crop" | "animal">("all");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ShowcaseMedicine[]>(initialMedicines);
  const [loading, setLoading] = useState(false);

  // Client-side re-fetch: Mini App ochilinishida har doim yangi data olish
  useEffect(() => {
    setLoading(true);
    fetch(apiUrl("/api/medicines?limit=32"))
      .then((r) => r.json())
      .then((data: ShowcaseMedicine[]) => {
        if (Array.isArray(data) && data.length > 0) setItems(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Faqat real API dan kelgan ma'lumotlar — hardcode yo'q
  const allItems = items;


  const filtered = useMemo(() => {
    return allItems.filter((m) => {
      if (filter === "crop" && m.type !== "crop") return false;
      if (filter === "animal" && m.type !== "animal") return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchName = m.name.toLowerCase().includes(q);
        const matchUsage = (m.usage || "").toLowerCase().includes(q);
        const matchPh = m.pharmacyName.toLowerCase().includes(q);
        return matchName || matchUsage || matchPh;
      }
      return true;
    });
  }, [allItems, filter, query]);

  return (
    <section className="mt-7 web:mt-9">
      {/* Sarlavha va ko'proq havolasi */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--brand-green-soft)] text-[var(--brand-green)]">
              <Pill size={16} />
            </span>
            <h2 className="text-[20px] font-black tracking-tight text-neutral-900 web:text-[24px]">
              Dori vositalari katalogi
            </h2>
          </div>
          <p className="mt-0.5 text-[13px] text-neutral-500 font-medium">
            Sertifikatlangan dori vositalari, fungitsidlar, vaksinalar va o&apos;g&apos;itlar
          </p>
        </div>

        {allItems.length > 0 && (
          <Link
            href="/dorilar"
            className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-[var(--brand-green)] hover:underline self-start sm:self-auto"
          >
            <span>Barcha dorilar ({allItems.length})</span>
            <span>→</span>
          </Link>
        )}
      </div>

      {allItems.length > 0 && (
        <>
          {/* Filterlar va Qidiruv */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-[12.5px] sm:text-[13px] font-bold transition-all border ${
                  filter === "all"
                    ? "bg-[var(--brand-green)] text-white border-[var(--brand-green)] shadow-xs"
                    : "bg-white text-neutral-700 border-neutral-200/80 hover:bg-neutral-50"
                }`}
              >
                <Sparkles size={14} />
                <span className="truncate">Barchasi</span>
                <span className="text-[11px] opacity-80 hidden sm:inline">({allItems.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilter("crop")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-[12.5px] sm:text-[13px] font-bold transition-all border ${
                  filter === "crop"
                    ? "bg-[var(--brand-green)] text-white border-[var(--brand-green)] shadow-xs"
                    : "bg-white text-neutral-700 border-neutral-200/80 hover:bg-neutral-50"
                }`}
              >
                <Sprout size={14} />
                <span className="truncate">Ekinlar</span>
                <span className="text-[11px] opacity-80 hidden sm:inline">
                  ({allItems.filter((m) => m.type === "crop").length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilter("animal")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 text-[12.5px] sm:text-[13px] font-bold transition-all border ${
                  filter === "animal"
                    ? "bg-[var(--brand-green)] text-white border-[var(--brand-green)] shadow-xs"
                    : "bg-white text-neutral-700 border-neutral-200/80 hover:bg-neutral-50"
                }`}
              >
                <Syringe size={14} />
                <span className="truncate">Chorva</span>
                <span className="text-[11px] opacity-80 hidden sm:inline">
                  ({allItems.filter((m) => m.type === "animal").length})
                </span>
              </button>
            </div>

            <div className="relative w-full sm:max-w-[280px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Dori nomi yoki dorixona..."
                className="w-full rounded-xl border border-black/8 bg-white py-2 pl-9 pr-4 text-[13px] font-medium text-neutral-800 placeholder-neutral-400 shadow-2xs focus:border-[var(--brand-green)] focus:outline-none"
              />
            </div>
          </div>

          {/* Kartochkalar */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 web:grid-cols-4 web:gap-4.5">
            {filtered.slice(0, 12).map((m) => (
              <ProductCard
                key={m.id}
                medicine={{
                  id: m.id,
                  name: m.name,
                  price: m.price,
                  type: m.type,
                  hasPhoto: m.hasPhoto,
                  usage: m.usage,
                  status: "bor",
                }}
                pharmacy={{
                  id: m.pharmacyId,
                  name: m.pharmacyName,
                  phone: m.pharmacyPhone,
                  address: m.pharmacyAddress,
                  ratingAvg: m.ratingAvg,
                  ratingCount: m.ratingCount,
                }}
              />
            ))}
          </div>

          {/* Qidiruv bo'sh holat */}
          {filtered.length === 0 && query && (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-6 sm:p-8 text-center border border-black/5 shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 mb-2">
                <Search size={22} />
              </div>
              <p className="text-[16px] font-bold text-neutral-800">Dori vositasi topilmadi</p>
              <p className="text-[13px] text-neutral-500 mt-1 max-w-sm">
                Boshqa nom bilan qidirib ko&apos;ring yoki toifani o&apos;zgartiring
              </p>
              <button
                onClick={() => { setFilter("all"); setQuery(""); }}
                className="mt-4 rounded-xl bg-neutral-900 px-5 py-2.5 text-[12.5px] font-bold text-white hover:bg-neutral-800 active:scale-95 transition"
              >
                Filtrni tozalash
              </button>
            </div>
          )}

          {/* Barcha dorilarga o'tish */}
          <div className="mt-5">
            <Link href="/dorilar" className="block">
              <button className="ios-btn yellow flex w-full items-center justify-center gap-2 py-3.5 text-[15px] font-bold shadow-xs hover:brightness-105 active:scale-[0.99] transition">
                <Store size={18} />
                <span>Barcha dorilar katalogiga o&apos;tish ({allItems.length} ta dori)</span>
              </button>
            </Link>
          </div>
        </>
      )}

      {/* Bo'sh holat: hali hech qanday dorixona ro'yxatdan o'tmagan */}
      {allItems.length === 0 && (
        <div className="mt-4 flex flex-col items-center justify-center rounded-3xl bg-white p-6 sm:p-10 text-center border border-black/5 shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-green-soft)] text-[var(--brand-green)] mb-3">
            <Store size={28} />
          </div>
          <p className="text-[17px] font-bold text-[var(--brand-ink)]">
            Dorilar katalogi shakllantirilmoqda
          </p>
          <p className="text-[13px] text-neutral-600 mt-1.5 leading-relaxed max-w-sm">
            Hozircha dorilar ro&apos;yxatdan o&apos;tish jarayonida. Siz agro-dorixona egasimisiz?
            Dorilaringizni birinchilardan bo&apos;lib qo&apos;shing!
          </p>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
            <a
              href={AUTH_BOT_URL}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-green)] px-5 py-2.5 text-[13px] font-bold text-white shadow-xs hover:brightness-105 active:scale-95 transition"
            >
              <Sparkles size={16} />
              <span>Dorixonani qo&apos;shish</span>
            </a>
            <a
              href={AUTH_BOT_URL}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-[12px] font-semibold text-emerald-900 hover:bg-emerald-50/50 active:scale-95 transition"
            >
              <span>Ro&apos;yxatdan o&apos;tganmisiz? Botga kirish</span>
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
