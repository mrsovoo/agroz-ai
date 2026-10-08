import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import TelegramInit from "@/components/TelegramInit";
import WebFooter from "@/components/WebFooter";
import WebTopNav from "@/components/WebTopNav";
import CartDrawer from "@/components/CartDrawer";
import MobileSwipeNavigation from "@/components/MobileSwipeNavigation";

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
  "Ekin va chorva dorilari platformasi, yaqin agro-do&apos;konlar va mutaxassislar.";

export const metadata: Metadata = {
  metadataBase: metadataBase(),
  title: {
    default: "AgrozGO — Dehqon va chorvador yordamchisi",
    template: "%s — AgrozGO",
  },
  description: DESCRIPTION,
  applicationName: "AgrozGO",
  openGraph: {
    type: "website",
    siteName: "AgrozGO",
    title: "AgrozGO — Dehqon va chorvador yordamchisi",
    description: DESCRIPTION,
    locale: "uz_UZ",
  },
  appleWebApp: { capable: true, title: "AgrozGO", statusBarStyle: "default" },
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
  function updateLayout() {
    try {
      var tg = window.Telegram && window.Telegram.WebApp;
      if (tg) {
        try {
          tg.ready();
          tg.expand();
          if (typeof tg.disableVerticalSwipes === "function") tg.disableVerticalSwipes();
          if (typeof tg.setHeaderColor === "function") tg.setHeaderColor("#fcbd00");
          if (typeof tg.setBackgroundColor === "function") tg.setBackgroundColor("#f2f3f5");
        } catch (e) {}
      }
      var ua = navigator.userAgent || "";
      var ref = document.referrer || "";
      var session = !!(tg && ((tg.initData && tg.initData.length) || (tg.initDataUnsafe && (tg.initDataUnsafe.user || tg.initDataUnsafe.query_id))));
      var refTelegram = /(^|\\/\\/)([a-z0-9-]+\\.)*telegram\\.(org|me|dev)\\//i.test(ref);
      var inTelegram = session || /Telegram/i.test(ua) || refTelegram;
      var wide = (window.innerWidth || 0) >= 900;
      var isWeb = !inTelegram && wide;
      if (isWeb) {
        document.documentElement.classList.add("is-web");
        document.documentElement.classList.remove("is-telegram");
      } else {
        document.documentElement.classList.add("is-telegram");
        document.documentElement.classList.remove("is-web");
      }
    } catch (e) {
      document.documentElement.classList.add("is-telegram");
    }
  }
  updateLayout();
  window.addEventListener("resize", updateLayout);
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
        <MobileSwipeNavigation />
        <WebTopNav />
        <div className="app-shell">{children}</div>
        <WebFooter />
        <CartDrawer />
        <BottomNav />
      </body>
    </html>
  );
}
