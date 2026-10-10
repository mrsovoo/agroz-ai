import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/home_theme_tokens.dart';
import '../../../shared/widgets/network_banner.dart';
import '../providers/home_providers.dart';
import '../widgets/home_action_cards.dart';
import '../widgets/home_floating_nav.dart';
import '../widgets/home_header.dart';
import '../widgets/home_medicines_section.dart';
import '../widgets/home_promo_section.dart';
import '../widgets/home_weather_card.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  Future<void> _handleRefresh(WidgetRef ref) async {
    ref.invalidate(homeWeatherProvider);
    ref.invalidate(homeMedicinesProvider);
    await Future.wait([
      ref.read(homeWeatherProvider.future),
      ref.read(homeMedicinesProvider.future),
    ]);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = Theme.of(context).extension<HomeThemeTokens>() ?? HomeThemeTokens.light;

    return PopScope(
      canPop: true,
      child: Scaffold(
        backgroundColor: tokens.screenBackground,
        body: SafeArea(
          bottom: false,
          child: Stack(
            children: [
              // Scrollable Content
              RefreshIndicator(
                onRefresh: () => _handleRefresh(ref),
                color: Theme.of(context).colorScheme.primary,
                child: ListView(
                  physics: const BouncingScrollPhysics(
                    parent: AlwaysScrollableScrollPhysics(),
                  ),
                  children: const [
                    // Offline banner
                    NetworkBanner(),

                    // Header
                    HomeHeader(),
                    SizedBox(height: AppSpacing.sm),

                    // Weather Section
                    HomeWeatherCard(),
                    SizedBox(height: AppSpacing.lg),

                    // Quick Actions (Mutaxassislar, Dorilar)
                    HomeActionCards(),
                    SizedBox(height: AppSpacing.xl),

                    // Siz uchun (Promo / Banner)
                    HomePromoSection(),
                    SizedBox(height: AppSpacing.xl),

                    // Dorilar Showcase
                    HomeMedicinesSection(),

                    // Bottom padding so content is not obscured by floating nav
                    SizedBox(height: 110),
                  ],
                ),
              ),

              // Floating Bottom Navigation Bar
              const Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: HomeFloatingNav(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
