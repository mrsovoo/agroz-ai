import type { Metadata } from "next";
import SpecialistsClient from "@/components/SpecialistsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mutaxassislar",
  description:
    "Agroz AI orqali ro'yxatdan o'tgan mutaxassislar va dorixona egalari — 5 km radius ichida.",
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
