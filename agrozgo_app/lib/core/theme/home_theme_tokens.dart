import 'package:flutter/material.dart';

/// ThemeExtension containing design tokens for Home screen extracted from Figma/Design.
/// Values estimated from screenshot are noted as `[taxmin]`.
@immutable
class HomeThemeTokens extends ThemeExtension<HomeThemeTokens> {
  // --- Colors ---
  final Color screenBackground; // [taxmin: #F8FAFC]
  final Color headerButtonBg; // [taxmin: #FFFFFF]
  final Color headerButtonBorder; // [taxmin: #E2E8F0]
  final Color badgeBg; // [taxmin: #EF4444]
  final Color badgeText; // [taxmin: #FFFFFF]

  final Color weatherCardBg; // [taxmin: #F1F5F9]
  final Color weatherTextPrimary; // [taxmin: #1E293B]
  final Color weatherTextSecondary; // [taxmin: #64748B]

  final Color actionSpecialistsBg; // [taxmin: #0084FF]
  final Color actionMedicinesBg; // [taxmin: #22C55E]
  final Color actionCardText; // [taxmin: #FFFFFF]
  final Color actionBubbleBg; // [taxmin: Colors.white24]

  final Color viewAllBlueBg; // [taxmin: #0084FF]
  final Color viewAllDarkBg; // [taxmin: #374151]
  final Color viewAllText; // [taxmin: #FFFFFF]

  final Color promoBannerBg; // [taxmin: #1E293B]
  final Color promoButtonBg; // [taxmin: #FFFFFF]
  final Color promoButtonText; // [taxmin: #111827]

  final Color productCardBg; // [taxmin: #FFFFFF]
  final Color productCardBorder; // [taxmin: #E5E7EB]
  final Color productTitle; // [taxmin: #111827]
  final Color productSubtitle; // [taxmin: #64748B]
  final Color productPrice; // [taxmin: #111827]
  final Color addToCartBg; // [taxmin: #22C55E]
  final Color addToCartText; // [taxmin: #FFFFFF]

  final Color floatingNavBg; // [taxmin: #FFFFFF]
  final Color floatingNavBorder; // [taxmin: #F1F5F9]
  final Color floatingNavActiveItemBg; // [taxmin: #374151]
  final Color floatingNavActiveItemText; // [taxmin: #FFFFFF]
  final Color floatingNavInactiveItemText; // [taxmin: #94A3B8]
  final Color floatingCartBtnBg; // [taxmin: #374151]
  final Color floatingCartBtnIcon; // [taxmin: #FFFFFF]

  // --- Border Radii ---
  final double radiusHeaderButton; // [taxmin: 22.0]
  final double radiusWeatherCard; // [taxmin: 14.0]
  final double radiusActionCard; // [taxmin: 20.0]
  final double radiusPill; // [taxmin: 20.0]
  final double radiusPromoCard; // [taxmin: 20.0]
  final double radiusProductCard; // [taxmin: 18.0]
  final double radiusAddToCartBtn; // [taxmin: 12.0]
  final double radiusFloatingNav; // [taxmin: 32.0]

  // --- Shadows ---
  final List<BoxShadow> cardShadow;
  final List<BoxShadow> floatingNavShadow;

  const HomeThemeTokens({
    required this.screenBackground,
    required this.headerButtonBg,
    required this.headerButtonBorder,
    required this.badgeBg,
    required this.badgeText,
    required this.weatherCardBg,
    required this.weatherTextPrimary,
    required this.weatherTextSecondary,
    required this.actionSpecialistsBg,
    required this.actionMedicinesBg,
    required this.actionCardText,
    required this.actionBubbleBg,
    required this.viewAllBlueBg,
    required this.viewAllDarkBg,
    required this.viewAllText,
    required this.promoBannerBg,
    required this.promoButtonBg,
    required this.promoButtonText,
    required this.productCardBg,
    required this.productCardBorder,
    required this.productTitle,
    required this.productSubtitle,
    required this.productPrice,
    required this.addToCartBg,
    required this.addToCartText,
    required this.floatingNavBg,
    required this.floatingNavBorder,
    required this.floatingNavActiveItemBg,
    required this.floatingNavActiveItemText,
    required this.floatingNavInactiveItemText,
    required this.floatingCartBtnBg,
    required this.floatingCartBtnIcon,
    required this.radiusHeaderButton,
    required this.radiusWeatherCard,
    required this.radiusActionCard,
    required this.radiusPill,
    required this.radiusPromoCard,
    required this.radiusProductCard,
    required this.radiusAddToCartBtn,
    required this.radiusFloatingNav,
    required this.cardShadow,
    required this.floatingNavShadow,
  });

