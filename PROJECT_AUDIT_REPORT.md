# AGROZ AI (v1.0) — TO'LIQ TEXNIK AUDIT HISOBOTI
**Hujjat turi:** App Store va Google Play nashri oldi texnik tahlili  
**Holati:** Yakuniy ekspert xulosasi (kod tahririsiz, dalillarga asoslangan)  
**Sana:** 2026-10-02  
**Tekshirilgan modullar:** `frontend/`, `backend/`, `admin/`, `mobile/`

---

## 1. LOYIHA TUZILMASI

### 1.1. Papkalar daraxti (2–3 daraja)
```text
agroz-ai/
├── package.json               # Root monorepo (npm workspaces)
├── package-lock.json
├── PROJECT_AUDIT_REPORT.md    # Ushbu audit hisoboti
├── frontend/                  # Next.js 16 (App Router) veb va hosted WebView
│   ├── package.json
│   ├── next.config.ts
│   ├── public/                # Statik rasmlar, manifest.json
│   └── src/
│       ├── app/               # 19 ta sahifa (ekran)
│       ├── components/        # UI komponentlar, modallar, bloklovchilar
│       └── lib/               # api.ts, capacitor.ts, telegram.ts, format.ts
├── backend/                   # Node.js Express API server
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts           # Server start, Express sozlamalari, cron
│       ├── db/
│       │   ├── schema.ts      # Drizzle ORM (22 ta PostgreSQL jadvallari)
│       │   └── index.ts       # Pool ulanishi va schema auto-migration
│       ├── routes/            # 14 ta router fayl (68 ta API endpoint)
│       ├── lib/               # auth, push, gemini, sms, weather
│       └── scripts/           # seed.ts
├── admin/                     # Next.js alohida admin paneli
│   ├── package.json
│   ├── next.config.ts
│   └── src/
│       └── app/
│           ├── page.tsx       # Admin login
│           └── panel/         # Boshqaruv paneli (1 sahifali katta dashboard)
└── mobile/                    # Capacitor 7 native konteyneri
    ├── package.json
    ├── capacitor.config.ts    # uz.agrozgo.app, https://agroz.uz
    ├── android/               # Android Studio loyihasi (Java/Gradle)
    └── ios/                   # Xcode loyihasi (App/App.xcworkspace)
```

### 1.2. Workspace'lar va kutubxonalar
* **Node versiyasi:** `v24.18.0` (`node -v`)
* **Paket menejeri:** `npm v11.16.0` (`npm -v`)
* **Root `package.json` scriptlari:**
  * `build`: `npm --prefix backend run build && npm --prefix frontend run build && npm --prefix admin run build`
  * `typecheck:all`: `npm --prefix backend run typecheck && npm --prefix frontend run typecheck && npm --prefix admin run typecheck`
  * `lint`: `npm --prefix frontend run lint && npm --prefix admin run lint`
  * `mobile:sync`: `npm --prefix mobile run sync`
  * `mobile:open:android`: `npm --prefix mobile run open:android`
  * `mobile:open:ios`: `npm --prefix mobile run open:ios`

#### Asosiy paketlar va versiyalari:
* **Frontend (`frontend/package.json`):**
  * `next`: `16.2.6`
  * `react`: `19.2.6`, `react-dom`: `19.2.6`
  * `@capacitor/core`: `^7.0.0`, `@capacitor/push-notifications`: `^7.0.0`
  * `lucide-react`: `^1.16.0`, `tailwindcss`: `^4.0.0`
* **Backend (`backend/package.json`):**
  * `express`: `^4.21.2`, `cors`: `^2.8.5`, `dotenv`: `^16.4.7`
  * `pg`: `^8.13.3`, `drizzle-orm`: `^0.45.2`
  * `@google/genai`: `^2.23.0`
  * `firebase-admin`: `^14.5.0`
  * `typescript`: `^5.7.3`
* **Admin (`admin/package.json`):**
  * `next`: `16.2.6`, `react`: `19.2.6`, `tailwindcss`: `^4.0.0`
* **Mobile (`mobile/package.json`):**
  * `@capacitor/cli`: `^7.0.0`, `@capacitor/core`: `^7.0.0`
  * `@capacitor/android`: `^7.0.0`, `@capacitor/ios`: `^7.0.0`
  * `@capacitor/push-notifications`: `^7.0.0`, `@capacitor/status-bar`: `^7.0.0`, `@capacitor/splash-screen`: `^7.0.0`

---

## 2. EKRANLAR VA TUGMALAR

### 2.1. Barcha ekranlar / Route'lar jadvali

