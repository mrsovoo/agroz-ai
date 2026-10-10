import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../medicines/models/medicine_models.dart';
import '../../medicines/repositories/medicines_repository.dart';
import '../../specialists/models/specialist_models.dart';
import '../../specialists/repositories/specialists_repository.dart';
import '../../weather/models/weather_models.dart';
import '../../weather/repositories/weather_repository.dart';

final homeWeatherProvider = FutureProvider.autoDispose<WeatherModel>((ref) async {
  final repo = ref.watch(weatherRepositoryProvider);
  return repo.getWeather(lat: 41.3111, lng: 69.2797);
});

final homeMedicinesProvider = FutureProvider.autoDispose<List<MedicineModel>>((ref) async {
  final repo = ref.watch(medicinesRepositoryProvider);
  return repo.getMedicines(limit: 10);
});

final homeSpecialistsProvider = FutureProvider.autoDispose<List<SpecialistModel>>((ref) async {
  final repo = ref.watch(specialistsRepositoryProvider);
  return repo.getSpecialists();
});

final unreadNotificationsCountProvider = Provider<int>((ref) {
  // Default demo count as shown in design (badge 4)
  return 4;
});
