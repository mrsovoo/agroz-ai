import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/home_theme_tokens.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/skeleton_loader.dart';
import '../../cart/providers/cart_provider.dart';
import '../../medicines/models/medicine_models.dart';
import '../providers/home_providers.dart';

class HomeMedicinesSection extends ConsumerWidget {
  final VoidCallback? onViewAllTap;

  const HomeMedicinesSection({
    super.key,
    this.onViewAllTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = Theme.of(context).extension<HomeThemeTokens>() ?? HomeThemeTokens.light;
    final medicinesAsync = ref.watch(homeMedicinesProvider);

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: tokens.productSectionBg,
        borderRadius: BorderRadius.circular(tokens.radiusProductCard),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 15,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Header
          Padding(
            padding: const EdgeInsets.only(left: 16, right: 10, bottom: 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: Text(
                    AppStrings.medicinesSectionTitle,
                    style: TextStyle(
                      color: tokens.productTitle,
                      fontSize: 25,
                      fontFamily: 'PingFang SC',
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Semantics(
                  label: '${AppStrings.medicinesSectionTitle} - ${AppStrings.viewAll}',
                  button: true,
                  child: Material(
                    color: tokens.viewAllDarkBg,
                    borderRadius: BorderRadius.circular(tokens.radiusPill),
                    child: InkWell(
                      onTap: () {
                        HapticFeedback.lightImpact();
                        if (onViewAllTap != null) {
                          onViewAllTap!();
                        } else {
                          context.go('/medicines');
                        }
                      },
                      borderRadius: BorderRadius.circular(tokens.radiusPill),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 5),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(tokens.radiusPill),
                          boxShadow: const [
                            BoxShadow(
                              color: Color(0x19000000),
                              blurRadius: 20,
                              offset: Offset(0, 0),
                            ),
                          ],
                        ),
                        child: Text(
                          AppStrings.viewAll,
                          style: TextStyle(
                            color: tokens.viewAllText,
                            fontSize: 12.2,
                            fontFamily: 'PingFang SC',
                            fontWeight: FontWeight.w500,
                            height: 1.43,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 4-state Data Representation
          medicinesAsync.when(
            data: (medicines) {
              if (medicines.isEmpty) {
                return const Padding(
                  padding: EdgeInsets.symmetric(vertical: 20),
                  child: EmptyView(message: AppStrings.medicinesEmpty),
                );
              }

              return SizedBox(
                height: 310,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  itemCount: medicines.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    final item = medicines[index];
                    return MedicineCard(
                      medicine: item,
                      tokens: tokens,
                    );
                  },
                ),
              );
            },
            loading: () => SizedBox(
              height: 310,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Row(
                  children: [
                    SkeletonLoader(
                      width: 175,
                      height: 310,
                      borderRadius: tokens.radiusProductCard,
                    ),
                    const SizedBox(width: 8),
                    SkeletonLoader(
                      width: 175,
                      height: 310,
                      borderRadius: tokens.radiusProductCard,
                    ),
                  ],
                ),
              ),
            ),
            error: (error, _) => Container(
              margin: const EdgeInsets.symmetric(horizontal: 12),
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: tokens.productCardBg,
                borderRadius: BorderRadius.circular(tokens.radiusProductCard),
              ),
              child: ErrorView(
                message: AppStrings.medicinesError,
                onRetry: () => ref.refresh(homeMedicinesProvider),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class MedicineCard extends ConsumerWidget {
  final MedicineModel medicine;
  final HomeThemeTokens tokens;
  final double? width;

  const MedicineCard({
    super.key,
    required this.medicine,
    required this.tokens,
    this.width = 175,
  });

  String _formatPrice(int? price) {
    if (price == null || price <= 0) return 'Kelishilgan';
    final str = price.toString();
    final buffer = StringBuffer();
    int count = 0;
    for (int i = str.length - 1; i >= 0; i--) {
      buffer.write(str[i]);
      count++;
      if (count % 3 == 0 && i != 0) {
        buffer.write('.');
      }
    }
    return '${buffer.toString().split('').reversed.join()} ${AppStrings.currency}';
  }

  Widget _placeholder(double size) => Center(
        child: Icon(
          Icons.medication_rounded,
          color: Colors.grey.shade400,
          size: size,
        ),
      );

  Widget _buildImage() {
    final url = medicine.imageUrl;
    if (url == null || url.isEmpty) return _placeholder(44);
    if (url.startsWith('assets/')) {
      return Image.asset(
        url,
        fit: BoxFit.contain,
        errorBuilder: (_, __, ___) => _placeholder(36),
      );
    }
    return CachedNetworkImage(
      imageUrl: url,
      fit: BoxFit.contain,
      placeholder: (_, __) => _placeholder(36),
      errorWidget: (_, __, ___) => _placeholder(36),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final formattedPrice = _formatPrice(medicine.price);
    final cartState = ref.watch(cartProvider);
    final cartItemIndex = cartState.items.indexWhere((it) => it.medicineId == medicine.id);
    final inCartQuantity = cartItemIndex != -1 ? cartState.items[cartItemIndex].quantity : 0;

    return Material(
      color: tokens.productCardBg,
      borderRadius: BorderRadius.circular(22),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          context.push('/medicines/${medicine.id}', extra: medicine);
        },
        child: Container(
          width: width,
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0A000000),
                blurRadius: 10,
                offset: Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Image box with rounded dark border (matching screenshot 1:1)
              Expanded(
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: const Color(0xFF2C2C2E),
                      width: 1.0,
                    ),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  child: _buildImage(),
                ),
              ),
              const SizedBox(height: 6),

              // Title
              Text(
                medicine.name,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'PingFang SC',
                  color: tokens.productTitle,
                  letterSpacing: -0.2,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),

              // Usage / Subtitle
              const SizedBox(height: 2),
              Text(
                medicine.usage ?? 'Tabiiy minerallarga boy ozuqa',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w400,
                  fontFamily: 'PingFang SC',
                  color: tokens.productSubtitle,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 3),
                child: Divider(
                  height: 1,
                  thickness: 0.8,
                  color: Color(0xFFE5E5EA),
                ),
              ),
              const SizedBox(height: 2),

              // Price (smaller, elegant)
              Text(
                formattedPrice,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'PingFang SC',
                  color: tokens.productPrice,
                  letterSpacing: -0.2,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 6),

              // Action Button: + Savatga (0 in cart) or Stepper (> 0 in cart)
              inCartQuantity == 0
                  ? Semantics(
                      label: '${medicine.name} - ${AppStrings.addToCart}',
                      button: true,
                      child: Material(
                        color: const Color(0xFF28CD41),
                        borderRadius: BorderRadius.circular(20),
                        child: InkWell(
                          onTap: () {
                            HapticFeedback.mediumImpact();
                            ref.read(cartProvider.notifier).addItem(
                                  medicineId: medicine.id,
                                  pharmacyId: medicine.pharmacyId ?? 1,
                                  name: medicine.name,
                                  price: medicine.price ?? 0,
                                  stockUnit: medicine.stockUnit,
                                  imageUrl: medicine.imageUrl,
                                );
                          },
                          borderRadius: BorderRadius.circular(20),
                          child: Container(
                            width: double.infinity,
                            height: 36,
                            alignment: Alignment.center,
                            child: Text(
                              AppStrings.addToCart,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13.5,
                                fontWeight: FontWeight.w600,
                                fontFamily: 'PingFang SC',
                              ),
                            ),
                          ),
                        ),
                      ),
                    )
                  : Container(
                      width: double.infinity,
                      height: 36,
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF2F2F7),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Minus button
                          Semantics(
                            label: '${medicine.name} kamaytirish',
                            button: true,
                            child: InkWell(
                              onTap: () {
                                HapticFeedback.lightImpact();
                                if (inCartQuantity > 1) {
                                  ref.read(cartProvider.notifier).updateQuantity(medicine.id, inCartQuantity - 1);
                                } else {
                                  ref.read(cartProvider.notifier).removeItem(medicine.id);
                                }
                              },
                              borderRadius: BorderRadius.circular(15),
                              child: Container(
                                width: 28,
                                height: 28,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF28CD41),
                                  shape: BoxShape.circle,
                                ),
                                alignment: Alignment.center,
                                child: const Icon(
                                  Icons.remove,
                                  color: Colors.white,
                                  size: 16,
                                ),
                              ),
                            ),
                          ),

                          // Quantity number
                          Text(
                            '$inCartQuantity',
                            style: const TextStyle(
                              color: Colors.black,
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              fontFamily: 'PingFang SC',
                            ),
                          ),

                          // Plus button
                          Semantics(
                            label: '${medicine.name} ko‘paytirish',
                            button: true,
                            child: InkWell(
                              onTap: () {
                                HapticFeedback.lightImpact();
                                ref.read(cartProvider.notifier).updateQuantity(medicine.id, inCartQuantity + 1);
                              },
                              borderRadius: BorderRadius.circular(15),
                              child: Container(
                                width: 28,
                                height: 28,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF28CD41),
                                  shape: BoxShape.circle,
                                ),
                                alignment: Alignment.center,
                                child: const Icon(
                                  Icons.add,
                                  color: Colors.white,
                                  size: 16,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
            ],
          ),
        ),
      ),
    );
  }
}
