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
  Navigation,
  UserCheck,
  ArrowUpRight,
  FileText,
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
  conclusion?: string | null;
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
  onOpenCompleteModal,
  actionBusyId,
}: {
  partner: DashPartnerProfile;
  calls: DashPartnerCall[];
  isBusy: boolean;
  onToggleBusy: () => Promise<void>;
  onGoCalls: (filter?: "all" | "yangi" | "qabul_qilindi" | "bajarildi") => void;
  onCallAction: (callId: number, action: "accept" | "reject" | "done") => Promise<void>;
  onOpenCompleteModal?: (call: DashPartnerCall) => void;
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

  // Faqat shoshilinch yangi so'rovlar (maksimal 4 ta)
  const pendingCalls = useMemo(() => {
    return calls.filter((c) => c.status === "yangi").slice(0, 4);
  }, [calls]);

  // Hozir yo'lda/jarayondagi faol chaqiruvlar (maksimal 4 ta)
  const activeCalls = useMemo(() => {
    return calls.filter((c) => c.status === "qabul_qilindi").slice(0, 4);
  }, [calls]);

  const isVet = Boolean(
    partner.specialty && /veterinar|chorva|parranda|hayvon/i.test(partner.specialty)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* 1. Mutaxassis Boshqaruv Kartasi */}
      <div className="rounded-2xl border border-[#E5E5EA] bg-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1D1D1F] text-white font-medium text-sm shrink-0">
            <UserCheck size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[#1D1D1F] truncate">{partner.name}</h2>
              <span className="rounded-full bg-[#F5F5F7] text-[#1D1D1F] px-2 py-0.5 text-[10px] font-medium shrink-0">
                Faol
              </span>
            </div>
            <p className="text-xs text-[#86868B] mt-0.5 flex flex-wrap items-center gap-2">
              <span>{partner.specialty || (isVet ? "Veterinariya mutaxassisi" : "Agronom maslahatchi")}</span>
              {partner.experienceYears ? (
                <>
                  <span className="text-[#E5E5EA]">•</span>
                  <span className="text-[#1D1D1F] font-mono">{partner.experienceYears} yil tajriba</span>
                </>
              ) : null}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Reyting */}
          <div className="flex items-center gap-1 rounded-full bg-[#F5F5F7] px-3 py-1.5 text-xs font-mono font-medium text-[#1D1D1F]">
            <Star size={13} className="fill-[#1D1D1F] text-[#1D1D1F]" />
            <span>{partner.rating?.avg ? partner.rating.avg.toFixed(1) : "5.0"}</span>
          </div>

          {/* 1-Tap Bandlik Kaliti */}
          <button
            type="button"
            onClick={() => {
              haptic("medium");
              onToggleBusy();
            }}
            className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition active:scale-95 border ${
              isBusy
                ? "bg-white text-[#1D1D1F] border-[#E5E5EA] hover:bg-[#F5F5F7]"
                : "bg-[#1D1D1F] text-white border-[#1D1D1F] hover:bg-black"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isBusy ? "bg-amber-500" : "bg-emerald-400"}`} />
            <span>{isBusy ? "Band" : "Qabulga tayyor"}</span>
          </button>
        </div>
      </div>

      {/* 2. 3 ta Asosiy Ko'rsatkich (KPI Kartochkalar) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => {
            haptic("light");
            onGoCalls("yangi");
          }}
          className="rounded-2xl border border-[#E5E5EA] bg-white p-4 text-left transition hover:border-[#1D1D1F] active:scale-98"
        >
          <div className="flex items-center justify-between text-xs font-medium text-[#86868B]">
            <span className="flex items-center gap-1.5">
              <PhoneCall size={14} className="text-[#1D1D1F]" />
              <span>Yangi so&apos;rovlar</span>
            </span>
            <ArrowUpRight size={13} className="text-[#86868B]" />
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-[#1D1D1F]">
            {stats.pendingCount} <span className="text-xs font-normal text-[#86868B] font-sans">ta</span>
          </p>
          <p className="mt-1 text-[11px] text-[#86868B]">Kutilayotgan so&apos;rovlar</p>
        </button>

        <button
          type="button"
          onClick={() => {
            haptic("light");
            onGoCalls("qabul_qilindi");
          }}
          className="rounded-2xl border border-[#E5E5EA] bg-white p-4 text-left transition hover:border-[#1D1D1F] active:scale-98"
        >
          <div className="flex items-center justify-between text-xs font-medium text-[#86868B]">
            <span className="flex items-center gap-1.5">
              <Car size={14} className="text-[#1D1D1F]" />
              <span>Yo&apos;lda / Jarayonda</span>
            </span>
            <ArrowUpRight size={13} className="text-[#86868B]" />
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-[#1D1D1F]">
            {stats.inProgressCount} <span className="text-xs font-normal text-[#86868B] font-sans">ta</span>
          </p>
          <p className="mt-1 text-[11px] text-[#86868B]">Faol qabul qilingan</p>
        </button>

        <button
          type="button"
          onClick={() => {
            haptic("light");
            onGoCalls("bajarildi");
          }}
          className="rounded-2xl border border-[#E5E5EA] bg-white p-4 text-left transition hover:border-[#1D1D1F] active:scale-98"
        >
          <div className="flex items-center justify-between text-xs font-medium text-[#86868B]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-[#1D1D1F]" />
              <span>Yakunlangan</span>
            </span>
            <ArrowUpRight size={13} className="text-[#86868B]" />
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-[#1D1D1F]">
            {stats.completedCount} <span className="text-xs font-normal text-[#86868B] font-sans">ta</span>
          </p>
          <p className="mt-1 text-[11px] text-[#86868B]">Bajarilgan chaqiruvlar</p>
        </button>
      </div>

      {/* 3. Chaqiruvlar Ro'yxati (Desktopda 2-ustunli split) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chap: Shoshilinch Yangi So'rovlar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#1D1D1F] flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1D1D1F]" />
              <span>Yangi chaqiruvlar ({stats.pendingCount})</span>
            </h3>
            <button
              type="button"
              onClick={() => onGoCalls("yangi")}
              className="text-xs text-[#86868B] hover:text-[#1D1D1F] flex items-center gap-0.5"
            >
              <span>Barchasi</span>
              <ChevronRight size={12} />
            </button>
          </div>

          {pendingCalls.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E5E5EA] bg-white p-8 text-center text-[#86868B]">
              <PhoneCall size={28} className="mx-auto mb-2 opacity-30 text-[#1D1D1F]" />
              <p className="text-xs font-medium text-[#1D1D1F]">Yangi chaqiruvlar yo&apos;q</p>
              <p className="text-[11px] text-[#86868B] mt-0.5">So&apos;rov tushganda shu yerda ko&apos;rinadi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingCalls.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-[#E5E5EA] bg-white p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-2">
                    <span className="font-medium text-xs text-[#1D1D1F]">
                      Chaqiruv #{c.id} · <span>{c.customerName}</span>
                    </span>
                    <span className="text-[11px] font-mono text-[#86868B]">
                      {new Date(c.createdAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <p className="text-xs text-[#1D1D1F] bg-[#FBFBFD] border border-[#E5E5EA] p-3 rounded-xl leading-relaxed">
                    {c.problem}
                  </p>

                  {c.address && (
                    <div className="flex items-center justify-between text-xs text-[#86868B] bg-[#F5F5F7] p-2 rounded-xl">
                      <span className="truncate flex items-center gap-1.5">
                        <MapPin size={12} className="text-[#86868B] shrink-0" />
                        <span className="truncate">{c.address}</span>
                      </span>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-1 text-[#1D1D1F] font-medium hover:underline ml-2"
                      >
                        <Navigation size={11} />
                        <span>Xarita</span>
                      </a>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      disabled={actionBusyId === c.id}
                      onClick={() => onCallAction(c.id, "accept")}
                      className="flex-1 rounded-full bg-[#1D1D1F] hover:bg-black py-2 text-center text-xs font-medium text-white transition active:scale-95 disabled:opacity-50"
                    >
                      Qabul qilish
                    </button>
                    <button
                      type="button"
                      disabled={actionBusyId === c.id}
                      onClick={() => onCallAction(c.id, "reject")}
                      className="rounded-full bg-[#F5F5F7] px-4 py-2 text-center text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#E5E5EA] transition active:scale-95 disabled:opacity-50"
                    >
                      Rad etish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* O'ng: Jarayondagi / Faol Chaqiruvlar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#1D1D1F] flex items-center gap-2">
              <Car size={14} className="text-[#1D1D1F]" />
              <span>Yo&apos;lda / Faol chaqiruvlar ({stats.inProgressCount})</span>
            </h3>
            <button
              type="button"
              onClick={() => onGoCalls("qabul_qilindi")}
              className="text-xs text-[#86868B] hover:text-[#1D1D1F] flex items-center gap-0.5"
            >
              <span>Barchasi</span>
              <ChevronRight size={12} />
            </button>
          </div>

          {activeCalls.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E5E5EA] bg-white p-8 text-center text-[#86868B]">
              <Car size={28} className="mx-auto mb-2 opacity-30 text-[#1D1D1F]" />
              <p className="text-xs font-medium text-[#1D1D1F]">Faol chaqiruv yo&apos;q</p>
              <p className="text-[11px] text-[#86868B] mt-0.5">Qabul qilingan chaqiruvlar shu yerda chiqadi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeCalls.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-[#E5E5EA] bg-white p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-2">
                    <span className="font-medium text-xs text-[#1D1D1F]">
                      Chaqiruv #{c.id} · <span>{c.customerName}</span>
                    </span>
                    <span className="rounded-full bg-[#F5F5F7] text-[#1D1D1F] px-2 py-0.5 text-[10px] font-medium">
                      Jarayonda
                    </span>
                  </div>

                  <p className="text-xs text-[#1D1D1F] bg-[#FBFBFD] border border-[#E5E5EA] p-2.5 rounded-xl">
                    {c.problem}
                  </p>

                  {c.address && (
                    <div className="flex items-center justify-between text-xs text-[#86868B] bg-[#F5F5F7] p-2 rounded-xl">
                      <span className="truncate flex items-center gap-1.5">
                        <MapPin size={12} className="text-[#86868B] shrink-0" />
                        <span className="truncate">{c.address}</span>
                      </span>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-1 text-[#1D1D1F] font-medium hover:underline ml-2"
                      >
                        <Navigation size={11} />
                        <span>Xarita</span>
                      </a>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    {c.customerPhone && (
                      <a
                        href={`tel:${c.customerPhone}`}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-full border border-[#E5E5EA] bg-white text-[#1D1D1F] py-2 text-xs font-medium hover:bg-[#F5F5F7] transition"
                      >
                        <Phone size={12} />
                        <span>{c.customerPhone}</span>
                      </a>
                    )}
                    <button
                      type="button"
                      disabled={actionBusyId === c.id}
                      onClick={() => {
                        if (onOpenCompleteModal) {
                          onOpenCompleteModal(c);
                        } else {
                          onCallAction(c.id, "done");
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-[#1D1D1F] hover:bg-black py-2 text-center text-xs font-medium text-white transition active:scale-95 disabled:opacity-50"
                    >
                      <FileText size={12} />
                      <span>Xulosa & Yakunlash</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
