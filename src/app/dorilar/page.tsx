import type { Metadata } from "next";
import MarketClient from "@/components/MarketClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agro Bozor — dorilar",
  description:
    "Agro Bozor: ro'yxatdan o'tgan dorixonalar dorilari. Ekin va hayvonlar uchun dorilarni toping, yoqtirilganlarga saqlang, savatga qo'shib buyurtma bering.",
};

export default function MarketPage() {
  return (
    <main>
      <MarketClient />
    </main>
  );
}
