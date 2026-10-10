import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/config/app_config.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/home_theme_tokens.dart';
import '../providers/home_providers.dart';

class HomeHeader extends ConsumerWidget {
  final VoidCallback? onProfileTap;
  final VoidCallback? onNotificationTap;

  const HomeHeader({
    super.key,
    this.onProfileTap,
    this.onNotificationTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = Theme.of(context).extension<HomeThemeTokens>() ?? HomeThemeTokens.light;
    final unreadCount = ref.watch(unreadNotificationsCountProvider);

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.sm,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Profile Button
          Semantics(
            label: AppStrings.profile,
            button: true,
            child: Material(
              color: tokens.headerButtonBg,
              shape: CircleBorder(
                side: BorderSide(color: tokens.headerButtonBorder),
              ),
              elevation: 0.5,
              shadowColor: Colors.black12,
              child: InkWell(
                onTap: () {
                  HapticFeedback.lightImpact();
                  if (onProfileTap != null) {
                    onProfileTap!();
                  } else {
                    context.push('/profile');
                  }
                },
                customBorder: const CircleBorder(),
                child: const SizedBox(
                  width: AppSpacing.minTouchTarget,
                  height: AppSpacing.minTouchTarget,
                  child: Icon(
                    Icons.person_outline,
                    color: Color(0xFF1E293B),
                    size: 22,
                  ),
                ),
              ),
            ),
          ),

          // Logo & Location
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  const Text(
                    'AGROZ',
                    style: TextStyle(
                      fontFamily: 'sans-serif',
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.5,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                  Text(
                    'GO',
                    style: TextStyle(
                      fontFamily: 'sans-serif',
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.5,
                      color: AppConfig.flavor.isBusiness
                          ? const Color(0xFF0F766E)
                          : const Color(0xFF22C55E),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 2),
              const Text(
                AppStrings.defaultLocation,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF64748B),
                ),
              ),
            ],
          ),

          // Notification Button with Badge
          Semantics(
            label: AppStrings.notifications,
            button: true,
            child: Material(
              color: tokens.headerButtonBg,
              shape: CircleBorder(
                side: BorderSide(color: tokens.headerButtonBorder),
              ),
              elevation: 0.5,
              shadowColor: Colors.black12,
              child: InkWell(
                onTap: () {
                  HapticFeedback.lightImpact();
                  if (onNotificationTap != null) {
                    onNotificationTap!();
                  } else {
                    context.push('/notifications');
                  }
                },
                customBorder: const CircleBorder(),
                child: SizedBox(
                  width: AppSpacing.minTouchTarget,
                  height: AppSpacing.minTouchTarget,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      const Icon(
                        Icons.notifications_none,
                        color: Color(0xFF1E293B),
                        size: 24,
                      ),
                      if (unreadCount > 0)
                        Positioned(
                          top: 6,
                          right: 6,
                          child: Container(
                            padding: const EdgeInsets.all(2),
                            constraints: const BoxConstraints(
                              minWidth: 16,
                              minHeight: 16,
                            ),
                            decoration: BoxDecoration(
                              color: tokens.badgeBg,
                              shape: BoxShape.circle,
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              '$unreadCount',
                              style: TextStyle(
                                color: tokens.badgeText,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                              textAlign: TextAlign.center,
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
