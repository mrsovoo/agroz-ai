import { NextResponse } from "next/server";
import {
  fetchWeatherForecast,
  analyzeForecastAlerts,
  getSampleAgroAlerts,
  REGION_COORDINATES,
  type WeatherAlert,
} from "@/lib/weather-alerts";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const regionParam = url.searchParams.get("region");
  const latParam = url.searchParams.get("lat");
  const lngParam = url.searchParams.get("lng");
  const includeSample = url.searchParams.get("sample") === "1" || url.searchParams.get("demo") === "1";

  const user = await getCurrentUser();
  const effectiveRegion = regionParam || user?.region || "Toshkent";

  let lat = latParam ? parseFloat(latParam) : undefined;
  let lng = lngParam ? parseFloat(lngParam) : undefined;

  if (lat === undefined || lng === undefined || Number.isNaN(lat) || Number.isNaN(lng)) {
    const coords = REGION_COORDINATES[effectiveRegion] || REGION_COORDINATES["Toshkent"];
    lat = coords.lat;
    lng = coords.lng;
  }

  const forecast = await fetchWeatherForecast(lat, lng);
  let alerts: WeatherAlert[] = analyzeForecastAlerts(forecast, effectiveRegion);

  // Agar hozirda real xavf bo'lmasa, dehqonlar tizimni sinab ko'rishi va
  // sovuq urishi / kuchli yomg'ir choralarini oldindan bilishi uchun
  // namunaviy agro-ogohlantirishlarni taqdim etamiz.
  if (alerts.length === 0 || includeSample) {
    const samples = getSampleAgroAlerts(effectiveRegion);
    if (alerts.length === 0) {
      alerts = samples;
    } else if (includeSample) {
      alerts = [...alerts, ...samples];
    }
  }

  return NextResponse.json(
    {
      ok: true,
      region: effectiveRegion,
      coords: { lat, lng },
      alerts,
      alertsCount: alerts.length,
      hasCritical: alerts.some((a) => a.severity === "critical"),
      hasWarning: alerts.some((a) => a.severity === "warning"),
    },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
