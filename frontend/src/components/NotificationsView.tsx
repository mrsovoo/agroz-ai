"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Sprout,
  PawPrint,
  CloudRain,
  Wind,
  Sun,
  ShieldCheck,
  TriangleAlert,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Calendar,
  Layers,
} from "lucide-react";
import {
  AppNotification,
  fetchRealAppNotifications,
  getReadNotificationIds,
  markAllNotificationsRead,
  markNotificationsRead,
  subscribeToNotificationChanges,
} from "@/lib/notifications-store";

export default function NotificationsView({ userRegion }: { userRegion?: string }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const items = await fetchRealAppNotifications(userRegion || "Toshkent");
      setNotifications(items);
      const readSet = getReadNotificationIds();
      setReadIds(readSet);

      // Sahifaga kirganda 2 soniyadan so'ng yoki foydalanuvchi ko'rgach barchasini o'qilgan qilish
      // Foydalanuvchi aytgan: "bildirishnomaga kirib qayta chiqib ketsa oqilgandek bosinda"
      setTimeout(() => {
        markAllNotificationsRead(items);
        setReadIds(getReadNotificationIds());
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToNotificationChanges(() => {
      setReadIds(getReadNotificationIds());
    });
    return unsub;
  }, [userRegion]);

  // Foydalanuvchi pastga scroll qilganda ham darhol o'qilgan deb belgilash
  const handleScroll = () => {
    if (notifications.length > 0) {
      markAllNotificationsRead(notifications);
      setReadIds(getReadNotificationIds());
    }
  };

  const handleMarkAll = () => {
    markAllNotificationsRead(notifications);
    setReadIds(getReadNotificationIds());
  };

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;
  const displayed = filter === "unread" ? notifications.filter((n) => !readIds.has(n.id)) : notifications;

  const getIcon = (item: AppNotification) => {
    switch (item.type) {
      case "weather":
        if (item.title.includes("Shamol") || item.title.includes("💨")) {
          return <Wind size={20} className="text-amber-600" />;
        }
        if (item.title.includes("Yog'in") || item.title.includes("🌧️")) {
          return <CloudRain size={20} className="text-blue-600" />;
        }
        if (item.title.includes("Qulay") || item.title.includes("🌱")) {
          return <Sun size={20} className="text-emerald-600" />;
        }
        return <TriangleAlert size={20} className="text-red-500" />;
      case "crop":
        return <Sprout size={20} className="text-[var(--brand-green)]" />;
      case "animal":
        return <PawPrint size={20} className="text-amber-600" />;
      case "order":
        return <Sparkles size={20} className="text-blue-600" />;
      default:
        return <ShieldCheck size={20} className="text-neutral-700" />;
    }
  };

  return (
    <div ref={containerRef} onScroll={handleScroll} className="min-h-[80vh] pb-16">
      {/* Yuqori header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[var(--brand-ink)] shadow-2xs border border-black/10 transition active:scale-95 hover:bg-neutral-50"
            aria-label="Orqaga qaytish"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-neutral-900 sm:text-2xl flex items-center gap-2">
              <Bell className="text-[var(--brand-green)]" size={22} />
              Bildirishnomalar
            </h1>
            <p className="text-xs text-neutral-500 font-medium">
              Real ob-havo, dehqonchilik va veterinariya xabarnomalari
            </p>
          </div>
        </div>

        {/* Barchasini o'qilgan deb belgilash tugmasi */}
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAll}
            className="flex items-center gap-1.5 rounded-xl bg-neutral-100 px-3 py-1.5 text-[12.5px] font-bold text-neutral-700 hover:bg-neutral-200 active:scale-95 transition"
          >
            <CheckCheck size={16} className="text-[var(--brand-green)]" />
            <span>O&apos;qilgan deb belgilash</span>
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-xl px-3.5 py-1.5 text-[13px] font-bold transition ${
              filter === "all"
                ? "bg-[var(--brand-green)] text-white shadow-2xs"
                : "bg-white text-neutral-600 hover:bg-neutral-100 border border-black/5"
            }`}
          >
            Barchasi ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[13px] font-bold transition ${
              filter === "unread"
                ? "bg-[var(--brand-green)] text-white shadow-2xs"
                : "bg-white text-neutral-600 hover:bg-neutral-100 border border-black/5"
            }`}
          >
            <span>O&apos;qilmaganlar</span>
            {unreadCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <span className="text-[12px] font-semibold text-neutral-400">
          Hudud: {userRegion || "Toshkent"}
        </span>
      </div>

      {/* Xabarlar ro'yxati */}
      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand-green)] border-t-transparent" />
            <p className="mt-3 text-[14px] font-medium">Bildirishnomalar yuklanmoqda...</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="rounded-3xl border border-black/5 bg-white p-8 text-center shadow-2xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
              <CheckCheck size={24} />
            </div>
            <h3 className="mt-3 text-[16px] font-bold text-neutral-800">
              {filter === "unread" ? "Barcha xabarlar o'qilgan" : "Hozircha yangi bildirishnoma yo'q"}
            </h3>
            <p className="mt-1 text-[13px] text-neutral-500">
              Yangi ob-havo xavflari yoki agro-tavsiyalar paydo bo&apos;lganda shu yerda ko&apos;rinadi.
            </p>
          </div>
        ) : (
          displayed.map((item) => {
            const isRead = readIds.has(item.id);
            const isCritical = item.severity === "critical";

            return (
              <div
                key={item.id}
                onClick={() => {
                  markNotificationsRead([item.id]);
                  setReadIds(getReadNotificationIds());
                }}
                className={`relative overflow-hidden rounded-2xl border transition-all ${
                  isCritical
                    ? "border-red-200 bg-red-50/40 hover:bg-red-50/60"
                    : !isRead
                      ? "border-[var(--brand-green)]/30 bg-emerald-50/30 hover:bg-emerald-50/50 shadow-xs"
                      : "border-black/5 bg-white hover:bg-neutral-50/80 shadow-2xs"
                } p-4 sm:p-4.5`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-2xs border ${
                      isCritical
                        ? "bg-red-100 border-red-200 text-red-700"
                        : item.type === "crop"
                          ? "bg-emerald-100/60 border-emerald-200 text-[var(--brand-green)]"
                          : item.type === "animal"
                            ? "bg-amber-100/60 border-amber-200 text-amber-700"
                            : "bg-neutral-100 border-neutral-200 text-neutral-700"
                    }`}
                  >
                    {getIcon(item)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        {!isRead && (
                          <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                        )}
                        <span
                          className={`text-[11px] font-extrabold uppercase tracking-wide ${
                            isCritical
                              ? "text-red-700"
                              : !isRead
                                ? "text-emerald-700"
                                : "text-neutral-400"
                          }`}
                        >
                          {item.dateText}
                        </span>
                      </div>

                      {!isRead ? (
                        <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black text-emerald-800">
                          Yangi
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-neutral-400">
                          O&apos;qilgan
                        </span>
                      )}
                    </div>

                    <h3 className="mt-1 text-[15px] font-bold text-neutral-900 leading-snug">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-[13.5px] leading-relaxed text-neutral-600">
                      {item.body}
                    </p>

                    {item.actionUrl && (
                      <div className="mt-3">
                        <Link
                          href={item.actionUrl}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-black/10 px-3 py-1.5 text-[12.5px] font-bold text-[var(--brand-green)] shadow-2xs hover:bg-neutral-50 active:scale-95 transition"
                        >
                          <span>{item.actionLabel || "Batafsil"}</span>
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
