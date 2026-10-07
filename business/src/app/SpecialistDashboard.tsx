"use client";

import { useMemo } from "react";
import {
  PhoneCall,
  CheckCircle2,
  Car,
  Star,
  MapPin,
  ChevronRight,
  Phone,
  Power,
  Navigation,
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
    let pendingCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;

    for (const c of calls) {
      if (c.status === "yangi") pendingCount++;
      else if (c.status === "qabul_qilindi") inProgressCount++;
      else if (c.status === "bajarildi") completedCount++;
    }

    return {
      pendingCount,
      inProgressCount,
      completedCount,
    };
  }, [calls]);

  // Faqat shoshilinch yangi so'rovlar (maksimal 2 ta)
  const pendingCalls = useMemo(() => {
    return calls.filter((c) => c.status === "yangi").slice(0, 2);
  }, [calls]);

  // Hozir yo'lda/jarayondagi faol chaqiruvlar (maksimal 2 ta)
  const activeCalls = useMemo(() => {
    return calls.filter((c) => c.status === "qabul_qilindi").slice(0, 2);
  }, [calls]);

  const isVet = Boolean(
    partner.specialty && /veterinar|chorva|parranda|hayvon/i.test(partner.specialty)
  );

  return (
    <div className="space-y-3.5 px-4 pb-20 animate-in fade-in duration-150">
      {/* 1. Mutaxassis Qisqa Profil Kartasi */}
      <div className="flex items-center justify-between rounded-2xl bg-white border border-zinc-200 p-3.5 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 text-2xl shrink-0">
            {isVet ? "🐾" : "🌱"}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-zinc-900 truncate">{partner.name}</h2>
            <p className="text-[11px] font-semibold text-zinc-500 truncate">
              {partner.specialty || (isVet ? "Veterinar" : "Agronom")}
              {partner.experienceYears ? ` · ${partner.experienceYears} yil staj` : ""}
            </p>
          </div>
        </div>

        {/* Reyting */}
        <div className="shrink-0 flex items-center gap-1 rounded-xl bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-800 border border-amber-200">
          <Star size={12} className="fill-amber-400 text-amber-400" />
          <span>{partner.rating?.avg ? partner.rating.avg.toFixed(1) : "5.0"}</span>
        </div>
      </div>

      {/* 2. Holat (Band / Bo'sh) - 1-Bosishda tushunarli tugma */}
      <div
        className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition ${
          isBusy
            ? "bg-red-50/80 border-red-200"
            : "bg-emerald-50/80 border-emerald-200"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-3 w-3 shrink-0">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isBusy ? "bg-red-400 animate-ping" : "bg-emerald-400 animate-ping"
              }`}
            />
            <span
              className={`relative inline-flex h-3 w-3 rounded-full ${
                isBusy ? "bg-red-600" : "bg-emerald-600"
              }`}
            />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black text-zinc-900">
              {isBusy ? "Hozirda bandman" : "Qabulga tayyorman"}
            </p>
            <p className="text-[11px] text-zinc-500 font-medium">
              {isBusy ? "Mijozlarga 'Chaqiruvda' deb ko'rinasiz" : "Mijozlar sizni chaqira oladi"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            haptic("medium");
            onToggleBusy();
          }}
          className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white shadow-2xs active:scale-95 transition ${
            isBusy
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          <Power size={13} />
          <span>{isBusy ? "Bo'shatish" : "Band qilish"}</span>
        </button>
      </div>

      {/* 3. 3 ta Asosiy Ko'rsatkich (Yangi, Jarayonda, Yakunlangan) */}
      <div className="grid grid-cols-3 gap-2">
        {/* Yangi */}
        <button
          type="button"
          onClick={() => {
            haptic("light");
            onGoCalls("yangi");
          }}
          className={`rounded-2xl border p-3 text-left transition active:scale-95 ${
            stats.pendingCount > 0
              ? "bg-amber-50 border-amber-300"
              : "bg-white border-zinc-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500">Yangi</span>
            <PhoneCall size={13} className={stats.pendingCount > 0 ? "text-amber-600" : "text-zinc-400"} />
          </div>
          <p className={`mt-1.5 text-xl font-black ${stats.pendingCount > 0 ? "text-amber-700" : "text-zinc-900"}`}>
            {stats.pendingCount}
          </p>
        </button>

        {/* Jarayonda */}
        <button
          type="button"
          onClick={() => {
            haptic("light");
            onGoCalls("qabul_qilindi");
          }}
          className={`rounded-2xl border p-3 text-left transition active:scale-95 ${
            stats.inProgressCount > 0
              ? "bg-blue-50 border-blue-300"
              : "bg-white border-zinc-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500">Jarayonda</span>
            <Car size={13} className={stats.inProgressCount > 0 ? "text-blue-600" : "text-zinc-400"} />
          </div>
          <p className={`mt-1.5 text-xl font-black ${stats.inProgressCount > 0 ? "text-blue-700" : "text-zinc-900"}`}>
            {stats.inProgressCount}
          </p>
        </button>

        {/* Yakunlangan */}
        <button
          type="button"
          onClick={() => {
            haptic("light");
            onGoCalls("bajarildi");
          }}
          className="rounded-2xl border border-zinc-200 bg-white p-3 text-left transition active:scale-95"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500">Bajarildi</span>
            <CheckCircle2 size={13} className="text-emerald-600" />
          </div>
          <p className="mt-1.5 text-xl font-black text-zinc-900">
            {stats.completedCount}
          </p>
        </button>
      </div>

      {/* 4. Yangi So'rovlar (Faqat bor bo'lganda ko'rinadi) */}
      {pendingCalls.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase text-amber-900 tracking-wider">
              Yangi so&apos;rovlar ({pendingCalls.length})
            </span>
            <button
              type="button"
              onClick={() => onGoCalls("yangi")}
              className="text-[11px] font-bold text-amber-700 hover:underline"
            >
              Barchasi →
            </button>
          </div>

          <div className="space-y-2">
            {pendingCalls.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-amber-200 bg-white p-3.5 shadow-2xs space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-zinc-900">#{c.id} · {c.customerName}</span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {new Date(c.createdAt).toLocaleTimeString("uz-UZ", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <p className="text-xs text-zinc-700 bg-amber-50/70 p-2 rounded-xl font-medium">
                  {c.problem}
                </p>

                {c.address && (
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 truncate">
                    <MapPin size={12} className="shrink-0 text-zinc-400" />
                    <span className="truncate">{c.address}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-0.5">
                  <button
                    type="button"
                    disabled={actionBusyId === c.id}
                    onClick={() => onCallAction(c.id, "accept")}
                    className="flex-1 rounded-xl bg-emerald-600 py-2 text-center text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50"
                  >
                    Qabul qilish
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

      {/* 5. Jarayondagi Faol Chaqiruvlar (Faqat bor bo'lganda ko'rinadi) */}
      {activeCalls.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase text-blue-900 tracking-wider">
              Yo&apos;lda / Faol chaqiruvlar ({activeCalls.length})
            </span>
            <button
              type="button"
              onClick={() => onGoCalls("qabul_qilindi")}
              className="text-[11px] font-bold text-blue-700 hover:underline"
            >
              Barchasi →
            </button>
          </div>

          <div className="space-y-2">
            {activeCalls.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-blue-200 bg-white p-3.5 shadow-2xs space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-zinc-900">#{c.id} · {c.customerName}</span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-800">
                    Jarayonda
                  </span>
                </div>

                {c.address && (
                  <div className="flex items-center justify-between gap-2 text-xs text-zinc-700 bg-zinc-50 p-2 rounded-xl">
                    <span className="truncate">{c.address}</span>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-1 text-blue-600 font-bold hover:underline"
                    >
                      <Navigation size={11} />
                      <span>Xarita</span>
                    </a>
                  </div>
                )}

                <div className="flex gap-2">
                  {c.customerPhone && (
                    <a
                      href={`tel:${c.customerPhone}`}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 py-2 text-xs font-bold hover:bg-emerald-100 transition"
                    >
                      <Phone size={13} />
                      <span>{c.customerPhone}</span>
                    </a>
                  )}
                  <button
                    type="button"
                    disabled={actionBusyId === c.id}
                    onClick={() => onCallAction(c.id, "done")}
                    className="flex-1 rounded-xl bg-zinc-900 py-2 text-center text-xs font-bold text-white shadow-2xs hover:bg-zinc-800 active:scale-95 transition disabled:opacity-50"
                  >
                    Yakunlash
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Barcha chaqiruvlarga tezkor o'tish */}
      <button
        type="button"
        onClick={() => {
          haptic("light");
          onGoCalls("all");
        }}
        className="w-full flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-3.5 text-left shadow-2xs hover:border-zinc-300 active:scale-[0.99] transition"
      >
        <div>
          <p className="text-xs font-black text-zinc-900">Barcha chaqiruvlar tarixi</p>
          <p className="text-[11px] text-zinc-400 font-medium">Jami: {calls.length} ta chaqiruv</p>
        </div>
        <ChevronRight size={16} className="text-zinc-400" />
      </button>
    </div>
  );
}
