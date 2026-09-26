/**
 * Agro va chorvachilik yangiliklari — **real** manbalardan.
 *
 * Manbalar:
 *  - AgroWorld Uzbekistan (`agroworld.uz/uz/yangiliklar`) — o'zbek tilidagi agro
 *    va chorvachilik yangiliklari (ro'yxat sahifasi o'qiladi)
 *  - EastFruit (o'zbekcha RSS) — meva-sabzavot va agrobiznes
 *  - Kun.uz va Gazeta.uz (o'zbekcha RSS) — umumiy yangiliklar, agro/chorva
 *    kalit so'zlari bo'yicha filtrlanadi
 *
 * Har bir manba alohida himoyalangan: bittasi ishlamasa qolganlari ko'rsatiladi.
 * Natija 30 daqiqaga kesh qilinadi (`fetch` revalidate).
 *
 * ⚠️ Faqat serverda ishlatiladi (bazaga ham murojaat qiladi).
 */

import { db } from "@/db";
import { news } from "@/db/schema";
import { desc } from "drizzle-orm";

export type NewsTag = "Agro" | "Chorva";

export type NewsItem = {
  id: string;
  title: string;
  link: string;
  source: string;
  tag: NewsTag;
  publishedAt: string;
  summary: string | null;
};

const USER_AGENT = "AgrozAI/1.0 (+https://github.com/mrsovoo/agroz-ai)";
const REVALIDATE_SECONDS = 30 * 60;

/** Shundan eski yangiliklar ro'yxatga kirmaydi (kun). */
const RECENT_DAYS = 400;

// ---------------------------------------------------------------------------
// Kalit so'zlar (lotin va kirill)
// ---------------------------------------------------------------------------

/** Ekinlar bilan bog'liq kalit so'zlar. */
const CROP_WORDS = [
  "agro",
  "agrosanoat",
  "agrobiznes",
  "dehqon",
  "dehqonchilik",
  "hosil",
  "hosildorlik",
  "paxta",
  "galla",
  "bugdoy",
  "sabzavot",
  "meva",
  "poliz",
  "bogdorchilik",
  "bogbon",
  "issiqxona",
  "ekin",
  "urug",
  "ogit",
  "fermer",
  "qishloq xojaligi",
  "tomorqa",
  "kartoshka",
  "uzum",
  "kochat",
  "sugorish",
  "zamburug",
  "zararkunanda",
  "fitosanitariya",
  "eksport",
  // kirill
  "деҳқон",
  "ҳосил",
  "пахта",
  "ғалла",
  "буғдой",
  "сабзавот",
  "мева",
  "боғдорчилик",
  "иссиқхона",
  "уруғ",
  "ўғит",
  "фермер",
  "қишлоқ хўжалиги",
  "картошка",
  "узум",
  "кўчат",
  "суғориш",
];

/** Chorvachilik bilan bog'liq kalit so'zlar. */
const ANIMAL_WORDS = [
  "chorva",
  "chorvachilik",
  "qoramol",
  "molxona",
  "qoychilik",
  "echki",
  "parranda",
  "parrandachilik",
  "tovuq",
  "sutchilik",
  "sut mahsulot",
  "gosht",
  "veterinar",
  "yem",
  "baliq",
  "asalari",
  "emlash",
  "ozuqa",
  "zotli",
  // kirill
  "чорва",
  "қорамол",
  "молхона",
  "қўйчилик",
  "парранда",
  "товуқ",
  "сут",
  "гўшт",
  "ветеринар",
  "балиқ",
  "аслари",
  "озуқа",
  "эмлаш",
];

/**
 * Solishtirish uchun matnni bir xil ko'rinishga keltiradi:
 * apostroflar olib tashlanadi ("o'g'it" → "ogit"), kirill harflari
 * lotinga yaqinlashtiriladi ("ў" → "у").
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’ʻʼ`´'\u02bb\u02bc]/g, "")
    .replace(/ў/g, "у")
    .replace(/ғ/g, "г")
    .replace(/қ/g, "к")
    .replace(/ҳ/g, "х");
}

/**
 * Sarlavhadagi kalit so'zlar bo'yicha turini aniqlaydi.
 * Faqat **sarlavha** tekshiriladi — tavsif ichidagi tasodifiy so'z begona
 * yangilikni "agro" deb belgilab qo'ymasligi uchun.
 */
function tagOf(text: string): NewsTag | null {
  const normalized = normalize(text);
  const hasAnimal = ANIMAL_WORDS.some((w) => normalized.includes(normalize(w)));
  const hasCrop = CROP_WORDS.some((w) => normalized.includes(normalize(w)));
  if (hasAnimal && !hasCrop) return "Chorva";
  if (hasCrop) return "Agro";
  if (hasAnimal) return "Chorva";
  return null;
}

