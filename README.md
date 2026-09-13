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
  ularning dorilari, ro'yxatdan o'tgan mutaxassislar, qo'ng'iroq va yo'nalish.
  Barcha qidiruv **qat'iy 5 km** radius bilan cheklangan.
- **Maslahatlar** — Open-Meteo real ob-havosi va **turgan hudud** asosida maslahatlar
  (ekin va chorva uchun alohida) hamda agro/chorvachilik **yangiliklari** real
  manbalardan (AgroWorld, EastFruit, Kun.uz, Gazeta.uz).
- **Faol ma'lumot** — platformada faqat real ma'lumot: dorixona/mutaxassis
  `@agroz_auth_bot` orqali, dorilar esa dorixona egalari tomonidan qo'shiladi.
  Demo ma'lumot standart holatda butunlay o'chirilgan (`SEED_DEMO_DATA=false`).
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

Bazadagi hamma yozuvni tozalash (jadvallar qoladi, migratsiya qayta yuritilmaydi):

```bash
npm run db:clear          # so'raydi
npm run db:clear -- --yes # so'ramasdan o'chiradi
```

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
| `NEXT_PUBLIC_TELEGRAM_AUTH_BOT_USERNAME` | ✖ | Xuddi shu username, saytdagi havolalar uchun (default `agroz_auth_bot`) |
| `SEED_DEMO_DATA` | ✖ | `true` bo'lsa namuna dorixona/dori/maslahat yoziladi. Standart: `false` |
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

Bot buyruqlari: `/start`, `/royxatdan_otish`, `/dori_qoshish`, `/malumotlarim`,
`/bekor`, `/yordam`.

### Dorixona uchun dori qo'shish

Dorixona egasi ro'yxatdan o'tgach `/dori_qoshish` buyrug'i bilan dori qo'shadi:

