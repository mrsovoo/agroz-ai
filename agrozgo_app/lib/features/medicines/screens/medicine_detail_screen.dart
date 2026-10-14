import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/home_theme_tokens.dart';
import '../../cart/providers/cart_provider.dart';
import '../../home/providers/home_providers.dart';
import '../models/medicine_models.dart';
import '../../home/widgets/home_medicines_section.dart';

class MedicineDetailScreen extends ConsumerWidget {
  final MedicineModel medicine;

  const MedicineDetailScreen({
    super.key,
    required this.medicine,
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

  Widget _buildImage() {
    final url = medicine.imageUrl;
    if (url == null || url.isEmpty) {
      return Center(
        child: Icon(Icons.medication_rounded, color: Colors.grey.shade400, size: 90),
      );
    }
    if (url.startsWith('assets/')) {
      return Image.asset(
        url,
        fit: BoxFit.contain,
        errorBuilder: (_, __, ___) => Center(
          child: Icon(Icons.medication_rounded, color: Colors.grey.shade400, size: 90),
        ),
      );
    }
    return CachedNetworkImage(
      imageUrl: url,
      fit: BoxFit.contain,
      placeholder: (_, __) => Center(
        child: Icon(Icons.medication_rounded, color: Colors.grey.shade300, size: 90),
      ),
      errorWidget: (_, __, ___) => Center(
        child: Icon(Icons.medication_rounded, color: Colors.grey.shade400, size: 90),
      ),
    );
  }

  void _handleBack(BuildContext context) {
    HapticFeedback.lightImpact();
    if (Navigator.of(context).canPop()) {
      Navigator.of(context).pop();
    } else if (context.canPop()) {
      context.pop();
    } else {
      context.go('/');
    }
  }

  Widget _buildTopBar(BuildContext context, WidgetRef ref, dynamic cartState) {
    final isFavorite = cartState.items.any((it) => it.medicineId == medicine.id && it.isFavorite);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Back button
          Semantics(
            label: 'Ortga qaytish',
            button: true,
            child: Material(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              elevation: 1.5,
              shadowColor: const Color(0x1F000000),
              child: InkWell(
                onTap: () => _handleBack(context),
                borderRadius: BorderRadius.circular(20),
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.arrow_back_ios_new_rounded, size: 14, color: Colors.black87),
                      SizedBox(width: 6),
                      Text(
                        'Ortga',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: Colors.black87,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Favorite button
          Semantics(
            label: isFavorite ? 'Sevimlilardan o‘chirish' : 'Sevimlilarga qo‘shish',
            button: true,
            child: Material(
              color: Colors.white,
              shape: const CircleBorder(),
              elevation: 1.5,
              shadowColor: const Color(0x1F000000),
              child: InkWell(
                customBorder: const CircleBorder(),
                onTap: () {
                  HapticFeedback.lightImpact();
                  ref.read(cartProvider.notifier).toggleFavorite(medicine.id);
                },
                child: SizedBox(
                  width: 40,
                  height: 40,
                  child: Center(
                    child: Icon(
                      isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                      color: isFavorite ? const Color(0xFFFA2B36) : Colors.black54,
                      size: 20,
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

  Widget _buildBottomBar(BuildContext context, WidgetRef ref, int inCartQuantity) {
    final bottomInset = MediaQuery.of(context).padding.bottom;
    final effectiveQty = inCartQuantity > 0 ? inCartQuantity : 1;
    final totalAmount = (medicine.price ?? 0) * effectiveQty;
    final formattedTotal = _formatPrice(totalAmount);

    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 16,
            offset: Offset(0, -4),
          ),
        ],
        border: Border(
          top: BorderSide(color: Color(0x14000000), width: 0.8),
        ),
      ),
      padding: EdgeInsets.fromLTRB(
        16,
        12,
        16,
        bottomInset > 0 ? bottomInset + 8 : 16,
      ),
      child: Row(
        children: [
          // Left side: Jami narxi & Dynamic calculated price
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    const Text(
                      'Jami narxi',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                    if (inCartQuantity > 1) ...[
                      const SizedBox(width: 4),
                      Text(
                        '($inCartQuantity dona)',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF9CA3AF),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  formattedTotal,
                  style: const TextStyle(
                    fontSize: 18.5,
                    fontWeight: FontWeight.w800,
                    fontFamily: 'PingFang SC',
                    color: Color(0xFF28CD41),
                    letterSpacing: -0.3,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),

          const SizedBox(width: 12),

          // Right side: 'Savatga' button or Counter Stepper (- qty +)
          if (inCartQuantity == 0)
            Material(
              color: const Color(0xFF28CD41),
              borderRadius: BorderRadius.circular(22),
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
                borderRadius: BorderRadius.circular(22),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.add_shopping_cart_rounded, color: Colors.white, size: 18),
                      SizedBox(width: 8),
                      Text(
                        'Savatga',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 14.5,
                          fontWeight: FontWeight.w700,
                          fontFamily: 'PingFang SC',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            )
          else
            Container(
              height: 44,
              padding: const EdgeInsets.symmetric(horizontal: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFF2F2F7),
                borderRadius: BorderRadius.circular(22),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Material(
                    color: const Color(0xFF28CD41),
                    shape: const CircleBorder(),
                    child: InkWell(
                      customBorder: const CircleBorder(),
                      onTap: () {
                        HapticFeedback.lightImpact();
                        if (inCartQuantity > 1) {
                          ref.read(cartProvider.notifier).updateQuantity(medicine.id, inCartQuantity - 1);
                        } else {
                          ref.read(cartProvider.notifier).removeItem(medicine.id);
                        }
                      },
                      child: const SizedBox(
                        width: 32,
                        height: 32,
                        child: Icon(Icons.remove, color: Colors.white, size: 17),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    child: Text(
                      '$inCartQuantity',
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        fontFamily: 'PingFang SC',
                        color: Colors.black87,
                      ),
                    ),
                  ),
                  Material(
                    color: const Color(0xFF28CD41),
                    shape: const CircleBorder(),
                    child: InkWell(
                      customBorder: const CircleBorder(),
                      onTap: () {
                        HapticFeedback.lightImpact();
                        ref.read(cartProvider.notifier).updateQuantity(medicine.id, inCartQuantity + 1);
                      },
                      child: const SizedBox(
                        width: 32,
                        height: 32,
                        child: Icon(Icons.add, color: Colors.white, size: 17),
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = Theme.of(context).extension<HomeThemeTokens>() ?? HomeThemeTokens.light;
    final cartState = ref.watch(cartProvider);
    final cartItemIndex = cartState.items.indexWhere((it) => it.medicineId == medicine.id);
    final inCartQuantity = cartItemIndex != -1 ? cartState.items[cartItemIndex].quantity : 0;
    final formattedPrice = _formatPrice(medicine.price);

    final catalog = ref.watch(catalogMedicinesProvider);
    final similar = catalog.where((m) => m.id != medicine.id).take(4).toList();

    final typeLabel = medicine.type == 'animal'
        ? '🐄 Hayvon'
        : medicine.type == 'crop'
            ? '🌱 Ekin'
            : '📦 Umumiy';
    final typeBg = medicine.type == 'animal'
        ? const Color(0xFFFEF3C7)
        : medicine.type == 'crop'
            ? const Color(0xFFDCFCE7)
            : const Color(0xFFE0F2FE);
    final typeColor = medicine.type == 'animal'
        ? const Color(0xFF92400E)
        : medicine.type == 'crop'
            ? const Color(0xFF166534)
            : const Color(0xFF0369A1);

    return PopScope(
      canPop: true,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        _handleBack(context);
      },
      child: Scaffold(
        backgroundColor: tokens.screenBackground,
        body: SafeArea(
          bottom: false,
          child: Column(
            children: [
              // Top Bar: Back button + Favorite
              _buildTopBar(context, ref, cartState),

              // Main scrollable content
              Expanded(
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(
                    parent: BouncingScrollPhysics(),
                  ),
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
                  child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Big Image box (white with border)
                    Container(
                      height: 250,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: const Color(0xFF2C2C2E),
                          width: 1.0,
                        ),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x08000000),
                            blurRadius: 12,
                            offset: Offset(0, 4),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(20),
                      child: _buildImage(),
                    ),
                    const SizedBox(height: 16),

                    // Header: Title & Type badge
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            medicine.name,
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              fontFamily: 'PingFang SC',
                              color: Colors.black87,
                              letterSpacing: -0.3,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: typeBg,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            typeLabel,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: typeColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    // Rating & Stock
                    Row(
                      children: [
                        const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 19),
                        const SizedBox(width: 4),
                        const Text(
                          '4.8',
                          style: TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w700,
                            color: Colors.black87,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '(18 baho)',
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w500,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF2F2F7),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            medicine.stockUnit,
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Colors.black54,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Price
                    Text(
                      formattedPrice,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        fontFamily: 'PingFang SC',
                        color: Color(0xFF28CD41),
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Description / Tavsif
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0x12000000)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'TAVSIF',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.5,
                              color: Colors.black45,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            medicine.usage ??
                                "Tabiiy minerallarga boy yuqori sifatli qo'shimcha. Chorva mollari va ekinlar sog'lig'i hamda mahsuldorligini oshirish uchun maxsus ishlab chiqilgan.",
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w400,
                              color: Color(0xFF374151),
                              height: 1.45,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Pharmacy / Agro-dokon Card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0x1F000000)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.storefront_rounded, size: 19, color: Color(0xFF28CD41)),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  medicine.pharmacyName ?? 'Agroz Agro-do‘kon',
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.black87,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              const Icon(Icons.location_on_rounded, size: 15, color: Colors.black45),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  medicine.pharmacyAddress ?? 'Farg‘ona viloyati, Bag‘dod tumani',
                                  style: const TextStyle(
                                    fontSize: 12.5,
                                    color: Colors.black54,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          const Row(
                            children: [
                              Icon(Icons.access_time_rounded, size: 14, color: Colors.black45),
                              SizedBox(width: 6),
                              Text(
                                '09:00 - 18:00 (Har kuni)',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.black45,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          InkWell(
                            onTap: () {
                              HapticFeedback.lightImpact();
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Qo‘ng‘iroq: +998 90 123 45 67'),
                                  duration: Duration(seconds: 2),
                                ),
                              );
                            },
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              decoration: BoxDecoration(
                                color: const Color(0xFF28CD41),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.phone_rounded, color: Colors.white, size: 15),
                                  SizedBox(width: 6),
                                  Text(
                                    'Qo‘ng‘iroq qilish',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 12.5,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),

                    // Trust security notice
                    const Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.verified_user_outlined, size: 15, color: Colors.black45),
                        SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'Buyurtma to‘g‘ridan-to‘g‘ri agro-do‘konga Telegram orqali yetib boradi va holatini kuzatib borishingiz mumkin.',
                            style: TextStyle(
                              fontSize: 11.5,
                              color: Colors.black45,
                              height: 1.3,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Similar products section
                    if (similar.isNotEmpty) ...[
                      const Text(
                        'O‘xshash mahsulotlar',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          fontFamily: 'PingFang SC',
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 10),
                      SizedBox(
                        height: 310,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          physics: const BouncingScrollPhysics(),
                          itemCount: similar.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 8),
                          itemBuilder: (context, index) {
                            return MedicineCard(
                              medicine: similar[index],
                              tokens: tokens,
                            );
                          },
                        ),
                      ),
                    ],
                  ],
                ),
                ),
              ),

              // Pinned Bottom Action Bar: Jami narxi on left, Savatga on right
              _buildBottomBar(context, ref, inCartQuantity),
            ],
          ),
        ),
      ),
    );
  }
}
