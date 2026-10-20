import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/home_theme_tokens.dart';
import '../../cart/providers/cart_provider.dart';

/// Figma V10 floating bottom navigation.
///
/// [activeIndex]: 0 = Asosiy, 1 = Dorilar, 2 = Mutaxasislar.
class HomeFloatingNav extends ConsumerWidget {
  final int activeIndex;

  const HomeFloatingNav({super.key, this.activeIndex = 0});

  static const _routes = ['/', '/medicines', '/specialists'];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = Theme.of(context).extension<HomeThemeTokens>() ?? HomeThemeTokens.light;
    final cartState = ref.watch(cartProvider);

    Widget item(int index, String label, Widget Function(Color color) icon) {
      final active = index == activeIndex;
      final color = active ? Colors.white : tokens.floatingNavInactiveItemText;
      return Expanded(
        child: Semantics(
          label: label,
          button: true,
          selected: active,
          child: Material(
            color: active ? tokens.floatingNavActiveItemBg : Colors.transparent,
            borderRadius: BorderRadius.circular(30),
            child: InkWell(
              onTap: active
                  ? null
                  : () {
                      HapticFeedback.lightImpact();
                      context.go(_routes[index]);
                    },
              borderRadius: BorderRadius.circular(30),
              child: SizedBox(
                height: 55,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    icon(color),
                    const SizedBox(height: 3),
                    Text(
                      label,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: color,
                        fontSize: 10,
                        fontFamily: 'PingFang SC',
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.16,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.fade,
                      softWrap: false,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
    }

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
          padding: const EdgeInsets.only(left: 20, right: 20, top: 8, bottom: 8),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Left Pill Container
              SizedBox(
                width: 236,
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
                      item(0, AppStrings.navHome, (c) => Icon(Icons.home_outlined, color: c, size: 20)),
                      item(1, AppStrings.navMedicines, (c) => _PillIcon(color: c, size: 20)),
                      item(
                        2,
                        AppStrings.specialistsSectionTitle,
                        (c) => Icon(Icons.people_outline_rounded, color: c, size: 20),
                      ),
                    ],
                  ),
                ),
              ),
              const Spacer(),

              // Right Circular Cart Button
              Semantics(
                label: AppStrings.navCart,
                button: true,
                child: Container(
                  width: 70,
                  height: 70,
                  decoration: BoxDecoration(
                    color: cartState.totalCount > 0
                        ? tokens.floatingCartBtnBg
                        : Colors.white,
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
                        if (activeIndex != 3) {
                          context.go('/cart');
                        }
                      },
                      customBorder: const CircleBorder(),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.shopping_cart_outlined,
                                color: cartState.totalCount > 0
                                    ? Colors.white
                                    : const Color(0xFF35CA56),
                                size: 24,
                              ),
                              const SizedBox(height: 3),
                              Text(
                                AppStrings.navCart,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: cartState.totalCount > 0
                                      ? Colors.white
                                      : const Color(0xFF35CA56),
                                  fontSize: 10,
                                  fontFamily: 'PingFang SC',
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: -0.16,
                                ),
                              ),
                            ],
                          ),
                          if (cartState.totalCount > 0)
                            Positioned(
                              top: 4,
                              right: 6,
                              child: Container(
                                constraints: const BoxConstraints(minWidth: 20),
                                height: 20,
                                padding: const EdgeInsets.symmetric(horizontal: 5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFA2B36),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: Colors.white, width: 1.5),
                                  boxShadow: const [
                                    BoxShadow(
                                      color: Color(0x33000000),
                                      blurRadius: 4,
                                      offset: Offset(0, 1),
                                    ),
                                  ],
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  cartState.totalCount > 99 ? '99+' : '${cartState.totalCount}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 11,
                                    fontFamily: 'Arial',
                                    fontWeight: FontWeight.w800,
                                    height: 1.0,
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

/// Outlined diagonal capsule icon (Figma "Dorilar" tab icon).
class _PillIcon extends StatelessWidget {
  final Color color;
  final double size;

  const _PillIcon({required this.color, required this.size});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(painter: _PillPainter(color)),
    );
  }
}

class _PillPainter extends CustomPainter {
  final Color color;

  _PillPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.6
      ..strokeCap = StrokeCap.round;

    final w = size.width * 0.42;
    final h = size.height * 0.95;
    canvas.save();
    canvas.translate(size.width / 2, size.height / 2);
    canvas.rotate(math.pi / 4);
    final rect = Rect.fromCenter(center: Offset.zero, width: w, height: h);
    canvas.drawRRect(RRect.fromRectAndRadius(rect, Radius.circular(w / 2)), paint);
    canvas.drawLine(Offset(-w / 2, 0), Offset(w / 2, 0), paint);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _PillPainter oldDelegate) => oldDelegate.color != color;
}
