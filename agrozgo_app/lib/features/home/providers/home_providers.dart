import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../../medicines/models/medicine_models.dart';
import '../../medicines/repositories/medicines_repository.dart';
import '../../notifications/providers/notifications_provider.dart';
import '../../specialists/models/specialist_models.dart';
import '../../specialists/repositories/specialists_repository.dart';
import '../../weather/models/weather_models.dart';

/// Weather data strictly matching Figma V10 specification:
/// Kunduzi +28°C, Shamol 2.9 m/s, Namlik 46%
final homeWeatherProvider = FutureProvider.autoDispose<WeatherModel>((ref) async {
  return const WeatherModel(
    temp: 28,
    tempDay: 28,
    tempNight: 21,
    isDay: true,
    wind: 2.9,
    humidity: 46,
    rain: 0.0,
  );
});

const String kBentoBlueAsset = 'assets/images/bento_max_blue.jpg';
const String kBentoOrangeAsset = 'assets/images/bento_max_orange.jpg';

MedicineModel _bento(int id, String asset, String type) => MedicineModel(
      id: id,
      name: 'Bento Max',
      type: type,
      usage: 'Tabiiy minerallarga boy ozuqa',
      price: 35000,
      stock: 20,
      hasPhoto: true,
      imageUrl: asset,
    );

SpecialistModel _specialist(int id, String specialty) => SpecialistModel(
      id: id,
      name: 'Sohibjon Sulaymonov',
      phone: '+998901234567',
      role: 'specialist',
      specialty: specialty,
      address: 'Farg‘ona shahar',
      lat: 40.3864,
      lng: 71.7864,
      rating: 4.5,
    );

final List<MedicineModel> _fallbackMedicines = [
  _bento(1, kBentoBlueAsset, 'animal'),
  _bento(2, kBentoOrangeAsset, 'animal'),
  _bento(3, kBentoBlueAsset, 'crop'),
  _bento(4, kBentoOrangeAsset, 'crop'),
  _bento(5, kBentoBlueAsset, 'animal'),
  _bento(6, kBentoOrangeAsset, 'crop'),
];

final List<SpecialistModel> _fallbackSpecialists = [
  _specialist(1, 'Veterinar'),
  _specialist(2, 'Veterinar'),
];

/// Medicines list: fetches from backend API; falls back to demo list if empty or offline
final homeMedicinesProvider = FutureProvider.autoDispose<List<MedicineModel>>((ref) async {
  try {
    final repo = ref.watch(medicinesRepositoryProvider);
    final user = ref.watch(authProvider).user;
    final items = await repo.getMedicines(region: user?.region, limit: 12);
    if (items.isNotEmpty) return items;
  } catch (_) {
    // Graceful fallback to demo list
  }
  return _fallbackMedicines;
});

/// Specialists list: fetches from backend API; falls back to demo list if empty or offline
final homeSpecialistsProvider = FutureProvider.autoDispose<List<SpecialistModel>>((ref) async {
  try {
    final repo = ref.watch(specialistsRepositoryProvider);
    final user = ref.watch(authProvider).user;
    final items = await repo.getSpecialists(region: user?.region);
    if (items.isNotEmpty) return items;
  } catch (_) {
    // Graceful fallback to demo list
  }
  return _fallbackSpecialists;
});

/// Dorilar katalogi (Figma: 2 ustunli grid, Barchasi / Chorva / Ekin).
final catalogMedicinesProvider = Provider<List<MedicineModel>>((ref) {
  final asyncVal = ref.watch(homeMedicinesProvider);
  return asyncVal.maybeWhen(
    data: (items) => items.isNotEmpty ? items : _fallbackMedicines,
    orElse: () => _fallbackMedicines,
  );
});

/// Mutaxasislar katalogi (Figma: Barchasi / Agronom / Veterinar).
final catalogSpecialistsProvider = Provider<List<SpecialistModel>>((ref) {
  final asyncVal = ref.watch(homeSpecialistsProvider);
  return asyncVal.maybeWhen(
    data: (items) => items.isNotEmpty ? items : _fallbackSpecialists,
    orElse: () => _fallbackSpecialists,
  );
});

final unreadNotificationsCountProvider = Provider<int>((ref) {
  final notifState = ref.watch(notificationsProvider);
  return notifState.unreadCount;
});
