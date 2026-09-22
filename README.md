# Agroz AI — Intelligent Agro & Veterinary Platform

O'zbekiston fermerlari, tomorqachilari va chorvadorlari uchun sun'iy intellektga asoslangan ekin va chorva kasalliklarini tashxislash, yaqin agro-dorixonalar va mutaxassislar xaritasi (5 km yagona radius), Agro Bozor buyurtmalari hamda Telegram Mini App tizimi.

Loyiha arxitekturasi to'liq **3 ta mustaqil ilovaga** bo'lingan bo'lib, alohida serverlarda va mustaqil do'menlarda (`agroz.uz`, `admin.agroz.uz`, `api.agroz.uz`) deploy qilish uchun mo'ljallangan.

---

## 🏗 Loyiha Strukturasi va Do'menlar Manzili

```
agroz-ai/
├── frontend/     # agroz.uz          (Mijozlar va Telegram Mini App uchun Next.js ilovasi)
├── admin/        # admin.agroz.uz    (Super Admin Boshqaruv Paneli — Standalone Next.js)
├── backend/      # api.agroz.uz      (Express API Server, PostgreSQL va Telegram Bot Webhooklar)
└── docker-compose.yml                # Barcha 3 ta ilova + PostgreSQL konteyneri
```

| Qism | Do'men | Tavsiya etiladigan Servis | Tarif / Xususiyati |
| :--- | :--- | :--- | :--- |
| **Frontend** | `agroz.uz` | Vercel yoki Netlify | Next.js App Router, Global CDN, Bepul SSL |
| **Admin Panel** | `admin.agroz.uz` | Vercel yoki Cloudflare Pages | Alohida Vercel loyihasi sifatida ulanadi (Bepul) |
| **Backend** | `api.agroz.uz` | Render, Railway yoki Koyeb | Node.js API va Telegram Webhooklar uchun juda qulay |
| **PostgreSQL** | — | Neon.tech yoki Supabase | Serverless PostgreSQL (Drizzle ORM uchun juda tez) |

---

## ⚡️ Tezkor Ishga Tushirish (Lokal Rejim)

### 1. Bog'liqliklarni o'rnatish
```bash
# Loyiha ildizida (frontend, admin va backend avtomatik o'rnatiladi):
npm install
```

### 2. Muhit parametrlarini sozlash
`backend/.env.example` dan nusxa oling:
```bash
cp backend/.env.example backend/.env
```
`backend/.env` faylida `DATABASE_URL` (PostgreSQL / Neon) va `GEMINI_API_KEY` ni ko'rsating.

### 3. Ma'lumotlar bazasini tayyorlash va to'ldirish (Seed)
```bash
# Migratsiyalarni yuritish:
npm run db:push

# Realistik demo ma'lumotlarni kiritish:
npm run db:seed
```

### 4. Barcha 3 ta serverni bir vaqtda ishga tushirish
```bash
npm run dev:all
```
- **Frontend (`agroz.uz`)**: `http://localhost:3000`
- **Admin Panel (`admin.agroz.uz`)**: `http://localhost:3001`
- **Backend API (`api.agroz.uz`)**: `http://localhost:4000` (Healthcheck: `http://localhost:4000/api/health`)

Yoki alohida terminallarda:
```bash
npm run dev:frontend   # Faqat frontend (port 3000)
npm run dev:admin      # Faqat admin panel (port 3001)
npm run dev:backend    # Faqat backend API (port 4000)
```

---

## 🐳 Docker orqali Ishga Tushirish

Barcha 3 ilova va PostgreSQL bazasini konteynerda yurgizish:

```bash
docker-compose up -d --build
```
- **Frontend**: `http://localhost:3000`
- **Admin Panel**: `http://localhost:3001`
- **Backend API**: `http://localhost:4000`
- **PostgreSQL**: `localhost:5432`

---

## 🚀 Cloud / Production Deploy Yo'riqnomasi

### 1. Frontend Deploy (`agroz.uz` -> Vercel)
1. Vercel dashboardida GitHub repozitoriyangizni ulang (`agroz-ai`).
2. **Root Directory**: `frontend` qilib belgilang.
3. **Custom Domain**: `agroz.uz`
4. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` = `https://api.agroz.uz`
   - `NEXT_PUBLIC_TELEGRAM_AUTH_BOT_USERNAME` = `agroz_auth_bot`
5. Deploy qiling.

### 2. Admin Panel Deploy (`admin.agroz.uz` -> Vercel)
1. Vercel dashboardida xuddi shu repozitoriyani ikkinchi yangi loyiha sifatida ulang.
2. **Root Directory**: `admin` qilib belgilang.
3. **Custom Domain**: `admin.agroz.uz`
4. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` = `https://api.agroz.uz`
5. Deploy qiling.

### 3. Backend Deploy (`api.agroz.uz` -> Render / Railway)
1. Render / Railway portalida Node.js servisini yarating.
2. **Root Directory**: `backend`
3. **Custom Domain**: `api.agroz.uz`
4. **Environment Variables**:
   - `DATABASE_URL` = `postgresql://user:pass@host/db?sslmode=require`
   - `PORT` = `4000`
   - `CORS_ORIGIN` = `https://agroz.uz,https://admin.agroz.uz`
   - `GEMINI_API_KEY` = Google Gemini API kaliti
   - `TELEGRAM_BOT_TOKEN` = Mijoz boti tokeni
   - `TELEGRAM_AUTH_BOT_TOKEN` = Mutaxassislar boti tokeni
   - `ADMIN_USERNAME` va `ADMIN_PASSWORD` = Admin panel kirish ma'lumotlari
5. Start command: `npm run build && npm start`

---

## 🛠 Typecheck & Build Tekshiruvi

```bash
npm run typecheck:all   # Barcha 3 ilova TypeScript tekshiruvi
npm run build:all       # Barcha 3 ilova ishlab chiqarish uchun build
```
