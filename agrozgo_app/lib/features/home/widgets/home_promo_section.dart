import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/home_theme_tokens.dart';

class HomePromoSection extends StatelessWidget {
  final VoidCallback? onViewAllTap;
  final VoidCallback? onBannerTap;

  const HomePromoSection({
    super.key,
    this.onViewAllTap,
    this.onBannerTap,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<HomeThemeTokens>() ?? HomeThemeTokens.light;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Expanded(
                child: Text(
                  AppStrings.forYouTitle,
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.4,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Semantics(
                label: '${AppStrings.forYouTitle} - ${AppStrings.viewAll}',
                button: true,
                child: Material(
                  color: tokens.viewAllBlueBg,
                  borderRadius: BorderRadius.circular(tokens.radiusPill),
                  child: InkWell(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      if (onViewAllTap != null) {
                        onViewAllTap!();
                      } else {
                        context.push('/news');
                      }
                    },
                    borderRadius: BorderRadius.circular(tokens.radiusPill),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.lg,
                        vertical: 6,
                      ),
                      child: Text(
                        AppStrings.viewAll,
                        style: TextStyle(
                          color: tokens.viewAllText,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          // Banner Card
          Semantics(
            label: AppStrings.promoTitle,
            button: true,
            child: Material(
              color: tokens.promoBannerBg,
              borderRadius: BorderRadius.circular(tokens.radiusPromoCard),
              clipBehavior: Clip.antiAlias,
              child: InkWell(
                onTap: () {
                  HapticFeedback.lightImpact();
                  if (onBannerTap != null) {
                    onBannerTap!();
                  } else {
                    context.push('/promo');
                  }
                },
                child: Container(
                  height: 150,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(tokens.radiusPromoCard),
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Color(0xFF1E293B),
                        Color(0xFF334155),
                      ],
                    ),
                  ),
                  child: Stack(
                    children: [
                      // Decorative background elements
                      Positioned(
                        right: -20,
                        top: -20,
                        child: Container(
                          width: 140,
                          height: 140,
                          decoration: BoxDecoration(
                            color: Colors.amber.withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),

                      // Content text
                      Padding(
                        padding: const EdgeInsets.all(AppSpacing.lg),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Flexible(
                                  child: Text(
                                    AppStrings.promoTitle,
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: -0.5,
                                      color: Color(0xFFFBBF24), // Amber/Yellow
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                const SizedBox(width: AppSpacing.xs),
                                const Icon(
                                  Icons.trending_up,
                                  color: Color(0xFFFBBF24),
                                  size: 20,
                                ),
                              ],
                            ),
                            const SizedBox(height: AppSpacing.xs),
                            ConstrainedBox(
                              constraints: const BoxConstraints(maxWidth: 180),
                              child: const Text(
                                AppStrings.promoSubtitle,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.white70,
                                  height: 1.3,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Bottom right "Ko'rish" button
                      Positioned(
                        right: AppSpacing.lg,
                        bottom: AppSpacing.md,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.lg,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: tokens.promoButtonBg,
                            borderRadius: BorderRadius.circular(tokens.radiusPill),
                            boxShadow: const [
                              BoxShadow(
                                color: Colors.black26,
                                blurRadius: 4,
                                offset: Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Text(
                            AppStrings.view,
                            style: TextStyle(
                              color: tokens.promoButtonText,
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
