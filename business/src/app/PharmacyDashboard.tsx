"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileWarning,
  Package,
  Plus,
  Star,
  TrendingUp,
  Wallet,
} from "lucide-react";

export type DashOrder = {
  id: number;
  customerName: string;
  totalSum: number | null;
  status: string;
  createdAt: string;
  items: { id: number; name: string; qty: number; price: number | null }[];
};

export type DashMedicine = {
  id: number;
  name: string;
  stock: number;
  stockUnit: string;
  status: "bor" | "yoq" | "qoralama";
  photoData?: string | null;
  type: string;
};

/** Kam qolgan deb hisoblanadigan qoldiq chegarasi */
export const LOW_STOCK_THRESHOLD = 5;

const ACTIVE_STATUSES = new Set(["yangi", "tasdiqlandi", "tayyor"]);

function isCancelled(status: string) {
  return !ACTIVE_STATUSES.has(status) && status !== "yetkazildi";
}

/** Toshkent vaqti bo'yicha YYYY-MM-DD */
function tashkentDay(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(d);
}

function formatSum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)} mln`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} ming`;
  return String(n);
}

const WEEKDAYS = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];

const STATUS_PILL: Record<string, { text: string; cls: string }> = {
  yangi: { text: "Yangi", cls: "bg-amber-100 text-amber-800" },
  tasdiqlandi: { text: "Tasdiqlangan", cls: "bg-blue-100 text-blue-800" },
  tayyor: { text: "Tayyor", cls: "bg-purple-100 text-purple-800" },
  yetkazildi: { text: "Topshirildi", cls: "bg-emerald-100 text-emerald-800" },
};

