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
    const res = await fetch(url, { next: { revalidate: 900 } });
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
    `📱 <i>Agroz AI — Ekin va chorva uchun aqlli yordamchi</i>`,
  ].join("\n");
}

/**
 * Qisqa SMS uchun matn (Eskiz SMS limiti uchun qisqartirilgan).
 */
export function formatAlertSms(alert: WeatherAlert): string {
  return `OGOHLANTIRISH (${alert.region}): ${alert.title}. Ekinlarni himoyalang, chorvani sovuq/yomg'irdan asrang. Batafsil: agroz.uz`;
}
