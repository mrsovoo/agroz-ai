import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/api_config.dart';
import '../../core/models/medicine.dart';
import '../cart/cart_provider.dart';
import '../cart/cart_screen.dart';
import 'medicines_provider.dart';

class MedicineDetailScreen extends ConsumerWidget {
  final dynamic medicineId;
  const MedicineDetailScreen({super.key, required this.medicineId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final medAsync = ref.watch(medicineDetailProvider(medicineId));

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.chevron_left, size: 28),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: medAsync.maybeWhen(
          data: (m) => Text(
            m.name,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17),
          ),
          orElse: () => const Text(''),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.shopping_cart_outlined),
            onPressed: () {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (_) => const CartScreen(),
              );
            },
          ),
        ],
      ),
      body: medAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
        error: (e, _) => Center(child: Text('Xato: $e')),
        data: (medicine) => _MedicineDetailBody(medicine: medicine),
      ),
    );
  }
}

class _MedicineDetailBody extends ConsumerWidget {
  final Medicine medicine;
  const _MedicineDetailBody({required this.medicine});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);
    final inCart = cart.containsMedicine(medicine.id);
    final qty = cart.qtyOf(medicine.id);

    final photoUrl = '${ApiConfig.baseUrl}/api/medicines/${medicine.id}/photo'
        '${medicine.photoVersion != null ? '?v=${medicine.photoVersion}' : ''}';

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Photo
                AspectRatio(
                  aspectRatio: 1.2,
                  child: medicine.hasPhoto
                      ? Image.network(
                          photoUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _noPhoto(medicine.type),
                        )
                      : _noPhoto(medicine.type),
                ),
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Type badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          medicine.type == 'animal' ? '🐄 Chorva' : '🌱 Ekin',
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        medicine.name,
                        style: const TextStyle(
                            fontSize: 22, fontWeight: FontWeight.bold),
                      ),
                      if (medicine.price != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          medicine.formattedPrice,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                      if (medicine.usage != null) ...[
                        const SizedBox(height: 16),
                        const Text(
                          'Ishlatilishi',
                          style: TextStyle(
                              fontSize: 15, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          medicine.usage!,
                          style: const TextStyle(
                            fontSize: 14,
                            color: Color(0xFF374151),
                            height: 1.5,
                          ),
                        ),
                      ],
                      const SizedBox(height: 20),
                      // Pharmacy info
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF9FAFB),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE5E7EB)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Dorixona',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF6B7280),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              medicine.pharmacyName,
                              style: const TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 4),
                            Row(children: [
                              const Icon(Icons.location_on_outlined,
                                  size: 14, color: Color(0xFF9CA3AF)),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  medicine.pharmacyAddress ?? '',
                                  style: const TextStyle(
                                      fontSize: 13, color: Color(0xFF6B7280)),
                                  maxLines: 2,
                                ),
                              ),
                            ]),
                            const SizedBox(height: 4),
                            Row(children: [
                              const Icon(Icons.phone_outlined,
                                  size: 14, color: Color(0xFF9CA3AF)),
                              const SizedBox(width: 4),
                              Text(
                                medicine.pharmacyPhone ?? '',
                                style: const TextStyle(
                                    fontSize: 13, color: Color(0xFF6B7280)),
                              ),
                            ]),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        // Bottom add to cart bar
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
            child: inCart
                ? Row(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFFF3F4F6),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove, size: 18),
                              onPressed: () => ref
                                  .read(cartProvider.notifier)
                                  .removeOne(medicine.id),
                            ),
                            Text(
                              '$qty',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.add, size: 18),
                              onPressed: () => ref
                                  .read(cartProvider.notifier)
                                  .addItem(medicine),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: Colors.transparent,
                              builder: (_) => const CartScreen(),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: const Text(
                            'Savatga o\'tish',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ],
                  )
                : SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        ref.read(cartProvider.notifier).addItem(medicine);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content:
                                Text('${medicine.name} savatga qo\'shildi'),
                            action: SnackBarAction(
                              label: 'Savat',
                              textColor: Colors.amber,
                              onPressed: () {
                                showModalBottomSheet(
                                  context: context,
                                  isScrollControlled: true,
                                  backgroundColor: Colors.transparent,
                                  builder: (_) => const CartScreen(),
                                );
                              },
                            ),
                            duration: const Duration(seconds: 2),
                          ),
                        );
                      },
                      icon: const Icon(Icons.shopping_cart_outlined,
                          color: Colors.white),
                      label: const Text(
                        'Savatga qo\'shish',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                    ),
                  ),
          ),
        ),
      ],
    );
  }

  Widget _noPhoto(String type) {
    return Container(
      color: const Color(0xFFF3F4F6),
      child: Center(
        child: Icon(
          type == 'animal' ? Icons.pets : Icons.eco,
          size: 80,
          color: const Color(0xFFD1D5DB),
        ),
      ),
    );
  }
}
