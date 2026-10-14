# AGROZ LOYIHASI HOLATI BO'YICHA YAKUNIY AUDIT HISOBOTI
**Sana:** 2026-10-14  
**Audit turi:** Qat'iy o'qish rejimidagi texnik tekshiruv (Hech qanday kod o'zgartirilmadi)  
**Holat:** Haqiqiy dalillar, fayl yo'llari va qator raqamlari asosida tuzildi. Maxfiy qiymatlar kiritilmadi.

---

## 1. GIT VA REPOZITORIY HOLATI

* **Joriy branch:** `main`
* **Git status:** Ishchi daraxt toza (`working tree clean`). Barcha so'nggi dizayn, i18n va veb-sahifalar `main` branchiga commit qilingan.
* **Mavjud barcha branchlar:**
  * `adventurous-profit` (`main` dan 202 commit orqada, 0 oldinda)
  * `feat/product-card-unify` (`main` dan 43 commit orqada, 0 oldinda)
  * `fix/v1-polish` (`main` dan 176 commit orqada, 0 oldinda)
  * `* main` (joriy asosiy branch)
  * `release/v1.0` (`main` dan 176 commit orqada, 0 oldinda)
  * `rune-digestion` (`main` dan 160 commit orqada, 0 oldinda)
* **Oxirgi 15 ta commit (`git log -n 15 --oneline`):**
  1. `f0dc1b6` - chore(web): stage complete Agroton web design, 6-language i18n, and subpage layouts
  2. `236cbfb` - fix: normalize phone numbers to E.164 (+998...) across cart, call modals and auth
  3. `779963e` - fix: replace non-existent AppRoute.specialists with AppRoute.services
  4. `e1434c4` - fix: update tests and mock data for recent catalog and theme changes
  5. `e1e21b0` - fix: update tests for recent screen refactors
  6. `84860b7` - fix: use distinct names for local phone/organization controllers
  7. `b2fbde5` - fix: complete all field controller bindings and remove dead controllers
  8. `1a4e578` - fix: complete all profile controller bindings and remove dead controllers
  9. `bdf3b55` - fix: remove unused controllers and fix dead state assignments
  10. `a1d82ea` - fix: fix remaining build errors in agrozgo_app
  11. `2e16bb4` - fix: fix compile errors in agrozgo_app lib and tests
  12. `d182522` - fix: correct import in home_screen_test.dart
  13. `a980db6` - chore: remove mobile folder from git tracking per rule A.2
  14. `2f7413d` - fix: resolve all 14 flutter analyze issues
  15. `11fc83d` - test: update mock data in home_screen_test to match real tokens
* **Main bilan farq:** Joriy branchning o'zi `main`, hech qanday qoralamasiz commitlar mavjud emas. Remote origin sozlanmagan (`git remote` bo'sh).

---

## 2. REPOZITORIY TUZILMASI VA PAPKALAR VAZIFASI

| Papka yo'li | Asosiy vazifasi | Holati | Izoh / Dalil |
|---|---|---|---|
| `frontend/` | Next.js 16 (App Router) iste'molchilar portali va web landing | **Faol / Ishlaydi** | Bosh sahifa, bozor, mutaxassislar, ob-havo, blog, hamkorlik sahifalarini o'z ichiga oladi. `npm run build:frontend` muvaffaqiyatli o'tadi. |
| `business/` | Next.js 16 do'konlar va dorixonalar kabineti hamda qarz daftari | **Faol / Ishlaydi** | Hamkorlar o'z mahsulotlarini boshqarishi va qarz daftari yuritishi uchun alohida veb-portal. |
| `admin/` | Next.js boshqaruv paneli | **Faol** | Super-admin va moderatorlar uchun boshqaruv tizimi (`admin.agroz.uz`). |
| `backend/` | Node.js + Express (TypeScript), Drizzle ORM, Telegram botlar, REST API | **Faol / Ishlaydi** | Barcha biznes logika, auth, ob-havo, buyurtmalar va push xabarnomalar uchun yagona backend server (`backend/src/server.ts`). |
| `agrozgo_app/` | Flutter asosidagi kross-platforma mobil ilova (Android va iOS) | **Faol / Ishlaydi** | Asosiy mobil ilova kodi. Riverpod, GoRouter, Dio/Http arxitekturasida yozilgan. |
| `mobile/` | Capacitor asosidagi avvalgi mobil loyiha | **Ishlatilmaydi / O'chirilgan** | `a980db6` commitida o'chirilgan va `.gitignore` ga qo'shilgan. Diskda mavjud emas, lekin `package.json:14-15` dagi monorepo `workspaces` ro'yxatida nomi qolgan. |
| `apps/app/` | Vite + React asosidagi sinov mini-ilovasi | **Eskirgan** | Faol ishlab chiqishda emas, unifikatsiya qilinmagan. |
| `packages/core/` | Ichki umumiy TypeScript yordamchi kutubxonasi | **Faol emas / Minimal** | Monorepo yordamchi paketi, hozirda deyarli ishlatilmaydi. |

