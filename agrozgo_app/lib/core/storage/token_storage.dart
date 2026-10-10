import 'package:flutter_secure_storage/flutter_secure_storage.dart';

abstract class TokenStorage {
  Future<String?> getSessionId();
  Future<void> saveSessionId(String sessionId);
  Future<void> clearSessionId();
}

class SecureTokenStorage implements TokenStorage {
  final FlutterSecureStorage _storage;
  static const _keySessionId = 'agroz_session_id';

  SecureTokenStorage({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  @override
  Future<String?> getSessionId() async {
    try {
      return await _storage.read(key: _keySessionId);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<void> saveSessionId(String sessionId) async {
    await _storage.write(key: _keySessionId, value: sessionId);
  }

  @override
  Future<void> clearSessionId() async {
    await _storage.delete(key: _keySessionId);
  }
}
