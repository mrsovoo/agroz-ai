# Agroz AI — Qishloq xo'jaligi va chorvachilikning yagona aqlli ekotizimi

## 1. Loyiha haqida umumiy ma'lumot va missiya

**Agroz AI** — zamonaviy sun'iy intellekt texnologiyalari (Gemini AI, kompyuter ko'rishi), geolokatsiya va avtomatlashtirilgan Telegram botlar orqali O'zbekiston qishloq xo'jaligi hamda chorvachilik sohasini raqamlashtiruvchi kompleks milliy platformadir.

### Asosiy missiya:
Fermer, dehqon va tomorqa egalarining hosili hamda chorvasini kasallik va zararkunandalardan tezkorlik bilan asrab qolish, yo'qotishlarni minimallashtirish, agrar sohadagi mahsulot va mutaxassislar bozorini shaffof, qulay va yagona zanjirga birlashtirish.

---

## 2. Loyiha kimlar uchun xizmat ko'rsatadi?

Agroz AI tizimi 4 ta asosiy foydalanuvchilar qatlami (ishtirokchisi) o'rtasida uzluksiz integratsiyani ta'minlaydi:

### 1. Fermerlar, Dehqonlar va Chorvadorlar (Aholi va buyurtmachilar)
* **Muammo:** O'simlik yoki chorva kutilmaganda kasallanganda uni nimaligini aniqlash qiyinligi, qaysi dori to'g'ri kelishini bilmaslik, qishloq joylarda malakali agronom yoki veterinarni topishdagi qiyinchiliklar.
* **Agroz AI beradigan imkoniyatlar:**
  - Kasallangan ekin yoki hayvonni suratga olib yuborish orqali bir necha soniyada **sun'iy intellekt (AI) tashxisi** va davolash retsptini olish.
  - O'z hududi (geolokatsiyasi) bo'yicha eng yaqin agro/veterinariya dorixonalarini ko'rish.
  - Kerakli dorini to'g'ridan-to'g'ri buyurtma qilish va manzilgacha yetkazib berish xizmatidan foydalanish.
  - Yaqin atrofdagi tajribali agronom yoki veterinarni to'g'ridan-to'g'ri dalaga yoki xonadonga chaqirish.
  - Doimiy ravishda ob-havo, qurg'oqchilik, zararkunandalar to'lqini haqida shaxsiy ogohlantirishlar olish.

### 2. Agro va Veterinariya Dorixonalari (Sotuvchilar)
* **Muammo:** Mahsulotlarni faqat jismoniy do'konga kelgan mijozlargagina sota olish, mijozlar bazasining torligi, yetkazib berish xizmatining yo'qligi.
* **Agroz AI beradigan imkoniyatlar:**
  - O'z dorixona profili va preparatlar katalogini platformaga joylash.
  - O'ziga biriktirilgan radiusdagi barcha fermer va aholidan tushayotgan buyurtmalarni **Telegram Auth boti** orqali bir zumda qabul qilish.
  - Sotuv hajmini keskin oshirish va mijozlar bilan to'g'ridan-to'g'ri aloqa o'rnatish.

