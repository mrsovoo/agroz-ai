import HomeClientView, { type HomeMedicine, type HomeSpecialist } from "@/components/HomeClientView";
import { apiUrl } from "@/lib/api-config";

// Doimiy jonli va tasodifiy yangilanish uchun
export const dynamic = "force-dynamic";

function isVeterinarian(s: HomeSpecialist): boolean {
  return (
    s.helpsWith === "animal" ||
    Boolean(s.specialty && /veterinar|chorva|parranda|hayvon/i.test(s.specialty)) ||
    Boolean(s.bio && /veterinar|chorva|parranda|hayvon/i.test(s.bio))
  );
}

function selectTopSpecialists(specs: HomeSpecialist[]): HomeSpecialist[] {
  const sorted = [...specs].sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
  const vets = sorted.filter((s) => isVeterinarian(s));
  const agrs = sorted.filter((s) => !isVeterinarian(s));

  // 1. Eng yaqin agronom (avval bo'sh bo'lganlari)
  const bestAgr = agrs.find((s) => !s.isBusy) || agrs[0];

  // 2. Eng yaqin veterinar (avval bo'sh bo'lganlari)
  const bestVet = vets.find((s) => !s.isBusy) || vets[0];

  const result: HomeSpecialist[] = [];
  if (bestAgr) result.push(bestAgr);
  if (bestVet && (!bestAgr || bestVet.id !== bestAgr.id)) result.push(bestVet);

  return result.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
}

export default async function HomePage() {
  let initialMedicines: HomeMedicine[] = [];
  let initialSpecialists: HomeSpecialist[] = [];

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
      const specsOnly = list.filter((s: any) => s.role === "specialist" || (s.role !== "pharmacy" && !s.organization));
      
      const mappedSpecs: HomeSpecialist[] = specsOnly.map((spec: any) => ({
        id: spec.id,
        name: spec.name,
        phone: spec.phone,
        specialty: spec.specialty,
        education: spec.education ?? null,
        bio: spec.bio ?? null,
        helpsWith: spec.helpsWith ?? "both",
        experienceYears: spec.experienceYears ?? null,
        ratingAvg: spec.ratingAvg ?? null,
        ratingCount: spec.ratingCount ?? 0,
        role: spec.role || "specialist",
        address: spec.address || "O'zbekiston",
        lat: spec.lat ?? 41.3111,
        lng: spec.lng ?? 69.2797,
        workHours: spec.workHours ?? null,
        isBusy: Boolean(spec.isBusy),
        distanceKm: spec.distanceKm ?? null,
      }));

      initialSpecialists = selectTopSpecialists(mappedSpecs);

      // Agro-do'konlardagi barcha agro-mahsulotlarni ham to'liq qo'shib olish
      for (const p of list) {
        if (Array.isArray(p.medicines)) {
          for (const m of p.medicines) {
            if (m.status === "yoq") continue;
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

    initialMedicines = Array.from(medMap.values()).sort((a, b) => b.id - a.id).slice(0, 4);
  } catch {
    // Tarmoq xatosi bo'lsa HomeClientView o'zidagi standart fallback'ini ishlatadi
  }

  return (
    <HomeClientView
      initialMedicines={initialMedicines}
      initialSpecialists={initialSpecialists}
    />
  );
}

