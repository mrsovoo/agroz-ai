# AgrozGO v1.0 — Texnik Audit va Ishlash Holati Hisoboti

**Hujjat sanasi:** 2026-10-03  
**Audit maqsadi:** AgrozGO v1.0 ning hozirgi kod bazasidagi haqiqiy holatini, oqimlarini va arxitekturasini kod dalillari (fayl yo'li, qator raqami) asosida to'liq xolisona audit qilish.  
**Muhim qoida:** Taxminlar yo'q. Faqat kodda mavjud narsalar. Topilmagan holatlar "TOPILMADI" deb belgilangan. Hech qanday maxfiy kalit/parol chiqarilmagan.

---

## 0. Git va Branchlar Holati

* **Joriy faol branch:** `release/v1.0` (commit `1d91401`)
* **`git status`:** `On branch release/v1.0. Your branch is up to date with 'origin/release/v1.0'. nothing to commit, working tree clean.`
* **Barcha branchlar:**
  * `main` (mahalliy va `origin/main` — commit `1d91401` bilan `release/v1.0` bilan 100% bir xil)
  * `release/v1.0` (mahalliy va `origin/release/v1.0` — commit `1d91401`)
  * `adventurous-profit` (mahalliy — commit `94ccc99`, `main` dan 125 commit orqada, unga xos qo'shimcha commit yo'q: `main..adventurous-profit` = 0)
  * `rune-digestion` (mahalliy — commit `d3cd5e8`, `main` dan 124 commit orqada, unga xos qo'shimcha commit yo'q: `main..rune-digestion` = 0)
* **Oxirgi 15 commit tarixi (`git log -15 --oneline`):**
  1. `1d91401` - feat(kabinet): pharmacy dashboard with bottom nav (Asosiy, Bronlar, Qoldiq, Profil), stock filters and quick stock stepper
  2. `fdb58f0` - feat(kabinet): add camera and gallery photo upload with client-side compression to add-medicine modal
  3. `2dbe236` - security: protect SSH keys in .gitignore, sanitize server error messages, and remove technical hashes from launch app
  4. `e680ac8` - fix(kabinet): show registered bot user name and add Bog'lanish phone reveal in specialist launch app
  5. `8f4788c` - feat(kabinet): streamline partner launch app with 1-tap UX, fast stock toggle, and zero friction
  6. `11b3fd0` - feat(home): display stable nearby 2 vets and 2 agronomists under medicines
  7. `7916b38` - fix(ui): hide bottom nav on modal, pin call button, sync bot user profile and fix scroll lock
  8. `696bf85` - feat(specialists): enhance SpecialistCallModal with user profile card, custom reason textarea, and pinned confirmation bar
  9. `50946c9` - fix(products,specialists): optimize product cards layout, unify home and specialist cards, eliminate fake fallbacks and add bot profile completion
  10. `ee6bd6e` - fix(specialists): exclude pharmacy profiles from specialists section and query only specialists role
  11. `a499fcf` - fix(specialists): enhance mobile UI, category filtering across regions, and replace telegram bot link with direct actions
  12. `55528b8` - feat(specialists): implement modern UI matching doctor appointment sample with initials avatar, status dots, categories, and full profile detail screen
  13. `10d24f2` - feat(product-card): streamline medicine cards to show location, medicine name, description, rating, price with unit, and cart button
  14. `b474fd9` - fix(calls): replace hardcoded demo call with interactive form, clean database test record, and add problem details input
  15. `95168c6` - feat(kabinet): complete partner launch app with role-based calls, orders, medicines catalog, and legal certificate

---

## 1. Maqsadli Model Bilan Solishtirish (v1.0 Skop)

Maqsad: v1.0 da FAQAT 3 ta narsa bo'lishi kerak:
1. Mahsulotni yaqin agro-do'konda **BRON** qilib olib ketish;
2. Agronom/veterinarni **CHAQIRISH**;
3. **OB-HAVO**.
AI tashxis, rasm yuborish, yetkazib berish, onlayn to'lov bo'lmasligi kerak.

| Funksiya / Xususiyat | Kodda bormi? | Ko'rinib turibdimi? | Ishlaydimi? | Dalil (Fayl va qator) | Izoh |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **(a) Do'kondan bron qilib olib ketish** | HA | HA | **ISHLAYDI** | `frontend/src/components/CartDrawer.tsx:1079-1126`<br>`backend/src/routes/orders.ts:25-204` | Savatdan bitta do'kon bo'yicha bron yaratiladi, do'konga bot orqali tushadi. |
| **(b) Agronom/veterinarni chaqirish** | HA | HA | **ISHLAYDI** | `frontend/src/components/SpecialistCallModal.tsx:278-320`<br>`backend/src/routes/specialists.ts:165-349` | Fermer ism, telefon, manzil, muammo kiritadi; mutaxassisga Telegram botda boradi. |
| **(c) Ob-havo** | HA | HA | **ISHLAYDI** | `frontend/src/app/ob-havo/page.tsx:67-99`<br>`backend/src/routes/weather.ts:21-65` | Open-Meteo orqali 7 kunlik ob-havo, purkash tavsiyalari chiqadi. |
| **AI Tashxis** | Qisman (Backendda ochiq, Frontendda yopiq) | **YO'Q (Yashirilgan)** | **ISHLAMAYDI** (UI yo'q) | `frontend/src/app/tashxis/page.tsx:4` (`redirect("/")`)<br>`frontend/src/app/tashxis/[category]/page.tsx:4`<br>`backend/src/routes/diagnose.ts:29` | `/tashxis` bosh sahifaga yo'naltirilgan (`redirect("/")`). `DiagnoseForm.tsx` hech qayerga ulanmagan. Lekin backendda `/api/diagnose` ochiq turibdi (feature flag yo'q). |
| **Rasm yuborish (Mijoz oqimida)** | YO'Q | **YO'Q** | **YO'Q** | `frontend/src/components/SpecialistCallModal.tsx:47-70`<br>`frontend/src/components/CartDrawer.tsx` | Mutaxassis chaqirish va savatda rasm yuklash maydoni yo'q. Rasm yuklash faqat do'kon egasi kabinetida (`/kabinet`) dori kiritishda bor. |
| **Yetkazib berish (Delivery)** | Qisman (Kodda bor, lekin o'chirilgan) | **YO'Q (Yashirilgan)** | **YO'Q** | `frontend/src/components/CartDrawer.tsx:3` (`const DELIVERY_ENABLED = false;`) | `DELIVERY_ENABLED = false` qilingan, mijozga faqat "Olib ketish" ko'rinadi. |
| **Onlayn to'lov (Payme/Click)** | YO'Q | **YO'Q** | **YO'Q** | `frontend/src/components/CartDrawer.tsx` | Payme/Click integratsiyasi yo'q. Mahsulot olinganda to'lanadi. |

---

## 2. Oqimlar (End-to-End Tekshiruv)

### A. Ro'yxatdan O'tish va Kirish: Telefon -> OTP -> Sessiya
1. **Foydalanuvchi interfeysi:** `frontend/src/app/kirish/page.tsx`. Telefon raqam kiritiladi (+998).
2. **Kod so'rash (`POST /api/auth/request-code`):**
   * Fayl: `backend/src/routes/auth.ts:71-154`.
   * Rate limit: `reqCodeIpLimiter` (soatiga 5 ta), `reqCodePhoneLimiter` (soatiga 3 ta), `rateLimit("auth:request-code:...")` (daqiqasiga 3 ta).
   * **Demo akkaunt:** `backend/src/routes/auth.ts:25-32, 89-92`. `process.env.DEMO_PHONE` va `process.env.DEMO_OTP` mavjud bo'lsa va kiritilgan raqam unga teng bo'lsa, SMS/bot yubormasdan `{ ok: true, method: "demo" }` qaytaradi.
   * **`devOtpEnabled()`:** `backend/src/routes/auth.ts:34-37`:
     ```ts
     function devOtpEnabled(): boolean {
       if (process.env.NODE_ENV === "production") return false;
       return process.env.OTP_DEV_MODE === "true";
     }
     ```
     Production muhitida har doim `false` qaytaradi! Faqat local developmentda `OTP_DEV_MODE === "true"` bo'lsa ishlaydi.
   * Asosiy oqim: Agar Mini App ichida ochilgan bo'lsa (`initData` orqali `telegramId` olingan bo'lsa), kod bevosita foydalanuvchining shaxsiy Telegram botiga (`@agrozai_bot`) boradi (`auth.ts:116-126`). Aks holda, bot havolasi yoki Eskiz SMS yuboriladi.
