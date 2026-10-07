"use client";

import { useMemo } from "react";
import {
  PhoneCall,
  CheckCircle2,
  Clock,
  Car,
  Star,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  MapPin,
  User,
  AlertCircle,
  XCircle,
  Phone,
  Power,
  Sparkles,
} from "lucide-react";
import { haptic } from "@/lib/telegram";

export type DashPartnerCall = {
  id: number;
  specialistId: number;
  customerName: string;
  customerPhone: string | null;
  problem: string;
  address: string | null;
  status: string;
  createdAt: string;
};

export type DashPartnerProfile = {
  id: number;
  name: string;
  role: "pharmacy" | "specialist";
  specialty?: string | null;
  phone: string;
  address?: string | null;
  workHours?: string | null;
  experienceYears?: number | null;
  bio?: string | null;
  rating?: { avg: number | null; count: number };
  isBusy: boolean;
};

/** Toshkent vaqti bo'yicha YYYY-MM-DD */
function tashkentDay(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(d);
}

const WEEKDAYS = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];

export default function SpecialistDashboard({
  partner,
  calls,
  isBusy,
  onToggleBusy,
  onGoCalls,
  onCallAction,
  actionBusyId,
}: {
  partner: DashPartnerProfile;
  calls: DashPartnerCall[];
  isBusy: boolean;
  onToggleBusy: () => Promise<void>;
  onGoCalls: (filter?: "all" | "yangi" | "qabul_qilindi" | "bajarildi") => void;
  onCallAction: (callId: number, action: "accept" | "reject" | "done") => Promise<void>;
  actionBusyId?: number | null;
}) {
  const stats = useMemo(() => {
    const now = new Date();
    const today = tashkentDay(now);

    let todayCalls = 0;
    let pendingCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let rejectedCount = 0;

    // 7 kunlik faollik grafigi
    const days: { key: string; label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      days.push({ key: tashkentDay(d), label: i === 0 ? "Bugun" : WEEKDAYS[d.getDay()], count: 0 });
    }
    const dayIndex = new Map(days.map((d, i) => [d.key, i]));

    for (const c of calls) {
      if (c.status === "yangi") pendingCount++;
      else if (c.status === "qabul_qilindi") inProgressCount++;
      else if (c.status === "bajarildi") completedCount++;
      else if (c.status === "bekor") rejectedCount++;

      const cDay = tashkentDay(new Date(c.createdAt));
      if (cDay === today) {
        todayCalls++;
      }
      const idx = dayIndex.get(cDay);
      if (idx !== undefined && c.status !== "bekor") {
        days[idx].count++;
      }
    }

    const maxDayCount = Math.max(1, ...days.map((d) => d.count));

    return {
      total: calls.length,
      todayCalls,
      pendingCount,
      inProgressCount,
      completedCount,
      rejectedCount,
      days,
      maxDayCount,
    };
  }, [calls]);

  const urgentPendingCalls = useMemo(() => {
    return calls.filter((c) => c.status === "yangi").slice(0, 3);
  }, [calls]);

  const activeCalls = useMemo(() => {
    return calls.filter((c) => c.status === "qabul_qilindi").slice(0, 3);
  }, [calls]);

  const isVet = Boolean(
    partner.specialty && /veterinar|chorva|parranda|hayvon/i.test(partner.specialty)
  );

  return (
    <div className="space-y-4 px-4 pb-20 animate-in fade-in duration-150">
      {/* 1. Xush kelibsiz va Mutaxassis nishoni */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl">
              {isVet ? "🐾" : "🌱"}
            </span>
            <h2 className="text-lg font-black tracking-tight text-zinc-900">
              {partner.name}
            </h2>
          </div>
          <p className="text-xs font-semibold text-zinc-500 mt-0.5">
            {partner.specialty || (isVet ? "Veterinar shifokor" : "Agronom maslahatchi")}
            {partner.experienceYears ? ` · ${partner.experienceYears} yil staj` : ""}
          </p>
        </div>

        {/* Reyting ko'rsatkichi */}
        <div className="flex flex-col items-end">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-800 border border-amber-200/90 shadow-2xs">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span>{partner.rating?.avg ? partner.rating.avg.toFixed(1) : "5.0"}</span>
          </span>
          <span className="text-[10px] text-zinc-400 font-semibold mt-0.5">
            {partner.rating?.count ? `${partner.rating.count} ta baho` : "Yangi mutaxassis"}
          </span>
        </div>
      </div>

      {/* 2. Jonli Bandlik Boshqaruv Qutisi (Live Availability Switcher) */}
      <div
        className={`rounded-2xl border p-4 shadow-xs transition-all ${
          isBusy
            ? "bg-gradient-to-br from-red-50/90 via-rose-50/60 to-white border-red-200"
            : "bg-gradient-to-br from-emerald-50/90 via-green-50/60 to-white border-emerald-200"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                    isBusy ? "bg-red-400" : "bg-emerald-400"
                  }`}
                />
                <span
                  className={`relative inline-flex h-3 w-3 rounded-full ${
                    isBusy ? "bg-red-600" : "bg-emerald-600"
                  }`}
                />
              </span>
              <h3 className="text-sm font-black text-zinc-900">
                {isBusy ? "Hozirda bandman (Chaqiruvda)" : "Qabulga tayyorman (Bo'sh)"}
              </h3>
            </div>
            <p className="text-[12px] text-zinc-600 font-medium mt-1 leading-snug">
              {isBusy
                ? "Asosiy sahifada profilingiz 'Hozirda chaqiruvda' holatida va band ekaningiz ko'rinadi."
                : "Fermerlar va mijozlar sizni xaritada va asosiy sahifada yashil holatda ko'rishmoqda va bemalol chaqira olishadi."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              haptic("medium");
              onToggleBusy();
            }}
            className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-xs active:scale-95 transition ${
              isBusy
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            <Power size={13} />
            <span>{isBusy ? "Bo'shatish" : "Band qilish"}</span>
          </button>
        </div>
      </div>

      {/* 3. 4 ta asosiy Tahliliy Ko'rsatkich (KPI Cards) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Yangi so'rovlar */}
        <button
          type="button"
          onClick={() => {
            haptic("light");
            onGoCalls("yangi");
          }}
          className={`flex flex-col justify-between rounded-2xl border p-3.5 text-left transition hover:shadow-xs active:scale-[0.98] ${
            stats.pendingCount > 0
              ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/30"
              : "bg-white border-zinc-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold text-zinc-500">Yangi so&apos;rovlar</span>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-xl ${
                stats.pendingCount > 0 ? "bg-amber-500 text-white" : "bg-zinc-100 text-zinc-500"
              }`}
            >
              <PhoneCall size={14} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-black ${
                stats.pendingCount > 0 ? "text-amber-700" : "text-zinc-900"
              }`}
            >
              {stats.pendingCount}
            </span>
            <span className="text-[11px] font-bold text-zinc-400">ta</span>
            {stats.pendingCount > 0 && (
              <span className="ml-auto rounded-full bg-amber-200/80 px-2 py-0.5 text-[9.5px] font-extrabold text-amber-900 animate-pulse">
                Kutilmoqda
              </span>
            )}
          </div>
        </button>

        {/* Jarayondagi faol chaqiruvlar */}
        <button
          type="button"
          onClick={() => {
            haptic("light");
            onGoCalls("qabul_qilindi");
          }}
          className={`flex flex-col justify-between rounded-2xl border p-3.5 text-left transition hover:shadow-xs active:scale-[0.98] ${
            stats.inProgressCount > 0
              ? "bg-blue-50/80 border-blue-300 ring-2 ring-blue-400/30"
              : "bg-white border-zinc-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold text-zinc-500">Jarayonda (Yo&apos;lda)</span>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-xl ${
                stats.inProgressCount > 0 ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-500"
              }`}
            >
              <Car size={14} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-black ${
                stats.inProgressCount > 0 ? "text-blue-700" : "text-zinc-900"
              }`}
            >
              {stats.inProgressCount}
            </span>
            <span className="text-[11px] font-bold text-zinc-400">ta</span>
            {stats.inProgressCount > 0 && (
              <span className="ml-auto rounded-full bg-blue-200/80 px-2 py-0.5 text-[9.5px] font-extrabold text-blue-900">
                Faol
              </span>
            )}
          </div>
        </button>

        {/* Muvaffaqiyatli yakunlangan */}
        <button
          type="button"
          onClick={() => {
            haptic("light");
            onGoCalls("bajarildi");
          }}
          className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-3.5 text-left transition hover:shadow-xs active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold text-zinc-500">Yakunlangan</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={14} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-zinc-900">{stats.completedCount}</span>
            <span className="text-[11px] font-bold text-zinc-400">ta</span>
            <span className="ml-auto text-[10px] font-bold text-emerald-600">Yordam berildi</span>
          </div>
        </button>

        {/* Bugungi jami chaqiruvlar */}
        <button
          type="button"
          onClick={() => {
            haptic("light");
            onGoCalls("all");
          }}
          className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-3.5 text-left transition hover:shadow-xs active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold text-zinc-500">Bugungi chaqiruvlar</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <TrendingUp size={14} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-zinc-900">{stats.todayCalls}</span>
            <span className="text-[11px] font-bold text-zinc-400">ta</span>
            <span className="ml-auto text-[10px] font-bold text-zinc-400">Jami: {stats.total}</span>
          </div>
        </button>
      </div>

      {/* 4. Shoshilinch Yangi Chaqiruvlar (Agar mavjud bo'lsa darhol aks etadi) */}
      {urgentPendingCalls.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-900">
                Kutilayotgan so&apos;rovlar ({urgentPendingCalls.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onGoCalls("yangi")}
              className="text-[11px] font-bold text-amber-800 hover:underline"
            >
              Barchasi →
            </button>
          </div>

          <div className="space-y-2.5">
            {urgentPendingCalls.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-amber-200/80 bg-white p-3 shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-black text-zinc-900">#{c.id}</span>
                    <span className="text-xs font-extrabold text-zinc-800">· {c.customerName}</span>
                  </div>
                  <span className="text-[10.5px] font-mono text-zinc-400">
                    {new Date(c.createdAt).toLocaleTimeString("uz-UZ", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <p className="text-xs text-zinc-700 bg-amber-50/80 rounded-lg p-2 font-medium line-clamp-2">
                  {c.problem}
                </p>

                {c.address && (
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 truncate">
                    <MapPin size={12} className="shrink-0 text-zinc-400" />
                    <span className="truncate">{c.address}</span>
                  </div>
                )}

                {/* 1-Tap Qabul qilish va Rad etish tugmalari */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={actionBusyId === c.id}
                    onClick={() => onCallAction(c.id, "accept")}
                    className="flex-1 rounded-xl bg-emerald-600 py-2 text-center text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50"
                  >
                    ✓ Qabul qilish (Boraman)
                  </button>
                  <button
                    type="button"
                    disabled={actionBusyId === c.id}
                    onClick={() => onCallAction(c.id, "reject")}
                    className="rounded-xl bg-zinc-100 px-3 py-2 text-center text-xs font-bold text-red-600 hover:bg-red-50 active:scale-95 transition disabled:opacity-50"
                  >
                    Rad etish
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Faol Jarayondagi Chaqiruvlar (Borilayotgan / Yordam berilayotgan) */}
      {activeCalls.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car size={16} className="text-blue-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-blue-900">
                Hozirgi faol chaqiruvlar ({activeCalls.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onGoCalls("qabul_qilindi")}
              className="text-[11px] font-bold text-blue-800 hover:underline"
            >
              Barchasi →
            </button>
          </div>

          <div className="space-y-2.5">
            {activeCalls.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-blue-200/80 bg-white p-3 shadow-2xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-zinc-900">
                    #{c.id} · {c.customerName}
                  </span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-800">
                    Yo&apos;lda / Faol
                  </span>
                </div>

                {c.address && (
                  <div className="flex items-center justify-between gap-2 text-xs text-zinc-700 bg-zinc-50 p-2 rounded-lg">
                    <span className="truncate">{c.address}</span>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                        c.address
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-blue-600 font-bold hover:underline"
                    >
                      Xaritada ochish ➔
                    </a>
                  </div>
                )}

                <div className="flex gap-2">
                  {c.customerPhone && (
                    <a
                      href={`tel:${c.customerPhone}`}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 py-2 text-xs font-bold hover:bg-emerald-100 transition"
                    >
                      <Phone size={13} />
                      <span>{c.customerPhone}</span>
                    </a>
                  )}
                  <button
                    type="button"
                    disabled={actionBusyId === c.id}
                    onClick={() => onCallAction(c.id, "done")}
                    className="flex-1 rounded-xl bg-zinc-900 py-2 text-center text-xs font-bold text-white shadow-xs hover:bg-zinc-800 active:scale-95 transition disabled:opacity-50"
                  >
                    ✓ Yakunlash
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Haftalik faollik grafigi (Weekly Activity Chart) */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Haftalik faollik
            </h3>
            <p className="text-sm font-extrabold text-zinc-900 mt-0.5">
              Oxirgi 7 kundagi chaqiruvlar
            </p>
          </div>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-mono text-[11px] font-extrabold text-zinc-700">
            {stats.days.reduce((acc, d) => acc + d.count, 0)} ta chaqiruv
          </span>
        </div>

        <div className="flex items-end justify-between gap-2 h-28 pt-4 pb-1">
          {stats.days.map((d, i) => {
            const pct = Math.max(8, Math.round((d.count / stats.maxDayCount) * 100));
            const isToday = i === stats.days.length - 1;
            return (
              <div key={d.key} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="font-mono text-[10px] font-bold text-zinc-500">
                  {d.count > 0 ? d.count : ""}
                </span>
                <div className="w-full max-w-[28px] rounded-lg bg-zinc-100 overflow-hidden flex items-end h-16">
                  <div
                    style={{ height: `${pct}%` }}
                    className={`w-full rounded-lg transition-all duration-300 ${
                      isToday
                        ? "bg-emerald-600"
                        : d.count > 0
                        ? "bg-zinc-800"
                        : "bg-zinc-200"
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] font-bold ${
                    isToday ? "text-emerald-700 font-extrabold" : "text-zinc-400"
                  }`}
                >
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Tezkor bo'limlarga o'tish tugmalari */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => {
            haptic("light");
            onGoCalls("all");
          }}
          className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-3.5 text-left shadow-2xs hover:border-zinc-300 active:scale-[0.98] transition"
        >
          <div>
            <p className="text-xs font-bold text-zinc-900">Barcha chaqiruvlar</p>
            <p className="text-[11px] text-zinc-400 font-medium">Jami {stats.total} ta chaqiruv</p>
          </div>
          <ChevronRight size={16} className="text-zinc-400" />
        </button>

        <button
          type="button"
          onClick={() => {
            haptic("light");
            onGoCalls("bajarildi");
          }}
          className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-3.5 text-left shadow-2xs hover:border-zinc-300 active:scale-[0.98] transition"
        >
          <div>
            <p className="text-xs font-bold text-zinc-900">Tarix va Natijalar</p>
            <p className="text-[11px] text-zinc-400 font-medium">{stats.completedCount} ta yakunlangan</p>
          </div>
          <ChevronRight size={16} className="text-zinc-400" />
        </button>
      </div>
    </div>
  );
}

