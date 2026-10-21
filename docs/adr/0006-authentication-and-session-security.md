# ADR 0006: Autentifikatsiya, Telegram Bog'lash, Refresh Token Aylantirish va Super Admin 2FA

## Kontekst
AgrozGO / BiznesGO platformasida merchantlar (dorixona egalari va sotuvchilar) mobil qurilmadan kirishadi. Super adminlar esa tizimning global boshqaruviga ega. Xavfsizlik, sessiya boshqaruvi va hisob o'g'irlanishining oldini olish uchun quyidagi talablar belgilandi:
1. Telefon raqam (E.164 formati) orqali yagona identifikatsiya.
2. OTP kanallari abstraksiyasi (`OtpChannel`) - Telegram, SMS va mahalliy testlar uchun Console kanali.
3. Telegram hisobini bog'lashda anti-spoofing tekshiruvi: faqat `contact.user_id === from.id` va bir martalik hashlangan bog'lash tokeni orqali.
4. Qisqa muddatli Access Token (JWT, 15 daqiqa) va bazada faqat SHA-256 xesh ko'rinishida saqlanadigan Refresh Token (30 kun).
5. Refresh Token aylantirish (Rotation) va takroriy foydalanishni aniqlash (Token Reuse Detection) - agar allaqachon ishlatilgan/aylantirilgan token qayta yuborilsa, foydalanuvchining barcha sessiyalari xavfsizlik yuzasidan zudlik bilan bekor qilinadi.
6. Super adminlar uchun alohida `/v1/admin/auth/*` marshrutlari, majburiy 2FA TOTP (Google Authenticator) va 8 ta bir martalik xeshlangan zaxira kodlari (recovery codes).
7. Xavfsizlik auditi: Audit jurnallariga hech qachon parol, OTP kodi yoki token qiymatlari yozilmaydi.

## Qaror

### 1. OtpChannel Abstraksiyasi
- `OtpChannel` interfeysi orqali `TelegramOtpChannel`, `SmsOtpChannel` va `ConsoleOtpChannel` birlashtirildi.
- Mahalliy `development` va `test` rejimida kod konsolga chiqariladi, `production` rejimida esa faqat xavfsiz Telegram bot yoki SMS orqali yuboriladi.
- Agar foydalanuvchining Telegrami ulanmagan bo'lsa, tizim `TELEGRAM_NOT_LINKED` aniq xato kodi va botga yo'naltiruvchi deep link qaytaradi.
- Raqam mavjudligini oshkor qilmaslik (anti-enumeration) uchun muvaffaqiyatli so'rovlar har doim bir xil javob matnini qaytaradi.
- Cheklovlar: Har bir raqam uchun soatiga 5 ta so'rov, har bir IP uchun 10 daqiqada 10 ta so'rov; 5 ta xato tasdiqlashdan so'ng 15 daqiqa bloklanish.

### 2. Telegram Bog'lash Oqimi
- Sayt `POST /v1/auth/telegram/link-token` orqali 15 daqiqalik bir martalik token yaratadi. Token bazada SHA-256 xesh qilib saqlanadi.
- Bot `/start <token>` qabul qilib, foydalanuvchidan `request_contact` tugmasi orqali kontakt so'raydi.
- Bot kelgan kontaktda `contact.user_id === from.id` ekanligini qat'iy tekshiradi. Qo'lda yozilgan yoki uzatilgan (forwarded) kontaktlar qat'iyan rad etiladi.
- Kontakt raqami saytdan yaratilgan tokendagi raqamga mos kelsa, foydalanuvchiga `telegram_id` bog'lanadi va token `is_used = true` qilinadi.

### 3. Sessiya Xavfsizligi va Refresh Token Rotation
- `refresh_tokens` jadvali: `id` (UUID), `user_id` (UUID), `token_hash` (SHA-256 xesh, unique), `revoked` (boolean), `expires_at`, `ip_address`, `user_agent`.
- `POST /v1/auth/refresh`: Har bir yangilashda eski token `revoked = true` qilinadi va yangi juftlik beriladi.
- Agar `revoked === true` bo'lgan token qayta yuborilsa, xakerlik yoki o'g'irlanish deb baholanib, ushbu `user_id` ga tegishli barcha refresh tokenlar bir zumda bekor qilinadi (`revoked = true`) va xavfsizlik auditi yoziladi.
- `POST /v1/auth/logout`: berilgan refresh token bekor qilinadi.

### 4. Super Admin Majburiy 2FA va Recovery Kodlar
- Super admin kirishi uchun alohida endpointlar:
  - `POST /v1/admin/auth/login` (email/telefon + parol -> vaqtinchalik 2FA setup/verify tokeni)
  - `POST /v1/admin/auth/setup-2fa` (birinchi marta TOTP QR-kodni skanerlash va tasdiqlash)
  - `POST /v1/admin/auth/verify-2fa` (6 xonali TOTP yoki 8 belgili bir martalik tiklash kodi)
- Tiklash kodlari (`admin_recovery_codes`) bir martalik bo'lib, bazada SHA-256 xesh ko'rinishida saqlanadi. Ishlatilgan zahoti `is_used = true, used_at = now()` belgilanadi.
- 2FA yoqilmaguncha admin hisobiga to'liq kirish tokeni berilmaydi.

## Natijalar
- Tizim xavfsizligi yuqori darajaga yetkazildi, hisoblarni egallab olish xavfi (account takeover) minimal darajaga tushirildi.
- Merchantlar uchun Telegram orqali oddiy va qulay kirish ta'minlandi.
- Barcha amallar `audit_logs` ga toza, nozik ma'lumotlarsiz qayd etiladi.