3. **Kodni tasdiqlash (`POST /api/auth/verify`):**
   * Fayl: `backend/src/routes/auth.ts:157-275`.
   * Rate limit: `verifyCodeLimiter` (10 daqiqada 10 ta), `rateLimit("auth:verify:...")` (daqiqasiga 5 ta).
   * Agar demo bo'lmasa, `otpCodes` jadvalidan `used = false` va muddati o'tmagan kod qidiriladi (`auth.ts:180-189`).
   * `users` jadvalida foydalanuvchi yaratiladi yoki mavjud profili olinadi (`auth.ts:194-205`).
   * 32-baytli hex sessiya yaratiladi va `sessions` jadvaliga yoziladi (`auth.ts:256-260`).
   * Cookie qo'yiladi: `agroai_session` (30 kunlik) hamda JSON javobda `{ ok: true, sessionId, user }` qaytadi (`auth.ts:262-270`).

---

### B. Mahsulot Qidirish -> Do'kon Tanlash -> Savat -> Bron Yaratish
1. **Katalog & Qidiruv:** `frontend/src/app/dorilar/page.tsx`, `frontend/src/components/HomeClientView.tsx`.
   * Dorilar API: `GET /api/medicines` (`backend/src/routes/medicines.ts:12-98`). Baza: `specialistMedicines` inner join `specialists` (faqat `role = 'pharmacy'`).
2. **Savatga qo'shish:** `frontend/src/lib/cart-store.ts`. Savat `localStorage`da saqlanadi. Muhim qoida: bitta savat faqat **bitta agro-do'kon** dorilaridan iborat bo'lishi mumkin.
3. **Yetkazib berish ko'rinishi:** `frontend/src/components/CartDrawer.tsx:3, 1041-1126`.
   * `DELIVERY_ENABLED = false` bo'lgani sababli yetkazib berish tugmalari yashirilgan. Faqat: *"💡 Buyurtma tasdiqlangach, agro-do'konga borib o'zingiz olib ketasiz"* ko'rsatiladi.
