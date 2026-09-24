# Agroz AI — Versiya 1.0 (Joriy Holat)

Agroz AI — bu qishloq xo'jaligi (agronomiya) va chorvachilik (veterinariya) sohalarida fermerlar, chorvadorlar hamda oddiy aholiga tezkor yordam, dori-darmonlar va mutaxassislar xizmatini taqdim etuvchi zamonaviy platforma.

Loyiha to'liq ishchi (Production-ready) holatda bo'lib, o'zida quyidagi funksiyalarni jamlagan:

## 1. Mijozlar uchun (Frontend - Web/Telegram Mini App)

*   **Avtomatik Avtorizatsiya (Telegram):** Foydalanuvchilar Telegram Mini App orqali kirganlarida raqamlari va ismlari avtomatik olinib, ro'yxatdan o'tkaziladi.
*   **AI Tashxis (Sun'iy Intellekt):** Ekinlardagi yoki hayvonlardagi kasalliklarni aniqlash bo'yicha sun'iy intellekt (Gemini / Llama / Qwen) bilan suhbat.
*   **Dorilar bozori (Marketplace):** 
    *   Foydalanuvchilar kerakli dori vositalarini qidirishlari, toifalarga (agro, vet) ajratib ko'rishlari mumkin.
    *   Dorilarni savatga qo'shish va buyurtma berish (Olib ketish yoki Yetkazib berish opsiyalari bilan).
    *   Buyurtma holatini telefon raqami orqali kuzatish (Track order).
*   **Interaktiv Xarita (Yaqin dorixonalar):** 
    *   Foydalanuvchining GPS lokatsiyasi orqali 5-15 km radiusdagi eng yaqin agro va vet dorixonalarini xaritada ko'rsatish.
    *   Xaritada maxsus markerlar orqali dorixonalarga yo'nalish olish yoki to'g'ridan-to'g'ri qo'ng'iroq qilish.
*   **Mutaxassislarni chaqirish:** 
    *   Yaqin atrofdagi agronom va veterinarlarni izlash.
    *   Mutaxassisning reytingi (yulduzlari), tajribasi va ish vaqti bilan tanishish.
    *   Platforma orqali mutaxassisga to'g'ridan-to'g'ri "Chaqiruv" yuborish.

## 2. Mutaxassislar va Dorixona egalari uchun (Telegram Auth Bot)

Mutaxassislar va dorixona egalari uchun maxsus `@agroz_auth_bot` ishga tushirilgan:
*   **Oson ro'yxatdan o'tish:** Bot orqali telefon raqam, ism, mutaxassislik (agronom, veterinar, umumiy), tajriba va manzil (GPS lokatsiya yuborish orqali) kiritiladi.
*   **Dorilarni boshqarish (Faqat dorixonalar uchun):** Bot orqali dorixona egalari o'z dorilarini rasmga olib, narxi va qoldig'i bilan bazaga qo'shishlari yoki tahrirlashlari mumkin.
*   **Buyurtma va Chaqiruvlarni qabul qilish:** 
    *   Mijoz mutaxassisni chaqirganda, bot darhol xabar va tasdiqlash/rad etish tugmalarini yuboradi.
    *   Mijoz dorixonadan buyurtma qilganda ham botga tushadi.

## 3. Administrator uchun (Admin Panel)

Saytning `/admin/panel` bo'limi orqali to'liq boshqaruv mavjud:
*   **Boshqaruv paneli:** Xavfsiz login tizimi (`x-admin-session`).
*   **Foydalanuvchilar bazasi:** Barcha ro'yxatdan o'tgan foydalanuvchilar ro'yxati va ularning statistikasi.
*   **Buyurtmalar monitoringi:** Platforma orqali qilingan barcha dori buyurtmalarini ko'rish.
*   **Sozlamalar va Konfiguratsiya:** 
    *   AI modellarini almashtirish (Gemini, Groq, OpenRouter).
    *   Qidiruv va xarita radiuslarini (km) o'zgartirish.
    *   SMS va Telegram Tokenlarni to'g'ridan-to'g'ri saytning o'zidan yangilash (qayta yuklamasdan).

## 4. Arxitektura va Texnologiyalar

*   **Frontend:** Next.js 14/15 (App Router), React, Tailwind CSS, Lucide Icons, Leaflet (Xarita).
*   **Backend:** Express.js (TypeScript), REST API.
*   **Database:** PostgreSQL (Neon DB), Drizzle ORM.
*   **Integratsiyalar:** Telegram Bot API (Webhook), Eskiz.uz (SMS OTP).
*   **Xavfsizlik:** SQL Injection'dan himoyalangan ORM tizimi, Cookie/Session bazasidagi avtorizatsiya va CORS sozlamalari.
