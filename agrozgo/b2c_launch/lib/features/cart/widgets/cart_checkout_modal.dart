import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_provider.dart';
import '../../../core/services/location_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/cart_item.dart';
import '../providers/cart_provider.dart';

class CartCheckoutModal extends ConsumerStatefulWidget {
  final List<CartItem> items;

  const CartCheckoutModal({
    super.key,
    required this.items,
  });

  static Future<void> show(BuildContext context, List<CartItem> items) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => CartCheckoutModal(items: items),
    );
  }

  @override
  ConsumerState<CartCheckoutModal> createState() => _CartCheckoutModalState();
}

class _CartCheckoutModalState extends ConsumerState<CartCheckoutModal> {
  // 'form' or 'success'
  String _mode = 'form';
  String _deliveryType = 'pickup'; // 'pickup' or 'delivery'

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();

  bool _isLocating = false;
  bool _isSubmitting = false;
  String? _errorMessage;

  // Success details
  int? _createdOrderId;
  String? _pharmacyName;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _prefillUserData();
    });
  }

  void _prefillUserData() {
    final authState = ref.read(authProvider);
    final user = authState.user;
    if (user != null) {
      if (_nameController.text.isEmpty && (user.name ?? '').isNotEmpty) {
        _nameController.text = user.name!;
      }
      if (_phoneController.text.isEmpty && (user.phone ?? '').isNotEmpty) {
        _phoneController.text = user.phone!;
      }
      if (_addressController.text.isEmpty && (user.region ?? '').isNotEmpty) {
        _addressController.text =
            '${user.region}${user.district != null && user.district!.isNotEmpty ? ", ${user.district}" : ""}';
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  int get _itemsTotal {
    return widget.items.fold(0, (sum, it) => sum + it.total);
  }

  String _formatCurrency(int amount) {
    return amount.toString().replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]} ',
        );
  }

  Future<void> _detectLocation() async {
    HapticFeedback.lightImpact();
    setState(() {
      _isLocating = true;
      _errorMessage = null;
    });

    try {
      final loc = await LocationService.requestAndGetCurrentLocation();
      if (loc != null) {
        setState(() {
          _addressController.text =
              '${loc.region}, ${loc.district} (GPS: ${loc.latitude.toStringAsFixed(4)}, ${loc.longitude.toStringAsFixed(4)})';
        });
      } else {
        setState(() {
          _errorMessage = "Joylashuvni aniqlab bo'lmadi. GPS yoqilganligini tekshiring.";
        });
      }
    } catch (_) {
      setState(() {
        _errorMessage = "Joylashuvni aniqlashda xatolik yuz berdi.";
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLocating = false;
        });
      }
    }
  }

  Future<void> _submitOrder() async {
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    final address = _addressController.text.trim();

    if (name.isEmpty) {
      setState(() => _errorMessage = 'Ismingizni kiriting');
      return;
    }
    if (phone.isEmpty || phone.replaceAll(RegExp(r'\D'), '').length < 9) {
      setState(() => _errorMessage = 'Telefon raqamingizni to‘g‘ri kiriting');
      return;
    }
    if (_deliveryType == 'delivery' && address.length < 3) {
      setState(() => _errorMessage = 'Yetkazib berish manzilini kiriting');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      final apiClient = ref.read(apiClientProvider);
      final pharmacyId = widget.items.isNotEmpty ? widget.items.first.pharmacyId : 1;
      final safePharmacyId = pharmacyId > 0 ? pharmacyId : 1;

      final res = await apiClient.post(
        '/api/orders',
        data: {
          'pharmacySpecialistId': safePharmacyId,
          'customerName': name,
          'customerPhone': phone.startsWith('+') ? phone : '+998${phone.replaceAll(RegExp(r'\D'), '')}',
          'deliveryType': _deliveryType,
          'customerAddress': _deliveryType == 'delivery' ? address : null,
          'items': widget.items
              .map((it) => {
                    'medicineId': it.medicineId,
                    'qty': it.quantity,
                  })
              .toList(),
        },
      );

      int? orderId;
      String? phName;
      if (res is Map<String, dynamic>) {
        orderId = (res['orderId'] as num?)?.toInt();
        if (res['pharmacy'] is Map<String, dynamic>) {
          phName = res['pharmacy']['name'] as String?;
        }
      }

      orderId ??= DateTime.now().millisecondsSinceEpoch % 100000;
      phName ??= widget.items.isNotEmpty ? widget.items.first.pharmacyName : 'Agro Dorixona';

      // Clear purchased items from cart
      ref.read(cartProvider.notifier).deleteSelected();

      HapticFeedback.heavyImpact();
      if (mounted) {
        setState(() {
          _mode = 'success';
          _createdOrderId = orderId;
          _pharmacyName = phName;
          _isSubmitting = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
          _errorMessage = 'Buyurtma yuborishda xatolik yuz berdi. Qayta urinib ko‘ring.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.90,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 10, bottom: 6),
              width: 40,
              height: 4.5,
              decoration: BoxDecoration(
                color: const Color(0xFFE5E5EA),
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEBF9EE),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(
                    Icons.shopping_bag_outlined,
                    color: Color(0xFF039E1E),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _mode == 'form' ? 'Buyurtmani rasmiylashtirish' : 'Buyurtma qabul qilindi',
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF1C1C1E),
                          fontFamily: 'PingFang SC',
                        ),
                      ),
                      Text(
                        _mode == 'form'
                            ? '${widget.items.length} ta mahsulot • ${_formatCurrency(_itemsTotal)} so‘m'
                            : 'AgroZ xizmatingizda',
                        style: const TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF8E8E93),
                          fontFamily: 'PingFang SC',
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close_rounded, color: Color(0xFF8E8E93)),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFF2F2F7)),

          // Body
          Flexible(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(20, 16, 20, 20 + bottomInset),
              child: _mode == 'form' ? _buildForm() : _buildSuccess(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_errorMessage != null)
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: const Color(0xFFFFECEC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFFFB4B4)),
            ),
            child: Row(
              children: [
                const Icon(Icons.error_outline_rounded, color: Color(0xFFE53935), size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _errorMessage!,
                    style: const TextStyle(
                      color: Color(0xFFD32F2F),
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),

        // Yetkazib berish turi
        const Text(
          'Qabul qilish usuli',
          style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: Color(0xFF1C1C1E)),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: InkWell(
                onTap: () => setState(() => _deliveryType = 'pickup'),
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: _deliveryType == 'pickup' ? const Color(0xFFEBF9EE) : const Color(0xFFF7F7F8),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: _deliveryType == 'pickup' ? const Color(0xFF039E1E) : const Color(0xFFE5E5EA),
                      width: 1.5,
                    ),
                  ),
                  child: Column(
                    children: [
                      Icon(
                        Icons.store_rounded,
                        color: _deliveryType == 'pickup' ? const Color(0xFF039E1E) : const Color(0xFF8E8E93),
                        size: 24,
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Olib ketish',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: _deliveryType == 'pickup' ? const Color(0xFF039E1E) : const Color(0xFF636366),
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Dorixonadan',
                        style: TextStyle(fontSize: 11, color: Color(0xFF8E8E93)),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: InkWell(
                onTap: () => setState(() => _deliveryType = 'delivery'),
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: _deliveryType == 'delivery' ? const Color(0xFFEAF5FE) : const Color(0xFFF7F7F8),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: _deliveryType == 'delivery' ? const Color(0xFF007AFF) : const Color(0xFFE5E5EA),
                      width: 1.5,
                    ),
                  ),
                  child: Column(
                    children: [
                      Icon(
                        Icons.delivery_dining_rounded,
                        color: _deliveryType == 'delivery' ? const Color(0xFF007AFF) : const Color(0xFF8E8E93),
                        size: 24,
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Yetkazib berish',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: _deliveryType == 'delivery' ? const Color(0xFF007AFF) : const Color(0xFF636366),
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Manzilga kuryer',
                        style: TextStyle(fontSize: 11, color: Color(0xFF8E8E93)),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 18),

        // Agar yetkazib berish bo'lsa manzil maydoni
        if (_deliveryType == 'delivery') ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Yetkazib berish manzili',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF1C1C1E)),
              ),
              InkWell(
                onTap: _isLocating ? null : _detectLocation,
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                  child: Row(
                    children: [
                      if (_isLocating)
                        const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF039E1E)),
                        )
                      else
                        const Icon(Icons.my_location_rounded, size: 14, color: Color(0xFF039E1E)),
                      const SizedBox(width: 4),
                      Text(
                        _isLocating ? 'Aniqlanmoqda...' : 'Joylashuvni olish',
                        style: const TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF039E1E),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _addressController,
            decoration: InputDecoration(
              hintText: 'Tuman, qishloq, ko‘cha yoki uy raqami',
              prefixIcon: const Icon(Icons.location_on_outlined, size: 20),
              filled: true,
              fillColor: const Color(0xFFF7F7F8),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Ism field
        const Text(
          'Qabul qiluvchi ismi',
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF1C1C1E)),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _nameController,
          decoration: InputDecoration(
            hintText: 'Ismingiz',
            prefixIcon: const Icon(Icons.person_outline_rounded, size: 20),
            filled: true,
            fillColor: const Color(0xFFF7F7F8),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide.none,
            ),
          ),
        ),
        const SizedBox(height: 14),

        // Telefon field
        const Text(
          'Bog‘lanish uchun telefon',
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF1C1C1E)),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _phoneController,
          keyboardType: TextInputType.phone,
          decoration: InputDecoration(
            hintText: '+998 90 123 45 67',
            prefixIcon: const Icon(Icons.phone_outlined, size: 20),
            filled: true,
            fillColor: const Color(0xFFF7F7F8),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide.none,
            ),
          ),
        ),
        const SizedBox(height: 18),

        // Summary Card
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFF8F9FA),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFEEEEEE)),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Mahsulotlar soni', style: TextStyle(fontSize: 13, color: Color(0xFF8E8E93))),
                  Text('${widget.items.length} dona', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Jami summa', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF1C1C1E))),
                  Text(
                    '${_formatCurrency(_itemsTotal)} so‘m',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF039E1E),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Submit Button
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: _isSubmitting ? null : _submitOrder,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF35CA56),
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(26),
              ),
            ),
            child: _isSubmitting
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                  )
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.check_circle_outline_rounded, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'Buyurtmani tasdiqlash',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          fontFamily: 'PingFang SC',
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildSuccess() {
    return Column(
      children: [
        const SizedBox(height: 10),
        Container(
          width: 70,
          height: 70,
          decoration: const BoxDecoration(
            color: Color(0xFFEBF9EE),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.check_circle_rounded,
            color: Color(0xFF039E1E),
            size: 44,
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Buyurtmangiz qabul qilindi! 🎉',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1C1C1E),
            fontFamily: 'PingFang SC',
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 6),
        Text(
          'Buyurtma raqami: #$_createdOrderId',
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: Color(0xFF039E1E),
          ),
        ),
        const SizedBox(height: 20),

        // Order Info Box
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFF8F9FA),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFEEEEEE)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildInfoRow('Dorixona:', _pharmacyName ?? 'Agro Dorixona'),
              const Divider(height: 16, color: Color(0xFFEEEEEE)),
              _buildInfoRow(
                'Qabul qilish:',
                _deliveryType == 'delivery' ? '🚚 Yetkazib berish' : '🏬 Olib ketish',
              ),
              if (_deliveryType == 'delivery' && _addressController.text.isNotEmpty) ...[
                const Divider(height: 16, color: Color(0xFFEEEEEE)),
                _buildInfoRow('Manzil:', _addressController.text.trim()),
              ],
              const Divider(height: 16, color: Color(0xFFEEEEEE)),
              _buildInfoRow('Jami to‘lov:', '${_formatCurrency(_itemsTotal)} so‘m'),
            ],
          ),
        ),
        const SizedBox(height: 24),

        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: () => Navigator.of(context).pop(),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF35CA56),
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25)),
            ),
            child: const Text(
              'Tushunarli',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                fontFamily: 'PingFang SC',
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            color: Color(0xFF8E8E93),
            fontFamily: 'PingFang SC',
          ),
        ),
        Flexible(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1C1C1E),
              fontFamily: 'PingFang SC',
            ),
            textAlign: TextAlign.end,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
