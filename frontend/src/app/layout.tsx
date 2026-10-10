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
import EnvWrapper from "@/components/EnvWrapper";

function metadataBase(): URL | undefined {
  const raw = process.env.NEXT_PUBLIC_APP_URL;
  if (!raw) return undefined;
  try { return new URL(raw); } catch { return undefined; }
}

const DESCRIPTION = "Ekin va chorva dorilari platformasi, yaqin agro-do'konlar va mutaxassislar.";

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
