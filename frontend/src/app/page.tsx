import HomeClientView, { type HomeMedicine, type HomeSpecialist } from "@/components/HomeClientView";
import { apiUrl } from "@/lib/api-config";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let initialMedicines: HomeMedicine[] = [];
  let initialSpecialist: HomeSpecialist | null = null;

  try {
    const [medRes, specRes] = await Promise.all([
      fetch(apiUrl("/api/medicines?limit=4"), { next: { revalidate: 10 } }),
      fetch(apiUrl("/api/specialists"), { next: { revalidate: 10 } }),
    ]);

    if (medRes.ok) {
      const data = await medRes.json();
      if (Array.isArray(data) && data.length > 0) {
        initialMedicines = data.map((m: any) => ({
          id: m.id,
          name: m.name,
          usage: m.usage,
          price: m.price,
          hasPhoto: m.hasPhoto,
          photoUrl: m.hasPhoto ? apiUrl(`/api/medicines/${m.id}/photo`) : null,
          pharmacyId: m.pharmacyId,
          pharmacyName: m.pharmacyName,
          pharmacyPhone: m.pharmacyPhone,
          pharmacyAddress: m.pharmacyAddress,
        }));
      }
    }

    if (specRes.ok) {
      const sData = await specRes.json();
      const list = Array.isArray(sData) ? sData : sData?.specialists || [];
      if (list.length > 0) {
        const spec = list[0];
        initialSpecialist = {
          id: spec.id,
          name: spec.name,
          phone: spec.phone,
          specialty: spec.specialty,
          experienceYears: spec.experienceYears,
          ratingAvg: spec.ratingAvg,
          role: spec.role,
        };
      }
    }
  } catch {
    // Tarmoq xatosi bo'lsa HomeClientView o'zidagi standart Bento Max va Veterinar fallback'ini ishlatadi
  }

  return (
    <HomeClientView
      initialMedicines={initialMedicines}
      initialSpecialist={initialSpecialist}
    />
  );
}
