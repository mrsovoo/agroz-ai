import { aiApiKey, aiBaseUrl, aiModel, asrModel } from "@/lib/settings";

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
    severity: "orta",
    prevention: "Ortiqcha sug'ormang, drenajni yaxshilang.",
  },
];

const ANIMAL_CASES: OfflineCase[] = [
  {
    keys: ["yo'tal", "yotal", "nafas", "isitma", "shamol", "pnevmon", "o'pka"],
    disease: "O'pka shamollashi (pnevmoniya)",
    solution:
      "1. Hayvonni iliq, shamol tegmaydigan joyga oling. 2. Nitoks 200 yoki Okstetratsiklin ni vet ko'rsatmasi bo'yicha uring. 3. Ko'p iliq suv bering. 4. 3 kun ichida yaxshilanmasa veterinarni chaqiring.",
    medicines: ["Nitoks 200", "Okstetratsiklin 200 LA", "Vitam (vitamin kompleksi)"],
    severity: "yuqori",
    prevention: "Molxonani shamoldan to'sing, nam somonni almashtiring.",
  },
  {
    keys: ["sut", "yelin", "mastit", "shishgan", "qon"],
    disease: "Mastit (yelin yallig'lanishi)",
    solution:
      "1. Yelinni iliq suv bilan yuvib, to'liq sog'ib tashlang. 2. Mastimetrin ni yelin kanaliga yuboring. 3. 3-5 kun davolang, sutni ichmang. 4. Sog'ishni kuniga 4 marta qiling.",
    medicines: ["Mastimetrin", "Okstetratsiklin 200 LA"],
    severity: "yuqori",
    prevention: "Sog'ishdan oldin yelinni yuving, to'shakni toza saqlang.",
  },
  {
    keys: ["ich", "ketish", "diareya", "suyuq", "qorin"],
    disease: "Ich ketishi (diareya)",
    solution:
      "1. 12 soat yem bermang, faqat suv va tuz-shakar eritmasi bering. 2. Gijjaga tekshiring. 3. Okstetratsiklin bering. 4. Suvsizlanish bo'lsa tomir orqali eritma quying.",
    medicines: ["Okstetratsiklin 200 LA", "Albendazol 10%", "Vitam (vitamin kompleksi)"],
    severity: "orta",
    prevention: "Toza suv bering, buzilgan yemni bermang.",
  },
  {
    keys: ["qo'tir", "qotir", "teri", "kana", "junsiz", "qichish", "parazit", "gijja"],
    disease: "Teri paraziti (qo'tir) yoki gijja",
    solution:
      "1. Ivermektin 1% ni teri ostiga yuboring. 2. Molxonani dezinfeksiya qiling. 3. 14 kundan keyin takrorlang. 4. Kasal hayvonni ajratib boqing.",
    medicines: ["Ivermektin 1%", "Albendazol 10%"],
    severity: "orta",
    prevention: "Har 3 oyda profilaktik dehelmintizatsiya o'tkazing.",
  },
  {
    keys: ["yiqil", "turolmay", "tug'ruq", "tugruq", "parez", "titray"],
    disease: "Tug'ruqdan keyingi parez (kalsiy yetishmovchiligi)",
    solution:
      "1. Zudlik bilan Kalsiy borglyukonat ni tomirga sekin yuboring. 2. Hayvonni to'shakka yotqizing. 3. Vet shifokorni chaqiring. 4. Yemga bo'r va mineral qo'shing.",
    medicines: ["Kalsiy borglyukonat", "Vitam (vitamin kompleksi)"],
    severity: "yuqori",
    prevention: "Tug'ruq oldidan mineral-vitamin qo'shimchalari bering.",
  },
];

export function offlineDiagnose(category: "crop" | "animal", text: string): DiagnosisResult {
  const cases = category === "crop" ? CROP_CASES : ANIMAL_CASES;
  const t = (text || "").toLowerCase();
  let best: OfflineCase | null = null;
  let bestScore = 0;
  for (const c of cases) {
    const score = c.keys.reduce((acc, k) => (t.includes(k) ? acc + 1 : acc), 0);
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  const chosen = best ?? cases[0];
  return {
    disease: chosen.disease + (bestScore === 0 ? " (ehtimoliy)" : ""),
    solution: chosen.solution,
    medicines: chosen.medicines,
    severity: chosen.severity,
    prevention: chosen.prevention,
    // Offlayn baza — qo'lda yozilgan 5 ta namuna; ishonch ataylab past
    // qo'yiladi, shunda foydalanuvchi mutaxassisga yo'naltiriladi.
    confidence: bestScore === 0 ? 40 : 60,
    source: "offline",
  };
}

export async function aiDiagnose(params: {
  category: "crop" | "animal";
  text: string;
  imageDataUrl?: string | null;
}): Promise<DiagnosisResult> {
  // Kalit/endpoint/model admin panel orqali ham sozlanadi (DB > env).
  const key = await aiApiKey();
  const baseUrl = ((await aiBaseUrl()) || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = (await aiModel()) || "gemini-3.8-flash";
  const { category, text, imageDataUrl } = params;
  if (!key) return offlineDiagnose(category, text);

  const subject = category === "crop" ? "Ekin (o'simlik)" : "Hayvon (chorva)";
  const content: Record<string, unknown>[] = [
    {
      type: "text",
      text: `Bo'lim: ${subject}. Foydalanuvchi tavsifi: ${text || "(matn berilmadi, faqat rasm)"}`,
    },
  ];
  if (imageDataUrl) {
    content.push({ type: "image_url", image_url: { url: imageDataUrl } });
  }

  try {
    // 503/429 (model band / limit) holatlarda 1 marta qayta urinish —
    // Gemini bepul modelda tez-tez uchraydi.
    let res: Response | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const r = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content },
          ],
          max_tokens: 700,
        }),
        signal: AbortSignal.timeout(45_000),
      });
      if (r.ok || (r.status !== 503 && r.status !== 429)) {
        res = r;
        break;
      }
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    if (!res) throw new Error("AI javob bermadi (503/429)");
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Partial<DiagnosisResult>;
    if (!parsed.disease) throw new Error("bo'sh javob");
    return {
      disease: String(parsed.disease),
      solution: String(parsed.solution ?? ""),
      medicines: Array.isArray(parsed.medicines) ? parsed.medicines.map(String) : [],
      severity: String(parsed.severity ?? "orta"),
      prevention: String(parsed.prevention ?? ""),
      // Model ball qo'ymasa — ehtiyotkorlik bilan past qiymat.
      confidence: normalizeConfidence(parsed.confidence, 60),
      source: "ai",
    };
  } catch (err) {
    // Xatoni jim yutish mumkin emas: kalit/model noto'g'ri bo'lsa foydalanuvchi
    // "real" deb demo javob olib qolardi. Logga aniq sabab yozamiz.
    console.error("[ai] tashxis so'rovi bajarilmadi:", {
      baseUrl,
      model,
      error: err instanceof Error ? err.message : String(err),
    });
    return offlineDiagnose(category, text);
  }
}

export async function transcribeAudio(file: Blob): Promise<string> {
  const key = await aiApiKey();
  const baseUrl = ((await aiBaseUrl()) || "https://api.openai.com/v1").replace(/\/$/, "");
  if (!key) return "";
  const form = new FormData();
  form.append("file", file, "audio.webm");
  form.append("model", (await asrModel()) || "whisper-1");
  form.append("language", "uz");
  const res = await fetch(`${baseUrl}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) return "";
  const json = (await res.json()) as { text?: string };
  return json.text ?? "";
}
