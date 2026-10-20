import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/specialist_models.dart';
import 'specialist_call_modal.dart';

/// Mutaxassis to'liq profili modali (Web / Launch App bilan 1:1 aniqlikda).
/// Sticky Top Bar, to'liq ma'lumotlar, 4 ta tezkor tugma, ta'lim, staj va Sticky Bottom Action Bar.
class SpecialistProfileModal extends StatelessWidget {
  final SpecialistModel specialist;
  final VoidCallback? onCall;

  const SpecialistProfileModal({
    super.key,
    required this.specialist,
    this.onCall,
  });

  static Future<void> show(BuildContext context, SpecialistModel specialist, {VoidCallback? onCall}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => SpecialistProfileModal(
        specialist: specialist,
        onCall: onCall,
      ),
    );
  }

  bool get _isVeterinar {
    final s = '${specialist.role} ${specialist.specialty ?? ''} ${specialist.bio ?? ''}'.toLowerCase();
    return s.contains('veterinar') || s.contains('chorva') || s.contains('hayvon') || s.contains('mol');
  }

  String get _specialtyText {
    if (specialist.specialty != null && specialist.specialty!.trim().isNotEmpty) {
      return specialist.specialty!;
    }
    return _isVeterinar ? 'Veterinar vrach' : 'Agronom maslahatchi';
  }

  void _makeCall(BuildContext context) {
    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Qo‘ng‘iroq: ${specialist.phone}'),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _openDirections(BuildContext context) {
    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Manzil: ${specialist.address.isNotEmpty ? specialist.address : "Farg’ona"}'),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isVet = _isVeterinar;
    final ratingVal = specialist.rating ?? 4.8;
    final expYears = specialist.ratingCount != null && specialist.ratingCount! > 0
        ? specialist.ratingCount!
        : 6;
    final initial = specialist.name.trim().isNotEmpty
        ? specialist.name.trim()[0].toUpperCase()
        : 'M';

    return Container(
      height: MediaQuery.of(context).size.height * 0.90,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          // Drag handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 10, bottom: 4),
              width: 40,
              height: 4.5,
              decoration: BoxDecoration(
                color: const Color(0xFFE5E5EA),
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ),

          // 1. Sticky Top Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                InkWell(
                  onTap: () => Navigator.of(context).pop(),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF2F2F7),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.arrow_back_rounded,
                      color: Color(0xFF1C1C1E),
                      size: 20,
                    ),
                  ),
                ),
                const Text(
                  'Mutaxassis profili',
                  style: TextStyle(
                    fontSize: 16.5,
                    fontFamily: 'PingFang SC',
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1C1C1E),
                  ),
                ),
                InkWell(
                  onTap: () {
                    HapticFeedback.lightImpact();
                  },
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF2F2F7),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.share_outlined,
                      color: Color(0xFF1C1C1E),
                      size: 19,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFF2F2F7)),

          // 2. Scrollable Body
          Expanded(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Column(
                children: [
                  // Large Avatar with Gradient & Status Ring
                  Stack(
                    children: [
                      Container(
                        width: 82,
                        height: 82,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(26),
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: isVet
                                ? const [Color(0xFF0284C7), Color(0xFF075985)]
                                : const [Color(0xFF039E1E), Color(0xFF016812)],
                          ),
                          boxShadow: const [
                            BoxShadow(
                              color: Color(0x19000000),
                              blurRadius: 10,
                              offset: Offset(0, 4),
                            ),
                          ],
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          initial,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 34,
                            fontWeight: FontWeight.w800,
                            fontFamily: 'Arial',
                          ),
                        ),
                      ),
                      Positioned(
                        right: 0,
                        bottom: 0,
                        child: Container(
                          width: 18,
                          height: 18,
                          decoration: BoxDecoration(
                            color: specialist.isBusy ? const Color(0xFFFA2B36) : const Color(0xFF35CA56),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2.5),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Specialty Badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEBF9EE),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFBCECC6)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.check_circle_rounded,
                          color: Color(0xFF039E1E),
                          size: 14,
                        ),
                        const SizedBox(width: 5),
                        Text(
                          _specialtyText,
                          style: const TextStyle(
                            color: Color(0xFF039E1E),
                            fontSize: 12.5,
                            fontFamily: 'PingFang SC',
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Name
                  Text(
                    specialist.name,
                    style: const TextStyle(
                      color: Color(0xFF1C1C1E),
                      fontSize: 22,
                      fontFamily: 'PingFang SC',
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.3,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 4),

                  // Location & Distance
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.location_on_outlined, size: 14, color: Color(0xFF8E8E93)),
                      const SizedBox(width: 4),
                      Text(
                        specialist.address.isNotEmpty ? specialist.address : 'Farg’ona',
                        style: const TextStyle(
                          color: Color(0xFF8E8E93),
                          fontSize: 13,
                          fontFamily: 'PingFang SC',
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        specialist.distanceKm != null
                            ? '• ${specialist.distanceKm! < 1 ? "<1 km" : "${specialist.distanceKm!.toStringAsFixed(1)} km"}'
                            : '• <1 km',
                        style: const TextStyle(
                          color: Color(0xFF383838),
                          fontSize: 13,
                          fontFamily: 'PingFang SC',
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // 4 ta tezkor tugmalar (Launch App bilan 1:1)
                  Row(
                    children: [
                      // 1. Qo'ng'iroq
                      Expanded(
                        child: _ActionTile(
                          icon: Icons.phone_rounded,
                          iconColor: const Color(0xFF1C1C1E),
                          bgColor: const Color(0xFFF2F2F7),
                          label: 'Qo’ng’iroq',
                          onTap: () => _makeCall(context),
                        ),
                      ),
                      const SizedBox(width: 10),

                      // 2. Chaqirish
                      Expanded(
                        child: _ActionTile(
                          icon: Icons.directions_car_rounded,
                          iconColor: const Color(0xFF039E1E),
                          bgColor: const Color(0xFFEBF9EE),
                          label: 'Chaqirish',
                          onTap: () {
                            Navigator.of(context).pop();
                            if (onCall != null) {
                              onCall!();
                            } else {
                              _makeCall(context);
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 10),

                      // 3. Manzil
                      Expanded(
                        child: _ActionTile(
                          icon: Icons.location_on_rounded,
                          iconColor: const Color(0xFFD97706),
                          bgColor: const Color(0xFFFFFBEB),
                          label: 'Manzil',
                          onTap: () => _openDirections(context),
                        ),
                      ),
                      const SizedBox(width: 10),

                      // 4. Baholash
                      Expanded(
                        child: _ActionTile(
                          icon: Icons.star_rounded,
                          iconColor: const Color(0xFF2563EB),
                          bgColor: const Color(0xFFEFF6FF),
                          label: '★ ${ratingVal.toStringAsFixed(1)}',
                          onTap: () {
                            HapticFeedback.selectionClick();
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Mutaxassis haqida
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF9F9FB),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFFF2F2F7)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'MUTAXASSIS HAQIDA',
                          style: TextStyle(
                            color: Color(0xFF8E8E93),
                            fontSize: 11,
                            fontFamily: 'PingFang SC',
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          specialist.bio != null && specialist.bio!.isNotEmpty
                              ? specialist.bio!
                              : 'Agrotexnika, ekinlarni himoya qilish va hosildorlikni oshirish bo\'yicha ko\'p yillik amaliy tajribaga ega mutaxassis.',
                          style: const TextStyle(
                            color: Color(0xFF2C2C2E),
                            fontSize: 13.5,
                            fontFamily: 'PingFang SC',
                            height: 1.45,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Tajriba va Ta'lim kartalari
                  Row(
                    children: [
                      // Tajriba
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF9F9FB),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: const Color(0xFFF2F2F7)),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 36,
                                height: 36,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFD1FAE5),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(
                                  Icons.military_tech_rounded,
                                  color: Color(0xFF047857),
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'TAJRIBA',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontFamily: 'PingFang SC',
                                        fontWeight: FontWeight.w700,
                                        color: Color(0xFF8E8E93),
                                      ),
                                    ),
                                    Text(
                                      '$expYears yil staj',
                                      style: const TextStyle(
                                        fontSize: 13,
                                        fontFamily: 'PingFang SC',
                                        fontWeight: FontWeight.w700,
                                        color: Color(0xFF1C1C1E),
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),

                      // Ta'lim
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF9F9FB),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: const Color(0xFFF2F2F7)),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 36,
                                height: 36,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFDBEAFE),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(
                                  Icons.school_rounded,
                                  color: Color(0xFF1D4ED8),
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 10),
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'TA’LIM',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontFamily: 'PingFang SC',
                                        fontWeight: FontWeight.w700,
                                        color: Color(0xFF8E8E93),
                                      ),
                                    ),
                                    Text(
                                      'Oliy ma’lumot',
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontFamily: 'PingFang SC',
                                        fontWeight: FontWeight.w700,
                                        color: Color(0xFF1C1C1E),
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Ish vaqti va Manzil
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF9F9FB),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: const Color(0xFFF2F2F7)),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.access_time_rounded, size: 18, color: Color(0xFF35CA56)),
                            const SizedBox(width: 8),
                            const Text(
                              'Ish / Qabul vaqti:',
                              style: TextStyle(
                                fontSize: 13,
                                fontFamily: 'PingFang SC',
                                color: Color(0xFF8E8E93),
                              ),
                            ),
                            const Spacer(),
                            Text(
                              specialist.workHours.isNotEmpty ? specialist.workHours : '09:00 - 18:00',
                              style: const TextStyle(
                                fontSize: 13,
                                fontFamily: 'PingFang SC',
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF1C1C1E),
                              ),
                            ),
                          ],
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 8),
                          child: Divider(height: 1, color: Color(0xFFE5E5EA)),
                        ),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.place_outlined, size: 18, color: Color(0xFF35CA56)),
                            const SizedBox(width: 8),
                            const Text(
                              'Manzili:',
                              style: TextStyle(
                                fontSize: 13,
                                fontFamily: 'PingFang SC',
                                color: Color(0xFF8E8E93),
                              ),
                            ),
                            const Spacer(),
                            Expanded(
                              child: Text(
                                specialist.address.isNotEmpty ? specialist.address : 'Farg’ona',
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontFamily: 'PingFang SC',
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF1C1C1E),
                                ),
                                textAlign: TextAlign.right,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Rasmiy tasdiq kafolati
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.verified_user_rounded, color: Color(0xFF039E1E), size: 15),
                      SizedBox(width: 6),
                      Text(
                        'AgrozGO tomonidan rasmiy tasdiqlangan',
                        style: TextStyle(
                          fontSize: 12,
                          fontFamily: 'PingFang SC',
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF8E8E93),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),

          // 3. Sticky Bottom Action Bar
          Container(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: Row(
              children: [
                // Phone Button
                InkWell(
                  onTap: () => _makeCall(context),
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF2F2F7),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(
                      Icons.phone_rounded,
                      color: Color(0xFF1C1C1E),
                      size: 22,
                    ),
                  ),
                ),
                const SizedBox(width: 12),

                // Main Call Action Button
                Expanded(
                  child: SizedBox(
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () {
                        HapticFeedback.mediumImpact();
                        Navigator.of(context).pop();
                        if (onCall != null) {
                          onCall!();
                        } else {
                          SpecialistCallModal.show(context, specialist);
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF35CA56),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(25),
                        ),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Mutaxassisni chaqirish',
                            style: TextStyle(
                              fontSize: 15.5,
                              fontFamily: 'PingFang SC',
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          SizedBox(width: 8),
                          Icon(Icons.arrow_forward_rounded, size: 18),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color bgColor;
  final String label;
  final VoidCallback onTap;

  const _ActionTile({
    required this.icon,
    required this.iconColor,
    required this.bgColor,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: iconColor, size: 22),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              fontFamily: 'PingFang SC',
              fontWeight: FontWeight.w600,
              color: Color(0xFF636366),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