1. Dorining **rasmini** yuboradi (eng katta o'lchamdagi variant olinadi)
2. Dorining **nomini** yozadi
3. Bot rasmni nomi bilan qaytarib, **«✅ Tasdiqlash»**ni so'raydi
4. Tasdiqlansa dori platformaga qo'shiladi

Dori rasmi Telegram `file_id` sifatida saqlanadi va saytda `/api/medicines/<id>/photo`
orqali uzatiladi — bot tokeni clientga hech qachon chiqmaydi.

> Dorilar ro'yxati **faqat tashxis qo'yilgandan keyin** ko'rinadi: natija sahifasida
> tavsiya etilgan dorilar bo'yicha 5 km ichidagi dorixonalar (rasmi va nomi bilan)
> ko'rsatiladi. Alohida dori katalogi sahifasi yo'q.

## Maslahatlar va yangiliklar (`/yangiliklar`)

Sahifa ikki qismdan iborat:

1. **Hudud uchun maslahatlar** — foydalanuvchi lokatsiyasi olinadi, ob-havo
   Open-Meteo'dan, hudud nomi OpenStreetMap'dan (1 soat kesh) aniqlanadi. So'ng
   harorat, shamol, yog'in va namlik + joriy mavsum asosida maslahatlar
   hisoblanadi (`src/lib/advice.ts`) — ekinlar va chorva uchun alohida.
2. **Agro va chorvachilik yangiliklari** — real manbalardan yig'iladi
   (`src/lib/news.ts`): AgroWorld (agro portal), EastFruit, Kun.uz va Gazeta.uz
   RSS. Sarlavhalar agro/chorva kalit so'zlari bo'yicha filtrlanadi, rus tilidagi
   yangiliklar tashlab yuboriladi, dublikatlar olib tashlanadi. Natija 30 daqiqaga
   kesh qilinadi va `Agro`/`Chorvachilik` bo'yicha filtrlanadi.

Birorta manba ishlamasa qolganlari ko'rsatiladi; hammasi ishlamasa sahifada
ob-havo maslahatlari saqlanib qoladi.

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
   # Mutaxassis/dorixona egalarini ro'yxatdan o'tkazuvchi bot (ixtiyoriy)
   TELEGRAM_AUTH_BOT_TOKEN=8943...:AAG...
   TELEGRAM_AUTH_BOT_USERNAME=agroz_auth_bot
   NEXT_PUBLIC_TELEGRAM_AUTH_BOT_USERNAME=agroz_auth_bot
   OPENAI_API_KEY=sk-...          # ixtiyoriy
   ESKIZ_EMAIL=...                # ixtiyoriy (SMS kerak bo'lsa)
   ESKIZ_PASSWORD=...
   ```

   ⚠️ Env o'zgaruvchi qo'shgach **Redeploy** qiling — o'zgarish faqat yangi
   deployment'da kuchga kiradi.
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

## Bepul AI modellari (agro/chorva tashxisi uchun)

Tashxis **rasm** talab qiladi, shuning uchun faqat vision modellari yaroqli.
Loyiha OpenAI-mos API bilan ishlaydi — provayderni almashtirish uchun faqat
`OPENAI_API_KEY`, `OPENAI_BASE_URL`, `AI_MODEL` o'zgaradi (kod tegmaysan).

| Provayder | Model | Bepul limit | Rasm | Izoh |
|---|---|---|---|---|
| **Google AI Studio** | `gemini-3.8-flash` | ~15 req/daq, 100–1000/kun | ✅ | Eng sifatli bepul vision, o'zbekcha yaxshi |
| **Groq** | `llama-4-scout` | 30 req/daq, 1000/kun | ✅ | Eng tez; ma'lumot o'qitilmaydi |
| **OpenRouter** | turli `:free` vision modellari | 50/kun, 20/daq | ✅ | Eng keng tanlov |
| **Cloudflare Workers AI** | Llama 4 Scout va b. | 10 000 neuron/kun | ✅ | Edge'da ishlaydi |

### Gemini (bepul) ulash
```bash
OPENAI_API_KEY=<Gemini kaliti>
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
AI_MODEL=gemini-3.8-flash
```
Kalit: https://aistudio.google.com/apikey

### Muhim: aniqroq >80% uchun

Umumiy vision LLM'lar agro/chorvada **yaxshi, lekin mukammal emas**. Yuqori
aniqlik uchun maxsus o'qitilgan modellar bor (PlantVillage asosida):

- `linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification` (HuggingFace, bepul)
- `wambugu71/crop_leaf_diseases_vit` — ViT, o'simlik barglari uchun
- PlantVillage to'plamida o'qitilgan CNN'lar ~**94–95%** aniqlik beradi (38 kasallik sinfi)

Bunday modellar **faqat tasniflaydi** (o'simlik bargi, O'zbekiston dorilari yo'q).
Shuning uchun to'liq yechim — **gibrid**: dastlab maxsus tasniflagich, ishonch past
bo'lsa LLM + mutaxassisga yo'naltirish.

### Ishonch darajasi va mutaxassisga yo'naltirish

AI javobida `confidence` (0–100) qaytaradi. `CONFIDENCE_THRESHOLD = 80` dan past
bo'lsa — natija sahifasida qizil ogohlantirish chiqadi va **5 km ichidagi
mutaxassislar** tavsiya etiladi. Offlayn (kalitsiz) rejimda ishonch ataylab 40–60
darajada qo'yiladi, shunda foydalanuvchi har doim mutaxassisga yo'naltiriladi.

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
    api/               # auth, telegram/webhook, telegram/auth-webhook, diagnose, transcribe, weather, location, pharmacies, specialists, news, health
    mutaxassislar/     # ro'yxatdan o'tgan mutaxassislar (5 km radius)
    yangiliklar/       # maslahatlar + agro/chorvachilik yangiliklari
  components/          # UI (DiagnoseForm, MapClient, WeatherCard, NewsList, navlar...)
  db/                  # Drizzle sxema va lazy pool
  lib/                 # ai, session, seed, sms, telegram-bot, auth-bot, auth-bot-flow, specialists, geo, advice, news, geocode, rate-limit, validate, constants
scripts/               # telegram:setup, telegram:poll, db:clear
drizzle/               # SQL migratsiyalar
docs/INTEGRATION.md    # integratsiya va real ma'lumot manbalari
```
