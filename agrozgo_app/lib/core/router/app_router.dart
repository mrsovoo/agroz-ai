import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/common/screens/coming_soon_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/test/test_screen.dart';
import '../constants/app_strings.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        name: 'home',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/test',
        name: 'test',
        builder: (context, state) => const TestScreen(),
      ),
      GoRoute(
        path: '/specialists',
        name: 'specialists',
        builder: (context, state) => const ComingSoonScreen(title: AppStrings.specialistsTitle),
      ),
      GoRoute(
        path: '/medicines',
        name: 'medicines',
        builder: (context, state) => const ComingSoonScreen(title: AppStrings.medicinesTitle),
      ),
      GoRoute(
        path: '/cart',
        name: 'cart',
        builder: (context, state) => const ComingSoonScreen(title: AppStrings.navCart),
      ),
      GoRoute(
        path: '/notifications',
        name: 'notifications',
        builder: (context, state) => const ComingSoonScreen(title: AppStrings.notifications),
      ),
      GoRoute(
        path: '/profile',
        name: 'profile',
        builder: (context, state) => const ComingSoonScreen(title: AppStrings.profile),
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
