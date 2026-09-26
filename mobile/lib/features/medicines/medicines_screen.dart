import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_colors.dart';
import '../../core/widgets/product_card.dart';
import '../../core/models/medicine.dart';
import 'medicines_provider.dart';

class MedicinesScreen extends ConsumerStatefulWidget {
  const MedicinesScreen({super.key});

  @override
  ConsumerState<MedicinesScreen> createState() => _MedicinesScreenState();
}

class _MedicinesScreenState extends ConsumerState<MedicinesScreen> {
  final _searchController = TextEditingController();
  String _selectedCategory = 'all'; // 'all', 'crop', 'animal'
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  String? get _currentType {
    if (_selectedCategory == 'crop') return 'crop';
    if (_selectedCategory == 'animal') return 'animal';
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final weekdays = [
      'dushanba',
      'seshanba',
      'chorshanba',
      'payshanba',
      'juma',
      'shanba',
      'yakshanba'
    ];
    final months = [
      'yanvar',
      'fevral',
      'mart',
      'aprel',
      'may',
      'iyun',
      'iyul',
      'avgust',
      'sentabr',
      'oktabr',
      'noyabr',
      'dekabr'
    ];
    final dateStr =
        '${weekdays[now.weekday - 1]}, ${now.day}-${months[now.month - 1]}';

    final medicinesAsync = ref.watch(
      medicinesProvider(
          (type: _currentType, q: _query.isEmpty ? null : _query)),
    );

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async {
            ref.invalidate(medicinesProvider);
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. TOP HEADER: Date + "Dorilar" + Heart Favorite Button
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          dateStr,
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF9CA3AF),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Dorilar',
                          style: TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF111827),
                            letterSpacing: -0.5,
                          ),
                        ),
                      ],
                    ),

                    // Heart favorite button on the right
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFFF3F4F6)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.03),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.favorite_border_rounded,
                        color: Color(0xFFE11D48), // rose-600
                        size: 22,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // 2. SEARCH BAR: Apple Cupertino Style
                Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText:
                          'Dorilarni nomi yoki maqsadi bo\'yicha qidirish...',
                      hintStyle: const TextStyle(
                        color: Color(0xFF9CA3AF),
                        fontSize: 13,
                      ),
                      prefixIcon: const Icon(
                        CupertinoIcons.search,
                        color: Color(0xFF9CA3AF),
                        size: 20,
                      ),
                      suffixIcon: _query.isNotEmpty
                          ? GestureDetector(
                              onTap: () {
                                _searchController.clear();
                                setState(() => _query = '');
                              },
                              child: const Icon(
                                CupertinoIcons.clear_circled_solid,
                                color: Color(0xFF9CA3AF),
                                size: 18,
                              ),
                            )
                          : null,
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(
                          vertical: 12, horizontal: 8),
                    ),
                    onChanged: (v) => setState(() => _query = v),
                  ),
                ),
                const SizedBox(height: 14),

                // 3. CATEGORIES TABS: Hammasi | Ekin uchun | Hayvonlar uchun
                Row(
                  children: [
                    Expanded(
                      child: _categoryChip(
                        title: 'Hammasi',
                        value: 'all',
                        icon: null,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _categoryChip(
                        title: 'Ekin uchun',
                        value: 'crop',
                        icon: Icons.eco_outlined,
                        iconColor: const Color(0xFF00A638),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _categoryChip(
                        title: 'Hayvonlar uchun',
                        value: 'animal',
                        icon: Icons.pets,
                        iconColor: const Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // 4. SECTION TITLE: "Ekin va Chorvagiz uchun"
                const Center(
                  child: Text(
                    'Ekin va Chorvagiz uchun',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF4B5563),
                    ),
                  ),
                ),
                const SizedBox(height: 14),

                // 5. PRODUCTS GRID
                medicinesAsync.when(
                  loading: () => _buildSkeletons(),
                  error: (e, _) => _buildDemoGrid(),
                  data: (medicines) => medicines.isEmpty
                      ? _buildDemoGrid()
                      : _buildMedicinesGrid(medicines),
                ),
                const SizedBox(height: 30),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _categoryChip({
    required String title,
    required String value,
    IconData? icon,
    Color? iconColor,
  }) {
    final active = _selectedCategory == value;

    return GestureDetector(
      onTap: () => setState(() => _selectedCategory = value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
        decoration: BoxDecoration(
          color: active ? const Color(0xFF00A638) : const Color(0xFFF9FAFB),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: active ? const Color(0xFF00A638) : const Color(0xFFE5E7EB),
          ),
          boxShadow: active
              ? [
                  BoxShadow(
                    color: const Color(0xFF00A638).withValues(alpha: 0.22),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[
              Icon(
                icon,
                size: 14,
                color: active
                    ? Colors.white
                    : (iconColor ?? const Color(0xFF6B7280)),
              ),
              const SizedBox(width: 4),
            ],
            Flexible(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: active ? FontWeight.bold : FontWeight.w600,
                  color: active ? Colors.white : const Color(0xFF374151),
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMedicinesGrid(List<Medicine> list) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 180 / 260,
        crossAxisSpacing: 14,
        mainAxisSpacing: 14,
      ),
      itemCount: list.length,
      itemBuilder: (ctx, i) => ProductCard(
        medicine: list[i],
      ),
    );
  }

  Widget _buildDemoGrid() {
    final demoMedicines = [
      Medicine(
        id: '101',
        name: 'Bento Max (Chorva uchun)',
        type: 'animal',
        price: 35000,
        usage: 'Sog\'lom chorva — barqaror hosildorlik',
        hasPhoto: false,
        pharmacyId: '1',
        pharmacyName: 'AZIYA AGRO KIMYO',
        ratingCount: 12,
      ),
      Medicine(
        id: '102',
        name: 'Agro Max (Ekin uchun)',
        type: 'crop',
        price: 35000,
        usage: 'Sog\'lom o\'sish — baxtli hosil',
        hasPhoto: false,
        pharmacyId: '2',
        pharmacyName: 'AGRO MAX',
        ratingCount: 18,
      ),
      Medicine(
        id: '103',
        name: 'Bento Max Ozuqa',
        type: 'crop',
        price: 35000,
        usage: 'O\'simliklar uchun sifatli ozuqa',
        hasPhoto: false,
        pharmacyId: '3',
        pharmacyName: 'AGRO MAX',
        ratingCount: 9,
      ),
      Medicine(
        id: '104',
        name: 'Bento Max Chorva Pro',
        type: 'animal',
        price: 35000,
        usage: 'Sog\'lom chorva — barqaror hosildorlik',
        hasPhoto: false,
        pharmacyId: '1',
        pharmacyName: 'AZIYA AGRO KIMYO',
        ratingCount: 15,
      ),
    ];

    return _buildMedicinesGrid(demoMedicines);
  }

  Widget _buildSkeletons() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 180 / 260,
        crossAxisSpacing: 14,
        mainAxisSpacing: 14,
      ),
      itemCount: 4,
      itemBuilder: (_, __) => Container(
        decoration: BoxDecoration(
          color: const Color(0xFFF3F4F6),
          borderRadius: BorderRadius.circular(16),
        ),
      ),
    );
  }
}