export default function PharmacyDashboard({
  orders,
  medicines,
  rating,
  onOpenOrders,
  onOpenStock,
  onAddMedicine,
}: {
  orders: DashOrder[];
  medicines: DashMedicine[];
  rating?: { avg: number | null; count: number };
  onOpenOrders: (filter?: "all" | "yangi" | "tasdiqlandi" | "tayyor" | "yetkazildi") => void;
  onOpenStock: (filter?: "all" | "low" | "out" | "draft") => void;
  onAddMedicine: () => void;
}) {
  const stats = useMemo(() => {
    const now = new Date();
    const today = tashkentDay(now);
    const monthPrefix = today.slice(0, 7);

    let todayOrders = 0;
    let todayRevenue = 0;
    let monthRevenue = 0;
    let newCount = 0;
    let inProgress = 0;
    let delivered = 0;
    let cancelled = 0;

    // 7 kunlik grafik (bugun oxirida)
    const days: { key: string; label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      days.push({ key: tashkentDay(d), label: i === 0 ? "Bugun" : WEEKDAYS[d.getDay()], count: 0 });
    }
    const dayIndex = new Map(days.map((d, i) => [d.key, i]));

    const medSales = new Map<string, number>();

    for (const o of orders) {
      const day = tashkentDay(new Date(o.createdAt));
      const sum = o.totalSum ?? 0;

      if (o.status === "yangi") newCount++;
      if (o.status === "tasdiqlandi" || o.status === "tayyor") inProgress++;
      if (o.status === "yetkazildi") delivered++;
      if (isCancelled(o.status)) cancelled++;

      if (!isCancelled(o.status)) {
        if (day === today) todayOrders++;
        const idx = dayIndex.get(day);
        if (idx !== undefined) days[idx].count++;
        for (const it of o.items || []) {
          medSales.set(it.name, (medSales.get(it.name) ?? 0) + (it.qty || 0));
        }
      }

      if (o.status === "yetkazildi") {
        if (day === today) todayRevenue += sum;
        if (day.startsWith(monthPrefix)) monthRevenue += sum;
      }
    }

    const closed = delivered + cancelled;
    const successRate = closed > 0 ? Math.round((delivered / closed) * 100) : null;

    const topMeds = Array.from(medSales.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const maxDay = Math.max(1, ...days.map((d) => d.count));

    return {
      todayOrders,
      todayRevenue,
      monthRevenue,
      newCount,
      inProgress,
      successRate,
      days,
      maxDay,
      topMeds,
    };
  }, [orders]);

  const stock = useMemo(() => {
    const total = medicines.length;
    const draft = medicines.filter((m) => m.status === "qoralama").length;
    const out = medicines.filter((m) => m.status === "yoq" || (m.status === "bor" && m.stock <= 0)).length;
    const low = medicines.filter(
      (m) => m.status === "bor" && m.stock > 0 && m.stock <= LOW_STOCK_THRESHOLD,
    ).length;
    const ok = Math.max(0, total - draft - out - low);
    const lowList = medicines
      .filter((m) => m.status === "bor" && m.stock <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 3);
    return { total, draft, out, low, ok, lowList };
  }, [medicines]);

  const recent = orders.slice(0, 3);
  const pct = (n: number) => (stock.total > 0 ? `${(n / stock.total) * 100}%` : "0%");

  return (
    <div className="px-4 space-y-3">
      {/* 1. Diqqat talab qiladigan ishlar — eng muhimi tepada */}
      {(stats.newCount > 0 || stock.out > 0 || stock.draft > 0) && (
        <div className="space-y-2">
          {stats.newCount > 0 && (
            <button
              type="button"
              onClick={() => onOpenOrders("yangi")}
              className="w-full flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-left active:scale-[0.99] transition"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
                <Package size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-amber-950">{stats.newCount} ta yangi bron javob kutmoqda</p>
                <p className="text-[11px] text-amber-800">Tez javob — ko&apos;proq mijoz</p>
              </div>
              <ChevronRight size={16} className="text-amber-700 shrink-0" />
            </button>
          )}
          {stock.out > 0 && (
            <button
              type="button"
              onClick={() => onOpenStock("out")}
              className="w-full flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-left active:scale-[0.99] transition"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white">
                <AlertTriangle size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-red-950">{stock.out} ta dori tugagan</p>
                <p className="text-[11px] text-red-800">Qoldiqni yangilang — mijozlar bron qila olmaydi</p>
              </div>
              <ChevronRight size={16} className="text-red-700 shrink-0" />
            </button>
          )}
          {stock.draft > 0 && (
            <button
              type="button"
              onClick={() => onOpenStock("draft")}
              className="w-full flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 text-left active:scale-[0.99] transition"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-white">
                <FileWarning size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-zinc-900">{stock.draft} ta dori qoralamada</p>
                <p className="text-[11px] text-zinc-500">Narx yoki rasm yo&apos;q — mijozlarga ko&apos;rinmaydi</p>
              </div>
              <ChevronRight size={16} className="text-zinc-500 shrink-0" />
            </button>
          )}
        </div>
      )}

      {/* 2. Asosiy ko'rsatkichlar */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-emerald-600 p-3.5 text-white shadow-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-100">
            <Wallet size={13} /> Bugungi tushum
          </div>
          <p className="mt-1 text-xl font-black tracking-tight">
            {formatSum(stats.todayRevenue)} <span className="text-xs font-bold text-emerald-100">so&apos;m</span>
          </p>
          <p className="text-[10px] text-emerald-100/90">Oy bo&apos;yicha: {formatSum(stats.monthRevenue)} so&apos;m</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500">
            <TrendingUp size={13} /> Bugungi bronlar
          </div>
          <p className="mt-1 text-xl font-black tracking-tight text-zinc-900">{stats.todayOrders}</p>
          <p className="text-[10px] text-zinc-500">
            {stats.successRate !== null ? `Muvaffaqiyat: ${stats.successRate}%` : "Hali yakunlangan bron yo'q"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenOrders("tasdiqlandi")}
          className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-xs text-left active:scale-[0.98] transition"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500">
            <Clock size={13} /> Jarayonda
          </div>
          <p className="mt-1 text-xl font-black tracking-tight text-zinc-900">{stats.inProgress}</p>
          <p className="text-[10px] text-zinc-500">Tasdiqlangan va tayyor</p>
        </button>
        <button
          type="button"
          onClick={() => onOpenStock("all")}
          className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-xs text-left active:scale-[0.98] transition"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500">
            <Boxes size={13} /> Mavjud dorilar
          </div>
          <p className="mt-1 text-xl font-black tracking-tight text-zinc-900">
            {stock.ok + stock.low}
            <span className="text-xs font-bold text-zinc-400"> / {stock.total}</span>
          </p>
          <p className="text-[10px] text-zinc-500">Sotuvda bor</p>
        </button>
      </div>

      {/* 3. 7 kunlik bronlar grafigi */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black text-zinc-900">So&apos;nggi 7 kun bronlari</span>
          <span className="text-[11px] font-bold text-zinc-400">
            Jami: {stats.days.reduce((s, d) => s + d.count, 0)}
          </span>
        </div>
        <div className="flex items-end gap-1.5 h-24">
          {stats.days.map((d, i) => {
            const isToday = i === stats.days.length - 1;
            const h = d.count === 0 ? 4 : Math.max(10, (d.count / stats.maxDay) * 100);
            return (
              <div key={d.key} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                <span className="text-[10px] font-bold text-zinc-600">{d.count || ""}</span>
                <div
                  className={`w-full rounded-md ${isToday ? "bg-emerald-600" : d.count ? "bg-emerald-200" : "bg-zinc-100"}`}
                  style={{ height: `${h}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex gap-1.5 mt-1.5">
          {stats.days.map((d, i) => (
            <span
              key={d.key}
              className={`flex-1 text-center text-[9px] font-bold ${i === stats.days.length - 1 ? "text-emerald-700" : "text-zinc-400"}`}
            >
              {d.label}
            </span>
          ))}
        </div>
      </div>

      {/* 4. Ombor holati */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-zinc-900">Ombor holati</span>
          <button
            type="button"
            onClick={() => onOpenStock("all")}
            className="text-[11px] font-bold text-emerald-700 flex items-center"
          >
            Qoldiq <ChevronRight size={13} />
          </button>
        </div>

        {stock.total === 0 ? (
          <button
            type="button"
            onClick={onAddMedicine}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/60 py-4 text-xs font-bold text-emerald-800"
          >
            <Plus size={15} /> Birinchi dorini qo&apos;shing
          </button>
        ) : (
          <>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
              <div className="bg-emerald-500" style={{ width: pct(stock.ok) }} />
              <div className="bg-amber-400" style={{ width: pct(stock.low) }} />
              <div className="bg-red-500" style={{ width: pct(stock.out) }} />
              <div className="bg-zinc-400" style={{ width: pct(stock.draft) }} />
            </div>
            <div className="grid grid-cols-4 gap-1 text-center">
              {[
                { label: "Yetarli", n: stock.ok, dot: "bg-emerald-500", f: "all" as const },
                { label: "Kam qolgan", n: stock.low, dot: "bg-amber-400", f: "low" as const },
                { label: "Tugagan", n: stock.out, dot: "bg-red-500", f: "out" as const },
                { label: "Qoralama", n: stock.draft, dot: "bg-zinc-400", f: "draft" as const },
              ].map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => onOpenStock(s.f)}
                  className="rounded-xl py-1.5 hover:bg-zinc-50 active:scale-95 transition"
                >
                  <p className="text-base font-black text-zinc-900">{s.n}</p>
                  <p className="flex items-center justify-center gap-1 text-[9px] font-bold text-zinc-500">
                    <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </p>
                </button>
              ))}
            </div>

            {stock.lowList.length > 0 && (
              <div className="rounded-xl bg-amber-50/70 border border-amber-100 divide-y divide-amber-100">
                {stock.lowList.map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2 text-xs">
                    <span className="font-bold text-zinc-800 truncate">{m.name}</span>
                    <span className={`font-mono font-black shrink-0 ${m.stock <= 0 ? "text-red-600" : "text-amber-700"}`}>
                      {m.stock} {m.stockUnit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* 5. Eng ko'p so'ralgan dorilar */}
      {stats.topMeds.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-black text-zinc-900 block mb-2">Eng ko&apos;p so&apos;ralgan dorilar</span>
          <div className="space-y-2">
            {stats.topMeds.map(([name, qty], i) => {
              const max = stats.topMeds[0][1] || 1;
              return (
                <div key={name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-zinc-800 truncate">
                      <span className="text-zinc-400 font-mono mr-1">{i + 1}.</span>
                      {name}
                    </span>
                    <span className="font-mono font-bold text-zinc-600 shrink-0">{qty} ta</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(qty / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. So'nggi bronlar */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black text-zinc-900">So&apos;nggi bronlar</span>
          <button
            type="button"
            onClick={() => onOpenOrders("all")}
            className="text-[11px] font-bold text-emerald-700 flex items-center"
          >
            Barchasi <ChevronRight size={13} />
          </button>
        </div>
        {recent.length === 0 ? (
          <p className="py-4 text-center text-xs text-zinc-400">Hozircha bron yo&apos;q</p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {recent.map((o) => {
              const pill = STATUS_PILL[o.status] ?? { text: "Bekor", cls: "bg-red-100 text-red-700" };
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onOpenOrders("all")}
                  className="w-full flex items-center justify-between gap-2 py-2.5 text-left"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 truncate">{o.customerName}</p>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      #{o.id} ·{" "}
                      {new Date(o.createdAt).toLocaleString("uz-UZ", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {o.totalSum ? (
                      <span className="text-[11px] font-mono font-bold text-zinc-700">{formatSum(o.totalSum)}</span>
                    ) : null}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${pill.cls}`}>{pill.text}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. Reyting */}
      {rating && rating.count > 0 && rating.avg !== null && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Star size={18} fill="currentColor" />
          </div>
          <div>
            <p className="text-sm font-black text-zinc-900">{rating.avg.toFixed(1)} / 5</p>
            <p className="text-[11px] text-zinc-500">{rating.count} ta mijoz baholadi</p>
          </div>
          <CheckCircle2 size={16} className="ml-auto text-emerald-600" />
        </div>
      )}
    </div>
  );
}
