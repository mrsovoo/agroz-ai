import { GoogleGenAI, Type } from "@google/genai";
import { aiApiKey, aiModel, asrModel } from "@/lib/settings";

export const SYSTEM_PROMPT = `Sen O'zbekistondagi tajribali agro-konsultant va veterinarsan. Senga ekin yoki hayvon kasalligi bo'yicha rasm, matn yoki ovozli ma'lumot keladi. Javobingni faqat o'zbek tilida, qishloq xo'jaligi xodimlari tushunadigan o'ta sodda va lo'nda tilda yoz. Murakkab ilmiy terminlarni ishlatma.
Javobni QAT'IY JSON formatida qaytar:
{"disease":"Kasallik nomi","solution":"Qisqa yechim, 2-4 ta qadam","medicines":["dori1","dori2"],"severity":"past|orta|yuqori","prevention":"Kelgusida oldini olish uchun 1-2 jumla","confidence":85}
"confidence" — o'z tashxishingga ishonching, 0 dan 100 gacha butun son. Rasm noaniq, belgilar bir necha kasallikka o'xshasa yoki ma'lumot yetarli bo'lmasa — past ball qo'y (masalan 45).
Dorilar faqat O'zbekiston bozorida topiladigan nomlar bo'lsin.`;

export { CONFIDENCE_THRESHOLD } from "@/lib/constants";

export type DiagnosisResult = {
  disease: string;
  solution: string;
  medicines: string[];
  severity: string;
  prevention: string;
  /** 0-100. Offline bazada past bo'ladi — natijada mutaxassis tavsiya etiladi. */
  confidence: number;
  source: "ai" | "offline";
};