  static HomeThemeTokens get light => const HomeThemeTokens(
        screenBackground: Color(0xFFF8FAFC),
        headerButtonBg: Color(0xFFFFFFFF),
        headerButtonBorder: Color(0xFFE2E8F0),
        badgeBg: Color(0xFFEF4444),
        badgeText: Color(0xFFFFFFFF),
        weatherCardBg: Color(0xFFF1F5F9),
        weatherTextPrimary: Color(0xFF1E293B),
        weatherTextSecondary: Color(0xFF64748B),
        actionSpecialistsBg: Color(0xFF0084FF),
        actionMedicinesBg: Color(0xFF22C55E),
        actionCardText: Color(0xFFFFFFFF),
        actionBubbleBg: Color(0x33FFFFFF),
        viewAllBlueBg: Color(0xFF0084FF),
        viewAllDarkBg: Color(0xFF374151),
        viewAllText: Color(0xFFFFFFFF),
        promoBannerBg: Color(0xFF1E293B),
        promoButtonBg: Color(0xFFFFFFFF),
        promoButtonText: Color(0xFF111827),
        productCardBg: Color(0xFFFFFFFF),
        productCardBorder: Color(0xFFE5E7EB),
        productTitle: Color(0xFF111827),
        productSubtitle: Color(0xFF64748B),
        productPrice: Color(0xFF111827),
        addToCartBg: Color(0xFF22C55E),
        addToCartText: Color(0xFFFFFFFF),
        floatingNavBg: Color(0xFFFFFFFF),
        floatingNavBorder: Color(0xFFF1F5F9),
        floatingNavActiveItemBg: Color(0xFF374151),
        floatingNavActiveItemText: Color(0xFFFFFFFF),
        floatingNavInactiveItemText: Color(0xFF94A3B8),
        floatingCartBtnBg: Color(0xFF374151),
        floatingCartBtnIcon: Color(0xFFFFFFFF),
        radiusHeaderButton: 22.0,
        radiusWeatherCard: 14.0,
        radiusActionCard: 20.0,
        radiusPill: 20.0,
        radiusPromoCard: 20.0,
        radiusProductCard: 18.0,
        radiusAddToCartBtn: 12.0,
        radiusFloatingNav: 32.0,
        cardShadow: [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
        floatingNavShadow: [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 20,
            offset: Offset(0, 6),
          ),
        ],
      );

