import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:agrozgo_app/core/theme/app_theme.dart';
import 'package:agrozgo_app/features/medicines/screens/medicines_screen.dart';
import 'package:agrozgo_app/features/specialists/screens/specialists_screen.dart';

Widget _wrap(Widget screen) {
  final router = GoRouter(routes: [
    GoRoute(path: '/', builder: (_, __) => screen),
  ]);
  return ProviderScope(
    child: MaterialApp.router(theme: AppTheme.lightTheme, routerConfig: router),
  );
}

void main() {
  for (final size in const [Size(360, 640), Size(390, 844), Size(430, 932)]) {
    testWidgets('Dorilar screen renders without overflow at $size', (tester) async {
      tester.view.physicalSize = size;
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(_wrap(const MedicinesScreen()));
      await tester.pump();
      expect(tester.takeException(), isNull);
      expect(find.text('Qidiruv'), findsOneWidget);
      expect(find.text('Chorva'), findsOneWidget);
      expect(find.text('Bento Max'), findsWidgets);
    });

    testWidgets('Mutaxasislar screen renders without overflow at $size', (tester) async {
      tester.view.physicalSize = size;
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(_wrap(const SpecialistsScreen()));
      await tester.pump();
      expect(tester.takeException(), isNull);
      expect(find.text('Agronom'), findsOneWidget);
      expect(find.text('Sohibjon Sulaymonov'), findsWidgets);
    });
  }

  testWidgets('Dorilar filter Ekin narrows the grid', (tester) async {
    await tester.pumpWidget(_wrap(const MedicinesScreen()));
    await tester.pump();
    await tester.tap(find.text('Ekin'));
    await tester.pump();
    expect(tester.takeException(), isNull);
  });
}