4. **Bron jo'natish (`POST /api/orders`):**
   * Fayl: `backend/src/routes/orders.ts:25-204`.
   * Baza yozuvi: `orders` jadvaliga `deliveryType = 'pickup'`, `status = 'yangi'` bilan yoziladi, tarkibi `orderItems` jadvaliga saqlanadi.
5. **Statuslar ro'yxati (aniq qiymatlar):**
   * Schema: `backend/src/db/schema.ts:262-263`: `status: varchar("status", { length: 20 }).default("yangi")`.
   * Qiymatlar: `yangi` (yangi bron), `tasdiqlandi` (do'kon qabul qildi), `tayyor` (olib ketishga tayyor), `yetkazildi` (mijoz olib ketdi / yakunlandi), `bekor` (bekor qilindi).
6. **Kim statusni o'zgartira oladi?**
   * Do'kon egasi: `POST /api/bot/partner/orders/:id/action` orqali (`backend/src/routes/bot.ts:1848-1894`) yoki `@agroz_auth_bot` inline tugmalari orqali (`backend/src/routes/bot.ts:970-1030`).
   * Avtomatik tizim (Cron): 24 soatdan oshgan yangi/tasdiqlangan bronlarni `bekor` qiladi (`backend/src/cron.ts:8-32`).
   * Admin: `POST /api/admin/orders/:id/status` (`backend/src/routes/admin.ts:1107-1133`).
7. **Foydalanuvchi o'z bronini bekor qila oladimi?**
   * **TOPILMADI!** `backend/src/routes/orders.ts` da mijoz tomonidan bronni bekor qilish endpointi yo'q. Mijoz faqat `/api/orders/track` orqali ko'ra oladi va `/api/orders/rate` orqali baholay oladi.

---

### C. Do'konga Xabar va Bog'lanish
1. **Xabar qanday boradi?**
   * Buyurtma tushgan zahoti `notifyPharmacyNewOrder` funksiyasi chaqiriladi (`backend/src/routes/orders.ts:114-126`).
   * Do'kon egasiga **`@agroz_auth_bot`** orqali Telegram xabarnoma boradi (`backend/src/lib/orders-bot.ts:8-100`).
2. **Do'kon tasdiqlash/tayyor/olib ketildi tugmalari:**
   * Telegram botda inline tugmalar: `✅ Qabul qilish` (`o:confirm:<id>`), `❌ Bekor qilish` (`o:cancel:<id>`), `✅ Mijoz olib ketdi` (`o:done:<id>`) (`backend/src/lib/orders-bot.ts:110-138`).
   * Do'kon veb-kabinetida (`/kabinet`): "Tasdiqlash", "Yo'q", "Tayyorlandi", "Mijozga topshirildi" tugmalari mavjud (`frontend/src/app/kabinet/page.tsx:1101-1147`).
3. **Mijozga push / Telegram xabar boradimi?**
   * Do'kon holatni o'zgartirganda mijozga **`@agrozai_bot`** orqali Telegram xabari yuboriladi (`backend/src/routes/bot.ts:1008-1023`, `sendToUser`).
   * **Mobil push notification (`sendPushToUser`):** Bron tasdiqlanganda yoki tayyor bo'lganda mobil push yuborilmaydi (`notifyOrderConfirmedPush` mavjud, lekin kodda hech qayerda chaqirilmagan!). Mobil push faqat 24 soat o'tib bekor bo'lganda boradi (`backend/src/cron.ts:23`).

---

### D. Mutaxassis Chaqirish Oqimi
1. **Forma maydonlari:** `frontend/src/components/SpecialistCallModal.tsx:51-56`.
   * Maydonlar: Ism (`name`), Telefon (`phoneDigits`), Manzil (`address`), Muammo tavsifi (`problem`), Geolokatsiya (`userLat`, `userLng`).
   * Rasm yuklash maydoni: **YO'Q (TOPILMADI)**.
2. **POST endpoint:** `POST /api/specialists/call` (`backend/src/routes/specialists.ts:165-349`).
   * Baza: `specialistCalls` jadvaliga `status = 'yangi'` bilan yoziladi.
3. **Mutaxassisga xabar:**
   * Mutaxassisning Telegramiga **`@agroz_auth_bot`** orqali keladi (`backend/src/routes/specialists.ts:241-268`).
   * Inline tugmalar: `✅ Qabul qilish` (`sc:accept:<id>`), `❌ O'tkazib yuborish / Rad etish` (`sc:reject:<id>`).
4. **Qabul / Rad etilganda mijozga javob:**
   * Mutaxassis qabul qilsa (`sc:accept`): Mutaxassis `isBusy = true` bo'ladi, mijozga `@agrozai_bot` orqali tasdiqlash xabari boradi (`backend/src/lib/auth-bot-flow.ts:1036-1120`).
   * Mutaxassis rad etsa (`sc:reject`): Mijozga *"Mutaxassis ayni paytda band yoki chaqiruvni o'tkazib yubordi"* xabari boradi (`backend/src/lib/auth-bot-flow.ts:987-1029`).
   * Mijoz modalida polling: `SpecialistCallModal.tsx:182-201` har 4 soniyada `/api/specialists/call/:id/status` ni so'rab turadi.
5. **Javob bermasa nima bo'ladi?**
   * **TOPILMADI!** Mutaxassis javob bermasa chaqiruv muddati o'tmaydi (`status = 'yangi'` bo'lib turaveradi). Cron yoki eslatma faqat buyurtmalar (`orders`) uchun bor, `specialistCalls` uchun eslatma va avtomatik bekor qilish yo'q!

