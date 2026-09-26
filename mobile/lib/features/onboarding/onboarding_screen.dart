import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants/app_colors.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _current = 0;

  static const _pages = [
    _OnboardingData(
      subtitle: 'sizning aqlli yordamchingiz',
      illustration: Icons.biotech_outlined,
      illustrationColor: Color(0xFF028E11),
      description:
          "O'simlik yoki chorvada muammo paydo bo'lsa, uni aniqlash uchun uzoq izlanmang. "
          "Muammoning rasmini yuboring va Agroz AI'dan dastlabki tahlil hamda yo'nalish oling.",
    ),
    _OnboardingData(
      subtitle: 'Mutaxassislar bilan bog\'laning',
      illustration: Icons.people_alt_outlined,
      illustrationColor: Color(0xFF0277BD),
      description: "Yaqin atrofdagi agronom va veterinarlarni toping. "
          "Xaritada joylashuvini ko'ring, telefonda bog'laning va muammoingizni tez hal qiling.",
    ),
    _OnboardingData(
      subtitle: "Kerakli dorini toping va buyurtma bering",
      illustration: Icons.medication_outlined,
      illustrationColor: Color(0xFF558B2F),
      description:
          "AI tavsiyasidan so'ng o'simlik yoki chorva uchun mos mahsulotlarni ko'ring. "
          "Dorixonani tanlang, mahsulotni savatga qo'shing va buyurtma bering. "
          "To'lovni yetkazib berganda naqd amalga oshiring.",
    ),
  ];

  Future<void> _next() async {
    if (_current < _pages.length - 1) {
      _controller.nextPage(
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeInOut,
      );
    } else {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('onboarding_done', true);
      if (mounted) context.go('/auth/phone');
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // Header — fixed
            const SizedBox(height: 28),
            const Text(
              'Agroz AI',
              style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w600,
                  letterSpacing: -0.3),
            ),
            const SizedBox(height: 6),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              child: Text(
                _pages[_current].subtitle,
                key: ValueKey(_current),
                style: const TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
                textAlign: TextAlign.center,
              ),
            ),

            // PageView
            Expanded(
              child: PageView.builder(
                controller: _controller,
                onPageChanged: (i) => setState(() => _current = i),
                itemCount: _pages.length,
                itemBuilder: (ctx, i) => _OnboardingPage(data: _pages[i]),
              ),
            ),

            // Dots + Button row
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
              child: Row(
                children: [
                  // Dots
                  Row(
                    children: List.generate(_pages.length, (i) {
                      final active = i == _current;
                      return AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        margin: const EdgeInsets.only(right: 6),
                        width: active ? 22 : 7,
                        height: 7,
                        decoration: BoxDecoration(
                          color: active
                              ? AppColors.primary
                              : const Color(0xFFD1D5DB),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      );
                    }),
                  ),
                  const Spacer(),
                  // Davom etish button
                  GestureDetector(
                    onTap: _next,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 22, vertical: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF3F4F6),
                        borderRadius: BorderRadius.circular(30),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _current == _pages.length - 1
                                ? 'Boshlash'
                                : 'Davom etish',
                            style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF111111)),
                          ),
                          const SizedBox(width: 6),
                          const Icon(Icons.arrow_forward_rounded,
                              size: 16, color: Color(0xFF374151)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OnboardingData {
  final String subtitle;
  final IconData illustration;
  final Color illustrationColor;
  final String description;

  const _OnboardingData({
    required this.subtitle,
    required this.illustration,
    required this.illustrationColor,
    required this.description,
  });
}

class _OnboardingPage extends StatelessWidget {
  final _OnboardingData data;
  const _OnboardingPage({required this.data});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          const SizedBox(height: 24),
          // Illustration card — big rounded rectangle like mockup
          Expanded(
            flex: 5,
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: const Color(0xFFF3F4F6),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Center(
                child: Icon(
                  data.illustration,
                  size: 100,
                  color: data.illustrationColor.withValues(alpha: 0.35),
                ),
              ),
            ),
          ),
          const SizedBox(height: 32),
          // Description
          Expanded(
            flex: 3,
            child: Text(
              data.description,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 15,
                color: Color(0xFF374151),
                height: 1.6,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
