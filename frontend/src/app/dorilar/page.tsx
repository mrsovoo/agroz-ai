import type { Metadata } from "next";
import MarketClient from "@/components/MarketClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dorilar — dorixonalar va agro-preparatlar katalogi",
  description:
    "Ekinlar va hayvonlar uchun dorilar, o'g'itlar va preparatlar katalogi. Savatga qo'shing va buyurtma bering.",
};

export default function MarketPage() {
  return (
    <main>
      <MarketClient />
    </main>
  );
}