---

### E. Ob-Havo Oqimi
1. **Joylashuv ruxsati:** `frontend/src/app/ob-havo/page.tsx:101-129`. `navigator.geolocation.getCurrentPosition` orqali so'raladi. Ruxsat berilmasa fallback: Toshkent koordinatalari yuklanadi.
2. **Viloyat qo'lda tanlash:** **TOPILMADI!** Ob-havo sahifasida viloyatni qo'lda tanlash dropdown/menyusi yo'q.
3. **API manbasi:** Open-Meteo API (`https://api.open-meteo.com/v1/forecast`) (`backend/src/routes/weather.ts:21-30`).
4. **07:00 Push va o'chirish imkoni:**
   * Yuborilishi: `backend/src/cron.ts:35-52` (har kuni UTC 2:00 = Toshkent 07:00 da `users.isWeatherPushEnabled = true` bo'lganlarga Expo/FCM push).
   * O'chirish imkoni: **UI da TOPILMADI!** Backendda `users.isWeatherPushEnabled` ustuni bor, `ProfileEdit.tsx` komponenti prop sifatida qabul qiladi, lekin UI da uni o'chiruvchi hech qanday checkbox/switch chizilmagan (`ProfileEdit.tsx:75-136`).

---

### F. Hisobni O'chirish (Account Deletion)
1. **Ekran:** `frontend/src/components/ProfileClientView.tsx:501-596`. "Hisobni o'chirish" qizil tugmasi va ogohlantirish modali.
2. **Endpoint:** `DELETE /api/profile` (`backend/src/routes/profile.ts:65-97`) va `DELETE /api/auth/delete-account` (`backend/src/routes/auth.ts:601-638`).
3. **Nimalar o'chadi / anonimlashadi (`purgeUserAccount` — `backend/src/lib/user-auth.ts:124-175`):**
   * O'chiriladi: `pushTokens`, `diagnoses`, `notificationReads`, `supportTickets`, `supportMessages`, `specialistCalls`, `sessions`, `users`.
   * Anonimlashtiriladi: `orders` (buxgalteriya audit talablari sababli order ID va summasi qoladi, lekin `userId = null`, `customerName = "O'chirilgan hisob"`, `customerPhone = "000000000"`, `customerAddress = null` qilinadi).
   * Cookie tozalanadi: `agroai_session`, `agroz_session`.

---

### G. Push Bildirishnomalar
1. **Token olish:** `frontend/src/lib/capacitor.ts:20-65` (Capacitor `PushNotifications.register()` orqali iOS APNs / Android FCM token olinadi).
2. **Ro'yxatga olish:** `POST /api/push/register` (`backend/src/routes/push.ts:36-81`). `pushTokens` jadvaliga `userId` bilan saqlanadi.
3. **Qaysi hodisalarda yuboriladi?**
   * 1. Buyurtma 24 soatdan so'ng avtomatik bekor bo'lganda (`backend/src/cron.ts:23`).
   * 2. Ertalabki 07:00 ob-havo xabarnomasida (`backend/src/cron.ts:43`).
   * *(Eslatma: Buyurtma tasdiqlanganda push yuboruvchi `notifyOrderConfirmedPush` mavjud bo'lsa-da, kodda chaqirilmagan).*

---

### H. Admin Panel
1. **Kirish:** `https://admin.agroz.uz` yoki `/admin/panel`. Parol: `ADMIN_PASSWORD` env o'zgaruvchisi.
2. **Nimalarni ko'rish/o'zgartirish mumkin?**
   * Statistika: Foydalanuvchilar, mutaxassislar, do'konlar, buyurtmalar, chaqiruvlar soni (`backend/src/routes/admin.ts:192-314`).
   * Buyurtmalar ro'yxati va holatini o'zgartirish (`admin.ts:1043-1133`).
   * Mutaxassislar arizalarini tasdiqlash (`approve`) va rad etish (`reject`) (`admin.ts:916-988`).
   * Sharhlarni ko'rish va o'chirish (`admin.ts:451-551`).
   * Ommaviy xabar yuborish (Broadcast) (`admin.ts:1967-2022`).
   * Qo'llab-quvvatlash (Support tickets) javob berish (`admin.ts:2511-2730`).
3. **Do'kon, mahsulot, mutaxassis qanday kiritiladi?**
   * **Admin panel orqali to'g'ridan-to'g'ri qo'shish imkoni YO'Q (TOPILMADI)!**
   * Ular `@agroz_auth_bot` orqali mustaqil ro'yxatdan o'tadi.
   * Admin panelda faqat "Kutilmoqda" bo'lib chiqadi va Admin ularni **Tasdiqlash (Approve)** yoki **Rad etish (Reject)** qilishi mumkin.
   * Mahsulotlar (dorilar) esa tasdiqlangan do'kon egasi tomonidan o'zining `/kabinet` paneli yoki boti orqali kiritiladi.

---

## 3. Ekranlar Jadvali

| Sahifa yo'li | Nima ko'rsatadi? | Bog'langan API | Holat | v1.0 da ko'rinishi kerakmi? |
| :--- | :--- | :--- | :--- | :--- |
| `frontend/src/app/page.tsx` | Bosh sahifa: logo, qo'ng'iroqcha, ob-havo kartasi, 4 ta dori, 4 ta mutaxassis | `/api/medicines`, `/api/specialists`, `/api/weather` | **To'liq ishlaydi** | **HA** |
| `frontend/src/app/dorilar/page.tsx` | Dorilar to'liq katalogi, qidiruv, toifalar, savat | `/api/medicines`, `/api/specialists?role=pharmacy` | **To'liq ishlaydi** | **HA** |
| `frontend/src/app/dori/[id]/page.tsx` | Dori batafsil sahifasi, do'koni, narxi, savatga qo'shish | `/api/medicines/:id` | **To'liq ishlaydi** | **HA** |
| `frontend/src/app/mutaxassislar/page.tsx` | Agronom va veterinarlar ro'yxati, filtrlash, chaqirish | `/api/specialists?role=specialist` | **To'liq ishlaydi** | **HA** |
| `frontend/src/app/ob-havo/page.tsx` | 7 kunlik ob-havo, purkash tavsiyalari | `/api/weather`, `/api/location` | **To'liq ishlaydi** | **HA** |
| `frontend/src/app/savat/page.tsx` | Savat ochuvchi yo'naltiruvchi sahifa (CartDrawer) | `/api/orders`, `/api/profile` | **To'liq ishlaydi** | **HA** |
| `frontend/src/app/profil/page.tsx` | Mijoz profili, buyurtmalarim, chaqiruvlarim, hisobni o'chirish | `/api/profile`, `/api/profile/activity` | **To'liq ishlaydi** | **HA** |
| `frontend/src/app/kirish/page.tsx` | Telefon raqam va OTP orqali kirish/ro'yxatdan o'tish | `/api/auth/request-code`, `/api/auth/verify` | **To'liq ishlaydi** | **HA** |
| `frontend/src/app/kabinet/page.tsx` | Hamkorlar boshqaruvi: Dorixona dashboardi (Asosiy, Bronlar, Qoldiq, Profil) va Mutaxassis chaqiruvlari | `/api/bot/partner/*` | **To'liq ishlaydi** | **HA (Hamkorlar uchun)** |
| `frontend/src/app/bildirishnomalar/page.tsx` | Shaxsiy va ommaviy bildirishnomalar | `/api/notifications` | **To'liq ishlaydi** | **HA** |
| `frontend/src/app/xarita/page.tsx` | Agro-do'konlar va mutaxassislarning Leaflet xaritasi | `/api/specialists` | **To'liq ishlaydi** | **HA** |
| `frontend/src/app/yangiliklar/page.tsx` | Qishloq xo'jaligi yangiliklari | `/api/news` | **To'liq ishlaydi** | **Qo'shimcha** |
| `frontend/src/app/tashxis/page.tsx` | AI tashxis sahifasi | Yo'q (`redirect("/")`) | **Ishlamaydi (Redirect)** | **YO'Q (v1.0 dan chiqarilgan)** |
| `frontend/src/app/tashxis/[category]/page.tsx` | AI tashxis toifa sahifasi | Yo'q (`redirect("/")`) | **Ishlamaydi (Redirect)** | **YO'Q (v1.0 dan chiqarilgan)** |
| `frontend/src/app/natija/[id]/page.tsx` | Eski AI tashxis natija sahifasi | `/api/diagnose/:id` | **Meros/Arxiv** | **YO'Q (v1.0 dan chiqarilgan)** |
| `frontend/src/app/agro-mahsulotlar/page.tsx` | `/dorilar` ga yo'naltiruvchi | Yo'q (`redirect("/dorilar")`) | **Redirect** | **—** |
| `frontend/src/app/agro-mahsulot/[id]/page.tsx` | `/dori/:id` ga yo'naltiruvchi | Yo'q (`redirect("/dori/:id")`) | **Redirect** | **—** |
| `frontend/src/app/shartlar/page.tsx` | Foydalanish shartlari | Statik | **Ishlaydi** | **HA** |
| `frontend/src/app/maxfiylik/page.tsx` | Maxfiylik siyosati | Statik | **Ishlaydi** | **HA** |
| `frontend/src/app/privacy/page.tsx` | Maxfiylik (inglizcha/ruscha nusxa) | Statik | **Ishlaydi** | **HA** |
| `frontend/src/app/terms/page.tsx` | Shartlar (inglizcha nusxa) | Statik | **Ishlaydi** | **HA** |
| `frontend/src/app/admin/panel/page.tsx` | Admin boshqaruv paneli | `/api/admin/*` | **To'liq ishlaydi** | **HA (Admin)** |

---

## 4. Botlar Solishtiruvi

Loyihada **2 ta alohida Telegram bot** arxitekturasi mavjud:

### 1. Fermer / Mijoz Boti (`@agrozai_bot`):
* **Token o'zgaruvchisi:** `FARMER_BOT_TOKEN` (yoki zaxira: `TELEGRAM_BOT_TOKEN`).
* **Buyruqlar:** `/start` (xush kelibsiz, ro'yxatdan o'tish, telefon ulashish tugmasi), `/help` (yordam), `/obhavo` (hududiy ob-havo), `/profil` (profil ma'lumotlari).
* **Menyu tugmasi (Menu button):** AgrozGO Web App ochuvchi tugma (`setAgrozGoMenuButton`).
* **Vazifasi:** Fermerga buyurtma kvitansiyasi yuborish, OTP kodini yetkazish, buyurtma va chaqiruv holatlari haqida xabar berish.

### 2. Hamkor / Mutaxassis va Do'kon Boti (`@agroz_auth_bot`):
* **Token o'zgaruvchisi:** `PARTNER_BOT_TOKEN` (yoki zaxira: `TELEGRAM_AUTH_BOT_TOKEN`).
* **Buyruqlar:** `/start` (hamkor sifatida ro'yxatdan o'tish: mutaxassis yoki do'kon egasi tanlash), `/buyurtmalar` (do'kon buyurtmalarini boshqarish), `/chaqiruvlar` (mutaxassis chaqiruvlari), `/dorilarim` (dori kiritish va tahrirlash), `/kabinet` (Web App kabinetini ochish).
* **Vazifasi:** Mutaxassis va dorixona arizalarini qabul qilish, chaqiruv va bronlar bo'yicha bildirishnomalar yuborish.

### Bot Xavfsizligi va Holatlari:
* **Webhook `secret_token` tekshiruvi:**
  * `backend/src/routes/telegram.ts:523-540`: `telegramWebhookSecret()` va `telegramAuthWebhookSecret()` orqali `x-telegram-bot-api-secret-token` solishtiriladi.
  * `backend/src/routes/bot.ts:1485-1507`: `farmerWebhookSecret()` va `partnerWebhookSecret()` orqali tekshiriladi.
* **Callback query egalik tekshiruvi (Ownership check):**
  * Buyurtmalar uchun: `backend/src/routes/bot.ts:982-992`: bosgan odamning `specialists.telegramId` si buyurtmaning `pharmacySpecialistId` siga mos kelishi qat'iy tekshiriladi.
* **403 (Bot bloklanganda) ishlash mexanizmi:**
  * `backend/src/lib/bot-sender.ts:65, 121`: Agar foydalanuvchi yoki mutaxassis botni bloklagan bo'lsa (HTTP 403), `users.botBlocked = true` va `specialists.botBlocked = true` qilinadi.
* **Bot xabarlaridagi "dori/dorixona" so'zlari:**
  * `backend/src/lib/auth-bot-flow.ts` da "dorixona", "dorilarim", "Vet dorixona", "Agro dorixona", "dori rasmi" so'zlari hali ham keng qo'llanilmoqda.

---

## 5. P0 Holati (Nazorat Ro'yxati)

| Tekshiruv Bandi | Holat | Dalil (Fayl va qator) | Xulosa |
| :--- | :--- | :--- | :--- |
| **GeoLocationBlocker bormi?** | **BAJARILMAGAN** | `frontend/src/` da blocker topilmadi | Ruxsat berilmasa dastur qotib qolmaydi, Toshkent koordinatasiga o'tadi. |
| **comingSoonModal bormi?** | **BAJARILMAGAN** | `frontend/src/` da `comingSoonModal` topilmadi | Keraksiz modal yo'q. |
| **Savatda "Onlayn to'lov: Tez orada" bormi?** | **BAJARILMAGAN** | `frontend/src/components/CartDrawer.tsx` | Savatda to'lov haqida chalg'ituvchi yozuvlar yo'q. |
| **"UZ" tugmasi bormi?** | **BAJARILMAGAN** | `frontend/src/` da til tugmasi topilmadi | Dastur to'liq o'zbek tilida, soxta til tugmasi yo'q. |
| **`href="#"` banner bormi?** | **BAJARILGAN** | `frontend/src/` da `href="#"` 0 ta topildi | Barcha havolalar haqiqiy sahifalarga ulanadi. |
| **`devOtpEnabled` va `DEMO_OTP` xavfsizligi** | **BAJARILGAN** | `backend/src/routes/auth.ts:25-37` | `devOtpEnabled()` prod da har doim `false`. `DEMO_OTP` hardcoded emas (faqat env). |
| **OTP Rate Limit bormi?** | **BAJARILGAN** | `backend/src/routes/auth-rate-limits.ts:5-27`<br>`backend/src/routes/auth.ts:79-86` | IP va telefon bo'yicha daqiqalik va soatlik cheklovlar bor. |
| **`/api/diagnose` ochiqmi? (`AI_DIAGNOSE_ENABLED` bormi?)** | **BAJARILMAGAN** | `backend/src/server.ts:131`<br>`backend/src/routes/diagnose.ts` | Endpoint ochiq, `AI_DIAGNOSE_ENABLED` bayrog'i yo'q. |
| **`delivery_enabled` bayrog'i bormi?** | **BAJARILGAN** | `frontend/src/components/CartDrawer.tsx:3`<br>`backend/src/routes/orders.ts:66` | Frontendda `DELIVERY_ENABLED = false` qilib yashirilgan. |
| **iOS `App.entitlements` mavjudmi?** | **BAJARILGAN** | `mobile/ios/App/App/App.entitlements:5-6` | `aps-environment: production` mavjud. |
| **AndroidManifest va Info.plist da CAMERA bormi?** | **BAJARILGAN** (Mavjud) | `mobile/android/app/src/main/AndroidManifest.xml:43`<br>`mobile/ios/App/App/Info.plist:55` | Ruxsatlar kiritilgan. Ammo Info.plist da "AI tashxis uchun" deb yozilgan. |
| **`app.set("trust proxy")` to'g'rimi?** | **QISMAN** | `backend/src/server.ts:43` (`trust proxy: 1`) | Railway uchun to'g'ri, lekin Vercel orqali kelganda 2 ta hop sababli Vercel IP olinishi mumkin. |
| **CORS sozlamalari** | **QISMAN** | `backend/src/server.ts:85` (`*.vercel.app`) | Barcha `*.vercel.app` larga ruxsat berilgan (juda keng). `capacitor://localhost` esa URL tekshiruvi orqali o'tadi. |
| **`/health` DB o'chganda 503 qaytaradimi?** | **BAJARILMAGAN** | `backend/src/routes/health.ts:16-23` | Baza uzilsa ham HTTP 200 qaytaradi (`database: "disconnected"`). |
| **Cron dublikat push himoyasi bormi?** | **BAJARILMAGAN** | `backend/src/cron.ts:35-52` | `users.isWeatherPushEnabled` ga sana belgilanmaydi, server qayta tushsa takroriy push ketishi mumkin. |

---

## 6. Sinov Natijalari

### 1. `npm run typecheck:all`
* **Natija:** **MUVAFFAQIYATLI (Exit code 0)**.
* Frontend, Admin va Backend loyihalarida birorta ham TypeScript xatoligi yo'q.

### 2. `npm run build`
* **Natija:** **MUVAFFAQIYATLI (Exit code 0)**.
  * Frontend: Next.js 16.2.6 (15 ta sahifa statik, dinamik sahifalar muvaffaqiyatli yig'ildi).
  * Admin: Next.js 16.2.6 (barcha sahifalar muvaffaqiyatli yig'ildi).
  * Backend: TypeScript (`tsc`) muvaffaqiyatli translyatsiya qilindi.

### 3. `npm run lint`
* **Natija:** **XATOLIK (Exit code 1)**.
* Topilgan: 1 ta xato, 13 ta ogohlantirish.
  * Xato: `frontend/src/app/admin/panel/page.tsx:3045:11` — `react/jsx-no-comment-textnodes: Comments inside children section of tag should be placed inside braces`.

### 4. Testlar (`node backend/tests/*.js`)
* `backend/tests/bot.test.js`: 7 ta test o'tdi (HMAC tekshiruvi, muddati o'tgan initData, secret token, bot ajratish).
* `backend/tests/release.test.js`: 2 ta test o'tdi (devOtpEnabled, rate limit).

### 5. Jonli API Tekshiruvi (Production Railway Backend — `curl`)
* `GET /api/health` -> **HTTP 200 OK** (`{"status":"ok","database":"connected"}`)
* `GET /api/medicines?limit=2` -> **HTTP 200 OK** (Haqiqiy dorilar ro'yxati qaytdi)
* `GET /api/specialists?role=specialist&limit=2` -> **HTTP 200 OK** (Mutaxassislar qaytdi)
* `GET /api/weather?lat=41.3111&lng=69.2797` -> **HTTP 200 OK** (Open-Meteo ob-havo ma'lumotlari qaytdi)

---

## 7. Xulosa

### "Hozir Foydalanuvchi Nima Qila Oladi" (10 qatorda):
1. Dasturga kirganda avtomatik o'z hududining jonli ob-havosi va agro-tavsiyalarini ko'radi.
2. 7 kunlik to'liq ob-havo va ekinlarni dori purkashga qulaylik darajasini bilib oladi.
3. Katalogdan o'z hududiga yaqin agro-do'konlarning mavjud dorilarini ko'radi va narxlarini solishtiradi.
4. Bitta agro-do'konni tanlab, uning dorilarini savatga yig'adi.
5. Savatdan "Do'kondan olib ketish" sharti bilan bir bosishda rasmiy bron yaratadi.
6. Bron yaratilgach, do'kon egasining Telegramiga buyurtma boradi, do'kon qabul qilganda xaridorga Telegram kvitansiya keladi.
7. O'ziga yaqin 2 ta veterinar va 2 ta agronomni ko'radi va ularning reytingi bilan tanishadi.
8. Mutaxassis chaqirish formasini to'ldirib, o'z muammosi va manzilini yuboradi.
9. Mutaxassis chaqiruvni qabul qilganda uning aloqa ma'lumotlari va tasdig'ini oladi.
10. O'z profilidan avvalgi buyurtma va chaqiruvlarini ko'ra oladi, do'konlarni baholay oladi va xohlasa hisobini to'liq o'chiradi.

---

### v1.0 Maqsadiga Nisbatan Holat Jadvali

| TAYYOR (To'liq ishlamoqda) | TUZATISH KERAK (Kichik kamchilik) | YASHIRISH / O'CHIRISH KERAK | YO'Q (Hozircha mavjud emas) |
| :--- | :--- | :--- | :--- |
| Do'kon dorilarini ko'rish va qidirish | `npm run lint` dagi 1 ta xato (admin panel) | Backenddagi `/api/diagnose` endpointini yopish yoki bayroq qo'yish | Foydalanuvchi o'z bronini bekor qilishi |
| Savat va do'kondan bron qilib olib ketish | `/health` endpointi baza uzilganda 503 qaytarishi | `Info.plist` dagi "AI tashxis uchun kamera" matnini to'g'rilash | Ob-havo sahifasida viloyatni qo'lda tanlash |
| Do'konga Telegram xabar va boshqaruv | Cron dagi ob-havo push takrorlanish himoyasi | Bot matnlaridagi "dorixona" so'zlarini "agro-do'kon" ga almashtirish | Profil ekranida 07:00 ob-havo pushini o'chirish switchi |
| Mutaxassis chaqirish (Ism, telefon, muammo) | Vercel rewrite orqali kelganda IP rate limit moslashuvi | — | Mutaxassis javob bermasa chaqiruvning avtomatik bekor bo'lishi |
| Mutaxassisga Telegram xabar va qabul/rad | — | — | Do'kon bronni tasdiqlaganda mobil push (hozir faqat TG bor) |
| 7 kunlik ob-havo va agronomik tavsiyalar | — | — | — |
| Profil va hisobni to'liq o'chirish (Apple) | — | — | — |
| Do'kon egasining `/kabinet` dashboardi | — | — | — |

---

### Do'konga Chiqishga (App Store / Play Market) To'sqinlik Qiluvchi Eng Muhim 10 Muammo (Muhimlik Tartibida):

1. **`Info.plist` da "AI tashxis" zikr etilgani (`mobile/ios/App/App/Info.plist:56`):**
   Apple tekshiruvchisi kamerani ochganda yoki ruxsat matnida "AI tashxis" ni ko'rsa, lekin ilovada AI tashxis bo'lmasa, **Guideline 2.3.1 (Misleading Content / Feature missing)** bo'yicha darhol rad etadi. Matnni "agro-do'kon va mahsulotlar uchun" deb o'zgartirish shart.
2. **Backendda `/api/diagnose` ochiq va ruxsatsiz turgani (`backend/src/routes/diagnose.ts`):**
   Frontendda yashirilgan bo'lsa-da, backendda `AI_DIAGNOSE_ENABLED` bayrog'i yo'q. Istalgan tashqi so'rov bilan AI xizmati chaqirilib resurs sarflanishi mumkin.
3. **Mijoz tomonidan bronni bekor qilish imkoni yo'qligi (`backend/src/routes/orders.ts`):**
   Mijoz adashib bron qilib qo'ysa, uni o'zi bekor qila olmaydi. Faqat do'kon egasi bekor qilishi yoki 24 soat kutish kerak.
4. **Mutaxassis chaqiruvida vaqt tugashi (timeout) va eslatma yo'qligi (`backend/src/routes/specialists.ts`):**
   Mutaxassis Telegramga qaramasa yoki botni ochmasa, chaqiruv `status = 'yangi'` holatida cheksiz qolib ketadi.
5. **07:00 Ob-havo bildirishnomasini o'chirish tugmasi yo'qligi (`frontend/src/components/ProfileEdit.tsx`):**
   Apple Guideline 5.1.1 bo'yicha foydalanuvchi ilovadan keladigan davriy bildirishnomalarni profilidan o'chirish imkoniga ega bo'lishi shart.
6. **Lint xatosi tufayli CI/CD yiqilishi (`frontend/src/app/admin/panel/page.tsx:3045`):**
   `npm run lint` 1 ta sintaktik xato sababli 1 kodi bilan tugamoqda. GitHub Actions yoki CI avtomatlashtirilgan bo'lsa, PR merge to'xtaydi.
7. **`/health` endpointi doim 200 qaytarishi (`backend/src/routes/health.ts:20`):**
   Baza ulanishi uzilgan taqdirda ham HTTP 200 qaytadi, Railway yoki Uptime monitor serverni tirik deb o'ylab qayta yuklamaydi.
8. **Vercel orqali kelgan so'rovlarda umumiy IP bo'lib qolish xavfi (`backend/src/server.ts:43`):**
   `trust proxy: 1` Vercel proxy zanjirida barcha mijozlarni bitta IP ga aylantirib, 20 ta so'rovdan so'ng rate limit bloki keltirib chiqarishi mumkin.
9. **CORS da barcha `*.vercel.app` larga ruxsat berilgani (`backend/src/server.ts:85`):**
   Istalgan begona Vercel foydalanuvchisi o'z saytidan `credentials: true` bilan API ga so'rov yuborishi mumkin.
10. **Bot xabarlarida "dorixona/dori" so'zlari ishlatilayotgani (`backend/src/lib/auth-bot-flow.ts`):**
    O'zbekiston qonunchiligi va tibbiy dorixonalar bilan chalkashmaslik uchun rasmiy brendingda "agro-do'kon" va "o'simlik himoya vositalari" atamasiga to'liq o'tish lozim.
