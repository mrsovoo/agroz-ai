# AGROZGO Loyihasi Xavfsizlik va API Refactoring Holati

**Bajarilgan ishlar (O'zbek tilida):**
1. **API Endpoints Himoyasi:**
   - Barcha muhim endpointlar (`/orders`, `/diagnose`, `/push`, `/admin`) endi aniq auth middleware'larga (`requireAuth`, `requireTelegramAuth`, `requireAdmin`) o'tkazildi.
   - `POST /diagnose` anonim ishlashi uchun `optionalAuth` qilib o'zgartirildi va bot tasdiqlamagan mijozlar uchun rate-limit (IP bo'yicha) joriy qilindi. Bir martalik `viewToken` mexanizmi qo'shildi.
   - `GET /diagnose/:id` uchun IDOR himoyasi to'liq yopildi. Endi faqat egasi yoki `viewToken` ga ega mijozgina uni ko'ra oladi, boshqalar uchun `404 Topilmadi` qaytadi.
   - `POST /push/register` va `unregister` endi `requireAuth` orqali to'liq JWT va Telegram InitData'ni qo'llab quvvatlaydi hamda faqat `req.user.id` ga tegishli tokenlarni o'chiradi/yangilaydi.
2. **Frontend va Business API So'rovlari:**
   - Ikkala app uchun ham yagona `apiFetch` funksiyasi (`lib/api-config.ts`) kiritildi. Endi hamma so'rovlar avtomatik tarzda `x-telegram-init-data` header'ni olib yuradi, xuddi cookie'lar kabi qulay bo'ldi.
3. **Ikki Telegram Botni Ajratish:**
   - `@agrozai_bot` (asosiy foydalanuvchilar boti) va `@agroz_auth_bot` (mutaxassis va dorixonalar boti) endi kod darajasida `requireTelegramAuth("user")` va `requireTelegramAuth("business")` kabi qat'iy ajratilgan. Ular aralashib ketmaydi. Ikkalasining webhooklari o'zining mustaqil `x-telegram-bot-api-secret-token` larini tekshiradi.
4. **Git va Papkalar Qoidasi:**
   - `mobile/` papkasi git tracking'dan olib tashlangan (`.gitignore` da turibdi), .env va boshqa sirlar push qilinmaydi.
   - Hamma ishlar `main` branchda bajarildi va build xatosiz o'tdi.

**Kutilayotgan ishlar (TODO):**
- O'zgarishlar faqat lokal commit qilindi (`0b612b6` va `a5b51ff`). User ularni origin'ga o'zi PUSH qilishi kerak.
- Yuqoridagi xavfsizlik o'zgarishlarini ishlab chiqarish muhitida (Vercel/Railway) to'g'ri ishlashini sinovdan o'tkazish.
