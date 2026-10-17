"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Boxes,
  ChevronRight,
  Package,
  Plus,
  Wallet,
  HandCoins,
  ArrowUpRight,
  ShoppingCart,
  Download,
  Calendar,
} from "lucide-react";
import { DualLineChart, DonutChart, SeriesPoint } from "@/components/charts";
import { shortDay } from "@/lib/format";
import { fetchPartnerDebtsFromServer } from "@/components/QarzDaftariSection";

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
  batchNo?: string | null;
  expiryDate?: string | null;
};

export const LOW_STOCK_THRESHOLD = 5;

const ACTIVE_STATUSES = new Set(["yangi", "tasdiqlandi", "tayyor"]);

function isCancelled(status: string) {
  return !ACTIVE_STATUSES.has(status) && status !== "yetkazildi";
}

function tashkentDay(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(d);
}

function formatSum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

const STATUS_BADGE: Record<string, { text: string; cls: string }> = {
  yangi: { text: "Yangi", cls: "bg-black/5 text-[#1d1d1f]" },
  tasdiqlandi: { text: "Tasdiqlangan", cls: "bg-black/5 text-[#1d1d1f]" },
  tayyor: { text: "Tayyor", cls: "bg-black/5 text-[#1d1d1f]" },
  yetkazildi: { text: "Topshirildi", cls: "bg-black text-white" },
};

