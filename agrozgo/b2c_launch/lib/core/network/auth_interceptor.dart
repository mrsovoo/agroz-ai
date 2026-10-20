import 'package:dio/dio.dart';
import '../storage/token_storage.dart';
import 'auth_events.dart';

class AuthInterceptor extends QueuedInterceptor {
  final TokenStorage _tokenStorage;
  final AuthEventBus _authEventBus;

  AuthInterceptor({
    required TokenStorage tokenStorage,
    AuthEventBus? authEventBus,
  })  : _tokenStorage = tokenStorage,
        _authEventBus = authEventBus ?? AuthEventBus.instance;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final sessionId = await _tokenStorage.getSessionId();
    if (sessionId != null && sessionId.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $sessionId';
    }
    return handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode == 401) {
      await _tokenStorage.clearSessionId();
      _authEventBus.emitUnauthorized();
    }
    return handler.next(err);
  }
}

