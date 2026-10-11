import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/home_theme_tokens.dart';
import '../../home/widgets/home_floating_nav.dart';
import '../models/cart_item.dart';
import '../providers/cart_provider.dart';

class CartScreen extends ConsumerStatefulWidget {
  final bool autoSeedDemo;
  const CartScreen({super.key, this.autoSeedDemo = true});

  @override
  ConsumerState<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends ConsumerState<CartScreen> {
  static const _greenColor = Color(0xFF00A82D);
  static const _redColor = Color(0xFFFA2B36);
  static const _greyTextColor = Color(0xFF8E8E93);
  static const _cardBg = Colors.white;

  @override
  void initState() {
    super.initState();
    if (widget.autoSeedDemo) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          ref.read(cartProvider.notifier).seedDemoIfEmpty();
        }
      });
    }
  }

  String _formatPrice(int price) {
    if (price <= 0) return '00.000 so’m';
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
    return '${buffer.toString().split('').reversed.join()} so’m';
  }

  String _formatRaw(int? price) {
    if (price == null || price <= 0) return '00.000';
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
    return buffer.toString().split('').reversed.join();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<HomeThemeTokens>() ?? HomeThemeTokens.light;
    final cartState = ref.watch(cartProvider);
    final notifier = ref.read(cartProvider.notifier);

    return Scaffold(
      backgroundColor: tokens.screenBackground,
      body: SafeArea(
        bottom: false,
        child: Stack(
          children: [
            // Scrollable Content
            ListView(
              physics: const BouncingScrollPhysics(
                parent: AlwaysScrollableScrollPhysics(),
              ),
              padding: const EdgeInsets.only(bottom: 120),
              children: [
                // Top Action Bar (Tanlanganlarni o'chirish / Hammasini tanlash)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: InkWell(
                          onTap: cartState.items.any((it) => it.isSelected)
                              ? () {
                                  HapticFeedback.mediumImpact();
                                  notifier.deleteSelected();
                                }
                              : null,
                          borderRadius: BorderRadius.circular(6),
                          child: const Padding(
                            padding: EdgeInsets.symmetric(vertical: 4, horizontal: 2),
                            child: Text(
                              "Tanlanganlarni o'chirish",
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: _greyTextColor,
                                fontSize: 13.5,
                                fontFamily: 'Arial',
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      InkWell(
                        onTap: () {
                          HapticFeedback.selectionClick();
                          notifier.toggleSelectAll(!cartState.isAllSelected);
                        },
                        borderRadius: BorderRadius.circular(6),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Text(
                                'Hammasini tanlash',
                                style: TextStyle(
                                  color: Colors.black,
                                  fontSize: 13.5,
                                  fontFamily: 'Arial',
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(width: 8),
                              _CustomCheckbox(
                                isChecked: cartState.isAllSelected,
                                onChanged: (v) {
                                  HapticFeedback.selectionClick();
                                  notifier.toggleSelectAll(v);
                                },
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const Divider(height: 1, thickness: 0.5, color: Color(0xFFE5E5EA)),
                const SizedBox(height: 8),

                // Items list or Empty state
                if (cartState.items.isEmpty)
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 30),
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(
                      color: _cardBg,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.shopping_cart_outlined,
                          size: 64,
                          color: _greyTextColor,
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Savatingiz hozircha bo‘sh',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w600,
                            fontFamily: 'Arial',
                            color: Colors.black,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Sizga kerakli dorilar va mahsulotlarni tanlab savatga qo‘shing.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 13,
                            color: _greyTextColor,
                            fontFamily: 'Arial',
                          ),
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton(
                          onPressed: () => context.go('/medicines'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _greenColor,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                          ),
                          child: const Text(
                            'Dorilar bo‘limiga o‘tish',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  ...cartState.items.map(
                    (item) => _CartItemCard(
                      item: item,
                      onToggleSelect: () => notifier.toggleSelect(item.medicineId),
                      onQuantityChanged: (q) => notifier.updateQuantity(item.medicineId, q),
                      onToggleFavorite: () => notifier.toggleFavorite(item.medicineId),
                      formatPrice: _formatPrice,
                      formatRaw: _formatRaw,
                    ),
                  ),

                if (cartState.items.isNotEmpty) ...[
                  const SizedBox(height: 6),

                  // Section 1: Buyurtmangiz card
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: _cardBg,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x0A000000),
                          blurRadius: 10,
                          offset: Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Buyurtmangiz',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Arial',
                            color: Colors.black,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                '${cartState.selectedCount} mahsulot',
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontFamily: 'Arial',
                                  color: _greyTextColor,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              _formatPrice(cartState.selectedSubtotal),
                              style: const TextStyle(
                                fontSize: 14,
                                fontFamily: 'Arial',
                                fontWeight: FontWeight.w500,
                                color: Colors.black,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const Expanded(
                              child: Text(
                                'Chegirmalar',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontFamily: 'Arial',
                                  color: _greyTextColor,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '- ${_formatPrice(cartState.selectedDiscount)}',
                              style: const TextStyle(
                                fontSize: 14,
                                fontFamily: 'Arial',
                                fontWeight: FontWeight.w500,
                                color: _redColor,
                              ),
                            ),
                          ],
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 10),
                          child: Divider(
                            height: 1,
                            thickness: 0.5,
                            color: Color(0xFFE5E5EA),
                          ),
                        ),
                        Row(
                          children: [
                            const Expanded(
                              child: Text(
                                'Jami',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  fontFamily: 'Arial',
                                  color: Colors.black,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              _formatPrice(cartState.selectedTotal),
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                fontFamily: 'Arial',
                                color: Colors.black,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Section 2: Yetkazib berish qoidasi card
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: _cardBg,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x0A000000),
                          blurRadius: 10,
                          offset: Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Yetkazib berish qoidasi',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Arial',
                            color: Colors.black,
                          ),
                        ),
                        Padding(
                          padding: EdgeInsets.symmetric(vertical: 10),
                          child: Divider(
                            height: 1,
                            thickness: 0.5,
                            color: Color(0xFFE5E5EA),
                          ),
                        ),
                        Text(
                          'Mahsulotni yetkazib berish uchun sizning buyurtmalaringiz qiymati 300.000 so\'m dan yuqori bo\'lishi kerak bo\'ladi va sizga 5 km ichidagi yaqin dorixonalar orqali yetkazib beriladi',
                          style: TextStyle(
                            fontSize: 13,
                            height: 1.45,
                            fontFamily: 'Arial',
                            color: Color(0xFF666666),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Action Button: Rasmiylashtirish
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Semantics(
                      button: true,
                      label: 'Rasmiylashtirish',
                      child: Material(
                        color: cartState.selectedCount > 0 ? _greenColor : const Color(0xFFBDBDBD),
                        borderRadius: BorderRadius.circular(16),
                        child: InkWell(
                          onTap: cartState.selectedCount > 0
                              ? () {
                                  HapticFeedback.mediumImpact();
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        'Buyurtma rasmiylashtirildi (${cartState.selectedCount} mahsulot)',
                                      ),
                                      behavior: SnackBarBehavior.floating,
                                      duration: const Duration(seconds: 2),
                                    ),
                                  );
                                }
                              : null,
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            height: 54,
                            alignment: Alignment.center,
                            child: const Text(
                              'Rasmiylashtirish',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 16.5,
                                fontFamily: 'Arial',
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),

            // Bottom Floating Navigation
            const Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: HomeFloatingNav(activeIndex: 3),
            ),
          ],
        ),
      ),
    );
  }
}

class _CartItemCard extends StatelessWidget {
  final CartItem item;
  final VoidCallback onToggleSelect;
  final ValueChanged<int> onQuantityChanged;
  final VoidCallback onToggleFavorite;
  final String Function(int) formatPrice;
  final String Function(int?) formatRaw;

  const _CartItemCard({
    required this.item,
    required this.onToggleSelect,
    required this.onQuantityChanged,
    required this.onToggleFavorite,
    required this.formatPrice,
    required this.formatRaw,
  });

  Widget _buildProductImage() {
    final path = item.imageUrl;
    if (path != null && path.startsWith('assets/')) {
      return Image.asset(
        path,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _fallbackImage(),
      );
    }
    return _fallbackImage();
  }

  Widget _fallbackImage() {
    return Container(
      color: const Color(0xFFF0F0F0),
      alignment: Alignment.center,
      child: const Icon(
        Icons.inventory_2_outlined,
        color: Color(0xFF9E9E9E),
        size: 40,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 10,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Left Product Image Box (114x114 with rounded corners)
          Container(
            width: 114,
            height: 114,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: const Color(0xFFEEEEEE),
                width: 0.5,
              ),
            ),
            clipBehavior: Clip.antiAlias,
            child: _buildProductImage(),
          ),
          const SizedBox(width: 12),

          // Right Content Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Price row with Checkbox
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            formatPrice(item.price),
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w700,
                              fontFamily: 'Arial',
                              color: Colors.black,
                            ),
                          ),
                          if (item.oldPrice != null)
                            Text(
                              formatRaw(item.oldPrice),
                              style: const TextStyle(
                                fontSize: 12.5,
                                fontFamily: 'Arial',
                                color: Color(0xFF8E8E93),
                                decoration: TextDecoration.lineThrough,
                              ),
                            ),
                        ],
                      ),
                    ),
                    _CustomCheckbox(
                      isChecked: item.isSelected,
                      onChanged: (_) {
                        HapticFeedback.selectionClick();
                        onToggleSelect();
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 4),

                // Product Name
                Text(
                  item.name,
                  style: const TextStyle(
                    fontSize: 15.5,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Arial',
                    color: Colors.black,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),

                // Pharmacy Name
                Text(
                  item.pharmacyName,
                  style: const TextStyle(
                    fontSize: 12.5,
                    fontFamily: 'Arial',
                    color: Color(0xFF8E8E93),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),

                // Quantity selector and Heart button row
                Row(
                  children: [
                    // Quantity pill
                    Container(
                      height: 32,
                      decoration: BoxDecoration(
                        border: Border.all(color: const Color(0xFFE5E5EA), width: 1),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          _QtyBtn(
                            icon: Icons.remove,
                            onTap: () {
                              HapticFeedback.lightImpact();
                              onQuantityChanged(item.quantity - 1);
                            },
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 10),
                            child: Text(
                              '${item.quantity}',
                              style: const TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w600,
                                fontFamily: 'Arial',
                                color: Colors.black,
                              ),
                            ),
                          ),
                          _QtyBtn(
                            icon: Icons.add,
                            onTap: () {
                              HapticFeedback.lightImpact();
                              onQuantityChanged(item.quantity + 1);
                            },
                          ),
                        ],
                      ),
                    ),

                    const Spacer(),

                    // Heart button
                    IconButton(
                      icon: Icon(
                        item.isFavorite ? Icons.favorite : Icons.favorite_border_rounded,
                        color: const Color(0xFFFA2B36),
                        size: 22,
                      ),
                      onPressed: () {
                        HapticFeedback.selectionClick();
                        onToggleFavorite();
                      },
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _QtyBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _QtyBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: SizedBox(
          width: 30,
          height: 32,
          child: Icon(icon, size: 16, color: Colors.black87),
        ),
      ),
    );
  }
}

class _CustomCheckbox extends StatelessWidget {
  final bool isChecked;
  final ValueChanged<bool> onChanged;

  const _CustomCheckbox({
    required this.isChecked,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => onChanged(!isChecked),
      child: Container(
        width: 20,
        height: 20,
        decoration: BoxDecoration(
          color: isChecked ? Colors.black : Colors.white,
          borderRadius: BorderRadius.circular(4),
          border: Border.all(
            color: isChecked ? Colors.black : const Color(0xFFC7C7CC),
            width: 1.5,
          ),
        ),
        alignment: Alignment.center,
        child: isChecked
            ? const Icon(
                Icons.check,
                color: Colors.white,
                size: 14,
              )
            : null,
      ),
    );
  }
}