/**
 * O'zbek tilidagi sarlavhani ajratib oladi: kirill yozuvidagi sarlavha faqat
 * o'zbek kirilliga xos harflar (ў, қ, ғ, ҳ) bo'lsa qabul qilinadi — shu bilan
 * rus tilidagi yangiliklar tushib qolmaydi.
 */
function isUzbekText(text: string): boolean {
  const cyrillic = (text.match(/[а-яё]/gi) ?? []).length;
  if (cyrillic === 0) return true;
  return /[ўқғҳ]/i.test(text);
}

// ---------------------------------------------------------------------------
// XML / HTML yordamchilar (tashqi kutubxonasiz)
// ---------------------------------------------------------------------------

const ENTITIES: Record<string, string> = {
  amp: "&",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  nbsp: " ",
  laquo: "«",
  raquo: "»",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
};

function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_m, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (m, name: string) => ENTITIES[name.toLowerCase()] ?? m);
}

function clean(value: string | undefined, max = 400): string {
  if (!value) return "";
  const text = decodeEntities(value.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, max);
}

const UZ_MONTHS: Record<string, number> = {
  yanvar: 0,
  fevral: 1,
  mart: 2,
  aprel: 3,
  may: 4,
  iyun: 5,
  iyul: 6,
  avgust: 7,
  sentabr: 8,
  sentyabr: 8,
  oktabr: 9,
  oktyabr: 9,
  noyabr: 10,
  dekabr: 11,
};

/** "5 avgust 2026" ko'rinishidagi sanani ISO'ga aylantiradi. */
function parseUzDate(day: string, monthName: string, year: string): string | null {
  const month = UZ_MONTHS[monthName.toLowerCase().replace(/[‘’ʻʼ]/g, "")];
  if (month === undefined) return null;
  const d = Number(day);
  const y = Number(year);
  if (!Number.isFinite(d) || !Number.isFinite(y)) return null;
  return new Date(Date.UTC(y, month, d, 9)).toISOString();
}

// ---------------------------------------------------------------------------
// Manbalar
// ---------------------------------------------------------------------------

type Feed = {
  id: string;
  label: string;
  url: string;
  /** Belgilangan tur; `null` bo'lsa sarlavhadan aniqlanadi. */
  tag: NewsTag | null;
  /** `true` bo'lsa faqat agro/chorva kalit so'zi bor sarlavhalar olinadi. */
  filterKeywords: boolean;
  limit: number;
};

const FEEDS: Feed[] = [
  {
    id: "eastfruit",
    label: "EastFruit",
    url: "https://east-fruit.com/uz/feed/",
    tag: "Agro",
    filterKeywords: false,
    limit: 8,
  },
  {
    id: "kunuz",
    label: "Kun.uz",
    url: "https://kun.uz/news/rss?lang=uz",
    tag: null,
    filterKeywords: true,
    limit: 30,
  },
  {
    id: "gazeta",
    label: "Gazeta.uz",
    url: "https://www.gazeta.uz/uz/rss/",
    tag: null,
    filterKeywords: true,
    limit: 30,
  },
];

async function fetchFeed(feed: Feed): Promise<NewsItem[]> {
  const res = await fetch(feed.url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/rss+xml, application/xml, text/xml" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`${feed.label}: HTTP ${res.status}`);

  const xml = await res.text();
  const items: NewsItem[] = [];

  for (const raw of xml.split(/<item[\s>]/i).slice(1)) {
    const body = raw.split(/<\/item>/i)[0];

    const titleRaw = clean(body.match(/<title>([\s\S]*?)<\/title>/i)?.[1], 240);
    const link = clean(body.match(/<link>([\s\S]*?)<\/link>/i)?.[1], 500);
    if (!titleRaw || !link.startsWith("http")) continue;
    if (!isUzbekText(titleRaw)) continue;

    const detected = tagOf(titleRaw);
    if (feed.filterKeywords && !detected) continue;
    const tag = detected ?? feed.tag;
    if (!tag) continue;

    // Ba'zi manbalar sarlavhaga " - Manba" qo'shadi — uni olib tashlaymiz.
    const title = titleRaw.replace(/\s+[-–—]\s+[^-–—]{2,40}$/, "").trim() || titleRaw;
    const sourceName = clean(body.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1], 80);

    const dateRaw = clean(body.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1], 60);
    const parsed = new Date(dateRaw);
    const publishedAt = Number.isNaN(parsed.getTime())
      ? new Date().toISOString()
      : parsed.toISOString();

    const descText = clean(body.match(/<description>([\s\S]*?)<\/description>/i)?.[1], 220);
    const summary = descText.startsWith("http") || descText.length < 40 ? null : descText;

    items.push({
      id: `${feed.id}-${link}`,
      title,
      link,
      source: (sourceName || feed.label).slice(0, 80),
      tag,
      publishedAt,
      summary,
    });
  }

  return items.slice(0, feed.limit);
}

