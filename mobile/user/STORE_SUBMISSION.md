# 🏪 Google Play Console va Apple App Store-ga Joylash Yo'riqnomasi

Ushbu qo'llanma **AgrozGO** ilovasini Google Play Store (Android) va Apple App Store (iOS) do'konlariga to'liq va xatolarsiz joylashtirish bo'yicha batafsil qo'llanmadir.

---

## 📱 Ilova parametrlari:
- **Ilova nomi:** `AgrozGO`
- **Paket ID / Bundle Identifier:** `uz.agrozgo.app`
- **Asosiy server (Live Sync):** `https://agroz.uz`
- **Maxfiylik siyosati (Privacy Policy URL):** `https://agroz.uz/privacy` yoki `https://agroz.uz/maxfiylik`
- **Foydalanish shartlari (Terms of Service URL):** `https://agroz.uz/terms` yoki `https://agroz.uz/shartlar`
- **Dvigatel:** Capacitor 7 + Native Android (Gradle/Java) + Native iOS (Swift/SPM)
- **Target Android SDK:** API 35 (Android 15) — Google Play eng so'nggi talabi
- **Kategoriya:** Qishloq xo'jaligi va hosildorlik / Business / Productivity

---

## 1. 🤖 GOOGLE PLAY STORE (ANDROID)

