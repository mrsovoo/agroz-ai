import type { Metadata } from "next";
import MarketClient from "@/components/MarketClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dorilar — dorixona preparatlari katalogi",
  description:
    "Ekinlar va hayvonlar uchun dori vositalari, o'g'itlar va preparatlar katalogi. Savatga qo'shing va dorixonadan buyurtma bering.",
};

export default function MarketPage() {
  return (
    <main>
      <MarketClient />
    </main>
  );
}
