# 🚀 Agroz AI — Intelligent Agro & Veterinary Platform

O'zbekiston fermerlari, tomorqachilari va chorvadorlari uchun sun'iy intellektga asoslangan ekin va chorva kasalliklarini tashxislash, yaqin agro-dorixonalar va mutaxassislar xaritasi (5 km yagona radius), Agro Bozor buyurtmalari hamda Telegram Mini App tizimi.

Loyiha to'liq **3 ta mustaqil ilovaga** ajratilgan bo'lib, serverlarga alohida joylashtirish (deploy qilish) va do'menlarga ulash uchun 100% tayyorlangan.

---

## 🏗 Loyiha Strukturasi va Do'menlar Xaritasi

```
agroz-ai/
├── frontend/     # agroz.uz          (Mijozlar va Telegram Mini App uchun Next.js ilovasi)
├── admin/        # admin.agroz.uz    (Super Admin Boshqaruv Paneli — Standalone Next.js)
├── backend/      # api.agroz.uz      (Express API Server, PostgreSQL va Telegram Bot Webhooklar)
└── docker-compose.yml                # Barcha 3 ta ilova + PostgreSQL konteyneri
```

### 📋 Serverlar va Servislar Jadvali:

| Qism | Do'men (Misol) | Tavsiya Etiladigan Platforma | Vazifasi va Xususiyati |
| :--- | :--- | :--- | :--- |
| **Frontend** | `agroz.uz` | **Vercel** / Netlify | Mijozlar uchun asosiy Web va Telegram Mini App (Next.js 16) |
| **Admin Panel** | `admin.agroz.uz` | **Vercel** / Cloudflare Pages | Super Admin uchun alohida Vercel loyihasi sifatida deploy qilinadi |
| **Backend** | `api.agroz.uz` | **Render** / Railway / VPS | Express Node.js API, Telegram bot webhooklari va AI tahlil xizmati |
| **PostgreSQL** | — | **Neon.tech** / Supabase | Serverless PostgreSQL ma'lumotlar bazasi (Drizzle ORM) |

---

## 🔗 Frontend va Backend Bir-biriga Qanday Ulanadi?

1. **API Murojaati (`NEXT_PUBLIC_API_URL`):**
   * **Frontend (`agroz.uz`)** hamda **Admin Panel (`admin.agroz.uz`)** barcha so'rovlarni (AI tashxis, dorilar, buyurtmalar, admin sozlamalar) backend API do'meniga (`https://api.agroz.uz`) yuboradi.
   * `next.config.ts` ichidagi `rewrites` sozlamasi `/api/:path*` so'rovlarini avtomatik ravishda backend serverga yo'naltirib beradi.

2. **CORS Ruxsati (`CORS_ORIGIN`):**
   * Backend server (`api.agroz.uz`) xavfsizlik yuzasidan faqat ruxsat berilgan frontend domenlariga javob qaytaradi.
   * Backend `.env` faylidagi `CORS_ORIGIN` o'zgaruvchisiga:
     `CORS_ORIGIN=https://agroz.uz,https://admin.agroz.uz` shaklida domenlar yoziladi.

3. **Baza Ulanishi (`DATABASE_URL`):**
   * Backend server PostgreSQL ma'lumotlar bazasiga `DATABASE_URL` orqali bog'lanadi:
     `DATABASE_URL=postgresql://user:password@ep-xyz.neon.tech/agroz?sslmode=require`

---

## 🔑 Barcha ENV (Muhit) Parametrlari Qollanmasi

### 1️⃣ `backend/.env` (Backend API Server uchun)
```env
# Server porti va CORS xavfsizlik ruxsatlari
PORT=4000
CORS_ORIGIN=https://agroz.uz,https://admin.agroz.uz,http://localhost:3000,http://localhost:3001

# PostgreSQL / Neon.tech Baza Ulanish Satri (MAJBURIY)
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/agroz?sslmode=require

# Super Admin Kirish Ma'lumotlari
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Telegram Bot Tokenlari va Username'lari
TELEGRAM_BOT_TOKEN=7890123456:AAXxxxxxxx...
TELEGRAM_BOT_USERNAME=agroz_bot
TELEGRAM_AUTH_BOT_TOKEN=1234567890:ABCxxxxxxx...
TELEGRAM_AUTH_BOT_USERNAME=agroz_auth_bot

# Webhook Maxfiy Kalitlari (ixtiyoriy, xavfsizlik uchun)
TELEGRAM_WEBHOOK_SECRET=my_super_secret_webhook_key
TELEGRAM_AUTH_WEBHOOK_SECRET=my_super_secret_auth_key

# AI Tashxis Model Sozlamalari (Google Gemini / OpenAI / Groq)
OPENAI_API_KEY=AIzaSyxxxxxxx...
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
AI_MODEL=gemini-3.8-flash
ASR_MODEL=whisper-1

# SMS Xizmati (Eskiz.uz — ixtiyoriy)
ESKIZ_EMAIL=
ESKIZ_PASSWORD=
ESKIZ_FROM=4546
OTP_DEV_MODE=true

# Demo ma'lumotlarni avtomatik yuklash
SEED_DEMO_DATA=true
```

