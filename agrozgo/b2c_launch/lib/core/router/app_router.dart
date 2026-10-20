import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/cart/screens/cart_screen.dart';
import '../../features/common/screens/coming_soon_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/medicines/models/medicine_models.dart';
import '../../features/medicines/screens/medicine_detail_screen.dart';
import '../../features/medicines/screens/medicines_screen.dart';
import '../../features/notifications/screens/notifications_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/saved/screens/saved_screen.dart';
import '../../features/specialists/screens/specialists_screen.dart';
import '../../features/splash/screens/splash_screen.dart';
import '../../features/test/test_screen.dart';
import '../constants/app_strings.dart';

final appInitialLocationProvider = StateProvider<String>((ref) => '/');

final appRouterProvider = Provider<GoRouter>((ref) {
  final initialLoc = ref.watch(appInitialLocationProvider);
  return GoRouter(
    initialLocation: initialLoc,
    routes: [
      GoRoute(
        path: '/splash',
        name: 'splash',
        pageBuilder: (context, state) => const NoTransitionPage(child: SplashScreen()),
      ),
      GoRoute(
        path: '/',
        name: 'home',
        pageBuilder: (context, state) => const NoTransitionPage(child: HomeScreen()),
      ),
      GoRoute(
        path: '/test',
        name: 'test',
        builder: (context, state) => const TestScreen(),
      ),
      GoRoute(
        path: '/specialists',
        name: 'specialists',
        pageBuilder: (context, state) => const NoTransitionPage(child: SpecialistsScreen()),
      ),
      GoRoute(
        path: '/medicines',
        name: 'medicines',
        pageBuilder: (context, state) => const NoTransitionPage(child: MedicinesScreen()),
      ),
      GoRoute(
        path: '/medicines/:id',
        name: 'medicine_detail',
        pageBuilder: (context, state) {
          final id = int.tryParse(state.pathParameters['id'] ?? '') ?? 1;
          final fallback = MedicineModel(
            id: id,
            name: id % 2 == 0 ? 'BENTO MAX (To‘q sariq)' : 'BENTO MAX (Ko‘k)',
            price: 35000,
            type: id % 2 == 0 ? 'crop' : 'animal',
            usage: "Tabiiy minerallarga boy yuqori sifatli ozuqa qo'shimchasi. Bentonit uni.",
            stockUnit: 'qop (5 kg)',
            imageUrl: id % 2 == 0
                ? 'assets/images/bento_max_orange.jpg'
                : 'assets/images/bento_max_blue.jpg',
          );
          final medicine = (state.extra is MedicineModel)
              ? (state.extra as MedicineModel)
              : fallback;
          return CupertinoPage(
            key: state.pageKey,
            child: MedicineDetailScreen(medicine: medicine),
          );
        },
      ),
      GoRoute(
        path: '/cart',
        name: 'cart',
        pageBuilder: (context, state) => const NoTransitionPage(child: CartScreen()),
      ),
      GoRoute(
        path: '/notifications',
        name: 'notifications',
        pageBuilder: (context, state) => CupertinoPage(
          key: state.pageKey,
          child: const NotificationsScreen(),
        ),
      ),
      GoRoute(
        path: '/saved',
        name: 'saved',
        pageBuilder: (context, state) => const NoTransitionPage(child: SavedScreen()),
      ),
      GoRoute(
        path: '/profile',
        name: 'profile',
        pageBuilder: (context, state) => const NoTransitionPage(child: ProfileScreen()),
      ),
      GoRoute(
        path: '/promo',
        name: 'promo',
        builder: (context, state) => const ComingSoonScreen(title: AppStrings.promoTitle),
      ),
      GoRoute(
        path: '/news',
        name: 'news',
        builder: (context, state) => const ComingSoonScreen(title: AppStrings.forYouTitle),
      ),
    ],
  );
});
