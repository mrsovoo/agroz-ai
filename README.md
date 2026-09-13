# AgroVet AI

Telegram Mini App va oddiy web sayt sifatida ishlaydigan agro/chorva yordamchisi:
ekin va chorva kasalliklarini rasm/matn/ovoz orqali tashxislash, yaqin dorixonalar
xaritasi, ob-havoga qarab tavsiyalar va OTP/Telegram orqali kirish.

## Imkoniyatlar

- **AI tashxis** — rasm, matn yoki ovoz asosida ekin/chorva muammosini tahlil qiladi.
  `OPENAI_API_KEY` bo'lmasa ham offline demo baza javob beradi (ilova ishdan chiqmaydi).
- **Telegram Mini App** — `initData` imzosi server tomonda tekshiriladi, mobil ilova uslubidagi UI.
- **Web sayt** — desktop browserda keng layout va top navigation.
- **Xarita** — Leaflet + OpenStreetMap; GPS bo'yicha eng yaqin agro/vet dorixonalar,
  dori mavjudligi, qo'ng'iroq va yo'nalish.
- **Ob-havo** — Open-Meteo real API asosida purkash/chorva parvarishi tavsiyasi.
- **Kirish** — Telegram yoki SMS OTP (Eskiz.uz). Sessiyalar bazada, muddati bilan.
- **Baza** — PostgreSQL (Neon) + Drizzle ORM, migratsiyalar `drizzle/` ichida.

## Texnologiyalar

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 ·
Drizzle ORM + `pg` · Leaflet · lucide-react

## Local ishga tushirish

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
# .env ichida DATABASE_URL ni to'ldiring
npm run db:migrate        # jadvallarni yaratadi
npm run dev
```

`http://localhost:3000` oching. `DATABASE_URL` bo'lmasa ilova build bo'ladi, lekin
birinchi so'rovda aniq xato beradi — shuning uchun `.env`ni to'ldirish shart.

## Muhit o'zgaruvchilari

| O'zgaruvchi | Majburiy | Vazifasi |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL/Neon ulanish satri (`?sslmode=require` bilan) |
| `TELEGRAM_BOT_TOKEN` | production | `initData` imzosini tekshirish (BotFather beradi) |
| `NEXT_PUBLIC_APP_URL` | tavsiya | Sayt domeni (metadata, kanonik havolalar) |
| `OPENAI_API_KEY` | ✖ | AI tashxis + ovoz (Whisper). Bo'sh bo'lsa offline demo rejim |
| `OPENAI_BASE_URL`, `AI_MODEL`, `ASR_MODEL` | ✖ | OpenAI-compatible (vLLM, Qwen) endpoint uchun |
| `ESKIZ_EMAIL`, `ESKIZ_PASSWORD`, `ESKIZ_FROM` | ✖ | Real SMS yuborish (Eskiz.uz) |
| `OTP_DEV_MODE` | ✖ | `true` bo'lsa SMS yo'q bo'lganda ham kod API javobida qaytadi |
| `ALLOW_UNVERIFIED_TELEGRAM` | ✖ | Bot tokeni yo'q bo'lsa ham imzosiz Telegram kirishga ruxsat |
| `PGSSL`, `PGPOOL_MAX`, `COOKIE_SECURE` | ✖ | DB/cookie nozik sozlamalari |

## Kirish (OTP) qanday ishlaydi

- Kod **6 xonali**, `crypto.randomInt` bilan generatsiya qilinadi, 5 daqiqa amal qiladi.
- Bitta kod uchun **5 ta urinish** — tugasa kod bloklanadi.
- So'rov cheklovlari: IP uchun 10 ta / 10 daqiqa, raqam uchun 3 ta / 10 daqiqa.
- Kod javobda **faqat** `NODE_ENV !== "production"` yoki `OTP_DEV_MODE=true` bo'lganda qaytadi.

Real SMS uchun Eskiz.uz hisobingizdagi `ESKIZ_EMAIL` / `ESKIZ_PASSWORD`ni qo'ying.
Eskiz moderatsiyasidan o'tgan shablon matni kerak bo'ladi (standart test `from` — `4546`).

## Neon Database

1. [neon.tech](https://neon.tech) da project yarating.
2. Connection string oling:
   ```bash
   postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require
   ```
3. Uni `.env` va Vercel envga `DATABASE_URL` sifatida qo'ying.
4. Jadval yaratish:
   ```bash
   npm run db:migrate
   ```

`vercel-build` skripti deploy paytida migratsiyani avtomatik yuritadi.

## Vercel'ga deploy

1. Reponi GitHub'ga push qiling va Vercel'da **New Project** → import qiling.
2. **Settings → Environment Variables** da quyidagilarni kiriting:
   ```bash
   DATABASE_URL=postgresql://...?...sslmode=require
   TELEGRAM_BOT_TOKEN=123456:ABC...
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   OPENAI_API_KEY=sk-...          # ixtiyoriy
   ESKIZ_EMAIL=...                # ixtiyoriy (real SMS uchun)
   ESKIZ_PASSWORD=...
   ```
3. Deploy qiling. Build bosqichida `npm run db:migrate && next build` bajariladi.
4. `https://your-app.vercel.app/api/health` ochib DB ulanishini tekshiring
   (`{"ok":true}` qaytishi kerak).
5. Telegram botni ulang (quyida).

> Eslatma: `npm run vercel-build` ichida `drizzle-kit` ishlatiladi, u devDependency —
> Vercel build paytida devDependencies ham o'rnatiladi, shuning uchun bu ishlaydi.

## Telegram Mini App

1. `@BotFather` da bot yarating.
2. Mini App URL'ini sozlang:
   ```text
   /newapp        # yoki mavjud bot uchun /setmenubutton
   ```
   URL: `https://your-app.vercel.app` (faqat HTTPS).
3. `TELEGRAM_BOT_TOKEN` envga aynan shu bot tokenini qo'ying.

Token bo'lmasa production'da Telegram orqali kirish **ataylab yopiq** (503), chunki
imzo tekshirilmay istalgan odam boshqa birovning nomidan kirishi mumkin. Vaqtinchalik
test uchun `ALLOW_UNVERIFIED_TELEGRAM=true` qo'yish mumkin — keyin o'chirib tashlang.

## Tavsiya etilgan open-source AI

- `Qwen/Qwen2.5-VL-7B-Instruct` — rasm + matn tashxis uchun eng yaxshi balans.
- `Qwen/Qwen2.5-VL-32B-Instruct`, `InternVL3-8B` — kuchliroq production uchun.
- `Qwen3-Embedding-0.6B` + `Qwen3-Reranker-0.6B` — real hujjatlardan RAG qidiruv uchun.

VLLM serveringizni `OPENAI_BASE_URL` (masalan `https://ai.example.com/v1`) va
`AI_MODEL` orqali ulaysiz.

## Tekshirish

```bash
npm run lint
npm run typecheck
npm run build
```

## Loyiha tuzilishi

```text
src/
  app/                 # App Router: sahifalar va API route'lar
    api/               # auth, diagnose, transcribe, weather, pharmacies, news, health
  components/          # UI (DiagnoseForm, MapClient, WeatherCard, navlar...)
  db/                  # Drizzle sxema va lazy pool
  lib/                 # ai, session, seed, sms, rate-limit, validate, constants
drizzle/               # SQL migratsiyalar
docs/INTEGRATION.md    # integratsiya va real ma'lumot manbalari
```