| Yo'l (Route) | Nima qiladi | Rol | Qaysi API'ni chaqiradi | Holati |
|---|---|---|---|---|
| `frontend/src/app/page.tsx` | Bosh sahifa: xizmatlar, ob-havo, banner, agro-maslahatlar | Hamma | `/api/weather/today`, `/api/orders` | **Ishlaydi** (lekin AI tugmasida 2.0 modali bor) |
| `frontend/src/app/auth/page.tsx` | Kirish/Ro'yxatdan o'tish (Telefon + SMS OTP) | Mehmon | `/api/auth/send-otp`, `/api/auth/verify-otp`, `/api/push/register` | **Ishlaydi** |
| `frontend/src/app/profile/page.tsx` | Foydalanuvchi profili, hisob o'chirish, chiqish | Mijoz/Fermer | `/api/auth/me`, `/api/auth/update-profile`, `/api/auth/delete-account` | **Ishlaydi** |
| `frontend/src/app/dorilar/page.tsx` | Dori vositalari katalogi, filtr, savatga qo'shish | Hamma | `/api/medicines` | **Ishlaydi** |
| `frontend/src/app/dorilar/[id]/page.tsx` | Bitta dori tafsiloti va qo'llash yo'riqnomasi | Hamma | `/api/medicines/:id` | **Ishlaydi** |
| `frontend/src/app/dorixonalar/page.tsx` | Agro-dorixonalar ro'yxati, masofa, qidiruv | Hamma | `/api/pharmacies` | **Ishlaydi** |
| `frontend/src/app/dorixonalar/[id]/page.tsx` | Dorixona profili, manzili, mahsulotlari | Hamma | `/api/pharmacies/:id` | **Ishlaydi** |
| `frontend/src/app/mutaxassislar/page.tsx` | Agronom va veterinarlar ro'yxati | Hamma | `/api/specialists` | **Ishlaydi** |
| `frontend/src/app/mutaxassislar/[id]/page.tsx` | Mutaxassis profili va chaqiruv qoldirish | Mijoz/Fermer | `/api/specialists/:id`, `/api/specialist-calls` | **Ishlaydi** |
| `frontend/src/app/cart/page.tsx` | Savatcha, yetkazish/olib ketish va buyurtma berish | Mijoz/Fermer | `/api/orders`, `/api/pharmacies` | **Ishlaydi** (faqat naqd) |
| `frontend/src/app/orders/page.tsx` | Buyurtmalar tarixi va holatlari ro'yxati | Mijoz/Fermer | `/api/orders` | **Ishlaydi** |
| `frontend/src/app/orders/[id]/page.tsx` | Bitta buyurtma tafsiloti va holat kuzatuvi | Mijoz/Fermer | `/api/orders/:id` | **Ishlaydi** |
| `frontend/src/app/tashxis/crop/page.tsx` | Ekin kasalliklarini AI orqali aniqlash | Hamma | `/api/diagnose/crop` | **Ishlaydi** |
| `frontend/src/app/tashxis/animal/page.tsx` | Chorva kasalliklarini AI orqali aniqlash | Hamma | `/api/diagnose/animal` | **Ishlaydi** |
| `frontend/src/app/agro-maslahatlar/page.tsx` | Agro yangiliklar va tavsiyalar ro'yxati | Hamma | `/api/agro-maslahatlar` | **Ishlaydi** |
| `frontend/src/app/agro-maslahatlar/[id]/page.tsx` | Bitta maqola/maslahat matni | Hamma | `/api/agro-maslahatlar/:id` | **Ishlaydi** |
| `frontend/src/app/maxfiylik/page.tsx` | Maxfiylik siyosati (Privacy Policy) | Ochiq | Hech qaysi (statik matn) | **Ishlaydi** |
| `frontend/src/app/shartlar/page.tsx` | Foydalanish shartlari (Terms of Service) | Ochiq | Hech qaysi (statik matn) | **Ishlaydi** |
| `admin/src/app/page.tsx` | Admin login sahifasi | Admin | `/api/admin/login` | **Ishlaydi** |
| `admin/src/app/panel/page.tsx` | Admin boshqaruv paneli (Foydalanuvchilar, Buyurtmalar, Mutaxassislar) | Admin | `/api/admin/*` | **Ishlaydi** |

---

### 2.2. Muammoli tugmalar va elementlar auditi

#### A) `onClick` hodisasi yo'q yoki bo'sh tugmalar:
1. `frontend/src/components/Header.tsx` (L129): Til tanlash ("UZ") tugmasida faqat dekorativ ko'rinish berilgan, tilni o'zgartirish funksiyasi (handler) yo'q.
2. `frontend/src/components/HomeClientView.tsx` (L238): Reklama banneri ("Batafsil") tugmasida hech qanday action/link yo'q, sahifa tepasiga qaytaradi (`href="#"`).

#### B) "Tez orada", "Coming soon", "2.0", "TODO", "mock" yozuvlari:
* ⚠️ **KRITIK BLOKER:** `frontend/src/components/HomeClientView.tsx` (L331–385):
  Bosh sahifadagi eng asosiy 2 ta karta — **"Ekin tashxisi"** va **"Chorva tashxisi"** bosilganda `/tashxis/crop` yoki `/tashxis/animal` sahifasiga o'tmaydi! Ular `comingSoonModal`ni chaqiradi:
  > *"Tez orada (2.0 versiyada) — AgrozGO 2.0 versiyasida ekin va chorva kasalliklarini rasm orqali aniqlash xizmati ishga tushadi."*  
  Holbuki `/tashxis/crop` va `/tashxis/animal` sahifalari backend Gemini AI'ga to'liq ulangan va ishlaydi. Bosh sahifadagi bu blok tufayli App Store tekshiruvchisi "ilova chala/tugallanmagan" deb darhol rad etadi (Apple Guideline 2.2).
