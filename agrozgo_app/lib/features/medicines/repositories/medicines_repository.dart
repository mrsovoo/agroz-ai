import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_provider.dart';
import '../models/medicine_models.dart';

abstract class MedicinesRepository {
  Future<List<MedicineModel>> getMedicines({
    String? type,
    String? query,
    String? region,
    int limit = 48,
  });
  Future<MedicineModel?> getMedicine(int id);
}

class MedicinesRepositoryImpl implements MedicinesRepository {
  final ApiClient _apiClient;

  MedicinesRepositoryImpl({required ApiClient apiClient}) : _apiClient = apiClient;

  @override
  Future<List<MedicineModel>> getMedicines({
    String? type,
    String? query,
    String? region,
    int limit = 48,
  }) async {
    final queryParams = <String, dynamic>{
      'limit': limit,
    };
    if (type != null) queryParams['type'] = type;
    if (query != null && query.isNotEmpty) queryParams['q'] = query;
    if (region != null && region.isNotEmpty) queryParams['region'] = region;

    final response = await _apiClient.get(
      '/api/medicines',
      queryParameters: queryParams,
    );

    if (response is Map<String, dynamic> && response['medicines'] is List) {
      return (response['medicines'] as List)
          .map((item) => MedicineModel.fromJson(item as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  @override
  Future<MedicineModel?> getMedicine(int id) async {
    final response = await _apiClient.get('/api/medicines/$id');
    if (response is Map<String, dynamic> && response['medicine'] != null) {
      return MedicineModel.fromJson(response['medicine'] as Map<String, dynamic>);
    }
    return null;
  }
}

final medicinesRepositoryProvider = Provider<MedicinesRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return MedicinesRepositoryImpl(apiClient: apiClient);
});

