import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/app_colors.dart';
import '../specialists/specialists_provider.dart';
import '../../core/models/specialist.dart';

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> {
  String _filter = 'all'; // 'all', 'pharmacy', 'specialist'

  @override
  Widget build(BuildContext context) {
    final specialistsAsync =
        ref.watch(specialistsProvider((lat: null, lng: null)));

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: Navigator.of(context).canPop()
            ? IconButton(
                icon: const Icon(CupertinoIcons.back,
                    color: Color(0xFF111827), size: 26),
                onPressed: () => Navigator.of(context).pop(),
              )
            : null,
        title: const Text(
          'Yaqin dorixonalar',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 18,
            color: Color(0xFF111827),
          ),
        ),
        centerTitle: false,
      ),
      body: Column(
        children: [
          // Apple-style Info Banner
          Container(
            margin: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(14),
              border:
                  Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
            ),
            child: const Row(
              children: [
                Icon(Icons.near_me_rounded, color: AppColors.primary, size: 20),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Sizga eng yaqin dorixona va mutaxassislar (5 km radiusda)',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Filters (Apple Segmented/Pill style)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: Row(
              children: [
                _filterChip('Barchasi', 'all'),
                const SizedBox(width: 8),
                _filterChip('Dorixonalar', 'pharmacy'),
                const SizedBox(width: 8),
                _filterChip('Mutaxassislar', 'specialist'),
              ],
            ),
          ),
          const SizedBox(height: 6),

          // List
          Expanded(
            child: specialistsAsync.when(
              loading: () => const Center(
                child: CupertinoActivityIndicator(
                    color: AppColors.primary, radius: 14),
              ),
              error: (err, _) => Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.location_off_outlined,
                        size: 48, color: Color(0xFF9CA3AF)),
                    const SizedBox(height: 12),
                    Text('Xatolik: $err',
                        style: const TextStyle(color: Color(0xFF6B7280))),
                  ],
                ),
              ),
              data: (list) {
                final filtered = list.where((item) {
                  if (_filter == 'pharmacy') {
                    return item.type != 'vet' && item.type != 'agronom';
                  }
                  if (_filter == 'specialist') {
                    return item.type == 'vet' || item.type == 'agronom';
                  }
                  return true;
                }).toList();

                if (filtered.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.storefront_outlined,
                            size: 56, color: Color(0xFFD1D5DB)),
                        SizedBox(height: 12),
                        Text(
                          'Yaqin atrofda ob\'yektlar topilmadi',
                          style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF4B5563)),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Radiusni kengaytirish yoki boshqa hududni tanlash mumkin',
                          style:
                              TextStyle(color: Color(0xFF9CA3AF), fontSize: 12),
                        ),
                      ],
                    ),
                  );
                }

                return ListView.separated(
                  physics: const BouncingScrollPhysics(),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (ctx, i) {
                    final item = filtered[i];
                    return _LocationCard(item: item);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _filterChip(String title, String val) {
    final active = _filter == val;
    return GestureDetector(
      onTap: () => setState(() => _filter = val),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: active ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: active ? AppColors.primary : const Color(0xFFE5E7EB),
          ),
          boxShadow: active
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.25),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  )
                ]
              : null,
        ),
        child: Text(
          title,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: active ? Colors.white : const Color(0xFF4B5563),
          ),
        ),
      ),
    );
  }
}

class _LocationCard extends StatelessWidget {
  final Specialist item;
  const _LocationCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final isSpecialist = item.type == 'vet' || item.type == 'agronom';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: isSpecialist
                  ? const Color(0xFFF5F3FF)
                  : AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              isSpecialist
                  ? (item.type == 'vet' ? Icons.pets : Icons.agriculture)
                  : Icons.local_pharmacy_rounded,
              color: isSpecialist ? const Color(0xFF7C3AED) : AppColors.primary,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: Color(0xFF111827),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: isSpecialist
                            ? const Color(0xFFEDE9FE)
                            : const Color(0xFFDCFCE7),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        item.typeLabel,
                        style: TextStyle(
                          color: isSpecialist
                              ? const Color(0xFF7C3AED)
                              : const Color(0xFF15803D),
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${item.distance.toStringAsFixed(1)} km yaqin',
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  item.address,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF6B7280),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            onPressed: () => launchUrl(Uri.parse('tel:${item.phone}')),
            icon: const Icon(CupertinoIcons.phone_fill,
                color: AppColors.primary, size: 20),
            style: IconButton.styleFrom(
              backgroundColor: AppColors.primary.withValues(alpha: 0.1),
            ),
          ),
        ],
      ),
    );
  }
}
