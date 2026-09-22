import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MedicineDetail, { getMedicineDetail } from "@/components/MedicineDetail";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const medicine = await getMedicineDetail(Number(id)).catch(() => null);
  if (!medicine) return { title: "Mahsulot topilmadi" };
  return {
    title: `${medicine.name} — Dorilar`,
    description:
      medicine.usage ??
      `${medicine.name} — ${medicine.pharmacyName} dorixonasida. Agroz AI orqali buyurtma bering.`,
  };
}

export default async function MedicinePage({ params }: Props) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId) || numericId <= 0) notFound();

  const medicine = await getMedicineDetail(numericId);
  if (!medicine) notFound();

  return <MedicineDetail medicine={medicine} />;
}
