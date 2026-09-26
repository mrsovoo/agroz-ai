import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants/api_config.dart';
import '../../core/models/cart_item.dart';
import '../../core/models/medicine.dart';
import 'cart_provider.dart';
import 'order_provider.dart';

class CartScreen extends ConsumerStatefulWidget {
  const CartScreen({super.key});

  @override
  ConsumerState<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends ConsumerState<CartScreen> {
  final Set<String> _selectedItemIds = {};
  final Set<String> _favoriteIds = {};

  // 1-to-1 Checkout confirmation states matching design
  bool _isCheckoutConfirmation = false;
  final String _pickupOption = 'Dorixonadan olib ketish';
  String _pharmacyAddress =
      'Toshkent sh., Mirzo Ulug’bek tumani, Ziyolilar ko’chasi, 10uy';
  String _recipientName = 'Sohibjon Sulaymonov';
  String _recipientPhone = '+998 90 0000000';
  String _paymentMethod = 'card';
  bool _isSubmittingOrder = false;

  @override
  void initState() {
    super.initState();
    _loadSavedUserData();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final cart = ref.read(cartProvider);
      setState(() {
        if (cart.items.isEmpty) {
          // Demo fallback items if user opens empty cart
          _seedDemoCartIfEmpty();
        } else {
          _selectedItemIds.addAll(cart.items.map((e) => e.medicine.id));
        }
      });
    });
  }

  Future<void> _loadSavedUserData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedName = prefs.getString('user_name') ?? '';
      final savedPhone = prefs.getString('user_phone') ?? '';
      if (savedName.isNotEmpty) {
        setState(() => _recipientName = savedName);
      }
      if (savedPhone.isNotEmpty) {
        setState(() => _recipientPhone = savedPhone);
      }
    } catch (_) {}
  }

  void _seedDemoCartIfEmpty() {
    final cart = ref.read(cartProvider);
    if (cart.items.isEmpty) {
      ref.read(cartProvider.notifier).addItem(
            Medicine(
              id: '101',
              name: 'Mahsulot nomi',
              type: 'animal',
              price: 35000,
              usage: 'Sog\'lom chorva — barqaror hosildorlik',
              hasPhoto: false,
              pharmacyId: '1',
              pharmacyName: 'Dorixona nomi',
              ratingCount: 12,
            ),
          );
      ref.read(cartProvider.notifier).addItem(
            Medicine(
              id: '102',
              name: 'Mahsulot nomi',
              type: 'crop',
              price: 35000,
              usage: 'Sog\'lom o\'sish — baxtli hosil',
              hasPhoto: false,
              pharmacyId: '2',
              pharmacyName: 'Dorixona nomi',
              ratingCount: 18,
            ),
          );
      final updated = ref.read(cartProvider);
      _selectedItemIds.addAll(updated.items.map((e) => e.medicine.id));
    }
  }

  String _formatPrice(double amount) {
    return amount.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]}.',
        );
  }

  double _calculateSelectedTotal(List<CartItem> items) {
    double total = 0;
    for (final item in items) {
      if (_selectedItemIds.contains(item.medicine.id)) {
        total += item.totalPrice;
      }
    }
    return total;
  }

  int _calculateSelectedQty(List<CartItem> items) {
    int count = 0;
    for (final item in items) {
      if (_selectedItemIds.contains(item.medicine.id)) {
        count += item.qty;
      }
    }
    return count;
  }

  void _deleteSelected(List<CartItem> items) {
    for (final id in _selectedItemIds.toList()) {
      ref.read(cartProvider.notifier).removeItem(id);
    }
    setState(() {
      _selectedItemIds.clear();
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Tanlangan mahsulotlar savatdan o\'chirildi'),
        duration: Duration(milliseconds: 900),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);
    final items = cart.items;

    final allSelected =
        items.isNotEmpty && _selectedItemIds.length == items.length;
    final selectedTotal = _calculateSelectedTotal(items);
    final selectedQty = _calculateSelectedQty(items);

    if (_isCheckoutConfirmation) {
      final selectedItems =
          items.where((i) => _selectedItemIds.contains(i.medicine.id)).toList();
      return _buildCheckoutConfirmationView(
        selectedItems.isEmpty ? items : selectedItems,
        selectedTotal,
        selectedQty,
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: Column(
          children: [
            // 1. TOP HEADER (Tanlanganlarni o'chirish | Hammasini tanlash ☑)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  GestureDetector(
                    onTap: _selectedItemIds.isEmpty
                        ? null
                        : () => _deleteSelected(items),
                    child: Text(
                      'Tanlanganlarni o\'chirish',
                      style: TextStyle(
                        fontSize: 13,
                        color: _selectedItemIds.isEmpty
                            ? const Color(0xFFD1D5DB)
                            : const Color(0xFF9CA3AF),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        if (allSelected) {
                          _selectedItemIds.clear();
                        } else {
                          _selectedItemIds.clear();
                          _selectedItemIds
                              .addAll(items.map((i) => i.medicine.id));
                        }
                      });
                    },
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          'Hammasini tanlash',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF111827),
                          ),
                        ),
                        const SizedBox(width: 8),
                        _buildCustomCheckbox(allSelected),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, thickness: 1, color: Color(0xFFE5E7EB)),

            // 2. SCROLLABLE CONTENT
            Expanded(
              child: items.isEmpty
                  ? _buildEmptyState()
                  : ListView(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 12),
                      children: [
                        // Cart Items List
                        ...items.asMap().entries.map((entry) {
                          final index = entry.key;
                          final item = entry.value;
                          final isSelected =
                              _selectedItemIds.contains(item.medicine.id);
                          final isFavorite =
                              _favoriteIds.contains(item.medicine.id);
                          return _buildCartItemRow(
                              item, index, isSelected, isFavorite);
                        }),
                        const SizedBox(height: 14),

                        // 3. "Buyurtmangiz" Card
                        Container(
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.02),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Buyurtmangiz',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF111827),
                                ),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    '$selectedQty mahsulot',
                                    style: const TextStyle(
                                      fontSize: 13,
                                      color: Color(0xFF6B7280),
                                    ),
                                  ),
                                  Text(
                                    '${_formatPrice(selectedTotal)} so\'m',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF111827),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              const Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Chegirmalar',
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: Color(0xFF6B7280),
                                    ),
                                  ),
                                  Text(
                                    '- 00.000 so\'m',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFFE11D48), // rose/pink
                                    ),
                                  ),
                                ],
                              ),
                              const Padding(
                                padding: EdgeInsets.symmetric(vertical: 12),
                                child: Divider(
                                    height: 1, color: Color(0xFFF3F4F6)),
                              ),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    'Jami',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF111827),
                                    ),
                                  ),
                                  Text(
                                    '${_formatPrice(selectedTotal)} so\'m',
                                    style: const TextStyle(
                                      fontSize: 17,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFF111827),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 14),

                        // 4. "Yetkazib berish qoidasi" Card
                        Container(
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.02),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
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
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF111827),
                                ),
                              ),
                              SizedBox(height: 10),
                              Divider(height: 1, color: Color(0xFFE5E7EB)),
                              SizedBox(height: 10),
                              Text(
                                'Mahsulotni yetkazib berish uchun sizning buyurtmalaringiz qiymati 300.000 so\'m dan yuqori bo\'lishi kerak bo\'ladi va sizga 5 km ichidagi yaqin dorixonalar orqali yetkazib beriladi',
                                style: TextStyle(
                                  fontSize: 12.5,
                                  color: Color(0xFF6B7280),
                                  height: 1.45,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],
                    ),
            ),

            // 5. BOTTOM "Rasmiylashtirish" GREEN BUTTON
            Container(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
              color: Colors.white,
              child: SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _selectedItemIds.isEmpty
                      ? null
                      : () {
                          setState(() => _isCheckoutConfirmation = true);
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00A638), // vibrant green
                    disabledBackgroundColor: const Color(0xFFA7F3D0),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                  ),
                  child: const Text(
                    'Rasmiylashtirish',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCheckoutConfirmationView(
    List<CartItem> selectedItems,
    double selectedTotal,
    int selectedQty,
  ) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: Column(
          children: [
            // Top iOS Bar with back navigation
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 16, 8),
              child: Row(
                children: [
                  CupertinoButton(
                    padding: EdgeInsets.zero,
                    minSize: 32,
                    onPressed: () =>
                        setState(() => _isCheckoutConfirmation = false),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          CupertinoIcons.chevron_left,
                          color: Color(0xFF111827),
                          size: 22,
                        ),
                        SizedBox(width: 2),
                        Text(
                          'Savat',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF111827),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, thickness: 1, color: Color(0xFFE5E7EB)),

            // Scrollable Content matching media_1790412258342.jpg
            Expanded(
              child: ListView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.only(top: 12, bottom: 20),
                children: [
                  // CARD 1: Buyurtmani qabul qilish
                  _buildPickupCard(),

                  // CARD 2: Saqalanish muddati - 1 kun
                  _buildStorageDurationCard(selectedItems),

                  // CARD 3: To'lov turi
                  _buildPaymentMethodCard(),

                  // CARD 4: Buyurtmangiz
                  _buildOrderSummaryCard(selectedQty, selectedTotal),
                ],
              ),
            ),

            // STICKY BOTTOM BAR: Jami + Rasmiylashtirish button
            _buildStickyBottomBar(selectedItems, selectedTotal),
          ],
        ),
      ),
    );
  }

  Widget _buildPickupCard() {
    return Container(
      margin: const EdgeInsets.only(left: 16, right: 16, bottom: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Buyurtmani qabul qilish',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF111827),
              letterSpacing: -0.2,
            ),
          ),
          const SizedBox(height: 14),

          // Pill container: Dorixonadan olib ketish
          Container(
            width: double.infinity,
            height: 48,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: const Color(0xFFE5E7EB),
                width: 1.2,
              ),
            ),
            child: Text(
              _pickupOption,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: Color(0xFF1F2937),
              ),
            ),
          ),
          const SizedBox(height: 16),

          const Text(
            'Yaqin atrofdagi dorixona',
            style: TextStyle(
              fontSize: 12,
              color: Color(0xFF9CA3AF),
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),

          Text(
            _pharmacyAddress,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF111827),
              height: 1.35,
            ),
          ),
          const SizedBox(height: 4),

          const Text(
            'Buyurtma 1 kun ichida bekor qilinadi',
            style: TextStyle(
              fontSize: 11.5,
              color: Color(0xFFFB7185), // exact pink/rose warning color
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 14),

          // Button: Boshqasini tanlash
          GestureDetector(
            onTap: _selectOtherPharmacy,
            child: Container(
              width: double.infinity,
              height: 46,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: const Color(0xFFF3F4F6),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Text(
                'Boshqasini tanlash',
                style: TextStyle(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF111827),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),

          const Text(
            'Oluvchi',
            style: TextStyle(
              fontSize: 12,
              color: Color(0xFF9CA3AF),
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),

          GestureDetector(
            onTap: _editRecipientDialog,
            behavior: HitTestBehavior.opaque,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _recipientName,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _recipientPhone,
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
                const Icon(
                  CupertinoIcons.pencil,
                  size: 18,
                  color: Color(0xFF9CA3AF),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStorageDurationCard(List<CartItem> items) {
    return Container(
      margin: const EdgeInsets.only(left: 16, right: 16, bottom: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Saqalanish muddati - 1 kun',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: Color(0xFF111827),
              letterSpacing: -0.2,
            ),
          ),
          const SizedBox(height: 14),

          // Bento Max product package thumbnail
          SizedBox(
            height: 84,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: items.isEmpty ? 1 : items.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (ctx, idx) {
                final item = items.isNotEmpty ? items[idx] : null;
                final photoUrl = item != null
                    ? '${ApiConfig.baseUrl}/api/medicines/${item.medicine.id}/photo'
                    : '';
                final hasPhoto = item?.medicine.hasPhoto ?? false;

                return ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: SizedBox(
                    width: 84,
                    height: 84,
                    child: hasPhoto
                        ? Image.network(
                            photoUrl,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) =>
                                _renderVariantBag(idx),
                          )
                        : _renderVariantBag(idx),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentMethodCard() {
    return Container(
      margin: const EdgeInsets.only(left: 16, right: 16, bottom: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'To’lov turi',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: Color(0xFF111827),
              letterSpacing: -0.2,
            ),
          ),
          const SizedBox(height: 14),

          // Option 1: Naqd pul asosida
          GestureDetector(
            onTap: () => setState(() => _paymentMethod = 'cash'),
            child: Container(
              width: double.infinity,
              height: 52,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: _paymentMethod == 'cash'
                      ? const Color(0xFFBAE6FD)
                      : const Color(0xFFE5E7EB),
                  width: _paymentMethod == 'cash' ? 2 : 1.2,
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Naqd pul asosida',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF111827),
                    ),
                  ),
                  _buildPaymentRadioCircle(_paymentMethod == 'cash'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),

          // Option 2: Bank kartasi orqali
          GestureDetector(
            onTap: () => setState(() => _paymentMethod = 'card'),
            child: Container(
              width: double.infinity,
              height: 52,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: _paymentMethod == 'card'
                      ? const Color(0xFFBAE6FD)
                      : const Color(0xFFE5E7EB),
                  width: _paymentMethod == 'card' ? 2 : 1.2,
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Bank kartasi orqali',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF111827),
                    ),
                  ),
                  _buildPaymentRadioCircle(_paymentMethod == 'card'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentRadioCircle(bool isSelected) {
    return Container(
      width: 22,
      height: 22,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: isSelected ? const Color(0xFFBAE6FD) : const Color(0xFFD1D5DB),
          width: 2,
        ),
      ),
    );
  }

  Widget _buildOrderSummaryCard(int qty, double total) {
    final qtyStr = qty > 0 ? '$qty mahsulot' : '2 mahsulot';
    final totalStr =
        total > 0 ? '${_formatPrice(total)} so\'m' : '00.000 so\'m';

    return Container(
      margin: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Buyurtmangiz',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: Color(0xFF111827),
              letterSpacing: -0.2,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                qtyStr,
                style: const TextStyle(
                  fontSize: 13,
                  color: Color(0xFF6B7280),
                ),
              ),
              Text(
                totalStr,
                style: const TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF111827),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Chegirmalar',
                style: TextStyle(
                  fontSize: 13,
                  color: Color(0xFF6B7280),
                ),
              ),
              Text(
                '- 00.000 so\'m',
                style: TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFFE11D48),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStickyBottomBar(List<CartItem> items, double total) {
    final totalStr =
        total > 0 ? '${_formatPrice(total)} so\'m' : '00.000 so\'m';

    return Container(
      padding: const EdgeInsets.fromLTRB(18, 14, 18, 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Jami',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF111827),
                ),
              ),
              Text(
                totalStr,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF111827),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: _isSubmittingOrder
                  ? null
                  : () => _finalizeOrder(items, total),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00A638), // vibrant green
                disabledBackgroundColor: const Color(0xFFA7F3D0),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
              child: _isSubmittingOrder
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2.5,
                      ),
                    )
                  : const Text(
                      'Rasmiylashtirish',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  void _selectOtherPharmacy() {
    showCupertinoModalPopup<void>(
      context: context,
      builder: (BuildContext context) => CupertinoActionSheet(
        title: const Text(
          'Dorixonani tanlang',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        message:
            const Text('Buyurtmangizni qaysi filialdan olib ketmoqchisiz?'),
        actions: <CupertinoActionSheetAction>[
          CupertinoActionSheetAction(
            onPressed: () {
              setState(() {
                _pharmacyAddress =
                    'Toshkent sh., Mirzo Ulug’bek tumani, Ziyolilar ko’chasi, 10uy';
              });
              Navigator.pop(context);
            },
            child: const Text(
                'Mirzo Ulug’bek filiali (Ziyolilar ko\'chasi, 10uy)'),
          ),
          CupertinoActionSheetAction(
            onPressed: () {
              setState(() {
                _pharmacyAddress =
                    'Toshkent sh., Chilonzor tumani, Bunyodkor shoh ko\'chasi, 42uy';
              });
              Navigator.pop(context);
            },
            child: const Text(
                'Chilonzor filiali (Bunyodkor shoh ko\'chasi, 42uy)'),
          ),
          CupertinoActionSheetAction(
            onPressed: () {
              setState(() {
                _pharmacyAddress =
                    'Toshkent sh., Yunusobod tumani, Amir Temur shoh ko\'chasi, 15uy';
              });
              Navigator.pop(context);
            },
            child: const Text(
                'Yunusobod filiali (Amir Temur shoh ko\'chasi, 15uy)'),
          ),
          CupertinoActionSheetAction(
            onPressed: () {
              setState(() {
                _pharmacyAddress = 'Samarqand sh., Registon ko\'chasi, 8uy';
              });
              Navigator.pop(context);
            },
            child: const Text('Samarqand filiali (Registon ko\'chasi, 8uy)'),
          ),
          CupertinoActionSheetAction(
            onPressed: () {
              setState(() {
                _pharmacyAddress =
                    'Farg\'ona sh., Al-Farg\'oniy ko\'chasi, 23uy';
              });
              Navigator.pop(context);
            },
            child:
                const Text('Farg\'ona filiali (Al-Farg\'oniy ko\'chasi, 23uy)'),
          ),
        ],
        cancelButton: CupertinoActionSheetAction(
          isDefaultAction: true,
          onPressed: () => Navigator.pop(context),
          child: const Text('Bekor qilish'),
        ),
      ),
    );
  }

  void _editRecipientDialog() {
    final nameCtrl = TextEditingController(text: _recipientName);
    final phoneCtrl = TextEditingController(text: _recipientPhone);

    showCupertinoDialog<void>(
      context: context,
      builder: (BuildContext context) => CupertinoAlertDialog(
        title: const Text('Oluvchi ma\'lumotlari'),
        content: Padding(
          padding: const EdgeInsets.only(top: 12),
          child: Column(
            children: [
              CupertinoTextField(
                controller: nameCtrl,
                placeholder: 'Ism va familiya',
                style: const TextStyle(fontSize: 14),
              ),
              const SizedBox(height: 8),
              CupertinoTextField(
                controller: phoneCtrl,
                placeholder: 'Telefon raqam',
                keyboardType: TextInputType.phone,
                style: const TextStyle(fontSize: 14),
              ),
            ],
          ),
        ),
        actions: <CupertinoDialogAction>[
          CupertinoDialogAction(
            isDestructiveAction: true,
            onPressed: () => Navigator.pop(context),
            child: const Text('Bekor qilish'),
          ),
          CupertinoDialogAction(
            isDefaultAction: true,
            onPressed: () async {
              final newName = nameCtrl.text.trim();
              final newPhone = phoneCtrl.text.trim();
              if (newName.isNotEmpty && newPhone.isNotEmpty) {
                setState(() {
                  _recipientName = newName;
                  _recipientPhone = newPhone;
                });
                final prefs = await SharedPreferences.getInstance();
                await prefs.setString('user_name', newName);
                await prefs.setString('user_phone', newPhone);
              }
              if (!context.mounted) return;
              Navigator.pop(context);
            },
            child: const Text('Saqlash'),
          ),
        ],
      ),
    );
  }

  Future<void> _finalizeOrder(
      List<CartItem> selectedItems, double totalAmount) async {
    setState(() => _isSubmittingOrder = true);

    final success = await ref.read(orderProvider.notifier).placeOrder(
          items: selectedItems,
          customerName: _recipientName,
          customerPhone: _recipientPhone,
          deliveryType: 'pickup',
          address: _pharmacyAddress,
        );

    setState(() => _isSubmittingOrder = false);
    if (!mounted) return;

    if (success) {
      final orderNum = ref.read(orderProvider).orderNumber ?? '#000001';

      // Clear ordered items from cart
      for (final item in selectedItems) {
        ref.read(cartProvider.notifier).removeItem(item.medicine.id);
      }
      _selectedItemIds.clear();

      showCupertinoDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext context) => CupertinoAlertDialog(
          title: const Column(
            children: [
              Icon(CupertinoIcons.checkmark_circle_fill,
                  color: Color(0xFF00A638), size: 48),
              SizedBox(height: 8),
              Text(
                'Buyurtma qabul qilindi! 🎉',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ],
          ),
          content: Padding(
            padding: const EdgeInsets.only(top: 10),
            child: Text(
              'Buyurtma raqamingiz: $orderNum\n\n'
              'Dorixona: $_pharmacyAddress\n\n'
              'Saqlanish muddati: 1 kun\n'
              'To\'lov turi: ${_paymentMethod == 'card' ? 'Bank kartasi orqali' : 'Naqd pul asosida'}\n\n'
              'Dorixonaga tashrif buyurib, buyurtma raqamini ko\'rsatishingiz mumkin.',
              style: const TextStyle(fontSize: 13, height: 1.4),
            ),
          ),
          actions: <CupertinoDialogAction>[
            CupertinoDialogAction(
              onPressed: () {
                Navigator.pop(context);
                setState(() => _isCheckoutConfirmation = false);
                context.go('/profil');
              },
              child: const Text('Buyurtmalar tarixi'),
            ),
            CupertinoDialogAction(
              isDefaultAction: true,
              onPressed: () {
                Navigator.pop(context);
                setState(() => _isCheckoutConfirmation = false);
                context.go('/');
              },
              child: const Text('Asosiy sahifaga'),
            ),
          ],
        ),
      );
    } else if (mounted) {
      final err = ref.read(orderProvider).error ??
          'Buyurtma berishda xatolik yuz berdi';
      showCupertinoDialog(
        context: context,
        builder: (ctx) => CupertinoAlertDialog(
          title: const Text('Xatolik'),
          content: Text(err),
          actions: [
            CupertinoDialogAction(
              child: const Text('OK'),
              onPressed: () => Navigator.pop(ctx),
            ),
          ],
        ),
      );
    }
  }

  Widget _buildCustomCheckbox(bool isChecked) {
    return Container(
      width: 19,
      height: 19,
      decoration: BoxDecoration(
        color: isChecked ? Colors.black : Colors.white,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(
          color: Colors.black,
          width: 1.8,
        ),
      ),
      child: isChecked
          ? const Center(
              child: Icon(
                Icons.check,
                size: 13,
                color: Colors.white,
              ),
            )
          : null,
    );
  }

  Widget _buildCartItemRow(
    CartItem item,
    int index,
    bool isSelected,
    bool isFavorite,
  ) {
    final photoUrl =
        '${ApiConfig.baseUrl}/api/medicines/${item.medicine.id}/photo';
    final priceStr = item.medicine.price != null
        ? '${_formatPrice(item.medicine.price!.toDouble())} so\'m'
        : '00.000 so\'m';
    final subPriceStr = item.medicine.price != null
        ? _formatPrice(item.medicine.price!.toDouble())
        : '00.000';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Left Bag Image
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: SizedBox(
              width: 104,
              height: 104,
              child: item.medicine.hasPhoto
                  ? Image.network(
                      photoUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _renderVariantBag(index),
                    )
                  : _renderVariantBag(index),
            ),
          ),
          const SizedBox(width: 14),

          // Right Details Column
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Price + Checkbox Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      priceStr,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF111827),
                      ),
                    ),
                    GestureDetector(
                      onTap: () {
                        setState(() {
                          if (isSelected) {
                            _selectedItemIds.remove(item.medicine.id);
                          } else {
                            _selectedItemIds.add(item.medicine.id);
                          }
                        });
                      },
                      child: _buildCustomCheckbox(isSelected),
                    ),
                  ],
                ),

                // Sub price in grey
                Text(
                  subPriceStr,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF9CA3AF),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),

                // Product Name
                Text(
                  item.medicine.name,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF111827),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),

                // Pharmacy Name
                Text(
                  item.medicine.pharmacyName.isNotEmpty
                      ? item.medicine.pharmacyName
                      : 'Dorixona nomi',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF9CA3AF),
                  ),
                ),
                const SizedBox(height: 8),

                // Bottom Row: Stepper [ — 1 + ] + Heart Icon
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Stepper
                    Container(
                      height: 32,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFE5E7EB)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          InkWell(
                            onTap: () {
                              ref
                                  .read(cartProvider.notifier)
                                  .removeOne(item.medicine.id);
                            },
                            child: const Padding(
                              padding: EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 4),
                              child: Icon(Icons.remove,
                                  size: 14, color: Color(0xFF4B5563)),
                            ),
                          ),
                          Container(
                            constraints: const BoxConstraints(minWidth: 24),
                            alignment: Alignment.center,
                            child: Text(
                              '${item.qty}',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF111827),
                              ),
                            ),
                          ),
                          InkWell(
                            onTap: () {
                              ref
                                  .read(cartProvider.notifier)
                                  .addItem(item.medicine);
                            },
                            child: const Padding(
                              padding: EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 4),
                              child: Icon(Icons.add,
                                  size: 14, color: Color(0xFF4B5563)),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Heart icon on the right
                    GestureDetector(
                      onTap: () {
                        setState(() {
                          if (isFavorite) {
                            _favoriteIds.remove(item.medicine.id);
                          } else {
                            _favoriteIds.add(item.medicine.id);
                          }
                        });
                      },
                      child: Padding(
                        padding: const EdgeInsets.all(4),
                        child: Icon(
                          isFavorite
                              ? Icons.favorite_rounded
                              : Icons.favorite_border_rounded,
                          color: const Color(0xFFE11D48), // rose/pink
                          size: 22,
                        ),
                      ),
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

  Widget _renderVariantBag(int index) {
    if (index % 2 == 1) {
      // Agro Max Green/Yellow Vegetable Bag
      return _styledFeedBag(
        title: 'AGRO MAX',
        subtitle: 'Sog\'lom o\'sish —\nBAXTLI HOSIL!',
        productName: 'AGRO\nMAX',
        headerColor: const Color(0xFF00A638),
        bgImageUrl:
            'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80',
      );
    } else {
      // Bento Max Blue Feed Bag
      return _styledFeedBag(
        title: 'AZIYA AGRO KIMYO',
        subtitle: 'Sog\'lom chorva —\nBARQAROR HOSILDORLIK!',
        productName: 'BENTO\nMAX',
        headerColor: const Color(0xFF1E3A8A),
        bgImageUrl:
            'https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=500&auto=format&fit=crop&q=80',
      );
    }
  }

  Widget _styledFeedBag({
    required String title,
    required String subtitle,
    required String productName,
    required Color headerColor,
    required String bgImageUrl,
  }) {
    return Container(
      color: const Color(0xFFF3F4F6),
      child: Stack(
        alignment: Alignment.center,
        children: [
          Positioned.fill(
            child: Opacity(
              opacity: 0.15,
              child: Image.network(
                bgImageUrl,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const SizedBox(),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 8,
                    fontWeight: FontWeight.bold,
                    color: headerColor,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 6,
                    fontWeight: FontWeight.w600,
                    color: headerColor.withValues(alpha: 0.8),
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                ),
                const SizedBox(height: 4),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.9),
                    borderRadius: BorderRadius.circular(4),
                    border:
                        Border.all(color: headerColor.withValues(alpha: 0.3)),
                  ),
                  child: Text(
                    productName,
                    style: TextStyle(
                      fontSize: 8,
                      fontWeight: FontWeight.w900,
                      color: headerColor,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.shopping_cart_outlined,
                size: 72, color: Color(0xFFD1D5DB)),
            const SizedBox(height: 16),
            const Text(
              'Savatingiz bo\'sh',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF374151),
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Dorilar bo\'limidan kerakli mahsulotlarni tanlang',
              style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF)),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => context.go('/dorilar'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00A638),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Dorilar bo\'limiga o\'tish',
                  style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }
}
