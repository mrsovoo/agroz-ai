import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_provider.dart';
import '../../../core/services/location_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/specialist_models.dart';

class SpecialistCallModal extends ConsumerStatefulWidget {
  final SpecialistModel specialist;
  final String? initialCallId;
  final String? initialStatus;

  const SpecialistCallModal({
    super.key,
    required this.specialist,
    this.initialCallId,
    this.initialStatus,
  });

  static Future<void> show(
    BuildContext context,
    SpecialistModel specialist, {
    String? initialCallId,
    String? initialStatus,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => SpecialistCallModal(
        specialist: specialist,
        initialCallId: initialCallId,
        initialStatus: initialStatus,
      ),
    );
  }

  @override
  ConsumerState<SpecialistCallModal> createState() => _SpecialistCallModalState();
}

class _SpecialistCallModalState extends ConsumerState<SpecialistCallModal> {
  // Mode: 'form' or 'tracking'
  late String _mode;
  String? _callId;
  int _callProgress = 1; // 1: Yuborildi, 2: Qabul qilindi / Yo'lda, 3: Bajarildi
  bool _isCancelled = false;

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _problemController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _feedbackController = TextEditingController();

  double? _userLat;
  double? _userLng;
  bool _isLocating = false;
  bool _isSubmitting = false;
  String? _errorMessage;

  int _ratingStars = 5;
  bool _ratingSubmitted = false;
  bool _isSubmittingRating = false;

  Timer? _statusTimer;

  bool get _isVeterinar {
    final spec = widget.specialist;
    final specialty = spec.specialty?.toLowerCase() ?? '';
    return spec.role == 'veterinarian' ||
        specialty.contains('veterinar') ||
        specialty.contains('chorva') ||
        specialty.contains('hayvon');
  }

