"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Map as LeafletMap, Marker, Circle } from "leaflet";
import {
  LocateFixed,
  Navigation,
  Phone,
  X,
  Sprout,
  PawPrint,
  Clock,
  ChevronRight,
  MapPin,
  Loader2,
  UserRound,
  Pill,
  RefreshCw,
  Lock,
} from "lucide-react";
import { RADIUS_OPTIONS } from "@/lib/constants";

type Stock = { medicine: string; status: string; price: number | null };
type Medicine = { id: number; name: string; status: string; hasPhoto: boolean };

type Place = {
  /** Dorixona id'lari bilan to'qnashmasligi uchun mutaxassislar manfiy id oladi. */
  id: number;
  name: string;
  kind: string;
  lat: number;
  lng: number;
  phone: string;
  address: string;
  specialist: string | null;
  workHours: string | null;
  distanceKm: number | null;
  /** Radiusdan tashqarida — yo'nalish o'rniga qulf chiqadi. */
  locked?: boolean;
  ratingAvg?: number | null;
  ratingCount?: number;
  stock: Stock[];
  /** Dorixona egasi bot orqali qo'shgan dorilar (rasmi bilan). */
  medicines: Medicine[];
};

/** Filtr tugmalari va xarita sarlavhasi bir joyda — nomlar chalkashmasligi uchun. */
const KINDS: { v: string; l: string; title: string }[] = [
  { v: "all", l: "Hammasi", title: "Xarita" },
  { v: "agro", l: "Agro", title: "Agro dorixonalar" },
  { v: "vet", l: "Veterinar", title: "Veterinariya dorixonalari" },
  { v: "specialist", l: "Mutaxassis", title: "Mutaxassislar" },
];

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
  workHours: string | null;
  distanceKm: number | null;
  locked: boolean;
  ratingAvg: number | null;
  ratingCount: number;
  medicines?: Medicine[];
};

const GLYPH = {
  agro: '<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>',
  vet: '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>',
  specialist:
    '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
  general:
    '<path d="M10.5 20.5 21 10a2.83 2.83 0 0 0-4-4L6.5 16.5 5 21.5l5-1z"/><path d="M15.5 6.5 19 10"/>',
};

