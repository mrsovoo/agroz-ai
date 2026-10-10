import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import EnvWrapper from "@/components/EnvWrapper";

export const metadata: Metadata = {
  title: "AgrozGO Business — Agro-do'kon va Mutaxassislar Boshqaruvi",
  description: "Dorixona egalari, agronom va veterinarlar uchun buyurtmalar, dorilar va chaqiruvlarni boshqarish tizimi.",
  icons: {
    icon: "/logo-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-screen bg-slate-50 antialiased text-slate-900">
        <EnvWrapper>
          {children}
        </EnvWrapper>
      </body>
    </html>
  );
}
