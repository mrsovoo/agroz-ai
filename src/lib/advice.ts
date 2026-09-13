/**
 * Foydalanuvchi turgan hududdagi ob-havo va mavsumga qarab maslahatlar.
 *
 * Bu modul **sof funksiyalardan** iborat (tarmoqqa chiqmaydi) — shuning uchun
 * ham serverda (API javobida), ham klientda hisoblash uchun xavfsiz.
 */

export type WeatherLevel = "ok" | "caution" | "warning" | "danger";

export type WeatherInput = {
  /** Harorat (°C). */
  temp: number;
  /** Shamol tezligi (m/s). */
  wind: number;
  /** Yog'in (mm). */
  rain: number;
  /** Namlik (%). */
  humidity: number;
  /** Oy raqami (1-12) — mavsumiy maslahat uchun. */
  month: number;
};

/** Kimga tegishli maslahat: ekinlarga, chorvaga yoki ikkalasiga. */
export type AdviceScope = "crop" | "animal" | "both";

export type AdviceItem = {
  id: string;
  scope: AdviceScope;
  title: string;
  body: string;
};

export const LEVEL_LABEL: Record<WeatherLevel, string> = {
  ok: "Qulay",
  caution: "Ehtiyot bo'ling",
  warning: "Ogohlantirish",
  danger: "Xavfli",
};

/** Ob-havoning umumiy xavf darajasi (qisqa tavsiya va rang uchun). */
export function weatherLevel({ temp, wind, rain, humidity }: WeatherInput): WeatherLevel {
  if (wind >= 5 || rain > 0.3) return "danger";
  if (temp >= 33 || temp <= 3) return "warning";
  if (humidity >= 80) return "caution";
  return "ok";
}

/** Bitta qatorlik qisqa maslahat (ob-havo kartochkasida ko'rinadi). */
export function shortAdvice({ temp, wind, rain, humidity }: WeatherInput): string {
  if (wind >= 5) return "Bugun dori sepmang — shamol kuchli, dori nishonga tushmaydi.";
  if (rain > 0.3) return "Yomg'ir bor — purkash samarasiz, yomg'irdan keyin 1 kun kuting.";
  if (temp >= 33)
    return "Jazirama issiq — hayvonlarga soya va toza suv bering, purkashni kechqurun qiling.";
  if (temp <= 3) return "Sovuq — ekinlarni sovuqdan himoya qiling, molxonani isiting.";
  if (humidity >= 80) return "Namlik yuqori — zamburug' kasalliklari xavfi bor, profilaktika qiling.";
  return "Ob-havo qulay — purkash va dala ishlari uchun yaxshi kun.";
}

export type Season = "bahor" | "yoz" | "kuz" | "qish";

export function seasonOf(month: number): Season {
  if (month >= 3 && month <= 5) return "bahor";
  if (month >= 6 && month <= 8) return "yoz";
  if (month >= 9 && month <= 11) return "kuz";
  return "qish";
}

export const SEASON_LABEL: Record<Season, string> = {
  bahor: "Bahorgi mavsum",
  yoz: "Yozgi mavsum",
  kuz: "Kuzgi mavsum",
  qish: "Qishki mavsum",
};

