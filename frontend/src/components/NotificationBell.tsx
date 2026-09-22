"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

export default function NotificationBell({ className = "" }: { className?: string }) {
  const [hasAlert, setHasAlert] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/weather/alerts")
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.ok && Array.isArray(data.alerts) && data.alerts.length > 0) {
          setHasAlert(true);
          setCount(data.alerts.length);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Link
      href="/bildirishnomalar"
      aria-label="Bildirishnomalar"
      className={`relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--brand-ink)] shadow-sm transition active:scale-95 hover:bg-neutral-50 ${className}`}
    >
      <Bell size={20} className={hasAlert ? "text-amber-600" : "text-neutral-700"} />
      {hasAlert && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-black text-white shadow-xs">
          {count > 9 ? "9+" : count}
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        </span>
      )}
    </Link>
  );
}

