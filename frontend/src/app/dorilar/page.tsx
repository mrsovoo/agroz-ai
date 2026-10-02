import type { Metadata } from "next";
import MarketClient from "@/components/MarketClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agro-mahsulotlar — agro-do&apos;kon preparatlari katalogi",
  description:
    "Ekinlar va hayvonlar uchun agro-mahsulotlar, o'g'itlar va preparatlar katalogi. Savatga qo'shing va agro-do&apos;kondan buyurtma bering.",
};

export default function MarketPage() {
  return (
    <main>
      <MarketClient />
    </main>
  );
}
