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
        horizontal: AppSpacing.sm,
        vertical: 8,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Left Profile Button
          Semantics(
            label: AppStrings.profile,
            button: true,
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: tokens.headerButtonBg,
                shape: BoxShape.circle,
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x19000000),
                    blurRadius: 20,
                    offset: Offset(0, 0),
                  ),
                ],
              ),
              child: Material(
                color: Colors.transparent,
                shape: const CircleBorder(),
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
                  child: Center(
                    child: Icon(
                      Icons.person_outline,
                      color: tokens.weatherTextPrimary,
                      size: 22,
                    ),
                  ),
                ),
              ),
            ),
          ),

          // Center Logo & Location
          Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(
                    'AGROZ',
                    style: TextStyle(
                      fontFamily: 'Arial',
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.5,
                      color: tokens.weatherTextPrimary,
                    ),
                  ),
                  Text(
                    'GO',
                    style: TextStyle(
                      fontFamily: 'Arial',
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.5,
                      color: AppConfig.flavor.isBusiness
                          ? const Color(0xFF0F766E)
                          : tokens.actionMedicinesBg,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 2),
              Text(
                AppStrings.defaultLocation,
                style: TextStyle(
                  color: tokens.weatherTextPrimary,
                  fontSize: 10,
                  fontFamily: 'Arial',
                  fontWeight: FontWeight.w400,
                ),
              ),
            ],
          ),

          // Right Notification Button with Badge
          Semantics(
            label: AppStrings.notifications,
            button: true,
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: tokens.headerButtonBg,
                shape: BoxShape.circle,
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x19000000),
                    blurRadius: 20,
                    offset: Offset(0, 0),
                  ),
                ],
              ),
              child: Stack(
                clipBehavior: Clip.none,
                alignment: Alignment.center,
                children: [
                  Material(
                    color: Colors.transparent,
                    shape: const CircleBorder(),
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
                      child: Center(
                        child: Icon(
                          Icons.notifications_none_rounded,
                          color: tokens.weatherTextPrimary,
                          size: 24,
                        ),
                      ),
                    ),
                  ),
                  if (unreadCount > 0)
                    Positioned(
                      left: 26,
                      top: -4,
                      child: Container(
                        constraints: const BoxConstraints(minWidth: 18),
                        height: 18,
                        padding: const EdgeInsets.symmetric(horizontal: 5),
                        decoration: BoxDecoration(
                          color: tokens.badgeBg,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: const [
                            BoxShadow(
                              color: Color(0x0C000000),
                              blurRadius: 2,
                              offset: Offset(0, 1),
                            ),
                          ],
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          '$unreadCount',
                          style: TextStyle(
                            color: tokens.badgeText,
                            fontSize: 10,
                            fontFamily: 'Arial',
                            fontWeight: FontWeight.w700,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
