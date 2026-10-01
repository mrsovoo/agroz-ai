/**
 * Foydalanuvchi hududidagi muhim ob-havo o'zgarishlari va agro-ogohlantirishlar tizimi.
 *
 * Xavf turlari:
 * 1. Sovuq urishi (Frost / Qorasovuq): harorat <= 2°C yoki <= 0°C (ekin va ko'chatlar nobud bo'lish xavfi).
 * 2. Kuchli yomg'ir / Sel xavfi (Heavy rain / Torrential downpour): yog'in >= 12 mm.
 * 3. Kuchli shamol / Bo'ron (Gale / Strong wind): shamol >= 12 m/s.
 * 4. Jazirama issiq / Anomaliya (Heatwave): harorat >= 38°C.
 * 5. Keskin harorat pasayishi (Sudden temperature drop): 24 soatda >= 8°C pasayish.
 */

export type AlertType = "frost" | "heavy_rain" | "storm_wind" | "heatwave" | "sudden_cold";
export type AlertSeverity = "critical" | "warning" | "caution";

export type WeatherAlert = {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  subtitle: string;
  region: string;
  dateText: string;
  description: string;
  actionItems: {
    crop: string[];
    animal: string[];
  };
  metrics: {
    tempMin?: number;
    tempMax?: number;
    rainMm?: number;
    windSpeed?: number;
  };
  source: "live_forecast" | "regional_station" | "simulation";
};

import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq, isNotNull } from "drizzle-orm";
import { sendMessage, agrozGoKeyboard } from "./telegram-bot.js";

export const REGION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Toshkent: { lat: 41.3111, lng: 69.2797 },
  Samarqand: { lat: 39.6542, lng: 66.9597 },
  Buxoro: { lat: 39.7747, lng: 64.4286 },
  "Farg'ona": { lat: 40.3842, lng: 71.7843 },
  Andijon: { lat: 40.7821, lng: 72.3442 },
  Namangan: { lat: 40.9983, lng: 71.6726 },
  Qashqadaryo: { lat: 38.8606, lng: 65.7891 },
  Surxondaryo: { lat: 37.2242, lng: 67.2783 },
  Xorazm: { lat: 41.5564, lng: 60.6314 },
  Jizzax: { lat: 40.1158, lng: 67.8422 },
  Navoiy: { lat: 40.0844, lng: 65.3792 },
  Sirdaryo: { lat: 40.8373, lng: 68.6617 },
  "Qoraqalpog'iston": { lat: 42.4619, lng: 59.6166 },
};

