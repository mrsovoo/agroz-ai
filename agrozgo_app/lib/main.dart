import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/config/app_config.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';

import 'features/common/screens/missing_config_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: AgrozApp()));
}

class AgrozApp extends ConsumerWidget {
  final bool bypassConfigCheck;

  const AgrozApp({
    super.key,
    this.bypassConfigCheck = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!bypassConfigCheck && !AppConfig.hasValidApiUrl) {
      return MaterialApp(
        title: AppConfig.flavor.appTitle,
        theme: AppTheme.lightTheme,
        debugShowCheckedModeBanner: false,
        home: const MissingConfigScreen(),
      );
    }

    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: AppConfig.flavor.appTitle,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.lightTheme,
      themeMode: ThemeMode.light,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