  @override
  void initState() {
    super.initState();
    if (widget.initialCallId != null && widget.initialCallId!.isNotEmpty) {
      _mode = 'tracking';
      _callId = widget.initialCallId;
      _updateProgressFromStatus(widget.initialStatus);
      _startStatusPolling();
    } else {
      _mode = 'form';
    }

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
        _addressController.text = '${user.region}${user.district != null && user.district!.isNotEmpty ? ", ${user.district}" : ""}';
      }
    }
  }

  void _updateProgressFromStatus(String? status) {
    if (status == 'completed' || status == 'bajarildi') {
      _callProgress = 3;
      _isCancelled = false;
    } else if (status == 'tasdiqlandi' || status == 'qabul_qilindi' || status == 'yolda') {
      _callProgress = 2;
      _isCancelled = false;
    } else if (status == 'bekor' || status == 'cancelled') {
      _isCancelled = true;
    } else {
      _callProgress = 1;
      _isCancelled = false;
    }
  }

  void _startStatusPolling() {
    _statusTimer?.cancel();
    _statusTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      _fetchStatus();
    });
  }

  Future<void> _fetchStatus() async {
    if (_callId == null) return;
    try {
      final apiClient = ref.read(apiClientProvider);
      final phone = _phoneController.text.trim();
      final res = await apiClient.get(
        '/api/specialists/call/$_callId/status',
        queryParameters: phone.isNotEmpty ? {'phone': phone} : null,
      );
      if (res is Map<String, dynamic> && res['ok'] == true) {
        final status = res['status'] as String?;
        if (mounted) {
          setState(() {
            _updateProgressFromStatus(status);
            if (_callProgress == 3 || _isCancelled) {
              _statusTimer?.cancel();
            }
          });
        }
      }
    } catch (_) {
      // Ignore polling errors
    }
  }

  @override
  void dispose() {
    _statusTimer?.cancel();
    _nameController.dispose();
    _phoneController.dispose();
    _problemController.dispose();
    _addressController.dispose();
    _feedbackController.dispose();
    super.dispose();
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
        _userLat = loc.latitude;
        _userLng = loc.longitude;
        setState(() {
          _addressController.text = '${loc.region}, ${loc.district} (GPS: ${loc.latitude.toStringAsFixed(4)}, ${loc.longitude.toStringAsFixed(4)})';
        });
      } else {
        setState(() {
          _errorMessage = "Joylashuvni aniqlab bo'lmadi. GPS yoqilganligini tekshiring.";
        });
      }
    } catch (e) {
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

  Future<void> _submitCall() async {
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    final problem = _problemController.text.trim();
    final address = _addressController.text.trim();

    if (name.isEmpty) {
      setState(() => _errorMessage = 'Ismingizni kiriting');
      return;
    }
    if (phone.isEmpty || phone.replaceAll(RegExp(r'\D'), '').length < 9) {
      setState(() => _errorMessage = 'Telefon raqamingizni to‘g‘ri kiriting');
      return;
    }
    if (problem.isEmpty) {
      setState(() => _errorMessage = 'Muammo bayonini qisqacha yozing');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      final apiClient = ref.read(apiClientProvider);
      final res = await apiClient.post(
        '/api/specialists/call',
        data: {
          'specialistId': widget.specialist.id,
          'customerName': name,
          'customerPhone': phone.startsWith('+') ? phone : '+998${phone.replaceAll(RegExp(r'\D'), '')}',
          'problem': problem,
          'address': address.isNotEmpty ? address : 'Manzil ko‘rsatilmadi',
          if (_userLat != null) 'userLat': _userLat,
          if (_userLng != null) 'userLng': _userLng,
        },
      );

      String? createdCallId;
      if (res is Map<String, dynamic>) {
        createdCallId = (res['callId'] ?? res['id'])?.toString();
      }

      createdCallId ??= 'call_${DateTime.now().millisecondsSinceEpoch}';

      HapticFeedback.mediumImpact();
      if (mounted) {
        setState(() {
          _mode = 'tracking';
          _callId = createdCallId;
          _callProgress = 1;
          _isSubmitting = false;
        });
        _startStatusPolling();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
          _errorMessage = 'Chaqiruv yuborishda xatolik yuz berdi. Qayta urinib ko‘ring.';
        });
      }
    }
  }

  Future<void> _submitRating() async {
    if (_isSubmittingRating || _ratingSubmitted) return;
    setState(() {
      _isSubmittingRating = true;
    });

    try {
      final apiClient = ref.read(apiClientProvider);
      await apiClient.post(
        '/api/specialists/${widget.specialist.id}/rate',
        data: {
          'stars': _ratingStars,
          'callId': _callId,
          if (_feedbackController.text.trim().isNotEmpty)
            'comment': _feedbackController.text.trim(),
        },
      );

      HapticFeedback.lightImpact();
      if (mounted) {
        setState(() {
          _ratingSubmitted = true;
          _isSubmittingRating = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isSubmittingRating = false;
          _ratingSubmitted = true; // graceful fallback
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final spec = widget.specialist;

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
                    color: _isVeterinar ? const Color(0xFFEBF9EE) : const Color(0xFFEAF5FE),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(
                    _isVeterinar ? Icons.pets_rounded : Icons.eco_rounded,
                    color: _isVeterinar ? const Color(0xFF039E1E) : const Color(0xFF007AFF),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _mode == 'form' ? 'Mutaxassisni chaqirish' : 'Chaqiruv holati',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF1C1C1E),
                          fontFamily: 'PingFang SC',
                        ),
                      ),
                      Text(
                        '${spec.name} • ${_isVeterinar ? "Veterinar" : "Agronom"}',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF8E8E93),
                          fontFamily: 'PingFang SC',
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
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

          // Body ScrollView
          Flexible(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(20, 16, 20, 20 + bottomInset),
              child: _mode == 'form' ? _buildFormContent() : _buildTrackingContent(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormContent() {
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

        // Specialist Quick Card
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFF8F9FA),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFEEEEEE)),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: const Color(0xFF35CA56).withValues(alpha: 0.15),
                child: Text(
                  widget.specialist.name.isNotEmpty ? widget.specialist.name[0] : 'M',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF039E1E),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.specialist.name,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF1C1C1E),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      widget.specialist.address.isNotEmpty
                          ? widget.specialist.address
                          : 'Farg‘ona viloyati',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF8E8E93),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              if (widget.specialist.rating != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF8E7),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.star_rounded, color: Color(0xFFFFA000), size: 16),
                      const SizedBox(width: 4),
                      Text(
                        widget.specialist.rating!.toStringAsFixed(1),
                        style: const TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFFB76E00),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 18),

        // Ism field
        const Text(
          'Ismingiz',
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF1C1C1E)),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _nameController,
          decoration: InputDecoration(
            hintText: 'To‘liq ismingizni kiriting',
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
          'Telefon raqamingiz',
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
        const SizedBox(height: 14),

        // Muammo bayoni
        const Text(
          'Muammo bayoni',
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF1C1C1E)),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _problemController,
          maxLines: 3,
          decoration: InputDecoration(
            hintText: 'Muammoingizni qisqacha yozing (masalan: molim yotib qoldi, ishtahasi yo‘q...)',
            filled: true,
            fillColor: const Color(0xFFF7F7F8),
            contentPadding: const EdgeInsets.all(14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide.none,
            ),
          ),
        ),
        const SizedBox(height: 14),

        // Manzil va GPS tugmasi
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Manzilingiz',
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
            hintText: 'Qishloq, ko‘cha yoki mo‘ljal',
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
        const SizedBox(height: 24),

        // Submit Button
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: _isSubmitting ? null : _submitCall,
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
                      Icon(Icons.send_rounded, size: 18),
                      SizedBox(width: 8),
                      Text(
                        'Arizani yuborish',
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

  Widget _buildTrackingContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Status Tracker Header Card
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: _callProgress == 3
                  ? [const Color(0xFFE8F5E9), const Color(0xFFC8E6C9)]
                  : [const Color(0xFFEAF5FE), const Color(0xFFD6EDFF)],
            ),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.06),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Icon(
                  _callProgress == 3
                      ? Icons.check_circle_rounded
                      : _callProgress == 2
                          ? Icons.directions_car_rounded
                          : Icons.hourglass_top_rounded,
                  color: _callProgress == 3
                      ? const Color(0xFF039E1E)
                      : const Color(0xFF007AFF),
                  size: 28,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                _callProgress == 3
                    ? 'Xizmat bajarildi!'
                    : _callProgress == 2
                        ? 'Mutaxassis yo‘lga chiqdi'
                        : 'Arizangiz qabul qilindi',
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1C1C1E),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),
              Text(
                _callId != null ? 'Chaqiruv ID: #$_callId' : 'Kuzatilmoqda...',
                style: const TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF636366),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Steps Timeline
        const Text(
          'Jarayon bosqichlari',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: Color(0xFF1C1C1E),
          ),
        ),
        const SizedBox(height: 16),

        _buildTimelineStep(
          stepNumber: 1,
          title: 'Arizangiz yuborildi',
          subtitle: 'Mutaxassis arizangiz bilan tanishmoqda',
          isActive: _callProgress >= 1,
          isCompleted: _callProgress > 1,
          isLast: false,
        ),
        _buildTimelineStep(
          stepNumber: 2,
          title: 'Qabul qilindi / Yo‘lda',
          subtitle: 'Mutaxassis siz tomon yo‘l oldi yoki bog‘landi',
          isActive: _callProgress >= 2,
          isCompleted: _callProgress > 2,
          isLast: false,
        ),
        _buildTimelineStep(
          stepNumber: 3,
          title: 'Yakunlandi',
          subtitle: 'Xizmat ko‘rsatildi va muammo hal etildi',
          isActive: _callProgress >= 3,
          isCompleted: _callProgress == 3,
          isLast: true,
        ),
        const SizedBox(height: 20),

        // Mutaxassisga qo'ng'iroq qilish tugmasi (faqat telefon raqam mavjud bo'lsa)
        if (widget.specialist.phone.trim().isNotEmpty) ...[
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF8F9FA),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFEEEEEE)),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: const Color(0xFF35CA56).withValues(alpha: 0.15),
                  child: Text(
                    widget.specialist.name.isNotEmpty ? widget.specialist.name[0] : 'M',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF039E1E),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.specialist.name,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                          color: Color(0xFF1C1C1E),
                        ),
                      ),
                      Text(
                        widget.specialist.phone,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF8E8E93),
                        ),
                      ),
                    ],
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    Clipboard.setData(ClipboardData(text: widget.specialist.phone));
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Raqam nusxalandi: ${widget.specialist.phone}'),
                        behavior: SnackBarBehavior.floating,
                        duration: const Duration(seconds: 2),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF35CA56),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  icon: const Icon(Icons.phone_rounded, size: 16),
                  label: const Text('Qo‘ng‘iroq', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
          ),
        ],

        // Agar bajarilgan bo'lsa reyting qoldirish
        if (_callProgress == 3) ...[
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFBEA),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFFFE082)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Xizmat sifatini baholang',
                  style: TextStyle(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF795548),
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(5, (index) {
                    final star = index + 1;
                    return IconButton(
                      onPressed: _ratingSubmitted
                          ? null
                          : () {
                              setState(() => _ratingStars = star);
                            },
                      icon: Icon(
                        star <= _ratingStars ? Icons.star_rounded : Icons.star_outline_rounded,
                        color: const Color(0xFFFFA000),
                        size: 32,
                      ),
                    );
                  }),
                ),
                if (!_ratingSubmitted) ...[
                  const SizedBox(height: 8),
                  TextField(
                    controller: _feedbackController,
                    decoration: InputDecoration(
                      hintText: 'Izohingiz (ixtiyoriy)...',
                      filled: true,
                      fillColor: Colors.white,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isSubmittingRating ? null : _submitRating,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFFFA000),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: _isSubmittingRating
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Text('Bahoni yuborish', style: TextStyle(fontWeight: FontWeight.w700)),
                    ),
                  ),
                ] else ...[
                  const SizedBox(height: 6),
                  const Center(
                    child: Text(
                      'Rahmat! Sizning bahongiz qabul qilindi ✅',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF2E7D32),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],

        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: OutlinedButton(
            onPressed: () => Navigator.of(context).pop(),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFFE5E5EA)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            ),
            child: const Text(
              'Yopish',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1C1C1E),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTimelineStep({
    required int stepNumber,
    required String title,
    required String subtitle,
    required bool isActive,
    required bool isCompleted,
    required bool isLast,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: isCompleted
                    ? const Color(0xFF039E1E)
                    : isActive
                        ? const Color(0xFF007AFF)
                        : const Color(0xFFE5E5EA),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: isCompleted
                    ? const Icon(Icons.check_rounded, color: Colors.white, size: 16)
                    : Text(
                        '$stepNumber',
                        style: TextStyle(
                          color: isActive ? Colors.white : const Color(0xFF8E8E93),
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
              ),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 38,
                color: isCompleted ? const Color(0xFF039E1E) : const Color(0xFFE5E5EA),
              ),
          ],
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: isActive ? const Color(0xFF1C1C1E) : const Color(0xFF8E8E93),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF8E8E93),
                ),
              ),
              if (!isLast) const SizedBox(height: 16),
            ],
          ),
        ),
      ],
    );
  }
}
