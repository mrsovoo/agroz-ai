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

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Expanded(
                child: Text(
                  AppStrings.medicinesSectionTitle,
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.4,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
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
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.lg,
                        vertical: 6,
                      ),
                      child: Text(
                        AppStrings.viewAll,
                        style: TextStyle(
                          color: tokens.viewAllText,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          // 4-state Data Representation
          medicinesAsync.when(
            data: (medicines) {
              if (medicines.isEmpty) {
                return const EmptyView(message: AppStrings.medicinesEmpty);
              }

              return SizedBox(
                height: 290,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  itemCount: medicines.length,
                  separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.md),
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
              height: 290,
              child: Row(
                children: [
                  Expanded(
                    child: SkeletonLoader(
                      width: double.infinity,
                      height: 290,
                      borderRadius: tokens.radiusProductCard,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: SkeletonLoader(
                      width: double.infinity,
                      height: 290,
                      borderRadius: tokens.radiusProductCard,
                    ),
                  ),
                ],
              ),
            ),
            error: (error, _) => Container(
              height: 180,
              decoration: BoxDecoration(
                color: tokens.productCardBg,
                borderRadius: BorderRadius.circular(tokens.radiusProductCard),
                border: Border.all(color: tokens.productCardBorder),
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
      width: 170,
      padding: const EdgeInsets.all(AppSpacing.sm),
      decoration: BoxDecoration(
        color: tokens.productCardBg,
        borderRadius: BorderRadius.circular(tokens.radiusProductCard),
        border: Border.all(color: tokens.productCardBorder),
        boxShadow: tokens.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image / Placeholder container
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(tokens.radiusAddToCartBtn),
              ),
              alignment: Alignment.center,
              child: Icon(
                Icons.medication_rounded,
                color: Colors.grey.shade400,
                size: 50,
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.xs),

          // Title
          Text(
            medicine.name,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: tokens.productTitle,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),

          // Usage / subtitle
          Text(
            medicine.usage ?? 'Tabiiy minerallarga boy ozuqa',
            style: TextStyle(
              fontSize: 11,
              color: tokens.productSubtitle,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: AppSpacing.xs),

          // Price
          Text(
            formattedPrice,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: tokens.productPrice,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),

          // Add to Cart button
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
                  height: 38,
                  width: double.infinity,
                  alignment: Alignment.center,
                  child: Text(
                    AppStrings.addToCart,
                    style: TextStyle(
                      color: tokens.addToCartText,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
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
