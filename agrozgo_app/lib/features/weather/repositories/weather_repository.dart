import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_provider.dart';
import '../models/weather_models.dart';

abstract class WeatherRepository {
  Future<WeatherModel> getWeather({double? lat, double? lng});
}

class WeatherRepositoryImpl implements WeatherRepository {
  final ApiClient _apiClient;

  WeatherRepositoryImpl({required ApiClient apiClient}) : _apiClient = apiClient;

  @override
  Future<WeatherModel> getWeather({double? lat, double? lng}) async {
    final query = <String, dynamic>{};
    if (lat != null) query['lat'] = lat;
    if (lng != null) query['lng'] = lng;

    final response = await _apiClient.get(
      '/api/weather',
      queryParameters: query.isNotEmpty ? query : null,
    );

    if (response is Map<String, dynamic>) {
      return WeatherModel.fromJson(response);
    }
    throw Exception('Ob-havo maʼlumoti formati notoʻgʻri');
  }
}

final weatherRepositoryProvider = Provider<WeatherRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return WeatherRepositoryImpl(apiClient: apiClient);
});
