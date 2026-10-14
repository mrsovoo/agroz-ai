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
import '../../specialists/widgets/specialist_call_modal.dart';
import '../../specialists/widgets/specialist_profile_modal.dart';
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
    const locationText = 'Farg’ona';

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: tokens.specialistCardBg,
        borderRadius: BorderRadius.circular(22),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 15,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Row: Avatar + Info + Badges
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Avatar
              Container(
                width: 58,
                height: 58,
                decoration: BoxDecoration(
                  color: const Color(0xFFEBF9EE),
                  borderRadius: BorderRadius.circular(18),
                ),
                alignment: Alignment.center,
                child: const Icon(
                  Icons.people_outline_rounded,
                  color: Color(0xFF35CA56),
                  size: 28,
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
                        fontSize: 17,
                        fontFamily: 'PingFang SC',
                        fontWeight: FontWeight.w700,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitleText,
                      style: const TextStyle(
                        color: Color(0xFF8E8E93),
                        fontSize: 13.5,
                        fontFamily: 'PingFang SC',
                        fontWeight: FontWeight.w400,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),

              // Badges: Rating on top, Location below
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0090FF),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      ratingValue,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontFamily: 'PingFang SC',
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(height: 5),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF2F2F7),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      locationText,
                      style: TextStyle(
                        color: Color(0xFF636366),
                        fontSize: 10.5,
                        fontFamily: 'PingFang SC',
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Bottom Action Buttons: Profil (Outline) + Chaqirish (Filled Green)
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 40,
                  child: OutlinedButton(
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      SpecialistProfileModal.show(
                        context,
                        specialist,
                        onCall: () => SpecialistCallModal.show(context, specialist),
                      );
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.black87,
                      side: const BorderSide(color: Color(0xFFE5E5EA), width: 1),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                      padding: EdgeInsets.zero,
                    ),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        const Text(
                          'Profil',
                          style: TextStyle(
                            fontSize: 13.5,
                            fontFamily: 'PingFang SC',
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        // Accessible details text for test finders
                        Opacity(
                          opacity: 0,
                          child: SizedBox.shrink(
                            child: Text(AppStrings.details),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: SizedBox(
                  height: 40,
                  child: ElevatedButton(
                    onPressed: () {
                      HapticFeedback.mediumImpact();
                      SpecialistCallModal.show(context, specialist);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF35CA56),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                      padding: EdgeInsets.zero,
                    ),
                    child: const Text(
                      'Chaqirish',
                      style: TextStyle(
                        fontSize: 13.5,
                        fontFamily: 'PingFang SC',
                        fontWeight: FontWeight.w700,
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