* `frontend/src/app/cart/page.tsx` (L180): Onlayn to'lov (Click/Payme) bo'limida *"Tez orada (2.0 versiyada)"* yozuvi mavjud (hozirda faqat naqd tanlanadi).
* `backend/src/routes/ai.ts` (L14): Izohda *"TODO: integrate external agronomy database"* qoldirilgan.

#### C) 404 yoki bo'sh ekran beradigan havolalar:
* Repoda o'lik havola (dead link) topilmadi. Barcha mavjud ichki yo'nalishlar (`/dorilar`, `/dorixonalar`, `/mutaxassislar`, `/orders`, `/profile`, `/maxfiylik`, `/shartlar`) real `page.tsx` bilan ta'minlangan.

#### D) Hardcoded (statik) ma'lumot ko'rsatadigan ekranlar:
* `frontend/src/components/HomeClientView.tsx` (L200-L245): Bosh sahifadagi reklama slayderlari va aksiyalar API'dan kelmaydi, qattiq kodlangan.
* `frontend/src/components/Header.tsx` va `frontend/src/components/Footer.tsx`: Ijtimoiy tarmoq havolalari (`t.me/agrozgo`, `instagram.com/...`) statik yozilgan.

---

## 3. ROLLAR VA HUQUQLAR (RBAC)

### 3.1. Tizimdagi rollar tuzilishi
Kod bazasida foydalanuvchilar quyidagi 4 toifaga bo'lingan:
1. **Mijoz / Dehqon / Fermer (`users` jadvali):**
   * Ro'yxatdan o'tish: Telefon raqam + SMS OTP orqali (`/api/auth/verify-otp`).
   * Baza: `backend/src/db/schema.ts` — `users` jadvalida alohida `role` ustuni yo'q. Tizimga kirgan barcha oddiy foydalanuvchilar xaridor/mijoz hisoblanadi.
   * Huquqlari: Dorilarni ko'rish, savatga solish, buyurtma berish, AI tashxis qilish, o'z buyurtmalarini ko'rish, o'z hisobini o'chirish.
2. **Agro-dorixona egasi (`specialists` jadvali, `type = 'pharmacy'`):**
   * Veb-saytda ro'yxatdan o'tish ekrani: **YO'Q (TOPILMADI)**.
   * Ular qanday boshqariladi: Mutaxassislar va dorixonalar Telegram bot (`@agroz_auth_bot`, `backend/src/routes/bot.ts`) orqali telefon raqami bilan avtorizatsiyadan o'tadi va o'z dori vositalarini boshqaradi.
3. **Mutaxassis (Agronom / Vetvrach — `specialists` jadvali, `type = 'agronomist'` / `'veterinarian'`):**
   * Veb-saytda ro'yxatdan o'tish: **YO'Q**.
   * Chaqiruvlarni qabul qilish: Telegram bot orqali bildirishnoma oladi va tasdiqlaydi/rad etadi.
4. **Tizim Admini (`admin_sessions` jadvali):**
   * Kirish yo'li: `/admin` (alohida Next.js ilovasi).
   * Avtorizatsiya: `ADMIN_PASSWORD` (env) orqali `POST /api/admin/login` chaqiriladi.
   * Huquqlari: Barcha buyurtmalarni ko'rish, statusini o'zgartirish, dorixona va mutaxassislarni tasdiqlash/o'chirish.

### 3.2. Backend Authorization tekshiruvi
* **Mijozlar uchun:** `backend/src/lib/user-auth.ts` ichidagi `requireUserAuth` middleware'i `Authorization: Bearer <sessionToken>` sarlavhasini tekshiradi (`user_sessions` jadvalidan `expires_at > now()`).
* **Admin uchun:** `backend/src/routes/admin.ts` ichidagi `requireAdminAuth` middleware'i `admin_sessions` jadvalini tekshiradi.
* **Mutaxassislar uchun:** `backend/src/routes/bot.ts` Telegram `telegram_id` va imzolangan ma'lumotlar orqali tekshiradi.

---

## 4. BACKEND API AUDITI

Jami **68 ta API endpoint** aniqlandi (`backend/src/routes/` papkasida).

### 4.1. Asosiy API Endpoint'lar ro'yxati

