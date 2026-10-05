# 🌾 Agroz AI (AgrozGO) — Yagona To'liq Texnik Qo'llanma va Tizim Arxitekturasi

O'zbekiston dehqonlari, fermerlari va chorvadorlari uchun agro-vositalarni yaqin agro-do'konlardan **bron qilib olib ketish**, malakali **mutaxassislarni (agronom va veterinar) chaqirish** hamda hududiy **agronomik ob-havo ma'lumotlarini** taqdim etuvchi ekotizim.

---

## 📌 Mundarija
1. [Loyiha Haqida va v1.0 Asosiy Doirasi (Scope)](#-1-loyiha-haqida-va-v10-asosiy-doirasi)
2. [Monorepo Strukturasi va Deploy Xaritasi](#-2-monorepo-strukturasi-va-deploy-xaritasi)
3. [Umumiy Arxitektura va Tizim Aloqalari](#-3-umumiy-arxitektura-va-tizim-aloqalari)
4. [To'liq Jarayonlar Xaritasi (Flowchart & Sequence)](#-4-toliq-jarayonlar-xaritasi)
   - [A. Mahsulot qidirish -> Savat -> Bron qilish -> Do'konga borishi va qaytishi](#a-buyurtma-bron-jarayoni-ekrandan-dokongacha-va-mijozga-qaytishi)
   - [B. Mutaxassis chaqirish va 90 daqiqalik taymaut](#b-mutaxassis-chaqirish-jarayoni-va-taymaut)
   - [C. Ob-havo va 07:00 kunlik push xabarnomasi](#c-ob-havo-va-kunlik-push-oqimi)
   - [D. SMS OTP orqali kirish va Apple 5.1.1 hisobni o'chirish](#d-kirish-va-hisobni-ochirish)
5. [Telegram Botlar Tizimi](#-5-telegram-botlar-tizimi)
6. [Muhit O'zgaruvchilari (.env)](#-6-muhit-ozgaruvchilari-env)
7. [Ishga Tushirish va Sinov Buyruqlari](#-7-ishga-tushirish-va-sinov-buyruqlari)

---

## 🎯 1. Loyiha Haqida va v1.0 Asosiy Doirasi

AgrozGO v1.0 versiyasi App Store (Apple), Google Play va Web/PWA uchun optimallashtirilgan bo'lib, **qat'iy 3 ta asosiy xizmatga** asoslangan:

1. **Agro-vositalarni bron qilish (Pickup):** Fermer hududidagi agro-do'konlarda mavjud o'g'it, dori va urug'larni qidiradi, savatga soladi va borib olib ketish sharti bilan bepul bron qiladi. *(Eshikkacha yetkazib berish va onlayn to'lov v1.0 da yo'q)*.
2. **Mutaxassis chaqirish (Agronom / Vet):** Ekin yoki chorva zararlanganda fermer malakali agronom yoki veterinarni joyiga chaqirish uchun ariza yuboradi. Mutaxassis Telegram boti orqali qabul qiladi.
3. **Agronomik Ob-havo:** Open-Meteo orqali 7 kunlik ob-havo prognozi, harorat, yog'in, shamol hamda dala ishlari uchun tavsiyalar.

---

## 🏗 2. Monorepo Strukturasi va Deploy Xaritasi

Loyiha monorepo (npm workspaces) shaklida tashkil qilingan:

```
agroz-ai/
├── frontend/             # agroz.uz          (Next.js 16 / TypeScript / Tailwind CSS)
│                         # Mijozlar veb-sayti, PWA va Telegram Mini App
├── mobile/               # AgrozGO App       (Capacitor iOS & Android)
│   ├── android/          # Google Play Release (Native Java/Gradle)
│   └── ios/              # Apple App Store Release (Xcode/Swift)
├── backend/              # api.agroz.uz      (Node.js / Express / TypeScript / Drizzle ORM)
│                         # REST API, 2 ta Telegram bot webhooks, Push, Cron
├── admin/                # admin.agroz.uz    (Next.js Super Admin Dashboard)
└── docker-compose.yml    # Barcha servislarni yagona serverda yurgizish
```

### 📋 Deploy Xaritasi:
| Modul | Ishchi Do'men | Platforma | Texnologiya |
| :--- | :--- | :--- | :--- |
| **Frontend** | `agroz.uz` | **Vercel** / Netlify | Next.js 16, React 19, Lucide, Tailwind |
| **Mobil Ilova** | App Store & Google Play | **Apple / Google** | Capacitor 7, Push Notifications |
| **Backend API** | `api.agroz.uz` | **Railway** / Render / VPS | Node.js, Express, Drizzle ORM, node-cron |
| **Ma'lumotlar Bazasi** | — | **Neon.tech** | PostgreSQL 16 (Serverless pool) |
| **Admin Panel** | `admin.agroz.uz` | **Vercel** | Next.js Standalone Admin |

---

## 🏛 3. Umumiy Arxitektura va Tizim Aloqalari

```mermaid
flowchart TB
    subgraph Clients["1. MIJOZ VA HAMKORLAR (Frontends)"]
        Web["🌐 Web & PWA\n(Next.js 16)\nagroz.uz"]
        Mobile["📱 Mobil Ilova\n(iOS & Android)\nCapacitor"]
        MiniApp["📲 Telegram Mini App\n(@agrozai_bot ichida)\nagroz.uz MiniApp"]
        PartnerCabinet["🏢 Hamkor Kabineti\n(@agroz_auth_bot WebApp)\nagroz.uz/kabinet"]
        AdminWeb["👑 Super Admin Panel\nadmin.agroz.uz"]
    end

    subgraph BackendLayer["2. SERVER VA BIZNES LOGIKA (Backend API)"]
        API["⚡️ Express.js REST API\n(Node.js / TypeScript)\napi.agroz.uz"]
        AuthModule["🔐 Auth & OTP (Eskiz SMS / JWT)"]
        OrdersModule["📦 Buyurtmalar & Bron tizimi"]
        SpecialistsModule["👨‍⚕️ Mutaxassis chaqirish tizimi"]
        CronModule["⏰ Cron & Taymerlar (Bron muddati / Ob-havo)"]
        PushModule["🔔 Push Notifications (Firebase Admin / APNs / FCM)"]
    end

    subgraph TelegramLayer["3. TELEGRAM BOTLAR ZANJIRI"]
        FarmerBot["🤖 @agrozai_bot (Fermer Boti)\nMijozga status xabari, tracking, WebApp ochish"]
        AuthBot["🤖 @agroz_auth_bot (Biznes Boti)\nDo'kon va Mutaxassis arizalari, buyurtma/chaqiruvni qabul qilish"]
    end

    subgraph DataLayer["4. MA'LUMOTLAR BAZASI"]
        DB[("🐘 PostgreSQL (Neon.tech)\nDrizzle ORM\nusers, orders, specialists, specialist_calls")]
    end

    Web -->|HTTP / REST API| API
    Mobile -->|Capacitor HTTP| API
    MiniApp -->|Telegram WebApp| API
    PartnerCabinet -->|x-telegram-init-data| API
    AdminWeb -->|Admin Token| API

    API --> AuthModule
    API --> OrdersModule
    API --> SpecialistsModule
    API --> CronModule
    API --> PushModule

    OrdersModule <--> DB
    SpecialistsModule <--> DB
    AuthModule <--> DB
    CronModule <--> DB

    OrdersModule -->|Xabar yuborish| AuthBot
    OrdersModule -->|Mijozga tasdiq| FarmerBot
    SpecialistsModule -->|Inline Tugmalar| AuthBot
    SpecialistsModule -->|Mijozga tasdiq| FarmerBot
    PushModule -->|Mobil Bildirishnoma| Mobile
```

---

## 🔄 4. To'liq Jarayonlar Xaritasi

### A. Buyurtma (Bron) Jarayoni: Ekrandan Do'kongacha va Mijozga Qaytishi

```mermaid
sequenceDiagram
    autonumber
    actor Mijoz as 👨‍🌾 Fermer / Mijoz (Mobil/Web)
    participant Front as 📱 AgrozGO Ilovasi
    participant API as ⚙️ Backend API (/api/orders)
    participant DB as 🗄 Baza (PostgreSQL)
    participant AuthBot as 🤖 @agroz_auth_bot (Do'kon Boti)
    actor Dokon as 🏪 Agro-Do'kon Egasi
    participant FarmerBot as 🤖 @agrozai_bot (Mijoz Boti)
    participant Push as 🔔 Push Servis (APNs/FCM)

    %% 1. Bron qilish
    Mijoz->>Front: Savatga mahsulot qo'shadi va "Bron qilish"ni bosadi
    Front->>API: POST /api/orders (pharmacyId, items, deliveryType='pickup')
    API->>DB: INSERT INTO orders (status='yangi', expires_at=NOW()+24h)
    API-->>Front: 200 OK (Buyurtma #123 yaratildi)
    Front-->>Mijoz: Ekranda kutilmoqda statusi va tracking kartasi ko'rinadi

    %% 2. Do'konga xabar borishi
    API->>AuthBot: Do'kon egasining telegram_chat_id siga xabar yuborish
    AuthBot->>Dokon: Yangi bron keldi! [#123] Mahsulotlar ro'yxati va mijoz tel<br/>[✅ Tasdiqlash] [❌ Rad etish] [📦 Tayyor]

    %% 3. Do'kon tasdiqlashi
    Dokon->>AuthBot: [✅ Tasdiqlash] tugmasini bosadi (yoki /kabinet orqali)
    AuthBot->>API: Webhook (action="confirm", orderId=123)
    API->>DB: UPDATE orders SET status='tasdiqlandi'
    
    %% 4. Mijozga xabar qaytishi
    par Telegram orqali xabar
        API->>FarmerBot: Mijozga Telegram xabar yuborish
        FarmerBot->>Mijoz: "✅ Sizning #123 broningiz do'kon tomonidan tasdiqlandi!"
    and Mobil Push bildirishnoma
        API->>Push: sendPushToUser(userId)
        Push->>Mijoz: 📲 "Buyurtma #123 tasdiqlandi! Do'kon uni tayyorlamoqda."
    end
    Front->>Mijoz: Profil / Tracking ekranida status "Tasdiqlandi"ga o'zgaradi

    %% 5. Mahsulot tayyor bo'lishi
    Dokon->>AuthBot: [📦 Tayyor] tugmasini bosadi
    AuthBot->>API: Webhook (action="ready", orderId=123)
    API->>DB: UPDATE orders SET status='tayyor'
    API->>FarmerBot: "📦 #123 buyurtmangiz tayyor, do'kondan olib ketishingiz mumkin!"
    FarmerBot->>Mijoz: Do'kon manzili va telefonini ko'rsatadi
    API->>Push: 📲 "Buyurtmangiz tayyor! Do'kondan olib ketishingiz mumkin."

    %% 6. Do'kondan olib ketish (Yakunlash)
    Mijoz->>Dokon: Do'konga kelib mahsulotni oladi va to'lov qiladi
    Dokon->>AuthBot: [✅ Olib ketildi] tugmasini bosadi
    AuthBot->>API: Webhook (action="done", orderId=123)
    API->>DB: UPDATE orders SET status='yetkazildi'
    API->>FarmerBot: "🏪 #123 buyurtmangiz muvaffaqiyatli olib ketildi. Xaridingiz uchun rahmat!"
    FarmerBot->>Mijoz: Baholash tugmasi (1-5 yulduz) ko'rinadi
```

---

### B. Mutaxassis Chaqirish Jarayoni va Taymaut

```mermaid
flowchart TD
    Start["👨‍🌾 Mijoz mutaxassis sahifasida ma'lumotlarni to'ldiradi\n(Ism, Telefon, Manzil, Ekin/Hayvon turi, Muammo)"] --> Submit["POST /api/specialists/:id/call"]
    Submit --> SaveDB["🗄 Bazaga yozish:\nspecialist_calls (status='yangi', createdAt=NOW)"]
    
    SaveDB --> NotifySpec["🤖 @agroz_auth_bot orqali Mutaxassisga xabar boradi:\n'🔔 YANGI CHAQIRUV!'\n[✅ Qabul qilish] [❌ Rad etish]"]
    SaveDB --> NotifyUserStart["🤖 @agrozai_bot orqali Mijozga xabar:\n'Arizangiz mutaxassisga yuborildi, javob kutilmoqda'"]

    NotifySpec --> Decision{"Mutaxassis nima qiladi?"}

    Decision -- "1. Qabul qilsa (✅)" --> Accept["UPDATE status = 'qabul_qilindi'"]
    Accept --> UserNotifAccept["📲 Mijozga Push va Telegram:\n'✅ Mutaxassis chaqiruvingizni qabul qildi!'\nMutaxassis telefon raqami ochiladi"]

    Decision -- "2. Rad etsa (❌)" --> Reject["UPDATE status = 'bekor'"]
    Reject --> UserNotifReject["📲 Mijozga Push va Telegram:\n'Afsuski, mutaxassis ayni vaqtda bo'sh emas'"]

    Decision -- "3. Javob bermasa (90 daqiqa)" --> CronCheck["⏰ Cron (Har 10 daqiqada tekshiradi)\nNOW() - createdAt > 90 min AND status='yangi'"]
    CronCheck --> AutoTimeout["UPDATE status = 'javob_berilmadi' (Atomik RETURNING)"]
    AutoTimeout --> UserNotifTimeout["📲 Mijozga Push va Telegram:\n'Mutaxassis javob bermadi. Boshqa mutaxassisni tanlashingiz mumkin.'"]
```

---

### C. Ob-havo va Kunlik Push Oqimi

```mermaid
flowchart LR
    subgraph WeatherFetch["Mijoz Ekrani (/ob-havo)"]
        LocUser["Foydalanuvchi ob-havoga kiradi"] --> CheckLoc{"Joylashuv ruxsati bormi?"}
        CheckLoc -- "HA" --> OpenMeteoGPS["Open-Meteo API (Joriy Lat/Lon)"]
        CheckLoc -- "YO'Q" --> RegionSelect["Viloyat tanlash selektori\n(Default: Toshkent)"]
        OpenMeteoGPS --> RenderUI["7 kunlik prognoz va tavsiyalar"]
        RegionSelect --> RenderUI
    end

    subgraph DailyCron["Har Kuni 07:00 (Toshkent vaqti)"]
        CronTrigger["⏰ Node-Cron (07:00)"] --> QueryUsers["🗄 SELECT users WHERE is_weather_push_enabled=true\nAND weather_sent_date != TODAY"]
        QueryUsers --> AtomicUpdate["Atomik UPDATE: weather_sent_date = TODAY\n(Dublikat push ketmasligi kafolati)"]
        AtomicUpdate --> SendFCM["🔔 Firebase Admin (FCM/APNs) orqali Push:\n'Bugungi ob-havo va agronom tavsiyasi'"]
        SendFCM --> Device["📱 Fermer telefoni ekranida bildirishnoma"]
    end
```

---

### D. Kirish va Hisobni O'chirish

1. **SMS OTP orqali Kirish:**
   - Foydalanuvchi telefon raqamini kiritadi (`+998 XX XXX XX XX`).
   - Eskiz SMS orqali 6 xonali tasdiqlash kodi yuboriladi (Rate limit: 15 daqiqada 5 urinish).
   - Kod to'g'ri bo'lsa, JWT sessiya belgilanadi (30 kunlik cookie va token).
2. **Apple Guideline 5.1.1 (Hisobni to'liq o'chirish):**
   - Foydalanuvchi Profil -> Sozlamalar orqali hisobini o'chirishi mumkin.
   - Barcha push tokenlar va sessiyalar o'chiriladi. Telefon raqami `+998000000000_deleted_<timestamp>` tarzida anonimlashtiriladi.

---

## 🤖 5. Telegram Botlar Tizimi

| Bot parametri | Fermer / Mijoz Boti (`@agrozai_bot`) | Biznes / Hamkor Boti (`@agroz_auth_bot`) |
| :--- | :--- | :--- |
| **Env o'zgaruvchisi** | `TELEGRAM_BOT_TOKEN` | `PHARMACY_BOT_TOKEN` |
| **Asosiy auditoriya** | Dehqonlar, fermerlar, tomorqachilar | Agro-do'kon egalari, agronom va veterinarlar |
| **Asosiy vazifasi** | Buyurtma statusi xabarlari, Mini App ochish | Do'kon/mutaxassis arizasi, buyurtma/chaqiruvni tasdiqlash |
| **Webhook yo'li** | `/api/telegram/webhook` | `/api/auth-bot/webhook` |
| **Xavfsizlik** | `X-Telegram-Bot-Api-Secret-Token` | `X-Telegram-Bot-Api-Secret-Token` |

---

## 🔑 6. Muhit O'zgaruvchilari (.env)

### `backend/.env`:
```env
PORT=4000
NODE_ENV=production
ALLOWED_ORIGINS=https://agroz.uz,https://admin.agroz.uz,capacitor://localhost,https://localhost

# PostgreSQL (Neon.tech)
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/agroz?sslmode=require

# Telegram Botlar
TELEGRAM_BOT_TOKEN=123456789:ABC...
TELEGRAM_BOT_USERNAME=agrozai_bot
PHARMACY_BOT_TOKEN=987654321:XYZ...
PHARMACY_BOT_USERNAME=agroz_auth_bot

# SMS (Eskiz.uz)
ESKIZ_EMAIL=your_email@example.com
ESKIZ_PASSWORD=your_password
ESKIZ_FROM=4546

# Firebase Admin Push (JSON yoki Base64)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Demo sinovchi (App Store / Google Play review)
DEMO_PHONE=+998901234567
DEMO_OTP=123456
```

### `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=https://api.agroz.uz
NEXT_PUBLIC_APP_URL=https://agroz.uz
```

---

## ⚡️ 7. Ishga Tushirish va Sinov Buyruqlari

```bash
# 1. Barcha modullar uchun paketlarni o'rnatish
npm install

# 2. Baza jadvallarini sinxronlash (Drizzle)
npm run db:push

# 3. Barcha ilovalarni bir vaqtda lokal rejimda ishga tushirish
npm run dev

# 4. TypeScript tekshiruvi (Frontend, Backend, Admin)
npm run typecheck:all

# 5. Production build yig'ish
npm run build:all

# 6. Avtomatik testlarni yurgizish
node backend/tests/run-all.js

# 7. Mobil ilova sinxronizatsiyasi (Capacitor)
npm run mobile:sync
```
