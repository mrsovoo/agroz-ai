"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Navigation,
  Phone,
  Pill,
  Stethoscope,
  UserRound,
  Loader2,
  AlertTriangle,
  Map,
} from "lucide-react";

type Stock = { medicine: string; status: string; price: number | null };

type Pharmacy = {
  id: number;
  name: string;
  kind: string;
  lat: number;
  lng: number;
  phone: string;
  address: string;
  distanceKm: number | null;
  stock: Stock[];
};

type Specialist = {
  id: number;
  name: string;
  phone: string;
  role: string;
  specialty: string | null;
  organization: string | null;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number | null;
};

function directionsUrl(lat: number, lng: number, from: { lat: number; lng: number } | null) {
  const origin = from ? `&origin=${from.lat},${from.lng}` : "";
  return `https://www.google.com/maps/dir/?api=1${origin}&destination=${lat},${lng}&travelmode=driving`;
}

export default function NearbyHelp({
  category,
  medicines,
  severity,
}: {
  category: "crop" | "animal";
  medicines: string[];
  severity: string | null;
}) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [locError, setLocError] = useState<string | null>(null);

  const kind = category === "crop" ? "agro" : "vet";

  useEffect(() => {
    const fallback = () => {
      setCoords({ lat: 41.3111, lng: 69.2797 });
      setLocError("Lokatsiya ruxsati berilmagan — Toshkent markazi bo'yicha ko'rsatilmoqda");
    };
    if (!navigator.geolocation) {
      fallback();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocError(null);
      },
      fallback,
      { maximumAge: 5 * 60 * 1000, timeout: 8000, enableHighAccuracy: false },
    );
  }, []);

  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    setLoading(true);

    // Dorixonalar: shu turdagi (agro/vet) va tavsiya etilgan dorilari borlari.
    const p = new URLSearchParams({ lat: String(coords.lat), lng: String(coords.lng), kind });
    medicines.forEach((m) => p.append("med", m));
    const s = new URLSearchParams({ lat: String(coords.lat), lng: String(coords.lng) });

    Promise.all([
      fetch(`/api/pharmacies?${p.toString()}`)
        .then((r) => r.json())
        .then((d: { items?: Pharmacy[] }) => (Array.isArray(d?.items) ? d.items : []))
        .catch(() => [] as Pharmacy[]),
      fetch(`/api/specialists?${s.toString()}`)
        .then((r) => r.json())
        .then((d: { items?: Specialist[] }) => (Array.isArray(d?.items) ? d.items : []))
        .catch(() => [] as Specialist[]),
    ])
      .then(([ph, sp]) => {
        if (cancelled) return;
        setPharmacies(ph);
        setSpecialists(sp);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, kind, medicines.join("|")]);

  const topPharmacies = pharmacies.slice(0, 3);
  const topSpecialists = specialists.slice(0, 3);

  // Mutaxassis qachon kerak: holat jiddiy, yoki dorixona topilmadi,
  // yoki tavsiya etilgan dorilarning birortasi ham yaqin atrofda yo'q.
  const anyMedicineAvailable = pharmacies.some((p) => p.stock.some((st) => st.status === "bor"));
  const needsSpecialist =
    severity === "yuqori" || pharmacies.length === 0 || (medicines.length > 0 && !anyMedicineAvailable);

  const mapQuery = new URLSearchParams({ kind });
  medicines.forEach((m) => mapQuery.append("med", m));

  return (
    <div>
      {locError && (
        <p className="mt-3 rounded-2xl bg-[var(--brand-yellow-soft)] p-2.5 px-3 text-[12px] font-medium text-[var(--brand-ink)]">
          {locError}
        </p>
      )}

      {/* Yaqin dorixonalar */}
      <p className="ios-section-title mt-5 flex items-center gap-1.5">
        <MapPin size={14} /> Yaqin dorixonalar (5 km)
      </p>
      <section className="ios-card">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="animate-spin text-[var(--brand-green)]" size={22} />
          </div>
        ) : topPharmacies.length === 0 ? (
          <p className="p-4 text-[14px] text-[var(--brand-muted)]">
            {kind === "agro" ? "Agro" : "Veterinariya"} dorixona 5 km ichida topilmadi.
          </p>
        ) : (
          <ul>
            {topPharmacies.map((p) => (
              <li
                key={p.id}
                className="border-b border-[var(--brand-sep)] px-4 py-3.5 last:border-b-0"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-[var(--brand-ink)]">{p.name}</p>
                    <p className="mt-0.5 flex items-start gap-1 text-[12.5px] text-[var(--brand-muted)]">
                      <MapPin size={12} className="mt-0.5 shrink-0" />
                      <span className="line-clamp-1">{p.address}</span>
                    </p>
                  </div>
                  {p.distanceKm !== null && (
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                      style={{ background: "var(--brand-green)" }}
                    >
                      {p.distanceKm.toFixed(1)} km
                    </span>
                  )}
                </div>

                {p.stock.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.stock.slice(0, 4).map((s) => (
                      <span
                        key={s.medicine}
                        className="rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                        style={
                          s.status === "bor"
                            ? { background: "var(--brand-green-soft)", color: "var(--brand-green)" }
                            : { background: "var(--brand-red-soft)", color: "#d7263d" }
                        }
                      >
                        {s.medicine.split(" ")[0]} · {s.status === "bor" ? "Bor" : "Yo'q"}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-2.5 flex gap-2">
                  <a
                    href={`tel:${p.phone.replace(/\s/g, "")}`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-bold text-white"
                    style={{ background: "var(--brand-green)" }}
                  >
                    <Phone size={13} /> Qo&apos;ng&apos;iroq
                  </a>
                  <a
                    href={directionsUrl(p.lat, p.lng, coords)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--brand-ink)] py-2.5 text-[13px] font-bold text-white"
                  >
                    <Navigation size={13} /> Yo&apos;nalish
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href={`/xarita?${mapQuery.toString()}`} className="mt-3 block">
        <button className="ios-btn yellow" style={{ padding: "16px", fontSize: 16 }}>
          <Map size={18} /> Xaritada hammasini ko&apos;rish
        </button>
      </Link>

      {/* Mutaxassis tavsiyasi */}
      {(needsSpecialist || topSpecialists.length > 0) && (
        <>
          <p className="ios-section-title mt-6 flex items-center gap-1.5">
            <Stethoscope size={14} /> {needsSpecialist ? "Mutaxassis tavsiya etiladi" : "Yaqin mutaxassislar"}
          </p>
          {needsSpecialist && (
            <p className="mb-2 flex items-start gap-2 rounded-2xl bg-[var(--brand-red-soft)] p-3 text-[13px] font-medium text-[#d7263d]">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>
                Holat jiddiy yoki kerakli dori yaqin atrofda topilmadi — mutaxassisga murojaat qilishni
                tavsiya qilamiz.
              </span>
            </p>
          )}

          <section className="ios-card">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="animate-spin text-[var(--brand-green)]" size={22} />
              </div>
            ) : topSpecialists.length === 0 ? (
              <p className="p-4 text-[14px] text-[var(--brand-muted)]">
                5 km ichida ro&apos;yxatdan o&apos;tgan mutaxassis topilmadi.
              </p>
            ) : (
              <ul>
                {topSpecialists.map((s) => (
                  <li
                    key={s.id}
                    className="border-b border-[var(--brand-sep)] px-4 py-3.5 last:border-b-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-2.5">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                          style={{ background: "var(--brand-green-soft)", color: "var(--brand-green)" }}
                        >
                          <UserRound size={17} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[15px] font-bold text-[var(--brand-ink)]">
                            {s.organization ?? s.name}
                          </p>
                          <p className="text-[12.5px] text-[var(--brand-muted)]">
                            {s.specialty ?? (s.role === "pharmacy" ? "Dorixona egasi" : "Mutaxassis")}
                          </p>
                          <p className="mt-0.5 line-clamp-1 text-[12px] text-[var(--brand-muted)]">
                            {s.address}
                          </p>
                        </div>
                      </div>
                      {s.distanceKm !== null && (
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                          style={{ background: "var(--brand-green)" }}
                        >
                          {s.distanceKm.toFixed(1)} km
                        </span>
                      )}
                    </div>
                    <div className="mt-2.5 flex gap-2">
                      <a
                        href={`tel:${s.phone.replace(/\s/g, "")}`}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-bold text-white"
                        style={{ background: "var(--brand-green)" }}
                      >
                        <Phone size={13} /> Qo&apos;ng&apos;iroq
                      </a>
                      <a
                        href={directionsUrl(s.lat, s.lng, coords)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--brand-ink)] py-2.5 text-[13px] font-bold text-white"
                      >
                        <Navigation size={13} /> Yo&apos;nalish
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Link href="/mutaxassislar" className="mt-3 block">
            <button className="ios-btn secondary" style={{ padding: "15px", fontSize: 15 }}>
              <Pill size={16} /> Barcha mutaxassislar
            </button>
          </Link>
        </>
      )}
    </div>
  );
}