### 3. Agronomlar va Veterinarlar (Mutaxassislar)
* **Muammo:** Mustaqil ishlovchi malakali agronom va veterinarlarning o'z xizmatlarini keng auditoriyaga yetkaza olmasligi, doimiy mijozlar yetishmovchiligi.
* **Agroz AI beradigan imkoniyatlar:**
  - Platformada rasmiy mutaxassis sifatida ro'yxatdan o'tish (malaka, tajriba, yo'nalish).
  - Fermerlardan kelib tushgan joyiga chiqish (chaqiruv) so'rovlarini **Telegram Auth boti** orqali qabul qilish yoki rad etish.
  - Chaqiruvda buyurtmachining aniq lokatsiyasi, masofasi (km) va muammo tavsifini oldindan ko'rish.
  - Xizmat ko'rsatish davrida platformada "Band" holatida ko'rinish va o'z ish jadvalini qulay boshqarish.

### 4. Agroz AI Kompaniyasi (Super Admin va Nazorat)
* **Imkoniyatlar:**
  - O'zbekistonning **14 ta viloyat va hududi** bo'yicha agrar tahlil (foydalanuvchilar soni, dorixonalar, mutaxassislar faolligi, savdo va chaqiruvlar).
  - Tizimdagi dorixonalar dori vositalari qoldig'i va mutaxassislar bandligi/reytingi auditi.
  - Global platforma sozlamalarini kodsiz boshqarish: qidiruv radiuslari (dorixona, mutaxassis, buyurtma chegaralari), yetkazib berish narxlari (bepul minimal buyurtma soni, har bir km uchun to'lov stavkalari).

---

## 3. Tizim qanday ishlaydi? (Texnologik zanjir)

```
[ Fermer / Foydalanuvchi ]
     │ (Web App / Telegram Mini App)
     ├───> 1. AI Tashxis (Rasm yuborish -> Gemini AI tahlili -> Tavsiya)
     ├───> 2. Dorixona & Mahsulotlar (Yaqin dorixonani topish -> Savat -> Buyurtma)
     └───> 3. Mutaxassis chaqirish (Muammo tavsifi -> Chaqiruv yuborish)
                   │
                   ▼
       [ Telegram Botlar Ekotizimi ]
         ├── @agrozai_bot (Fermerga statuslar, yangiliklar va bildirishnomalar)
         └── @agroz_auth_bot (Dorixona va Mutaxassislarga buyurtmalar/chaqiruvlar)
                   │
                   ▼
     [ Mutaxassis / Dorixona harakati ]
       (Qabul qilindi -> Fermerga tezkor xabar -> Ijro)
                   │
                   ▼
       [ Super Admin Monitoring ]
       (14 viloyat tahlili, sozlamalar, sifat nazorati)
```

### Bosqichma-bosqich jarayon:

1. **AI Diagnostika:**
   Fermer kasallangan o'simlik bargi, mevasi yoki kasal hayvon suratini tizimga yuklaydi. Sun'iy intellekt bir necha soniyada kasallik turi, uning sababi va davolash uchun tavsiya etiladigan preparatlar ro'yxatini shakllantiradi.

2. **Dori xarid qilish va yetkazib berish:**
   Tavsiya etilgan yoki qidirilgan dori yaqin atrofdagi dorixonalar katalogidan tanlanadi. Foydalanuvchi manzilini kiritadi. Agar buyurtma sozlamalardagi limitdan oshsa yetkazib berish bepul, aks holda har bir km uchun belgilangan tarif bo'yicha hisoblanadi. Buyurtma dorixonaning Telegram botiga kelib tushadi.

3. **Mutaxassisni dalaga chaqirish:**
   Agar masofadan davolashning imkoni bo'lmasa, fermer yaqin atrofdagi bo'sh agronom yoki veterinarga chaqiruv yuboradi. Foydalanuvchi ekranida *"Mutaxassis javobi kutilmoqda"* statusi turadi. Mutaxassis `@agroz_auth_bot` orqali chaqiruvni ko'radi (masofasi, muammo sababi) va **«Qabul qilish»** tugmasini bosadi. Tizimda mutaxassis darhol "Band" maqomiga o'tadi, fermerga esa `@agrozai_bot` orqali *"Mutaxassis chaqiruvni qabul qildi, tez orada siz bilan bog'lanadi"* xabari boradi.

4. **Kompaniya monitoringi:**
   Super admin panel barcha buyurtmalar va chaqiruvlar jarayonini mustaqil audit qiladi. Hech qanday ma'lumot yashirin qolmaydi, hududlardagi talab va taklif doimiy tahlil qilib boriladi.

---

## 4. Foydalanilayotgan texnologiyalar

* **Frontend:** Next.js 14 (App Router), React, TailwindCSS, Lucide Icons, Telegram WebApp SDK, PWA (mobil moslashuv).
* **Super Admin:** Next.js 14, TailwindCSS, zamonaviy minimalistik yorug' (light) dizayn, real-vaqt tahlili.
* **Backend:** Node.js, Express, TypeScript, Drizzle ORM, PostgreSQL.
* **Sun'iy Intellekt:** Google Gemini API (Multimodal Vision & Analysis).
* **Botlar infratuzilmasi:** Telegraf, Telegram Bot API (`@agrozai_bot` va `@agroz_auth_bot`).
* **Geolokatsiya:** Haversine formulasi va koordinatalar orqali radius bo'yicha qidiruv.

---

## 5. Xulosa va kutilayotgan natijalar

**Agroz AI** orqali:
- O'zbekiston bo'ylab hosil yo'qotishlari 25-30% gacha qisqaradi.
- Fermerlar sifatli dori va professional mutaxassislarni vositachilarsiz topadi.
- Agro-bizneslar va dorixonalar sotuvlarini avtomatlashtirib, yangi bozorlarga chiqadi.
- Agrar xizmatlar ko'rsatish sifati yangi zamonaviy bosqichga ko'tariladi.
