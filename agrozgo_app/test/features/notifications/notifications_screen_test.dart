import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:agrozgo_app/features/notifications/screens/notifications_screen.dart';

void main() {
  testWidgets('NotificationsScreen renders items and allows marking as read', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: NotificationsScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Bildirishnomalar'), findsOneWidget);
    expect(find.textContaining('Xabarnomalar'), findsOneWidget);
    expect(find.text('O‘qildi'), findsOneWidget);

    // Tap "O‘qildi" to mark all as read
    await tester.tap(find.text('O‘qildi'));
    await tester.pumpAndSettle();

    // Now all items should show "O‘qilgan"
    expect(find.text('O‘qilgan'), findsWidgets);
  });
}

