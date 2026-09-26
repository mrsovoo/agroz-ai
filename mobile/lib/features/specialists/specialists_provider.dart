import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../core/constants/api_config.dart';
import '../../core/models/specialist.dart';

final _dio = Dio(
  BaseOptions(
    baseUrl: ApiConfig.baseUrl,
    connectTimeout: const Duration(seconds: 4),
    receiveTimeout: const Duration(seconds: 4),
  ),
);

final List<Specialist> demoSpecialistsList = [
  Specialist(
    id: '1',
    name: 'Islom Karimov',
    type: 'agronom',
    phone: '+998901234567',
    address: 'Toshkent viloyati, Yangiyo\'l tumani',
    lat: 41.2995,
    lng: 69.2401,
    distance: 2.3,
    isActive: true,
    ratingAvg: 4.9,
    ratingCount: 38,
  ),
  Specialist(
    id: '2',
    name: 'Dr. Nodirbek Rahimov',
    type: 'vet',
    phone: '+998912345678',
    address: 'Toshkent sh., Chilonzor tumani',
    lat: 41.2825,
    lng: 69.2154,
    distance: 3.8,
    isActive: true,
    ratingAvg: 4.8,
    ratingCount: 52,
  ),
  Specialist(
    id: '3',
    name: 'Jamshid Qosimov',
    type: 'agronom',
    phone: '+998933456789',
    address: 'Toshkent viloyati, Zangiota tumani',
    lat: 41.2486,
    lng: 69.1706,
    distance: 5.1,
    isActive: true,
    ratingAvg: 5.0,
    ratingCount: 24,
  ),
  Specialist(
    id: '4',
    name: 'Shahnoza Usmonova',
    type: 'vet',
    phone: '+998974567890',
    address: 'Toshkent viloyati, Bo\'stonliq tumani',
    lat: 41.6033,
    lng: 69.9678,
    distance: 7.4,
    isActive: true,
    ratingAvg: 4.9,
    ratingCount: 41,
  ),
  Specialist(
    id: '5',
    name: 'Aziya Agro Kimyo Dorixonasi',
    type: 'pharmacy',
    phone: '+998712001122',
    address: 'Toshkent sh., Chilonzor 9-mavze, 14-uy',
    lat: 41.2750,
    lng: 69.2050,
    distance: 1.2,
    isActive: true,
    ratingAvg: 4.8,
    ratingCount: 65,
  ),
  Specialist(
    id: '6',
    name: 'Agro Savdo Markaziy Dorixona',
    type: 'pharmacy',
    phone: '+998712553344',
    address: 'Toshkent vil., Yangiyo\'l sh., Markaziy ko\'cha 45',
    lat: 41.1333,
    lng: 69.0500,
    distance: 3.5,
    isActive: true,
    ratingAvg: 4.9,
    ratingCount: 82,
  ),
];

final specialistsProvider =
    FutureProvider.family<List<Specialist>, ({double? lat, double? lng})>(
  (ref, params) async {
    try {
      var url = '/api/specialists?radius=5';
      if (params.lat != null) url += '&lat=${params.lat}';
      if (params.lng != null) url += '&lng=${params.lng}';
      final res = await _dio.get(url);
      final data = res.data;
      final list = (data is List) ? data : (data['specialists'] as List? ?? []);
      if (list.isEmpty) return demoSpecialistsList;
      return list
          .map((e) => Specialist.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return demoSpecialistsList;
    }
  },
);
