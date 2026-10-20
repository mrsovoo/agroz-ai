import 'package:flutter/material.dart';

/// ThemeExtension containing design tokens for Home screen extracted from Figma/Design.
/// Values estimated from screenshot are noted as `[taxmin]`.
@immutable
class HomeThemeTokens extends ThemeExtension<HomeThemeTokens> {
  // --- Colors ---
  final Color screenBackground; // Figma: #F5F5F5
  final Color headerButtonBg; // Figma: #FFFFFF
  final Color headerButtonBorder; // Figma: transparent / subtle
  final Color badgeBg; // Figma: #FA2B36
  final Color badgeText; // Figma: #FFFFFF

  final Color weatherCardBg; // Figma: #FFFFFF
  final Color weatherPillBg; // Figma: black with 0.03 opacity
  final Color weatherTextPrimary; // Figma: #000000
  final Color weatherTextSecondary; // Figma: black with 0.70 opacity

  final Color actionSpecialistsBg; // Figma: #0094FF
  final Color actionMedicinesBg; // Figma: #35CA56
  final Color actionCardText; // Figma: #FFFFFF
  final Color actionBubbleBg; // Figma: white24

  final Color viewAllBlueBg; // Figma: #0094FF
  final Color viewAllDarkBg; // Figma: #3F3F3F
  final Color viewAllText; // Figma: #FFFFFF

  final Color promoBannerBg; // Figma: #1E293B
  final Color promoButtonBg; // Figma: #FFFFFF
  final Color promoButtonText; // Figma: #111827

  final Color productSectionBg; // Figma: #FFFFFF
  final Color productCardBg; // Figma: #F5F5F5
  final Color productCardBorder; // Figma: 0.3 border
  final Color productTitle; // Figma: #000000
  final Color productSubtitle; // Figma: #666666
  final Color productPrice; // Figma: #000000
  final Color addToCartBg; // Figma: #35CA56
  final Color addToCartText; // Figma: #FFFFFF

  final Color specialistCardBg; // Figma: #FFFFFF
  final Color specialistAvatarBg; // Figma: #0C35CA56
  final Color specialistRatingBg; // Figma: #0094FF
  final Color specialistDetailBtnBg; // Figma: #EFEFEF
  final Color specialistDetailBtnText; // Figma: #555555

  final Color floatingNavBg; // Figma: #FFFFFF
  final Color floatingNavBorder; // Figma: transparent
  final Color floatingNavActiveItemBg; // Figma: #403F3F
  final Color floatingNavActiveItemText; // Figma: #FFFFFF
  final Color floatingNavInactiveItemText; // Figma: #A9A9A9
  final Color floatingCartBtnBg; // Figma: #403F3F
  final Color floatingCartBtnIcon; // Figma: #FFFFFF

  // --- Border Radii ---
  final double radiusHeaderButton; // Figma: 50.0 (circle)
  final double radiusWeatherCard; // Figma: 20.0
  final double radiusWeatherPill; // Figma: 16.0
  final double radiusActionCard; // Figma: 20.0
  final double radiusPill; // Figma: 20.0
  final double radiusPromoCard; // Figma: 20.0
  final double radiusProductCard; // Figma: 30.0
  final double radiusProductImage; // Figma: 20.0
  final double radiusAddToCartBtn; // Figma: 20.0
  final double radiusSpecialistCard; // Figma: 30.0
  final double radiusSpecialistAvatar; // Figma: 20.0
  final double radiusFloatingNav; // Figma: 70.0
  final double radiusFloatingCart; // Figma: 50.0

  // --- Shadows ---
  final List<BoxShadow> cardShadow;
  final List<BoxShadow> pillShadow;
  final List<BoxShadow> floatingNavShadow;