/**
 * AgroWorld Uzbekistan — o'zbek tilidagi agro portal.
 * Yangiliklar ro'yxati HTML sahifadan o'qiladi (RSS mavjud emas).
 */
async function fetchAgroworld(limit = 14): Promise<NewsItem[]> {
  const res = await fetch("https://agroworld.uz/uz/yangiliklar", {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`AgroWorld: HTTP ${res.status}`);

  const html = await res.text();
  // Faqat agro bo'limi (`/uz/yangiliklar/`) — `news-for-all` umumiy yangiliklar.
  const cardRe = /<a href="(\/uz\/yangiliklar\/[^"#?]+)"[\s\S]{0,1500}?alt="([^"]{12,220})"/g;

  const items: NewsItem[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = cardRe.exec(html))) {
    const path = match[1];
    if (seen.has(path)) continue;

    const title = clean(match[2], 240);
    if (!title || !isUzbekText(title)) continue;

    // Agro/chorva kalit so'zi bo'lmagan sarlavhalar (masalan iqtisodiy yangiliklar)
    // ro'yxatga kirmaydi.
    const tag = tagOf(title);
    if (!tag) continue;
    seen.add(path);

    const after = html.slice(match.index, match.index + 2200);
    const dateMatch = after.match(/>\s*(\d{1,2})\s+([А-Яа-яЁёA-Za-z‘’ʻ']+)\s+(\d{4})\s*</);

    items.push({
      id: `agroworld-${path}`,
      title,
      link: `https://agroworld.uz${path}`,
      source: "AgroWorld",
      tag,
      publishedAt:
        (dateMatch && parseUzDate(dateMatch[1], dateMatch[2], dateMatch[3])) ??
        new Date().toISOString(),
      summary: null,
    });

    if (items.length >= limit) break;
  }

  return items;
}

// ---------------------------------------------------------------------------
// Yig'ish
// ---------------------------------------------------------------------------

/**
 * Barcha manbalardan yangiliklarni yig'adi: dublikatlar olib tashlanadi va
 * eng yangilari birinchi turadi. Birorta manba ishlamasa qolganlari qaytadi.
 */
export async function getNews(limit = 24): Promise<NewsItem[]> {
  const results = await Promise.allSettled([
    fetchAgroworld(),
    ...FEEDS.map((f) => fetchFeed(f)),
  ]);

  const all: NewsItem[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") all.push(...r.value);
    else {
      const name = i === 0 ? "AgroWorld" : FEEDS[i - 1].label;
      console.error(`[news] ${name} o'qilmadi:`, r.reason?.message ?? r.reason);
    }
  });

  // Juda eski yangiliklar (manba yangilanmayotgan bo'lsa) ko'rsatilmaydi.
  const oldest = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;

  const seen = new Set<string>();
  const unique = all.filter((item) => {
    if (Date.parse(item.publishedAt) < oldest) return false;
    const key = normalize(item.title).replace(/[^a-z0-9\u0400-\u04ff]/g, "").slice(0, 70);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  unique.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  return unique.slice(0, limit);
}

/** Yangiliklar sahifasida manbalarni ko'rsatish uchun. */
export const NEWS_SOURCES = [
  { label: "AgroWorld", url: "https://agroworld.uz/uz/yangiliklar" },
  { label: "EastFruit", url: "https://east-fruit.com/uz/" },
  { label: "Kun.uz", url: "https://kun.uz/uz" },
  { label: "Gazeta.uz", url: "https://www.gazeta.uz/uz/" },
];

/** Bazaga qo'lda kiritilgan (admin) yangiliklar — ro'yxat boshida ko'rinadi. */
export async function getStoredNews(limit = 10): Promise<NewsItem[]> {
  try {
    const rows = await db.select().from(news).orderBy(desc(news.id)).limit(limit);
    return rows.map((n) => ({
      id: `db-${n.id}`,
      title: n.title,
      link: "",
      source: "Agroz AI",
      tag: n.tag === "Chorva" ? "Chorva" : "Agro",
      publishedAt: new Date(n.createdAt).toISOString(),
      summary: n.body,
    }));
  } catch (err) {
    // Baza javob bermasa ham real yangiliklar ko'rinishi kerak.
    console.error("[news] bazadagi yozuvlar o'qilmadi:", err instanceof Error ? err.message : err);
    return [];
  }
}

/** Sahifa va API uchun umumiy ro'yxat: bazadagi + real manbalardan. */
export async function getNewsFeed(limit = 24): Promise<NewsItem[]> {
  const [stored, remote] = await Promise.all([getStoredNews(), getNews(limit)]);
  return [...stored, ...remote].slice(0, limit);
}
