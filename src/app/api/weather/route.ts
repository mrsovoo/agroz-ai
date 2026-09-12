import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type OpenMeteo = {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    precipitation?: number;
  };
};

function levelOf(temp: number, wind: number, rain: number, humidity: number) {
  if (wind >= 5 || rain > 0.3) return "danger";
  if (temp >= 33 || temp <= 3) return "warning";
  if (humidity >= 80) return "caution";
  return "ok";
}

function advice(temp: number, wind: number, rain: number, humidity: number) {
  if (wind >= 5) return "Bugun dori sepmang — shamol kuchli, dori nishonga tushmaydi.";
  if (rain > 0.3) return "Yomg'ir bor — purkash samarasiz, yomg'irdan keyin 1 kun kuting.";
  if (temp >= 33) return "Jazirama issiq — hayvonlarga soya va toza suv bering, purkashni kechqurun qiling.";
  if (humidity >= 80) return "Namlik yuqori — zamburug' kasalliklari xavfi bor, profilaktika purkash qiling.";
  if (temp <= 3) return "Sovuq — ekinlarni sovuqdan himoya qiling, molxonani isiting.";
  return "Ob-havo qulay — purkash va dala ishlari uchun yaxshi kun.";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = parseFloat(url.searchParams.get("lat") ?? "41.3111");
  const lng = parseFloat(url.searchParams.get("lng") ?? "69.2797");

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m`,
      { next: { revalidate: 900 } },
    );
    if (!res.ok) throw new Error("weather");
    const json = (await res.json()) as OpenMeteo;
    const c = json.current ?? {};
    const temp = Math.round(c.temperature_2m ?? 22);
    const wind = Math.round((c.wind_speed_10m ?? 2) * 10) / 10;
    const humidity = Math.round(c.relative_humidity_2m ?? 45);
    const rain = c.precipitation ?? 0;
    return NextResponse.json({
      ok: true,
      temp,
      wind,
      humidity,
      rain,
      level: levelOf(temp, wind, rain, humidity),
      advice: advice(temp, wind, rain, humidity),
    });
  } catch {
    return NextResponse.json({
      ok: false,
      temp: 24,
      wind: 2.5,
      humidity: 45,
      rain: 0,
      level: "caution",
      advice: "Ob-havo ma'lumoti yangilanmadi. Dala ishlarida ehtiyot bo'ling.",
    });
  }
}
