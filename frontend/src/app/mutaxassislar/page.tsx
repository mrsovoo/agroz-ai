import type { Metadata } from "next";
import SpecialistsClient from "@/components/SpecialistsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mutaxassislar",
  description:
    "AgrozGO orqali ro'yxatdan o'tgan mutaxassislar va agro-do&apos;kon egalari — 5 km radius ichida.",
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
