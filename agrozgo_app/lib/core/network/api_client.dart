import 'package:dio/dio.dart';
import '../config/app_config.dart';
import '../errors/api_exception.dart';
import '../storage/token_storage.dart';
import 'auth_interceptor.dart';

class ApiClient {
  final Dio _dio;

  ApiClient({
    String? baseUrl,
    TokenStorage? tokenStorage,
    Dio? dio,
  }) : _dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: baseUrl ?? AppConfig.apiUrl,
                connectTimeout: AppConfig.connectTimeout,
                receiveTimeout: AppConfig.receiveTimeout,
                sendTimeout: AppConfig.sendTimeout,
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                },
              ),
            ) {
    if (dio == null) {
      _dio.interceptors.add(
        AuthInterceptor(tokenStorage: tokenStorage ?? SecureTokenStorage()),
      );
    }
  }

  Dio get dio => _dio;

  Future<dynamic> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return _request(
      () => _dio.get(path, queryParameters: queryParameters, options: options),
    );
  }

  Future<dynamic> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return _request(
      () => _dio.post(path, data: data, queryParameters: queryParameters, options: options),
    );
  }

  Future<dynamic> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return _request(
      () => _dio.put(path, data: data, queryParameters: queryParameters, options: options),
    );
  }

  Future<dynamic> patch(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return _request(
      () => _dio.patch(path, data: data, queryParameters: queryParameters, options: options),
    );
  }

  Future<dynamic> delete(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return _request(
      () => _dio.delete(path, data: data, queryParameters: queryParameters, options: options),
    );
  }

  Future<dynamic> _request(Future<Response> Function() call) async {
    try {
      final response = await call();
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ApiException(
        message: 'Kutilmagan xatolik yuz berdi: $e',
        type: ApiErrorType.unknown,
      );
    }
  }

  ApiException _handleDioError(DioException error) {
    final response = error.response;
    final statusCode = response?.statusCode;
    final data = response?.data;

    String message = 'Xatolik yuz berdi';
    if (data is Map && data['error'] != null) {
      message = data['error'].toString();
    } else if (data is Map && data['message'] != null) {
      message = data['message'].toString();
    } else if (error.message != null && error.message!.isNotEmpty) {
      message = error.message!;
    }

    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return ApiException(
          message: 'Serverga ulanish vaqti tugadi',
          statusCode: statusCode,
          type: ApiErrorType.timeout,
          rawData: data,
        );
      case DioExceptionType.connectionError:
        return ApiException(
          message: 'Internet aloqasi mavjud emas',
          statusCode: statusCode,
          type: ApiErrorType.network,
          rawData: data,
        );
      case DioExceptionType.badResponse:
        if (statusCode == 401) {
          return ApiException(
            message: message.isNotEmpty ? message : 'Avtorizatsiya muddati tugagan',
            statusCode: statusCode,
            type: ApiErrorType.unauthorized,
            rawData: data,
          );
        } else if (statusCode == 403) {
          return ApiException(
            message: message.isNotEmpty ? message : 'Ruxsat berilmagan',
            statusCode: statusCode,
            type: ApiErrorType.forbidden,
            rawData: data,
          );
        } else if (statusCode == 404) {
          return ApiException(
            message: message.isNotEmpty ? message : 'Maʼlumot topilmadi',
            statusCode: statusCode,
            type: ApiErrorType.notFound,
            rawData: data,
          );
        } else if (statusCode != null && statusCode >= 400 && statusCode < 500) {
          return ApiException(
            message: message,
            statusCode: statusCode,
            type: ApiErrorType.validation,
            rawData: data,
          );
        } else {
          return ApiException(
            message: 'Serverda xatolik yuz berdi ($statusCode)',
            statusCode: statusCode,
            type: ApiErrorType.server,
            rawData: data,
          );
        }
      case DioExceptionType.cancel:
        return const ApiException(
          message: 'Soʻrov bekor qilindi',
          type: ApiErrorType.unknown,
        );
      case DioExceptionType.badCertificate:
        return const ApiException(
          message: 'Xavfsizlik sertifikati yaroqsiz',
          type: ApiErrorType.network,
        );
      case DioExceptionType.unknown:
      default:
        return ApiException(
          message: message,
          statusCode: statusCode,
          type: ApiErrorType.unknown,
          rawData: data,
        );
    }
  }
}

