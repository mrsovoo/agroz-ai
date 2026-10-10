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
                          context.push('/medicines');
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
                height: 335,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  itemCount: medicines.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    final item = medicines[index];
                    return _MedicineCard(
                      medicine: item,
                      tokens: tokens,
                    );
                  },
                ),
              );
            },
            loading: () => SizedBox(
              height: 335,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Row(
                  children: [
                    SkeletonLoader(
                      width: 190,
                      height: 335,
                      borderRadius: tokens.radiusProductCard,
                    ),
                    const SizedBox(width: 8),
                    SkeletonLoader(
                      width: 190,
                      height: 335,
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

class _MedicineCard extends ConsumerWidget {
  final MedicineModel medicine;
  final HomeThemeTokens tokens;

  const _MedicineCard({
    required this.medicine,
    required this.tokens,
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

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final formattedPrice = _formatPrice(medicine.price);

    return Container(
      width: 190,
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: tokens.productCardBg,
        borderRadius: BorderRadius.circular(tokens.radiusProductCard),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image / Placeholder container (height: 182, radius: 20)
          Container(
            width: double.infinity,
            height: 182,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(tokens.radiusProductImage),
              border: Border.all(
                color: tokens.productCardBorder,
                width: 0.3,
              ),
            ),
            clipBehavior: Clip.antiAlias,
            child: medicine.imageUrl != null && medicine.imageUrl!.isNotEmpty
                ? CachedNetworkImage(
                    imageUrl: medicine.imageUrl!,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Center(
                      child: Icon(
                        Icons.medication_rounded,
                        color: Colors.grey.shade400,
                        size: 40,
                      ),
                    ),
                    errorWidget: (_, __, ___) => Center(
                      child: Icon(
                        Icons.medication_rounded,
                        color: Colors.grey.shade400,
                        size: 40,
                      ),
                    ),
                  )
                : Center(
                    child: Icon(
                      Icons.medication_rounded,
                      color: Colors.grey.shade400,
                      size: 48,
                    ),
                  ),
          ),
          const SizedBox(height: 6),

          // Title
          Text(
            medicine.name,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w500,
              fontFamily: 'PingFang SC',
              color: tokens.productTitle,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),

          // Usage / Subtitle
          SizedBox(
            height: 24,
            child: Text(
              medicine.usage ?? 'Tabiiy minerallarga boy ozuqa',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w400,
                fontFamily: 'PingFang SC',
                color: tokens.productSubtitle,
                height: 1.2,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const Spacer(),

          // Price
          Text(
            formattedPrice,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              fontFamily: 'PingFang SC',
              color: tokens.productPrice,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 6),

          // + Savatga Button
          Semantics(
            label: '${medicine.name} - ${AppStrings.addToCart}',
            button: true,
            child: Material(
              color: tokens.addToCartBg,
              borderRadius: BorderRadius.circular(tokens.radiusAddToCartBtn),
              child: InkWell(
                onTap: () {
                  HapticFeedback.mediumImpact();
                  ref.read(cartProvider.notifier).addItem(
                        medicineId: medicine.id,
                        pharmacyId: medicine.pharmacyId ?? 1,
                        name: medicine.name,
                        price: medicine.price ?? 0,
                        stockUnit: medicine.stockUnit,
                      );
                  ScaffoldMessenger.of(context).hideCurrentSnackBar();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('${medicine.name} savatga qo‘shildi'),
                      duration: const Duration(seconds: 2),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                },
                borderRadius: BorderRadius.circular(tokens.radiusAddToCartBtn),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  alignment: Alignment.center,
                  child: Text(
                    AppStrings.addToCart,
                    style: TextStyle(
                      color: tokens.addToCartText,
                      fontSize: 12.2,
                      fontWeight: FontWeight.w500,
                      fontFamily: 'PingFang SC',
                      height: 1.43,
                    ),
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
