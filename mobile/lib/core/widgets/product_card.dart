import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../models/medicine.dart';
import '../../features/cart/cart_provider.dart';
import 'package:go_router/go_router.dart';
import '../constants/api_config.dart';
import 'package:cached_network_image/cached_network_image.dart';

class ProductCard extends ConsumerStatefulWidget {
  final Medicine medicine;

  const ProductCard({super.key, required this.medicine});

  @override
  ConsumerState<ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends ConsumerState<ProductCard> {
  // Add a slight fallback variant if image fails
  int get fallbackVariant => widget.medicine.id.hashCode;

  @override
  Widget build(BuildContext context) {
    final cartItems = ref.watch(cartProvider);
    final inCartItem = cartItems.items
        .where((i) => i.medicine.id == widget.medicine.id)
        .firstOrNull;
    final inCart = inCartItem != null;
    final qty = inCartItem?.quantity ?? 0;

    final priceStr = widget.medicine.price != null
        ? NumberFormat.currency(locale: 'uz_UZ', symbol: '', decimalDigits: 0)
            .format(widget.medicine.price)
            .trim()
        : '0';

    return GestureDetector(
      onTap: () {
        context.push('/dorilar/${widget.medicine.id}');
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFF3F4F6)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. Rasm (Image)
            Expanded(
              flex: 10,
              child: ClipRRect(
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(16)),
                child: widget.medicine.hasPhoto
                    ? CachedNetworkImage(
                        imageUrl:
                            '${ApiConfig.baseUrl}/api/medicines/${widget.medicine.id}/photo${widget.medicine.photoVersion != null ? '?v=${widget.medicine.photoVersion}' : ''}',
                        fit: BoxFit.cover,
                        errorWidget: (context, url, error) =>
                            _renderVariantBag(),
                      )
                    : _renderVariantBag(),
              ),
            ),

            // 2. Ma'lumotlar (Nomi, Reyting, Tavsif)
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Nomi
                  Text(
                    widget.medicine.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF111827),
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 3),

                  // Reytingi va Dorixona
                  Row(
                    children: [
                      const Icon(Icons.star_rounded,
                          color: Color(0xFFF59E0B), size: 14),
                      const SizedBox(width: 3),
                      Text(
                        '${widget.medicine.ratingAvg?.toStringAsFixed(1) ?? '4.8'} (${widget.medicine.ratingCount})',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF4B5563),
                        ),
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          widget.medicine.pharmacyName.isNotEmpty
                              ? widget.medicine.pharmacyName
                              : (widget.medicine.type == 'crop'
                                  ? 'Ekin'
                                  : 'Chorva'),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 10,
                            color: Color(0xFF9CA3AF),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),

                  // Tavsifi (Qisqa tavsif / Qo'llanilishi)
                  Text(
                    widget.medicine.usage ??
                        (widget.medicine.type == 'crop'
                            ? 'Ekinlar uchun maxsus vosita'
                            : 'Chorva uchun yuqori samarali vosita'),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                ],
              ),
            ),

            // 3. Narxi va Xarid qilish tugmasi
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 4, 10, 10),
              child: Row(
                children: [
                  // Narxi
                  Expanded(
                    child: Text(
                      priceStr,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF111827),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.fade,
                      softWrap: false,
                    ),
                  ),
                  const SizedBox(width: 6),

                  // Xarid qilish tugmasi yoki Stepper
                  SizedBox(
                    height: 28,
                    child: inCart
                        ? Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              border:
                                  Border.all(color: const Color(0xFFE5E7EB)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                InkWell(
                                  onTap: () {
                                    ref
                                        .read(cartProvider.notifier)
                                        .removeOne(widget.medicine.id);
                                  },
                                  child: const Padding(
                                    padding:
                                        EdgeInsets.symmetric(horizontal: 6),
                                    child: Icon(Icons.remove,
                                        size: 14, color: Color(0xFF4B5563)),
                                  ),
                                ),
                                Text(
                                  '$qty',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF111827),
                                  ),
                                ),
                                InkWell(
                                  onTap: () {
                                    ref
                                        .read(cartProvider.notifier)
                                        .addItem(widget.medicine);
                                  },
                                  child: const Padding(
                                    padding:
                                        EdgeInsets.symmetric(horizontal: 6),
                                    child: Icon(Icons.add,
                                        size: 14, color: Color(0xFF4B5563)),
                                  ),
                                ),
                              ],
                            ),
                          )
                        : GestureDetector(
                            onTap: () {
                              ref
                                  .read(cartProvider.notifier)
                                  .addItem(widget.medicine);
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                      '${widget.medicine.name} savatga qo\'shildi'),
                                  duration: const Duration(milliseconds: 900),
                                ),
                              );
                            },
                            child: Container(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 10),
                              decoration: BoxDecoration(
                                color: const Color(0xFF00A638), // vibrant green
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Center(
                                child: Text(
                                  'Xarid qiling',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
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
    );
  }

  Widget _renderVariantBag() {
    final colors = [
      (const Color(0xFFE0F2FE), const Color(0xFF0284C7)), // Blue
      (const Color(0xFFFEF3C7), const Color(0xFFD97706)), // Amber
      (const Color(0xFFFCE7F3), const Color(0xFFDB2777)), // Pink
      (const Color(0xFFECFCCB), const Color(0xFF4D7C0F)), // Lime
    ];
    final colorPair = colors[fallbackVariant % colors.length];

    return Container(
      color: colorPair.$1,
      child: Center(
        child: Icon(
          widget.medicine.type == 'crop'
              ? Icons.eco_rounded
              : Icons.pets_rounded,
          size: 40,
          color: colorPair.$2.withValues(alpha: 0.5),
        ),
      ),
    );
  }
}
