# Agroz AI — Intelligent Agro & Veterinary Platform

O'zbekiston fermerlari, tomorqachilari va chorvadorlari uchun sun'iy intellektga asoslangan ekin va chorva kasalliklarini tashxislash, yaqin agro-dorixonalar va mutaxassislar xaritasi, Agro Bozor yetkazib berish hamda Telegram Mini App tizimi.

Loyiha arxitekturasi to'liq **Frontend** va **Backend** mustaqil qismlarga ajratilgan bo'lib, turli serverlarga mustaqil joylashtirish (deploy) uchun optimallashtirilgan.

---

## 🏗 Loyiha Strukturasi (Monorepo)

```
agroz-ai/
├── frontend/                 # Mustaqil Next.js 16 (App Router, Tailwind CSS 4)
│   ├── src/app/             # UI sahifalar (Tashxis, Bozor, Xarita, Mutaxassislar, Yangiliklar)
│   ├── src/components/      # React komponentlar
│   ├── src/lib/             # Frontend yordamchilari, stores, api-client
│   ├── next.config.ts       # Backend API ga proxy rewrites
│   ├── Dockerfile           # Frontend standalone konteyneri
│   ├── vercel.json          # Vercel deployment sozlamalari
│   └── package.json         # Yengil UI bog'liqliklar
│
├── backend/                  # Mustaqil Node.js + Express + TypeScript API server
│   ├── src/server.ts        # Express API server (port 4000)
│   ├── src/routes/          # REST API marshrutlari (/api/diagnose, /api/orders, /api/specialists...)
│   ├── src/db/              # PostgreSQL + Drizzle ORM sxemalari va ulanish
│   ├── src/lib/             # AI tahlil, Telegram botlar, SMS va biznes mantiq
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
`backend/.env` ichida `DATABASE_URL` (PostgreSQL / Neon) va `GEMINI_API_KEY` ni ko'rsating.

### 3. Ma'lumotlar bazasini tayyorlash va to'ldirish (Seed)
```bash
# Migratsiyalarni yuritish:
npm run db:push

# Realistik MVP ma'lumotlarni kiritish (dorixonalar, mutaxassislar, dorilar, namunaviy buyurtmalar):
npm run db:seed
```

### 4. Ikkala serverni bir vaqtda ishga tushirish
```bash
npm run dev:all
```
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000` (Healthcheck: `http://localhost:4000/api/health`)

Yoki alohida terminallarda:
```bash
npm run dev:frontend   # Faqat frontend
npm run dev:backend    # Faqat backend
```

---

## 🐳 Docker orqali Ishga Tushirish

Butun tizimni (PostgreSQL + Express Backend + Next.js Frontend) bitta buyruq bilan ko'tarish:

```bash
docker-compose up -d --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000`
- PostgreSQL: `localhost:5432`

---

## 🚀 Alohida Serverlarga Deploy Qilish

### A. Frontendni Deploy Qilish (Vercel)
1. Vercel dashboardida GitHub repozitoriyangizni ulang (`agroz-ai`).
2. **Root Directory**: `frontend` qilib tanlang.
3. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` = `https://api.sizning-domen.uz` (Backend API manzili)
4. Deploy tugmasini bosing. Frontend bir necha soniyada muammosiz build bo'ladi.

### B. Backendni Deploy Qilish (VPS / Render / Railway / Docker)
1. **Root Directory**: `backend` (agar Render/Railway bo'lsa) yoki repozitoriyaning `backend` papkasini serverga oling.
2. Serverda kerakli muhit parametrlarini kiriting:
   - `DATABASE_URL` = `postgresql://user:password@host/db?sslmode=require`
   - `PORT` = `4000` (yoki provayder porti)
   - `CORS_ORIGIN` = `https://sizning-frontend-domeningiz.vercel.app`
   - `GEMINI_API_KEY` = Google Gemini API kaliti
   - `TELEGRAM_BOT_TOKEN` = Telegram bot tokeni
   - `TELEGRAM_AUTH_BOT_TOKEN` = Mutaxassislar bot tokeni
   - `ADMIN_USERNAME` va `ADMIN_PASSWORD` = Admin panel kirish ma'lumotlari
3. Ishga tushirish buyrug'i:
   ```bash
   npm ci
   npm start
   ```
   Yoki Docker orqali:
   ```bash
   docker build -t agroz-backend ./backend
   docker run -d -p 4000:4000 --env-file backend/.env agroz-backend
   ```

---

## 📦 Ma'lumotlarni boshqarish (Seed & Clear)

- **Ma'lumotlarni to'liq to'ldirish**:
  ```bash
  npm run db:seed
  ```
  *Natija:* 6 ta hududiy dorixona, 6 ta sertifikatlangan mutaxassis, 24 ta yuqori talabdagi dori, 30+ mijoz sharhlari va namunaviy buyurtmalar bazaga kiritiladi.
- **Bazasini tozalash**:
  ```bash
  npm run db:clear -- --yes
  ```

---

## 🤖 Telegram Botlar

1. **Asosiy Bot (`TELEGRAM_BOT_TOKEN`)**:
   - WebApp ochish menyu tugmasi
   - Ro'yxatdan o'tish / kirishda SMS o'rniga bepul Telegram orqali OTP kod yuborish
   - Yangi buyurtmalar holati xabarnomalari
2. **Mutaxassis & Dorixona Boti (`TELEGRAM_AUTH_BOT_TOKEN`)**:
   - Shifokor, agronom yoki dorixona egasi sifatida ro'yxatdan o'tish
   - Yangi dorilar va preparatlarni rasm/narx bilan katalogga qo'shish
   - Kelib tushgan buyurtmalarni qabul qilish va boshqarish

Lokal bot testlash (Polling rejimi):
```bash
npm run telegram:poll
```

Webhooklarni sozlash (Production):
```bash
npm run telegram:setup
```

---

## 🛠 Typecheck & Testlar

Loyihada TypeScript xatolari yo'qligini tekshirish:
```bash
npm run typecheck:frontend   # Frontend tekshiruvi (0 xato)
npm run typecheck:backend    # Backend tekshiruvi (0 xato)
npm run lint                 # ESLint qoidalar tekshiruvi
```
