# Agroz AI

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
| `TELEGRAM_BOT_TOKEN` | production | `initData` imzosini tekshirish + OTP kodni bot orqali yuborish |
| `TELEGRAM_WEBHOOK_SECRET` | tavsiya | Bot webhook'ini soxta so'rovlardan himoyalash |
| `TELEGRAM_BOT_USERNAME` | ✖ | Bot username (`@` siz); bo'sh bo'lsa `getMe` orqali olinadi |
| `TELEGRAM_AUTH_BOT_TOKEN` | ✖ | `@agroz_auth_bot` tokeni — mutaxassis/dorixona egalarini ro'yxatdan o'tkazish |
| `TELEGRAM_AUTH_BOT_USERNAME` | ✖ | Auth bot username (asosiy botdagi havola uchun); default `agroz_auth_bot` |
| `TELEGRAM_AUTH_WEBHOOK_SECRET` | ✖ | Auth bot webhook'i uchun alohida kalit (bo'sh bo'lsa `TELEGRAM_WEBHOOK_SECRET`) |
| `NEXT_PUBLIC_APP_URL` | tavsiya | Sayt domeni (metadata, kanonik havolalar) |
| `OPENAI_API_KEY` | ✖ | AI tashxis + ovoz (Whisper). Bo'sh bo'lsa offline demo rejim |
| `OPENAI_BASE_URL`, `AI_MODEL`, `ASR_MODEL` | ✖ | OpenAI-compatible (vLLM, Qwen) endpoint uchun |
| `ESKIZ_EMAIL`, `ESKIZ_PASSWORD`, `ESKIZ_FROM` | ✖ | Real SMS yuborish (Eskiz.uz) |
| `OTP_DEV_MODE` | ✖ | `true` bo'lsa SMS yo'q bo'lganda ham kod API javobida qaytadi |
| `ALLOW_UNVERIFIED_TELEGRAM` | ✖ | Bot tokeni yo'q bo'lsa ham imzosiz Telegram kirishga ruxsat |
| `PGSSL`, `PGPOOL_MAX`, `COOKIE_SECURE` | ✖ | DB/cookie nozik sozlamalari |

## Mutaxassislar va dorixona egalari (`@agroz_auth_bot`)

Alohida bot (`TELEGRAM_AUTH_BOT_TOKEN`) mutaxassis va dorixona egalarini
ro'yxatdan o'tkazadi. Har bir Telegram hisobi uchun **bitta profil** saqlanadi,
qayta o'tilsa ma'lumotlar yangilanadi.

Ro'yxatdan o'tish bosqichlari (`/royxatdan_otish`):