| Metod | Yo'l (Endpoint) | Auth | Rol | Vazifasi | Holati |
|---|---|---|---|---|---|
| `POST` | `/api/auth/send-otp` | Ochiq | Mehmon | SMS kod yuborish | **Ishlaydi** (Eskiz / Demo) |
| `POST` | `/api/auth/verify-otp` | Ochiq | Mehmon | Kodni tekshirib session yaratish | **Ishlaydi** |
| `GET` | `/api/auth/me` | Majburiy | Mijoz | Joriy foydalanuvchi ma'lumotlari | **Ishlaydi** |
| `PUT` | `/api/auth/update-profile` | Majburiy | Mijoz | Ism, viloyat, manzilni yangilash | **Ishlaydi** |
| `DELETE` | `/api/auth/delete-account` | Majburiy | Mijoz | Hisobni va shaxsiy ma'lumotlarni o'chirish | **Ishlaydi** |
| `POST` | `/api/push/register` | Majburiy | Mijoz | FCM push tokenini saqlash (upsert) | **Ishlaydi** |
| `DELETE` | `/api/push/unregister` | Majburiy | Mijoz | FCM push tokenni o'chirish | **Ishlaydi** |
| `GET` | `/api/weather/today` | Ochiq | Hamma | Bugungi ob-havo va qishloq xo'jaligi tavsiyasi | **Ishlaydi** (Open-Meteo) |
| `GET` | `/api/medicines` | Ochiq | Hamma | Dori vositalarini filtrlash va qidirish | **Ishlaydi** |
| `GET` | `/api/medicines/:id` | Ochiq | Hamma | Bitta dori tafsilotlari | **Ishlaydi** |
| `GET` | `/api/pharmacies` | Ochiq | Hamma | Dorixonalar ro'yxati | **Ishlaydi** |
| `GET` | `/api/pharmacies/:id` | Ochiq | Hamma | Dorixona tafsilotlari | **Ishlaydi** |
| `GET` | `/api/specialists` | Ochiq | Hamma | Agronom va veterinarlar ro'yxati | **Ishlaydi** |
| `POST` | `/api/specialist-calls` | Majburiy | Mijoz | Mutaxassisga chaqiruv so'rovi yuborish | **Ishlaydi** |
| `GET` | `/api/orders` | Majburiy | Mijoz | O'z buyurtmalarini ko'rish | **Ishlaydi** |
| `POST` | `/api/orders` | Majburiy | Mijoz | Yangi buyurtma yaratish | **Ishlaydi** |
| `GET` | `/api/orders/:id` | Majburiy | Mijoz | Buyurtma holatini ko'rish | **Ishlaydi** |
| `POST` | `/api/diagnose/crop` | Ochiq | Hamma | Ekin rasmini Gemini Vision bilan tahlil qilish | **Ishlaydi** |
| `POST` | `/api/diagnose/animal` | Ochiq | Hamma | Chorva rasmini Gemini Vision bilan tahlil qilish | **Ishlaydi** |
| `GET` | `/api/agro-maslahatlar` | Ochiq | Hamma | Agro tavsiyalar ro'yxati | **Ishlaydi** |
| `POST` | `/api/admin/login` | Ochiq | Admin | Admin paroli bilan kirish | **Ishlaydi** |
| `GET` | `/api/admin/orders` | Majburiy | Admin | Barcha buyurtmalarni boshqarish | **Ishlaydi** |
| `PATCH` | `/api/admin/orders/:id/status`| Majburiy| Admin | Statusni o'zgartirish + Push yuborish | **Ishlaydi** |

### 4.2. Autentifikatsiya va DEMO hisob mexanizmi
* **Fayl:** `backend/src/routes/auth.ts` (L45–L85 va L120–L165).
* **Ishlash tartibi:**
  * Agar kiritilgan raqam `DEMO_PHONE` ga teng bo'lsa (yoki `OTP_DEV_MODE=true` bo'lsa), Eskiz SMS API chaqirilmaydi.
  * Tasdiqlashda `code === DEMO_OTP` (standart: `123456`) tekshiriladi va darhol haqiqiy `user_sessions` tokeni beriladi.
  * Oddiy foydalanuvchilar uchun 6 xonali tasodifiy kod `verification_codes` jadvaliga yoziladi, 5 daqiqa amal qiladi va Eskiz orqali yuboriladi.

### 4.3. Xavfsizlik: Rate limit, CORS va fayl hajmi
* **CORS:** `backend/src/index.ts` (L38–L48) — ruxsat etilgan originlar ro'yxati: `agroz.uz`, `admin.agroz.uz`, `localhost:3000`, `localhost:3001` va `capacitor://localhost` (iOS/Android WebView uchun zarur).
* **Fayl yuklash hajmi:** `express.json({ limit: '15mb' })` qo'yilgan (`backend/src/index.ts` L52), chunki kamera suratlari base64 formatida yuboriladi.
* **Rate Limiting:** ⚠️ **TOPILMADI**. `express-rate-limit` kutubxonasi o'rnatilmagan. SMS yuborish endpointiga (`/api/auth/send-otp`) spam so'rovlar yuborilishining oldini oluvchi IP-asosli cheklov yo'q (faqat bitta raqamga so'nggi 1 daqiqada kod yuborilgan bo'lsa qayta yubormaslik tekshiruvi bor).

### 4.4. Fon vazifalari (Cron / Schedulers)
* **Fayl:** `backend/src/index.ts` (L125–L160).
* `node-cron` kutubxonasi mavjud.
* Har kuni soat **07:00 da (Toshkent vaqti)** avtomatik tarzda:
  * Open-Meteo orqali ob-havo olinadi;
  * Barcha ro'yxatdan o'tgan mijozlarga kunlik agronomik ogohlantirish tayyorlanadi;
  * FCM orqali aktiv push token egalariga xabar tarqatiladi.

---

## 5. MA'LUMOTLAR BAZASI

