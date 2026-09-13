"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Navigation,
  Phone,
  Stethoscope,
  UserRound,
  Loader2,
  AlertTriangle,
  Map,
  Store,
  Pill,
} from "lucide-react";
import { CONFIDENCE_THRESHOLD } from "@/lib/constants";

type Stock = { medicine: string; status: string; price: number | null };
type Medicine = { id: number; name: string; status: string; hasPhoto: boolean };

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
  medicines: Medicine[];
};

/** Dorixona kartasi — bot orqali ro'yxatdan o'tgan va eski (seed) dorixonalar uchun umumiy. */
type PharmacyEntry = {
  key: string;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  distanceKm: number | null;
  medicines: Medicine[];
  stock: Stock[];
  registered: boolean;
};

function directionsUrl(lat: number, lng: number, from: { lat: number; lng: number } | null) {
  const origin = from ? `&origin=${from.lat},${from.lng}` : "";
  return `https://www.google.com/maps/dir/?api=1${origin}&destination=${lat},${lng}&travelmode=driving`;
}

export default function NearbyHelp({
  category,
  medicines,
  severity,
  confidence,
}: {
  category: "crop" | "animal";
  medicines: string[];
  severity: string | null;
  confidence: number | null;
}) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [locError, setLocError] = useState<string | null>(null);

  const kind = category === "crop" ? "agro" : "vet";
  const medsKey = medicines.join("|");

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

    // Tashxis bo'yicha tavsiya etilgan dorilar — dorixonalar shu dorilar bilan qidiriladi.
    const p = new URLSearchParams({ lat: String(coords.lat), lng: String(coords.lng), kind });
    medicines.forEach((m) => p.append("med", m));
    const s = new URLSearchParams({ lat: String(coords.lat), lng: String(coords.lng) });
    medicines.forEach((m) => s.append("med", m));

    Promise.all([
      fetch(`/api/pharmacies?${p.toString()}`)
        .then((r) => r.json())
        .then((d: { items?: Pharmacy[] }) => (Array.isArray(d?.items) ? d.items : []))
        .catch(() => [] as Pharmacy[]),
      // Bot orqali ro'yxatdan o'tgan mutaxassis va dorixona egalari (dorilari bilan).
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
  }, [coords, kind, medsKey]);

  // Ro'yxatdan o'tgan dorixona egalari + eski dorixonalar — bitta ro'yxatda.
  const pharmacyEntries: PharmacyEntry[] = useMemo(() => {
    const registered = specialists
      .filter((s) => s.role === "pharmacy")
      .map((s) => ({
        key: `s-${s.id}`,
        name: s.organization ?? s.name,
        address: s.address,
        phone: s.phone,
        lat: s.lat,
        lng: s.lng,
        distanceKm: s.distanceKm,
        medicines: s.medicines ?? [],
        stock: [] as Stock[],
        registered: true,
      }));
    const legacy = pharmacies.map((p) => ({
      key: `p-${p.id}`,
      name: p.name,
      address: p.address,
      phone: p.phone,
      lat: p.lat,
      lng: p.lng,
      distanceKm: p.distanceKm,
      medicines: [] as Medicine[],
      stock: p.stock ?? [],
      registered: false,
    }));
    return [...registered, ...legacy].sort(
      (a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999),
    );
  }, [specialists, pharmacies]);

  const topPharmacies = pharmacyEntries.slice(0, 3);
  // Mutaxassislar ro'yxati — dorixona egalarisiz.
  const topSpecialists = specialists.filter((s) => s.role !== "pharmacy").slice(0, 3);

  const anyMedicineAvailable = pharmacyEntries.some(
    (p) =>
      p.medicines.some((m) => m.status === "bor") || p.stock.some((st) => st.status === "bor"),
  );
  const lowConfidence = confidence !== null && confidence < CONFIDENCE_THRESHOLD;

  // Mutaxassis qachon kerak: AI ishonchi past, holat jiddiy, dorixona topilmadi
  // yoki tavsiya etilgan dorilarning birortasi ham yaqin atrofda yo'q.
  const needsSpecialist =
    lowConfidence ||
    severity === "yuqori" ||
    pharmacyEntries.length === 0 ||
    (medicines.length > 0 && !anyMedicineAvailable);

  const mapQuery = new URLSearchParams({ kind });
  medicines.forEach((m) => mapQuery.append("med", m));

  return (
    <div>
      {locError && (
        <p className="mt-3 rounded-2xl bg-[var(--brand-yellow-soft)] p-2.5 px-3 text-[12px] font-medium text-[var(--brand-ink)]">
          {locError}
        </p>
      )}

      {/* AI ishonchi */}
      {confidence !== null && (
        <div
          className="mt-3 flex items-start gap-2 rounded-2xl p-3 text-[13px] font-medium"
          style={
            lowConfidence
              ? { background: "var(--brand-red-soft)", color: "#d7263d" }
              : { background: "var(--brand-green-soft)", color: "var(--brand-green)" }
          }
        >
          <Pill size={15} className="mt-0.5 shrink-0" />
          <span>
            <b>AI ishonchi: {confidence}%</b>
            {lowConfidence
              ? " — bu 80% dan past. Aniqroq tashxis uchun mutaxassisga murojaat qilishni tavsiya qilamiz."
              : " — tashxis yetarlicha ishonchli."}
          </span>
        </div>
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
                key={p.key}
                className="border-b border-[var(--brand-sep)] px-4 py-3.5 last:border-b-0"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                      style={{ background: "var(--brand-green-soft)", color: "var(--brand-green)" }}
                    >
                      <Store size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold text-[var(--brand-ink)]">{p.name}</p>
                      <p className="mt-0.5 flex items-start gap-1 text-[12.5px] text-[var(--brand-muted)]">
                        <MapPin size={12} className="mt-0.5 shrink-0" />
                        <span className="line-clamp-1">{p.address}</span>
                      </p>
                    </div>
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

                {/* Bot orqali qo'shilgan dorilar — rasmi bilan */}
                {p.medicines.length > 0 && (
                  <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1">
                    {p.medicines.slice(0, 6).map((m) => (
                      <div key={m.id} className="w-[68px] shrink-0">
                        {m.hasPhoto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/medicines/${m.id}/photo`}
                            alt={m.name}
                            className="h-[68px] w-[68px] rounded-xl object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="flex h-[68px] w-[68px] items-center justify-center rounded-xl"
                            style={{ background: "var(--brand-green-soft)", color: "var(--brand-green)" }}
                          >
                            <Pill size={22} />
                          </div>
                        )}
                        <p className="mt-1 line-clamp-2 text-[10.5px] font-semibold leading-tight text-[var(--brand-ink)]">
                          {m.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

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
            <Stethoscope size={14} />{" "}
            {needsSpecialist ? "Mutaxassis tavsiya etiladi" : "Yaqin mutaxassislar"}
          </p>
          {needsSpecialist && (
            <p className="mb-2 flex items-start gap-2 rounded-2xl bg-[var(--brand-red-soft)] p-3 text-[13px] font-medium text-[#d7263d]">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>
                {lowConfidence
                  ? `AI ishonchi ${confidence}% — 80% dan past. Aniq tashxis uchun mutaxassisga murojaat qiling.`
                  : "Holat jiddiy yoki kerakli dori yaqin atrofda topilmadi — mutaxassisga murojaat qilishni tavsiya qilamiz."}
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
                            {s.specialty ?? "Mutaxassis"}
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
              <Stethoscope size={16} /> Barcha mutaxassislar
            </button>
          </Link>
        </>
      )}
    </div>
  );
}
