import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../core/constants/app_svg_icons.dart';

/// Animated AGROZGO Symbol where the outer green badge swings left and right (-15° to +15°),
/// while the inner white logo (arch & bar) remains pinned in place.
class AgrozLoadingSymbol extends StatefulWidget {
  final double size;
  final double maxAngleDegrees;
  final Duration swingDuration;
  final bool enablePulsing;
  final bool showSpinner;
  final String? statusText;

  const AgrozLoadingSymbol({
    super.key,
    this.size = 140,
    this.maxAngleDegrees = 15.0,
    this.swingDuration = const Duration(milliseconds: 750),
    this.enablePulsing = false,
    this.showSpinner = false,
    this.statusText,
  });

  @override
  State<AgrozLoadingSymbol> createState() => _AgrozLoadingSymbolState();
}

class _AgrozLoadingSymbolState extends State<AgrozLoadingSymbol>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _rotationAnimation;
  late final Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: widget.swingDuration,
    );

    final maxRadians = widget.maxAngleDegrees * (math.pi / 180.0);

    // Smooth pendulum swing between -15° and +15°
    _rotationAnimation = Tween<double>(
      begin: -maxRadians,
      end: maxRadians,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeInOutSine,
      ),
    );

    _scaleAnimation = Tween<double>(
      begin: widget.enablePulsing ? 0.96 : 1.0,
      end: widget.enablePulsing ? 1.04 : 1.0,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeInOut,
      ),
    );

    _controller.repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Semantics(
          label: 'AGROZGO Symbol',
          child: SizedBox(
            width: widget.size,
            height: widget.size,
            child: AnimatedBuilder(
              animation: _controller,
              builder: (context, _) {
                final scale = _scaleAnimation.value;
                final angle = _rotationAnimation.value;

                return Transform.scale(
                  scale: scale,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // 1. Surrounding Green Badge (Animated: -15° to +15° rotation)
                      Transform.rotate(
                        angle: angle,
                        alignment: Alignment.center,
                        child: SvgPicture.string(
                          kAgrozGoGreenBadgeSvg,
                          width: widget.size,
                          height: widget.size,
                          fit: BoxFit.contain,
                        ),
                      ),

                      // 2. Inner White Logo: PINNED (Stationary, no rotation)
                      SvgPicture.string(
                        kAgrozGoWhiteLogoSvg,
                        width: widget.size,
                        height: widget.size,
                        fit: BoxFit.contain,
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ),
        if (widget.showSpinner) ...[
          const SizedBox(height: 24),
          const SizedBox(
            width: 22,
            height: 22,
            child: CircularProgressIndicator(
              strokeWidth: 2.4,
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF35CA56)),
            ),
          ),
        ],
        if (widget.statusText != null) ...[
          const SizedBox(height: 14),
          Text(
            widget.statusText!,
            style: const TextStyle(
              fontSize: 13,
              fontFamily: 'PingFang SC',
              fontWeight: FontWeight.w500,
              color: Color(0xFF8E8E93),
            ),
          ),
        ],
      ],
    );
  }
}
