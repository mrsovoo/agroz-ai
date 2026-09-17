import type { Metadata } from "next";
import MarketClient from "@/components/MarketClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dorilar bozori",
  description:
    "Ro'yxatdan o'tgan dorixonalardan ekin va hayvonlar uchun dorilarni toping, savatga qo'shib buyurtma bering.",
};

export default function MarketPage() {
  return (
    <main>
      <MarketClient />
    </main>
  );
}
