import type { Metadata } from "next";
import SpecialistsClient from "@/components/SpecialistsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mutaxassislar",
  description:
    "AgrozGO orqali ro'yxatdan o'tgan malakali agronom va veterinarlar — tezkor amaliy yordam va maslahatlar.",
};

export default async function SpecialistsPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  return (
    <main>
      <SpecialistsClient initialRole={role ?? "all"} />
    </main>
  );
}
