import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/widgets/agroz_loading_symbol.dart';
import '../../home/providers/home_providers.dart';

/// 2-second splash screen with animated AgrozGO symbol logo:
/// Outer green badge swings -15° to +15°, while inner white logo is pinned.
/// Preloads initial prices and catalog data for immediate readiness.
class SplashScreen extends ConsumerStatefulWidget {
  final Duration duration;

  const SplashScreen({
    super.key,
    this.duration = const Duration(seconds: 2),
  });

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();

    // Trigger pre-fetching of initial data & prices
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(homeWeatherProvider);
      ref.read(catalogMedicinesProvider);
      ref.read(homeSpecialistsProvider);
      ref.read(homeMedicinesProvider);
    });

    _timer = Timer(widget.duration, () {
      if (mounted) {
        try {
          context.go('/');
        } catch (_) {}
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: AgrozLoadingSymbol(
            size: 150,
            maxAngleDegrees: 15.0,
            swingDuration: Duration(milliseconds: 750),
            showSpinner: false,
          ),
        ),
      ),
    );
  }
}
