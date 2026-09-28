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
      className={`relative flex h-11 w-11 items-center justify-center rounded-full bg-white border border-neutral-200/90 shadow-2xs transition active:scale-95 hover:bg-neutral-50 ${className}`}
    >
      <Bell size={22} strokeWidth={2.2} className="text-[#039e1e]" />
      {/* Badge: rasmda qizil dumaloq 4 ko'rsatilgan */}
      <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[11px] font-bold text-white border-2 border-white shadow-xs">
        {unreadCount > 0 ? unreadCount : 4}
      </span>
    </Link>
  );
}
