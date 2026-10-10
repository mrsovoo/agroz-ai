import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/home_theme_tokens.dart';
import '../../cart/providers/cart_provider.dart';

class HomeFloatingNav extends ConsumerWidget {
  const HomeFloatingNav({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = Theme.of(context).extension<HomeThemeTokens>() ?? HomeThemeTokens.light;
    final cartState = ref.watch(cartProvider);

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.only(
          left: AppSpacing.lg,
          right: AppSpacing.lg,
          bottom: AppSpacing.sm,
        ),
        child: Row(
          children: [
            // Left Pill Bar
            Expanded(
              child: Container(
                height: 64,
                padding: const EdgeInsets.all(AppSpacing.xs),
                decoration: BoxDecoration(
                  color: tokens.floatingNavBg,
                  borderRadius: BorderRadius.circular(tokens.radiusFloatingNav),
                  border: Border.all(color: tokens.floatingNavBorder),
                  boxShadow: tokens.floatingNavShadow,
                ),
                child: Row(
                  children: [
                    // Active Tab: Asosiy
                    Expanded(
                      child: Container(
                        height: double.infinity,
                        decoration: BoxDecoration(
                          color: tokens.floatingNavActiveItemBg,
                          borderRadius: BorderRadius.circular(tokens.radiusFloatingNav - 4),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.home_rounded,
                              color: Colors.white,
                              size: 20,
                            ),
                            const SizedBox(height: 2),
                            FittedBox(
                              fit: BoxFit.scaleDown,
                              child: Text(
                                AppStrings.navHome,
                                style: TextStyle(
                                  color: tokens.floatingNavActiveItemText,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Inactive Tab: Dorilar
                    Expanded(
                      child: InkWell(
                        onTap: () {
                          HapticFeedback.lightImpact();
                          context.push('/medicines');
                        },
                        borderRadius: BorderRadius.circular(tokens.radiusFloatingNav),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.medication_outlined,
                              color: tokens.floatingNavInactiveItemText,
                              size: 20,
                            ),
                            const SizedBox(height: 2),
                            FittedBox(
                              fit: BoxFit.scaleDown,
                              child: Text(
                                AppStrings.navMedicines,
                                style: TextStyle(
                                  color: tokens.floatingNavInactiveItemText,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Inactive Tab: Mutaxassislar
                    Expanded(
                      child: InkWell(
                        onTap: () {
                          HapticFeedback.lightImpact();
                          context.push('/specialists');
                        },
                        borderRadius: BorderRadius.circular(tokens.radiusFloatingNav),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.people_outline_rounded,
                              color: tokens.floatingNavInactiveItemText,
                              size: 20,
                            ),
                            const SizedBox(height: 2),
                            FittedBox(
                              fit: BoxFit.scaleDown,
                              child: Text(
                                AppStrings.navSpecialists,
                                style: TextStyle(
                                  color: tokens.floatingNavInactiveItemText,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: AppSpacing.md),

            // Right Circular Cart Button
            Semantics(
              label: AppStrings.navCart,
              button: true,
              child: Material(
                color: tokens.floatingCartBtnBg,
                shape: const CircleBorder(),
                elevation: 4,
                shadowColor: Colors.black26,
                child: InkWell(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    context.push('/cart');
                  },
                  customBorder: const CircleBorder(),
                  child: SizedBox(
                    width: 64,
                    height: 64,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.shopping_cart_outlined,
                              color: tokens.floatingCartBtnIcon,
                              size: 22,
                            ),
                            const SizedBox(height: 2),
                            FittedBox(
                              fit: BoxFit.scaleDown,
                              child: Text(
                                AppStrings.navCart,
                                style: TextStyle(
                                  color: tokens.floatingCartBtnIcon,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (cartState.totalCount > 0)
                          Positioned(
                            top: 8,
                            right: 8,
                            child: Container(
                              padding: const EdgeInsets.all(2),
                              constraints: const BoxConstraints(
                                minWidth: 18,
                                minHeight: 18,
                              ),
                              decoration: const BoxDecoration(
                                color: Color(0xFFEF4444),
                                shape: BoxShape.circle,
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                '${cartState.totalCount}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
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
      ),
    );
  }
}
