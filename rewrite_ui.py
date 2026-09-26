import re

# 1. Read home_screen.dart
with open('apps/mobile/lib/features/home/home_screen.dart', 'r') as f:
    home_content = f.read()

# Remove QuickServicesSection usage
home_content = re.sub(
    r'// Quick Services:.*?\n\s*const _QuickServicesSection\(\),\n\s*const SizedBox\(height: 20\),', 
    '', 
    home_content, 
    flags=re.DOTALL
)

# Replace the text overlay in SizUchunSection
# We find the PageView.builder item and replace it to just be the image
siz_uchun_replacement = '''
                  return GestureDetector(
                    onTap: () {
                      if (ad.linkUrl != null) {
                        // could launch url here
                      }
                    },
                    child: Container(
                      margin: const EdgeInsets.only(right: 8),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.06),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: ad.imageUrl != null
                            ? Image.network(
                                ad.imageUrl!,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => Container(color: Colors.grey.shade200),
                              )
                            : Container(color: const Color(0xFF00A638)),
                      ),
                    ),
                  );
'''

# We need to replace the whole `return GestureDetector(...);` inside `itemBuilder: (context, index) {`
home_content = re.sub(
    r'return GestureDetector\([^;]+;\s*},',
    siz_uchun_replacement.strip() + '\n                },',
    home_content,
    flags=re.DOTALL
)

# Also update the Top Header logo to be closer to screenshot
logo_replacement = '''
            Container(
              width: 36,
              height: 36,
              decoration: const BoxDecoration(
                color: Color(0xFF00A638),
                shape: BoxShape.circle,
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Positioned(
                    bottom: 6,
                    child: Container(
                      width: 18,
                      height: 18,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  Positioned(
                    top: 10,
                    child: Icon(
                      Icons.keyboard_arrow_up_rounded,
                      color: Color(0xFFEAB308),
                      size: 24,
                    ),
                  ),
                ],
              ),
            ),
'''

home_content = re.sub(
    r'Container\(\s*width: 36,\s*height: 36,\s*decoration: const BoxDecoration\(\s*color: Color\(0xFF00A638\).*?size: 18,\s*\),\s*\],\s*\),\s*\),',
    logo_replacement.strip() + ',',
    home_content,
    flags=re.DOTALL
)

# Write back
with open('apps/mobile/lib/features/home/home_screen.dart', 'w') as f:
    f.write(home_content)

# 2. Read product_card.dart
with open('apps/mobile/lib/core/widgets/product_card.dart', 'r') as f:
    prod_content = f.read()

new_product_card = '''
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
    final inCartItem = cartItems.where((i) => i.medicine.id == widget.medicine.id).firstOrNull;
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
            // TOP: Image (Taking up maximum space)
            Expanded(
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                child: widget.medicine.hasPhoto
                    ? CachedNetworkImage(
                        imageUrl: '${ApiConfig.baseUrl}/api/medicines/${widget.medicine.id}/photo${widget.medicine.photoVersion != null ? '?v=${widget.medicine.photoVersion}' : ''}',
                        fit: BoxFit.cover,
                        errorWidget: (context, url, error) => _renderVariantBag(),
                      )
                    : _renderVariantBag(),
              ),
            ),
            
            // BOTTOM: Price + Action Button
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 10, 10, 10),
              child: Row(
                children: [
                  // Price Tag
                  Expanded(
                    flex: 1,
                    child: Text(
                      priceStr,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF111827),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.fade,
                      softWrap: false,
                    ),
                  ),
                  const SizedBox(width: 8),

                  // Action Button
                  SizedBox(
                    height: 32,
                    child: inCart
                        ? Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFFE5E7EB)),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                InkWell(
                                  onTap: () {
                                    ref.read(cartProvider.notifier).removeOne(widget.medicine.id);
                                  },
                                  child: const Padding(
                                    padding: EdgeInsets.symmetric(horizontal: 10),
                                    child: Icon(Icons.remove, size: 16, color: Color(0xFF4B5563)),
                                  ),
                                ),
                                Text(
                                  '$qty',
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF111827),
                                  ),
                                ),
                                InkWell(
                                  onTap: () {
                                    ref.read(cartProvider.notifier).addItem(widget.medicine);
                                  },
                                  child: const Padding(
                                    padding: EdgeInsets.symmetric(horizontal: 10),
                                    child: Icon(Icons.add, size: 16, color: Color(0xFF4B5563)),
                                  ),
                                ),
                              ],
                            ),
                          )
                        : GestureDetector(
                            onTap: () {
                              ref.read(cartProvider.notifier).addItem(widget.medicine);
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('${widget.medicine.name} savatga qo\\'shildi'),
                                  duration: const Duration(milliseconds: 900),
                                ),
                              );
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              decoration: BoxDecoration(
                                color: const Color(0xFF00A638), // vibrant green
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Center(
                                child: Text(
                                  'Xarid qiling',
                                  style: TextStyle(
                                    fontSize: 12,
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
          widget.medicine.type == 'crop' ? Icons.eco_rounded : Icons.pets_rounded,
          size: 40,
          color: colorPair.$2.withValues(alpha: 0.5),
        ),
      ),
    );
  }
}
'''

with open('apps/mobile/lib/core/widgets/product_card.dart', 'w') as f:
    f.write(new_product_card)

