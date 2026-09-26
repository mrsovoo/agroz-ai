import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agroz AI — Boshqaruv Markazi",
  description: "Agroz AI platformasi uchun yagona boshqaruv va telemetriya markazi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body className="min-h-screen bg-[#fafafa] text-zinc-900 antialiased selection:bg-zinc-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}