function pinSvg(kind: "agro" | "vet" | "specialist" | "general", hasWanted: boolean) {
  const color =
    kind === "vet"
      ? "#b45309"
      : kind === "specialist"
        ? "#2563eb"
        : kind === "general"
          ? "#0d9488"
          : "#028e11";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 36 46" style="filter:drop-shadow(0 5px 8px rgba(0,0,0,0.35))">
    <path d="M18 1C8.6 1 1 8.6 1 18c0 12.3 15.1 26.1 16.3 27.2a1.1 1.1 0 0 0 1.4 0C19.9 44.1 35 30.3 35 18 35 8.6 27.4 1 18 1z" fill="${color}" stroke="#fff" stroke-width="2"/>
    <svg x="8" y="7" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${GLYPH[kind]}</svg>
    ${
      hasWanted
        ? `<circle cx="29" cy="9" r="7" fill="#fcbd00" stroke="#fff" stroke-width="1.5"/>
           <svg x="25.5" y="5.5" width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#323232" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
        : ""
    }
  </svg>`;
}

export default function MapClient() {
  const search = useSearchParams();
  const router = useRouter();
  const meds = useMemo(() => search.getAll("med"), [search]);
  const kindParam = search.get("kind") ?? "all";
  const focusId = search.get("focus");

  const [kind, setKind] = useState(kindParam);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selected, setSelected] = useState<Place | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [locError, setLocError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number>(5);

  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const userMarkerRef = useRef<Marker | null>(null);
  const accuracyRef = useRef<Circle | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const hasCenteredRef = useRef(false);

  // ---- Geolocation: bir marta o'qish ----
  // watchPosition kuchsiz telefonlarda GPS'ni doimiy ishlatib, batareyani yeydi va
  // har o'zgarishda API'ga so'rov yuborardi. Endi faqat bir marta olamiz; aniqroq
  // joylashuv kerak bo'lsa "mening joyim" tugmasi bor.
  useEffect(() => {
    const fallback = () => {
      setCoords({ lat: 41.3111, lng: 69.2797 });
      setLocError("Lokatsiya ruxsati berilmagan — Toshkent ko'rsatilmoqda");
    };

    if (!navigator.geolocation) {
      fallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLocError(null);
      },
      fallback,
      { maximumAge: 5 * 60 * 1000, timeout: 8000, enableHighAccuracy: false },
    );
  }, []);

  // ---- Fetch dorixonalar + mutaxassislar ----
  // Ikkisi bitta xaritada ko'rsatiladi; filtrlar esa client tomonda qo'llanadi.
  useEffect(() => {
    const pharmacyParams = new URLSearchParams();
    const specialistParams = new URLSearchParams();
    if (coords) {
      for (const p of [pharmacyParams, specialistParams]) {
        p.set("lat", String(coords.lat));
        p.set("lng", String(coords.lng));
        p.set("radius", String(radiusKm));
      }
    }
    meds.forEach((m) => pharmacyParams.append("med", m));
    // Eski so'rov javobi yangisini bosib ketmasligi uchun "cancelled" bayrog'i.
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch(`/api/pharmacies?${pharmacyParams.toString()}`)
        .then((r) => r.json())
        .then((d: { items?: Place[] }) => (Array.isArray(d?.items) ? d.items : []))
        .catch(() => [] as Place[]),
      fetch(`/api/specialists?${specialistParams.toString()}`)
        .then((r) => r.json())
        .then((d: { items?: Specialist[] }) => (Array.isArray(d?.items) ? d.items : []))
        .catch(() => [] as Specialist[]),
    ])
      .then(([pharmacies, specialists]) => {
        if (cancelled) return;
        // Ro'yxatdan o'tgan dorixona egalari ham "dorixona" bo'lib chiqadi —
        // ularning turi (agro/vet/umumiy) mutaxassislik maydonida saqlanadi.
        // Umumiy dorixonalar har ikkala filtrda (agro ham, vet ham) ko'rinadi.
        const mapped: Place[] = specialists.map((s) => ({
          id: -s.id,
          name: s.organization ?? s.name,
          // Botda turi matn sifatida saqlanadi: "Agro dorixona" | "Vet dorixona" |
          // "Umumiy dorixona". Shunga qarab xarita turi aniqlanadi.
          kind: s.role === "pharmacy"
            ? s.specialty?.startsWith("Vet")
              ? "vet"
              : s.specialty?.startsWith("Umumiy")
                ? "general"
                : "agro"
            : "specialist",
          lat: s.lat,
          lng: s.lng,
          phone: s.phone,
          address: s.address,
          specialist:
            s.role === "pharmacy"
              ? `${s.specialty ?? "Dorixona"} · ${s.name}`
              : (s.specialty ?? s.name),
          workHours: s.workHours,
          distanceKm: s.distanceKm,
          locked: s.locked,
          ratingAvg: s.ratingAvg,
          ratingCount: s.ratingCount,
          stock: [],
          medicines: s.medicines ?? [],
        }));
        setPlaces([
          ...pharmacies.map((p) => ({ ...p, medicines: p.medicines ?? [] })),
          ...mapped,
        ]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [coords, meds, radiusKm]);

  // Tanlangan tur bo'yicha filtr (kind=all bo'lsa hammasi).
  const items = useMemo(
    () =>
      kind === "all"
        ? places
        : places.filter(
            (p) =>
              p.kind === kind ||
              // "Umumiy dorixona" ikkala filtrda (agro ham, vet ham) ko'rinadi.
              ((kind === "agro" || kind === "vet") && p.kind === "general"),
          ),
    [places, kind],
  );

  // ---- Init Leaflet map once ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;
      if (mapRef.current) return;
      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([41.3111, 69.2797], 6);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      mapRef.current = map;
      setMapReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Center on user once we have coords ----
  useEffect(() => {
    if (mapReady && coords && !hasCenteredRef.current) {
      hasCenteredRef.current = true;
      mapRef.current?.setView([coords.lat, coords.lng], 14);
    }
  }, [mapReady, coords]);

  // ---- Draw markers + user dot ----
  useEffect(() => {
    if (!mapReady) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapRef.current) return;
      const map = mapRef.current;

      // user dot
      userMarkerRef.current?.remove();
      accuracyRef.current?.remove();
      if (coords) {
        const icon = L.divIcon({
          className: "",
          html: '<div class="my-location-dot"><span class="pulse"></span><span class="core"></span></div>',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        userMarkerRef.current = L.marker([coords.lat, coords.lng], { icon, interactive: false }).addTo(map);
        if (coords.accuracy && Number.isFinite(coords.accuracy)) {
          accuracyRef.current = L.circle([coords.lat, coords.lng], {
            radius: Math.min(coords.accuracy, 2000),
            color: "#2997ff",
            weight: 1,
            fillColor: "#2997ff",
            fillOpacity: 0.1,
          }).addTo(map);
        }
      }

      // pharmacy pins
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      items.forEach((p) => {
        // Sariq "bor" belgisi: eski dorixona omborida ham, dorixona egasi bot orqali
        // qo'shgan va qidirilayotgan dorilarda ham ishlaydi.
        const hasWanted =
          meds.length > 0 &&
          (p.stock.some((s) => s.status === "bor") ||
            p.medicines.some(
              (m) =>
                m.status === "bor" &&
                meds.some((w) => m.name.toLowerCase().includes(w.toLowerCase())),
            ));
        const pinKind =
          p.kind === "vet"
            ? "vet"
            : p.kind === "specialist"
              ? "specialist"
              : p.kind === "general"
                ? "general"
                : "agro";
        const icon = L.divIcon({
          className: "",
          html: pinSvg(pinKind, hasWanted),
          iconSize: [40, 52],
          iconAnchor: [20, 50],
        });
        const marker = L.marker([p.lat, p.lng], { icon }).addTo(map);
        marker.on("click", () => selectPharmacy(p));
        markersRef.current.push(marker);
      });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, items, coords]);

  // ---- Handle ?focus=X ----
  useEffect(() => {
    if (!focusId || items.length === 0) return;
    const f = items.find((i) => i.id === Number(focusId));
    if (f) selectPharmacy(f, { smooth: false });
  }, [items, focusId]);

  function selectPharmacy(p: Place, opts?: { smooth?: boolean }) {
    setSelected(p);
    mapRef.current?.flyTo([p.lat, p.lng], 15, { duration: 0.55 });
    setTimeout(() => {
      const el = document.getElementById(`pharm-${p.id}`);
      el?.scrollIntoView({ behavior: opts?.smooth === false ? "auto" : "smooth", block: "center" });
    }, 120);
  }

  function centerMe() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
        setCoords(c);
        mapRef.current?.flyTo([c.lat, c.lng], 15, { duration: 0.5 });
      },
      () => setLocError("Lokatsiya ruxsati berilmagan"),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  function openDirections(p: Place) {
    const ua = navigator.userAgent;
    const apple = /iPad|iPhone|iPod/.test(ua);
    const origin = coords ? `${coords.lat},${coords.lng}` : "";
    const url = apple
      ? `maps://?${origin ? `saddr=${origin}&` : ""}daddr=${p.lat},${p.lng}&dirflg=d`
      : `https://www.google.com/maps/dir/?api=1${origin ? `&origin=${origin}` : ""}&destination=${p.lat},${p.lng}&travelmode=driving`;
    window.open(url, "_blank", "noopener");
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="px-5 pt-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="ios-sub">Geo-qidiruv · {radiusKm} km</p>
            <h1 className="ios-title">
              {(KINDS.find((k) => k.v === kind) ?? KINDS[0]).title}
            </h1>
            {meds.length > 0 && (
              <p className="mt-1 text-[13px] font-medium text-[var(--brand-green)]">
                Qidirilmoqda: <b>{meds.join(", ")}</b>
              </p>
            )}
          </div>
          <button
            onClick={centerMe}
            aria-label="Mening joylashuvim"
            className="mt-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--brand-green)] shadow-sm active:scale-95"
          >
            <LocateFixed size={20} />
          </button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {KINDS.map((f) => {
            const active = kind === f.v;
            return (
              <button
                key={f.v}
                onClick={() => setKind(f.v)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition active:scale-95 ${
                  active ? "text-white" : "bg-white text-[var(--brand-ink)] shadow-sm"
                }`}
                style={active ? { background: "var(--brand-green)" } : undefined}
              >
                {f.v === "agro" && <Sprout size={14} />}
                {f.v === "vet" && <PawPrint size={14} />}
                {f.v === "specialist" && <UserRound size={14} />}
                {f.l}
              </button>
            );
          })}
        </div>

        {/* Radius tanlash — 5 km bo'sh bo'lsa 10/25 km ga kengaytirish mumkin. */}
        <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="shrink-0 text-[12px] font-bold text-[var(--brand-muted)]">Radius:</span>
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRadiusKm(r)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition active:scale-95 ${
                radiusKm === r ? "text-white" : "bg-white text-[var(--brand-ink)] shadow-sm"
              }`}
              style={radiusKm === r ? { background: "var(--brand-ink)" } : undefined}
            >
              {r} km
            </button>
          ))}
        </div>

        {/* Xaritadagi belgilar izohi — nima ko'rinayotganini tushuntiradi */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1 text-[11.5px] font-bold text-[var(--brand-muted)]">
          {[
            { c: "#028e11", l: "Agro dorixona", show: true },
            { c: "#b45309", l: "Veterinariya dorixonasi", show: true },
            { c: "#0d9488", l: "Umumiy dorixona", show: true },
            { c: "#2563eb", l: "Mutaxassis", show: true },
          ]
            .filter((x) => x.show)
            .map((x) => (
              <span key={x.l} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10"
                  style={{ background: x.c }}
                />
                {x.l}
              </span>
            ))}
        </div>
        {locError && (
          <p className="mt-2 rounded-2xl bg-[var(--brand-yellow-soft)] p-2.5 px-3 text-[12px] font-medium text-[var(--brand-ink)]">
            {locError}
          </p>
        )}
      </div>

      <div className="web:grid web:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] web:items-start web:gap-8 web:px-5 web:pt-2">
      {/* Map */}
      <div className="relative mx-5 mt-4 h-[360px] overflow-hidden rounded-[24px] shadow-sm web:sticky web:top-24 web:mx-0 web:mt-0 web:h-[620px]">
        <div ref={containerRef} className="h-full w-full" />
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#e8ecf1]">
            <Loader2 className="animate-spin text-[var(--brand-green)]" size={28} />
          </div>
        )}
        <button
          onClick={centerMe}
          aria-label="Joylashuvimga qaytish"
          className="absolute right-3 top-3 z-[500] flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--brand-green)] shadow-md active:scale-95"
        >
          <LocateFixed size={18} />
        </button>
        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[12px] font-bold text-[var(--brand-ink)] shadow-sm backdrop-blur">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute h-full w-full animate-ping rounded-full bg-blue-500 opacity-60" />
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          </span>
          Sizning joyingiz
        </div>
      </div>

      <div className="web:min-w-0">
      {/* List header */}
      <div className="mt-5 flex items-center justify-between px-5 web:mt-0 web:px-0">
        <p className="text-[13px] font-bold text-[var(--brand-muted)]">
          {loading ? "Yuklanmoqda..." : `${items.length} ta nuqta topildi`}
        </p>
        {meds.length > 0 && (
          <button
            onClick={() => router.push("/xarita")}
            className="text-[12px] font-bold text-[var(--brand-green)]"
          >
            Filter tozalash
          </button>
        )}
      </div>

      <ul
        ref={listRef}
        className="mx-5 mb-4 mt-2 space-y-3 web:mx-0 web:mt-3 web:max-h-[calc(100dvh-270px)] web:overflow-y-auto web:pr-2 web:[scrollbar-gutter:stable]"
      >
        {items.slice(0, 30).map((p) => {
          const isSelected = selected?.id === p.id;
          return (
            <li
              key={p.id}
              id={`pharm-${p.id}`}
              onClick={() => selectPharmacy(p)}
              className={`cursor-pointer rounded-[22px] bg-white p-4 shadow-sm transition ${
                isSelected ? "ring-2 ring-[var(--brand-yellow)]" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
                    style={{
                      background: "var(--brand-green-soft)",
                      color: "var(--brand-green)",
                      ...(p.kind === "vet"
                        ? { background: "var(--brand-yellow-soft)", color: "var(--brand-ink)" }
                        : {}),
                      ...(p.kind === "specialist"
                        ? { background: "#dbeafe", color: "#2563eb" }
                        : {}),
                      ...(p.kind === "general"
                        ? { background: "#ccfbf1", color: "#0d9488" }
                        : {}),
                    }}
                  >
                    {p.kind === "vet" ? (
                      <PawPrint size={20} />
                    ) : p.kind === "specialist" ? (
                      <UserRound size={20} />
                    ) : p.kind === "general" ? (
                      <Pill size={20} />
                    ) : (
                      <Sprout size={20} />
                    )}
                  </div>
                  <div>
                    <p className="text-[16px] font-bold leading-tight text-[var(--brand-ink)]">
                      {p.name}
                    </p>
                    <p className="mt-1 flex items-start gap-1 text-[13px] text-[var(--brand-muted)]">
                      <MapPin size={13} className="mt-0.5 shrink-0" />
                      <span className="line-clamp-1">{p.address}</span>
                    </p>
                    {p.specialist && (
                      <p className="mt-0.5 flex items-center gap-1 text-[12px] text-[var(--brand-muted)]">
                        <UserRound size={12} /> {p.specialist}
                      </p>
                    )}
                  </div>
                </div>
                {p.distanceKm !== null && (
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold text-white"
                    style={{ background: p.locked ? "var(--brand-muted)" : "var(--brand-green)" }}
                  >
                    {p.distanceKm.toFixed(1)} km
                  </span>
                )}
                {p.locked && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                    style={{ background: "var(--brand-red-soft)", color: "#d7263d" }}
                  >
                    <Lock size={9} /> uzoqda
                  </span>
                )}
              </div>

              {p.stock.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.stock.slice(0, 4).map((s) => (
                    <span
                      key={s.medicine}
                      className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={
                        s.status === "bor"
                          ? { background: "var(--brand-green-soft)", color: "var(--brand-green)" }
                          : { background: "var(--brand-red-soft)", color: "#d7263d" }
                      }
                    >
                      {s.medicine.split(" ")[0]} · {s.status === "bor" ? "Bor" : "Yo'q"}
                    </span>
                  ))}
                  {p.stock.length > 4 && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                      +{p.stock.length - 4}
                    </span>
                  )}
                  {p.stock.every((s) => s.status !== "bor") && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                      Izlangan dori yo'q
                    </span>
                  )}
                </div>
              )}

              {/* Dorixona egasi bot orqali qo'shgan dorilar — rasmi bilan */}
              {p.medicines.length > 0 && (
                <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1">
                  {p.medicines.slice(0, 8).map((m) => (
                    <div key={m.id} className="w-[64px] shrink-0">
                      {m.hasPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/medicines/${m.id}/photo`}
                          alt={m.name}
                          className="h-[64px] w-[64px] rounded-xl object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className="flex h-[64px] w-[64px] items-center justify-center rounded-xl"
                          style={{ background: "var(--brand-green-soft)", color: "var(--brand-green)" }}
                        >
                          <Pill size={20} />
                        </div>
                      )}
                      <p className="mt-1 line-clamp-2 text-[10.5px] font-semibold leading-tight text-[var(--brand-ink)]">
                        {m.name}
                      </p>
                    </div>
                  ))}
                  {p.medicines.length > 8 && (
                    <div className="flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[12px] font-bold text-slate-600">
                      +{p.medicines.length - 8}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <a
                  href={`tel:${p.phone.replace(/\s/g, "")}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-3 text-[14px] font-bold text-white"
                  style={{ background: "var(--brand-green)" }}
                >
                  <Phone size={15} /> Qo'ng'iroq
                </a>
                {p.locked ? (
                  // Boshqa sahifalar bilan bir xil qoida: radiusdan tashqarida
                  // yo'nalish yopiq, telefon esa ishlaydi.
                  <div
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-3 text-[13px] font-bold text-[var(--brand-muted)]"
                    style={{ background: "var(--brand-bg)" }}
                  >
                    <Lock size={13} /> Yo'nalish yopiq
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDirections(p);
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[var(--brand-ink)] py-3 text-[14px] font-bold text-white"
                  >
                    <Navigation size={14} /> Yo'nalish
                  </button>
                )}
              </div>
            </li>
          );
        })}
        {!loading && items.length === 0 && (
          <li className="ios-card px-5 py-7 text-center">
            <span
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
              style={{
                background:
                  kind === "specialist"
                    ? "#dbeafe"
                    : kind === "vet"
                      ? "var(--brand-yellow-soft)"
                      : "var(--brand-green-soft)",
                color:
                  kind === "specialist"
                    ? "#2563eb"
                    : kind === "vet"
                      ? "var(--brand-ink)"
                      : "var(--brand-green)",
              }}
            >
              {kind === "specialist" ? (
                <UserRound size={26} />
              ) : kind === "vet" ? (
                <PawPrint size={26} />
              ) : (
                <Sprout size={26} />
              )}
            </span>
            <p className="mt-3 text-[16px] font-black text-[var(--brand-ink)]">
              {meds.length > 0
                ? `Bu dorilar ${radiusKm} km ichida topilmadi`
                : `${radiusKm} km ichida hozircha ma'lumot yo'q`}
            </p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--brand-muted)]">
              Radiusni kattalashtirib ko&apos;ring yoki joylashuvingizni yangilang.
            </p>
            <button
              onClick={centerMe}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand-ink)] py-3 text-[14px] font-bold text-white"
            >
              <RefreshCw size={15} /> Joylashuvni yangilash
            </button>
          </li>
        )}
      </ul>
      </div>
      </div>

      {/* Bottom sheet */}
      {selected && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.35)" }}
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-[520px] rounded-t-[28px] bg-white px-5 pb-[max(16px,env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-handle" />
            <div className="flex items-start gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px]"
                style={{
                  background: "var(--brand-green-soft)",
                  color: "var(--brand-green)",
                  ...(selected.kind === "vet"
                    ? { background: "var(--brand-yellow-soft)", color: "var(--brand-ink)" }
                    : {}),
                  ...(selected.kind === "specialist"
                    ? { background: "#dbeafe", color: "#2563eb" }
                    : {}),
                  ...(selected.kind === "general"
                    ? { background: "#ccfbf1", color: "#0d9488" }
                    : {}),
                }}
              >
                {selected.kind === "vet" ? (
                  <PawPrint size={22} />
                ) : selected.kind === "specialist" ? (
                  <UserRound size={22} />
                ) : selected.kind === "general" ? (
                  <Pill size={22} />
                ) : (
                  <Sprout size={22} />
                )}
              </div>
              <div className="flex-1">
                <p className="text-[18px] font-black leading-tight text-[var(--brand-ink)]">
                  {selected.name}
                </p>
                <p className="mt-1 flex items-start gap-1 text-[13px] text-[var(--brand-muted)]">
                  <MapPin size={13} className="mt-0.5 shrink-0" /> {selected.address}
                </p>
                {selected.specialist && (
                  <p className="mt-0.5 flex items-center gap-1 text-[13px] text-[var(--brand-muted)]">
                    <UserRound size={13} /> {selected.specialist}
                  </p>
                )}
                <p className="mt-0.5 flex items-center gap-1 text-[13px] text-[var(--brand-muted)]">
                  <Clock size={13} /> {selected.workHours}
                </p>
              </div>
              {selected.distanceKm !== null && (
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold text-white"
                  style={{ background: "var(--brand-green)" }}
                >
                  {selected.distanceKm.toFixed(1)} km
                </span>
              )}
            </div>

            {selected.ratingAvg != null && (selected.ratingCount ?? 0) > 0 && (
              <p className="mt-1 flex items-center gap-1 text-[12px] font-bold text-[#b8860b]">
                ★ {selected.ratingAvg.toFixed(1)}
                <span className="text-[var(--brand-muted)]">({selected.ratingCount ?? 0} ovoz)</span>
              </p>
            )}

            {selected.locked && (
              <p
                className="mt-2 flex items-start gap-2 rounded-2xl p-2.5 px-3 text-[12px] font-medium"
                style={{ background: "var(--brand-yellow-soft)", color: "var(--brand-ink)" }}
              >
                <Lock size={14} className="mt-0.5 shrink-0" />
                <span>
                  Bu joy sizdan 5 km dan uzoq — yo&apos;nalish o&apos;rniga telefon orqali bog&apos;laning.
                </span>
              </p>
            )}

            {selected.stock.length > 0 && (
              <div className="mt-4 max-h-[200px] overflow-y-auto rounded-2xl bg-[var(--brand-bg)] p-2">
                {selected.stock.map((s) => (
                  <div key={s.medicine} className="flex items-center justify-between gap-2 px-2 py-2">
                    <span className="text-[14px] font-medium text-[var(--brand-ink)]">{s.medicine}</span>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold"
                      style={
                        s.status === "bor"
                          ? { background: "var(--brand-green-soft)", color: "var(--brand-green)" }
                          : { background: "var(--brand-red-soft)", color: "#d7263d" }
                      }
                    >
                      {s.status === "bor" ? "Bor" : "Mavjud emas"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <a
                href={`tel:${selected.phone.replace(/\s/g, "")}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-bold text-white"
                style={{ background: "var(--brand-green)" }}
              >
                <Phone size={17} /> {selected.phone}
              </a>
              {selected.locked ? (
                <div
                  className="flex items-center justify-center gap-1.5 rounded-2xl px-5 py-4 text-[14px] font-bold text-[var(--brand-muted)]"
                  style={{ background: "var(--brand-bg)" }}
                >
                  <Lock size={15} /> Uzoq
                </div>
              ) : (
                <button
                  onClick={() => openDirections(selected)}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-[var(--brand-yellow)] px-5 py-4 text-[15px] font-bold text-[var(--brand-ink)]"
                >
                  <Navigation size={16} /> Boraman
                </button>
              )}
            </div>
            <button
              onClick={() => setSelected(null)}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl py-3 text-[14px] font-bold text-[var(--brand-muted)]"
            >
              <X size={16} /> Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
