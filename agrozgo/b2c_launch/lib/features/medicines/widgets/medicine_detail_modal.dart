import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_strings.dart';
import '../../cart/providers/cart_provider.dart';
import '../models/medicine_models.dart';

class MedicineDetailModal extends ConsumerWidget {
  final MedicineModel medicine;

  const MedicineDetailModal({
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
        child: Icon(Icons.medication_rounded, color: Colors.grey.shade400, size: 72),
      );
    }
    if (url.startsWith('assets/')) {
      return Image.asset(
        url,
        fit: BoxFit.contain,
        errorBuilder: (_, __, ___) => Center(
          child: Icon(Icons.medication_rounded, color: Colors.grey.shade400, size: 72),
        ),
      );
    }
    return CachedNetworkImage(
      imageUrl: url,
      fit: BoxFit.contain,
      placeholder: (_, __) => Center(
        child: Icon(Icons.medication_rounded, color: Colors.grey.shade300, size: 72),
      ),
      errorWidget: (_, __, ___) => Center(
        child: Icon(Icons.medication_rounded, color: Colors.grey.shade400, size: 72),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cartState = ref.watch(cartProvider);
    final cartItemIndex = cartState.items.indexWhere((it) => it.medicineId == medicine.id);
    final inCartQuantity = cartItemIndex != -1 ? cartState.items[cartItemIndex].quantity : 0;
    final formattedPrice = _formatPrice(medicine.price);

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

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.90,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          children: [
            // Drag handle & close row
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: typeBg,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      typeLabel,
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                        color: typeColor,
                      ),
                    ),
                  ),
                  Container(
                    width: 36,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  InkWell(
                    onTap: () => Navigator.pop(context),
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: const Icon(Icons.close_rounded, size: 18, color: Colors.black87),
                    ),
                  ),
                ],
              ),
            ),

            const Divider(height: 1, thickness: 0.6, color: Color(0x14000000)),

            // Scrollable Content
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Product image container
                    Container(
                      height: 220,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(
                          color: const Color(0xFF2C2C2E),
                          width: 1.0,
                        ),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x08000000),
                            blurRadius: 10,
                            offset: Offset(0, 4),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(16),
                      child: _buildImage(),
                    ),
                    const SizedBox(height: 14),

                    // Title
                    Text(
                      medicine.name,
                      style: const TextStyle(
                        fontSize: 21,
                        fontWeight: FontWeight.w800,
                        fontFamily: 'PingFang SC',
                        color: Colors.black87,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 6),

                    // Rating & Stock
                    Row(
                      children: [
                        const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 18),
                        const SizedBox(width: 4),
                        const Text(
                          '4.8',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: Colors.black87,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '(18 baho)',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
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
                        fontSize: 22,
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
                        color: const Color(0xFFF9FAFB),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0x12000000)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'TAVSIF VA QO‘LLANILISHI',
                            style: TextStyle(
                              fontSize: 10.5,
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
                              fontSize: 13.5,
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
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0x1F000000)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.storefront_rounded, size: 18, color: Color(0xFF28CD41)),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  medicine.pharmacyName ?? 'Agroz Agro-do‘kon',
                                  style: const TextStyle(
                                    fontSize: 14.5,
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
                                    fontSize: 12,
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
                                  fontSize: 11.5,
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
                            'Buyurtma to‘g‘ridan-to‘g‘ri agro-do‘konga yetib boradi va holatini kuzatib borishingiz mumkin.',
                            style: TextStyle(
                              fontSize: 11.5,
                              color: Colors.black45,
                              height: 1.3,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),

            // Sticky Bottom Cart Bar
            Container(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(
                  top: BorderSide(color: Color(0x14000000)),
                ),
              ),
              child: Row(
                children: [
                  // Total price display
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'Jami narxi',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: Colors.black45,
                        ),
                      ),
                      Text(
                        formattedPrice,
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          fontFamily: 'PingFang SC',
                          color: Color(0xFF28CD41),
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),

                  // Cart Action Button
                  if (inCartQuantity == 0)
                    ElevatedButton.icon(
                      onPressed: () {
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
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF28CD41),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                      ),
                      icon: const Icon(Icons.add_shopping_cart_rounded, size: 17),
                      label: const Text(
                        'Savatga qo‘shish',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          fontFamily: 'PingFang SC',
                        ),
                      ),
                    )
                  else
                    Container(
                      height: 42,
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF2F2F7),
                        borderRadius: BorderRadius.circular(21),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          InkWell(
                            onTap: () {
                              HapticFeedback.lightImpact();
                              if (inCartQuantity > 1) {
                                ref.read(cartProvider.notifier).updateQuantity(medicine.id, inCartQuantity - 1);
                              } else {
                                ref.read(cartProvider.notifier).removeItem(medicine.id);
                              }
                            },
                            borderRadius: BorderRadius.circular(16),
                            child: Container(
                              width: 32,
                              height: 32,
                              decoration: const BoxDecoration(
                                color: Color(0xFF28CD41),
                                shape: BoxShape.circle,
                              ),
                              alignment: Alignment.center,
                              child: const Icon(Icons.remove, color: Colors.white, size: 17),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 14),
                            child: Text(
                              '$inCartQuantity',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                fontFamily: 'PingFang SC',
                                color: Colors.black87,
                              ),
                            ),
                          ),
                          InkWell(
                            onTap: () {
                              HapticFeedback.lightImpact();
                              ref.read(cartProvider.notifier).updateQuantity(medicine.id, inCartQuantity + 1);
                            },
                            borderRadius: BorderRadius.circular(16),
                            child: Container(
                              width: 32,
                              height: 32,
                              decoration: const BoxDecoration(
                                color: Color(0xFF28CD41),
                                shape: BoxShape.circle,
                              ),
                              alignment: Alignment.center,
                              child: const Icon(Icons.add, color: Colors.white, size: 17),
                            ),
                          ),
                        ],
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
