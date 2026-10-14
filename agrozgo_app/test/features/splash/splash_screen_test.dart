import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:agrozgo_app/features/splash/screens/splash_screen.dart';
import 'package:agrozgo_app/core/router/app_router.dart';

void main() {
  group('SplashScreen Tests', () {
    testWidgets('SplashScreen renders centered AGROZGO Symbol and transitions',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: SplashScreen(
              duration: const Duration(milliseconds: 300),
            ),
          ),
        ),
      );

      // Verify the symbol SVG is rendered
      expect(find.bySemanticsLabel('AGROZGO Symbol'), findsOneWidget);

      // Pump 100ms: still on splash
      await tester.pump(const Duration(milliseconds: 100));
      expect(find.bySemanticsLabel('AGROZGO Symbol'), findsOneWidget);

      // Finish animation and duration
      await tester.pump(const Duration(milliseconds: 250));
    });

    testWidgets('Full app boots to splash when configured', (WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            appInitialLocationProvider.overrideWith((ref) => '/splash'),
          ],
          child: Builder(
            builder: (context) {
              return Consumer(
                builder: (context, ref, child) {
                  final router = ref.watch(appRouterProvider);
                  return MaterialApp.router(routerConfig: router);
                },
              );
            },
          ),
        ),
      );

      await tester.pump();
      expect(find.bySemanticsLabel('AGROZGO Symbol'), findsOneWidget);
    });
  });
}

