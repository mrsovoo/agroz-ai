import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/home_theme_tokens.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/skeleton_loader.dart';
import '../providers/home_providers.dart';

class HomeWeatherCard extends ConsumerWidget {
  const HomeWeatherCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = Theme.of(context).extension<HomeThemeTokens>() ?? HomeThemeTokens.light;
    final weatherAsync = ref.watch(homeWeatherProvider);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
      child: weatherAsync.when(
        data: (weather) {
          final isDay = weather.isDay;
          final timeOfDayTitle = isDay ? AppStrings.daytime : AppStrings.nighttime;
          final tempString = '${weather.temp > 0 ? "+" : ""}${weather.temp}°C';
          final windString = '${weather.wind} ${AppStrings.windUnit}';
          final humidityString = '${weather.humidity}%';

          return Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // 1. Left Weather Card (Transparent background, centered icon + Kunduzi + Temp)
              Expanded(
                flex: 48,
                child: SizedBox(
                  height: 56,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // 3D Weather Sun icon extracted 1:1
                      Image.asset(
                        'assets/images/weather_sun.png',
                        width: 44,
                        height: 44,
                        fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => Icon(
                          isDay ? Icons.wb_sunny_rounded : Icons.nightlight_round,
                          color: isDay ? const Color(0xFFFFB800) : Colors.indigo.shade400,
                          size: 34,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              timeOfDayTitle,
                              style: const TextStyle(
                                color: Colors.black,
                                fontSize: 14.5,
                                fontFamily: 'PingFang SC',
                                fontWeight: FontWeight.w700,
                                height: 1.15,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              tempString,
                              style: const TextStyle(
                                color: Color(0xB3000000), // black with 70% opacity
                                fontSize: 13,
                                fontFamily: 'PingFang SC',
                                fontWeight: FontWeight.w600,
                                height: 1.15,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // 2. Wind Pill (Figma/SVG: rx=16 rounded rectangle, fill black 0.03 opacity)
              Expanded(
                flex: 26,
                child: Container(
                  height: 56,
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.03),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.air_rounded,
                              size: 13,
                              color: Colors.black.withValues(alpha: 0.85),
                            ),
                            const SizedBox(width: 3),
                            Text(
                              AppStrings.wind,
                              style: TextStyle(
                                color: Colors.black.withValues(alpha: 0.85),
                                fontSize: 11,
                                fontFamily: 'PingFang SC',
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 2),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          windString,
                          style: const TextStyle(
                            color: Colors.black,
                            fontSize: 13,
                            fontFamily: 'PingFang SC',
                            fontWeight: FontWeight.w700,
                          ),
                          maxLines: 1,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // 3. Humidity Pill (Figma/SVG: rx=16 rounded rectangle, fill black 0.03 opacity)
              Expanded(
                flex: 26,
                child: Container(
                  height: 56,
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.03),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.water_drop_outlined,
                              size: 13,
                              color: Colors.black.withValues(alpha: 0.85),
                            ),
                            const SizedBox(width: 3),
                            Text(
                              AppStrings.humidity,
                              style: TextStyle(
                                color: Colors.black.withValues(alpha: 0.85),
                                fontSize: 11,
                                fontFamily: 'PingFang SC',
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 2),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          humidityString,
                          style: const TextStyle(
                            color: Colors.black,
                            fontSize: 13,
                            fontFamily: 'PingFang SC',
                            fontWeight: FontWeight.w700,
                          ),
                          maxLines: 1,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => Row(
          children: [
            Expanded(
              flex: 5,
              child: SkeletonLoader(
                width: double.infinity,
                height: 52,
                borderRadius: tokens.radiusWeatherCard,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              flex: 4,
              child: SkeletonLoader(
                width: double.infinity,
                height: 52,
                borderRadius: tokens.radiusWeatherPill,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              flex: 4,
              child: SkeletonLoader(
                width: double.infinity,
                height: 52,
                borderRadius: tokens.radiusWeatherPill,
              ),
            ),
          ],
        ),
        error: (error, _) => Container(
          padding: const EdgeInsets.all(AppSpacing.sm),
          decoration: BoxDecoration(
            color: tokens.weatherCardBg,
            borderRadius: BorderRadius.circular(tokens.radiusWeatherCard),
          ),
          child: ErrorView(
            message: AppStrings.weatherError,
            onRetry: () => ref.refresh(homeWeatherProvider),
          ),
        ),
      ),
    );
  }
}
