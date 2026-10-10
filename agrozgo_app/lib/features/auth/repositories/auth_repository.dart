import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_provider.dart';
import '../../../core/storage/token_storage.dart';
import '../models/auth_models.dart';

abstract class AuthRepository {
  Future<Map<String, dynamic>> requestCode(String phone);
  Future<AuthSession> verify(String phone, String code);
  Future<UserModel?> getMe();
  Future<void> logout();
  Future<void> deleteAccount();
}

class AuthRepositoryImpl implements AuthRepository {
  final ApiClient _apiClient;
  final TokenStorage _tokenStorage;

  AuthRepositoryImpl({
    required ApiClient apiClient,
    required TokenStorage tokenStorage,
  })  : _apiClient = apiClient,
        _tokenStorage = tokenStorage;

  @override
  Future<Map<String, dynamic>> requestCode(String phone) async {
    final response = await _apiClient.post(
      '/api/auth/request-code',
      data: {'phone': phone},
    );
    return response is Map<String, dynamic> ? response : {};
  }

  @override
  Future<AuthSession> verify(String phone, String code) async {
    final response = await _apiClient.post(
      '/api/auth/verify',
      data: {'phone': phone, 'code': code},
    );

    if (response is Map<String, dynamic>) {
      final session = AuthSession.fromJson(response);
      if (session.sessionId.isNotEmpty) {
        await _tokenStorage.saveSessionId(session.sessionId);
      }
      return session;
    }
    throw Exception('Notoʻgʻri javob formati');
  }

  @override
  Future<UserModel?> getMe() async {
    final response = await _apiClient.get('/api/auth/me');
    if (response is Map<String, dynamic> && response['user'] != null) {
      return UserModel.fromJson(response['user'] as Map<String, dynamic>);
    }
    return null;
  }

  @override
  Future<void> logout() async {
    try {
      await _apiClient.post('/api/auth/logout');
    } finally {
      await _tokenStorage.clearSessionId();
    }
  }

  @override
  Future<void> deleteAccount() async {
    try {
      await _apiClient.delete('/api/auth/delete-account');
    } finally {
      await _tokenStorage.clearSessionId();
    }
  }
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final tokenStorage = ref.watch(tokenStorageProvider);
  return AuthRepositoryImpl(apiClient: apiClient, tokenStorage: tokenStorage);
});

