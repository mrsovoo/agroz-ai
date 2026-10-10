import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../medicines/models/medicine_models.dart';
import '../../specialists/models/specialist_models.dart';
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

/// Medicines list strictly matching Figma V10 specification:
/// Bento Max, Tabiiy minerallarga boy ozuqa, 35.000 so'm, + Savatga
final homeMedicinesProvider = FutureProvider.autoDispose<List<MedicineModel>>((ref) async {
  return [
    _bento(1, kBentoBlueAsset, 'animal'),
    _bento(2, kBentoOrangeAsset, 'animal'),
  ];
});

/// Specialists list strictly matching Figma V10 specification:
/// Sohibjon Sulaymonov, Veterinar, 4.5 rating, Batafsil
final homeSpecialistsProvider = FutureProvider.autoDispose<List<SpecialistModel>>((ref) async {
  return [
    _specialist(1, 'Veterinar'),
    _specialist(2, 'Veterinar'),
  ];
});

/// Dorilar katalogi (Figma: 2 ustunli grid, Barchasi / Chorva / Ekin).
final catalogMedicinesProvider = Provider<List<MedicineModel>>((ref) {
  return [
    _bento(1, kBentoBlueAsset, 'animal'),
    _bento(2, kBentoOrangeAsset, 'animal'),
    _bento(3, kBentoBlueAsset, 'crop'),
    _bento(4, kBentoOrangeAsset, 'crop'),
    _bento(5, kBentoBlueAsset, 'animal'),
    _bento(6, kBentoOrangeAsset, 'crop'),
  ];
});

/// Mutaxasislar katalogi (Figma: Barchasi / Agronom / Veterinar).
final catalogSpecialistsProvider = Provider<List<SpecialistModel>>((ref) {
  return List.generate(6, (i) => _specialist(i + 1, 'Veterinar'));
});

final unreadNotificationsCountProvider = Provider<int>((ref) {
  // Figma design notification badge count
  return 4;
});
