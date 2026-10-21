# ADR 0007: `businesses` Nomi, `contacts` Modeli va Sektorlar Ro‘yxati Qarori

## Kontekst
Boshlang'ich loyihalashda B2B subyektlari `shops` (do'konlar) va xaridorlar `customers` (mijozlar) deb nomlangan edi. Biroq kelgusida platformaga:
- Faqat chakana do'konlar emas, balki xizmat ko'rsatuvchi mutaxassislar (veterinar, agronom), ozuqa yem ta'minotchilari, issiqxona xo'jaliklari va texnika xizmatlari ham mustaqil B2B subyekt sifatida ulanadi. Shu sababli `shops` atamasi torlik qiladi.
- Xuddi shuningdek, `customers` faqat xaridor emas, balki qarz daftari subyekti (debtor), xizmat oluvchi (service recipient) yoki yetkazib beruvchi bo'lishi mumkin.
- Sektorlar bo'yicha 6 ta yo'nalish belgilandi: `pharmacy`, `feed`, `greenhouse`, `seeds`, `machinery`, `specialist`.

## Qaror

### 1. `shops` o‘rniga `businesses`
- Prisma modeli `Shop` -> `Business`, jadval nomi `businesses`.
- Barcha bog'liq jadvallardagi `shop_id` kalitlari `business_id` ga o'zgartirildi:
  - `shop_users` -> `business_users`
  - `shop_products` -> `business_products` (mahsulot partiyalari `business_product_id` ga bog'landi)
  - `sales.business_id`
  - `audit_logs.business_id`
  - `debt_transactions.business_id`

### 2. `customers` o‘rniga `contacts`
- Prisma modeli `Customer` -> `Contact`, jadval nomi `contacts`.
- Bog'liq maydon: `customer_id` -> `contact_id`.
- Yangi `type` maydoni qo'shildi (`customer`, `debtor`, `service_recipient` va h.k.).
- Bu qaror har qanday biznes subyekti uchun yagona qarzdorlik va mijozlar balansini yuritish imkonini beradi.

### 3. Sektorlar va Registry
- `BusinessSector` enumi:
  1. `pharmacy` (Veterinariya va agro dorixona)
  2. `feed` (Ozuqa yem)
  3. `greenhouse` (Issiqxona)
  4. `seeds` (Urug‘chilik)
  5. `machinery` (Agro texnika)
  6. `specialist` (Agro va vet mutaxassis)
- **Qat'iy qoida:** Hozirgi bosqichda FAQAT `pharmacy` sektori yoqilgan (`enabled: true`). Qolgan 5 ta sektor uchun hech qanday alohida katalog, maydon yoki ekran yozilmaydi; ular kelgusidagi relizlarga qadar `enabled: false` holatida turadi.

### 4. Versiya
- Ushbu o'zgarishlar arxitektura poydevorini to'g'rilash bo'lganligi sababli tizim versiyasi `0.0.0` bo'lib qoladi.

## Natijalar
- Tizim keyinchalik arxitekturani qayta yozmasdan har qanday agro/vet biznesi va mutaxassisini qamrab oladigan darajada kengayuvchan bo'ldi.
- Barcha nomlashlar Prisma sxemasida, TypeScript turlarida, seed skriptida va testlarda bir xillashtirildi.

