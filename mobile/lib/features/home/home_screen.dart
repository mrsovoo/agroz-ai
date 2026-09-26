import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/api_config.dart';
import '../../core/models/medicine.dart';
import '../../core/models/advertisement.dart';
import '../../core/widgets/product_card.dart';

final _dio = Dio(BaseOptions(baseUrl: ApiConfig.baseUrl));

final homeMedicinesProvider = FutureProvider<List<Medicine>>((ref) async {
  try {
    final res = await _dio.get('/api/medicines?limit=12');
    final list = res.data as List;
    return list
        .map((e) => Medicine.fromJson(e as Map<String, dynamic>))
        .toList();
  } catch (_) {
    // Fallback demo ma'lumotlar (agar backend ulanmagan bo'lsa)
    return [
      Medicine(
        id: '1',
        name: 'Bento Max (Chorva uchun)',
        type: 'animal',
        price: 35000,
        usage: 'Sog\'lom chorva, barqaror hosildorlik',
        hasPhoto: false,
        pharmacyId: '1',
        pharmacyName: 'Aziya Agro Kimyo',
        ratingCount: 12,
      ),
      Medicine(
        id: '2',
        name: 'Bento Max Premium',
        type: 'animal',
        price: 35000,
        usage: 'Vitaminli ozuqa qo\'shimchasi',
        hasPhoto: false,
        pharmacyId: '1',
        pharmacyName: 'Aziya Agro Kimyo',
        ratingCount: 8,
      ),
      Medicine(
        id: '3',
        name: 'Super Fosfat Ekin',
        type: 'crop',
        price: 45000,
        usage: 'Ildiz o\'sishini tezlashtiruvchi o\'g\'it',
        hasPhoto: false,
        pharmacyId: '2',
        pharmacyName: 'Agro Savdo',
        ratingCount: 15,
      ),
      Medicine(
        id: '4',
        name: 'Biogumus Extra',
        type: 'crop',
        price: 28000,
        usage: 'Tabiiy organik o\'g\'it',
        hasPhoto: false,
        pharmacyId: '2',
        pharmacyName: 'Agro Savdo',
        ratingCount: 20,
      ),
    ];
  }
});