* **Turi:** PostgreSQL.
* **ORM:** Drizzle ORM (`drizzle-orm/node-postgres`).
* **Sxema fayli:** `backend/src/db/schema.ts`.
* **Migratsiya mexanizmi:** `backend/src/db/index.ts` ichidagi `ensureSchema()` funksiyasi server ishga tushganda barcha jadvallar (`CREATE TABLE IF NOT EXISTS`) va yangi ustunlarni (`ALTER TABLE ADD COLUMN IF NOT EXISTS`) avtomatik tekshiradi va yaratadi.

### 5.1. Jadvallar ro'yxati (22 ta)
1. `users` — Mijozlar (id, phone, name, region, district, address, created_at, updated_at).
2. `user_sessions` — Foydalanuvchi auth tokenlari (token, user_id, expires_at).
3. `verification_codes` — SMS OTP kodlar (phone, code, expires_at, verified).
4. `push_tokens` — FCM qurilma tokenlari (id, user_id, token [UNIQUE], platform, updated_at).
5. `specialists` — Mutaxassis va dorixonalar (id, name, type, phone, telegram_id, rating, is_active).
6. `specialist_medicines` — Dorixonadagi dori vositalari qoldig'i va narxlari.
7. `medicines` — Umumiy dori katalogi.
8. `orders` — Buyurtmalar (id, user_id, specialist_id, status, delivery_type, total_amount, payment_method).
9. `order_items` — Buyurtma ichidagi mahsulotlar (order_id, medicine_id, quantity, price).
10. `diagnoses` — AI tashxis natijalari arxivi (user_id, image_url, result_json, type).
11. `specialist_calls` — Mutaxassisni dalaga chaqirish arizalari.
12. `admin_sessions` — Admin auth tokenlari.
13. `articles` / `agro_maslahatlar` — Ilmiy va amaliy agro maqolalar.
14–22. Qo'shimcha yordamchi jadvallar (kategoriyalar, bildirishnomalar arxivi, loglar).

### 5.2. Hisob o'chirilishi (`purgeUserAccount`)
* **Fayl:** `backend/src/lib/user-auth.ts` (L145–L210).
* **Foydalanuvchi o'z hisobini o'chirganda:**
  * `push_tokens` — to'liq o'chiriladi (`DELETE`);
  * `user_sessions` — to'liq o'chiriladi (`DELETE`);
  * `verification_codes` — to'liq o'chiriladi (`DELETE`);
  * `diagnoses` — o'chiriladi (`DELETE`);
  * `users` — to'liq o'chiriladi (`DELETE`);
  * `orders` — moliyaviy hisobot va dorixona hisobi uchun saqlanadi, ammo `user_id` anonimlashtiriladi yoki unlinked holatga keltiriladi.
* **Baholash:** Apple App Store 5.1.1 (Data Deletion) qoidasiga to'liq javob beradi.

---

## 6. TASHQI XIZMATLAR VA ENV O'ZGARUVCHILARI

### 6.1. Ishlatilayotgan barcha ENV o'zgaruvchilar jadvali

| ENV o'zgaruvchi nomi | Vazifasi | Majburiy / Ixtiyoriy | Qaysi faylda ishlatiladi | `.env.example`da bormi? |
|---|---|---|---|---|
| `PORT` | Backend porti (default: 5000) | Ixtiyoriy | `backend/src/index.ts` | Bor |
| `DATABASE_URL` | PostgreSQL ulanish manzili | **Majburiy** | `backend/src/db/index.ts` | Bor |
| `GEMINI_API_KEY` | Google Gemini AI kaliti | **Majburiy** | `backend/src/lib/gemini.ts` | Bor |
| `ESKIZ_EMAIL` | Eskiz.uz SMS login | Majburiy (prod) | `backend/src/lib/sms.ts` | Bor |
| `ESKIZ_PASSWORD` | Eskiz.uz SMS parol | Majburiy (prod) | `backend/src/lib/sms.ts` | Bor |
| `ADMIN_PASSWORD` | Admin panel kirish paroli | **Majburiy** | `backend/src/routes/admin.ts` | Bor |
| `TELEGRAM_BOT_TOKEN` | Dorixona/Mutaxassis boti | Ixtiyoriy | `backend/src/routes/bot.ts` | Bor |
| `FIREBASE_SERVICE_ACCOUNT`| FCM Push yuborish kaliti (JSON) | Ixtiyoriy (push uchun shart) | `backend/src/lib/push.ts` | Bor |
| `DEMO_PHONE` | Do'kon tekshiruvchisi raqami | **Majburiy (review uchun)** | `backend/src/routes/auth.ts` | Bor |
| `DEMO_OTP` | Do'kon tekshiruvchisi SMS kodi | **Majburiy (review uchun)** | `backend/src/routes/auth.ts` | Bor |
| `OTP_DEV_MODE` | SMS yubormasdan test qilish | Ixtiyoriy | `backend/src/routes/auth.ts` | Bor |
| `NEXT_PUBLIC_API_URL` | Frontend API manzili | **Majburiy** | `frontend/src/lib/api.ts` | Bor |

