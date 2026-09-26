"use client";

import { useMemo, useState } from "react";
import { Sprout, PawPrint, CalendarDays, ExternalLink, Newspaper, Inbox } from "lucide-react";

export type NewsItemDto = {
  id: string;
  title: string;
  link: string;
  source: string;
  tag: "Agro" | "Chorva";
  publishedAt: string;
  summary: string | null;
};

const FILTERS = [
  { v: "all", l: "Hammasi" },
  { v: "Agro", l: "Agro" },
  { v: "Chorva", l: "Chorvachilik" },
] as const;

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("uz-UZ", { day: "numeric", month: "long" });
}

export default function NewsList({ items }: { items: NewsItemDto[] }) {
  const [filter, setFilter] = useState<string>("all");

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((n) => n.tag === filter)),
    [items, filter],
  );

  const counts = useMemo(
    () => ({
      all: items.length,
      Agro: items.filter((n) => n.tag === "Agro").length,
      Chorva: items.filter((n) => n.tag === "Chorva").length,
    }),
    [items],
  );

  if (items.length === 0) {
    return (
      <div className="ios-card mt-3 px-5 py-7 text-center">
        <span
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "var(--brand-green-soft)", color: "var(--brand-green)" }}
        >
          <Inbox size={26} />
        </span>
        <p className="mt-3 text-[16px] font-black text-[var(--brand-ink)]">
          Yangiliklar vaqtincha yuklanmadi
        </p>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--brand-muted)]">
          Manbalar (Kun.uz, Gazeta.uz, EastFruit) javob bermayapti. Internet aloqasini tekshirib,
          sahifani yangilang — ob-havo maslahatlari esa ishlashda davom etadi.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const active = filter === f.v;
          return (
            <button
              key={f.v}
              onClick={() => setFilter(f.v)}
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold transition active:scale-95 ${
                active ? "text-white" : "bg-white text-[var(--brand-ink)] shadow-sm"
              }`}
              style={active ? { background: "var(--brand-green)" } : undefined}
            >
              {f.l}
              <span className={active ? "ml-1.5 opacity-80" : "ml-1.5 text-[var(--brand-muted)]"}>
                {counts[f.v]}
              </span>
            </button>
          );
        })}
      </div>

      <ul className="mt-3 space-y-3 web:grid web:grid-cols-2 web:gap-6 web:space-y-0">
        {visible.map((n) => {
          const isChorva = n.tag === "Chorva";
          const Tag = (
            <span
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
              style={{
                background: "#fff",
                color: isChorva ? "var(--brand-ink)" : "var(--brand-green)",
              }}
            >
              {isChorva ? <PawPrint size={12} /> : <Sprout size={12} />}
              {n.tag}
            </span>
          );

          const body = (
            <>
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{
                  background: isChorva ? "var(--brand-yellow-soft)" : "var(--brand-green-soft)",
                }}
              >
                {Tag}
                <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--brand-muted)]">
                  <CalendarDays size={11} />
                  {formatDate(n.publishedAt)}
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-[17px] font-black leading-tight text-[var(--brand-ink)]">
                  {n.title}
                </h3>
                {n.summary && (
                  <p className="mt-2 line-clamp-4 text-[14px] leading-[1.6] text-[var(--brand-ink)]/80">
                    {n.summary}
                  </p>
                )}
                <p className="mt-2.5 flex items-center gap-1.5 text-[12px] font-bold text-[var(--brand-muted)]">
                  <Newspaper size={12} /> {n.source}
                  {n.link && <ExternalLink size={11} className="text-[var(--brand-green)]" />}
                </p>
              </div>
            </>
          );

          return (
            <li key={n.id} className="ios-card overflow-hidden">
              {n.link ? (
                <a href={n.link} target="_blank" rel="noopener noreferrer" className="block">
                  {body}
                </a>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ul>

      {visible.length === 0 && (
        <p className="ios-card mt-3 p-5 text-center text-[14px] text-[var(--brand-muted)]">
          Bu turdagi yangilik hozircha yo&apos;q.
        </p>
      )}
    </div>
  );
}