---

## 3. AGROZGO_APP (FLUTTER ILovasi) CHUQUR AUDITI

* **Framework va versiya:** Flutter (Dart SDK `>=3.7.0 <4.0.0` — `agrozgo_app/pubspec.yaml:21-22`). Tizimdagi Flutter versiyasi: `3.38.5`.
* **App ID / Package Name / Bundle Identifier:**
  * Android Application ID: `uz.agrozgo.agrozgo_app` (`agrozgo_app/android/app/build.gradle.kts:9`).
  * Android Flavors:
    * `user`: `uz.agrozgo.app` (`agrozgo_app/android/app/build.gradle.kts:24`)
    * `business`: `uz.agrozgo.business` (`agrozgo_app/android/app/build.gradle.kts:29`)
  * iOS Bundle Identifier:
    * `user`: `uz.agrozgo.app` (`agrozgo_app/ios/Runner.xcodeproj/project.pbxproj:581`)
    * `business`: `uz.agrozgo.business` (`agrozgo_app/ios/Runner.xcodeproj/project.pbxproj:597`)
* **Versiya raqamlari:**
  * Version: `1.0.0+1` (`agrozgo_app/pubspec.yaml:4`)
  * `versionName`: `1.0.0`, `versionCode`: `1`.
* **minSdk / targetSdk:**
  * `minSdk`: Flutter standart `flutter.minSdkVersion` (`agrozgo_app/android/app/build.gradle.kts:37`).
  * `targetSdk`: Flutter standart `flutter.targetSdkVersion` (`agrozgo_app/android/app/build.gradle.kts:38`).
  * `compileSdk`: Flutter standart `flutter.compileSdkVersion` (`agrozgo_app/android/app/build.gradle.kts:34`).