  const HomeThemeTokens({
    required this.screenBackground,
    required this.headerButtonBg,
    required this.headerButtonBorder,
    required this.badgeBg,
    required this.badgeText,
    required this.weatherCardBg,
    required this.weatherPillBg,
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
    required this.productSectionBg,
    required this.productCardBg,
    required this.productCardBorder,
    required this.productTitle,
    required this.productSubtitle,
    required this.productPrice,
    required this.addToCartBg,
    required this.addToCartText,
    required this.specialistCardBg,
    required this.specialistAvatarBg,
    required this.specialistRatingBg,
    required this.specialistDetailBtnBg,
    required this.specialistDetailBtnText,
    required this.floatingNavBg,
    required this.floatingNavBorder,
    required this.floatingNavActiveItemBg,
    required this.floatingNavActiveItemText,
    required this.floatingNavInactiveItemText,
    required this.floatingCartBtnBg,
    required this.floatingCartBtnIcon,
    required this.radiusHeaderButton,
    required this.radiusWeatherCard,
    required this.radiusWeatherPill,
    required this.radiusActionCard,
    required this.radiusPill,
    required this.radiusPromoCard,
    required this.radiusProductCard,
    required this.radiusProductImage,
    required this.radiusAddToCartBtn,
    required this.radiusSpecialistCard,
    required this.radiusSpecialistAvatar,
    required this.radiusFloatingNav,
    required this.radiusFloatingCart,
    required this.cardShadow,
    required this.pillShadow,
    required this.floatingNavShadow,
  });

  static HomeThemeTokens get light => const HomeThemeTokens(
        screenBackground: Color(0xFFF5F5F5),
        headerButtonBg: Color(0xFFFFFFFF),
        headerButtonBorder: Color(0x19000000),
        badgeBg: Color(0xFFFA2B36),
        badgeText: Color(0xFFFFFFFF),
        weatherCardBg: Color(0xFFFFFFFF),
        weatherPillBg: Color(0x08000000),
        weatherTextPrimary: Color(0xFF000000),
        weatherTextSecondary: Color(0xB3000000),
        actionSpecialistsBg: Color(0xFF0094FF),
        actionMedicinesBg: Color(0xFF35CA56),
        actionCardText: Color(0xFFFFFFFF),
        actionBubbleBg: Color(0x33FFFFFF),
        viewAllBlueBg: Color(0xFF0094FF),
        viewAllDarkBg: Color(0xFF3F3F3F),
        viewAllText: Color(0xFFFFFFFF),
        promoBannerBg: Color(0xFF1E293B),
        promoButtonBg: Color(0xFFFFFFFF),
        promoButtonText: Color(0xFF111827),
        productSectionBg: Color(0xFFFFFFFF),
        productCardBg: Color(0xFFF5F5F5),
        productCardBorder: Color(0x1A000000),
        productTitle: Color(0xFF000000),
        productSubtitle: Color(0xFF666666),
        productPrice: Color(0xFF000000),
        addToCartBg: Color(0xFF35CA56),
        addToCartText: Color(0xFFFFFFFF),
        specialistCardBg: Color(0xFFFFFFFF),
        specialistAvatarBg: Color(0x0C35CA56),
        specialistRatingBg: Color(0xFF0094FF),
        specialistDetailBtnBg: Color(0xFFEFEFEF),
        specialistDetailBtnText: Color(0xFF555555),
        floatingNavBg: Color(0xFFFFFFFF),
        floatingNavBorder: Color(0x00000000),
        floatingNavActiveItemBg: Color(0xFF403F3F),
        floatingNavActiveItemText: Color(0xFFFFFFFF),
        floatingNavInactiveItemText: Color(0xFFA9A9A9),
        floatingCartBtnBg: Color(0xFF403F3F),
        floatingCartBtnIcon: Color(0xFFFFFFFF),
        radiusHeaderButton: 50.0,
        radiusWeatherCard: 20.0,
        radiusWeatherPill: 16.0,
        radiusActionCard: 20.0,
        radiusPill: 20.0,
        radiusPromoCard: 20.0,
        radiusProductCard: 30.0,
        radiusProductImage: 20.0,
        radiusAddToCartBtn: 20.0,
        radiusSpecialistCard: 30.0,
        radiusSpecialistAvatar: 20.0,
        radiusFloatingNav: 70.0,
        radiusFloatingCart: 50.0,
        cardShadow: [
          BoxShadow(
            color: Color(0x19000000),
            blurRadius: 20,
            offset: Offset(0, 0),
          ),
        ],
        pillShadow: [
          BoxShadow(
            color: Color(0x19000000),
            blurRadius: 20,
            offset: Offset(0, 0),
          ),
        ],
        floatingNavShadow: [
          BoxShadow(
            color: Color(0x33000000),
            blurRadius: 30,
            offset: Offset(0, 0),
          ),
        ],
      );

