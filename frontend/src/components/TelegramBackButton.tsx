"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onTelegramReady } from "@/lib/telegram";

/**
 * Telegram Mini App ichidagi "Orqaga" tugmasini boshqaradi.
 * Ichki sahifalarda Telegram BackButton ko'rsatiladi.
 */
export default function TelegramBackButton({ href }: { href: string }) {
  const router = useRouter();

  useEffect(() => {
    return onTelegramReady((tg) => {
      const back = tg.BackButton;
      const handler = () => router.push(href);
      back.show();
      back.onClick(handler);
      // Komponent almashganda eski handler'ni olib tashlaymiz.
      return () => {
        back.offClick(handler);
        back.hide();
      };
    });
  }, [href, router]);

  return null;
}
