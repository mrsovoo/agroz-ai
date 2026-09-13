# Agroz AI — Telegram Mini App + Neon + Vercel Integratsiyasi

## Tezkor production checklist

1. Neon'da PostgreSQL database yarating.
2. Vercel envga `DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `OPENAI_API_KEY`, `NEXT_PUBLIC_APP_URL` qo'ying.
3. Vercel deploy qiling. `vercel-build` avtomatik `npm run db:migrate && next build` bajaradi.
4. BotFather'da `/newapp` yoki `/setmenubutton` orqali Vercel domenini Telegram Mini App URL sifatida bering.
5. `/api/health` ochib DB ulanishini tekshiring.

## 1. Telegram Mini App sifatida ishga tushirish

Ilova allaqachon Telegram WebApp SDK bilan ulangan. Uni `Launch App` tugmasi bilan ochish uchun:

### BotFather orqali sozlash
1. `@BotFather` ga kiring va bot yarating (yoki mavjud botni tanlang).
2. Bot uchun menyu tugmasini sozlang:
   ```
   /newapp
   ```
   yoki botga quyidagi rasmda ko'rsatilganidek Web App URL bering:
   ```
   /setmenubutton
   ```
3. **URL** sifatida o'zingizning joylashtirilgan domeningizni kiriting (masalan `https://agroz-ai.vercel.app`).

### Muhim muhit o'zgaruvchilari (`.env`)
| O'zgaruvchi | Nima uchun |
|---|---|
| `TELEGRAM_BOT_TOKEN` | initData imzosini tekshirish (xavfsizlik). BotFather beradi. |
| `OPENAI_API_KEY` | AI tashxis (GPT-4o vision) va ovozni matnga aylantirish (Whisper). |
| `DATABASE_URL` | PostgreSQL ulanishi. |
| `ESKIZ_EMAIL` / `ESKIZ_PASSWORD` | Real SMS yuborish (Eskiz.uz). Bo'lmasa OTP dev rejimda. |
| `OPENAI_BASE_URL` | OpenAI-compatible open-source model endpointi, ixtiyoriy. |
| `AI_MODEL` | Masalan `Qwen/Qwen2.5-VL-7B-Instruct` yoki `gpt-4o`. |

> `TELEGRAM_BOT_TOKEN` qo'yilmasa, **production'da Telegram orqali kirish yopiq (503)** — imzo tekshirilmay turib kirishga ruxsat berish xavfli. Faqat vaqtinchalik test uchun `ALLOW_UNVERIFIED_TELEGRAM=true` qo'yish mumkin, keyin albatta o'chirib tashlang.

### HTTPS talabi
Telegram Mini App faqat **HTTPS** bilan ishlaydi. Vercel, Netlify yoki Cloudflare Pages'da joylashtirishingiz mumkin.

---

## 2. Real ma'lumotlar uchun API tavsiyalari

### 🌤 Ob-havo (allaqachon ulangan)
- **Open-Meteo** — hozir ishlatilmoqda, kalit kerak emas, bepul.
- Kuchliroq alternativ: **OpenWeatherMap** (`https://openweathermap.org/api`) — bepul darajasi bor, aniqroq agrometrik ma'lumot.

### 🧠 AI Tashxis (allaqachon ulangan)
- **OpenAI GPT-4o / GPT-4o-mini** — rasm + matn tahlili. `OPENAI_API_KEY` qo'yilsa ishlaydi.
- Alternativ: **Google Gemini 1.5 / 2.0 Flash** — bepul kvota bor, vision sifati yuqori. (Gemini ham qo'shib berish mumkin.)

### 🎤 Ovoz → matn (STT) (allaqachon ulangan)
- **OpenAI Whisper API** — `audio/transcriptions`, o'zbek tili qo'llab-quvvatlanadi.
- Alternativ: **Google Cloud Speech-to-Text**.

### 🗺 Xarita (allaqachon ulangan)
- **Leaflet + OpenStreetMap** — bepul, kalit kerak emas (hozirgi yechim).
- **Yandex Maps API** — O'zbekistonda eng aniq qamrov, dorixona qidirish va geo-kodlash uchun. Kalit kerak: `https://developer.tech.yandex.ru`
- **Google Maps API** — Directions (yo'nalish) uchun.

### 📱 SMS (OTP) — real SMS yuborish uchun
**Eskiz.uz allaqachon ulangan** (`src/lib/sms.ts`). `ESKIZ_EMAIL`, `ESKIZ_PASSWORD`
(va kerak bo'lsa `ESKIZ_FROM`) envlarini qo'ysangiz, kod real SMS orqali ketadi.
Eskiz panelida yuboriladigan matn moderatsiyadan o'tgan shablon bilan mos bo'lishi kerak; test uchun `from=4546` ishlaydi.

SMS provayder sozlanmagan bo'lsa:
- development'da kod API javobida `devCode` sifatida qaytadi;
- production'da endpoint 503 qaytaradi (yoki ataylab `OTP_DEV_MODE=true` qiling).

Alternativ provayderlar: Mobizon, SMSC.uz — `src/lib/sms.ts` ichidagi funksiyaga qo'shish kifoya.

### 💊 Dorixonalar va dorilar bazasi (eng muhim real data)
Hozirgi seed ma'lumotlar (20 dorixona) demo. Real ma'lumot yig'ish manbalari:
1. **data.gov.uz** — O'zbekiston ochiq ma'lumotlar portali (dorixonalar ro'yxati).
2. **Yandex Maps / Google Places API** — "agro dorixona", "veterinariya" qidiruv natijalari (rasmiy manzil, telefon, koordinata).
3. **Davlat veterinariya qo'mitasi** tuman bo'limlari — telefon va manzil ro'yxatlari.
4. **Agrosanoat do'konlari tarmoqlari** bilan hamkorlik (masalan "Agro Market" tarmog'i).

### 🔐 Telegram Login (allaqachon ulangan)
- **Telegram WebApp initData** — foydalanuvchi identifikatsiyasi (SMS o'rniga). Endi ishlaydi.

---

## 3. Keyingi qadamlar (tavsiya)
1. `.env` ga `TELEGRAM_BOT_TOKEN` va `OPENAI_API_KEY` qo'ying.
2. Vercel/Netlify'da joylashtiring (HTTPS).
3. BotFather orqali Launch App tugmasini sozlang.
4. Real dorixona ma'lumotlarini to'plash uchun Yandex Maps API'ni ulang yoki data.gov.uz'dan import qiling.
