import type { Metadata } from "next";
import AgrozGoWebClient from "@/components/AgrozGoWebClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AgrozGO — Ekotizimning to'laqonli veb ilovasi | Ob-havo, Bozor va Mutaxassislar",
  description:
    "AgrozGO veb ilovasi: ekin va chorva uchun agrotexnik ob-havo, sertifikatlangan dori-darmonlar va o'g'itlar bozori hamda professional agronom va veterinar mutaxassislarni chaqirish.",
};

export default function AgrozGoPage() {
  return (
    <main>
      <AgrozGoWebClient />
    </main>
  );
}

