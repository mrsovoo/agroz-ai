"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTelegram } from "@/lib/telegram";

/**
 * Telegram Mini App ichidagi "Orqaga" tugmasini boshqaradi.
 * Ichki sahifalarda Telegram BackButton ni ko'rsatadi.
 */
export default function TelegramBackButton({ href }: { href: string }) {
  const router = useRouter();
  useEffect(() => {
    const tg = getTelegram();
    if (!tg) return;
    const back = tg.BackButton;
    back.show();
    const handler = () => router.push(href);
    back.onClick(handler);
    return () => {
      back.offClick(handler);
      back.hide();
    };
  }, [href, router]);
  return null;
}
