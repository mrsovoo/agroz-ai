# ADR 0008: Multi-Tenant Ma'lumotlar Izolyatsiyasi, RBAC Matritsasi va Xodimlar Boshqaruvi

## Kontekst
BiznesGO platformasi minglab mustaqil dorixonalar va agro/vet tadbirkorlariga xizmat ko'rsatadi. Har bir dorixona ma'lumotlari (narxlar, ombor qoldig'i, mijozlar qarz daftari, sotuvlar) tijoriy sir hisoblanadi. Shu sababli:
1. Bir dorixona ikkinchi dorixona ma'lumotlarini aslo ko'ra olmasligi yoki o'zgartira olmasligi shart (Multi-tenant data isolation).
2. Tizimda rollar taqsimoti (RBAC): `super_admin`, `admin`, `owner`, `seller`.
3. Xodimlar (sotuvchilar) kirim narxini, foydani, biznes sozlamalarini va hisobotlarni ko'ra olmasligi kerak.
4. Har bir amal audit jurnali (`audit_logs`) ga qayd etilishi shart.

## Qaror

### 1. Multi-Tenant Izolyatsiya Arxitekturasi
- **Application-Level TenantGuard + DB Constraint:**
  - PostgreSQL Row Level Security (RLS) connection pooler (Neon PgBouncer pooler) orqali ishlatilganda sessiya o'zgaruvchilari (`SET LOCAL app.current_tenant`) tranzaksiya tugashi bilan qayta tiklanishi yoki pool chalkashliklari xavfini tug'dirishi mumkin.
  - Shu sababli asosiy himoya sifatida NestJS darajasida qat'iy [`TenantGuard`](file:///Users/sohibjonsulaymonov/kodlar/agroz-ai/b2b/backend-b2b/src/common/guards/tenant.guard.ts) joriy qilindi.
  - Har bir so'rovda `business_id` aniqlanadi va foydalanuvchining ushbu biznesga tegishli ekanligi `business_users` orqali tekshiriladi.
  - Agar A dorixona foydalanuvchisi B dorixona resursiga so'rov yuborsa, tizim darhol `ForbiddenException` (403) qaytaradi.
  - Bu xatti-harakat avtomatlashtirilgan unit/integratsiya testlari (`tenant.guard.spec.ts`) orqali isbotlandi.

### 2. RBAC Matritsasi
| Amal / Bo'lim | `super_admin` | `admin` | `owner` (Egasi) | `seller` (Sotuvchi) |
|---|---|---|---|---|
| Biznes yaratish | Ha | Ha | Ha | Yo'q |
| Biznes ma'lumotlarini tahrirlash | Ha | Ha | Ha (faqat o'z biznesi) | **Yo'q** |
| Xodim qo'shish / o'chirish / rol berish | Ha | Ha | Ha (faqat o'z biznesi) | **Yo'q** |
| Sotuv amalga oshirish | Ha | Ha | Ha | Ha |
| Ombor qoldig'ini ko'rish | Ha | Ha | Ha | Ha |
| Kirim narxi va foydani ko'rish | Ha | Ha | Ha | **Yo'q** |
| Narxni o'zgartirish | Ha | Ha | Ha | **Yo'q** |
| Hisobotlar va kassa tahlili | Ha | Ha | Ha | **Yo'q** |
| Global bizneslarni bloklash/yoqish | Ha | Ha | Yo'q | Yo'q |

### 3. Xodimlar Boshqaruvi
- `POST /v1/business/staff`: Telefon raqam orqali xodim qo'shish. Agar foydalanuvchi tizimda mavjud bo'lmasa, `seller` sifatida ro'yxatdan o'tkaziladi va biznesga biriktiriladi.
- `DELETE /v1/business/staff/:id`: Xodimni biznesdan chiqarish. Dorixona egasi o'zini o'chira olmaydi yoki boshqa egasini o'chira olmaydi.
- Barcha amallar `audit_logs` ga yoziladi (`BUSINESS_STAFF_ADDED`, `BUSINESS_STAFF_REMOVED`, `BUSINESS_STAFF_ROLE_UPDATED`).

## Natijalar
- Multi-tenant izolyatsiya va rollar bo'yicha ruxsatlar to'liq kafolatlandi.
- Testlar bilan multi-tenant buzilishlarining oldi olindi.
