import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import TelegramInit from "@/components/TelegramInit";
import WebFooter from "@/components/WebFooter";
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
    default: "Agroz AI — Dehqon va chorvador yordamchisi",
    template: "%s — Agroz AI",
  },
  description: DESCRIPTION,
  applicationName: "Agroz AI",
  openGraph: {
    type: "website",
    siteName: "Agroz AI",
    title: "Agroz AI — Dehqon va chorvador yordamchisi",
    description: DESCRIPTION,
    locale: "uz_UZ",
  },
  appleWebApp: { capable: true, title: "Agroz", statusBarStyle: "default" },
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
 * Qoida:
 *   - Telegram Mini App ichida (telefon, planshet yoki Telegram Desktop oynasi) → MOBIL ILOVA ko'rinishi
 *   - oddiy brauzerda, keng va baland ekranda (>= 900x500)                    → WEB SAYT ko'rinishi
 *   - oddiy brauzerda, tor ekranda (telefon brauzeri, yotiq holat ham)         → mobil ko'rinish
 *
 * Klass HTML'ning o'zida, rasm chizilishidan oldin qo'yiladi — shuning uchun
 * sekin internetda ham ko'rinish sakramaydi (avval JS yuklanishini kutardi).
 * Telegram SDK kech yuklansa ham Telegram'ni uchta belgidan biri orqali taniymiz:
 * UA, `document.referrer` (Telegram Web iframe'i) yoki `window.Telegram`.
 */
const LAYOUT_DETECT_SCRIPT = `
(function () {
  try {
    var ua = navigator.userAgent || "";
    var ref = document.referrer || "";
    var tg = window.Telegram && window.Telegram.WebApp;
    // SDK tashqi brauzerda ham yuklanadi — haqiqiy belgi: initData/user/query_id.
    var session = !!(tg && ((tg.initData && tg.initData.length) || (tg.initDataUnsafe && (tg.initDataUnsafe.user || tg.initDataUnsafe.query_id))));
    var refTelegram = /(^|\\/\\/)([a-z0-9-]+\\.)*telegram\\.(org|me|dev)\\//i.test(ref);
    var inTelegram = session || /Telegram/i.test(ua) || refTelegram;
    // Keng va baland ekran (telefon yotiq holatda ham mobil ko'rinishda qoladi).
    // CSS media query bilan aynan bir xil shart: min-width 900px + min-height 500px.
    var wide = (window.innerWidth || 0) >= 900 && (window.innerHeight || 0) >= 500;
    document.documentElement.classList.add(!inTelegram && wide ? "is-web" : "is-telegram");
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
        <WebFooter />
        <BottomNav />
      </body>
    </html>
  );
}
