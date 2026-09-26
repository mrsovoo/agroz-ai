import 'dart:async';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../core/constants/app_colors.dart';
import '../../core/models/specialist.dart';
import 'specialists_provider.dart';

class SpecialistsScreen extends ConsumerStatefulWidget {
  const SpecialistsScreen({super.key});

  @override
  ConsumerState<SpecialistsScreen> createState() => _SpecialistsScreenState();
}

enum CallState { selectType, searching, found }

class _SpecialistsScreenState extends ConsumerState<SpecialistsScreen>
    with SingleTickerProviderStateMixin {
  String _selectedType = 'agronom';
  String _selectedPurpose = 'Zararkunanda va kasallik';
  final TextEditingController _noteController = TextEditingController();
  CallState _callState = CallState.selectType;
  Specialist? _assignedSpecialist;

  final MapController _mapController = MapController();
  final LatLng _userLocation = const LatLng(41.311081, 69.240562); // Tashkent
  double _currentZoom = 13.0;

  late AnimationController _pulseController;

  final Map<String, List<String>> _purposesByType = {
    'agronom': [
      'Zararkunanda va kasallik',
      'Hosildorlik va o\'g\'itlash',
      'Ekish va parvarish maslahati',
      'Sug\'orish va tuproq holati',
      'Umumiy ko\'rik / Boshqa',
    ],
    'vet': [
      'Davolash va tashxis',
      'Vaktsinatsiya va profilaktika',
      'Tug\'ruq va shoshilinch yordam',
      'Ozuqa va ratsion maslahati',
      'Umumiy ko\'rik / Boshqa',
    ],
  };

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _makeCall(String phone) async {
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  void _onTypeChanged(String type) {
    setState(() {
      _selectedType = type;
      _selectedPurpose = _purposesByType[type]?.first ?? 'Umumiy ko\'rik';
    });
  }

  void _zoomIn() {
    setState(() {
      _currentZoom = (_currentZoom + 1).clamp(3.0, 18.0);
      _mapController.move(_mapController.camera.center, _currentZoom);
    });
  }

  void _zoomOut() {
    setState(() {
      _currentZoom = (_currentZoom - 1).clamp(3.0, 18.0);
      _mapController.move(_mapController.camera.center, _currentZoom);
    });
  }

  void _recenter() {
    _mapController.move(_userLocation, 14.0);
    setState(() {
      _currentZoom = 14.0;
    });
  }

  void _startSearch(List<Specialist> allSpecialists) {
    setState(() {
      _callState = CallState.searching;
    });

    // Simulate searching algorithm (taxi style)
    Future.delayed(const Duration(seconds: 2), () {
      if (!mounted) return;

      final available =
          allSpecialists.where((s) => s.type == _selectedType).toList();

      if (available.isNotEmpty) {
        available.sort((a, b) => a.distance.compareTo(b.distance));
        final nearest = available.first;
        setState(() {
          _assignedSpecialist = nearest;
          _callState = CallState.found;
        });
        _mapController.move(LatLng(nearest.lat, nearest.lng), 14.5);
      } else {
        setState(() {
          _callState = CallState.selectType;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Yaqin atrofda bo\'sh mutaxassis topilmadi'),
            backgroundColor: Colors.red,
          ),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final specialistsAsync =
        ref.watch(specialistsProvider((lat: null, lng: null)));

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: specialistsAsync.when(
        loading: () => const Center(
          child:
              CupertinoActivityIndicator(color: AppColors.primary, radius: 14),
        ),
        error: (err, _) => Center(child: Text('Xatolik: $err')),
        data: (list) {
          final countByType = list.where((s) => s.type == _selectedType).length;

          return Stack(
            children: [
              // 1. Map Background
              FlutterMap(
                mapController: _mapController,
                options: MapOptions(
                  initialCenter: _userLocation,
                  initialZoom: _currentZoom,
                ),
                children: [
                  TileLayer(
                    urlTemplate:
                        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'uz.agroz.ai',
                  ),
                  MarkerLayer(
                    markers: [
                      // User Current Location Marker
                      Marker(
                        point: _userLocation,
                        width: 50,
                        height: 50,
                        child: AnimatedBuilder(
                          animation: _pulseController,
                          builder: (context, child) {
                            return Stack(
                              alignment: Alignment.center,
                              children: [
                                Container(
                                  width: 24 + (16 * _pulseController.value),
                                  height: 24 + (16 * _pulseController.value),
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: const Color(0xFF00A638).withValues(
                                        alpha:
                                            0.3 * (1 - _pulseController.value)),
                                  ),
                                ),
                                Container(
                                  width: 18,
                                  height: 18,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF00A638),
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                        color: Colors.white, width: 3),
                                    boxShadow: [
                                      BoxShadow(
                                        color:
                                            Colors.black.withValues(alpha: 0.2),
                                        blurRadius: 6,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            );
                          },
                        ),
                      ),
                      // Specialists on Map
                      ...list.map((s) {
                        final isSelected = _assignedSpecialist?.id == s.id;
                        final isAgronom = s.type == 'agronom';

                        return Marker(
                          point: LatLng(s.lat, s.lng),
                          width: isSelected ? 80 : 64,
                          height: isSelected ? 80 : 64,
                          child: GestureDetector(
                            onTap: () {
                              setState(() {
                                _assignedSpecialist = s;
                                _selectedType = s.type;
                                _callState = CallState.found;
                              });
                              _mapController.move(LatLng(s.lat, s.lng), 14.5);
                            },
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                // Rating Pill Tag
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 5, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(10),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black
                                            .withValues(alpha: 0.15),
                                        blurRadius: 4,
                                        offset: const Offset(0, 1),
                                      ),
                                    ],
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.star_rounded,
                                          size: 10, color: Color(0xFFF59E0B)),
                                      const SizedBox(width: 2),
                                      Text(
                                        s.ratingAvg?.toStringAsFixed(1) ??
                                            '4.9',
                                        style: const TextStyle(
                                          fontSize: 9,
                                          fontWeight: FontWeight.bold,
                                          color: Color(0xFF1F2937),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 2),
                                // Pin Avatar
                                Container(
                                  width: isSelected ? 42 : 36,
                                  height: isSelected ? 42 : 36,
                                  decoration: BoxDecoration(
                                    color: isAgronom
                                        ? const Color(0xFF00A638)
                                        : const Color(0xFF4F46E5),
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                        color: Colors.white, width: 2.5),
                                    boxShadow: [
                                      BoxShadow(
                                        color: (isAgronom
                                                ? const Color(0xFF00A638)
                                                : const Color(0xFF4F46E5))
                                            .withValues(
                                                alpha:
                                                    isSelected ? 0.45 : 0.25),
                                        blurRadius: isSelected ? 10 : 6,
                                        offset: const Offset(0, 3),
                                      ),
                                    ],
                                  ),
                                  child: Center(
                                    child: Text(
                                      isAgronom ? '🌱' : '🐾',
                                      style: TextStyle(
                                          fontSize: isSelected ? 20 : 16),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }),
                    ],
                  ),
                ],
              ),

              // 2. Floating Top Bar (iOS Header)
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: SafeArea(
                  child: Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.94),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.08),
                            blurRadius: 16,
                            offset: const Offset(0, 4),
                          ),
                        ],
                        border: Border.all(
                            color: Colors.white.withValues(alpha: 0.8)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: const Color(0xFFDCFCE7),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              Icons.location_searching_rounded,
                              color: Color(0xFF00A638),
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Text(
                                  'Agro-Mutaxassislar Xaritasi',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF111827),
                                    letterSpacing: -0.3,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Row(
                                  children: [
                                    Container(
                                      width: 6,
                                      height: 6,
                                      decoration: const BoxDecoration(
                                        color: Color(0xFF10B981),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 5),
                                    Text(
                                      'Yaqin atrofda $countByType ta bo\'sh mutaxassis bor',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w500,
                                        color: Color(0xFF6B7280),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              // 3. Floating Map Controls (Zoom & Recenter)
              Positioned(
                right: 16,
                bottom: MediaQuery.of(context).size.height * 0.46,
                child: Column(
                  children: [
                    _floatingMapButton(
                      icon: Icons.my_location_rounded,
                      onTap: _recenter,
                      iconColor: const Color(0xFF00A638),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.94),
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.08),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          _mapZoomItem(icon: Icons.add, onTap: _zoomIn),
                          Container(
                              width: 24,
                              height: 1,
                              color: const Color(0xFFE5E7EB)),
                          _mapZoomItem(icon: Icons.remove, onTap: _zoomOut),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // 4. Bottom Panel (Yandex Go / Apple style Taxi Sheet)
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius:
                        const BorderRadius.vertical(top: Radius.circular(28)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.12),
                        blurRadius: 24,
                        offset: const Offset(0, -6),
                      ),
                    ],
                  ),
                  child: SafeArea(
                    top: false,
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 10, 20, 16),
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 250),
                        child: _buildBottomPanel(list),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _floatingMapButton({
    required IconData icon,
    required VoidCallback onTap,
    Color iconColor = const Color(0xFF1F2937),
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.94),
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Icon(icon, color: iconColor, size: 20),
      ),
    );
  }

  Widget _mapZoomItem({required IconData icon, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: SizedBox(
        width: 44,
        height: 38,
        child: Center(
          child: Icon(icon, size: 18, color: const Color(0xFF374151)),
        ),
      ),
    );
  }

  Widget _buildBottomPanel(List<Specialist> allSpecialists) {
    // 1. Drag indicator pill
    Widget dragHandle = Center(
      child: Container(
        width: 36,
        height: 4,
        margin: const EdgeInsets.only(bottom: 14),
        decoration: BoxDecoration(
          color: const Color(0xFFE5E7EB),
          borderRadius: BorderRadius.circular(2),
        ),
      ),
    );

    if (_callState == CallState.searching) {
      final typeLabel = _selectedType == 'agronom' ? 'Agronom' : 'Veterinar';
      final typeEmoji = _selectedType == 'agronom' ? '🌱' : '🐾';
      return Column(
        key: const ValueKey('searching'),
        mainAxisSize: MainAxisSize.min,
        children: [
          dragHandle,
          const SizedBox(height: 10),
          // Pulsing Search Indicator
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFFDCFCE7),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF00A638).withValues(alpha: 0.25),
                  blurRadius: 18,
                  spreadRadius: 4,
                ),
              ],
            ),
            child: Center(
              child: Text(typeEmoji, style: const TextStyle(fontSize: 34)),
            ),
          ),
          const SizedBox(height: 18),
          Text(
            'Yaqin atrofdagi $typeLabel qidirilmoqda...',
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w800,
              color: Color(0xFF111827),
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFFF3F4F6),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              'Muammo: $_selectedPurpose',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Color(0xFF4B5563),
              ),
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'Iltimos kuting, eng yaqin va reytingi yuqori mutaxassis biriktirilmoqda',
            style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: () =>
                  setState(() => _callState = CallState.selectType),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12),
                backgroundColor: const Color(0xFFFEE2E2),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text(
                'Qidiruvni bekor qilish',
                style: TextStyle(
                  color: Color(0xFFDC2626),
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ),
          ),
        ],
      );
    }

    if (_callState == CallState.found && _assignedSpecialist != null) {
      final s = _assignedSpecialist!;
      final isAgronom = s.type == 'agronom';

      return Column(
        key: const ValueKey('found'),
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          dragHandle,
          // Specialist Profile Card
          Row(
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: isAgronom
                          ? const Color(0xFFECFDF5)
                          : const Color(0xFFEEF2FF),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                        color: isAgronom
                            ? const Color(0xFFA7F3D0)
                            : const Color(0xFFC7D2FE),
                        width: 1.5,
                      ),
                    ),
                    child: Center(
                      child: Text(isAgronom ? '🌱' : '🐾',
                          style: const TextStyle(fontSize: 30)),
                    ),
                  ),
                  Positioned(
                    bottom: -2,
                    right: -2,
                    child: Container(
                      width: 16,
                      height: 16,
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2.5),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            s.name,
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF111827),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDCFCE7),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.check_circle_rounded,
                                  size: 12, color: Color(0xFF16A34A)),
                              SizedBox(width: 3),
                              Text(
                                'Biriktirildi',
                                style: TextStyle(
                                  color: Color(0xFF15803D),
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.star_rounded,
                            size: 16, color: Color(0xFFF59E0B)),
                        const SizedBox(width: 3),
                        Text(
                          s.ratingAvg?.toStringAsFixed(1) ?? '4.9',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                            color: Color(0xFF1F2937),
                          ),
                        ),
                        Text(
                          ' (${s.ratingCount} ko\'rik)',
                          style: const TextStyle(
                              color: Color(0xFF6B7280), fontSize: 12),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '·  ${s.distance.toStringAsFixed(1)} km yaqin',
                          style: const TextStyle(
                            color: Color(0xFF00A638),
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      s.address,
                      style: const TextStyle(
                          color: Color(0xFF9CA3AF), fontSize: 12),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Request Summary Box
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.task_alt_rounded,
                        size: 16, color: Color(0xFF00A638)),
                    const SizedBox(width: 6),
                    const Text(
                      'Chaqiruv maqsadi:',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF4B5563),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        _selectedPurpose,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF111827),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                if (_noteController.text.trim().isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    'Izoh: "${_noteController.text.trim()}"',
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFF6B7280),
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Action Buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    setState(() {
                      _callState = CallState.selectType;
                      _assignedSpecialist = null;
                    });
                  },
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: const BorderSide(color: Color(0xFFFECACA)),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text(
                    'Bekor qilish',
                    style: TextStyle(
                        color: Color(0xFFDC2626), fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: ElevatedButton.icon(
                  onPressed: () => _makeCall(s.phone),
                  icon: const Icon(CupertinoIcons.phone_fill,
                      color: Colors.white, size: 18),
                  label: const Text(
                    'Bog\'lanish',
                    style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        fontSize: 15),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00A638),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
            ],
          ),
        ],
      );
    }

    // Default: Select Type & Purpose
    final purposes = _purposesByType[_selectedType] ?? [];

    return ConstrainedBox(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.62,
      ),
      child: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Column(
          key: const ValueKey('selectType'),
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            dragHandle,

            // Sarlavha
            const Text(
              'Kerakli mutaxassisni tanlang',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w800,
                color: Color(0xFF111827),
                letterSpacing: -0.3,
              ),
            ),
            const SizedBox(height: 12),

            // Turlar (Agronom vs Veterinar)
            Row(
              children: [
                Expanded(
                  child: _buildTypeCard(
                    type: 'agronom',
                    title: 'Agronom',
                    subtitle: 'Ekin & bog\'dorchilik',
                    fee: '50 000 so\'mdan',
                    icon: '🌱',
                    isSelected: _selectedType == 'agronom',
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildTypeCard(
                    type: 'vet',
                    title: 'Veterinar',
                    subtitle: 'Chorva & chorvachilik',
                    fee: '50 000 so\'mdan',
                    icon: '🐾',
                    isSelected: _selectedType == 'vet',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Chaqirish maqsadi
            const Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Chaqirish maqsadi (Muammo turi)',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF374151),
                  ),
                ),
                Text(
                  'Majburiy',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: purposes.map((purpose) {
                final isSelected = _selectedPurpose == purpose;
                return GestureDetector(
                  onTap: () => setState(() => _selectedPurpose = purpose),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? const Color(0xFF00A638)
                          : const Color(0xFFF3F4F6),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isSelected
                            ? const Color(0xFF00A638)
                            : const Color(0xFFE5E7EB),
                      ),
                      boxShadow: isSelected
                          ? [
                              BoxShadow(
                                color: const Color(0xFF00A638)
                                    .withValues(alpha: 0.2),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ]
                          : null,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (isSelected) ...[
                          const Icon(Icons.check_rounded,
                              size: 14, color: Colors.white),
                          const SizedBox(width: 4),
                        ],
                        Text(
                          purpose,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight:
                                isSelected ? FontWeight.bold : FontWeight.w500,
                            color: isSelected
                                ? Colors.white
                                : const Color(0xFF374151),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 14),

            // Qo'shimcha izoh
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF9FAFB),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.only(top: 4, right: 8),
                    child: Icon(Icons.edit_note_rounded,
                        size: 18, color: Color(0xFF9CA3AF)),
                  ),
                  Expanded(
                    child: TextField(
                      controller: _noteController,
                      maxLines: 2,
                      minLines: 1,
                      style: const TextStyle(fontSize: 13),
                      decoration: const InputDecoration(
                        hintText: 'Muammoni qisqacha yozing (ixtiyoriy)...',
                        hintStyle:
                            TextStyle(color: Color(0xFF9CA3AF), fontSize: 12),
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.zero,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Chaqirish tugmasi
            ElevatedButton(
              onPressed: () => _startSearch(allSpecialists),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00A638),
                minimumSize: const Size(double.infinity, 50),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
                elevation: 0,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.near_me_rounded,
                      color: Colors.white, size: 18),
                  const SizedBox(width: 8),
                  Text(
                    '${_selectedType == 'agronom' ? 'Agronom' : 'Veterinar'} chaqirish',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
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

  Widget _buildTypeCard({
    required String type,
    required String title,
    required String subtitle,
    required String fee,
    required String icon,
    required bool isSelected,
  }) {
    return GestureDetector(
      onTap: () => _onTypeChanged(type),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF00A638).withValues(alpha: 0.08)
              : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color:
                isSelected ? const Color(0xFF00A638) : const Color(0xFFE5E7EB),
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: const Color(0xFF00A638).withValues(alpha: 0.12),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  )
                ]
              : null,
        ),
        child: Column(
          children: [
            Text(icon, style: const TextStyle(fontSize: 28)),
            const SizedBox(height: 4),
            Text(
              title,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: isSelected
                    ? const Color(0xFF00A638)
                    : const Color(0xFF111827),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 10,
                color: Color(0xFF6B7280),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: isSelected
                    ? const Color(0xFF00A638).withValues(alpha: 0.15)
                    : const Color(0xFFF3F4F6),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                fee,
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                  color: isSelected
                      ? const Color(0xFF00A638)
                      : const Color(0xFF6B7280),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
