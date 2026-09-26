import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../core/constants/api_config.dart';
import '../../core/models/medicine.dart';

final _dio = Dio(
  BaseOptions(
    baseUrl: ApiConfig.baseUrl,
    connectTimeout: const Duration(seconds: 4),
    receiveTimeout: const Duration(seconds: 4),
  ),
);

final List<Medicine> demoMedicinesList = [
  Medicine(
    id: '1',
    name: 'Bento Max (Chorva uchun)',
    type: 'animal',
    price: 35000,
    usage:
        'Sog\'lom chorva, barqaror hosildorlik. Kuniga 50-100g aralashtirib beriladi.',
    hasPhoto: false,
    pharmacyId: '1',
    pharmacyName: 'Aziya Agro Kimyo',
    pharmacyPhone: '+998901234567',
    pharmacyAddress: 'Toshkent sh., Chilonzor tumani',
    ratingAvg: 4.8,
    ratingCount: 12,
  ),
  Medicine(
    id: '2',
    name: 'Bento Max Premium',
    type: 'animal',
    price: 35000,
    usage: 'Vitaminli ozuqa qo\'shimchasi. Yosh buzoqlar va qo\'zilar uchun.',
    hasPhoto: false,
    pharmacyId: '1',
    pharmacyName: 'Aziya Agro Kimyo',
    pharmacyPhone: '+998901234567',
    pharmacyAddress: 'Toshkent sh., Chilonzor tumani',
    ratingAvg: 4.9,
    ratingCount: 8,
  ),
  Medicine(
    id: '3',
    name: 'Super Fosfat Ekin',
    type: 'crop',
    price: 45000,
    usage:
        'Ildiz o\'sishini tezlashtiruvchi mineral o\'g\'it. Ekishdan oldin solinadi.',
    hasPhoto: false,
    pharmacyId: '2',
    pharmacyName: 'Agro Savdo',
    pharmacyPhone: '+998912345678',
    pharmacyAddress: 'Toshkent viloyati, Yangiyo\'l tumani',
    ratingAvg: 4.7,
    ratingCount: 15,
  ),
  Medicine(
    id: '4',
    name: 'Biogumus Extra',
    type: 'crop',
    price: 28000,
    usage: 'Tabiiy organik o\'g\'it. Issiqxona va ochiq dala ekinlari uchun.',
    hasPhoto: false,
    pharmacyId: '2',
    pharmacyName: 'Agro Savdo',
    pharmacyPhone: '+998912345678',
    pharmacyAddress: 'Toshkent viloyati, Yangiyo\'l tumani',
    ratingAvg: 5.0,
    ratingCount: 20,
  ),
  Medicine(
    id: '5',
    name: 'Entoagro Insektitsid',
    type: 'crop',
    price: 52000,
    usage: 'Zararkunanda hasharotlarga qarshi samarali vosita.',
    hasPhoto: false,
    pharmacyId: '3',
    pharmacyName: 'Yangiyo\'l Agro Kimyo',
    pharmacyPhone: '+998933456789',
    pharmacyAddress: 'Toshkent vil., Zangiota t.',
    ratingAvg: 4.6,
    ratingCount: 18,
  ),
  Medicine(
    id: '6',
    name: 'Oksitetratsiklin Vet',
    type: 'animal',
    price: 40000,
    usage: 'Keng spektrli antibakterial dori vositasi.',
    hasPhoto: false,
    pharmacyId: '4',
    pharmacyName: 'Toshkent Vet Markaz',
    pharmacyPhone: '+998974567890',
    pharmacyAddress: 'Toshkent sh., Yunusobod t.',
    ratingAvg: 4.8,
    ratingCount: 25,
  ),
];

final medicinesProvider =
    FutureProvider.family<List<Medicine>, ({String? type, String? q})>(
  (ref, params) async {
    try {
      var url = '/api/medicines?limit=48';
      if (params.type != null) url += '&type=${params.type}';
      if (params.q != null && params.q!.isNotEmpty) {
        url += '&q=${Uri.encodeComponent(params.q!)}';
      }
      final res = await _dio.get(url);
      final list = res.data as List;
      return list
          .map((e) => Medicine.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      var result = List<Medicine>.from(demoMedicinesList);
      if (params.type != null) {
        result = result.where((m) => m.type == params.type).toList();
      }
      if (params.q != null && params.q!.isNotEmpty) {
        final query = params.q!.toLowerCase();
        result = result
            .where((m) =>
                m.name.toLowerCase().contains(query) ||
                (m.usage?.toLowerCase().contains(query) ?? false))
            .toList();
      }
      return result;
    }
  },
);

final medicineDetailProvider =
    FutureProvider.family<Medicine, dynamic>((ref, id) async {
  try {
    final res = await _dio.get('/api/medicines/$id');
    return Medicine.fromJson(res.data as Map<String, dynamic>);
  } catch (_) {
    final idStr = id.toString();
    return demoMedicinesList.firstWhere(
      (m) => m.id == idStr,
      orElse: () => demoMedicinesList.first,
    );
  }
});