  static HomeThemeTokens get dark => const HomeThemeTokens(
        screenBackground: Color(0xFF0F172A),
        headerButtonBg: Color(0xFF1E293B),
        headerButtonBorder: Color(0xFF334155),
        badgeBg: Color(0xFFEF4444),
        badgeText: Color(0xFFFFFFFF),
        weatherCardBg: Color(0xFF1E293B),
        weatherTextPrimary: Color(0xFFF8FAFC),
        weatherTextSecondary: Color(0xFF94A3B8),
        actionSpecialistsBg: Color(0xFF0284C7),
        actionMedicinesBg: Color(0xFF16A34A),
        actionCardText: Color(0xFFFFFFFF),
        actionBubbleBg: Color(0x33FFFFFF),
        viewAllBlueBg: Color(0xFF0284C7),
        viewAllDarkBg: Color(0xFF475569),
        viewAllText: Color(0xFFFFFFFF),
        promoBannerBg: Color(0xFF1E293B),
        promoButtonBg: Color(0xFFFFFFFF),
        promoButtonText: Color(0xFF111827),
        productCardBg: Color(0xFF1E293B),
        productCardBorder: Color(0xFF334155),
        productTitle: Color(0xFFF8FAFC),
        productSubtitle: Color(0xFF94A3B8),
        productPrice: Color(0xFFF8FAFC),
        addToCartBg: Color(0xFF16A34A),
        addToCartText: Color(0xFFFFFFFF),
        floatingNavBg: Color(0xFF1E293B),
        floatingNavBorder: Color(0xFF334155),
        floatingNavActiveItemBg: Color(0xFF475569),
        floatingNavActiveItemText: Color(0xFFFFFFFF),
        floatingNavInactiveItemText: Color(0xFF64748B),
        floatingCartBtnBg: Color(0xFF475569),
        floatingCartBtnIcon: Color(0xFFFFFFFF),
        radiusHeaderButton: 22.0,
        radiusWeatherCard: 14.0,
        radiusActionCard: 20.0,
        radiusPill: 20.0,
        radiusPromoCard: 20.0,
        radiusProductCard: 18.0,
        radiusAddToCartBtn: 12.0,
        radiusFloatingNav: 32.0,
        cardShadow: [
          BoxShadow(
            color: Color(0x1F000000),
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
        floatingNavShadow: [
          BoxShadow(
            color: Color(0x29000000),
            blurRadius: 20,
            offset: Offset(0, 6),
          ),
        ],
      );

  @override
  ThemeExtension<HomeThemeTokens> copyWith({
    Color? screenBackground,
    Color? headerButtonBg,
    Color? headerButtonBorder,
    Color? badgeBg,
    Color? badgeText,
    Color? weatherCardBg,
    Color? weatherTextPrimary,
    Color? weatherTextSecondary,
    Color? actionSpecialistsBg,
    Color? actionMedicinesBg,
    Color? actionCardText,
    Color? actionBubbleBg,
    Color? viewAllBlueBg,
    Color? viewAllDarkBg,
    Color? viewAllText,
    Color? promoBannerBg,
    Color? promoButtonBg,
    Color? promoButtonText,
    Color? productCardBg,
    Color? productCardBorder,
    Color? productTitle,
    Color? productSubtitle,
    Color? productPrice,
    Color? addToCartBg,
    Color? addToCartText,
    Color? floatingNavBg,
    Color? floatingNavBorder,
    Color? floatingNavActiveItemBg,
    Color? floatingNavActiveItemText,
    Color? floatingNavInactiveItemText,
    Color? floatingCartBtnBg,
    Color? floatingCartBtnIcon,
    double? radiusHeaderButton,
    double? radiusWeatherCard,
    double? radiusActionCard,
    double? radiusPill,
    double? radiusPromoCard,
    double? radiusProductCard,
    double? radiusAddToCartBtn,
    double? radiusFloatingNav,
    List<BoxShadow>? cardShadow,
    List<BoxShadow>? floatingNavShadow,
  }) {
    return HomeThemeTokens(
      screenBackground: screenBackground ?? this.screenBackground,
      headerButtonBg: headerButtonBg ?? this.headerButtonBg,
      headerButtonBorder: headerButtonBorder ?? this.headerButtonBorder,
      badgeBg: badgeBg ?? this.badgeBg,
      badgeText: badgeText ?? this.badgeText,
      weatherCardBg: weatherCardBg ?? this.weatherCardBg,
      weatherTextPrimary: weatherTextPrimary ?? this.weatherTextPrimary,
      weatherTextSecondary: weatherTextSecondary ?? this.weatherTextSecondary,
      actionSpecialistsBg: actionSpecialistsBg ?? this.actionSpecialistsBg,
      actionMedicinesBg: actionMedicinesBg ?? this.actionMedicinesBg,
      actionCardText: actionCardText ?? this.actionCardText,
      actionBubbleBg: actionBubbleBg ?? this.actionBubbleBg,
      viewAllBlueBg: viewAllBlueBg ?? this.viewAllBlueBg,
      viewAllDarkBg: viewAllDarkBg ?? this.viewAllDarkBg,
      viewAllText: viewAllText ?? this.viewAllText,
      promoBannerBg: promoBannerBg ?? this.promoBannerBg,
      promoButtonBg: promoButtonBg ?? this.promoButtonBg,
      promoButtonText: promoButtonText ?? this.promoButtonText,
      productCardBg: productCardBg ?? this.productCardBg,
      productCardBorder: productCardBorder ?? this.productCardBorder,
      productTitle: productTitle ?? this.productTitle,
      productSubtitle: productSubtitle ?? this.productSubtitle,
      productPrice: productPrice ?? this.productPrice,
      addToCartBg: addToCartBg ?? this.addToCartBg,
      addToCartText: addToCartText ?? this.addToCartText,
      floatingNavBg: floatingNavBg ?? this.floatingNavBg,
      floatingNavBorder: floatingNavBorder ?? this.floatingNavBorder,
      floatingNavActiveItemBg: floatingNavActiveItemBg ?? this.floatingNavActiveItemBg,
      floatingNavActiveItemText: floatingNavActiveItemText ?? this.floatingNavActiveItemText,
      floatingNavInactiveItemText: floatingNavInactiveItemText ?? this.floatingNavInactiveItemText,
      floatingCartBtnBg: floatingCartBtnBg ?? this.floatingCartBtnBg,
      floatingCartBtnIcon: floatingCartBtnIcon ?? this.floatingCartBtnIcon,
      radiusHeaderButton: radiusHeaderButton ?? this.radiusHeaderButton,
      radiusWeatherCard: radiusWeatherCard ?? this.radiusWeatherCard,
      radiusActionCard: radiusActionCard ?? this.radiusActionCard,
      radiusPill: radiusPill ?? this.radiusPill,
      radiusPromoCard: radiusPromoCard ?? this.radiusPromoCard,
      radiusProductCard: radiusProductCard ?? this.radiusProductCard,
      radiusAddToCartBtn: radiusAddToCartBtn ?? this.radiusAddToCartBtn,
      radiusFloatingNav: radiusFloatingNav ?? this.radiusFloatingNav,
      cardShadow: cardShadow ?? this.cardShadow,
      floatingNavShadow: floatingNavShadow ?? this.floatingNavShadow,
    );
  }

  @override
  ThemeExtension<HomeThemeTokens> lerp(
    covariant ThemeExtension<HomeThemeTokens>? other,
    double t,
  ) {
    if (other is! HomeThemeTokens) return this;
    return HomeThemeTokens(
      screenBackground: Color.lerp(screenBackground, other.screenBackground, t)!,
      headerButtonBg: Color.lerp(headerButtonBg, other.headerButtonBg, t)!,
      headerButtonBorder: Color.lerp(headerButtonBorder, other.headerButtonBorder, t)!,
      badgeBg: Color.lerp(badgeBg, other.badgeBg, t)!,
      badgeText: Color.lerp(badgeText, other.badgeText, t)!,
      weatherCardBg: Color.lerp(weatherCardBg, other.weatherCardBg, t)!,
      weatherTextPrimary: Color.lerp(weatherTextPrimary, other.weatherTextPrimary, t)!,
      weatherTextSecondary: Color.lerp(weatherTextSecondary, other.weatherTextSecondary, t)!,
      actionSpecialistsBg: Color.lerp(actionSpecialistsBg, other.actionSpecialistsBg, t)!,
      actionMedicinesBg: Color.lerp(actionMedicinesBg, other.actionMedicinesBg, t)!,
      actionCardText: Color.lerp(actionCardText, other.actionCardText, t)!,
      actionBubbleBg: Color.lerp(actionBubbleBg, other.actionBubbleBg, t)!,
      viewAllBlueBg: Color.lerp(viewAllBlueBg, other.viewAllBlueBg, t)!,
      viewAllDarkBg: Color.lerp(viewAllDarkBg, other.viewAllDarkBg, t)!,
      viewAllText: Color.lerp(viewAllText, other.viewAllText, t)!,
      promoBannerBg: Color.lerp(promoBannerBg, other.promoBannerBg, t)!,
      promoButtonBg: Color.lerp(promoButtonBg, other.promoButtonBg, t)!,
      promoButtonText: Color.lerp(promoButtonText, other.promoButtonText, t)!,
      productCardBg: Color.lerp(productCardBg, other.productCardBg, t)!,
      productCardBorder: Color.lerp(productCardBorder, other.productCardBorder, t)!,
      productTitle: Color.lerp(productTitle, other.productTitle, t)!,
      productSubtitle: Color.lerp(productSubtitle, other.productSubtitle, t)!,
      productPrice: Color.lerp(productPrice, other.productPrice, t)!,
      addToCartBg: Color.lerp(addToCartBg, other.addToCartBg, t)!,
      addToCartText: Color.lerp(addToCartText, other.addToCartText, t)!,
      floatingNavBg: Color.lerp(floatingNavBg, other.floatingNavBg, t)!,
      floatingNavBorder: Color.lerp(floatingNavBorder, other.floatingNavBorder, t)!,
      floatingNavActiveItemBg: Color.lerp(floatingNavActiveItemBg, other.floatingNavActiveItemBg, t)!,
      floatingNavActiveItemText: Color.lerp(floatingNavActiveItemText, other.floatingNavActiveItemText, t)!,
      floatingNavInactiveItemText: Color.lerp(floatingNavInactiveItemText, other.floatingNavInactiveItemText, t)!,
      floatingCartBtnBg: Color.lerp(floatingCartBtnBg, other.floatingCartBtnBg, t)!,
      floatingCartBtnIcon: Color.lerp(floatingCartBtnIcon, other.floatingCartBtnIcon, t)!,
      radiusHeaderButton: radiusHeaderButton + (other.radiusHeaderButton - radiusHeaderButton) * t,
      radiusWeatherCard: radiusWeatherCard + (other.radiusWeatherCard - radiusWeatherCard) * t,
      radiusActionCard: radiusActionCard + (other.radiusActionCard - radiusActionCard) * t,
      radiusPill: radiusPill + (other.radiusPill - radiusPill) * t,
      radiusPromoCard: radiusPromoCard + (other.radiusPromoCard - radiusPromoCard) * t,
      radiusProductCard: radiusProductCard + (other.radiusProductCard - radiusProductCard) * t,
      radiusAddToCartBtn: radiusAddToCartBtn + (other.radiusAddToCartBtn - radiusAddToCartBtn) * t,
      radiusFloatingNav: radiusFloatingNav + (other.radiusFloatingNav - radiusFloatingNav) * t,
      cardShadow: cardShadow,
      floatingNavShadow: floatingNavShadow,
    );
  }
}