final homeAdsProvider = FutureProvider<List<Advertisement>>((ref) async {
  try {
    final res = await _dio.get('/api/advertisements');
    final list = res.data as List;
    return list
        .map((e) => Advertisement.fromJson(e as Map<String, dynamic>))
        .toList();
  } catch (_) {
    return [
      Advertisement(
        id: '1',
        title: 'CHORVA BIZNESI',
        description:
            'Sog\'lom chorva — barqaror hosildorlik! Batafsil ma\'lumot...',
        imageUrl:
            'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&auto=format&fit=crop&q=80',
        priority: 1,
        isActive: true,
      ),
      Advertisement(
        id: '2',
        title: 'YANGI MAHSULOTLAR',
        description:
            'Eng sara ekin o\'g\'itlari va dori vositalari endi yetib keldi',
        imageUrl:
            'https://images.unsplash.com/photo-1592982537447-6f23b7da5cc8?w=800&auto=format&fit=crop&q=80',
        priority: 2,
        isActive: true,
      ),
    ];
  }
});

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final medicinesAsync = ref.watch(homeMedicinesProvider);
    final adsAsync = ref.watch(homeAdsProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async {
            ref.invalidate(homeMedicinesProvider);
            ref.invalidate(homeAdsProvider);
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. TOP HEADER: Logo "agroz ai" + Notification Bell with red badge "4"
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: _TopHeader(),
                ),
                const SizedBox(height: 14),

                // 2. WEATHER CARD: Bugun Toshkent, 22°C, Sun, Shamol/Namlik/Yog'in
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: GestureDetector(
                    onTap: () => context.push('/obhavo'),
                    child: const _WeatherCard(),
                  ),
                ),
                const SizedBox(height: 18),

                // 3. "Siz uchun" Section + Banner "CHORVA BIZNESI"
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: _SizUchunSection(adsAsync: adsAsync),
                ),
                const SizedBox(height: 16),

                // 4. "Ekin va Chorvagiz uchun" Section + Product Cards
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(16, 24, 16, 30),
                  decoration: const BoxDecoration(
                    color: Color(0xFFF9FAFB),
                    borderRadius:
                        BorderRadius.vertical(top: Radius.circular(24)),
                  ),
                  child: Column(
                    children: [
                      const _EkinVaChorvaHeader(),
                      const SizedBox(height: 16),
                      medicinesAsync.when(
                        loading: () => const _MedicinesSkeleton(),
                        error: (e, _) => const _MedicinesFallbackGrid(),
                        data: (medicines) =>
                            _MedicinesGrid(medicines: medicines),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────
// 1. TOP HEADER
// ─────────────────────────────────────────────────────────────
class _TopHeader extends StatelessWidget {
  const _TopHeader();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // Brand logo: circular green mark with roof/leaf + "agroz ai"
        Row(
          children: [
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
                  const Positioned(
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
            const SizedBox(width: 8),
            RichText(
              text: const TextSpan(
                children: [
                  TextSpan(
                    text: 'agroz ',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF111827),
                      letterSpacing: -0.5,
                    ),
                  ),
                  TextSpan(
                    text: 'ai',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFFEAB308), // golden amber
                      letterSpacing: -0.5,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),

        // Notification Bell icon with red badge "4"
        GestureDetector(
          onTap: () {
            context.push('/yangiliklar');
          },
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                ),
                child: const Icon(
                  Icons.notifications_none_rounded,
                  color: Color(0xFF00A638),
                  size: 24,
                ),
              ),
              Positioned(
                top: -2,
                right: -2,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: Color(0xFFEF4444),
                    shape: BoxShape.circle,
                  ),
                  constraints:
                      const BoxConstraints(minWidth: 18, minHeight: 18),
                  child: const Text(
                    '4',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────
// 2. WEATHER CARD (Green vibrant card matching screenshot)
// ─────────────────────────────────────────────────────────────
class _WeatherCard extends StatelessWidget {
  const _WeatherCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF00A83B),
            Color(0xFF008D2E),
          ],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF00A638).withValues(alpha: 0.3),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Left: Bugun Toshkent, 22°C, Kunduzi/Kechasi
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.wb_sunny_outlined,
                        size: 15,
                        color: Colors.white,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Bugun · Toshkent',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: Colors.white.withValues(alpha: 0.95),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    '22 °C',
                    style: TextStyle(
                      fontSize: 48,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      height: 1.1,
                      letterSpacing: -1,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Row(
                    children: [
                      Icon(Icons.wb_sunny_rounded,
                          size: 13, color: Colors.white),
                      SizedBox(width: 3),
                      Text(
                        'Kunduzi: +28°C',
                        style: TextStyle(fontSize: 12, color: Colors.white),
                      ),
                      Text(
                        '  ·  ',
                        style: TextStyle(fontSize: 12, color: Colors.white70),
                      ),
                      Icon(Icons.nightlight_round,
                          size: 12, color: Colors.white),
                      SizedBox(width: 3),
                      Text(
                        'Kechasi: +18°C',
                        style: TextStyle(fontSize: 12, color: Colors.white),
                      ),
                    ],
                  ),
                ],
              ),

              // Right: Big 3D Glowing Yellow Sun
              Container(
                margin: const EdgeInsets.only(top: 4, right: 8),
                width: 72,
                height: 72,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Sun Rays / Outer Glow
                    Container(
                      width: 68,
                      height: 68,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.amber.withValues(alpha: 0.25),
                      ),
                    ),
                    // Sun body
                    Container(
                      width: 50,
                      height: 50,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            Color(0xFFFFEE55),
                            Color(0xFFF59E0B),
                          ],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Color(0xFFFFD54F),
                            blurRadius: 18,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),

          // Bottom 3 translucent pills: Shamol, Namlik, Yog'in
          const Row(
            children: [
              Expanded(
                child: _WeatherPill(
                  icon: Icons.air_rounded,
                  label: 'Shamol',
                  value: '2.9 m/s',
                ),
              ),
              SizedBox(width: 8),
              Expanded(
                child: _WeatherPill(
                  icon: Icons.water_drop_outlined,
                  label: 'Namlik',
                  value: '46%',
                ),
              ),
              SizedBox(width: 8),
              Expanded(
                child: _WeatherPill(
                  icon: Icons.cloud_outlined,
                  label: 'Yog\'in',
                  value: '0 mm',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _WeatherPill extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _WeatherPill({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 14, color: Colors.white.withValues(alpha: 0.9)),
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: Colors.white.withValues(alpha: 0.9),
                ),
              ),
            ],
          ),
          const SizedBox(height: 3),
          Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────
// 2.5 QUICK SERVICES SECTION (Apple Card Style)
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// 3. "Siz uchun" SECTION (CHORVA BIZNESI banner)
// ─────────────────────────────────────────────────────────────
class _SizUchunSection extends StatelessWidget {
  final AsyncValue<List<Advertisement>> adsAsync;
  const _SizUchunSection({required this.adsAsync});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Siz uchun',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: Color(0xFF111827),
              ),
            ),
            GestureDetector(
              onTap: () {
                context.push('/yangiliklar');
              },
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'barchasini ko\'rish',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF6B7280),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        adsAsync.when(
          loading: () => Container(
            height: 195,
            width: double.infinity,
            decoration: BoxDecoration(
              color: const Color(0xFFF3F4F6),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Center(child: CircularProgressIndicator()),
          ),
          error: (_, __) => const SizedBox(),
          data: (ads) {
            if (ads.isEmpty) return const SizedBox();

            return SizedBox(
              height: 195,
              width: double.infinity,
              child: PageView.builder(
                itemCount: ads.length,
                itemBuilder: (context, index) {
                  final ad = ads[index];
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
                                errorBuilder: (_, __, ___) =>
                                    Container(color: Colors.grey.shade200),
                              )
                            : Container(color: const Color(0xFF00A638)),
                      ),
                    ),
                  );
                },
              ),
            );
          },
        ),
      ],
    );
  }
}

class _EkinVaChorvaHeader extends StatelessWidget {
  const _EkinVaChorvaHeader();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text(
        'Ekin va Chorvagiz uchun',
        style: TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: Color(0xFF4B5563),
        ),
      ),
    );
  }
}

class _MedicinesGrid extends StatelessWidget {
  final List<Medicine> medicines;
  const _MedicinesGrid({required this.medicines});

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 180 / 260,
        crossAxisSpacing: 14,
        mainAxisSpacing: 14,
      ),
      itemCount: medicines.length,
      itemBuilder: (ctx, i) => ProductCard(medicine: medicines[i]),
    );
  }
}

class _MedicinesSkeleton extends StatelessWidget {
  const _MedicinesSkeleton();

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.65,
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

class _MedicinesFallbackGrid extends StatelessWidget {
  const _MedicinesFallbackGrid();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(20),
        child: Text(
          'Mahsulotlar yuklanmadi',
          style: TextStyle(color: Color(0xFF9CA3AF)),
        ),
      ),
    );
  }
}