### 1.1. Firebase sozlash (Push Notifications uchun)
1. [Firebase Console](https://console.firebase.google.com)-ga kiring va loyihangizni tanlang (yoki yarating).
2. Yangi Android ilova qo'shing: Package name: `uz.agrozgo.app`.
3. `google-services.json` faylini yuklab oling va quyidagi manzilga joylashtiring:
   `mobile/android/app/google-services.json`
   *(Ushbu fayl maxfiy bo'lib, .gitignore ga kiritilgan).*
4. Backend uchun xizmat hisobi (Service Account) kalitini oling:
   - Firebase Console -> **Project Settings** -> **Service accounts** -> **Generate new private key**.
   - Yuklangan JSON fayl mazmunini serveringizdagi `.env` faylidagi `FIREBASE_SERVICE_ACCOUNT` ga yozing.

---

### 1.2. Imzolash kalitini (Release Keystore) yaratish
Terminal orqali quyidagi buyruqni bajaring:

```bash
cd mobile/android/app
keytool -genkey -v -keystore agroz-release-key.jks -alias agroz-key-alias -keyalg RSA -keysize 2048 -validity 10000
```
*(Parolni eslab qoling va xavfsiz joyda saqlang! `*.jks` fayli .gitignore ga kiritilgan).*

---

### 1.3. Google Play uchun AAB (.aab) faylini yig'ish

#### 1-usul: Buyruq orqali (Tavsiya etiladi)
Environment o'zgaruvchilari bilan imzolash yoki Android Studio orqali:
```bash
KEYSTORE_PATH="mobile/android/app/agroz-release-key.jks" \
KEYSTORE_PASSWORD="parolingiz" \
KEY_ALIAS="agroz-key-alias" \
KEY_PASSWORD="parolingiz" \
npm run mobile:bundle:android
```
Yig'ilgan fayl manzili:
`mobile/android/app/build/outputs/bundle/release/app-release.aab`

#### 2-usul: Android Studio orqali
1. Android Studio-ni ochish:
   ```bash
   npm run mobile:android
   ```
2. Yuqori menyudan: **Build** -> **Generate Signed Bundle / APK...**
3. **Android App Bundle** ni tanlang va **Next** bosing.
4. Yuqorida yaratilgan `agroz-release-key.jks` faylini va parolini kiriting.
5. **release** variantini tanlab, **Create** bosing.

---

### 1.4. Google Play Console-ga yuklash bosqichlari:
1. [Google Play Console](https://play.google.com/console)-ga kiring va **Create app** bosing.
2. **App details:**
   - App name: `AgrozGO`
   - Default language: `Uzbek (uz)`
   - App or game: `App`
   - Free or paid: `Free`
3. **App content (Ilova kontenti va ruxsatnomalar):**
   - **Privacy Policy URL:** `https://agroz.uz/privacy`
   - **App access (Do'kon tekshiruvchisi uchun):** "All or some functionality is restricted" ni tanlang va **Add instructions**:
     - *Username / Phone:* `+998901234567` (yoki serveringizdagi `DEMO_PHONE`)
     - *Password / OTP:* `123456` (serveringizdagi `DEMO_OTP`)
     - *Explanation:* "Test account for store review. No SMS required. Test orders are pre-loaded."
   - **Ads:** Ilovada reklama yo'q ("No, my app does not contain ads").
   - **Target age:** 18 va undan katta.
   - **Data Safety:** `mobile/DATA_SAFETY.md` faylidagi tayyor jadval bo'yicha to'ldiring.
4. **Store presence (Do'konda ko'rinishi):**
   - Qisqa tavsif: *"AgrozGO - agro va veterinariya mahsulotlari, kasalliklar tashxisi va agrometeorologik tavsiyalar"*
   - To'liq tavsif: O'simlik kasalliklarini AI orqali aniqlash, yaqin atrofdagi agro-dorixonalar, agro va veterinariya mahsulotlarini buyurtma qilish, hududiy ob-havo ma'lumotlari va agrometeorologik tavsiyalar hamda mutaxassis maslahatlari.
   - **App Icon:** 512x512 PNG (`mobile/www/icon-512.png`).
   - **Feature Graphic:** 1024x500 PNG.
   - **Screenshots:** Telefon ekranidan olingan kamida 2-4 ta skrinshot.
5. **Production:**
   - **Releases** bo'limiga kiring -> **Create new release**.
   - `app-release.aab` faylini yuklang.
   - **Review and roll out** bosing.

---

## 2. 🍎 APPLE APP STORE (iOS)

### 2.1. Apple App Store qat'iy talablari (Barchasi to'liq moslashtirilgan):
1. **Account Deletion (Hisobni to'liq o'chirish — Guideline 5.1.1(v)):**  
   ✅ Profil sahifasida **"Hisobni butunlay o'chirish"** qizil tugmasi mavjud. `DELETE /api/profile` va `DELETE /api/auth/delete-account` orqali foydalanuvchining sessiyalari, push tokenlari, AI tashxis tarixi va xabarlari butunlay tozalanadi.
2. **Do'kon tekshiruvchisi (Reviewer Demo Account):**  
   ✅ Serverdagi `DEMO_PHONE` va `DEMO_OTP` orqali SMS jo'natilmasdan avtomatik kirish va namuna buyurtmalarni tekshirish oqimi sozlangan.
3. **Do'kon siyosati va Tibbiy/Veterinariya ogohlantirishlari:**  
   ✅ AI natijalari ostida doimiy ogohlantirish: *"Bu dastlabki maslahat, aniq tashxis emas. Muhim holatda mutaxassisga murojaat qiling."*  
   ✅ Barcha dori vositalari faqat *"agro va veterinariya mahsulotlari"* sifatida ko'rsatilgan (inson preparatlari bilan adashtirmaslik uchun).
4. **Info.plist Ruxsatnoma izohlari:**  
   ✅ `mobile/ios/App/App/Info.plist` ichida har bir ruxsat uchun batafsil tushuntirish kiritildi:
   - `NSCameraUsageDescription`: *"AgrozGO ekin va o'simlik kasalliklari hamda zararkunandalarni AI orqali tahlil qilish uchun kameradan foydalanadi."*
   - `NSLocationWhenInUseUsageDescription`: *"AgrozGO yaqin atrofdagi agro-dorixonalar, mutaxassislar va hududiy agrometeorologik ob-havo tavsiyalarini taqdim etish uchun joylashuvingizdan foydalanadi."*
   - `NSPhotoLibraryUsageDescription`: *"AgrozGO o'simlik barglari va kasalliklarining fotosuratlarini tahlil qilish uchun galereyadan foydalanadi."*

---

### 2.2. iOS Push Notifications va APNs sozlash:
1. **Apple Developer Portal:**
   - [developer.apple.com](https://developer.apple.com) ga kiring -> **Certificates, Identifiers & Profiles** -> **Keys**.
   - Yangi kalit qo'shing (+), **Apple Push Notifications service (APNs)** ni belgilang.
   - `.p8` faylini yuklab oling (Key ID va Team ID ni yozib oling).
2. **Firebase Cloud Messaging sozlash:**
   - Firebase Console -> **Project Settings** -> **Cloud Messaging** -> **Apple app configuration**.
   - `.p8` APNs kalitini, Key ID va Team ID ni yuklang.
3. **Xcode loyihasida Capability qo'shish:**
   - Xcode oynasida: `App` target -> **Signing & Capabilities** -> **+ Capability**.
   - **Push Notifications** ni tanlang va qo'shing.
   - **Background Modes** ni qo'shing va **Remote notifications** ga belgi qo'ying.

---

### 2.3. Xcode orqali yig'ish va yuklash:
1. Terminalda Xcode loyihasini oching:
   ```bash
   npm run mobile:ios
   ```
2. Xcode oynasida chap tomondagi **App** loyihasini bosing.
3. **Signing & Capabilities** tabiga o'ting:
   - **Automatically manage signing** ga qushcha qo'ying.
   - **Team:** Apple Developer hisobingizni tanlang.
   - **Bundle Identifier:** `uz.agrozgo.app`.
4. Yuqori qurilmalar ro'yxatidan **Any iOS Device (arm64)** ni tanlang.
5. Menyu bo'limidan: **Product** -> **Archive** bosing.
6. Yig'ilish tugagach, **Organizer** oynasi ochiladi -> **Distribute App** -> **App Store Connect** -> **Upload**.

---

### 2.4. App Store Connect-da nashr qilish:
1. [App Store Connect](https://appstoreconnect.apple.com)-ga kiring -> **Apps** -> **+**.
2. Bundle ID: `uz.agrozgo.app`.
3. **App Review Information (Reviewer uchun kirish):**
   - **Sign-in required:** qushcha qo'ying.
   - **Username:** `+998901234567` (serverdagi `DEMO_PHONE`).
   - **Password:** `123456` (serverdagi `DEMO_OTP`).
   - **Notes:** *"This is an agro and veterinary platform for farmers. Reviewer account has sample orders and diagnoses pre-configured. No SMS OTP is dispatched for this number."*
4. Yuklangan Build versiyasini (1.0.0) tanlang.
5. **Submit for Review** tugmasini bosing.

---

## 3. 🔄 Jonli Yangilanishlar (Hosted Mode) Afzalligi
Mobil ilova to'g'ridan-to'g'ri `https://agroz.uz` bilan jonli ishlaydi:
- Saytga yoki backendga kiritilgan yangi o'zgarishlar (yangi dorixona mahsulotlari, ob-havo kartochkasi dizayni, yangi AI funksiyalari) **do'kon tekshiruvini kutmasdan** bir zumda barcha foydalanuvchilar ekranida aks etadi.
- Play Store va App Store esa faqat yangi native plaginlar yoki native permissions o'zgarganda yangi versiya build qilishni talab qiladi.