  static HomeThemeTokens get dark => const HomeThemeTokens(
        screenBackground: Color(0xFF121212),
        headerButtonBg: Color(0xFF1E1E1E),
        headerButtonBorder: Color(0x33FFFFFF),
        badgeBg: Color(0xFFFA2B36),
        badgeText: Color(0xFFFFFFFF),
        weatherCardBg: Color(0xFF1E1E1E),
        weatherPillBg: Color(0x1AFFFFFF),
        weatherTextPrimary: Color(0xFFFFFFFF),
        weatherTextSecondary: Color(0xB3FFFFFF),
        actionSpecialistsBg: Color(0xFF0094FF),
        actionMedicinesBg: Color(0xFF35CA56),
        actionCardText: Color(0xFFFFFFFF),
        actionBubbleBg: Color(0x33FFFFFF),
        viewAllBlueBg: Color(0xFF0094FF),
        viewAllDarkBg: Color(0xFF3F3F3F),
        viewAllText: Color(0xFFFFFFFF),
        promoBannerBg: Color(0xFF1E293B),
        promoButtonBg: Color(0xFFFFFFFF),
        promoButtonText: Color(0xFF111827),
        productSectionBg: Color(0xFF1E1E1E),
        productCardBg: Color(0xFF2A2A2A),
        productCardBorder: Color(0x33FFFFFF),
        productTitle: Color(0xFFFFFFFF),
        productSubtitle: Color(0xFFAAAAAA),
        productPrice: Color(0xFFFFFFFF),
        addToCartBg: Color(0xFF35CA56),
        addToCartText: Color(0xFFFFFFFF),
        specialistCardBg: Color(0xFF1E1E1E),
        specialistAvatarBg: Color(0x1A35CA56),
        specialistRatingBg: Color(0xFF0094FF),
        specialistDetailBtnBg: Color(0xFF2A2A2A),
        specialistDetailBtnText: Color(0xFFCCCCCC),
        floatingNavBg: Color(0xFF1E1E1E),
        floatingNavBorder: Color(0x00000000),
        floatingNavActiveItemBg: Color(0xFF403F3F),
        floatingNavActiveItemText: Color(0xFFFFFFFF),
        floatingNavInactiveItemText: Color(0xFFA9A9A9),
        floatingCartBtnBg: Color(0xFF403F3F),
        floatingCartBtnIcon: Color(0xFFFFFFFF),
        radiusHeaderButton: 50.0,
        radiusWeatherCard: 20.0,
        radiusWeatherPill: 16.0,
        radiusActionCard: 20.0,
        radiusPill: 20.0,
        radiusPromoCard: 20.0,
        radiusProductCard: 30.0,
        radiusProductImage: 20.0,
        radiusAddToCartBtn: 20.0,
        radiusSpecialistCard: 30.0,
        radiusSpecialistAvatar: 20.0,
        radiusFloatingNav: 70.0,
        radiusFloatingCart: 50.0,
        cardShadow: [
          BoxShadow(
            color: Color(0x33000000),
            blurRadius: 20,
            offset: Offset(0, 0),
          ),
        ],
        pillShadow: [
          BoxShadow(
            color: Color(0x33000000),
            blurRadius: 20,
            offset: Offset(0, 0),
          ),
        ],
        floatingNavShadow: [
          BoxShadow(
            color: Color(0x4D000000),
            blurRadius: 30,
            offset: Offset(0, 0),
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
    Color? weatherPillBg,
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
    Color? productSectionBg,
    Color? productCardBg,
    Color? productCardBorder,
    Color? productTitle,
    Color? productSubtitle,
    Color? productPrice,
    Color? addToCartBg,
    Color? addToCartText,
    Color? specialistCardBg,
    Color? specialistAvatarBg,
    Color? specialistRatingBg,
    Color? specialistDetailBtnBg,
    Color? specialistDetailBtnText,
    Color? floatingNavBg,
    Color? floatingNavBorder,
    Color? floatingNavActiveItemBg,
    Color? floatingNavActiveItemText,
    Color? floatingNavInactiveItemText,
    Color? floatingCartBtnBg,
    Color? floatingCartBtnIcon,
    double? radiusHeaderButton,
    double? radiusWeatherCard,
    double? radiusWeatherPill,
    double? radiusActionCard,
    double? radiusPill,
    double? radiusPromoCard,
    double? radiusProductCard,
    double? radiusProductImage,
    double? radiusAddToCartBtn,
    double? radiusSpecialistCard,
    double? radiusSpecialistAvatar,
    double? radiusFloatingNav,
    double? radiusFloatingCart,
    List<BoxShadow>? cardShadow,
    List<BoxShadow>? pillShadow,
    List<BoxShadow>? floatingNavShadow,
  }) {
    return HomeThemeTokens(
      screenBackground: screenBackground ?? this.screenBackground,
      headerButtonBg: headerButtonBg ?? this.headerButtonBg,
      headerButtonBorder: headerButtonBorder ?? this.headerButtonBorder,
      badgeBg: badgeBg ?? this.badgeBg,
      badgeText: badgeText ?? this.badgeText,
      weatherCardBg: weatherCardBg ?? this.weatherCardBg,
      weatherPillBg: weatherPillBg ?? this.weatherPillBg,
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
      productSectionBg: productSectionBg ?? this.productSectionBg,
      productCardBg: productCardBg ?? this.productCardBg,
      productCardBorder: productCardBorder ?? this.productCardBorder,
      productTitle: productTitle ?? this.productTitle,
      productSubtitle: productSubtitle ?? this.productSubtitle,
      productPrice: productPrice ?? this.productPrice,
      addToCartBg: addToCartBg ?? this.addToCartBg,
      addToCartText: addToCartText ?? this.addToCartText,
      specialistCardBg: specialistCardBg ?? this.specialistCardBg,
      specialistAvatarBg: specialistAvatarBg ?? this.specialistAvatarBg,
      specialistRatingBg: specialistRatingBg ?? this.specialistRatingBg,
      specialistDetailBtnBg: specialistDetailBtnBg ?? this.specialistDetailBtnBg,
      specialistDetailBtnText: specialistDetailBtnText ?? this.specialistDetailBtnText,
      floatingNavBg: floatingNavBg ?? this.floatingNavBg,
      floatingNavBorder: floatingNavBorder ?? this.floatingNavBorder,
      floatingNavActiveItemBg: floatingNavActiveItemBg ?? this.floatingNavActiveItemBg,
      floatingNavActiveItemText: floatingNavActiveItemText ?? this.floatingNavActiveItemText,
      floatingNavInactiveItemText: floatingNavInactiveItemText ?? this.floatingNavInactiveItemText,
      floatingCartBtnBg: floatingCartBtnBg ?? this.floatingCartBtnBg,
      floatingCartBtnIcon: floatingCartBtnIcon ?? this.floatingCartBtnIcon,
      radiusHeaderButton: radiusHeaderButton ?? this.radiusHeaderButton,
      radiusWeatherCard: radiusWeatherCard ?? this.radiusWeatherCard,
      radiusWeatherPill: radiusWeatherPill ?? this.radiusWeatherPill,
      radiusActionCard: radiusActionCard ?? this.radiusActionCard,
      radiusPill: radiusPill ?? this.radiusPill,
      radiusPromoCard: radiusPromoCard ?? this.radiusPromoCard,
      radiusProductCard: radiusProductCard ?? this.radiusProductCard,
      radiusProductImage: radiusProductImage ?? this.radiusProductImage,
      radiusAddToCartBtn: radiusAddToCartBtn ?? this.radiusAddToCartBtn,
      radiusSpecialistCard: radiusSpecialistCard ?? this.radiusSpecialistCard,
      radiusSpecialistAvatar: radiusSpecialistAvatar ?? this.radiusSpecialistAvatar,
      radiusFloatingNav: radiusFloatingNav ?? this.radiusFloatingNav,
      radiusFloatingCart: radiusFloatingCart ?? this.radiusFloatingCart,
      cardShadow: cardShadow ?? this.cardShadow,
      pillShadow: pillShadow ?? this.pillShadow,
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
      weatherPillBg: Color.lerp(weatherPillBg, other.weatherPillBg, t)!,
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
      productSectionBg: Color.lerp(productSectionBg, other.productSectionBg, t)!,
      productCardBg: Color.lerp(productCardBg, other.productCardBg, t)!,
      productCardBorder: Color.lerp(productCardBorder, other.productCardBorder, t)!,
      productTitle: Color.lerp(productTitle, other.productTitle, t)!,
      productSubtitle: Color.lerp(productSubtitle, other.productSubtitle, t)!,
      productPrice: Color.lerp(productPrice, other.productPrice, t)!,
      addToCartBg: Color.lerp(addToCartBg, other.addToCartBg, t)!,
      addToCartText: Color.lerp(addToCartText, other.addToCartText, t)!,
      specialistCardBg: Color.lerp(specialistCardBg, other.specialistCardBg, t)!,
      specialistAvatarBg: Color.lerp(specialistAvatarBg, other.specialistAvatarBg, t)!,
      specialistRatingBg: Color.lerp(specialistRatingBg, other.specialistRatingBg, t)!,
      specialistDetailBtnBg: Color.lerp(specialistDetailBtnBg, other.specialistDetailBtnBg, t)!,
      specialistDetailBtnText: Color.lerp(specialistDetailBtnText, other.specialistDetailBtnText, t)!,
      floatingNavBg: Color.lerp(floatingNavBg, other.floatingNavBg, t)!,
      floatingNavBorder: Color.lerp(floatingNavBorder, other.floatingNavBorder, t)!,
      floatingNavActiveItemBg: Color.lerp(floatingNavActiveItemBg, other.floatingNavActiveItemBg, t)!,
      floatingNavActiveItemText: Color.lerp(floatingNavActiveItemText, other.floatingNavActiveItemText, t)!,
      floatingNavInactiveItemText: Color.lerp(floatingNavInactiveItemText, other.floatingNavInactiveItemText, t)!,
      floatingCartBtnBg: Color.lerp(floatingCartBtnBg, other.floatingCartBtnBg, t)!,
      floatingCartBtnIcon: Color.lerp(floatingCartBtnIcon, other.floatingCartBtnIcon, t)!,
      radiusHeaderButton: radiusHeaderButton + (other.radiusHeaderButton - radiusHeaderButton) * t,
      radiusWeatherCard: radiusWeatherCard + (other.radiusWeatherCard - radiusWeatherCard) * t,
      radiusWeatherPill: radiusWeatherPill + (other.radiusWeatherPill - radiusWeatherPill) * t,
      radiusActionCard: radiusActionCard + (other.radiusActionCard - radiusActionCard) * t,
      radiusPill: radiusPill + (other.radiusPill - radiusPill) * t,
      radiusPromoCard: radiusPromoCard + (other.radiusPromoCard - radiusPromoCard) * t,
      radiusProductCard: radiusProductCard + (other.radiusProductCard - radiusProductCard) * t,
      radiusProductImage: radiusProductImage + (other.radiusProductImage - radiusProductImage) * t,
      radiusAddToCartBtn: radiusAddToCartBtn + (other.radiusAddToCartBtn - radiusAddToCartBtn) * t,
      radiusSpecialistCard: radiusSpecialistCard + (other.radiusSpecialistCard - radiusSpecialistCard) * t,
      radiusSpecialistAvatar: radiusSpecialistAvatar + (other.radiusSpecialistAvatar - radiusSpecialistAvatar) * t,
      radiusFloatingNav: radiusFloatingNav + (other.radiusFloatingNav - radiusFloatingNav) * t,
      radiusFloatingCart: radiusFloatingCart + (other.radiusFloatingCart - radiusFloatingCart) * t,
      cardShadow: cardShadow,
      pillShadow: pillShadow,
      floatingNavShadow: floatingNavShadow,
    );
  }
}
