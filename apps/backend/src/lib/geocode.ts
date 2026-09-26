/**
 * Koordinatadan manzil matnini aniqlash (reverse geocoding).
 *
 * Nominatim (OpenStreetMap) ishlatiladi — kalit kerak emas va xarita ham allaqachon
 * OSM'dan olinadi. Ishlatish siyosatiga rioya qilamiz: aniq User-Agent, past so'rov
 * tezligi (ro'yxatdan o'tishda bir marta chaqiriladi).
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

const USER_AGENT =
  process.env.NOMINATIM_USER_AGENT?.trim() ||
  "AgrozAI/1.0 (+https://github.com/mrsovoo/agroz-ai)";

type NominatimAddress = Record<string, string | undefined>;

type NominatimResponse = {
  display_name?: string;
  address?: NominatimAddress;
};

/** Nominatim javobidan qisqa va o'qishga qulay manzil yasaydi. */
function formatAddress(address: NominatimAddress | undefined, displayName?: string): string | null {
  if (!address) return displayName?.trim() || null;

  const settlement = address.city ?? address.town ?? address.village ?? address.municipality;
  const district = address.city_district ?? address.county;
  const neighbourhood = address.suburb ?? address.neighbourhood ?? address.quarter;
  const street = [address.road ?? address.pedestrian, address.house_number]
    .filter(Boolean)
    .join(" ");

  const parts = [address.state, settlement, district, neighbourhood, street].filter(
    (p): p is string => typeof p === "string" && p.trim().length > 0,
  );

  // Takrorlanuvchi bo'laklarni olib tashlaymiz (masalan "Toshkent, Toshkent").
  const unique = parts.filter(
    (p, i) => parts.findIndex((x) => x.toLowerCase() === p.toLowerCase()) === i,
  );

  if (unique.length > 0) return unique.join(", ");
  return displayName?.trim() || null;
}

/**
 * Koordinatadan manzil matnini qaytaradi.
 * Aniqlab bo'lmasa `null` — chaqiruvchi foydalanuvchidan qo'lda so'rashi kerak.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("zoom", "18");
    url.searchParams.set("addressdetails", "1");
    // Faqat `uz`: ro'yxatga `ru` qo'shilsa Nominatim kirill variantni qaytaradi.
    url.searchParams.set("accept-language", "uz");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    const json = (await res.json()) as NominatimResponse;
    const formatted = formatAddress(json.address, json.display_name);
    return formatted ? formatted.slice(0, 300) : null;
  } catch (err) {
    console.error("[geocode] manzil aniqlanmadi:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function reverseGeocodeDetails(lat: number, lng: number): Promise<{
  formatted: string | null;
  region: string | null;
  district: string | null;
}> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { formatted: null, region: null, district: null };
  }
  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("zoom", "18");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("accept-language", "uz");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return { formatted: null, region: null, district: null };
    }
    const json = (await res.json()) as NominatimResponse;
    const formatted = formatAddress(json.address, json.display_name)?.slice(0, 300) || null;
    const region = json.address?.state || json.address?.province || json.address?.region || null;
    const district = json.address?.city_district || json.address?.county || json.address?.district || null;

    return { formatted, region, district };
  } catch (err) {
    return { formatted: null, region: null, district: null };
  }
}
