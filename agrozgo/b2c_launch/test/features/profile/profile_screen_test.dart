import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:agrozgo_app/core/network/api_provider.dart';
import 'package:agrozgo_app/core/storage/token_storage.dart';
import 'package:agrozgo_app/features/auth/models/auth_models.dart';
import 'package:agrozgo_app/features/auth/repositories/auth_repository.dart';
import 'package:agrozgo_app/features/profile/screens/profile_screen.dart';

class MockTokenStorage implements TokenStorage {
  String? _session;
  String? _user;

  @override
  Future<void> clearSessionId() async => _session = null;

  @override
  Future<String?> getSessionId() async => _session;

  @override
  Future<void> saveSessionId(String sessionId) async => _session = sessionId;

  @override
  Future<void> clearUserData() async => _user = null;

  @override
  Future<String?> getUserData() async => _user;

  @override
  Future<void> saveUserData(String userData) async => _user = userData;
}

class MockAuthRepository implements AuthRepository {
  @override
  Future<Map<String, dynamic>> requestCode(String phone) async {
    return {'code': '1234'};
  }

  @override
  Future<AuthSession> verify(String phone, String code) async {
    return AuthSession(
      sessionId: 'mock_session_123',
      user: UserModel(
        id: 1,
        phone: phone,
        secondPhone: phone,
        name: 'Sohibjon Sulaymonov',
        isPhoneVerified: true,
        isLocationGranted: true,
      ),
    );
  }

  @override
  Future<UserModel?> getMe() async => null;

  @override
  Future<void> logout() async {}

  @override
  Future<void> deleteAccount() async {}
}

void main() {
  group('Profile & Auth Tests', () {
    late MockTokenStorage mockStorage;
    late MockAuthRepository mockRepo;

    setUp(() {
      mockStorage = MockTokenStorage();
      mockRepo = MockAuthRepository();
    });

    Widget createWidget() {
      return ProviderScope(
        overrides: [
          authRepositoryProvider.overrideWithValue(mockRepo),
          tokenStorageProvider.overrideWithValue(mockStorage),
        ],
        child: const MaterialApp(
          home: ProfileScreen(),
        ),
      );
    }

    testWidgets('Renders Login view when unauthenticated (No Telegram)', (WidgetTester tester) async {
      await tester.pumpWidget(createWidget());
      await tester.pumpAndSettle();

      expect(find.text('AgrozGo Profiliga kirish'), findsOneWidget);
      expect(find.text('+998'), findsOneWidget);
      expect(find.text('SMS kodni olish'), findsOneWidget);
      expect(find.text('Telegram bot orqali kirish'), findsNothing);
    });

    testWidgets('Phone number request code opens OTP view', (WidgetTester tester) async {
      await tester.pumpWidget(createWidget());
      await tester.pumpAndSettle();

      // Enter phone
      await tester.enterText(find.byType(TextField).first, '901234567');
      await tester.tap(find.text('SMS kodni olish'));
      await tester.pumpAndSettle();

      expect(find.text('Tasdiqlash kodi'), findsWidgets);
      expect(find.text('Tasdiqlash'), findsOneWidget);
      expect(find.text('Raqamni oʻzgartirish'), findsOneWidget);
    });

    testWidgets('OTP verification transitions to setup then authenticated profile', (WidgetTester tester) async {
      await tester.pumpWidget(createWidget());
      await tester.pumpAndSettle();

      // Enter phone
      await tester.enterText(find.byType(TextField).first, '901234567');
      await tester.tap(find.text('SMS kodni olish'));
      await tester.pumpAndSettle();

      // Tap autofill / fill OTP
      if (find.text('Toʻldirish').evaluate().isNotEmpty) {
        await tester.tap(find.text('Toʻldirish'));
        await tester.pumpAndSettle();
      }

      await tester.tap(find.text('Tasdiqlash'));
      await tester.pumpAndSettle();

      // Should now be on Profilni sozlash (Name and Location)
      expect(find.text('Profilingizni sozlang'), findsOneWidget);
      expect(find.text('Profilni saqlash va boshlash'), findsOneWidget);

      // Enter name
      await tester.enterText(find.byType(TextField).first, 'Ali Valiyev');
      await tester.pumpAndSettle();

      // Save profile
      final saveBtn = find.text('Profilni saqlash va boshlash');
      await tester.ensureVisible(saveBtn);
      await tester.pumpAndSettle();
      await tester.tap(saveBtn);
      await tester.pumpAndSettle();

      expect(find.text('Mening profilim'), findsOneWidget);
      expect(find.text('Tasdiqlangan raqam'), findsOneWidget);
      expect(find.text('Raqamni oʻzgartirish va tasdiqlash'), findsOneWidget);
      expect(find.text('Tizimdan chiqish'), findsOneWidget);
    });
  });
}
