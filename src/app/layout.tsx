import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import TelegramInit from "@/components/TelegramInit";
import WebTopNav from "@/components/WebTopNav";

/** Next'ning absolute URL'lar uchun asosiy manzili (OG rasm va h.k.). */
function metadataBase(): URL | undefined {
  const raw = process.env.NEXT_PUBLIC_APP_URL;
  if (!raw) return undefined;
  try {
    return new URL(raw);
  } catch {
    console.warn("[config] NEXT_PUBLIC_APP_URL noto'g'ri formatda:", raw);
    return undefined;
  }
}

const DESCRIPTION =
  "Sun'iy intellekt yordamida ekin va chorva kasalliklariga tashxis, yaqin dorixonalar va veterinarlar xaritasi.";

export const metadata: Metadata = {
  metadataBase: metadataBase(),
  title: {
    default: "AgroVet AI — Dehqon va chorvador yordamchisi",
    template: "%s — AgroVet AI",
  },
  description: DESCRIPTION,
  applicationName: "AgroVet AI",
  openGraph: {
    type: "website",
    siteName: "AgroVet AI",
    title: "AgroVet AI — Dehqon va chorvador yordamchisi",
    description: DESCRIPTION,
    locale: "uz_UZ",
  },
  appleWebApp: { capable: true, title: "AgroVet", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#fcbd00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

/**
 * Birinchi kadrdan oldin ishlaydigan aniqlash skripti.
 *
 * Muammo: avval `is-web` klassi faqat JS yuklangandan keyin qo'shilardi — sekin
 * internetda foydalanuvchi avval mobil, keyin web ko'rinishini ko'rardi (sakrash).
 * Endi klass HTML'ning o'zida, rasm chizilishidan oldin qo'yiladi:
 *   - Telegram ichida (yoki tor ekranda) → mobil ilova ko'rinishi
 *   - keng ekranda, Telegram bo'lmasa        → web sayt ko'rinishi
 */
const LAYOUT_DETECT_SCRIPT = `
(function () {
  try {
    var ua = navigator.userAgent || "";
    var tg = window.Telegram && window.Telegram.WebApp;
    var inTelegram = !!(tg && tg.initData !== undefined) || /Telegram/i.test(ua);
    var wide = Math.min(window.innerWidth || 0, screen.width || 0) >= 900;
    var isWeb = !inTelegram && wide;
    var root = document.documentElement;
    root.classList.add(isWeb ? "is-web" : "is-telegram");
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.colorScheme === "dark") {
      root.classList.add("tg-dark");
    }
  } catch (e) {
    document.documentElement.classList.add("is-telegram");
  }
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz">
      <head>
        {/* Telegram SDK: Mini App API'si (ready/expand/BackButton/HapticFeedback). */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        {/* Ko'rinishni aniqlash — tarmoqqa bog'liq emas, birinchi kadrdan ishlaydi. */}
        <script dangerouslySetInnerHTML={{ __html: LAYOUT_DETECT_SCRIPT }} />
      </head>
      <body className="bg-[#e5e6ea] text-[var(--brand-ink)] antialiased">
        <TelegramInit />
        <WebTopNav />
        <div className="app-shell">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
