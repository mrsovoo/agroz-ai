# BiznesGO Backend Arxitekturasi va Kodlash Standartlari

Ushbu hujjat BiznesGO loyihasi backend arxitekturasi, kod sifati standartlari va kelajakdagi rivojlanish qoidalarini belgilaydi.

---

## 🏛 Strategik Qaror va Asosiy Qoidalar

1. **Texnologik Stek:** BiznesGO backend’i qat’iy ravishda **Node.js + TypeScript + Express.js + Drizzle ORM + Neon PostgreSQL** platformasida qoladi.
2. **Python’ga Ko‘chish Bekor Qilingan:** Asosiy backend va biznes mantig‘i (auth, tovarlar, ombor, mijozlar, qarz daftari, POS kassa, hisobotlar) hech qachon Python’ga ko‘chirilmaydi.
3. **Kelajakdagi AI / Python O‘rni:** Python faqat kelajakda AgrozAI o‘simlik kasalliklarini aniqlash (Computer Vision) yoki sun’iy intellekt modeli uchun alohida, mustaqil mikroservis sifatida ishlatilishi mumkin. Asosiy API va do‘kon logikasi Node.js’da ishlaydi.
4. **Kodning Sodda va Tushunarliligi:** Kod shunday yozilishi kerakki, loyiha egasi uni o‘qiy olishi, har bir funksiya nima qilishini tushunishi va oddiy o‘zgarishlarni o‘zi mustaqil kiritishi mumkin bo‘lsin.

---

## 📐 Kod Sifati Qoidalari (Development Guidelines)

- **Modullilik:** Har bir biznes yo‘nalishi (Auth, Mahsulotlar, Mijozlar, Qarzlar, POS Kassa, Hisobotlar) alohida faylda bo‘lishi shart.
- **Hajm Cheklovi:** Bitta fayl hajmi 500 qatordan oshmasligi tavsiya etiladi. Murakkab mantiq yordamchi fayllarga (`helpers.ts` yoki xizmatlarga) ajratiladi.
- **Xavfsizlik va Tekshiruv:**
  - Har bir endpointda `requireBiznesGoMerchant` middleware qo‘llaniladi.
  - Barcha so‘rovlarda `merchant_id` tekshiriladi (Cross-tenant himoyasi). Begona do‘kon resursiga murojaat `403 Forbidden` bilan qaytariladi.
  - Kiruvchi ma’lumotlar (body, query, params) to‘liq tekshiriladi va validatsiya qilinadi.
- **O‘zbekcha Izohlar:** Har bir funksiya, endpoint, murakkab hisob-kitob va xatolik xabarlari o‘zbek tilida aniq izohlab boriladi.
- **Test va Migratsiya:** Har bir yangi imkoniyat uchun avtomatlashtirilgan unit/smoke test va idempotent SQL migratsiyasi yaratiladi.

---

## 📂 Modullar Tuzilishi

| Fayl | Vazifasi | Asosiy Endpointlar |
| :--- | :--- | :--- |
| [`auth.ts`](./auth.ts) | Telegram Mini App auth, sessiya yaratish va @agroz_auth_bot sinxi | `POST /auth/telegram`, `GET /auth/me`, `POST /auth/logout` |
| [`profile.ts`](./profile.ts) | Sotuvchi do‘kon ma’lumotlari, ish vaqti, manzilini tahrirlash | `GET /profile`, `PUT /profile` |
| [`products.ts`](./products.ts) | Mahsulotlar katalogi, qoldiq boshqaruvi, toifalar va arxivlash | `GET /products`, `POST /products`, `PUT /products/:id`, `DELETE /products/:id` |
| [`customers.ts`](./customers.ts) | Mijozlar bazasi (CRM), qarz balansi, tafsilotlar | `GET /customers`, `POST /customers`, `GET /customers/:id`, `PUT /customers/:id` |
| [`debts.ts`](./debts.ts) | Qarz daftari, muddatlar, to‘lovlar tarixi | `GET /debts`, `POST /debts`, `POST /debts/:id/payments`, `PATCH /debts/:id/cancel` |
| [`pos.ts`](./pos.ts) | Tezkor kassa, savat, naqd/karta/nasiya to‘lov, chek va bekor qilish | `GET /pos/products`, `POST /pos/sales`, `GET /pos/sales`, `PATCH /pos/sales/:id/cancel` |
| [`reports.ts`](./reports.ts) | Sotuvlar, kassa tushumi va tovarlar tahlili (Hisobotlar) | `GET /reports/summary`, `GET /reports/top-products` |
| [`middleware.ts`](./middleware.ts) | Merchant autentifikatsiyasi va huquqlarni tekshiruvchi middleware | `requireBiznesGoMerchant` |
| [`helpers.ts`](./helpers.ts) | Yordamchi tozalash, formatlash va sana funksiyalari | `cleanStr`, `parseMoney` |

---

## 🧪 Sinov (Test) Buyruqlari

```bash
# Backend unit testlarini ishga tushirish
npm --workspace=backend test

# Butun monorepo bo'yicha TypeScript xatoliklarini tekshirish
npm run typecheck:all

# Neon DB migratsiyalarini yangilash
npm --workspace=backend run db:migrate:biznesgo
```