export function findRegionCoords(regionName?: string | null): { lat: number; lng: number; matchedRegion: string } {
  if (!regionName) {
    return { ...REGION_COORDINATES["Toshkent"], matchedRegion: "Toshkent" };
  }
  const clean = regionName.toLowerCase().replace(/['`ʻ’]/g, "").trim();
  for (const [key, coords] of Object.entries(REGION_COORDINATES)) {
    const keyClean = key.toLowerCase().replace(/['`ʻ’]/g, "");
    if (clean.includes(keyClean) || keyClean.includes(clean)) {
      return { ...coords, matchedRegion: key };
    }
  }
  return { ...REGION_COORDINATES["Toshkent"], matchedRegion: regionName || "Toshkent" };
}

export type ForecastDaily = {
  time: string[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_sum?: number[];
  precipitation_probability_max?: number[];
  wind_speed_10m_max?: number[];
  weather_code?: number[];
};

export type ForecastResponse = {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    precipitation?: number;
  };
  daily?: ForecastDaily;
};

/**
 * Open-Meteo orqali 3 kunlik ob-havo prognozini olish.
 */
export async function fetchWeatherForecast(lat: number, lng: number): Promise<ForecastResponse | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,weather_code&forecast_days=3&wind_speed_unit=ms&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as ForecastResponse;
  } catch (err) {
    console.error("[weather-alerts] Prognozni yuklashda xatolik:", err);
    return null;
  }
}

/**
 * Ob-havo ko'rsatkichlarini tahlil qilib, xavfli o'zgarishlar ro'yxatini shakllantirish.
 */
export function analyzeForecastAlerts(
  forecast: ForecastResponse | null,
  regionName: string,
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const daily = forecast?.daily;
  const current = forecast?.current;

  if (daily?.time && daily.time.length > 0) {
    for (let i = 0; i < daily.time.length; i++) {
      const dateStr = daily.time[i];
      const minTemp = daily.temperature_2m_min?.[i];
      const maxTemp = daily.temperature_2m_max?.[i];
      const rain = daily.precipitation_sum?.[i] ?? 0;
      const wind = daily.wind_speed_10m_max?.[i] ?? 0;
      const dayLabel = i === 0 ? "Bugun" : i === 1 ? "Ertaga" : `${dateStr} sanasida`;

      // 1. Sovuq urishi / Ayoz xavfi (minTemp <= 2°C)
      if (typeof minTemp === "number" && minTemp <= 2) {
        const isCritical = minTemp <= 0;
        alerts.push({
          id: `frost-${regionName}-${dateStr}`,
          type: "frost",
          severity: isCritical ? "critical" : "warning",
          title: isCritical
            ? `⚠️ Qorasovuq xavfi: ${minTemp}°C gacha pasayish!`
            : `❄️ Sovuq urishi xavfi (${minTemp}°C)`,
          subtitle: `${dayLabel} kechasi va tongda ${regionName}da harorat ${minTemp}°C gacha tushishi kutilmoqda.`,
          region: regionName,
          dateText: `${dayLabel} (${dateStr})`,
          description:
            "Past harorat gullagan mevali daraxtlar, sabzavot ko'chatlari va nozik novdalarni sovuq urishiga olib kelishi mumkin. Zudlik bilan agrotexnik choralarni ko'ring.",
          actionItems: {
            crop: [
              "Ko'chatlar va mevali bog'larni erta tongda tutating (somon, shox-shabba yoqib tutun hosil qiling).",
              "Poliz va sabzavotlarni agrovolokno, plyonka yoki somon bilan yoping.",
              "Kechqurun ekinlarni yengil sug'oring — nam tuproq issiqlikni yaxshiroq saqlaydi.",
              "Issiqxona va parniklarda isitish uskunalarini shay holatga keltiring.",
            ],
            animal: [
              "Molxona va qo'yxona eshik-deraza tirqishlarini bekitib, shamol o'tmasligini ta'minlang.",
              "Polga qalin quruq somon yoki qipiq to'shama soling.",
              "Yangi tug'ilgan buzoq, qo'zi va parrandalarni alohida issiq xonaga oling.",
              "Mollarga iliq suv va to'yimli energiya beruvchi ozuqa (kunjara, kepak) bering.",
            ],
          },
          metrics: { tempMin: minTemp, tempMax: maxTemp },
          source: "live_forecast",
        });
      }

      // 2. Kuchli yomg'ir va sel xavfi (rain >= 12 mm)
      if (rain >= 12) {
        const isCritical = rain >= 25;
        alerts.push({
          id: `rain-${regionName}-${dateStr}`,
          type: "heavy_rain",
          severity: isCritical ? "critical" : "warning",
          title: isCritical
            ? `🌊 Sel va jala xavfi (${rain} mm yog'in)!`
            : `🌧️ Kuchli yomg'ir xavfi (${rain} mm)`,
          subtitle: `${dayLabel} ${regionName} hududida kuchli yog'ingarchilik kutilmoqda.`,
          region: regionName,
          dateText: `${dayLabel} (${dateStr})`,
          description:
            "Kuchli yog'ingarchilik paytida purkalgan dorilar va o'g'itlar yuvilib ketadi. Tuproqda suv to'planib ildiz chirishi va sel xavfi ortadi.",
          actionItems: {
            crop: [
              "Kimyoviy dori sepish va o'g'itlashni to'xtating — yomg'ir yuvib ketadi va samarasiz bo'ladi.",
              "Dala va bog'lardagi zovur, ariq va o'qariqlarni tozalab, suv qochirish yo'llarini oching.",
              "Issiqxona tomlari va yupqa bostirmalarni tekshiring.",
            ],
            animal: [
              "Chorvani past-tekislik va adirliklardagi sel xavfi bor ochiq yaylovlardan bostirmaga oling.",
              "Yem-xashak va somon g'aramlarini brezent bilan yopib, chirishdan saqlang.",
              "Molxonaga suv kirmasligi uchun atrofida ariqcha qazing.",
            ],
          },
          metrics: { rainMm: rain },
          source: "live_forecast",
        });
      }

      // 3. Kuchli shamol va bo'ron (wind >= 14 m/s ~ 50 km/h)
      if (wind >= 14) {
        const roundedWind = Math.round(wind * 10) / 10;
        const isCritical = wind >= 20;
        alerts.push({
          id: `wind-${regionName}-${dateStr}`,
          type: "storm_wind",
          severity: isCritical ? "critical" : "warning",
          title: isCritical
            ? `🌪️ Kuchli bo'ron va dovul (${roundedWind} m/s)!`
            : `💨 Kuchli shamol xavfi (${roundedWind} m/s)`,
          subtitle: `${dayLabel} ${regionName}da kuchli shamol shiddatlari ${roundedWind} m/s ga yetishi kutilmoqda.`,
          region: regionName,
          dateText: `${dayLabel} (${dateStr})`,
          description:
            "Kuchli shamol issiqxona plyonkalarini yirtishi, mevalarni to'kib yuborishi va daraxt shoxlarini sindirishi mumkin.",
          actionItems: {
            crop: [
              "Issiqxona plyonka va konstruksiyalarini mahkam bog'lab, mustahkamlang.",
              "Purkash ishlarini darhol to'xtating (dori shamolda uchib boshqa tomonga ketadi).",
              "Yosh ko'chatlar va mevali novdalarga qoziq qoqib bog'lang.",
            ],
            animal: [
              "Chorva va parrandalarni daraxtlar yoki eskirgan devorlar tagida qoldirmang.",
              "Molxona tomining shifer va tunukalarini mustahkamlang.",
            ],
          },
          metrics: { windSpeed: roundedWind },
          source: "live_forecast",
        });
      }

      // 4. Jazirama issiq (maxTemp >= 38°C)
      if (typeof maxTemp === "number" && maxTemp >= 38) {
        alerts.push({
          id: `heat-${regionName}-${dateStr}`,
          type: "heatwave",
          severity: maxTemp >= 40 ? "critical" : "warning",
          title: `☀️ Anomaliya: Jazirama issiq (${maxTemp}°C)!`,
          subtitle: `${dayLabel} ${regionName}da harorat ${maxTemp}°C gacha ko'tarilishi kutilmoqda.`,
          region: regionName,
          dateText: `${dayLabel} (${dateStr})`,
          description:
            "Yuqori harorat ekinlarning so'lishiga va chorva mollarida issiqlik stressi kelib chiqishiga sabab bo'ladi.",
          actionItems: {
            crop: [
              "Quyosh tig'ida (11:00 - 17:00) sug'ormang — ildiz pishib ketishi mumkin. Kechqurun yoki tongda sug'oring.",
              "Issiqxonalarni yaxshilab shamollatib, ustiga soya qiluvchi to'r yoying.",
            ],
            animal: [
              "Mollarga kun davomida salqin va toza ichimlik suvi berib turing.",
              "Mollarni soyabon tagida saqlang, imkon bo'lsa molxonani suv purkab salqinlating.",
            ],
          },
          metrics: { tempMax: maxTemp },
          source: "live_forecast",
        });
      }
    }
  }

  // Hozirgi yog'in yoki shamol kuchli bo'lsa
  if (current) {
    if (typeof current.precipitation === "number" && current.precipitation >= 5 && alerts.every((a) => a.type !== "heavy_rain")) {
      alerts.unshift({
        id: `rain-now-${regionName}`,
        type: "heavy_rain",
        severity: "warning",
        title: "🌧️ Hozir kuchli yog'ingarchilik kuzatilmoqda",
        subtitle: `${regionName}da hozirgi yog'in miqdori ${current.precipitation} mm ni tashkil qilmoqda.`,
        region: regionName,
        dateText: "Hozirgi vaqtda",
        description: "Barglar ho'l bo'lganligi sababli dorilash samarasiz. Suv to'planishining oldini oling.",
        actionItems: {
          crop: ["Dori sepmang, o'g'itlashni to'xtating.", "Ariqlardan suv chiqib ketishini nazorat qiling."],
          animal: ["Mollarni bostirma ostiga oling."],
        },
        metrics: { rainMm: current.precipitation },
        source: "live_forecast",
      });
    }
  }

  return alerts;
}

/**
 * Foydalanuvchi sinab ko'rishi yoki mavsumiy profilaktika uchun
 * namunaviy muhim xavflar (Sovuq urishi va Kuchli yomg'ir/sel).
 */
export function getSampleAgroAlerts(regionName: string = "Toshkent"): WeatherAlert[] {
  return [
    {
      id: `sample-frost-${regionName}`,
      type: "frost",
      severity: "critical",
      title: `⚠️ Diqqat: ${regionName}da sovuq urishi xavfi (-1°C kutilmoqda)!`,
      subtitle: `Yaqin tunlarda ${regionName} viloyatida harorat -1°C gacha pasayishi kutilmoqda.`,
      region: regionName,
      dateText: "Ertaga tunda (02:00 - 07:00)",
      description:
        "Sovuq urishi mevali daraxtlar kurtaklari, gullari va ochiq maydondagi poliz/sabzavot ko'chatlari uchun jiddiy xavf tug'diradi.",
      actionItems: {
        crop: [
          "Ko'chatlar va mevali bog'larda erta tongda tutun hosil qiling (somon, poxol yoqish orqali).",
          "Poliz va pomidor/bodring ko'chatlarini agrovolokno yoki plyonka bilan yoping.",
          "Kechqurun ekinlarni yengil sug'oring — nam yer haroratni 1-2°C iliq ushlab turadi.",
          "Issiqxonalarning isitish tizimini tayyorlab, haroratni +16°C dan tushirmang.",
        ],
        animal: [
          "Molxona deraza va eshik tirqishlarini yopib, qoralamani bartaraf qiling.",
          "Polga qalin quruq somon yoki qipiq to'shama soling.",
          "Yosh buzoq va qo'zilarni issiq xonaga oling, muzlagan suv bermang.",
        ],
      },
      metrics: { tempMin: -1, tempMax: 14 },
      source: "simulation",
    },
    {
      id: `sample-rain-${regionName}`,
      type: "heavy_rain",
      severity: "warning",
      title: `🌧️ Kuchli yomg'ir va sel xavfi (${regionName})`,
      subtitle: `Yaqin 24 soat ichida 18-22 mm miqdorida kuchli yog'ingarchilik kutilmoqda.`,
      region: regionName,
      dateText: "Kelgusi 24 soatda",
      description:
        "Kuchli yomg'ir o'g'it va dorilarni yuvib ketadi, adirliklarda sel kelish xavfi mavjud.",
      actionItems: {
        crop: [
          "Hech qanday kimyoviy ishlov bermang, o'g'it sepmang — yomg'ir yuvib yuboradi.",
          "Zovur va ariqlarni ochib, ko'lmak suvlarining ildizni chirishiga yo'l qo'ymang.",
        ],
        animal: [
          "Mollarni ochiq yaylovdan yopiq bostirmaga oling.",
          "Yem-xashak g'aramlarini suv o'tmaydigan qilib yopib qo'ying.",
        ],
      },
      metrics: { rainMm: 22 },
      source: "simulation",
    },
  ];
}

/**
 * Telegram bot orqali yuborish uchun HTML formatidagi chiroyli ogohlantirish xabari.
 */
export function formatAlertTelegramMessage(alert: WeatherAlert): string {
  const icon =
    alert.type === "frost"
      ? "❄️"
      : alert.type === "heavy_rain"
        ? "🌧️"
        : alert.type === "storm_wind"
          ? "💨"
          : "☀️";

  const cropItems = alert.actionItems.crop.map((c) => `  • ${c}`).join("\n");
  const animalItems = alert.actionItems.animal.map((a) => `  • ${a}`).join("\n");

  return [
    `🚨 <b>SHOSHILINCH AGRO-OGOHLANTIRISH</b>`,
    `📍 <b>Hudud:</b> ${alert.region}`,
    `⏰ <b>Vaqt:</b> ${alert.dateText}`,
    "",
    `${icon} <b>${alert.title}</b>`,
    `<i>${alert.subtitle}</i>`,
    "",
    `📝 <b>Xavf tavsifi:</b>`,
    alert.description,
    "",
    `🌾 <b>Ekinlar uchun tezkor choralar:</b>`,
    cropItems,
    "",
    `🐄 <b>Chorva uchun tezkor choralar:</b>`,
    animalItems,
    "",
    `📱 <i>AgrozGO — Ekin va chorva uchun aqlli yordamchi</i>`,
  ].join("\n");
}

/**
 * Qisqa SMS uchun matn (Eskiz SMS limiti uchun qisqartirilgan).
 */
export function formatAlertSms(alert: WeatherAlert): string {
  return `OGOHLANTIRISH (${alert.region}): ${alert.title}. Ekinlarni himoyalang, chorvani sovuq/yomg'irdan asrang. Batafsil: agroz.uz`;
}

export type AgroWeatherSnapshot = {
  temp: number;
  tempDay: number;
  tempNight: number;
  isDay: boolean;
  wind: number;
  humidity: number;
  rain: number;
  soilTemp: number;
  sprayStatus: "good" | "moderate" | "bad";
  sprayLabel: string;
  sprayReason: string;
  frostRisk: boolean;
  agroAdvice: string;
  region: string;
  dateStr: string;
};

export function calculateAgroMetrics(params: {
  temp: number;
  tempDay: number;
  tempNight: number;
  wind: number;
  humidity: number;
  rain: number;
  soilTempRaw?: number;
  isDay?: boolean;
}): {
  soilTemp: number;
  sprayStatus: "good" | "moderate" | "bad";
  sprayLabel: string;
  sprayReason: string;
  frostRisk: boolean;
  agroAdvice: string;
} {
  const { temp, tempDay, tempNight, wind, humidity, rain, soilTempRaw, isDay = true } = params;

  // Tuproq harorati (0–10 sm chuqurlikda):
  let soilTemp: number;
  if (typeof soilTempRaw === "number" && !Number.isNaN(soilTempRaw)) {
    soilTemp = Math.round(soilTempRaw);
  } else {
    // Agronomik hisob: kunduzi havoga nisbatan 2°C salqinroq, kechasi havoga nisbatan 3°C iliqroq saqlanadi
    soilTemp = isDay ? Math.round(temp - 2) : Math.round(tempNight + 3);
  }

  const frostRisk = tempNight <= 2;

  // Dori va o'g'it purkash holati (Agro Spray Window):
  let sprayStatus: "good" | "moderate" | "bad" = "good";
  let sprayLabel = "Dori purkash: Qulay";
  let sprayReason = `Shamol sokin (${wind} m/s) va havo ochiq. Purkash uchun ayni qulay fursat!`;

  if (rain > 0.2) {
    sprayStatus = "bad";
    sprayLabel = "Dori sepmang";
    sprayReason = `Yog'ingarchilik (${rain} mm), sepilgan dori yuvilib ketadi.`;
  } else if (wind > 5.5) {
    sprayStatus = "bad";
    sprayLabel = "Dori sepmang";
    sprayReason = `Kuchli shamol (${wind} m/s), dori havoga uchib ketadi.`;
  } else if (temp > 32) {
    sprayStatus = "bad";
    sprayLabel = "Dori sepmang";
    sprayReason = `Harorat yuqori (${temp}°C), bargni kuydirish xavfi bor.`;
  } else if (temp < 10) {
    sprayStatus = "bad";
    sprayLabel = "Dori sepmang";
    sprayReason = `Harorat past (${temp}°C), dori yaxshi ta'sir qilmaydi.`;
  } else if (wind > 3.5 || temp > 28 || temp < 14 || humidity > 85) {
    sprayStatus = "moderate";
    sprayLabel = "Dori purkash: Ehtiyotkorlik bilan";
    if (wind > 3.5) {
      sprayReason = `Shabada bor (${wind} m/s), erta tong yoki kechqurun seping.`;
    } else if (temp > 28) {
      sprayReason = `Kunduzi issiq (${temp}°C), kechki salqinda seping.`;
    } else {
      sprayReason = `Havo namligi yuqori (${humidity}%), shamol tinishini kuting.`;
    }
  }

  // 1 qatorlik qisqa dehqonchilik tavsiyasi (agroAdvice):
  let agroAdvice = "🌾 Ekinlarning parvarishini davom ettiring, namlik darajasini nazorat qiling.";
  if (frostRisk) {
    agroAdvice = `❄️ Qorasovuq xavfi (${tempNight}°C). Ko'chatlarni yoping, bog'larda tutatish qiling.`;
  } else if (rain >= 10) {
    agroAdvice = `🌧️ Kuchli yog'in kutilmoqda. Ariqlarni tozalang, suv to'planishining oldini oling.`;
  } else if (temp >= 35) {
    agroAdvice = `☀️ Jazirama: Kunduzi sug'ormang, sug'orishni erta tong yoki shomda bajaring.`;
  } else if (sprayStatus === "good") {
    agroAdvice = `🌿 Havo ochiq va shamol sokin. Dori va o'g'it purkash uchun ayni qulay fursat.`;
  } else if (wind >= 7) {
    agroAdvice = `💨 Kuchli shamol (${wind} m/s). Issiqxona va parniklarni mustahkamlang.`;
  }

  return {
    soilTemp,
    sprayStatus,
    sprayLabel,
    sprayReason,
    frostRisk,
    agroAdvice,
  };
}

/**
 * Berilgan koordinatalar bo'yicha aniq agro-ob-havo ma'lumotlarini olish.
 */
export async function getAgroWeatherSnapshot(
  lat: number,
  lng: number,
  regionName: string = "Toshkent",
): Promise<AgroWeatherSnapshot> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,is_day&hourly=soil_temperature_0cm&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&wind_speed_unit=ms&timezone=auto`;

  let currentTemp = 22;
  let tempDay = 24;
  let tempNight = 14;
  let isDay = true;
  let wind = 2.5;
  let humidity = 45;
  let rain = 0;
  let soilTempRaw: number | undefined;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = (await res.json()) as any;
      const c = data.current ?? {};
      const d = data.daily ?? {};
      const h = data.hourly ?? {};

      currentTemp = Math.round(c.temperature_2m ?? 22);
      tempDay = typeof d.temperature_2m_max?.[0] === "number" ? Math.round(d.temperature_2m_max[0]) : currentTemp;
      tempNight = typeof d.temperature_2m_min?.[0] === "number" ? Math.round(d.temperature_2m_min[0]) : Math.round(currentTemp - 8);
      isDay = c.is_day !== undefined ? c.is_day === 1 : true;
      wind = Math.round((c.wind_speed_10m ?? 2) * 10) / 10;
      humidity = Math.round(c.relative_humidity_2m ?? 45);
      rain = Math.round((c.precipitation ?? 0) * 10) / 10;

      const hourIdx = new Date().getHours();
      if (Array.isArray(h.soil_temperature_0cm) && typeof h.soil_temperature_0cm[hourIdx] === "number") {
        soilTempRaw = h.soil_temperature_0cm[hourIdx];
      }
    }
  } catch (err) {
    console.warn(`[getAgroWeatherSnapshot] Open-Meteo yuklashda xatolik:`, err);
  }

  const metrics = calculateAgroMetrics({
    temp: currentTemp,
    tempDay,
    tempNight,
    wind,
    humidity,
    rain,
    soilTempRaw,
    isDay,
  });

  const nowUz = new Intl.DateTimeFormat("ru-RU", { timeZone: "Asia/Tashkent" }).format(new Date());

  return {
    temp: currentTemp,
    tempDay,
    tempNight,
    isDay,
    wind,
    humidity,
    rain,
    soilTemp: metrics.soilTemp,
    sprayStatus: metrics.sprayStatus,
    sprayLabel: metrics.sprayLabel,
    sprayReason: metrics.sprayReason,
    frostRisk: metrics.frostRisk,
    agroAdvice: metrics.agroAdvice,
    region: regionName,
    dateStr: nowUz,
  };
}

/**
 * Har kungi ertalabki agro-ob-havo xabari matni.
 */
export function formatDailyMorningWeatherTelegram(
  snapshot: AgroWeatherSnapshot,
  userName?: string | null,
): string {
  const greeting = userName ? `Assalomu alaykum, <b>${userName}</b>!` : "Assalomu alaykum, dehqon va chorvadorlar!";
  const statusEmoji = snapshot.sprayStatus === "good" ? "✅" : snapshot.sprayStatus === "moderate" ? "⚠️" : "🛑";
  const statusBadge =
    snapshot.sprayStatus === "good"
      ? "QULAY"
      : snapshot.sprayStatus === "moderate"
      ? "EHTIYOTKORLIK BILAN"
      : "TAVSIYA ETILMAYDI";

  return [
    `🌤 ${greeting}`,
    `📍 <b>Hudud:</b> ${snapshot.region}`,
    `📅 <b>Bugungi agro-ob-havo xabarnomasi</b> (${snapshot.dateStr}):`,
    "",
    `🌡 <b>Havo harorati:</b> Kunduzi +${snapshot.tempDay}°C / Kechasi +${snapshot.tempNight}°C`,
    `💨 <b>Shamol tezligi:</b> ${snapshot.wind} m/s`,
    `💧 <b>Havo namligi:</b> ${snapshot.humidity}%`,
    `🌧 <b>Yog'ingarchilik:</b> ${snapshot.rain > 0 ? `${snapshot.rain} mm` : "Kutilmaydi (0 mm)"}`,
    `🌱 <b>Tuproq harorati (0–10 sm):</b> +${snapshot.soilTemp}°C`,
    "",
    `🌿 <b>Dori va o'g'it purkash holati:</b> ${statusBadge} ${statusEmoji}`,
    `<i>${snapshot.sprayReason}</i>`,
    "",
    `💡 <b>Bugungi agronomik tavsiya:</b>`,
    `${snapshot.agroAdvice}`,
    "",
    `📱 <i>Batafsil ob-havo tahlili, bozor va mutaxassislar AgrozGO da:</i>`,
  ].join("\n");
}