1. **Turi** — mutaxassis yoki dorixona egasi (inline tugmalar)
2. **Ism-familiya** — matn
3. **Telefon** — «📱 Telefon raqamni yuborish» tugmasi yoki qo'lda `+998XXXXXXXXX`
4. **Lokatsiya** — «📍 Lokatsiyani yuborish». Bot koordinatadan manzilni **avtomatik**
   aniqlaydi (OpenStreetMap Nominatim, lotin o'zbekcha) va matn ko'rinishida yuborib
   tasdiqlashni so'raydi: «✅ Manzil to'g'ri» yoki «✏️ O'zim yozaman».
   Aniqlanmasa — manzil qo'lda so'raladi (oqim to'xtamaydi).
5. **Mutaxassislik** — tayyor variantlar (Agronom, Veterinar, Zootexnik, Bog'bon) yoki o'zi yozadi;
   dorixona egasi uchun avval dorixona nomi, keyin turi (agro/vet)
6. **Tasdiqlash** — ✅ / ❌ → profil tanlangan **rol bo'yicha** saqlanadi va platformada ko'rinadi

Saqlangan profillar `/api/specialists` orqali olinadi va platformada ko'rinadi:

- **`/mutaxassislar`** — yaqin atrofdagi mutaxassislar ro'yxati (qo'ng'iroq + yo'nalish)
- **`/xarita`** — umumiy xarita; «Mutaxassis» filtri bilan

> **5 km qoidasi:** yaqin atrof qidiruvida radius qat'iy cheklangan —
> `MAX_NEARBY_RADIUS_KM = 5`. Dorixonalar ham (`/api/pharmacies`), mutaxassislar ham
> (`/api/specialists`) shu radiusdan uzoqni qaytarmaydi; `radius` parametri 5 km dan
> oshirilmaydi.

Bot buyruqlari: `/start`, `/royxatdan_otish`, `/malumotlarim`, `/bekor`, `/yordam`.

## Kirish (OTP) qanday ishlaydi

Kod **6 xonali**, `crypto.randomInt` bilan generatsiya qilinadi. Bitta kod uchun **5 ta urinish**,
so'rov cheklovlari: IP uchun 10 ta / 10 daqiqa, raqam uchun 3 ta / 10 daqiqa.

Kod uchta kanaldan biri orqali yetkaziladi (ustuvorlik tartibida):

| Kanal | Qachon ishlaydi | Kod qayerda chiqadi |
|---|---|---|
| **1. Telegram bot** | `TELEGRAM_BOT_TOKEN` bor | Bot chatida (nusxa olinadigan) |
| **2. SMS (Eskiz.uz)** | `ESKIZ_EMAIL`/`ESKIZ_PASSWORD` bor | Telefonda |
| **3. Dev rejim** | development yoki `OTP_DEV_MODE=true` | API javobida |

### Telegram bot orqali kirish oqimi

1. Foydalanuvchi saytda telefon raqamini kiritadi va **«Tasdiqlash kodini olish»** ni bosadi.
2. Sayt botga bir martalik havola beradi: `https://t.me/<bot>?start=<token>`.
3. Foydalanuvchi botda **«Start»** bosadi — bot kodni shu chatga yuboradi (kodni bosib nusxa olish mumkin).
4. Kodni saytga qaytib kiritadi va tasdiqlaydi.
5. Shu bilan Telegram hisobi foydalanuvchi profiliga ulanadi — keyin Mini Appga kirsa **o'sha profilga** tushadi.

Xavfsizlik: havola tokeni 24 bayt tasodifiy, 10 daqiqa amal qiladi, bir marta ishlatiladi;
bot o'z navbatida `TELEGRAM_WEBHOOK_SECRET` bilan tekshiriladi.

> Kod javobda **faqat** development'da yoki `OTP_DEV_MODE=true` bo'lganda qaytadi.

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
   TELEGRAM_WEBHOOK_SECRET=<openssl rand -hex 32>
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   OPENAI_API_KEY=sk-...          # ixtiyoriy
   ESKIZ_EMAIL=...                # ixtiyoriy (SMS kerak bo'lsa)
   ESKIZ_PASSWORD=...
   ```
3. Deploy qiling. Build bosqichida `npm run db:migrate && next build` bajariladi.
4. `https://your-app.vercel.app/api/health` ochib DB ulanishini tekshiring
   (`{"ok":true}` qaytishi kerak).
5. Telegram botni ulang (quyida).

> Eslatma: `npm run vercel-build` ichida `drizzle-kit` ishlatiladi, u devDependency —
> Vercel build paytida devDependencies ham o'rnatiladi, shuning uchun bu ishlaydi.

## Telegram Mini App va bot

1. `@BotFather` da bot yarating va tokenini `TELEGRAM_BOT_TOKEN`ga qo'ying.
2. Botni ilovaga ulang (webhook + menyu tugmasi + `/start` buyrug'i):
   ```bash
   npm run telegram:setup
   ```
   Skript `.env`dagi `NEXT_PUBLIC_APP_URL` va `TELEGRAM_BOT_TOKEN`dan foydalanadi va
   botning menyu tugmasini Mini Appga ulaydi. `TELEGRAM_AUTH_BOT_TOKEN` bo'lsa,
   `@agroz_auth_bot` webhook'i (`/api/telegram/auth-webhook`) ham shu skriptda ulanadi.
3. (Ixtiyoriy) `@BotFather` orqali qo'lda sozlash:
   ```text
   /newapp        # yoki /setmenubutton
   ```
   URL: `https://your-app.vercel.app` (faqat HTTPS).

### Localda botlarni sinash (long-polling)

Telegram webhook faqat **public HTTPS** manzilga ishlaydi, shuning uchun `localhost`da
webhook o'rnatib bo'lmaydi. Local uchun polling rejimi bor — u `getUpdates` orqali
update'larni olib, **aynan shu** webhook route'lariga uzatadi (bot mantig'i bir xil):

```bash
# 1-terminal
npm run dev
# 2-terminal
npm run telegram:poll
```

Skript `TELEGRAM_BOT_TOKEN` va `TELEGRAM_AUTH_BOT_TOKEN` bor botlarni birga pollaydi.
Eslatma: polling `deleteWebhook` qiladi — keyin production'ga chiqsangiz
`npm run telegram:setup` bilan webhook'ni qayta o'rnating.

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
    api/               # auth, telegram/webhook, telegram/auth-webhook, diagnose, transcribe, weather, pharmacies, specialists, news, health
    mutaxassislar/     # ro'yxatdan o'tgan mutaxassislar (5 km radius)
  components/          # UI (DiagnoseForm, MapClient, WeatherCard, navlar...)
  db/                  # Drizzle sxema va lazy pool
  lib/                 # ai, session, seed, sms, telegram-bot, auth-bot, auth-bot-flow, specialists, geo, rate-limit, validate, constants
scripts/               # telegram:setup (webhook va menyu tugmasini o'rnatish)
drizzle/               # SQL migratsiyalar
docs/INTEGRATION.md    # integratsiya va real ma'lumot manbalari
```
