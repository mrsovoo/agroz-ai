import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:agrozgo_app/core/theme/app_theme.dart';
import 'package:agrozgo_app/features/cart/screens/cart_screen.dart';

Widget _wrap(Widget screen) {
  final router = GoRouter(routes: [
    GoRoute(path: '/', builder: (_, __) => screen),
  ]);
  return ProviderScope(
    child: MaterialApp.router(
      theme: AppTheme.lightTheme,
      routerConfig: router,
    ),
  );
}

void main() {
  for (final size in const [Size(360, 640), Size(390, 844), Size(430, 932)]) {
    testWidgets('CartScreen renders without overflow at $size', (tester) async {
      tester.view.physicalSize = size;
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);

      await tester.pumpWidget(_wrap(const CartScreen(autoSeedDemo: true)));
      await tester.pump();

      expect(tester.takeException(), isNull);
      expect(find.text("Tanlanganlarni o'chirish"), findsOneWidget);
      expect(find.text('Hammasini tanlash'), findsOneWidget);
      expect(find.text('Buyurtmangiz'), findsOneWidget);

      await tester.scrollUntilVisible(find.text('Yetkazib berish qoidasi'), 100);
      expect(find.text('Yetkazib berish qoidasi'), findsOneWidget);
      await tester.scrollUntilVisible(find.text('Rasmiylashtirish'), 100);
      expect(find.text('Rasmiylashtirish'), findsOneWidget);
    });
  }

  testWidgets('CartScreen accessibility text scaling (textScale 1.3) renders without overflow', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    final router = GoRouter(routes: [
      GoRoute(path: '/', builder: (_, __) => const CartScreen(autoSeedDemo: true)),
    ]);

    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp.router(
          theme: AppTheme.lightTheme,
          routerConfig: router,
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(context).copyWith(
              textScaler: const TextScaler.linear(1.3),
            ),
            child: child!,
          ),
        ),
      ),
    );
    await tester.pump();

    expect(tester.takeException(), isNull);
    expect(find.text('Buyurtmangiz'), findsOneWidget);
  });

  testWidgets('Cart quantity increase and decrease buttons update count', (tester) async {
    await tester.pumpWidget(_wrap(const CartScreen(autoSeedDemo: true)));
    await tester.pump();

    final plusBtn = find.byIcon(Icons.add).first;
    await tester.tap(plusBtn);
    await tester.pump();

    expect(find.text('2'), findsOneWidget);
  });

  testWidgets('Cart toggle select all and delete selected works', (tester) async {
    await tester.pumpWidget(_wrap(const CartScreen(autoSeedDemo: true)));
    await tester.pump();

    final deleteBtn = find.text("Tanlanganlarni o'chirish");
    await tester.tap(deleteBtn);
    await tester.pump();

    expect(find.text('Savatingiz hozircha bo‘sh'), findsOneWidget);
  });
}