* **Ekranlar va ular chaqiradigan API endpointlar:**
  1. `HomeScreen` (`lib/features/home/screens/home_screen.dart`):
     * `GET /api/weather?lat=...&lng=...` (ob-havo ma'lumotlari)
     * `GET /api/advertisements` (banner va aksiyalar)
     * `GET /api/specialists` (tavsiya etilayotgan mutaxassislar)
     * `GET /api/medicines` (mashhur preparatlar)
  2. `MarketScreen` (`lib/features/medicines/screens/market_screen.dart`):
     * `GET /api/medicines` (kategoriya, filtr va qidiruv bo'yicha)
     * `GET /api/pharmacies` (dorixonalar ro'yxati)
  3. `MedicineDetailScreen` (`lib/features/medicines/screens/medicine_detail_screen.dart`):
     * `GET /api/medicines/:id`
  4. `SpecialistsScreen` (`lib/features/specialists/screens/specialists_screen.dart`):
     * `GET /api/specialists` (filtr va qidiruv)
  5. `SpecialistCallModal` (`lib/features/specialists/widgets/specialist_call_modal.dart`):
     * `POST /api/specialists/call` (mutaxassis chaqirish)
  6. `CartScreen` & `CartCheckoutModal` (`lib/features/cart/screens/cart_screen.dart`):
     * `POST /api/orders` (bron/buyurtma yuborish)
     * `GET /api/orders/delivery-config` (yetkazish narxlari)
  7. `ProfileScreen` & Auth oqimi (`lib/features/profile/screens/profile_screen.dart`):
     * `POST /api/auth/request-code` (SMS/Telegram kod so'rash)
     * `POST /api/auth/verify-code` (Kodni tasdiqlash)
     * `GET /api/profile` (Profil ma'lumotlari)
     * `PUT /api/profile` (Profilni tahrirlash)
     * `GET /api/orders/track` (Buyurtmalar tarixi)
  8. `WeatherScreen` (`lib/features/weather/screens/weather_screen.dart`):
     * `GET https://api.open-meteo.com/v1/forecast` yoki `GET /api/weather`
  9. `NotificationsScreen` (`lib/features/notifications/screens/notifications_screen.dart`):
     * `GET /api/notifications`
  10. `AiChatScreen` (`lib/features/ai/screens/ai_chat_screen.dart`):
     * `POST /api/diagnose`
* **Autentifikatsiya (Auth) oqimi:**
  * Telefon raqami orqali SMS / Telegram OTP orqali kiriladi (`AuthProvider` — `agrozgo_app/lib/features/auth/providers/auth_provider.dart:136-240`).
  * Sessiya tokeni `flutter_secure_storage` orqali saqlanadi (`SecureStorageService` — `agrozgo_app/lib/core/services/secure_storage_service.dart:18-29`).
* **Push xabarnomalar (FCM / APNs) holati:**
  * `agrozgo_app/pubspec.yaml` da `firebase_messaging` yoki `flutter_local_notifications` paketi mavjud emas.
  * Backendda Firebase Admin SDK bor (`backend/src/lib/push.ts`), biroq Flutter ilovasida FCM mijoz sozlamalari **TOPILMADI**.
* **Kamera va Joylashuv ruxsatlari:**
  * **Joylashuv (Location):**
    * Android: `ACCESS_FINE_LOCATION` va `ACCESS_COARSE_LOCATION` mavjud (`agrozgo_app/android/app/src/main/AndroidManifest.xml:2-3`).
    * iOS: `NSLocationWhenInUseUsageDescription` va `NSLocationAlwaysAndWhenInUseUsageDescription` to'g'ri o'zbekcha matn bilan mavjud (`agrozgo_app/ios/Runner/Info.plist:72-75`).
  * **Kamera (Camera):**
    * Android: `android.permission.CAMERA` ruxsati **TOPILMADI**.
    * iOS: `NSCameraUsageDescription` va `NSPhotoLibraryUsageDescription` **TOPILMADI** (`agrozgo_app/ios/Runner/Info.plist`).
* **API manzili (Production yoki Localhost?):**
  * `AppConfig` da API URL quyidagicha olingan (`agrozgo_app/lib/core/config/app_config.dart:36`):
    `apiUrl = const String.fromEnvironment('API_URL', defaultValue: '')`
  * Agar build qilishda `--dart-define=API_URL=https://agroz.uz` ko'rsatilmasa, bo'sh satr bo'lib qoladi va ilova har qanday so'rovda `ApiException: API_URL topilmadi` xatosini otadi (`agrozgo_app/lib/core/network/api_client.dart:38`).
* **Build holati (Haqiqiy buyruqlar va natijalar):**
  * **iOS Build:** `flutter build ios --no-codesign --flavor user -t lib/main.dart --dart-define=API_URL=https://agroz.uz`
    * Natija: **MUVAFFAQIYATLI**. Chiqqan fayl: `✓ Built build/ios/iphoneos/Runner.app (19.4MB)`.
  * **Android Build:** `flutter build apk --flavor user -t lib/main.dart`
    * Natija: **XATO**. Sababi: Mazkur ishlab chiqish mashinasida `ANDROID_HOME` muhit o'zgaruvchisi topilmadi (`No Android SDK found. Try setting the ANDROID_HOME environment variable`).
* **Testlar holati (`flutter test`):**
  * Jami testlar: 35 ta
  * Natija: **34 ta o'tdi, 1 ta yiqildi**.
  * Yiqilgan test: `agrozgo_app/test/features/notifications/notifications_screen_test.dart:19` (`Found 0 widgets with text "HOZIRGI HOLAT"`).
* **Ikonka va Splash Screen:**
  * Ikonka: `agrozgo_app/assets/icons/app_icon.png` mavjud, `flutter_launcher_icons` orqali sozlangan (`agrozgo_app/pubspec.yaml:63-71`).
  * Splash Screen: `SplashScreen` vidjeti mavjud (`agrozgo_app/lib/features/splash/screens/splash_screen.dart:22`).
* **Signing (Imzolash) holati:**
  * Android Release rejimida ham debug kalit ishlatilmoqda: `signingConfig = signingConfigs.getByName("debug")` (`agrozgo_app/android/app/build.gradle.kts:48`). Production keystore ulanmagan.
* **Firebase fayllari:**
  * `agrozgo_app/android/app/google-services.json` — **TOPILMADI**.
  * `agrozgo_app/ios/Runner/GoogleService-Info.plist` — **TOPILMADI**.
* **iOS Entitlements:**
  * `agrozgo_app/ios/Runner/Runner.entitlements` — **TOPILMADI**.

### Veb, agrozgo_app va mobile/ (Capacitor) imkoniyatlar farqi:

| Funksiya | Veb (`frontend/`) | agrozgo_app (Flutter) | mobile/ (Capacitor) |
|---|---|---|---|
| Agro-Bozor va Dorilar | To'liq ishlaydi, filtr va qidiruv bor | To'liq ishlaydi, zamonaviy UI | O'chirilgan (mavjud emas) |
| Savat va Bron qilish | To'liq ishlaydi | To'liq ishlaydi | O'chirilgan (mavjud emas) |
| Mutaxassis chaqirish | To'liq ishlaydi | To'liq ishlaydi | O'chirilgan (mavjud emas) |
| Ob-havo va Tavsiyalar | To'liq ishlaydi | To'liq ishlaydi (lokal va API) | O'chirilgan (mavjud emas) |
| AI Diagnostika | Rasm va matn bilan ishlaydi | UI tayyor, API integratsiyasi qisman | O'chirilgan (mavjud emas) |
| SMS / Telegram Auth | Ishlaydi | Ishlaydi (SecureStorage bilan) | O'chirilgan (mavjud emas) |
| Push Notifications | Yo'q | **Yo'q (FCM ulanmagan)** | O'chirilgan (mavjud emas) |
| Do'kon kabineti (Business) | Alohida `business/` ilovasida bor | `business` flavori bor, ammo kod bazasi asosan iste'molchi uchun | O'chirilgan (mavjud emas) |

---

## 4. MOBIL/ (CAPACITOR) VA AGROZGO_APP SOLISHTIRUVI

* **Diskdagi mavjudligi:** `mobile/` papkasi diskda mavjud emas (`git status` va `ls mobile` tekshirildi — katalog `a980db6` commitida repozitoriydan olib tashlangan).
* **Qaysi biri to'liqroq va do'konga tayyorroq?**
  * `agrozgo_app` (Flutter) 100% ustun va yagona amaldagi mobil yechim. Unda barcha zamonaviy Flutter vidjetlari, offline kesh, Riverpod state management va iOS native build imkoniyati mavjud.
  * Capacitor papkasi esa to'liq eskirgan va yopilgan loyiha hisoblanadi.
* **App ID masalasi:**
  * Flutter ilovasi `uz.agrozgo.app` (user) va `uz.agrozgo.business` (business) App ID laridan foydalanadi (`agrozgo_app/android/app/build.gradle.kts:24,29`).

---

## 5. v1.0 UCHUN 3 TA ASOSIY FUNKSIYA HAR IKKALA ILOVADA ISHLAYDIMI?

### 1. Bron / Buyurtma berish (Cart & Order)
* **Veb (`frontend/`):**
  * `frontend/src/components/CartDrawer.tsx:530-545` -> `POST /api/orders` ga mijoz ismi, telefon raqami va manzili bilan yuboradi.
  * Backend `backend/src/routes/orders.ts:26-170` buyurtmani qabul qilib, `orders` va `orderItems` jadvallariga yozadi. Telegram bot orqali dorixonaga xabar beradi.
  * *Ishlamaydigan / Kamchilik joyi:* Buyurtma bergandan so'ng mijoz o'z buyurtmasini bekor qila olmaydi (`backend/src/routes/orders.ts` da mijoz uchun cancel endpointi mavjud emas).
* **Flutter (`agrozgo_app`):**
  * `CartCheckoutModal` (`lib/features/cart/widgets/cart_checkout_modal.dart:150-180`) -> `OrdersRepository.createOrder` -> `POST /api/orders`.
  * *Ishlamaydigan / Kamchilik joyi:* Build paytida `--dart-define=API_URL=...` berilmasa, so'rov darhol to'xtaydi. Shuningdek, push xabarnoma ulanmagani sababli buyurtma holati o'zgarganda ekranga bildirishnoma kelmaydi.

### 2. Mutaxassis chaqirish (Specialist Call)
* **Veb (`frontend/`):**
  * `frontend/src/components/SpecialistCallModal.tsx:200-240` -> `POST /api/specialists/call`.
  * Backend `backend/src/routes/specialists.ts:28-115` chaqiruvni `specialistCalls` jadvaliga `status = 'yangi'` qilib yozadi va mutaxassisning Telegramiga jo'natadi.
  * *Ishlamaydigan / Kamchilik joyi:* Chaqiruv uchun avtomatik taymaut (timeout) yo'q. Agar mutaxassis javob bermasa, chaqiruv noma'lum muddatga "yangi" bo'lib qolib ketadi.
* **Flutter (`agrozgo_app`):**
  * `SpecialistCallModal` (`lib/features/specialists/widgets/specialist_call_modal.dart:230-260`) -> `POST /api/specialists/call`.
  * *Ishlamaydigan / Kamchilik joyi:* Foydalanuvchiga mutaxassis javob qaytarganda telefoniga push bildirishnoma kelmaydi (chunki FCM yo'q).

### 3. Ob-havo va Agro-tavsiyalar (Weather & Agro-advice)
* **Veb (`frontend/`):**
  * `frontend/src/components/WeatherWidget.tsx` va `frontend/src/app/ob-havo/page.tsx` -> `GET /api/weather?lat=...&lng=...`.
  * Backend Open-Meteo API dan harorat, namlik, shamol va 7 kunlik prognozni olib, agrotexnik tavsiyalar bilan qaytaradi.
  * *Holati:* **To'liq ishlaydi.**
* **Flutter (`agrozgo_app`):**
  * `WeatherScreen` (`lib/features/weather/screens/weather_screen.dart`) va `WeatherService` (`lib/features/weather/services/weather_service.dart:16-55`).
  * Koordinatalarni `geolocator` orqali oladi (ruxsat berilmasa Toshkent koordinatasiga o'tadi) va Open-Meteo / `/api/weather` dan to'liq ma'lumotlarni yuklaydi.
  * *Holati:* **To'liq ishlaydi.**

---

## 6. OLDINGI P0 RO'YXATI HOLATI (20 TA PUNKT)

| # | Tekshiruv punkti | Holat | Dalil (Fayl va qator) | Izoh |
|---|---|---|---|---|
| 1 | **GeoLocationBlocker** | **BAJARILGAN** | `frontend/src/components/GeoLocationBlocker.tsx` diskda mavjud emas | Avvalgi App Store blokeri butunlay o'chirilgan, chet eldagi tekshiruvchilar bloklanmaydi. |
| 2 | **comingSoon / "Tez kunda"** | **BAJARILMAGAN** | `frontend/src/components/coming-soon/DesktopComingSoon.tsx:41`, `business/src/components/PhoneTelegramPrompt.tsx:21` | "TEZ KUNDA" yozuvi va coming-soon modali kod ichida hali ham qolgan. |
| 3 | **href="#" bo'sh havolalar** | **BAJARILGAN** | `frontend/src/` va `business/src/` bo'yicha qidiruv | Bo'sh `href="#"` topilmadi, faqat `#tariffs` ankor havolalari mavjud (`BusinessLanding.tsx:246`). |
| 4 | **Shablon statistika / "№1"** | **BAJARILMAGAN** | `frontend/src/lib/i18n.ts:110,114`, `frontend/src/app/hamkorlik/page.tsx:247` | `badge1_title: "№1"`, `badge3_title: "№1"` va "minglab dehqon" da'volari mavjud. |
| 5 | **Fallback telefon raqamlar** | **BAJARILMAGAN** | `agrozgo_app/lib/features/home/providers/home_providers.dart:41`, `frontend/src/components/HomeClientView.tsx:210` | `+998901234567` va `+998 71 200 00 00` kabi soxta/namuna raqamlar fallback sifatida qoldirilgan. |
| 6 | **Shaxsiy t.me havolalari** | **BAJARILMAGAN** | `frontend/src/components/coming-soon/DesktopComingSoon.tsx:163`, `business/src/components/coming-soon/DesktopComingSoon.tsx:143` | `https://t.me/bydsgn` shaxsiy Telegram akkaunti havolasi mavjud. |
| 7 | **devOtp / DEMO_OTP ajratilishi** | **BAJARILGAN** | `backend/src/routes/auth.ts:34-37`, `backend/src/routes/auth.ts:89-92` | `NODE_ENV === "production"` da `devOtp` qat'iy o'chirilgan. Reviewer uchun `DEMO_OTP` va `DEMO_PHONE` alohida xavfsiz ajratilgan. |
| 8 | **OTP rate limit** | **BAJARILGAN** | `backend/src/routes/auth.ts:71,80`, `backend/src/routes/auth-rate-limits.ts:18` | IP va telefon raqam bo'yicha qat'iy rate limit o'rnatilgan (daqiqasiga 3 ta). |
| 9 | **/api/diagnose bayrog'i** | **BAJARILGAN** | `backend/src/routes/diagnose.ts:15-50`, `backend/src/lib/ai.ts:296-302` | Anonim foydalanuvchilar uchun soatiga 5 ta limit bor va AI ishlamay qolganda `offlineDiagnose` ga o'tadi. |
| 10 | **register-intent rate limit** | **BAJARILMAGAN** | `backend/src/routes/bot.ts:1809` | `/api/bot/partner/register-intent` endpointida hech qanday rate limiter middleware qo'yilmagan. |
| 11 | **Rozilik checkbox (Consent)** | **BAJARILMAGAN** | `frontend/src/app/kirish/page.tsx`, `frontend/src/app/hamkorlik/page.tsx:520` | `hamkorlik` sahifasida bor, lekin asosiy `kirish/page.tsx` ro'yxatdan o'tish formasida shartlarga rozilik checkboxi yo'q. |
| 12 | **robots.txt va sitemap.xml** | **BAJARILMAGAN** | `frontend/public/` va `frontend/src/app/` | `robots.txt` yoki `sitemap.xml` (yoki `sitemap.ts`) fayllari mavjud emas (**TOPILMADI**). |
| 13 | **Security headerlar** | **BAJARILMAGAN** | `frontend/next.config.ts:8-20` | `X-Content-Type-Options` bor, lekin `HSTS` (Strict-Transport-Security) va `CSP` (Content-Security-Policy) kiritilmagan (**TOPILMADI**). |
| 14 | **/health 503 qaytarishi** | **BAJARILMAGAN** | `backend/src/routes/health.ts:16-22` | Baza uzilganda ham (`dbOk === false`) HTTP 200 `{ status: "ok", database: "disconnected" }` qaytaradi, 503 bermaydi. |
| 15 | **CORS konfiguratsiyasi** | **BAJARILGAN** | `backend/src/server.ts:48-128` | Wildcard (`*`) yo'q, domenlar aniq oq ro'yxat (whitelist) va regex asosida tekshiriladi. |
| 16 | **Cron dublikati** | **BAJARILMAGAN** | `backend/src/cron.ts:35-52`, `backend/src/server.ts:197-213` | 07:00 dagi ob-havo xabari bir vaqtning o'zida ham `cron.ts` da, ham `server.ts` dagi `setInterval` da chaqiriladi (dublikat). |
| 17 | **iOS entitlements** | **BAJARILMAGAN** | `agrozgo_app/ios/Runner/Runner.entitlements` | Fayl mavjud emas (**TOPILMADI**), Associated Domains yoki Push bildirishnoma sozlanmagan. |
| 18 | **Kamera ruxsati matni** | **BAJARILMAGAN** | `agrozgo_app/ios/Runner/Info.plist:1-77` | `NSCameraUsageDescription` va `NSPhotoLibraryUsageDescription` **TOPILMADI**. App Store ruxsatsiz rad etadi. |
| 19 | **Mijoz bronni bekor qilishi** | **BAJARILMAGAN** | `backend/src/routes/orders.ts:16-300` | Mijoz uchun `POST /api/orders/:id/cancel` endpointi mavjud emas. |
| 20 | **Chaqiruv taymauti** | **BAJARILMAGAN** | `backend/src/routes/specialists.ts`, `backend/src/cron.ts` | Javob berilmagan mutaxassis chaqiruvlari avtomatik bekor bo'lish yoki taymaut mexanizmiga ega emas. |

---

## 7. ATROF-MUHIT O'ZGARUVCHILARI (ENV), TASHQI XIZMATLAR VA DEPLOY

### Muhit o'zgaruvchilari (Faqat nomlari, maxfiylik qat'iy saqlangan holda):
* **Autentifikatsiya va Xavfsizlik:** `ADMIN_PASSWORD`, `ADMIN_USERNAME`, `COOKIE_SECURE`, `ENCRYPTION_KEY`, `HASH_KEY`, `JWT_SECRET`, `OTP_DEV_MODE`, `DEMO_OTP`, `DEMO_PHONE`.
* **Ma'lumotlar bazasi:** `DATABASE_URL`, `PGPOOL_MAX`, `PGSSL`.
* **Telegram Botlari va Webhooklar:** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_AUTH_BOT_TOKEN`, `TELEGRAM_AUTH_BOT_USERNAME`, `TELEGRAM_AUTH_WEBHOOK_SECRET`, `FARMER_BOT_TOKEN`, `FARMER_BOT_USERNAME`, `FARMER_WEBHOOK_SECRET`, `PARTNER_BOT_TOKEN`, `PARTNER_BOT_USERNAME`, `PARTNER_WEBHOOK_SECRET`, `PARTNER_MINIAPP_URL`, `ALLOW_UNVERIFIED_TELEGRAM`, `NEXT_PUBLIC_TELEGRAM_AUTH_BOT_USERNAME`.
* **Sun'iy intellekt (AI):** `GEMINI_API_KEY`, `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `AI_MODEL`, `ASR_MODEL`.
* **SMS Gateway:** `ESKIZ_EMAIL`, `ESKIZ_PASSWORD`, `ESKIZ_FROM`.
* **Push Notifications:** `FIREBASE_SERVICE_ACCOUNT`.
* **Tarmoq va Domenlar:** `PORT`, `CORS_ORIGIN`, `ALLOWED_ORIGINS`, `WEB_APP_URL`, `APP_STORE_URL`, `GOOGLE_PLAY_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`.
* **Tizim va Seed:** `SEED_DEMO_DATA`.

### Tashqi xizmatlar (Integratsiyalar):
1. **Neon PostgreSQL:** Asosiy serverless ma'lumotlar bazasi (`backend/src/db/index.ts`).
2. **Google Gemini API (@google/genai):** AI diagnostika va transkripsiya (`backend/src/lib/ai.ts:1`).
3. **Eskiz.uz SMS Provayderi:** Foydalanuvchilarga SMS orqali OTP yuborish (`backend/src/lib/sms.ts`).
4. **Telegram Bot API:** 3 ta alohida bot: Asosiy bot, Avtorizatsiya boti va Hamkorlar boti (`backend/src/lib/telegram-bot.ts`).
5. **Open-Meteo Weather API:** Ob-havo ma'lumotlarini bepul olish uchun (`agrozgo_app/lib/features/weather/services/weather_service.dart:18`).
6. **Firebase Cloud Messaging:** Backend kutubxonasi mavjud (`backend/src/lib/push.ts`), ammo mobil ilova ulanmagan.

### Deploy holati:
* **Vercel:** Frontend (`agroz.uz`), Business (`business.agroz.uz`) va Admin (`admin.agroz.uz`) panellari joylashgan. Mintaqa: Frankfurt (`fra1`) yoki Vashington (`iad1`).
* **Railway:** Backend container xizmati (`agroz-ai-backend-production.up.railway.app`, `frontend/next.config.ts:40`).
* **Neon:** Managed PostgreSQL ma'lumotlar bazasi.

---

## 8. STATIK TAHLIL, BUILD VA TEST NATIJALARI

| Tekshiruv turi | Buyruq | Haqiqiy natija | Xatolar soni |
|---|---|---|---|
| **TypeScript (Frontend)** | `npm run typecheck:frontend` | **Muvaffaqiyatli** | 0 xato |
| **TypeScript (Business)** | `npm run typecheck:business` | **Muvaffaqiyatli** | 0 xato |
| **TypeScript (Backend)** | `npm run typecheck:backend` | **Muvaffaqiyatli** | 0 xato |
| **TypeScript (Admin)** | `npm run typecheck:admin` | **Muvaffaqiyatli** | 0 xato |
| **Veb Build (Frontend)** | `npm run build:frontend` | **Muvaffaqiyatli** (19/19 routes compiled) | 0 xato |
| **Veb Build (Business)** | `npm run build:business` | **Muvaffaqiyatli** | 0 xato |
| **Flutter Analyze** | `flutter analyze` | **Muvaffaqiyatli** (`No issues found!`) | 0 xato |
| **Flutter Build (iOS)** | `flutter build ios --no-codesign` | **Muvaffaqiyatli** (`Runner.app 19.4MB`) | 0 xato |
| **Flutter Build (Android)** | `flutter build apk` | **Xatolik** (`ANDROID_HOME` topilmadi) | 1 bloklovchi |
| **Flutter Testlar** | `flutter test` | **34 ta o'tdi, 1 ta yiqildi** | 1 ta test xatosi (`notifications_screen_test.dart`) |
| **Backend Testlar** | `node --test backend/tests/*.js` | **9 ta o'tdi, 0 ta yiqildi** | 0 xato (IPv6 keyGenerator bo'yicha ogohlantirishlar bor) |
| **Linter (Frontend)** | `npm run lint --workspace=frontend` | **Xatolik** | **6 ta xato, 27 ta ogohlantirish** (`react-hooks/rules-of-hooks` kabinet/page.tsx:1108 da, va `no-html-link-for-pages`) |

---

## 9. DO'KONGA (APP STORE / GOOGLE PLAY) CHIQISHGA TO'SQINLIK QILADIGAN TOP-10 MUAMMO VA MINIMAL ISH RO'YXATI

### Eng muhim 10 ta to'sqinlik (Muhimlik tartibida):

1. 🔴 **iOS Kamera va Galereya ruxsati matni yo'qligi (`agrozgo_app/ios/Runner/Info.plist`):**
   * *Sabab:* `NSCameraUsageDescription` va `NSPhotoLibraryUsageDescription` kiritilmagan. App Store tekshiruvida ilova birinchi kiritishdayoq 100% rad etiladi (Guideline 5.1.1).
2. 🔴 **Android Release Signing Debug kalitga sozlanganligi (`android/app/build.gradle.kts:48`):**
   * *Sabab:* `signingConfig = signingConfigs.getByName("debug")`. Google Play Console debug kalit bilan imzolangan APK yoki AAB ni qabul qilmaydi.
3. 🔴 **FCM / APNs Push xabarnomalari mobil ilovada yo'qligi:**
   * *Sabab:* `google-services.json`, `GoogleService-Info.plist` va `Runner.entitlements` yo'q. Foydalanuvchi buyurtmasi tasdiqlanganda unga xabar bormaydi.
4. 🔴 **API_URL muhit o'zgaruvchisi default bo'shligi (`agrozgo_app/lib/core/config/app_config.dart:36`):**
   * *Sabab:* Agar do'kon uchun CI/CD yoki build vaqtida `--dart-define=API_URL=https://agroz.uz` unutilsa, ilova foydalanuvchida oq ekran / crash beradi.
5. 🔴 **Flutter testdagi nosozlik (`notifications_screen_test.dart:19`):**
   * *Sabab:* `HOZIRGI HOLAT` matni ekranda topilmadi deb test yiqilmoqda, CI/CD pipeline to'xtaydi.
6. 🟡 **Hardcoded fallback telefon raqamlar (`home_providers.dart:41`, `HomeClientView.tsx:210`):**
   * *Sabab:* Profil yoki do'kon telefon raqami topilmasa `+998901234567` yoki `+998 71 200 00 00` ko'rsatilmoqda.
7. 🟡 **Do'kon tekshiruvchisiga ro'yxatdan o'tishda rozilik bildirish (Terms/Privacy) yo'qligi:**
   * *Sabab:* `frontend/src/app/kirish/page.tsx` da shartlarga rozilik checkboxi yo'q.
8. 🟡 **Shaxsiy Telegram havolasi qolib ketganligi (`DesktopComingSoon.tsx:163`):**
   * *Sabab:* `t.me/bydsgn` havolasi rasmiy qo'llab-quvvatlash (`@agroz_support`) o'rnida turibdi.
9. 🟡 **Mijoz tomonidan buyurtmani bekor qilish imkoni yo'qligi:**
   * *Sabab:* Foydalanuvchi adashib yuborgan bronini ilovadan turib bekor qila olmaydi.
10. 🟡 **Eslatmalar va ob-havo yuboruvchi cron dublikati (`backend/src/cron.ts:35` va `server.ts:197`):**
    * *Sabab:* Bir vaqtning o'zida ikkita har xil interval 07:00 da ob-havo tarqatadi.

---

### "2-3 ta funksiya bilan do'konga chiqarish" (MVP Release) uchun minimal ish ro'yxati:

* [ ] **1-qadam (Ruxsatlar va Plist):** `agrozgo_app/ios/Runner/Info.plist` ga `NSCameraUsageDescription` va `NSPhotoLibraryUsageDescription` qo'shish; AndroidManifest'ga `CAMERA` ruxsatini qo'shish.
* [ ] **2-qadam (Android Signing):** `android/app/build.gradle.kts` da release keystore sozlash va Google Play uchun AAB build qilish.
* [ ] **3-qadam (API_URL fallback):** `agrozgo_app/lib/core/config/app_config.dart` dagi `defaultValue` ni to'g'ridan-to'g'ri `https://agroz.uz` qilish (xavfsiz default).
* [ ] **4-qadam (Testni to'g'rilash):** `agrozgo_app/test/features/notifications/notifications_screen_test.dart` dagi qidiruv lokatorini haqiqiy matnga moslash (barcha 35 ta test yashil bo'lishi uchun).
* [ ] **5-qadam (Reviewer akkaunti):** App Store va Google Play reviewerlar uchun `backend/.env` da `DEMO_PHONE` va `DEMO_OTP` (masalan, `+998900000000` / `123456`) kiritilganligini va do'kon anketasiga yozilganligini tekshirish.

