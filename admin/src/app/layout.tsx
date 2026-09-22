import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agroz AI — Super Admin Boshqaruv Markazi (admin.agroz.uz)",
  description: "Agroz AI platformasi uchun yagona Super Admin va Telemetriya Boshqaruv Markazi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