export default function PharmacyDashboard({
  partnerId,
  orders,
  medicines,
  onOpenOrders,
  onOpenStock,
  onAddMedicine,
  onOpenDebts,
  onOpenPos,
  onExportReport,
}: {
  partnerId?: number | string | null;
  orders: DashOrder[];
  medicines: DashMedicine[];
  rating?: { avg: number | null; count: number };
  onOpenOrders: (filter?: "all" | "yangi" | "tasdiqlandi" | "tayyor" | "yetkazildi") => void;
  onOpenStock: (filter?: "all" | "low" | "out" | "draft") => void;
  onAddMedicine: () => void;
  onOpenDebts?: () => void;
  onOpenPos?: () => void;
  onExportReport?: () => void;
}) {
  const [debtTotals, setDebtTotals] = useState({ customerDebt: 0, supplierDebt: 0 });

  useEffect(() => {
    const computeDebts = async () => {
      const list = await fetchPartnerDebtsFromServer();
      let customerDebt = 0;
      let supplierDebt = 0;
      for (const d of list) {
        if (d.kind === "mijoz") customerDebt += d.balance || 0;
        else if (d.kind === "taminotchi") supplierDebt += d.balance || 0;
      }
      setDebtTotals({ customerDebt, supplierDebt });
    };
    computeDebts();
    window.addEventListener("agroz_debts_updated", computeDebts);
    return () => window.removeEventListener("agroz_debts_updated", computeDebts);
  }, [partnerId]);

  const stats = useMemo(() => {
    const now = new Date();
    const today = tashkentDay(now);

    let todayOrders = 0;
    let todayRevenue = 0;
    let newCount = 0;
    let inProgress = 0;

    const days14: { key: string; label: string; sales: number; completed: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = tashkentDay(d);
      const parts = key.split("-");
      const short = `${parts[2]}/${parts[1]}`;
      days14.push({ key, label: short, sales: 0, completed: 0 });
    }
    const dayIndex = new Map(days14.map((d, i) => [d.key, i]));

    for (const o of orders) {
      const day = tashkentDay(new Date(o.createdAt));
      const sum = o.totalSum ?? 0;

      if (o.status === "yangi") newCount++;
      if (o.status === "tasdiqlandi" || o.status === "tayyor") inProgress++;

      if (!isCancelled(o.status)) {
        if (day === today) todayOrders++;
        const idx = dayIndex.get(day);
        if (idx !== undefined) {
          days14[idx].sales += sum;
        }
      }

      if (o.status === "yetkazildi") {
        if (day === today) todayRevenue += sum;
        const idx = dayIndex.get(day);
        if (idx !== undefined) {
          days14[idx].completed += sum;
        }
      }
    }

    const chartSeries: SeriesPoint[] = days14.map((d) => ({
      label: d.label,
      a: d.completed,
      b: d.sales,
    }));

    return {
      todayOrders,
      todayRevenue,
      newCount,
      inProgress,
      chartSeries,
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
      .slice(0, 4);

    const donutData = [
      { label: "Mavjud", value: ok || (total === 0 ? 1 : 0), color: "#1d1d1f" },
      { label: "Kam qolgan", value: low, color: "#86868b" },
      { label: "Tugagan", value: out, color: "#d2d2d7" },
    ].filter((d) => d.value > 0);

    return { total, draft, out, low, ok, lowList, donutData };
  }, [medicines]);

  // Haqiqiy yaroqlilik muddati kiritilgan mahsulotlar
  const expiringBatches = useMemo(() => {
    const nowMs = new Date().getTime();
    return medicines
      .filter((m) => Boolean(m.expiryDate))
      .map((m) => {
        const expMs = new Date(m.expiryDate as string).getTime();
        const daysLeft = Math.ceil((expMs - nowMs) / (1000 * 60 * 60 * 24));
        return {
          id: m.id,
          name: m.name,
          batchNo: m.batchNo || `P-${m.id}`,
          expiry: m.expiryDate as string,
          daysLeft,
          qty: m.stock,
          unit: m.stockUnit,
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 4);
  }, [medicines]);

  const recent = orders.slice(0, 5);

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 py-2">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">Dashboard</h1>
          <p className="text-xs text-[#86868b] mt-0.5">Kassa savdosi, ombor va mijozlar hisobi</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onOpenPos && (
            <button
              type="button"
              onClick={onOpenPos}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 text-white px-4 py-2 text-xs font-semibold hover:bg-emerald-700 transition active:scale-95 shadow-xs"
            >
              <ShoppingCart size={14} />
              <span>Tezkor Kassa (Sotuv)</span>
            </button>
          )}
          <button
            type="button"
            onClick={onAddMedicine}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1d1d1f] text-white px-4 py-2 text-xs font-medium hover:bg-black transition active:scale-95"
          >
            <Plus size={14} />
            <span>Mahsulot qo&apos;shish</span>
          </button>
          <button
            type="button"
            onClick={onOpenDebts}
            className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#e5e5ea] text-[#1d1d1f] px-4 py-2 text-xs font-medium hover:bg-[#f5f5f7] transition active:scale-95"
          >
            <HandCoins size={14} />
            <span>Qarz daftari</span>
          </button>
          {onExportReport && (
            <button
              type="button"
              onClick={onExportReport}
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#e5e5ea] text-[#1d1d1f] px-3.5 py-2 text-xs font-medium hover:bg-[#f5f5f7] transition active:scale-95"
              title="Savdo va buyurtmalar hisobotini yuklab olish"
            >
              <Download size={14} />
              <span>Hisobot (.csv)</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Apple Style Minimalist Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Savdo */}
        <div className="rounded-2xl border border-[#e5e5ea] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#86868b]">
            <span>Bugungi savdo</span>
            <Wallet size={15} />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-semibold tracking-tight text-[#1d1d1f] font-mono">
              {formatSum(stats.todayRevenue)}
            </span>
            <span className="text-xs text-[#86868b] ml-1">so&apos;m</span>
          </div>
        </div>

        {/* Nasiya */}
        <button
          type="button"
          onClick={onOpenDebts}
          className="rounded-2xl border border-[#e5e5ea] bg-white p-5 text-left shadow-xs hover:border-[#1d1d1f] transition group"
        >
          <div className="flex items-center justify-between text-xs text-[#86868b]">
            <span>Mijozlar qarzi</span>
            <ArrowUpRight size={14} className="opacity-40 group-hover:opacity-100 transition" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-semibold tracking-tight text-[#1d1d1f] font-mono">
              {formatSum(debtTotals.customerDebt)}
            </span>
            <span className="text-xs text-[#86868b] ml-1">so&apos;m</span>
          </div>
        </button>

        {/* Ta'minotchi */}
        <button
          type="button"
          onClick={onOpenDebts}
          className="rounded-2xl border border-[#e5e5ea] bg-white p-5 text-left shadow-xs hover:border-[#1d1d1f] transition group"
        >
          <div className="flex items-center justify-between text-xs text-[#86868b]">
            <span>Ta&apos;minotchiga qarz</span>
            <ArrowUpRight size={14} className="opacity-40 group-hover:opacity-100 transition" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-semibold tracking-tight text-[#1d1d1f] font-mono">
              {formatSum(debtTotals.supplierDebt)}
            </span>
            <span className="text-xs text-[#86868b] ml-1">so&apos;m</span>
          </div>
        </button>

        {/* Ombor */}
        <button
          type="button"
          onClick={() => onOpenStock("all")}
          className="rounded-2xl border border-[#e5e5ea] bg-white p-5 text-left shadow-xs hover:border-[#1d1d1f] transition group"
        >
          <div className="flex items-center justify-between text-xs text-[#86868b]">
            <span>Ombor qoldig&apos;i</span>
            <Boxes size={15} />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-semibold tracking-tight text-[#1d1d1f] font-mono">
              {stock.ok + stock.low}
            </span>
            <span className="text-xs text-[#86868b] ml-1">/ {stock.total} ta</span>
          </div>
        </button>
      </div>

      {/* 3. Savdo Dinamikasi Grafigi */}
      <div className="rounded-2xl border border-[#e5e5ea] bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#f5f5f7]">
          <div>
            <h2 className="text-sm font-semibold text-[#1d1d1f]">Savdo dinamikasi</h2>
            <p className="text-xs text-[#86868b]">Oxirgi 14 kunlik real sotuv va buyurtmalar</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#86868b]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#1d1d1f]" /> Yakunlangan savdo
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#d2d2d7]" /> Jami buyurtmalar
            </span>
          </div>
        </div>
        <DualLineChart data={stats.chartSeries} aLabel="Savdo" bLabel="Buyurtma" height={200} />
      </div>

      {/* 4. Ikki ustun: So'nggi buyurtmalar & Ombor / Partiyalar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* So'nggi buyurtmalar */}
        <div className="lg:col-span-2 rounded-2xl border border-[#e5e5ea] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#f5f5f7]">
            <h2 className="text-sm font-semibold text-[#1d1d1f]">So&apos;nggi buyurtmalar va kassa sotuvi</h2>
            <button
              type="button"
              onClick={() => onOpenOrders("all")}
              className="text-xs text-[#86868b] hover:text-[#1d1d1f] flex items-center gap-0.5 transition"
            >
              <span>Barchasi</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {recent.length === 0 ? (
            <div className="py-12 text-center text-[#86868b]">
              <Package size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Hozircha yangi buyurtmalar yo&apos;q</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f5f5f7]">
              {recent.map((o) => {
                const badge = STATUS_BADGE[o.status] ?? { text: o.status, cls: "bg-black/5 text-[#1d1d1f]" };
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => onOpenOrders("all")}
                    className="w-full flex items-center justify-between py-3 text-left hover:bg-[#fbfbfd] px-2 rounded-xl transition group"
                  >
                    <div>
                      <div className="text-xs font-medium text-[#1d1d1f] group-hover:text-black">
                        {o.customerName}
                      </div>
                      <div className="text-[10px] text-[#86868b] font-mono mt-0.5">
                        #{o.id} · {new Date(o.createdAt).toLocaleDateString("uz-UZ")}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {o.totalSum ? (
                        <span className="text-xs font-mono font-medium text-[#1d1d1f]">
                          {formatSum(o.totalSum)} so&apos;m
                        </span>
                      ) : null}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}>
                        {badge.text}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Ombor tarkibi & Muddati yaqin partiyalar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#e5e5ea] bg-white p-6 shadow-xs">
            <h2 className="text-sm font-semibold text-[#1d1d1f] mb-4 pb-3 border-b border-[#f5f5f7]">
              Ombor holati
            </h2>
            <DonutChart
              data={stock.donutData}
              centerValue={`${stock.total}`}
              centerLabel="mahsulot"
            />
          </div>

          <div className="rounded-2xl border border-[#e5e5ea] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#f5f5f7]">
              <h2 className="text-sm font-semibold text-[#1d1d1f]">Muddati nazorati</h2>
              <span className="text-[10px] text-[#86868b]">Partiyalar</span>
            </div>
            {expiringBatches.length === 0 ? (
              <div className="py-4 text-center text-[#86868b] space-y-2">
                <Calendar size={22} className="mx-auto opacity-30" />
                <p className="text-[11px] leading-relaxed">
                  Yaroqlilik muddati kiritilgan partiyalar yo&apos;q. Omborda mahsulot qo&apos;shish yoki tahrirlashda muddatni belgilang.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#f5f5f7]">
                {expiringBatches.map((b) => (
                  <div key={b.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-medium text-[#1d1d1f]">{b.name}</div>
                      <div className="text-[10px] text-[#86868b]">
                        №{b.batchNo} · {shortDay(b.expiry)}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        b.daysLeft <= 30
                          ? "bg-red-50 text-red-700 font-semibold"
                          : "bg-[#f5f5f7] text-[#86868b]"
                      }`}
                    >
                      {b.daysLeft <= 0 ? "Muddati o'tgan" : `${b.daysLeft} kun`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
