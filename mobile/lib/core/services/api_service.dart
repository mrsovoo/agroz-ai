import 'package:dio/dio.dart';
import '../constants/api_config.dart';

class ApiService {
  final Dio dio;

  ApiService()
      : dio = Dio(
          BaseOptions(
            baseUrl: ApiConfig.baseUrl,
            connectTimeout: const Duration(seconds: 15),
            receiveTimeout: const Duration(seconds: 30),
            headers: {'Content-Type': 'application/json'},
          ),
        ) {
    dio.interceptors.add(LogInterceptor(responseBody: false));
  }
}

final apiService = ApiService();
