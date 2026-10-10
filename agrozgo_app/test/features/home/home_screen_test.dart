import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:agrozgo_app/main.dart';
import 'package:agrozgo_app/core/constants/app_strings.dart';
import 'package:agrozgo_app/features/cart/providers/cart_provider.dart';
import 'package:agrozgo_app/features/home/providers/home_providers.dart';
import 'package:agrozgo_app/features/home/screens/home_screen.dart';
import 'package:agrozgo_app/features/medicines/models/medicine_models.dart';
import 'package:agrozgo_app/features/specialists/models/specialist_models.dart';
import 'package:agrozgo_app/features/weather/models/weather_models.dart';

void main() {
  const sampleWeather = WeatherModel(
    temp: 28,
    tempDay: 28,
    tempNight: 21,
    isDay: true,
    wind: 2.9,
    humidity: 46,
    rain: 0.0,
  );

  const sampleMedicines = [
    MedicineModel(
      id: 1,
      name: 'Bento Max',
      usage: 'Tabiiy minerallarga boy ozuqa',
      price: 35000,
      stock: 20,
    ),
    MedicineModel(
      id: 2,
      name: 'Topaz 100 EC',
      usage: 'Agro fungitsid vositasi',
      price: 65000,
      stock: 15,
    ),
  ];

  const sampleSpecialists = [
    SpecialistModel(
      id: 1,
      name: 'Sohibjon Sulaymonov',
      phone: '+998901234567',
      role: 'specialist',
      specialty: 'Veterinar',
      address: 'Farg‘ona shahar',
      lat: 40.3864,
      lng: 71.7864,
      rating: 4.5,
    ),
  ];

  Widget createHomeScreenWidget({
    AsyncValue<WeatherModel>? weatherOverride,
    AsyncValue<List<MedicineModel>>? medicinesOverride,
    AsyncValue<List<SpecialistModel>>? specialistsOverride,
    Size surfaceSize = const Size(390, 844),
    double textScale = 1.0,
  }) {
    return ProviderScope(
      overrides: [
        if (weatherOverride != null)
          homeWeatherProvider.overrideWith((ref) => weatherOverride.value!),
        if (medicinesOverride != null)
          homeMedicinesProvider.overrideWith((ref) => medicinesOverride.value!),
        if (specialistsOverride != null)
          homeSpecialistsProvider.overrideWith((ref) => specialistsOverride.value!),
      ],
      child: MaterialApp(
        home: MediaQuery(
          data: MediaQueryData(
            size: surfaceSize,
            textScaler: TextScaler.linear(textScale),
          ),
          child: const HomeScreen(),
        ),
      ),
    );
  }

  group('HomeScreen 4-State Tests', () {
    testWidgets('1. Data state: renders all sections and values correctly', (tester) async {
      await tester.binding.setSurfaceSize(const Size(390, 844));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(
        createHomeScreenWidget(
          weatherOverride: const AsyncValue.data(sampleWeather),
          medicinesOverride: const AsyncValue.data(sampleMedicines),
          specialistsOverride: const AsyncValue.data(sampleSpecialists),
        ),
      );
      await tester.pumpAndSettle();

      // Header checks
      expect(find.text('AGROZ'), findsOneWidget);
      expect(find.text('GO'), findsOneWidget);
      expect(find.text(AppStrings.defaultLocation), findsOneWidget);

      // Weather checks
      expect(find.text(AppStrings.daytime), findsOneWidget);
      expect(find.text('+28°C'), findsOneWidget);
      expect(find.text('2.9 m/s'), findsOneWidget);
      expect(find.text('46%'), findsOneWidget);

      // Medicines section
      expect(find.text(AppStrings.medicinesSectionTitle), findsWidgets);
      expect(find.text('Bento Max'), findsOneWidget);
      expect(find.text('35.000 so‘m'), findsOneWidget);
      expect(find.text(AppStrings.addToCart), findsWidgets);

      // Specialists section
      expect(find.text(AppStrings.specialistsSectionTitle), findsWidgets);
      expect(find.text('Sohibjon Sulaymonov'), findsOneWidget);
      expect(find.text('Veterinar'), findsOneWidget);
      expect(find.text('4.5'), findsOneWidget);
      expect(find.text(AppStrings.details), findsOneWidget);

      // Floating nav
      expect(find.text(AppStrings.navHome), findsOneWidget);
      expect(find.text(AppStrings.navCart), findsOneWidget);
    });

    testWidgets('2. Loading state: renders skeleton loaders without crashing', (tester) async {
      await tester.binding.setSurfaceSize(const Size(390, 844));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            homeWeatherProvider.overrideWith((ref) => Future.delayed(const Duration(minutes: 5))),
            homeMedicinesProvider.overrideWith((ref) => Future.delayed(const Duration(minutes: 5))),
            homeSpecialistsProvider.overrideWith((ref) => Future.delayed(const Duration(minutes: 5))),
          ],
          child: const MaterialApp(home: HomeScreen()),
        ),
      );
      await tester.pump();

      expect(find.byType(HomeScreen), findsOneWidget);
      expect(find.text('AGROZ'), findsOneWidget);
      expect(find.text(AppStrings.medicinesSectionTitle), findsWidgets);
    });

    testWidgets('3. Empty state: renders empty view when data is empty', (tester) async {
      await tester.binding.setSurfaceSize(const Size(390, 844));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(
        createHomeScreenWidget(
          weatherOverride: const AsyncValue.data(sampleWeather),
          medicinesOverride: const AsyncValue.data([]),
          specialistsOverride: const AsyncValue.data([]),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text(AppStrings.medicinesEmpty), findsOneWidget);
      expect(find.text(AppStrings.specialistsEmpty), findsOneWidget);
    });

    testWidgets('4. Error state: renders error view with retry button', (tester) async {
      await tester.binding.setSurfaceSize(const Size(390, 844));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            homeWeatherProvider.overrideWith((ref) => throw Exception('API Error')),
            homeMedicinesProvider.overrideWith((ref) => throw Exception('API Error')),
            homeSpecialistsProvider.overrideWith((ref) => throw Exception('API Error')),
          ],
          child: const MaterialApp(home: HomeScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text(AppStrings.weatherError), findsOneWidget);
      expect(find.text(AppStrings.medicinesError), findsOneWidget);
      expect(find.text(AppStrings.specialistsError), findsOneWidget);
      expect(find.text(AppStrings.retry), findsWidgets);
    });
  });

  group('Responsive Layout & Accessibility Tests', () {
    testWidgets('Compact device (360x640) - no overflow', (tester) async {
      await tester.binding.setSurfaceSize(const Size(360, 640));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(
        createHomeScreenWidget(
          weatherOverride: const AsyncValue.data(sampleWeather),
          medicinesOverride: const AsyncValue.data(sampleMedicines),
          specialistsOverride: const AsyncValue.data(sampleSpecialists),
          surfaceSize: const Size(360, 640),
        ),
      );
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
    });

    testWidgets('Standard device (390x844) - no overflow', (tester) async {
      await tester.binding.setSurfaceSize(const Size(390, 844));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(
        createHomeScreenWidget(
          weatherOverride: const AsyncValue.data(sampleWeather),
          medicinesOverride: const AsyncValue.data(sampleMedicines),
          specialistsOverride: const AsyncValue.data(sampleSpecialists),
          surfaceSize: const Size(390, 844),
        ),
      );
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
    });

    testWidgets('Large device (430x932) - no overflow', (tester) async {
      await tester.binding.setSurfaceSize(const Size(430, 932));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(
        createHomeScreenWidget(
          weatherOverride: const AsyncValue.data(sampleWeather),
          medicinesOverride: const AsyncValue.data(sampleMedicines),
          specialistsOverride: const AsyncValue.data(sampleSpecialists),
          surfaceSize: const Size(430, 932),
        ),
      );
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
    });

    testWidgets('Accessibility text scaling (textScale 1.3) - no overflow', (tester) async {
      await tester.binding.setSurfaceSize(const Size(390, 844));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(
        createHomeScreenWidget(
          weatherOverride: const AsyncValue.data(sampleWeather),
          medicinesOverride: const AsyncValue.data(sampleMedicines),
          specialistsOverride: const AsyncValue.data(sampleSpecialists),
          textScale: 1.3,
        ),
      );
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
    });
  });

  group('Cart Interaction Test', () {
    testWidgets('Tapping + Savatga adds medicine to cart and updates badge', (tester) async {
      await tester.binding.setSurfaceSize(const Size(390, 844));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      final container = ProviderContainer(
        overrides: [
          homeWeatherProvider.overrideWith((ref) => sampleWeather),
          homeMedicinesProvider.overrideWith((ref) => sampleMedicines),
          homeSpecialistsProvider.overrideWith((ref) => sampleSpecialists),
        ],
      );

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(home: HomeScreen()),
        ),
      );
      await tester.pumpAndSettle();

      // Initially cart is empty
      expect(container.read(cartProvider).totalCount, 0);

      // Scroll until "+ Savatga" is visible and tap
      final addBtn = find.text(AppStrings.addToCart).first;
      await tester.ensureVisible(addBtn);
      await tester.pumpAndSettle();
      await tester.tap(addBtn);
      await tester.pump();

      // Verify cart state updated
      expect(container.read(cartProvider).totalCount, 1);
      expect(container.read(cartProvider).totalPrice, 35000);
    });
  });

  group('Flavor Tests', () {
    testWidgets('Renders properly within full AgrozApp', (tester) async {
      await tester.binding.setSurfaceSize(const Size(390, 844));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            homeWeatherProvider.overrideWith((ref) => sampleWeather),
            homeMedicinesProvider.overrideWith((ref) => sampleMedicines),
            homeSpecialistsProvider.overrideWith((ref) => sampleSpecialists),
          ],
          child: const AgrozApp(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byType(HomeScreen), findsOneWidget);
    });
  });
}
