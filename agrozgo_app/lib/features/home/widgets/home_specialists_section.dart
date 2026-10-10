import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/home_theme_tokens.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/skeleton_loader.dart';
import '../../specialists/models/specialist_models.dart';
import '../providers/home_providers.dart';

class HomeSpecialistsSection extends ConsumerWidget {
  final VoidCallback? onViewAllTap;

  const HomeSpecialistsSection({
    super.key,
    this.onViewAllTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = Theme.of(context).extension<HomeThemeTokens>() ?? HomeThemeTokens.light;
    final specialistsAsync = ref.watch(homeSpecialistsProvider);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Header
          Padding(
            padding: const EdgeInsets.only(left: 12, right: 2, bottom: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: Text(
                    AppStrings.specialistsSectionTitle,
                    style: TextStyle(
                      color: tokens.weatherTextPrimary,
                      fontSize: 25,
                      fontFamily: 'PingFang SC',
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Semantics(
                  label: '${AppStrings.specialistsSectionTitle} - ${AppStrings.viewAll}',
                  button: true,
                  child: Material(
                    color: tokens.viewAllDarkBg,
                    borderRadius: BorderRadius.circular(tokens.radiusPill),
                    elevation: 0,
                    child: InkWell(
                      onTap: () {
                        HapticFeedback.lightImpact();
                        if (onViewAllTap != null) {
                          onViewAllTap!();
                        } else {
                          context.go('/specialists');
                        }
                      },
                      borderRadius: BorderRadius.circular(tokens.radiusPill),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 5),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(tokens.radiusPill),
                          boxShadow: const [
                            BoxShadow(
                              color: Color(0x19000000),
                              blurRadius: 20,
                              offset: Offset(0, 0),
                            ),
                          ],
                        ),
                        child: Text(
                          AppStrings.viewAll,
                          style: TextStyle(
                            color: tokens.viewAllText,
                            fontSize: 12.2,
                            fontFamily: 'PingFang SC',
                            fontWeight: FontWeight.w500,
                            height: 1.43,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 4-state representation
          specialistsAsync.when(
            data: (specialists) {
              if (specialists.isEmpty) {
                return const EmptyView(message: AppStrings.specialistsEmpty);
              }

              return Column(
                children: specialists.take(5).map((specialist) {
                  return SpecialistCard(
                    specialist: specialist,
                    tokens: tokens,
                  );
                }).toList(),
              );
            },
            loading: () => Column(
              children: [
                SkeletonLoader(
                  width: double.infinity,
                  height: 90,
                  borderRadius: tokens.radiusSpecialistCard,
                ),
                const SizedBox(height: 10),
                SkeletonLoader(
                  width: double.infinity,
                  height: 90,
                  borderRadius: tokens.radiusSpecialistCard,
                ),
              ],
            ),
            error: (error, _) => Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: tokens.specialistCardBg,
                borderRadius: BorderRadius.circular(tokens.radiusSpecialistCard),
              ),
              child: ErrorView(
                message: AppStrings.specialistsError,
                onRetry: () => ref.refresh(homeSpecialistsProvider),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class SpecialistCard extends StatelessWidget {
  final SpecialistModel specialist;
  final HomeThemeTokens tokens;

  const SpecialistCard({
    super.key,
    required this.specialist,
    required this.tokens,
  });

  @override
  Widget build(BuildContext context) {
    final ratingValue = (specialist.rating ?? 4.5).toStringAsFixed(1);
    final subtitleText = specialist.specialty ?? specialist.role;

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: tokens.specialistCardBg,
        borderRadius: BorderRadius.circular(tokens.radiusSpecialistCard),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 15,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Avatar
          Container(
            width: 70,
            height: 70,
            decoration: BoxDecoration(
              color: tokens.specialistAvatarBg,
              borderRadius: BorderRadius.circular(tokens.radiusSpecialistAvatar),
              border: Border.all(
                color: Colors.white,
                width: 0.5,
              ),
            ),
            alignment: Alignment.center,
            child: const Icon(
              Icons.people_outline_rounded,
              color: Color(0xFF35CA56),
              size: 30,
            ),
          ),
          const SizedBox(width: 12),

          // Name and Role
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  specialist.name,
                  style: TextStyle(
                    color: tokens.weatherTextPrimary,
                    fontSize: 18,
                    fontFamily: 'Arial',
                    fontWeight: FontWeight.w400,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                Text(
                  subtitleText,
                  style: TextStyle(
                    color: tokens.weatherTextPrimary.withValues(alpha: 0.50),
                    fontSize: 14,
                    fontFamily: 'Arial',
                    fontWeight: FontWeight.w400,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),

          // Right badges: Rating + Batafsil
          Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // Rating Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 5),
                decoration: BoxDecoration(
                  color: tokens.specialistRatingBg,
                  borderRadius: BorderRadius.circular(tokens.radiusPill),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x19000000),
                      blurRadius: 20,
                      offset: Offset(0, 0),
                    ),
                  ],
                ),
                child: Text(
                  ratingValue,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontFamily: 'PingFang SC',
                    fontWeight: FontWeight.w500,
                    height: 1.74,
                  ),
                ),
              ),
              const SizedBox(height: 8),

              // Batafsil Button
              Semantics(
                label: '${specialist.name} - ${AppStrings.details}',
                button: true,
                child: Material(
                  color: tokens.specialistDetailBtnBg,
                  borderRadius: BorderRadius.circular(tokens.radiusPill),
                  child: InkWell(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      context.go('/specialists');
                    },
                    borderRadius: BorderRadius.circular(tokens.radiusPill),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 5),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(tokens.radiusPill),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x19000000),
                            blurRadius: 20,
                            offset: Offset(0, 0),
                          ),
                        ],
                      ),
                      child: Text(
                        AppStrings.details,
                        style: TextStyle(
                          color: tokens.specialistDetailBtnText,
                          fontSize: 10,
                          fontFamily: 'PingFang SC',
                          fontWeight: FontWeight.w500,
                          height: 1.74,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
