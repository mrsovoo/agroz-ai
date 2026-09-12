# AgroVet AI — Telegram Mini App + Real API Integratsiyasi

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
3. **URL** sifatida o'zingizning joylashtirilgan domeningizni kiriting (masalan `https://agrovet.uz`).

### Muhim muhit o'zgaruvchilari (`.env`)
| O'zgaruvchi | Nima uchun |
|---|---|
| `TELEGRAM_BOT_TOKEN` | initData imzosini tekshirish (xavfsizlik). BotFather beradi. |
| `OPENAI_API_KEY` | AI tashxis (GPT-4o vision) va ovozni matnga aylantirish (Whisper). |
| `DATABASE_URL` | PostgreSQL ulanishi. |

> `TELEGRAM_BOT_TOKEN` qo'yilmasa, ilova "demo rejimda" ishlaydi (imzo tekshirilmaydi). **Production uchun majburiy qo'ying.**

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
Hozir kod test rejimida javobda qaytadi. Real SMS uchun:
- **Eskiz.uz** — O'zbekistondagi eng mashhur SMS provayder (o'zbek tilidagi API, arzon).
- **SMS Gateway** alternativlari: Mobizon, SMSC.uz.

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