/** Ishonch qiymatini 0-100 oralig'iga keltiradi. */
function normalizeConfidence(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

type OfflineCase = {
  keys: string[];
  disease: string;
  solution: string;
  medicines: string[];
  severity: string;
  prevention: string;
};

const CROP_CASES: OfflineCase[] = [
  {
    keys: ["sariq", "dog", "zang", "bug'doy", "bugdoy"],
    disease: "Sariq zang (bug'doy zangi)",
    solution:
      "1. Kasallangan barglarni tekshiring. 2. Fungitsid bilan purkang (ertalab yoki kechqurun). 3. 10-12 kundan keyin purkashni takrorlang. 4. Azotli o'g'itni kamaytiring.",
    medicines: ["Topaz", "Oltingugurt (kolloid)", "Mis kuporosi (Bordo suyuqligi)"],
    severity: "yuqori",
    prevention: "Chidamli navlarni eking va ekin almashlab ekishga rioya qiling.",
  },
  {
    keys: ["qora", "chiriy", "fitoftor", "kartoshka", "pomidor"],
    disease: "Fitoftoroz (qora chirish)",
    solution:
      "1. Kasal barg va mevalarni yig'ib, dalaga tashlamang. 2. Ridomil Gold bilan purkang. 3. Sug'orishni kamaytiring, tomchilatib suging. 4. 10 kundan so'ng takrorlang.",
    medicines: ["Ridomil Gold", "Mis kuporosi (Bordo suyuqligi)", "Fitosporin-M"],
    severity: "yuqori",
    prevention: "Qator oralig'ini kengaytiring, kechqurun sug'ormang.",
  },
  {
    keys: ["shira", "bit", "qurt", "kapalak", "zararkunanda", "tripls", "trips"],
    disease: "Shira (o'simlik biti) zarari",
    solution:
      "1. Barg ostini tekshiring. 2. Aktara yoki Karate Zeon bilan purkang. 3. Shamolsiz kunda, ertalab purkang. 4. 7 kundan keyin takrorlang.",
    medicines: ["Aktara", "Karate Zeon", "Konfidor"],
    severity: "orta",
    prevention: "Begona o'tlarni yulib tashlang, foydali hasharotlarni saqlang.",
  },
  {
    keys: ["oq", "kul", "un", "shudring", "uzum", "mildyu"],
    disease: "Un-shudring (oq kukun kasalligi)",
    solution:
      "1. Zararlangan barglarni kesib oling. 2. Oltingugurt yoki Topaz bilan purkang. 3. Havo aylanishi uchun butang. 4. 2 hafta ichida 2 marta purkang.",
    medicines: ["Oltingugurt (kolloid)", "Topaz", "Mis kuporosi (Bordo suyuqligi)"],
    severity: "orta",
    prevention: "Quyuq eklishdan saqlaning, muntazam butash qiling.",
  },
  {
    keys: ["ildiz", "so'lish", "solish", "quriy", "so'lib"],
    disease: "Ildiz chirishi (so'lish)",
    solution:
      "1. Sug'orishni to'xtating, tuproqni quriting. 2. Kasal tupni yulib olib yo'q qiling. 3. Fitosporin-M eritmasi bilan tup tagini suging. 4. Tuproqni yumshating.",
    medicines: ["Fitosporin-M", "Mis kuporosi (Bordo suyuqligi)"],
    severity: "yuqori",
    prevention: "Zax yerdan qoching, drenaj qiling.",
  },
  {
    keys: ["kanaga", "o'rgimchakkana", "orgimchakkana", "paxta"],
    disease: "O'rgimchakkana zarari",
    solution:
      "1. Barg ostidagi o'rgimchak to'rlarini tekshiring. 2. Omite yoki Vertimek bilan purkang. 3. Namlikni oshiring (suv seping). 4. 5-7 kundan keyin takrorlang.",
    medicines: ["Omite", "Vertimek", "Aktara"],
    severity: "orta",
    prevention: "Dalani begona o'tlardan toza tuting.",
  },
];

const ANIMAL_CASES: OfflineCase[] = [
  {
    keys: ["oqsoq", "tuyoq", "og'iz", "yara", "oqsil"],
    disease: "Oqsil (yashur) kasalligi",
    solution:
      "1. Kasal hayvonni darhol podadan ajrating. 2. Og'iz va tuyoqlarni kaliy permanganat (margansovka) eritmasi bilan yuving. 3. Yumshoq yem va iliq suv bering. 4. Veterinarga zudlik bilan xabar bering.",
    medicines: ["Kaliy permanganat", "Oksitetratsiklin", "Glyukoza 40%"],
    severity: "yuqori",
    prevention: "Barcha mollarni o'z vaqtida emlatish (vaksinatsiya).",
  },
  {
    keys: ["yelin", "sut", "qon", "shish", "mastit"],
    disease: "Mastit (yelin yallig'lanishi)",
    solution:
      "1. Sog'ishdan oldin yelinni iliq suv bilan yuving. 2. Kasal pallani alohida idishga oxirigacha sog'ib oling (sutni to'king). 3. Yelinga maxsus antibiotik shprits yuboring. 4. Yengil massaj qiling.",
    medicines: ["Mastijet Forte", "Sinuloks", "Ixtiol surtmasi"],
    severity: "yuqori",
    prevention: "Sog'ish gigiyenasiga qat'iy rioya qiling, tagini quruq tuting.",
  },
  {
    keys: ["ich", "ketish", "diareya", "buzoq", "holsiz"],
    disease: "Buzoqlarda diareya (ich ketishi)",
    solution:
      "1. Sut berishni 1 mahal to'xtatib, elektrolit eritmasi bering. 2. Regidron yoki tuz-shakarli iliq suv ichiring. 3. Shamollashdan saqlang, issiq joyga oling. 4. Antibakterial dori bering.",
    medicines: ["Regidron", "Gentamitsin", "Enrofloksatsin"],
    severity: "yuqori",
    prevention: "Og'iz sutini tug'ilgandan keyin 1 soat ichida berish.",
  },
  {
    keys: ["yo'tal", "burun", "oqyapti", "nafas", "pnevmoniya", "zotiljam"],
    disease: "Zotiljam (pnevmoniya / shamollash)",
    solution:
      "1. Molxonani quruq va issiq tuting, yelvizakni (skvoznyak) yo'qoting. 2. Keng ta'sirli antibiotik ineksiya qiling. 3. Vitaminlar va quvvatlantiruvchi vositalar bering. 4. Veterinarga ko'rsating.",
    medicines: ["Tilosin", "Penitsillin", "Vitamin C"],
    severity: "yuqori",
    prevention: "Qorong'i va nam molxonalardan saqlaning.",
  },
  {
    keys: ["ko'z", "oq", "yosh", "oqishi", "ko'r"],
    disease: "Konyunktivit / Telaziioz",
    solution:
      "1. Ko'zni furatsilin eritmasi bilan ehtiyotkorlik bilan yuving. 2. Ko'z ostiga tetratsiklin surtmasi surting. 3. Qorong'iroq joyga oling (yorug'likdan saqlang). 4. Pashshalarga qarshi ishlov bering.",
    medicines: ["Furatsilin", "Tetratsiklin surtmasi (ko'z uchun)", "Levomitsetin tomchisi"],
    severity: "past",
    prevention: "Molxonani pashshalardan tozalash va to'r tutish.",
  },
];

export function offlineDiagnose(category: "crop" | "animal", text: string): DiagnosisResult {
  const cases = category === "crop" ? CROP_CASES : ANIMAL_CASES;
  const lower = (text || "").toLowerCase();
  let best: OfflineCase | null = null;
  let maxScore = 0;

  for (const c of cases) {
    let score = 0;
    for (const k of c.keys) {
      if (lower.includes(k)) score++;
    }
    if (score > maxScore) {
      maxScore = score;
      best = c;
    }
  }

  if (best && maxScore > 0) {
    return {
      disease: best.disease,
      solution: best.solution,
      medicines: best.medicines,
      severity: best.severity,
      prevention: best.prevention,
      confidence: Math.min(75, 40 + maxScore * 15),
      source: "offline",
    };
  }

  return {
    disease:
      category === "crop"
        ? "Barg va poya kasalligi (birlamchi fitosanitar tahlil)"
        : "Umumiy holsizlik va infeksiya belgilari",
    solution:
      "1. Kasallangan namunani ajrating yoki zararlangan joyni tozalang. 2. Yaqin agro-veterinar dorixonasiga murojaat qilib preparat tanlang. 3. Ko'rsatilgan dozada qo'llang.",
    medicines:
      category === "crop"
        ? ["Fitosporin-M", "Mis kuporosi (Bordo suyuqligi)", "Ridomil Gold"]
        : ["Okstetratsiklin 200 LA", "Vitam (vitamin kompleksi)", "Regidron"],
    severity: "orta",
    prevention: "Muntazam parvarish va profilaktik ishlov berish tavsiya etiladi.",
    confidence: 65,
    source: "offline",
  };
}

/** Gemini client singleton helper */
function createGeminiClient(key: string) {
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export async function aiDiagnose(params: {
  category: "crop" | "animal";
  text: string;
  imageDataUrl?: string | null;
}): Promise<DiagnosisResult> {
  const { category, text, imageDataUrl } = params;
  const key = (await aiApiKey()) || process.env.GEMINI_API_KEY;

  // Agar API kalit umuman bo'lmasa, tezkor offlayn bazadan javob qaytaramiz
  if (!key) {
    return offlineDiagnose(category, text);
  }

  const subject = category === "crop" ? "Ekin (o'simlik)" : "Hayvon (chorva)";
  const configuredModel = await aiModel();
  // Valid model selection as per gemini-api SKILL.md
  const model =
    configuredModel && configuredModel.startsWith("gemini-")
      ? configuredModel
      : "gemini-3.8-flash";

  try {
    const ai = createGeminiClient(key);

    // Multimodal qismlar: rasm + matn
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    if (imageDataUrl) {
      const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }

    parts.push({
      text: `Bo'lim: ${subject}. Foydalanuvchi tavsifi: ${text || "(matn berilmadi, faqat rasm)"}`,
    });

    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            disease: { type: Type.STRING, description: "Kasallik nomi" },
            solution: { type: Type.STRING, description: "Qisqa yechim, 2-4 ta qadam" },
            medicines: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "O'zbekistonda mavjud dorilar ro'yxati",
            },
            severity: { type: Type.STRING, description: "past, orta yoki yuqori" },
            prevention: { type: Type.STRING, description: "Oldini olish choralari" },
            confidence: { type: Type.INTEGER, description: "0-100 ishonch bali" },
          },
          required: ["disease", "solution", "medicines", "severity", "prevention", "confidence"],
        },
      },
    });

    let rawText = response.text?.trim() ?? "{}";
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    }
    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      rawText = rawText.slice(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(rawText) as Partial<DiagnosisResult>;

    if (!parsed.disease) {
      throw new Error("Bo'sh tashxis natijasi");
    }

    return {
      disease: String(parsed.disease),
      solution: String(parsed.solution ?? ""),
      medicines: Array.isArray(parsed.medicines) ? parsed.medicines.map(String) : [],
      severity: String(parsed.severity ?? "orta"),
      prevention: String(parsed.prevention ?? ""),
      confidence: normalizeConfidence(parsed.confidence, 85),
      source: "ai",
    };
  } catch (err) {
    console.error("[gemini-ai] Tashxis so'rovi bajarilmadi, offlayn bazaga o'tildi:", {
      model,
      error: err instanceof Error ? err.message : String(err),
    });
    return offlineDiagnose(category, text);
  }
}

export async function transcribeAudio(file: Blob): Promise<string> {
  const key = (await aiApiKey()) || process.env.GEMINI_API_KEY;
  if (!key) return "";

  try {
    const ai = createGeminiClient(key);
    const configuredAsr = await asrModel();
    const model =
      configuredAsr && configuredAsr.startsWith("gemini-")
        ? configuredAsr
        : "gemini-2.5-flash";

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    const rawMime = file.type || "audio/webm";
    const mimeType = rawMime.split(";")[0].trim() || "audio/webm";

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          {
            text: "Ushbu audio yozuvdagi o'zbek tilidagi nutqni aniq matnga aylantiring (faqat aytilgan gaplarni matn ko'rinishida yozing):",
          },
        ],
      },
    });

    return response.text?.trim() ?? "";
  } catch (err) {
    console.error("[gemini-transcribe] Ovozni matnga aylantirishda xatolik:", err);
    return "";
  }
}
