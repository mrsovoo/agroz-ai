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
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: weatherAsync.when(
        data: (weather) {
          final isDay = weather.isDay;
          final timeOfDayTitle = isDay ? AppStrings.daytime : AppStrings.nighttime;
          final tempString = '${weather.temp > 0 ? "+" : ""}${weather.temp}°C';
          final windString = '${weather.wind} ${AppStrings.windUnit}';
          final humidityString = '${weather.humidity}%';

          return Row(
            children: [
              // 1. Temp & Time Segment
              Expanded(
                flex: 4,
                child: Container(
                  constraints: const BoxConstraints(minHeight: 64),
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.xs,
                    vertical: AppSpacing.xs,
                  ),
                  decoration: BoxDecoration(
                    color: tokens.weatherCardBg,
                    borderRadius: BorderRadius.circular(tokens.radiusWeatherCard),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        isDay ? Icons.wb_sunny_rounded : Icons.nightlight_round,
                        color: isDay ? Colors.amber.shade600 : Colors.indigo.shade400,
                        size: 26,
                      ),
                      const SizedBox(width: AppSpacing.xxs),
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
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              tempString,
                              style: TextStyle(
                                color: tokens.weatherTextPrimary,
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
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
              const SizedBox(width: AppSpacing.xs),

              // 2. Wind Segment
              Expanded(
                flex: 3,
                child: Container(
                  constraints: const BoxConstraints(minHeight: 64),
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.xs,
                    vertical: AppSpacing.xs,
                  ),
                  decoration: BoxDecoration(
                    color: tokens.weatherCardBg,
                    borderRadius: BorderRadius.circular(tokens.radiusWeatherCard),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.air,
                            size: 13,
                            color: tokens.weatherTextSecondary,
                          ),
                          const SizedBox(width: AppSpacing.xxs),
                          Flexible(
                            child: Text(
                              AppStrings.wind,
                              style: TextStyle(
                                fontSize: 10,
                                color: tokens.weatherTextSecondary,
                                fontWeight: FontWeight.w500,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        windString,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: tokens.weatherTextPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.xs),

              // 3. Humidity Segment
              Expanded(
                flex: 3,
                child: Container(
                  constraints: const BoxConstraints(minHeight: 64),
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.xs,
                    vertical: AppSpacing.xs,
                  ),
                  decoration: BoxDecoration(
                    color: tokens.weatherCardBg,
                    borderRadius: BorderRadius.circular(tokens.radiusWeatherCard),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.water_drop_outlined,
                            size: 13,
                            color: tokens.weatherTextSecondary,
                          ),
                          const SizedBox(width: AppSpacing.xxs),
                          Flexible(
                            child: Text(
                              AppStrings.humidity,
                              style: TextStyle(
                                fontSize: 10,
                                color: tokens.weatherTextSecondary,
                                fontWeight: FontWeight.w500,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        humidityString,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: tokens.weatherTextPrimary,
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
              flex: 4,
              child: SkeletonLoader(
                width: double.infinity,
                height: 64,
                borderRadius: tokens.radiusWeatherCard,
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              flex: 3,
              child: SkeletonLoader(
                width: double.infinity,
                height: 64,
                borderRadius: tokens.radiusWeatherCard,
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              flex: 3,
              child: SkeletonLoader(
                width: double.infinity,
                height: 64,
                borderRadius: tokens.radiusWeatherCard,
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