/** Mavsumga xos bitta maslahat (ekin va chorva uchun alohida). */
function seasonAdvice(month: number): AdviceItem[] {
  const season = seasonOf(month);
  if (season === "bahor") {
    return [
      {
        id: "season-crop",
        scope: "crop",
        title: "Bahorgi ekish va birinchi purkash",
        body: "Kurtak yorilishidan oldin Bordo suyuqligi bilan purkang. Havo +5°C dan yuqori bo'lishi kerak.",
      },
      {
        id: "season-animal",
        scope: "animal",
        title: "Emalash va vitaminlar",
        body: "Bahorda chorvani emlang va vitamin kompleksi bering — qishdan keyin immunitet pasaygan bo'ladi.",
      },
    ];
  }
  if (season === "yoz") {
    return [
      {
        id: "season-crop",
        scope: "crop",
        title: "Sug'orish va zararkunandalar",
        body: "Erta tongda yoki kechqurun sug'oring. Shira va tripslarga qarshi insektitsid qo'llang.",
      },
      {
        id: "season-animal",
        scope: "animal",
        title: "Issiqlik stressidan himoya",
        body: "Sut mahsuldorligi issiqda tushadi — soya, doimiy toza suv va tuzli lizunets bilan ta'minlang.",
      },
    ];
  }
  if (season === "kuz") {
    return [
      {
        id: "season-crop",
        scope: "crop",
        title: "Hosilni yig'ish va saqlash",
        body: "Hosilni quruq havoda yig'ib oling, omborni shamollatib, namlikni 14% dan oshirmang.",
      },
      {
        id: "season-animal",
        scope: "animal",
        title: "Qishga ozuqa tayyorlash",
        body: "Bir bosh qoramonga 25-30 kg pichan va 5-8 kg silos zaxiralang, omborni sichqondan himoya qiling.",
      },
    ];
  }
  return [
    {
      id: "season-crop",
      scope: "crop",
      title: "Issiqxona va ko'chat parvarishi",
      body: "Issiqxonada haroratni 18-25°C da saqlang, kunduzi shamollatib, ortiqcha namlikni oling.",
    },
    {
      id: "season-animal",
      scope: "animal",
      title: "Molxonani isitish va boqish",
      body: "Molxonani musonlashdan saqlang, quruq to'shama soling, ozuqaga ko'proq konsentrat qo'shing.",
    },
  ];
}

/**
 * Foydalanuvchi turgan hududning hozirgi ob-havosi + mavsumi bo'yicha
 * to'liq maslahat ro'yxati. Eng muhimlari ro'yxat boshida turadi.
 */
export function locationAdvice(w: WeatherInput): AdviceItem[] {
  const season = seasonOf(w.month);
  const items: AdviceItem[] = [];

  if (w.wind >= 5) {
    items.push({
      id: "wind",
      scope: "both",
      title: "Shamol kuchli",
      body: "Purkashni kechiktiring — shamol 5 m/s dan oshsa dori yerga tushadi va zararli bo'ladi.",
    });
  }
  if (w.rain > 0.3) {
    items.push({
      id: "rain",
      scope: "both",
      title: "Yomg'ir yog'ayapti",
      body: "Yomg'irdan keyin kamida 1 kun kutib, barglar qurigach purkang. Chorvani boqish joyini quruq saqlang.",
    });
  }
  if (w.temp >= 33) {
    items.push({
      id: "heat",
      scope: "both",
      title: `Jazirama issiq (${Math.round(w.temp)}°C)`,
      body: "Ekinlarni erta tongda sug'oring. Chorvaga soya va toza suv bering — issiqda sut 20% gacha kamayadi.",
    });
  }
  if (w.temp <= 3) {
    items.push({
      id: "frost",
      scope: "both",
      title: `Sovuq (${Math.round(w.temp)}°C)`,
      body: "Ko'chatlarni agrotexnik material bilan yoping. Molxonani isiting va quruq to'shama soling.",
    });
  }
  if (w.humidity >= 80) {
    items.push({
      id: "humidity",
      scope: "crop",
      title: "Namlik yuqori — zamburug' xavfi",
      body: "Mildyu, fitoftoroz va un-shudring tarqaladi. Profilaktika uchun fungitsid (Ridomil Gold, Topaz) qo'llang.",
    });
  }
  if (items.length === 0) {
    items.push({
      id: "good-day",
      scope: "both",
      title: "Ob-havo qulay",
      body: "Purkash, o'g'itlash va dala ishlari uchun mos kun. Chorvani yaylovga chiqarish mumkin.",
    });
  }

  items.push(...seasonAdvice(w.month).map((s) => ({ ...s, title: `${SEASON_LABEL[season]} — ${s.title}` })));

  return items;
}
