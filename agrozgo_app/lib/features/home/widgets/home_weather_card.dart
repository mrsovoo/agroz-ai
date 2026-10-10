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
              // 1. Left Weather Card
              Expanded(
                flex: 5,
                child: Container(
                  constraints: const BoxConstraints(minHeight: 52),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: tokens.weatherCardBg,
                    borderRadius: BorderRadius.circular(tokens.radiusWeatherCard),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x19000000),
                        blurRadius: 20,
                        offset: Offset(0, 0),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Icon(
                        isDay ? Icons.wb_sunny_rounded : Icons.nightlight_round,
                        color: isDay ? Colors.amber.shade600 : Colors.indigo.shade400,
                        size: 32,
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
                              style: TextStyle(
                                color: tokens.weatherTextPrimary,
                                fontSize: 16,
                                fontFamily: 'Arial',
                                fontWeight: FontWeight.w400,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              tempString,
                              style: TextStyle(
                                color: tokens.weatherTextSecondary,
                                fontSize: 13,
                                fontFamily: 'Arial',
                                fontWeight: FontWeight.w400,
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

              // 2. Wind Pill
              Expanded(
                flex: 4,
                child: Container(
                  constraints: const BoxConstraints(minHeight: 52),
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
                  decoration: BoxDecoration(
                    color: tokens.weatherPillBg,
                    borderRadius: BorderRadius.circular(tokens.radiusWeatherPill),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.air,
                            size: 11,
                            color: tokens.weatherTextPrimary.withValues(alpha: 0.85),
                          ),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              AppStrings.wind,
                              style: TextStyle(
                                color: tokens.weatherTextPrimary.withValues(alpha: 0.85),
                                fontSize: 11,
                                fontFamily: 'Arial',
                                fontWeight: FontWeight.w400,
                                letterSpacing: -0.16,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      Text(
                        windString,
                        style: TextStyle(
                          color: tokens.weatherTextPrimary,
                          fontSize: 14,
                          fontFamily: 'Arial',
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.16,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // 3. Humidity Pill
              Expanded(
                flex: 4,
                child: Container(
                  constraints: const BoxConstraints(minHeight: 52),
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
                  decoration: BoxDecoration(
                    color: tokens.weatherPillBg,
                    borderRadius: BorderRadius.circular(tokens.radiusWeatherPill),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.water_drop_outlined,
                            size: 11,
                            color: tokens.weatherTextPrimary.withValues(alpha: 0.85),
                          ),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              AppStrings.humidity,
                              style: TextStyle(
                                color: tokens.weatherTextPrimary.withValues(alpha: 0.85),
                                fontSize: 11,
                                fontFamily: 'Arial',
                                fontWeight: FontWeight.w400,
                                letterSpacing: -0.16,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      Text(
                        humidityString,
                        style: TextStyle(
                          color: tokens.weatherTextPrimary,
                          fontSize: 14,
                          fontFamily: 'Arial',
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.16,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
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
