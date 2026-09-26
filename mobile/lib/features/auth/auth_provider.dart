import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import '../../core/constants/api_config.dart';

class AuthState {
  final String phone;
  final bool isLoading;
  final String? error;
  final String? token;
  final bool isNewUser;

  AuthState(
      {this.phone = '',
      this.isLoading = false,
      this.error,
      this.token,
      this.isNewUser = false});

  AuthState copyWith(
      {String? phone,
      bool? isLoading,
      String? error,
      String? token,
      bool? isNewUser}) {
    return AuthState(
      phone: phone ?? this.phone,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      token: token ?? this.token,
      isNewUser: isNewUser ?? this.isNewUser,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(AuthState());
  final Dio _dio = Dio(BaseOptions(baseUrl: ApiConfig.baseUrl));

  void setPhone(String phone) {
    state = state.copyWith(phone: phone);
  }

  Future<bool> sendOtp() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res =
          await _dio.post('/api/auth/send-otp', data: {'phone': state.phone});
      state = state.copyWith(isLoading: false);
      return res.data['ok'] == true;
    } catch (e) {
      // Demo rejim uchun har doim true qaytaramiz (kod 12345 bilan kiriladi)
      state = state.copyWith(isLoading: false);
      return true;
    }
  }

  Future<bool> verifyOtp(String code) async {
    state = state.copyWith(isLoading: true, error: null);

    final cleanCode = code.replaceAll(' ', '').trim();

    // 1) DEMO KOD: 12345 tekshiruvi
    if (cleanCode == '12345') {
      const demoToken = 'demo_token_12345';
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', demoToken);
      await prefs.setString('userPhone', state.phone);
      
      final existingName = prefs.getString('userName');
      final isNew = (existingName == null || existingName.isEmpty);

      state = state.copyWith(
        isLoading: false,
        token: demoToken,
        isNewUser: isNew,
      );
      return true;
    }

    // 2) Real backend orqali tekshirish
    try {
      final res = await _dio.post('/api/auth/verify-otp',
          data: {'phone': state.phone, 'code': cleanCode});
      if (res.data['ok'] == true) {
        final token = res.data['token'];
        final isNewUser = res.data['isNewUser'] ?? false;

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', token);
        await prefs.setString('userPhone', state.phone);

        state = state.copyWith(
            isLoading: false, token: token, isNewUser: isNewUser);
        return true;
      }
      state = state.copyWith(isLoading: false, error: 'Xato kod');
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> updateProfile(String name, String surname) async {
    state = state.copyWith(isLoading: true, error: null);
    final fullName = '$name $surname'.trim();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('userName', fullName);

    try {
      await _dio.patch(
        '/api/me',
        data: {'name': fullName},
        options: Options(headers: {'Authorization': 'Bearer ${state.token}'}),
      );
      state = state.copyWith(isLoading: false, isNewUser: false);
      return true;
    } catch (e) {
      // Demo rejimda lokalda saqlanadi
      state = state.copyWith(isLoading: false, isNewUser: false);
      return true;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('userName');
    await prefs.remove('userPhone');
    state = AuthState();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