### 2️⃣ `frontend/.env.local` (Mijoz Ilovasi — `agroz.uz`)
```env
# Backend API Server manzili (Production'da api.agroz.uz)
NEXT_PUBLIC_API_URL=https://api.agroz.uz

# Frontend domeni
NEXT_PUBLIC_APP_URL=https://agroz.uz

# Mutaxassis va dorixona ro'yxatdan o'tish boti username
NEXT_PUBLIC_TELEGRAM_AUTH_BOT_USERNAME=agroz_auth_bot
```

### 3️⃣ `admin/.env.local` (Admin Panel — `admin.agroz.uz`)
```env
# Backend API Server manzili
NEXT_PUBLIC_API_URL=https://api.agroz.uz

# Admin Panel domeni
NEXT_PUBLIC_APP_URL=https://admin.agroz.uz
```

---

## 🛠 Serverga Chiqarish (Deployment Step-by-Step Guide)

### 🚨 Vercel + Render + Neon.tech orqali TEZKOR Deploy Qilish:

#### 1-QADAM: PostgreSQL Bazani Sozlash ([Neon.tech](https://neon.tech))
1. Neon.tech saytida ro'yxatdan o'ting va yangi loyiha (Database) yarating.
2. Berilgan `postgresql://...` ulanish satrini nusxalab oling.

#### 2-QADAM: Backend API'ni Deploy Qilish ([Render.com](https://render.com) yoki Railway)
1. Render.com saytida **Web Service** yarating va GitHub repozitoriyangizni ulang.
2. **Root Directory**: `backend` deb kiriting.
3. **Build Command**: `npm run build`
4. **Start Command**: `npm start`
5. **Environment Variables**: Yuqoridagi `backend/.env` ichidagi o'zgaruvchilarni kiriting (`DATABASE_URL`, `CORS_ORIGIN`, `GEMINI_API_KEY` va h.k.).
6. Custom Domain kiriting: `api.agroz.uz`.

#### 3-QADAM: Frontend'ni Deploy Qilish (`agroz.uz` -> [Vercel](https://vercel.com))
1. Vercel'da **Add New Project** tugmasini bosing va repozitoriyani ulang.
2. **Root Directory**: `frontend` deb tanlang.
3. **Environment Variables**:
   * `NEXT_PUBLIC_API_URL` = `https://api.agroz.uz`
   * `NEXT_PUBLIC_TELEGRAM_AUTH_BOT_USERNAME` = `agroz_auth_bot`
4. **Domains** bo'limida `agroz.uz` do'meningizni ulang.

#### 4-QADAM: Admin Panel'ni Deploy Qilish (`admin.agroz.uz` -> [Vercel](https://vercel.com))
1. Vercel'da yana bitta **yangi loyiha** yarating va xuddi shu repozitoriyani ikkinchi marta ulang.
2. **Root Directory**: `admin` deb tanlang.
3. **Environment Variables**:
   * `NEXT_PUBLIC_API_URL` = `https://api.agroz.uz`
4. **Domains** bo'limida `admin.agroz.uz` sub-do'menini ulang.

---

## 🐳 Ubuntu VPS Serverda Docker Compose orqali Yagona Serverda Deploy Qilish

Agar loyihani shaxsiy Ubuntu VPS serveringizda konteynerda yurgizmoqchi bo'lsangiz:

```bash
# 1. Serverga repozitoriyani klon qiling:
git clone https://github.com/mrsovoo/agroz-ai.git
cd agroz-ai

# 2. Muhit faylini yarating va API kalitlarni yozing:
cp backend/.env.example backend/.env

# 3. Docker bilan barcha 3 ta ilovani va PostgreSQL'ni ko'taring:
docker-compose up -d --build
```

- **Frontend (`agroz.uz`)**: `http://localhost:3000`
- **Admin Panel (`admin.agroz.uz`)**: `http://localhost:3001`
- **Backend API (`api.agroz.uz`)**: `http://localhost:4000`
- **PostgreSQL**: `localhost:5432`

Nginx reverse proxy orqali portlarni do'menlarga bog'lang (3000 -> `agroz.uz`, 3001 -> `admin.agroz.uz`, 4000 -> `api.agroz.uz`).

---

## ⚡️ Lokal Ishga Tushirish va Tekshirish

```bash
# Barcha 3 ta ilova uchun bog'liqliklarni o'rnatish:
npm install

# Baza jadval sxemalarini push qilish:
npm run db:push

# Bazasini real demo ma'lumotlar bilan to'ldirish (seed):
npm run db:seed

# Barcha 3 ilovani bir vaqtda lokal yurgizish:
npm run dev:all

# Barcha 3 ilovani TypeScript va Build tekshiruvidan o'tkazish:
npm run typecheck:all
npm run build:all
```
