import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/home_theme_tokens.dart';
import '../models/cart_item.dart';
import '../providers/cart_provider.dart';
import '../widgets/cart_checkout_modal.dart';

class CartScreen extends ConsumerStatefulWidget {
  final bool autoSeedDemo;
  const CartScreen({super.key, this.autoSeedDemo = false});

  @override
  ConsumerState<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends ConsumerState<CartScreen> {
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
                // Top Header: Back Button with "Asosiy" + "Savat" Title
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 10, 16, 8),
                  child: Row(
                    children: [
                      // Back to Asosiy button
                      InkWell(
                        onTap: () {
                          HapticFeedback.lightImpact();
                          if (context.canPop()) {
                            context.pop();
                          } else {
                            context.go('/');
                          }
                        },
                        borderRadius: BorderRadius.circular(12),
                        child: const Padding(
                          padding: EdgeInsets.symmetric(vertical: 6, horizontal: 6),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.arrow_back_ios_new_rounded,
                                size: 18,
                                color: Colors.black,
                              ),
                              SizedBox(width: 6),
                              Text(
                                'Asosiy',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  fontFamily: 'PingFang SC',
                                  color: Colors.black,
                                  letterSpacing: -0.2,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const Spacer(),
                      // Savat Title
                      const Text(
                        'Savat',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          fontFamily: 'PingFang SC',
                          color: Colors.black,
                          letterSpacing: -0.4,
                        ),
                      ),
                      const SizedBox(width: 4),
                    ],
                  ),
                ),

                // Action Bar (Tanlanganlarni o'chirish / Hammasini tanlash)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
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
                                fontFamily: 'PingFang SC',
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
                                  fontFamily: 'PingFang SC',
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
                            fontFamily: 'PingFang SC',
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
                            fontFamily: 'PingFang SC',
                          ),
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton(
                          onPressed: () => context.go('/medicines'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF35CA56),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                          ),
                          child: const Text(
                            'Dorilar bo‘limiga o‘tish',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontFamily: 'PingFang SC',
                            ),
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
                            fontFamily: 'PingFang SC',
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
                                  fontFamily: 'PingFang SC',
                                  color: _greyTextColor,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              _formatPrice(cartState.selectedSubtotal),
                              style: const TextStyle(
                                fontSize: 14,
                                fontFamily: 'PingFang SC',
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
                                  fontFamily: 'PingFang SC',
                                  color: _greyTextColor,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '- ${_formatPrice(cartState.selectedDiscount)}',
                              style: const TextStyle(
                                fontSize: 14,
                                fontFamily: 'PingFang SC',
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
                                  fontFamily: 'PingFang SC',
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
                                fontFamily: 'PingFang SC',
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
                            fontFamily: 'PingFang SC',
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
                            fontFamily: 'PingFang SC',
                            color: Color(0xFF666666),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),

            // Bottom Bar matching screenshot: Green "Rasmiylashtirish" button on left, floating circular cart button on right
            Positioned(
              left: 16,
              right: 16,
              bottom: 16,
              child: SafeArea(
                top: false,
                child: Row(
                  children: [
                    // Green "Rasmiylashtirish" button
                    Expanded(
                      child: Semantics(
                        button: true,
                        label: 'Rasmiylashtirish',
                        child: Material(
                          color: cartState.selectedCount > 0
                              ? const Color(0xFF00A82D)
                              : const Color(0xFFBDBDBD),
                          borderRadius: BorderRadius.circular(30),
                          elevation: cartState.selectedCount > 0 ? 4 : 0,
                          shadowColor: const Color(0x3300A82D),
                          child: InkWell(
                            onTap: cartState.selectedCount > 0
                                ? () {
                                    HapticFeedback.mediumImpact();
                                    CartCheckoutModal.show(
                                      context,
                                      cartState.selectedItems,
                                    );
                                  }
                                : null,
                            borderRadius: BorderRadius.circular(30),
                            child: Container(
                              height: 60,
                              alignment: Alignment.center,
                              child: const Text(
                                'Rasmiylashtirish',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 17,
                                  fontFamily: 'PingFang SC',
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: -0.2,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),

                    // Circular Dark Cart Button (matching mockup)
                    Semantics(
                      button: true,
                      label: 'Savat',
                      child: Container(
                        width: 65,
                        height: 65,
                        decoration: const BoxDecoration(
                          color: Color(0xFF333333),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Color(0x33000000),
                              blurRadius: 16,
                              offset: Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Material(
                          color: Colors.transparent,
                          shape: const CircleBorder(),
                          child: InkWell(
                            onTap: () {
                              HapticFeedback.lightImpact();
                            },
                            customBorder: const CircleBorder(),
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                const Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      Icons.shopping_cart_outlined,
                                      color: Colors.white,
                                      size: 22,
                                    ),
                                    SizedBox(height: 2),
                                    Text(
                                      'Savat',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 9.5,
                                        fontFamily: 'PingFang SC',
                                        fontWeight: FontWeight.w700,
                                        letterSpacing: -0.1,
                                      ),
                                    ),
                                  ],
                                ),
                                if (cartState.totalCount > 0)
                                  Positioned(
                                    top: 3,
                                    right: 3,
                                    child: Container(
                                      constraints: const BoxConstraints(
                                        minWidth: 20,
                                        minHeight: 20,
                                      ),
                                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFFA2B36),
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(color: Colors.white, width: 2),
                                        boxShadow: const [
                                          BoxShadow(
                                            color: Color(0x33000000),
                                            blurRadius: 4,
                                            offset: Offset(0, 1),
                                          ),
                                        ],
                                      ),
                                      alignment: Alignment.center,
                                      child: Text(
                                        cartState.totalCount > 99 ? '99+' : '${cartState.totalCount}',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 10,
                                          fontFamily: 'PingFang SC',
                                          fontWeight: FontWeight.w700,
                                          height: 1.0,
                                        ),
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
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
        fit: BoxFit.fill,
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
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 12,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Left Product Image Box (rounded corners with border)
          Container(
            width: 104,
            height: 104,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: const Color(0xFFF0F0F0),
                width: 1,
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
                              fontFamily: 'PingFang SC',
                              color: Colors.black,
                              letterSpacing: -0.2,
                            ),
                          ),
                          if (item.oldPrice != null) ...[
                            const SizedBox(height: 1),
                            Text(
                              formatRaw(item.oldPrice),
                              style: const TextStyle(
                                fontSize: 12.5,
                                fontFamily: 'PingFang SC',
                                color: Color(0xFF8E8E93),
                                decoration: TextDecoration.lineThrough,
                              ),
                            ),
                          ],
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
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'PingFang SC',
                    color: Colors.black,
                    letterSpacing: -0.2,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 1),

                // Pharmacy Name
                Text(
                  item.pharmacyName,
                  style: const TextStyle(
                    fontSize: 12.5,
                    fontFamily: 'PingFang SC',
                    color: Color(0xFF8E8E93),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 10),

                // Quantity selector and Heart button row
                Row(
                  children: [
                    // Quantity pill with rounded stepper matching mockup
                    Container(
                      height: 32,
                      decoration: BoxDecoration(
                        border: Border.all(color: const Color(0xFFDCDCE0), width: 1),
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
                          Container(
                            constraints: const BoxConstraints(minWidth: 32),
                            alignment: Alignment.center,
                            child: Text(
                              '${item.quantity}',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                fontFamily: 'PingFang SC',
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
        width: 22,
        height: 22,
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
                size: 15,
              )
            : null,
      ),
    );
  }
}

