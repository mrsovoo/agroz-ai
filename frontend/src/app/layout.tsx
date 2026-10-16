import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";
import BottomNav from "@/components/app/BottomNav";
import TelegramInit from "@/components/TelegramInit";
import WebFooter from "@/components/web/WebFooter";
import WebTopNav from "@/components/web/WebTopNav";
import CartDrawer from "@/components/CartDrawer";
import MobileSwipeNavigation from "@/components/MobileSwipeNavigation";
import EnvWrapper from "@/components/EnvWrapper";

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || "https://agroz.uz";

function metadataBase(): URL {
  try {
    return new URL(APP_BASE_URL);
  } catch {
    return new URL("https://agroz.uz");
  }
}

const DESCRIPTION = "Ekin va chorva uchun agro-mahsulotlar platformasi, yaqin agro-do'konlar va mutaxassislar.";

export const metadata: Metadata = {
  metadataBase: metadataBase(),
  title: {
    default: "AgrozGO — Dehqon va chorvador yordamchisi",
    template: "%s — AgrozGO",
  },
  description: DESCRIPTION,
  applicationName: "AgrozGO",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: APP_BASE_URL,
    siteName: "AgrozGO",
    title: "AgrozGO — Dehqon va chorvador yordamchisi",
    description: DESCRIPTION,
    locale: "uz_UZ",
    images: [
      {
        url: `${APP_BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "AgrozGO — Aqlli qishloq xo'jaligi ekotizimi",
      },
    ],
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-[#e5e6ea] text-[var(--brand-ink)] antialiased">
        <EnvWrapper>
          <TelegramInit />
          <MobileSwipeNavigation />
          <WebTopNav />
          <div className="app-shell">{children}</div>
          <WebFooter />
          <CartDrawer />
          <BottomNav />
        </EnvWrapper>
      </body>
    </html>
  );
}
