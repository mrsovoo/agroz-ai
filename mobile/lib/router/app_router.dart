import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../features/onboarding/onboarding_screen.dart';
import '../features/auth/phone_screen.dart';
import '../features/auth/otp_screen.dart';
import '../features/auth/name_screen.dart';
import '../features/home/home_screen.dart';
import '../features/medicines/medicines_screen.dart';
import '../features/medicines/medicine_detail_screen.dart';
import '../features/specialists/specialists_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/profile/orders_screen.dart';
import '../features/map/map_screen.dart';
import '../features/news/news_screen.dart';
import '../features/diagnose/diagnose_screen.dart';
import '../features/weather/weather_detail_screen.dart';
import '../features/cart/cart_screen.dart';
import '../features/shell/main_shell.dart';

final _rootKey = GlobalKey<NavigatorState>();
final _shellKey = GlobalKey<NavigatorState>();

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    navigatorKey: _rootKey,
    initialLocation: '/splash',
    routes: [
      // Splash — redirect logic
      GoRoute(
        path: '/splash',
        builder: (context, state) => const _SplashRedirect(),
      ),

      // Onboarding (first launch)
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),

      // Auth routes (no shell)
      GoRoute(
        path: '/auth/phone',
        builder: (context, state) => const PhoneScreen(),
      ),
      GoRoute(
        path: '/auth/otp',
        builder: (context, state) => const OtpScreen(),
      ),
      GoRoute(
        path: '/auth/name',
        builder: (context, state) => const NameScreen(),
      ),

      // Main app with bottom nav shell
      ShellRoute(
        navigatorKey: _shellKey,
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(
            path: '/',
            builder: (context, state) => const HomeScreen(),
          ),
          GoRoute(
            path: '/dorilar',
            builder: (context, state) => const MedicinesScreen(),
            routes: [
              GoRoute(
                path: ':id',
                parentNavigatorKey: _rootKey,
                builder: (context, state) {
                  final id =
                      int.tryParse(state.pathParameters['id'] ?? '') ?? 0;
                  return MedicineDetailScreen(medicineId: id);
                },
              ),
            ],
          ),
          GoRoute(
            path: '/mutaxassislar',
            builder: (context, state) => const SpecialistsScreen(),
          ),
          GoRoute(
            path: '/savat',
            builder: (context, state) => const CartScreen(),
          ),
          GoRoute(
            path: '/profil',
            builder: (context, state) => const ProfileScreen(),
          ),
          GoRoute(
            path: '/xarita',
            builder: (context, state) => const MapScreen(),
          ),
        ],
      ),

      // Full-screen routes (no bottom nav)
      GoRoute(
        path: '/profil/buyurtmalar',
        parentNavigatorKey: _rootKey,
        builder: (context, state) => const OrdersScreen(),
      ),
      GoRoute(
        path: '/obhavo',
        parentNavigatorKey: _rootKey,
        builder: (context, state) => const WeatherDetailScreen(),
      ),
      GoRoute(
        path: '/yangiliklar',
        parentNavigatorKey: _rootKey,
        builder: (context, state) => const NewsScreen(),
      ),
      GoRoute(
        path: '/tashxis/:category',
        parentNavigatorKey: _rootKey,
        builder: (context, state) {
          final category = state.pathParameters['category'] ?? 'crop';
          return DiagnoseScreen(category: category);
        },
      ),
    ],
  );
});

/// Splash widget — SharedPreferences ni o'qib, to'g'ri sahifaga yo'naltiradi
class _SplashRedirect extends StatefulWidget {
  const _SplashRedirect();

  @override
  State<_SplashRedirect> createState() => _SplashRedirectState();
}

class _SplashRedirectState extends State<_SplashRedirect> {
  @override
  void initState() {
    super.initState();
    _redirect();
  }

  Future<void> _redirect() async {
    await Future.delayed(
        const Duration(milliseconds: 300)); // splash flicker oldini olish
    final prefs = await SharedPreferences.getInstance();
    final onboardingDone = prefs.getBool('onboarding_done') ?? false;
    final token = prefs.getString('token');

    if (!mounted) return;

    if (!onboardingDone) {
      context.go('/onboarding');
    } else if (token == null) {
      context.go('/auth/phone');
    } else {
      context.go('/');
    }
  }

  @override
  Widget build(BuildContext context) {
    // Splash screen — Agroz AI logo + yashil fon
    return const Scaffold(
      backgroundColor: Color(0xFF028E11),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.eco_rounded, size: 72, color: Colors.white),
            SizedBox(height: 16),
            Text(
              'Agroz AI',
              style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                  letterSpacing: -0.5),
            ),
            SizedBox(height: 8),
            Text(
              'sizning aqlli yordamchingiz',
              style: TextStyle(fontSize: 15, color: Colors.white70),
            ),
          ],
        ),
      ),
    );
  }
}
