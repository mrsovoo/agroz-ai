# BiznesGO Super Admin (super-adm)

Ushbu hujjat BiznesGO platformasining barcha tenantlari, sektorlari, foydalanuvchilari va moliyaviy tizimini boshqaruvchi markaziy **Super Admin** paneli arxitekturasini belgilaydi.

---

## 1. Arxitektura Asoslari (Uzoq Yillik Barqarorlik)

1. **Ma'lumotga Asoslangan (Data-Driven) Arxitektura:**
   - Har bir yangi jadval yoki resurs uchun yangi sahifa yozilmaydi.
   - Bitta universal `<ResourceTable />` komponenti barcha ro'yxat, saralash, sahifalash, qidiruv, filtr va eksportni ta'minlaydi.
   - Konfiguratsiya obyekti (`ResourceConfig`) orqali har qanday resurs (Bizneslar, Foydalanuvchilar, Tranzaksiyalar, Audit) boshqariladi.

2. **Sektor Registry Bilan Integratsiya:**
   - Sektorlar (`agro_vet`, `feed_nutrition`, `seeds_seedlings`, `greenhouse_livestock_eq`, `agro_machinery`) kodga qattiq yozilmaydi.
   - Backend Sector Registry (`/v1/admin/sectors`) dan olinadi. Yangi sektor yoqilganda panelda avtomatik paydo bo'ladi.

3. **B2C Moduli Uchun Joy (Feature Flag):**
   - B2C bo'limi arxitekturada hozirdan mavjud, biroq `feature_flags.enable_b2c = false` holatida sukut bo'yicha o'chiq turadi.

4. **Sezgir Ma'lumotlarni Maskalash & Audit:**
   - Telefon raqamlar, qarz qoldiqlari va mahsulot tannarxlari sukut bo'yicha maskalanadi (masalan: `+998 90 *** ** 67`, `*** *** so'm`).
   - Ma'lumotni ochish uchun admin sabab kiritadi (`Reveal with Reason`).
   - Har bir ochish harakati avtomatik ravishda `audit_logs` jadvaliga yoziladi.

---

## 2. Ruxsat Matritsasi (RBAC Matrix)

| Bo'lim / Amal | `super_admin` | `admin` | `support` | `analyst` |
|---|:---:|:---:|:---:|:---:|
| **Dashboard & Analitika** | To'liq | To'liq | Ko'rish | To'liq (Read) |
| **Bizneslar (Tenants)** | Boshqarish | Boshqarish | Ko'rish | Ko'rish |
| **Biznesni Bloklash / Aktivlash** | Ha | Ha | Yo'q | Yo'q |
| **Foydalanuvchilar & Telefon tiklash** | Boshqarish | Boshqarish | Tiklash | Ko'rish |
| **Katalog & Narxlar** | Boshqarish | Boshqarish | Ko'rish | Ko'rish |
| **Tariflar & Obuna Narxlari** | Boshqarish | Yo'q | Yo'q | Ko'rish |
| **Bot Orqali Xabar (Broadcast)** | Yuborish | Yuborish | Yo'q | Yo'q |
| **Tizim Sozlamalari & Feature Flags** | Boshqarish | Yo'q | Yo'q | Yo'q |
| **Audit Jurnali** | To'liq | O'z loglari | O'z loglari | Ko'rish |
| **Adminlarni Boshqarish** | Ha | Yo'q | Yo'q | Yo'q |
| **Sezgir Ma'lumotni Ochish** | Sabab bilan | Sabab bilan | Sabab bilan | Yo'q |

---

## 3. Bosqichlar Rejasi

- **1-Bosqich (Poydevor):**
  - `super-adm/` frontend loyihasi: Vite + React + TS + Tailwind.
  - `backend/super-adm/` API: Auth (Parol + 2FA TOTP), RBAC middleware, Audit middleware.
  - Universal `ResourceTable` va `ResourceDetail` komponentlari.
  - Adminlar ro'yxati, rollar va audit jurnali ko'rinishi.
- **2-Bosqich (Boshqaruv):**
  - Platforma Dashboard (barcha 5 sektor statistikasi).
  - Bizneslar (tenants) ro'yxati, kartochkasi, bloklash/faollashtirish.
  - Foydalanuvchilar boshqaruvi va parolni/raqamni tiklash.
- **3-Bosqich (Katalog & Ma'lumot):**
  - Global katalog, dublikatlarni birlashtirish, ma'lumot sifati.
- **4-Bosqich (Pul & Aloqa):**
  - Obunalar, tariflar, to'lovlar monitoringi, bot orqali e'lonlar, support.
- **5-Bosqich (Tizim & Xavfsizlik):**
  - Sektor registry sozlamalari, feature flags, zaxira nusxalari (backup), B2C flag.