/**
 * Har kuni ertalab (soat 07:00 da) ro'yxatdan o'tgan barcha fermer va foydalanuvchilarga
 * o'z hududiga mos agro-ob-havo va dehqonchilik tavsiyasini avtomatik yuborish.
 * Takroriy yuborishning oldini oladi (kuniga 1 marta).
 */
export async function sendDailyMorningAgroWeatherBroadcast(
  force: boolean = false,
  testTelegramId?: number,
): Promise<{ total: number; sent: number; skipped: number; failed: number }> {
  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(new Date());

  const userQuery = db
    .select({
      id: users.id,
      telegramId: users.telegramId,
      name: users.name,
      region: users.region,
      district: users.district,
      weatherSentDate: users.weatherSentDate,
    })
    .from(users)
    .where(isNotNull(users.telegramId));

  const allUsers = await userQuery;
  const targetUsers = testTelegramId
    ? allUsers.filter((u) => u.telegramId === testTelegramId)
    : allUsers;

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  // Hudud bo'yicha ob-havoni keshlash (bir xil viloyat foydalanuvchilariga qayta-qayta API chaqirmaslik uchun)
  const weatherCache = new Map<string, AgroWeatherSnapshot>();

  for (const user of targetUsers) {
    if (!user.telegramId) continue;

    // Agar bugun allaqachon yuborilgan bo'lsa va majburiy (force) bo'lmasa — o'tkazib yuboramiz
    if (!force && user.weatherSentDate === todayStr) {
      skipped++;
      continue;
    }

    const userRegion = user.region || "Toshkent";
    let snapshot = weatherCache.get(userRegion);
    if (!snapshot) {
      const coords = findRegionCoords(userRegion);
      snapshot = await getAgroWeatherSnapshot(coords.lat, coords.lng, coords.matchedRegion);
      weatherCache.set(userRegion, snapshot);
    }

    const messageText = formatDailyMorningWeatherTelegram(snapshot, user.name);
    try {
      const ok = await sendMessage(user.telegramId, messageText, {
        keyboard: agrozGoKeyboard(),
      });

      if (ok) {
        sent++;
        await db
          .update(users)
          .set({ weatherSentDate: todayStr })
          .where(eq(users.id, user.id));
      } else {
        failed++;
      }
    } catch (err) {
      console.warn(`[daily-weather] ${user.telegramId} ga yuborishda xatolik:`, err);
      failed++;
    }

    // Telegram rate limit (soniyasiga ~25 xabar)
    await new Promise((r) => setTimeout(r, 40));
  }

  console.log(`[daily-weather] Yakunlandi (${todayStr}): Jami: ${targetUsers.length}, Yuborildi: ${sent}, O'tkazildi: ${skipped}, Xatolik: ${failed}`);
  return { total: targetUsers.length, sent, skipped, failed };
}

