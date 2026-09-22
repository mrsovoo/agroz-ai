import { Router } from "express";
import { locationAdvice, shortAdvice, weatherLevel } from "../lib/advice.js";
import {
  fetchWeatherForecast,
  analyzeForecastAlerts,
  getSampleAgroAlerts,
  REGION_COORDINATES,
} from "../lib/weather-alerts.js";

const router = Router();

// GET /api/weather
router.get("/", async (req, res) => {
  const lat = parseFloat((req.query.lat as string) ?? "41.3111");
  const lng = parseFloat((req.query.lng as string) ?? "69.2797");
  const month = new Date().getUTCMonth() + 1;

  try {
    const apiRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m`
    );
    if (!apiRes.ok) throw new Error("weather API error");
    const json = (await apiRes.json()) as any;
    const c = json.current ?? {};
    const snapshot = {
      temp: Math.round(c.temperature_2m ?? 22),
      wind: Math.round((c.wind_speed_10m ?? 2) * 10) / 10,
      humidity: Math.round(c.relative_humidity_2m ?? 45),
      rain: c.precipitation ?? 0,
      month,
    };

    res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=1800");
    res.json({
      ok: true,
      ...snapshot,
      level: weatherLevel(snapshot),
      advice: shortAdvice(snapshot),
      tips: locationAdvice(snapshot),
    });
  } catch (err: any) {
    console.error("[weather error]:", err);
    res.status(500).json({ error: "Ob-havo ma'lumotini olib bo'lmadi" });
  }
});

// GET /api/weather/alerts
router.get("/alerts", async (req, res) => {
  try {
    const regionParam = req.query.region as string | undefined;
    const latParam = req.query.lat as string | undefined;
    const lngParam = req.query.lng as string | undefined;
    const includeSample = req.query.sample === "1" || req.query.demo === "1";

    const effectiveRegion = regionParam || "Toshkent";

    let lat = latParam ? parseFloat(latParam) : undefined;
    let lng = lngParam ? parseFloat(lngParam) : undefined;

    if (lat === undefined || lng === undefined || Number.isNaN(lat) || Number.isNaN(lng)) {
      const coords = REGION_COORDINATES[effectiveRegion] || REGION_COORDINATES["Toshkent"];
      lat = coords.lat;
      lng = coords.lng;
    }

    const forecast = await fetchWeatherForecast(lat, lng);
    let alerts = analyzeForecastAlerts(forecast, effectiveRegion);

    if (alerts.length === 0 || includeSample) {
      const samples = getSampleAgroAlerts(effectiveRegion);
      if (alerts.length === 0) {
        alerts = samples.slice(0, 2);
      }
    }

    res.json({
      ok: true,
      region: effectiveRegion,
      alerts,
    });
  } catch (err: any) {
    console.error("[weather alerts error]:", err);
    res.status(500).json({ error: "Ogohlantirishlarni olib bo'lmadi" });
  }
});

export default router;
