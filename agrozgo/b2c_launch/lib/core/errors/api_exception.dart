enum ApiErrorType {
  network,
  unauthorized,
  forbidden,
  notFound,
  validation,
  server,
  timeout,
  unknown,
}

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final ApiErrorType type;
  final dynamic rawData;

  const ApiException({
    required this.message,
    this.statusCode,
    this.type = ApiErrorType.unknown,
    this.rawData,
  });

  @override
  String toString() => 'ApiException(message: $message, statusCode: $statusCode, type: $type)';
}

