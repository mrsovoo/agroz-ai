import type { Metadata } from "next";
import HomeClientView from "@/components/app/HomeClientView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AgrozGO — Dehqon va chorvador yordamchisi | Ob-havo, Bozor va Mutaxassislar",
  description:
    "AgrozGO ilovasi: ekin va chorva uchun agrotexnik ob-havo, sertifikatlangan agro-mahsulotlar va o'g'itlar bozori hamda professional agronom va veterinar mutaxassislarni chaqirish.",
};

export default function AgrozGoPage() {
  return (
    <main>
      <HomeClientView />
    </main>
  );
}

