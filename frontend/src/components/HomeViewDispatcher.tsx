"use client";

import { useEnvironment } from "@/lib/env";
import HomeClientView, { type HomeMedicine, type HomeSpecialist } from "@/components/app/HomeClientView";
import MainWebLanding from "@/components/web/MainWebLanding";

export default function HomeViewDispatcher({
  initialMedicines = [],
  initialSpecialists = [],
}: {
  initialMedicines?: HomeMedicine[];
  initialSpecialists?: HomeSpecialist[];
}) {
  const env = useEnvironment(false);

  // Telegram Mini App ichida ochilganda: ixcham mini-app interfeysi
  if (env === "telegram") {
    return (
      <HomeClientView
        initialMedicines={initialMedicines}
        initialSpecialists={initialSpecialists}
      />
    );
  }

  // Web brauzerda (desktop, planshet, mobil brauzer): boy va to'liq korporativ Agroz platformasi
  return <MainWebLanding />;
}

