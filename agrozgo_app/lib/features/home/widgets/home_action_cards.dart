import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/home_theme_tokens.dart';

class HomeActionCards extends StatelessWidget {
  final VoidCallback? onSpecialistsTap;
  final VoidCallback? onMedicinesTap;

  const HomeActionCards({
    super.key,
    this.onSpecialistsTap,
    this.onMedicinesTap,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<HomeThemeTokens>() ?? HomeThemeTokens.light;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Row(
        children: [
          // 1. Mutaxassislar Card
          Expanded(
            child: _ActionCard(
              title: AppStrings.specialistsTitle,
              subtitle: AppStrings.specialistsSubtitle,
              backgroundColor: tokens.actionSpecialistsBg,
              bubbleColor: tokens.actionBubbleBg,
              icon: Icons.people_outline_rounded,
              borderRadius: tokens.radiusActionCard,
              onTap: () {
                HapticFeedback.lightImpact();
                if (onSpecialistsTap != null) {
                  onSpecialistsTap!();
                } else {
                  context.push('/specialists');
                }
              },
            ),
          ),
          const SizedBox(width: AppSpacing.md),

          // 2. Dorilar Card
          Expanded(
            child: _ActionCard(
              title: AppStrings.medicinesTitle,
              subtitle: AppStrings.medicinesSubtitle,
              backgroundColor: tokens.actionMedicinesBg,
              bubbleColor: tokens.actionBubbleBg,
              icon: Icons.medication_outlined,
              borderRadius: tokens.radiusActionCard,
              onTap: () {
                HapticFeedback.lightImpact();
                if (onMedicinesTap != null) {
                  onMedicinesTap!();
                } else {
                  context.push('/medicines');
                }
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final Color backgroundColor;
  final Color bubbleColor;
  final IconData icon;
  final double borderRadius;
  final VoidCallback onTap;

  const _ActionCard({
    required this.title,
    required this.subtitle,
    required this.backgroundColor,
    required this.bubbleColor,
    required this.icon,
    required this.borderRadius,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: title,
      button: true,
      child: Material(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(borderRadius),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Container(
            constraints: const BoxConstraints(minHeight: 125),
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Stack(
              children: [
                // Top-left Titles
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.3,
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        height: 1.25,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),

                // Bottom-right decorative icon bubble
                Positioned(
                  right: -8,
                  bottom: -8,
                  child: Container(
                    width: 58,
                    height: 58,
                    decoration: BoxDecoration(
                      color: bubbleColor,
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: Icon(
                      icon,
                      color: Colors.white,
                      size: 28,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
