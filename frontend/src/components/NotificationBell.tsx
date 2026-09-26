"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  fetchRealAppNotifications,
  countUnreadNotifications,
  subscribeToNotificationChanges,
} from "@/lib/notifications-store";

export default function NotificationBell({ className = "" }: { className?: string }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const checkUnread = async () => {
    try {
      const items = await fetchRealAppNotifications("Toshkent");
      setUnreadCount(countUnreadNotifications(items));
    } catch {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    checkUnread();
    const unsub = subscribeToNotificationChanges(() => {
      checkUnread();
    });
    return unsub;
  }, []);

  return (
    <Link
      href="/bildirishnomalar"
      aria-label="Bildirishnomalar"
      className={`relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--brand-ink)] shadow-2xs border border-black/10 transition active:scale-95 hover:bg-neutral-50 ${className}`}
    >
      <Bell size={20} className={unreadCount > 0 ? "text-[var(--brand-green)]" : "text-neutral-700"} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-black text-white shadow-xs">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
