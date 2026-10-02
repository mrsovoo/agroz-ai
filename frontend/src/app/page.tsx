import HomeClientView, { type HomeMedicine, type HomeSpecialist } from "@/components/HomeClientView";
import { apiUrl } from "@/lib/api-config";

// Edge CDN kesh: Sahifa Edge keshidan 50ms da tezkor yuklanadi va har 60 soniyada fonda yangilanadi
export const revalidate = 60;

export default async function HomePage() {
  let initialMedicines: HomeMedicine[] = [];
  let initialSpecialist: HomeSpecialist | null = null;

  try {
    const fetchOptions: RequestInit = {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(2000), // Server kechiksa ham foydalanuvchini kutdirmaydi
    } as any;

    const [medRes, specRes] = await Promise.allSettled([
      fetch(apiUrl("/api/medicines?limit=60&random=1"), fetchOptions),
      fetch(apiUrl("/api/specialists"), fetchOptions),
    ]);

    const medMap = new Map<number, HomeMedicine>();

    if (medRes.status === "fulfilled" && medRes.value.ok) {
      const data = await medRes.value.json();
      if (Array.isArray(data) && data.length > 0) {
        for (const m of data) {
          medMap.set(m.id, {
            id: m.id,
            name: m.name,
            type: m.type,
            usage: m.usage,
            price: m.price,
            stockUnit: m.stockUnit,
            hasPhoto: m.hasPhoto,
            photoVersion: m.photoVersion,
            photoUrl: m.hasPhoto ? apiUrl(`/api/medicines/${m.id}/photo`) : null,
            pharmacyId: m.pharmacyId,
            pharmacyName: m.pharmacyName,
            pharmacyPhone: m.pharmacyPhone,
            pharmacyAddress: m.pharmacyAddress,
          });
        }
      }
    }

    if (specRes.status === "fulfilled" && specRes.value.ok) {
      const sData = await specRes.value.json();
      const list = Array.isArray(sData) ? sData : (sData?.items || sData?.specialists || []);
      const specsOnly = list.filter((s: any) => s.role === "specialist");
      if (specsOnly.length > 0) {
        const spec = specsOnly[0];
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

      // Agro-do&apos;konlardagi barcha agro-mahsulotlarni ham to'liq qo'shib olish (birorta agro-mahsulot qolib ketmasligi uchun)
      for (const p of list) {
        if (Array.isArray(p.medicines)) {
          for (const m of p.medicines) {
            if (m.status === "yoq" || m.status === "qoralama" || !m.price || m.price <= 0 || !m.hasPhoto) continue;
            if (!medMap.has(m.id)) {
              medMap.set(m.id, {
                id: m.id,
                name: m.name,
                type: m.type,
                usage: m.usage,
                price: m.price,
                stockUnit: m.stockUnit,
                hasPhoto: Boolean(m.hasPhoto),
                photoVersion: m.photoVersion,
                photoUrl: m.hasPhoto ? apiUrl(`/api/medicines/${m.id}/photo`) : null,
                pharmacyId: p.id,
                pharmacyName: p.organization || p.name,
                pharmacyPhone: p.phone,
                pharmacyAddress: p.address,
              });
            }
          }
        }
      }
    }

    initialMedicines = Array.from(medMap.values()).sort((a, b) => b.id - a.id);
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

