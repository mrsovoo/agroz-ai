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

/// Medicines list strictly matching Figma V10 specification:
/// Bento Max, Tabiiy minerallarga boy ozuqa, 35.000 so'm, + Savatga
final homeMedicinesProvider = FutureProvider.autoDispose<List<MedicineModel>>((ref) async {
  return const [
    MedicineModel(
      id: 1,
      name: 'Bento Max',
      usage: 'Tabiiy minerallarga boy ozuqa',
      price: 35000,
      stock: 20,
    ),
    MedicineModel(
      id: 2,
      name: 'Bento Max',
      usage: 'Tabiiy minerallarga boy ozuqa',
      price: 35000,
      stock: 20,
    ),
  ];
});

/// Specialists list strictly matching Figma V10 specification:
/// Sohibjon Sulaymonov, Veterinar, 4.5 rating, Batafsil
final homeSpecialistsProvider = FutureProvider.autoDispose<List<SpecialistModel>>((ref) async {
  return const [
    SpecialistModel(
      id: 1,
      name: 'Sohibjon Sulaymonov',
      phone: '+998901234567',
      role: 'specialist',
      specialty: 'Veterinar',
      address: 'Farg‘ona shahar',
      lat: 40.3864,
      lng: 71.7864,
      rating: 4.5,
    ),
    SpecialistModel(
      id: 2,
      name: 'Sohibjon Sulaymonov',
      phone: '+998901234567',
      role: 'specialist',
      specialty: 'Veterinar',
      address: 'Farg‘ona shahar',
      lat: 40.3864,
      lng: 71.7864,
      rating: 4.5,
    ),
  ];
});

final unreadNotificationsCountProvider = Provider<int>((ref) {
  // Figma design notification badge count
  return 4;
});
