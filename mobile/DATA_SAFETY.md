# 🛡️ Google Play Console — Data Safety (Ma'lumotlar Xavfsizligi) Shakli

Google Play Console ilovani nashr qilishdan oldin **Data Safety** formasini to'ldirishni talab qiladi. Quyidagi jadval va ma'lumotlarni to'g'ridan-to'g'ri shaklga nusxalab kiritishingiz mumkin.

---

## 1. Umumiy savollar (Overview):
1. **Does your app collect or share any of the required user data types?**  
   👉 **Yes** (Ha, ilova foydalanuvchi ma'lumotlarini yig'adi).
2. **Is all of the user data collected by your app encrypted in transit?**  
   👉 **Yes** (Ha, barcha ma'lumotlar HTTPS / TLS 256-bit orqali shifrlanadi).
3. **Do you provide a way for users to request that their data be deleted?**  
   👉 **Yes** (Ha, foydalanuvchilar profil sahifasidagi "Hisobni butunlay o'chirish" tugmasi orqali ma'lumotlarini o'chira oladi).
4. **Delete account URL (Hisobni o'chirish havolasi):**  
   👉 `https://agroz.uz/privacy` yoki `https://agroz.uz/maxfiylik`

---

## 2. Yig'iladigan ma'lumotlar turlari (Data Types Collected):

| Ma'lumot turi (Data Type) | Yig'iladimi (Collected)? | Ulashiladimi (Shared)? | Maqsadi (Purpose) | Ixtiyoriymi (Optional)? |
|---|---|---|---|---|
| **Location -> Approximate location** (Taxminiy joylashuv) | Ha (Yes) | Yo'q (No) | **App functionality:** Hududiy ob-havo va viloyat bo'yicha agro-tavsiyalar ko'rsatish | Ha (Optional) |
| **Location -> Precise location** (Aniq GPS joylashuv) | Ha (Yes) | Yo'q (No) | **App functionality:** Xaritada eng yaqin dorixonalar va mutaxassislarni topish | Ha (Optional) |
| **Personal info -> Name** (Foydalanuvchi ismi) | Ha (Yes) | Yo'q (No) | **App functionality / Account management:** Profil va buyurtmalarni rasmiylashtirish | Yo'q (Majburiy) |
| **Personal info -> Phone number** (Telefon raqami) | Ha (Yes) | Yo'q (No) | **App functionality / Account management:** SMS OTP orqali kirish va buyurtma yetkazish | Yo'q (Majburiy) |
| **Personal info -> Address** (Yetkazib berish manzili) | Ha (Yes) | Yo'q (No) | **App functionality:** Dori vositalarini yetkazib berish | Ha (Faqat buyurtmada) |
| **Photos and videos -> Photos** (Fotosuratlar) | Ha (Yes) | Yo'q (No) | **App functionality:** O'simlik kasalliklari va zararkunandalarini AI orqali tahlil qilish | Ha (Faqat tashxisda) |
| **Device or other IDs** (Qurilma / Push token) | Ha (Yes) | Yo'q (No) | **App functionality:** Buyurtma holati haqida push-bildirishnoma jo'natish | Ha (Ixtiyoriy) |

---

## 3. Ma'lumotlarni uzatish va saqlash:
- **Uchinchi shaxslarga berilishi (Third-party sharing):** Yo'q (None). Ma'lumotlar reklama tarmoqlari yoki begona kompaniyalarga sotilmaydi va berilmaydi.
- **Saqlash xavfsizligi:** Barcha ma'lumotlar xavfsiz serverda PostgreSQL bazasida saqlanadi.
- **O'chirish mexanizmi:** Foydalanuvchi istalgan vaqtda profilida "Hisobni butunlay o'chirish" tugmasini bosishi bilan barcha ma'lumotlari bazadan darhol o'chiriladi.
