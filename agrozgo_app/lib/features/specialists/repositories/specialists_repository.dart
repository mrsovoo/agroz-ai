import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_provider.dart';
import '../models/specialist_models.dart';

abstract class SpecialistsRepository {
  Future<List<SpecialistModel>> getSpecialists({
    double? lat,
    double? lng,
    String? role,
    int? radius,
    String? region,
  });
  Future<void> rateSpecialist(int id, int stars);
  Future<void> callSpecialist({
    required int specialistId,
    required String customerName,
    required String customerPhone,
    required String problem,
    String? address,
  });
}

class SpecialistsRepositoryImpl implements SpecialistsRepository {
  final ApiClient _apiClient;

  SpecialistsRepositoryImpl({required ApiClient apiClient}) : _apiClient = apiClient;

  @override
  Future<List<SpecialistModel>> getSpecialists({
    double? lat,
    double? lng,
    String? role,
    int? radius,
    String? region,
  }) async {
    final query = <String, dynamic>{};
    if (lat != null && lng != null) {
      query['lat'] = lat;
      query['lng'] = lng;
    }
    if (role != null) query['role'] = role;
    if (radius != null) query['radius'] = radius;
    if (region != null && region.isNotEmpty) query['region'] = region;

    final response = await _apiClient.get(
      '/api/specialists',
      queryParameters: query,
    );

    if (response is Map<String, dynamic> && response['items'] is List) {
      return (response['items'] as List)
          .map((item) => SpecialistModel.fromJson(item as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  @override
  Future<void> rateSpecialist(int id, int stars) async {
    await _apiClient.post(
      '/api/specialists/$id/rate',
      data: {'stars': stars},
    );
  }

  @override
  Future<void> callSpecialist({
    required int specialistId,
    required String customerName,
    required String customerPhone,
    required String problem,
    String? address,
  }) async {
    await _apiClient.post(
      '/api/specialists/$specialistId/call',
      data: {
        'customerName': customerName,
        'customerPhone': customerPhone,
        'problem': problem,
        if (address != null) 'address': address,
      },
    );
  }
}

final specialistsRepositoryProvider = Provider<SpecialistsRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return SpecialistsRepositoryImpl(apiClient: apiClient);
});

