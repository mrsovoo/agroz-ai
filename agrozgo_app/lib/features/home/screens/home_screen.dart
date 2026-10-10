import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/home_theme_tokens.dart';
import '../providers/home_providers.dart';
import '../widgets/home_floating_nav.dart';
import '../widgets/home_header.dart';
import '../widgets/home_medicines_section.dart';
import '../widgets/home_specialists_section.dart';
import '../widgets/home_weather_card.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  Future<void> _handleRefresh(WidgetRef ref) async {
    ref.invalidate(homeWeatherProvider);
    ref.invalidate(homeMedicinesProvider);
    ref.invalidate(homeSpecialistsProvider);
    await Future.wait([
      ref.read(homeWeatherProvider.future),
      ref.read(homeMedicinesProvider.future),
      ref.read(homeSpecialistsProvider.future),
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
                color: const Color(0xFF35CA56),
                child: ListView(
                  physics: const BouncingScrollPhysics(
                    parent: AlwaysScrollableScrollPhysics(),
                  ),
                  children: const [
                    // Header (Avatar, AGROZGO logo, Bell with badge)
                    HomeHeader(),
                    SizedBox(height: 8),

                    // Weather Section (Kunduzi + Shamol + Namlik pills)
                    HomeWeatherCard(),
                    SizedBox(height: 14),

                    // Dorilar Section (White container with horizontal product cards)
                    HomeMedicinesSection(),
                    SizedBox(height: 14),

                    // Mutaxasislar Section (Specialist cards with 4.5 rating and Batafsil)
                    HomeSpecialistsSection(),

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
