import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_provider.dart';
import '../models/diagnosis_models.dart';

abstract class DiagnoseRepository {
  Future<DiagnosisModel> diagnose({
    required String category,
    String? text,
    String? imageDataUrl,
  });
  Future<DiagnosisModel?> getDiagnosis(int id, {String? viewToken});
}

class DiagnoseRepositoryImpl implements DiagnoseRepository {
  final ApiClient _apiClient;

  DiagnoseRepositoryImpl({required ApiClient apiClient}) : _apiClient = apiClient;

  @override
  Future<DiagnosisModel> diagnose({
    required String category,
    String? text,
    String? imageDataUrl,
  }) async {
    final response = await _apiClient.post(
      '/api/diagnose',
      data: {
        'category': category,
        if (text != null && text.isNotEmpty) 'text': text,
        if (imageDataUrl != null && imageDataUrl.isNotEmpty) 'imageDataUrl': imageDataUrl,
      },
    );

    if (response is Map<String, dynamic>) {
      if (response['ok'] == true && response['diagnosis'] != null) {
        return DiagnosisModel.fromJson(response['diagnosis'] as Map<String, dynamic>);
      }
      return DiagnosisModel.fromJson(response);
    }
    throw Exception('Tashxis natijasi notoʻgʻri');
  }

  @override
  Future<DiagnosisModel?> getDiagnosis(int id, {String? viewToken}) async {
    final query = <String, dynamic>{};
    if (viewToken != null && viewToken.isNotEmpty) {
      query['viewToken'] = viewToken;
    }

    final response = await _apiClient.get(
      '/api/diagnose/$id',
      queryParameters: query.isNotEmpty ? query : null,
    );

    if (response is Map<String, dynamic> && response['diagnosis'] != null) {
      return DiagnosisModel.fromJson(response['diagnosis'] as Map<String, dynamic>);
    }
    return null;
  }
}

final diagnoseRepositoryProvider = Provider<DiagnoseRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return DiagnoseRepositoryImpl(apiClient: apiClient);
});

