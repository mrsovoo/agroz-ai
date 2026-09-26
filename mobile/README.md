# 📱 Agroz AI — Flutter Mobil Ilova

O'zbekiston dehqon, fermer va chorvadorlari uchun yaratilgan agro-platform mobil ilovasi.

## Texnologiyalar
- **Framework:** Flutter 3.x (Dart)
- **State Management:** Riverpod 2.x
- **Navigation:** GoRouter 14.x
- **HTTP:** Dio 5.x
- **Storage:** SharedPreferences
- **Maps:** flutter_map (coming soon)

## Loyiha tuzilmasi
```
lib/
├── main.dart                    # Entry point
├── app.dart                     # MaterialApp + Router
├── core/
│   ├── constants/
│   │   ├── app_colors.dart      # Brand ranglar (#028E11)
│   │   ├── app_strings.dart     # O'zbek matnlar
│   │   └── api_config.dart      # API URL konfiguratsiyasi
│   ├── models/                  # Data modellar
│   │   ├── medicine.dart
│   │   ├── specialist.dart
│   │   ├── advertisement.dart
│   │   ├── cart_item.dart
│   │   └── app_user.dart
│   └── services/
│       └── api_service.dart     # Dio HTTP client
├── router/
│   └── app_router.dart          # GoRouter konfiguratsiyasi
└── features/
    ├── auth/                    # Kirish (telefon → OTP → ism)
    │   ├── phone_screen.dart
    │   ├── otp_screen.dart
    │   ├── name_screen.dart
    │   └── auth_provider.dart
    ├── shell/
    │   └── main_shell.dart      # Bottom navigation
    ├── home/
    │   └── home_screen.dart     # Asosiy sahifa
    ├── medicines/
    │   ├── medicines_screen.dart
    │   ├── medicine_detail_screen.dart
    │   └── medicines_provider.dart
    ├── specialists/
    │   ├── specialists_screen.dart
    │   └── specialists_provider.dart
    ├── profile/
    │   └── profile_screen.dart
    ├── map/
    │   └── map_screen.dart
    ├── diagnose/
    │   └── diagnose_screen.dart
    └── news/
        └── news_screen.dart
```

## Kirish oqimi (Auth Flow)
```
1. PhoneScreen  → +998 XX XXX-XX-XX kiritish → Kodni olish
2. OtpScreen    → 5 raqamli SMS kod → 5 nuqta indikator
3. NameScreen   → Yangi foydalanuvchilar uchun Ism/Familiya
4. HomeScreen   → Asosiy sahifa
```

## Ekranlar (Screens)
| Ekran | Route | Tavsif |
|-------|-------|--------|
| Asosiy | `/` | Ob-havo, reklama, dorilar vitrinasi |
| Dorilar | `/dorilar` | Katalog, filter, qidiruv |
| Dori tafsilot | `/dorilar/:id` | Rasm, narx, dorixona |
| Savat | Modal | Buyurtma berish |
| Mutaxassislar | `/mutaxassislar` | Agronom, veterinarlar |
| Xarita | `/xarita` | Yaqin dorixonalar |
| Profil | `/profil` | Foydalanuvchi, buyurtmalar |
| AI Tashxis | `/tashxis/:category` | Rasm orqali kasallik aniqlash |
| Yangiliklar | `/yangiliklar` | Maslahatlar |

## Boshlash
```bash
cd apps/mobile

# Dependencylarni o'rnatish
flutter pub get

# Android qurilmada ishga tushirish
flutter run

# iOS qurilmada
flutter run -d ios

# Release build (Android)
flutter build apk --release
```

## API
Backend: `https://api.agroz.uz`  
Local: `http://localhost:4000`

> `lib/core/constants/api_config.dart` da `useProduction` ni `false` qilsangiz local backend ishlatiladi.

## 🚀 Kelajak rejalari
- [ ] Flutter Map integratsiyasi (dorixonalar xaritasi)
- [ ] Push Notifications (FCM)
- [ ] Offline rejim
- [ ] iOS App Store / Google Play publish
- [ ] Dark mode