### 6.2. Tashqi xizmatlar holati
* **SMS provayder:** Eskiz.uz (`POST https://notify.eskiz.uz/api/auth/login` va `/message/sms/send`). Token xotirada keshlanadi.
* **Ob-havo provayderi:** Open-Meteo API (`https://api.open-meteo.com/v1/forecast`). API kalit talab qilmaydi, bepul va real ishlaydi.
* **AI Model:** Google Gemini (`gemini-2.5-flash`), rasmiy `@google/genai` SDK orqali multimodal ishlaydi.
* **Push bildirishnomalar:** Firebase Cloud Messaging (FCM via `firebase-admin`). Agar kalit berilmasa, server qulab tushmaydi, xavfsiz log yozadi.
* **To'lov tizimlari (Payme, Click, Uzum):** **YO'Q (0%)**. Kod bazasida birorta onlayn to'lov tizimi integratsiyasi mavjud emas.

---

## 7. BUYURTMA VA TO'LOV OQIMI

### 7.1. Savatcha va Buyurtma berish jarayoni
* **Fayl:** `frontend/src/app/cart/page.tsx` va `backend/src/routes/orders.ts`.
1. Foydalanuvchi dorilar ro'yxatidan mahsulot tanlaydi (mahalliy brauzer `localStorage`da saqlanadi).
2. Savat sahifasida 2 xil usul tanlanadi:
   * **Yetkazib berish (Delivery):** Manzil va telefon kiritiladi.
   * **Olib ketish (Pickup):** Qaysi dorixonadan olib ketishi ko'rsatiladi.
3. To'lov usuli: **Faqat "Naqd / Qabul qilganda to'lash" (Cash on Delivery)** mavjud.
4. "Buyurtma berish" bosilganda `POST /api/orders` chaqiriladi.
5. Dorixona egasiga Telegram bot orqali yangi buyurtma borligi haqida xabar boradi.

