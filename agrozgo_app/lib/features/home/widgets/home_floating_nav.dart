import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/home_theme_tokens.dart';
import '../../cart/providers/cart_provider.dart';

class HomeFloatingNav extends ConsumerWidget {
  const HomeFloatingNav({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = Theme.of(context).extension<HomeThemeTokens>() ?? HomeThemeTokens.light;
    final cartState = ref.watch(cartProvider);

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            tokens.screenBackground.withValues(alpha: 0.0),
            tokens.screenBackground,
          ],
        ),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Left Pill Container
              Expanded(
                child: Container(
                  height: 65,
                  padding: const EdgeInsets.all(5),
                  decoration: BoxDecoration(
                    color: tokens.floatingNavBg,
                    borderRadius: BorderRadius.circular(tokens.radiusFloatingNav),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x33000000),
                        blurRadius: 30,
                        offset: Offset(0, 0),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      // Active: Asosiy
                      Expanded(
                        child: Container(
                          height: 55,
                          decoration: BoxDecoration(
                            color: tokens.floatingNavActiveItemBg,
                            borderRadius: BorderRadius.circular(30),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.home_rounded,
                                color: Colors.white,
                                size: 18,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                AppStrings.navHome,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontFamily: 'Arial',
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: -0.16,
                                ),
                                maxLines: 1,
                              ),
                            ],
                          ),
                        ),
                      ),

                      // Inactive: Dorilar
                      Expanded(
                        child: InkWell(
                          onTap: () {
                            HapticFeedback.lightImpact();
                            context.push('/medicines');
                          },
                          borderRadius: BorderRadius.circular(30),
                          child: SizedBox(
                            height: 55,
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.medication_outlined,
                                  color: tokens.floatingNavInactiveItemText,
                                  size: 18,
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  AppStrings.navMedicines,
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: tokens.floatingNavInactiveItemText,
                                    fontSize: 10,
                                    fontFamily: 'Arial',
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: -0.16,
                                  ),
                                  maxLines: 1,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),

                      // Inactive: Mutaxasislar
                      Expanded(
                        child: InkWell(
                          onTap: () {
                            HapticFeedback.lightImpact();
                            context.push('/specialists');
                          },
                          borderRadius: BorderRadius.circular(30),
                          child: SizedBox(
                            height: 55,
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.people_outline_rounded,
                                  color: tokens.floatingNavInactiveItemText,
                                  size: 18,
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  AppStrings.specialistsSectionTitle,
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: tokens.floatingNavInactiveItemText,
                                    fontSize: 10,
                                    fontFamily: 'Arial',
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: -0.16,
                                  ),
                                  maxLines: 1,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Right Circular Cart Button
              Semantics(
                label: AppStrings.navCart,
                button: true,
                child: Container(
                  width: 65,
                  height: 65,
                  decoration: BoxDecoration(
                    color: tokens.floatingCartBtnBg,
                    shape: BoxShape.circle,
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x33000000),
                        blurRadius: 30,
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
                        context.push('/cart');
                      },
                      customBorder: const CircleBorder(),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.shopping_cart_outlined,
                                color: Colors.white,
                                size: 18,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                AppStrings.navCart,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontFamily: 'Arial',
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: -0.16,
                                ),
                              ),
                            ],
                          ),
                          if (cartState.totalCount > 0)
                            Positioned(
                              top: 6,
                              right: 6,
                              child: Container(
                                constraints: const BoxConstraints(minWidth: 16),
                                height: 16,
                                padding: const EdgeInsets.symmetric(horizontal: 4),
                                decoration: BoxDecoration(
                                  color: tokens.badgeBg,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  '${cartState.totalCount}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 9,
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
      ),
    );
  }
}
