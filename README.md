# Agroz AI — Intelligent Agro & Veterinary Platform

O'zbekiston fermerlari, tomorqachilari va chorvadorlari uchun sun'iy intellektga asoslangan ekin va chorva kasalliklarini tashxislash, yaqin agro-dorixonalar va mutaxassislar xaritasi (5 km yagona radius), Agro Bozor buyurtmalari hamda Telegram Mini App tizimi.

Loyiha arxitekturasi to'liq **Frontend**, **Backend** hamda **Super Admin Panel** qismlariga ajratilgan bo'lib, alohida serverlarda va mustaqil do'menlarda (masalan: `agroz.uz`, `api.agroz.uz`, `admin.agroz.uz`) deploy qilish uchun optimallashtirilgan.

---

## 🚀 Asosiy Imkoniyatlar va Imtiyozlar

* **🤖 AI Tashxis (Crop & Vet AI):** Ekin va chorva kasalligi rasmi yoki ovozli xabarini yuklab, aniq diagnoz, davolash sxemasi va kerakli preparatlar ro'yxatini tezkor olish.
* **📍 5 km Yagona Radius & Xarita:** Dehqon joylashuvidan kelib chiqib 5 km atrofidagi eng yaqin agro-dorixona va mutaxassislarni topish. Radius Super Admin panel orqali dinamik ravishda o'zgartirilishi mumkin.
* **🛒 Agro Bozor & Savat:** Dori vositalarini kartochkadan oson qidirish, savatga qo'shish (`- {soni} +` tugmalari), dorixona manzili (viloyat darajasida) hamda Telegram orqali buyurtma yuborish.
* **👨‍🌾 Agronom va Veterinarlar Chaqiruvi:** Hududdagi mutaxassislarga bir tugma bilan murojaat qilish, ish yakunlangach 1–5 yulduzli baholash va izoh qoldirish.
* **📊 Super Admin Boshqaruv Markazi (`/admin/panel`):**
  * Tizim statistikasi va 14 ta viloyat bo'yicha tahlillar.
  * Sharhlar va reytinglar moderatsiyasi (o'chirish, filtrlash).
  * Ob-havo ogohlantirishlari yuborish.
  * **Bot & Tizim Sozlamalari:** Asosiy va Auth bot tokenlarini, bot username'larini (`@agroz_bot`, `@agroz_auth_bot`) hamda standart radiusni real-vaqtda o'zgartirish va tokenlarni Telegram API orqali test qilish (`/api/admin/telegram/test-token`).
* **✨ Data 0 (Bo'sh holat / Empty State):** Bazada dorilar yoki mutaxassislar hali 0 ta bo'lganida bo'sh sahifa emas, balki agronomi, veterinar va dorixona egalarini `@agroz_auth_bot` orqali bepul ro'yxatdan o'tishga va dorilarni kiritishga chaqiruvchi chiroyli CTA bannerlar.

---

## 🏗 Loyiha Strukturasi (Monorepo)

```
agroz-ai/
├── frontend/                 # Mustaqil Next.js 16 (App Router, Tailwind CSS 4)
│   ├── src/app/             # UI sahifalar (Tashxis, Bozor, Xarita, Mutaxassislar, Profil, Admin Panel)
│   ├── src/components/      # ProductCard, MarketClient, SpecialistsClient, HomeMedicinesShowcase va boshqalar
│   ├── src/lib/             # Frontend constants, stores (savat, yoqtirilganlar), api-client
│   ├── next.config.ts       # Backend API ga proxy rewrites
│   ├── Dockerfile           # Frontend standalone konteyneri
│   ├── vercel.json          # Vercel deployment sozlamalari
│   └── package.json         # Yengil UI bog'liqliklar
│
├── backend/                  # Mustaqil Node.js + Express + TypeScript API server
│   ├── src/server.ts        # Express API server (port 4000)
│   ├── src/routes/          # REST API marshrutlari (/api/diagnose, /api/orders, /api/specialists, /api/admin...)
│   ├── src/db/              # PostgreSQL + Drizzle ORM sxemalari va ulanish
│   ├── src/lib/             # AI tahlil, Telegram botlar, settings, SMS va biznes mantiq
│   ├── scripts/             # seed-data.mjs, db-clear.mjs, telegram bot skriptlari
│   ├── Dockerfile           # Backend standalone konteyneri
│   └── package.json         # Express, Drizzle, Sharp, PG, @google/genai
│
├── docker-compose.yml       # PostgreSQL + Backend + Frontend to'liq konteynerlash
└── package.json             # NPM Workspaces boshqaruv skriptlari
```

---

## ⚡️ Tezkor Ishga Tushirish (Lokal)

### 1. Bog'liqliklarni o'rnatish
```bash
# Loyiha ildizida (frontend va backend avtomatik o'rnatiladi):
npm install
```

### 2. Muhit parametrlarini sozlash
`backend/.env.example` dan nusxa oling:
```bash
cp backend/.env.example backend/.env
```
`backend/.env` faylida `DATABASE_URL` (PostgreSQL / Neon) hamda `GEMINI_API_KEY` ni ko'rsating.

### 3. Ma'lumotlar bazasini tayyorlash va to'ldirish (Seed)
```bash
# Migratsiyalarni yuritish (jadval sxemalarini yaratish):
npm run db:push

# Realistik ma'lumotlarni kiritish (dorixonalar, mutaxassislar, dorilar, namunaviy buyurtmalar):
npm run db:seed
```

### 4. Serverlarni ishga tushirish
```bash
# Frontend va Backend'ni bir vaqtda ishga tushirish:
npm run dev:all
```
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000` (Healthcheck: `http://localhost:4000/api/health`)

Yoki alohida terminallarda:
```bash
npm run dev:frontend   # Faqat frontend (Next.js)
npm run dev:backend    # Faqat backend (Express API)
```

---

## 🐳 Docker orqali Ishga Tushirish

Butun tizimni (PostgreSQL + Express Backend + Next.js Frontend) bitta buyruq bilan konteynerda yurgizish:

```bash
docker-compose up -d --build
```
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000`
- **PostgreSQL**: `localhost:5432`

---

## 🚀 Serverlarga Deploy Qilish (Production Guide)

Tizim uchta mustaqil qismga bo'lingan va alohida hostlarga deploy qilinishi mumkin:

### A. Frontend Deploy (Vercel / Netlify / VPS)
1. Vercel dashboardida GitHub repozitoriyangizni ulang (`agroz-ai`).
2. **Root Directory**: `frontend` qilib belgilang.
3. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` = `https://api.agroz.uz` (Backend API manzili)
   - `NEXT_PUBLIC_TELEGRAM_AUTH_BOT_USERNAME` = `agroz_auth_bot`
4. Deploy tugmasini bosing.

### B. Backend Deploy (Ubuntu VPS / Hetzner / Railway / Render)
1. Serverga `backend` papkasini yoki repozitoriyani ko'chiring.
2. Muhit parametrlarini kiriting:
   - `DATABASE_URL` = `postgresql://user:pass@host/db?sslmode=require`
   - `PORT` = `4000`
   - `CORS_ORIGIN` = `https://agroz.uz`
   - `GEMINI_API_KEY` = Google Gemini API kaliti
   - `TELEGRAM_BOT_TOKEN` = Mijoz boti tokeni
   - `TELEGRAM_AUTH_BOT_TOKEN` = Mutaxassis va dorixonalar boti tokeni
   - `ADMIN_USERNAME` va `ADMIN_PASSWORD` = Super admin panel kalitlari
3. Build va start:
   ```bash
   npm ci
   npm run build
   npm start
   ```

---

## 🤖 Telegram Botlar va Webhooklar

1. **Mijoz Boti (`TELEGRAM_BOT_TOKEN`)**:
   - Telegram Mini App va xabarnomalar yuborish.
2. **Auth & Boshqaruv Boti (`TELEGRAM_AUTH_BOT_TOKEN` - `@agroz_auth_bot`)**:
   - Agronom, veterinar va agro-dorixona egalarini ro'yxatdan o'tkazish.
   - Dorilar katalogini rasm, narx va tavsifi bilan qo'shish hamda boshqarish.

Lokal bot testlash (Polling):
```bash
npm run telegram:poll
```

---

## 🛠 Typecheck & Testlar

Loyihada TypeScript xatolari yo'qligini tekshirish:
```bash
npm run typecheck:frontend   # Frontend (0 xato)
npm run typecheck:backend    # Backend (0 xato)
```
