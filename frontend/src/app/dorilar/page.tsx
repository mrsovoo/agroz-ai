import type { Metadata } from "next";
import MarketClient from "@/components/MarketClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agro-mahsulotlar — agro-do'konlar va preparatlar katalogi",
  description:
    "Ekinlar va hayvonlar uchun agro-mahsulotlar, o'g'itlar va preparatlar katalogi. Savatga qo'shing va bron qiling.",
};

export default function MarketPage() {
  return (
    <main>
      <MarketClient />
    </main>
  );
}
