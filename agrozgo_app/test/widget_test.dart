import 'package:flutter_test/flutter_test.dart';
import 'package:agrozgo_app/main.dart';
import 'package:agrozgo_app/core/config/app_config.dart';
import 'package:agrozgo_app/features/cart/providers/cart_provider.dart';
import 'package:agrozgo_app/features/auth/models/auth_models.dart';
import 'package:agrozgo_app/features/medicines/models/medicine_models.dart';
import 'package:agrozgo_app/features/weather/models/weather_models.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  group('App smoke & widget tests', () {
    testWidgets('AgrozApp smoke test - renders TestScreen', (WidgetTester tester) async {
      await tester.pumpWidget(const ProviderScope(child: AgrozApp()));
      await tester.pumpAndSettle();

      expect(find.textContaining('Poydevor Sinovi'), findsOneWidget);
      expect(find.text('Ilova Muhiti (Flavor)'), findsOneWidget);
      expect(find.text('Tarmoq Holati'), findsOneWidget);
      expect(find.text('API Sinovi (/api/weather)'), findsOneWidget);
    });
  });

  group('Unit Tests: Config & Models', () {
    test('AppConfig defaults to user flavor', () {
      expect(AppConfig.flavor, AppFlavor.user);
      expect(AppConfig.flavor.appTitle, 'AgrozGO');
      expect(AppConfig.flavor.applicationId, 'uz.agrozgo.app');
      expect(AppConfig.apiUrl, isNotEmpty);
    });

    test('AuthModels json serialization', () {
      final json = {
        'sessionId': 'test_sess_123',
        'user': {
          'id': 10,
          'phone': '+998901234567',
          'name': 'Ali Valiyev',
          'region': 'Toshkent',
        },
      };

      final session = AuthSession.fromJson(json);
      expect(session.sessionId, 'test_sess_123');
      expect(session.user.id, 10);
      expect(session.user.name, 'Ali Valiyev');
      expect(session.toJson()['sessionId'], 'test_sess_123');
    });

    test('MedicineModel json serialization', () {
      final json = {
        'id': 1,
        'name': 'Topaz 100 EC',
        'type': 'crop',
        'price': 45000,
        'stock': 12,
        'stockUnit': 'dona',
        'status': 'bor',
        'hasPhoto': true,
      };

      final medicine = MedicineModel.fromJson(json);
      expect(medicine.id, 1);
      expect(medicine.name, 'Topaz 100 EC');
      expect(medicine.price, 45000);
      expect(medicine.hasPhoto, true);
    });

    test('WeatherModel json serialization', () {
      final json = {
        'temp': 24,
        'tempDay': 28,
        'tempNight': 16,
        'isDay': true,
        'wind': 3.5,
        'humidity': 40,
        'rain': 0.0,
        'daily': [
          {
            'date': '2026-10-11',
            'tempMax': 28,
            'tempMin': 16,
            'rainSum': 0.0,
            'rainProbMax': 5,
            'windMax': 4.2,
            'code': 1,
          }
        ],
      };

      final weather = WeatherModel.fromJson(json);
      expect(weather.temp, 24);
      expect(weather.daily.length, 1);
      expect(weather.daily.first.tempMax, 28);
    });

    test('CartNotifier manages state correctly', () {
      final notifier = CartNotifier();
      expect(notifier.state.items.isEmpty, true);

      notifier.addItem(
        medicineId: 1,
        pharmacyId: 2,
        name: 'Topaz 100 EC',
        price: 50000,
      );
      expect(notifier.state.items.length, 1);
      expect(notifier.state.totalCount, 1);
      expect(notifier.state.totalPrice, 50000);

      // Add same item again -> quantity increases
      notifier.addItem(
        medicineId: 1,
        pharmacyId: 2,
        name: 'Topaz 100 EC',
        price: 50000,
      );
      expect(notifier.state.items.length, 1);
      expect(notifier.state.totalCount, 2);
      expect(notifier.state.totalPrice, 100000);

      // Update quantity
      notifier.updateQuantity(1, 3);
      expect(notifier.state.totalCount, 3);
      expect(notifier.state.totalPrice, 150000);

      // Remove item
      notifier.removeItem(1);
      expect(notifier.state.items.isEmpty, true);
    });
  });
}
