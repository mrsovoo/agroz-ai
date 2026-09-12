import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import TelegramInit from "@/components/TelegramInit";
import WebTopNav from "@/components/WebTopNav";

export const metadata: Metadata = {
  title: "AgroVet AI — Dehqon va chorvador yordamchisi",
  description:
    "Sun'iy intellekt yordamida ekin va chorva kasalliklariga tashxis, yaqin dorixonalar va veterinarlar xaritasi.",
  appleWebApp: { capable: true, title: "AgroVet", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#fcbd00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
        <TelegramInit />
        <WebTopNav />
        <div className="app-shell">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
