import { NextResponse } from "next/server";
import { locationAdvice, shortAdvice, weatherLevel } from "@/lib/advice";

export const dynamic = "force-dynamic";

type OpenMeteo = {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    precipitation?: number;
  };
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = parseFloat(url.searchParams.get("lat") ?? "41.3111");
  const lng = parseFloat(url.searchParams.get("lng") ?? "69.2797");
  const month = new Date().getUTCMonth() + 1;

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m`,
      { next: { revalidate: 900 } },
    );
    if (!res.ok) throw new Error("weather");
    const json = (await res.json()) as OpenMeteo;
    const c = json.current ?? {};
    const snapshot = {
      temp: Math.round(c.temperature_2m ?? 22),
      wind: Math.round((c.wind_speed_10m ?? 2) * 10) / 10,
      humidity: Math.round(c.relative_humidity_2m ?? 45),
      rain: c.precipitation ?? 0,
      month,
    };
    return NextResponse.json(
      {
        ok: true,
        ...snapshot,
        level: weatherLevel(snapshot),
        advice: shortAdvice(snapshot),
        // Hudud va mavsumga qarab to'liq maslahatlar (maslahatlar sahifasida).
        tips: locationAdvice(snapshot),
      },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } },
    );
  } catch {
    const fallback = {
      temp: 24,
      wind: 2.5,
      humidity: 45,
      rain: 0,
      month,
    };
    return NextResponse.json({
      ok: false,
      ...fallback,
      level: "caution",
      advice: "Ob-havo ma'lumoti yangilanmadi. Dala ishlarida ehtiyot bo'ling.",
      tips: locationAdvice(fallback),
    });
  }
}