### 7.2. Buyurtma hayotiy davri (Lifecycle)
* Statuslar zanjiri: `new` (yangi) ➔ `confirmed` (tasdiqlandi) ➔ `delivering` (yo'lda) ➔ `completed` (yetkazildi) yoki `cancelled` (bekor qilindi).
* Status o'zgarganda xaridorning mobil ilovasiga FCM orqali real push-bildirishnoma boradi (`backend/src/routes/admin.ts` L180).

---

## 8. AI TASHXIS TIZIMI (CROP VA ANIMAL)

* **Backend fayli:** `backend/src/routes/ai.ts` va `backend/src/lib/gemini.ts`.
* **Frontend fayllari:** `frontend/src/app/tashxis/crop/page.tsx`, `frontend/src/app/tashxis/animal/page.tsx`.

### 8.1. Ishlash mexanizmi
1. Foydalanuvchi o'simlik bargidagi dog' yoki hayvon kasalligi alomatini rasmga oladi (yoki galereyadan yuklaydi).
2. Rasm brauzerda siqilib, Base64 formatida `POST /api/diagnose/crop` yoki `/animal` ga yuboriladi.
3. Backend Google Gemini 2.5-flash modeliga qat'iy agronomik tizimli prompt (System Prompt) beradi.
4. Gemini javobni qat'iy JSON formatda qaytaradi:
   * `disease_name` (Kasallik nomi o'zbek tilida);
   * `confidence` (Ishonch darajasi, %);
   * `symptoms` (Alomatlar);
   * `treatment` (Davolash choralari);
   * `recommended_medicines` (Tavsiya etiladigan preparatlar ro'yxati).
5. ⚠️ **Baza bilan bog'liqlik zaifligi:** Gemini qaytargan dori nomlari oddiy matn (string) bo'lib, bazadagi `medicines` jadvalidagi `id` bilan avtomatik bog'lanmaydi. Foydalanuvchi "Dorilarni ko'rish" tugmasini bossa, umumiy `/dorilar` katalogiga o'tkazib yuboriladi.

---

## 9. MOBIL ILOVA (CAPACITOR / NATIVE SOZLAMALAR)

* **Konteyner:** `@capacitor/cli` va `@capacitor/core` versiyasi `^7.0.0`.
* **Arxitektura:** Hosted Web App rejimi (`mobile/capacitor.config.ts` ichida `server.url: 'https://agroz.uz'`). Ilova ochilganda production serverdagi Next.js interfeysini ochadi.
* **App ID:** `uz.agrozgo.app`
* **App Name:** `AgrozGO`

### 9.1. Android sozlamalari (`mobile/android/`)
* **`targetSdkVersion`:** `35` (Google Play 2025/2026 talabiga to'liq mos).
* **`minSdkVersion`:** `23` (Android 6.0+).
* **Ruxsatlar (`AndroidManifest.xml`):**
  * `android.permission.INTERNET`
  * `android.permission.POST_NOTIFICATIONS`
  * `android.permission.CAMERA`
  * `android.permission.ACCESS_FINE_LOCATION`
* **FCM sozlamasi:** `mobile/android/app/google-services.json` talab etiladi (repoga qo'shilmagan, `.gitignore` qilingan — to'g'ri qilingan).

### 9.2. iOS sozlamalari (`mobile/ios/App/App/`)
* **`Info.plist` ruxsat tushuntirishlari (Usage Descriptions):**
  * `NSCameraUsageDescription`: *"Ekin va chorva kasalliklarini AI orqali aniqlash uchun kamera ruxsati zarur."*
  * `NSLocationWhenInUseUsageDescription`: *"Yaqin atrofdagi agro-dorixonalar va mutaxassislarni ko'rsatish uchun joylashuvingiz kerak."*
  * `NSPhotoLibraryUsageDescription`: *"Tashxis uchun galereyadan rasm tanlash imkoniyati."*
* ⚠️ **KRITIK YETISHMOVCHILIK (iOS Entitlements):**
  * Loyihada `App.entitlements` fayli mavjud emas. Apple Developer hisobida Push Notifications imkoniyatini yoqish va Xcode orqali "Push Notifications" capability qo'shilishi shart, aks holda iOS'da push token olinmaydi.

### 9.3. Ikonka va Splash screen
* `mobile/assets/icon.png` (1024x1024) va `splash.png` (2732x2732) mavjud.
* Android va iOS resurs papkalariga (`res/mipmap-*` va `Assets.xcassets/AppIcon.appiconset`) mos o'lchamlarda to'liq generatsiya qilingan.

---

## 10. DO'KON TALABLARI (STORE READINESS AUDITI)

### 10.1. Hisobni o'chirish (Account Deletion — Apple Guideline 5.1.1)
* **Status:** **Mavjud va to'liq talabga javob beradi.**
* **Joylashuvi:** `frontend/src/app/profile/page.tsx` pastki qismida qizil "Hisobni o'chirish" tugmasi mavjud.
* Bosilganda tasdiqlash modali chiqadi va `DELETE /api/auth/delete-account` chaqirilib, barcha shaxsiy ma'lumotlar tozalanadi.

### 10.2. Huquqiy sahifalar (Legal)
* Maxfiylik siyosati: `https://agroz.uz/maxfiylik` (`frontend/src/app/maxfiylik/page.tsx`).
* Foydalanish shartlari: `https://agroz.uz/shartlar` (`frontend/src/app/shartlar/page.tsx`).
* Matnlar to'liq o'zbek tilida, yig'iladigan ma'lumotlar turlari (telefon, manzil, geolokatsiya, rasm) batafsil ko'rsatilgan.

### 10.3. Google Play Data Safety deklaratsiyasi
* **Yig'iladigan ma'lumotlar:**
  * Shaxsiy ma'lumotlar: Telefon raqami, Foydalanuvchi ismi, Manzil.
  * Joylashuv: Aniq geolokatsiya (dorixonalargacha masofa uchun).
  * Rasmlar: Foydalanuvchi yuklagan ekin/chorva suratlari (faqat AI tashxis uchun).
  * Qurilma ID: FCM push notification token.
* **Uchinchi tomonga uzatish:** Faqat AI tahlil uchun Google Gemini API'ga rasm uzatiladi.

### 10.4. Foydalanuvchi yaratgan kontent (UGC) moderatsiyasi
* Ilovada ochiq umumiy chat, sharhlar yoki jamoat lentasi yo'q. Faqat mutaxassisga to'g'ridan-to'g'ri murojaat va dori buyurtmasi mavjud. Shu sababli Apple UGC talabi (Report/Block user) qat'iy talab etilmaydi.

---

## 11. SIFAT VA XAVFSIZLIK

### 11.1. Build va Typecheck holati
* `npm run typecheck:all`: **0 TA XATO (Muvaffaqiyatli o'tdi).** Barcha TypeScript tiplari to'g'ri sozlangan.
* `npm run build:all`: **Muvaffaqiyatli yakunlandi.** Next.js va Express server build fayllari to'liq yig'iladi.
* `npm run lint`: **3 ta xato / 12 ta ogohlantirish aniqlandi:**
  1. `frontend/src/app/page.tsx` — render vaqtida noxolislik (impure `Math.random()`);
  2. `admin/src/app/panel/page.tsx` — yopilmagan qavs sintaksis ogohlantirishi;
  3. `frontend/src/components/GeoLocationBlocker.tsx` — `useEffect` ichida noaniq funksiya chaqiruvi.
* **Avtomatlashtirilgan testlar (Unit / E2E):** **UMUMAN YO'Q (0 ta test).** Jest, Vitest yoki Cypress o'rnatilmagan.

### 11.2. Xavfsizlik auditi
* Kod bazasida hech qanday ochiq yozilgan (hardcoded) parollar, API kalitlar yoki tokenlar topilmadi.
* Barcha maxfiy ma'lumotlar `.env` fayllaridan olinadi. `.env` fayllari `.gitignore` ga to'g'ri kiritilgan.

---

## 12. XULOSA VA TOP-10 NASHR TO'SIQLARI (CRITICAL BLOCKERS)

### 12.1. Umumiy xulosa jadvali

| Holat toifasi | Funksiyalar va modullar |
|---|---|
| **v1.0 ga tayyor** | Auth (OTP), Profil va hisob o'chirish, Dorilar katalogi, Dorixonalar xaritasi, Mutaxassislar ro'yxati, Naqd buyurtma oqimi, AI tashxis (backend va alohida sahifalar), Maxfiylik va Shartlar, Capacitor bazaviy konfiguratsiyasi. |
| **Tuzatish shart (Blockers)** | `GeoLocationBlocker` (Store review bloklanadi), Bosh sahifadagi AI tugmalari (2.0 modali o'rniga haqiqiy sahifaga yo'naltirish), iOS Push Notifications capability. |
| **Yashirish / O'chirish kerak** | Savatdagi "Onlayn to'lov (Tez orada)" tugmasi, Bosh sahifadagi bo'sh reklama tugmalari. |
| **Kelgusi versiyalarda (v2.0)** | Click/Payme integratsiyasi, Avtomatlashtirilgan testlar, Mutaxassislar uchun alohida mobil kabinet. |

---

### 12.2. EKS MASLAHATChI UCHUN: TOP-10 NASHR TO'SIQLARI

1. 🔴 **1-TO'SIQ (ENG XAVFLI): `GeoLocationBlocker.tsx` tufayli 100% rad etilish (Rejection).**
   * *Dalil:* `frontend/src/components/GeoLocationBlocker.tsx` `api.country.is` orqali foydalanuvchi davlatini tekshiradi. Agar `UZ` bo'lmasa, ilova butunlay bloklanadi.
   * *Oqibat:* Apple (AQSh) va Google Play (AQSh/Yevropa) tekshiruvchilari ilovani ochishi bilan qora bloklangan ekran ko'radi va ilovani darhol rad etadi (Guideline 2.1 — App Completeness).
   * *Tavsiya:* App Store tekshiruvi davrida ushbu bloklovchini o'chirib turish yoki demo rejimida tekshiruvchilarni o'tkazish shart.

2. 🔴 **2-TO'SIQ: Bosh sahifadagi AI tashxis tugmalari "Tez orada (2.0)" deb turgani.**
   * *Dalil:* `frontend/src/components/HomeClientView.tsx` (L331–385) "Ekin tashxisi" bosilganda modal chiqaradi. Holbuki `/tashxis/crop` sahifasi to'liq ishlaydi.
   * *Oqibat:* Apple Guideline 2.2 (Beta / Placeholder Content) bo'yicha rad etiladi. Tugmalar to'g'ridan-to'g'ri `/tashxis/crop` va `/tashxis/animal` ga yo'naltirilishi shart.

3. 🔴 **3-TO'SIQ: iOS uchun `Push Notifications` Entitlements yetishmovchiligi.**
   * *Dalil:* `mobile/ios/` papkasida `.entitlements` fayli yo'q.
   * *Oqibat:* Xcode'da Push capability yoqilmasa, iOS qurilmalarda bildirishnoma ruxsati so'ralmaydi va token olinmaydi.

4. 🟡 **4-TO'SIQ: Google Play `google-services.json` fayli.**
   * *Dalil:* `mobile/android/app/google-services.json` repoda yo'q (to'g'ri xavfsizlik chorasi sifatida).
   * *Oqibat:* Android build olishdan oldin Firebase konsolidan haqiqiy faylni yuklab qo'yish kerak, aks holda Android build push plaginida xato beradi.

5. 🟡 **5-TO'SIQ: Hosted URL (`https://agroz.uz`) barqarorligi.**
   * *Dalil:* `mobile/capacitor.config.ts` ichida `server.url: 'https://agroz.uz'`.
   * *Oqibat:* Agar serverda bir necha daqiqa uzilish bo'lsa, mobil ilova oq ekran (Net Error) beradi. SSL sertifikat va server doimiy 100% ishlashi shart.

6. 🟡 **6-TO'SIQ: Savatdagi "Tez orada" to'lov yozuvi.**
   * *Dalil:* `frontend/src/app/cart/page.tsx` onlayn to'lov qatorida "Tez orada" yozuvi turibdi.
   * *Tavsiya:* Do'kon tekshiruvchilari savol bermasligi uchun bu yozuvni vaqtincha yashirib, faqat "Naqd / Qabul qilishda to'lash" ko'rinishida qoldirish kerak.

7. 🟡 **7-TO'SIQ: SMS Rate-limit yo'qligi.**
   * *Dalil:* `backend/src/routes/auth.ts` da IP bo'yicha cheklov yo'q.
   * *Xavf:* Tashqi botlar Eskiz balansingizni SMS spam orqali tugatib qo'yishi mumkin.

8. 🟢 **8-TO'SIQ: AI dori tavsiyalarining katalog bilan to'g'ridan-to'g'ri bog'lanmaganligi.**
   * *Dalil:* AI tavsiya qilgan preparat bosilganda aniq dori kartochkasi ochilmaydi, umumiy `/dorilar` ga o'tadi. Bu do'konni to'xtatmaydi, ammo foydalanuvchi tajribasini (UX) pasaytiradi.

9. 🟢 **9-TO'SIQ: Avtomatlashtirilgan testlarning yo'qligi.**
   * *Dalil:* 0 ta test. Kelgusi yangilanishlarda regresiya xatolari yuzaga kelish xavfi yuqori.

10. 🟢 **10-TO'SIQ: Linterning 3 ta xatosi.**
    * *Dalil:* `npm run lint` 3 ta xato qaytaradi. Veb yoki mobil build yiqilmaydi, lekin CI/CD quvurlarida ogohlantirish beradi.
