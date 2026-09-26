import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../auth/auth_provider.dart';
import '../cart/cart_provider.dart';
import '../cart/cart_screen.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  String? _name;
  String? _phone;
  bool _notificationsEnabled = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final authPhone = ref.read(authProvider).phone;
    setState(() {
      _name = prefs.getString('userName') ?? 'Sardor Aliyev';
      _phone = prefs.getString('userPhone') ??
          (authPhone.isNotEmpty ? authPhone : '+998 90 123 45 67');
      _notificationsEnabled = prefs.getBool('notifications_enabled') ?? true;
    });
  }

  Future<void> _editNameDialog() async {
    final nameCtrl = TextEditingController(text: _name);
    final result = await showCupertinoDialog<String>(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: const Text('Ismni o\'zgartirish'),
        content: Padding(
          padding: const EdgeInsets.only(top: 12),
          child: CupertinoTextField(
            controller: nameCtrl,
            placeholder: 'Ism va familiyangiz',
            autofocus: true,
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          ),
        ),
        actions: [
          CupertinoDialogAction(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Bekor qilish'),
          ),
          CupertinoDialogAction(
            isDefaultAction: true,
            onPressed: () => Navigator.of(ctx).pop(nameCtrl.text.trim()),
            child: const Text('Saqlash'),
          ),
        ],
      ),
    );

    if (result != null && result.isNotEmpty) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('userName', result);
      setState(() => _name = result);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profil muvaffaqiyatli yangilandi'),
          duration: Duration(seconds: 1),
        ),
      );
    }
  }

  Future<void> _logout() async {
    final confirm = await showCupertinoDialog<bool>(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: const Text('Hisobdan chiqish'),
        content: const Text(
          'Haqiqatan ham Agroz AI hisobingizdan chiqmoqchimisiz?',
        ),
        actions: [
          CupertinoDialogAction(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Bekor qilish'),
          ),
          CupertinoDialogAction(
            isDestructiveAction: true,
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Chiqish'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await ref.read(authProvider.notifier).logout();
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('token');
      await prefs.remove('userName');
      await prefs.remove('userPhone');
      if (mounted) context.go('/auth/phone');
    }
  }

  void _showAbout() {
    showCupertinoDialog(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: const Text('Agroz AI'),
        content: const Text(
          '\nO\'zbekiston dehqon, fermer va chorvadorlari uchun maxsus yaratilgan sun\'iy intellekt (AI) agro-platformasi.\n\n'
          '• Versiya: 1.0.0 (Beta)\n'
          '• Telegram bot: @agrozai_bot\n'
          '• Mutaxassislar: @agroz_auth_bot\n'
          '• Aloqa: +998 (71) 200-00-00',
        ),
        actions: [
          CupertinoDialogAction(
            isDefaultAction: true,
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Yopish'),
          ),
        ],
      ),
    );
  }

  void _openTelegramSupport() async {
    final url = Uri.parse('https://t.me/agrozai_bot');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
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

    final cart = ref.watch(cartProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. TOP HEADER: Date + "Profil" + Settings icon
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
                        'Profil',
                        style: TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF111827),
                          letterSpacing: -0.5,
                        ),
                      ),
                    ],
                  ),
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
                    child: IconButton(
                      onPressed: _editNameDialog,
                      icon: const Icon(
                        Icons.edit_outlined,
                        color: Color(0xFF4B5563),
                        size: 20,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // 2. USER PROFILE HERO CARD
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    // Avatar with green border
                    Stack(
                      children: [
                        Container(
                          width: 68,
                          height: 68,
                          decoration: BoxDecoration(
                            color: const Color(0xFFECFDF5),
                            shape: BoxShape.circle,
                            border: Border.all(
                                color: const Color(0xFF00A638), width: 2),
                          ),
                          child: Center(
                            child: Text(
                              _name?.isNotEmpty == true
                                  ? _name![0].toUpperCase()
                                  : 'A',
                              style: const TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF00A638),
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          right: 0,
                          bottom: 0,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: Color(0xFF00A638),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.check,
                                color: Colors.white, size: 12),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(width: 14),

                    // User Info
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Flexible(
                                child: Text(
                                  _name ?? 'Foydalanuvchi',
                                  style: const TextStyle(
                                    fontSize: 17,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF111827),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFECFDF5),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text(
                                  'Fermer',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF00A638),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _phone ?? '+998 90 123 45 67',
                            style: const TextStyle(
                              fontSize: 13,
                              color: Color(0xFF6B7280),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 6),
                          GestureDetector(
                            onTap: _editNameDialog,
                            child: const Text(
                              'Profilni tahrirlash →',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF00A638),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // 3. STATS TILES (3 cards: Buyurtmalar | Savat | Tashxislar)
              Row(
                children: [
                  Expanded(
                    child: _buildStatTile(
                      title: 'Buyurtmalar',
                      count: 'Tarix',
                      icon: Icons.receipt_long_rounded,
                      color: const Color(0xFF2563EB),
                      bgColor: const Color(0xFFEFF6FF),
                      onTap: () => context.push('/profil/buyurtmalar'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildStatTile(
                      title: 'Savatda',
                      count: '${cart.itemCount} ta',
                      icon: Icons.shopping_cart_outlined,
                      color: const Color(0xFF00A638),
                      bgColor: const Color(0xFFECFDF5),
                      onTap: () {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => const CartScreen(),
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildStatTile(
                      title: 'AI Tashxis',
                      count: 'Tekshiruv',
                      icon: Icons.auto_awesome_rounded,
                      color: const Color(0xFFD97706),
                      bgColor: const Color(0xFFFFFBEB),
                      onTap: () => context.push('/tashxis/crop'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 22),

              // 4. GROUP 1: BUYURTMALAR VA XIZMATLAR
              const Text(
                'Buyurtmalar va xizmatlar',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF6B7280),
                ),
              ),
              const SizedBox(height: 8),

              _buildCardGroup([
                _buildListTile(
                  icon: Icons.inventory_2_outlined,
                  iconColor: const Color(0xFF2563EB),
                  title: 'Mening buyurtmalarim',
                  subtitle: 'Barcha xaridlar va yetkazish holati',
                  onTap: () => context.push('/profil/buyurtmalar'),
                ),
                _buildListTile(
                  icon: Icons.people_outline_rounded,
                  iconColor: const Color(0xFF00A638),
                  title: 'Mutaxassislar chaqiruvi',
                  subtitle: 'Agronom va veterinar bilan bog\'lanish',
                  onTap: () => context.go('/mutaxassislar'),
                ),
                _buildListTile(
                  icon: Icons.location_on_outlined,
                  iconColor: const Color(0xFFE11D48),
                  title: 'Yaqin dorixonalar xaritasi',
                  subtitle: 'Atrofdagi agro-dorixonalar',
                  onTap: () => context.push('/xarita'),
                  isLast: true,
                ),
              ]),
              const SizedBox(height: 20),

              // 5. GROUP 2: SOZLAMALAR VA XABARLAR
              const Text(
                'Sozlamalar',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF6B7280),
                ),
              ),
              const SizedBox(height: 8),

              _buildCardGroup([
                Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.notifications_active_outlined,
                            color: Color(0xFF00A638), size: 20),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Bildirishnomalar',
                              style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF111827)),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Ob-havo va buyurtma xabarlari',
                              style: TextStyle(
                                  fontSize: 11, color: Color(0xFF6B7280)),
                            ),
                          ],
                        ),
                      ),
                      Switch.adaptive(
                        value: _notificationsEnabled,
                        activeColor: const Color(0xFF00A638),
                        onChanged: (val) async {
                          final prefs = await SharedPreferences.getInstance();
                          await prefs.setBool('notifications_enabled', val);
                          setState(() => _notificationsEnabled = val);
                        },
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1, indent: 54, color: Color(0xFFF3F4F6)),
                _buildListTile(
                  icon: Icons.language_rounded,
                  iconColor: const Color(0xFF6366F1),
                  title: 'Ilova tili',
                  subtitle: 'O\'zbek tili (Lotin)',
                  trailingText: 'UZ',
                  onTap: () {},
                  isLast: true,
                ),
              ]),
              const SizedBox(height: 20),

              // 6. GROUP 3: YORDAM VA ILOVA HAQIDA
              const Text(
                'Yordam va ma\'lumot',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF6B7280),
                ),
              ),
              const SizedBox(height: 8),

              _buildCardGroup([
                _buildListTile(
                  icon: Icons.headset_mic_outlined,
                  iconColor: const Color(0xFF0284C7),
                  title: 'Qo\'llab-quvvatlash xizmati',
                  subtitle: 'Telegram: @agrozai_bot (24/7)',
                  onTap: _openTelegramSupport,
                ),
                _buildListTile(
                  icon: Icons.shield_outlined,
                  iconColor: const Color(0xFF4B5563),
                  title: 'Maxfiylik va ommaviy oferta',
                  subtitle: 'Foydalanish qoidalari',
                  onTap: () {},
                ),
                _buildListTile(
                  icon: Icons.info_outline_rounded,
                  iconColor: const Color(0xFF00A638),
                  title: 'Agroz AI haqida',
                  subtitle: 'Versiya: 1.0.0 (Beta)',
                  onTap: _showAbout,
                  isLast: true,
                ),
              ]),
              const SizedBox(height: 24),

              // 7. LOGOUT BUTTON
              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFFEE2E2)),
                ),
                child: ListTile(
                  onTap: _logout,
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.logout_rounded,
                        color: Color(0xFFEF4444), size: 20),
                  ),
                  title: const Text(
                    'Hisobdan chiqish',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFFEF4444),
                    ),
                  ),
                  trailing: const Icon(Icons.arrow_forward_ios_rounded,
                      color: Color(0xFFEF4444), size: 14),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatTile({
    required String title,
    required String count,
    required IconData icon,
    required Color color,
    required Color bgColor,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE5E7EB)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: bgColor,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 6),
            Text(
              count,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: Color(0xFF111827),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              title,
              style: const TextStyle(
                fontSize: 11,
                color: Color(0xFF6B7280),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCardGroup(List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: children,
      ),
    );
  }

  Widget _buildListTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    String? trailingText,
    bool isLast = false,
  }) {
    return Column(
      children: [
        ListTile(
          onTap: onTap,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
          leading: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          title: Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF111827),
            ),
          ),
          subtitle: Text(
            subtitle,
            style: const TextStyle(
              fontSize: 11,
              color: Color(0xFF6B7280),
            ),
          ),
          trailing: trailingText != null
              ? Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    trailingText,
                    style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF4B5563)),
                  ),
                )
              : const Icon(Icons.arrow_forward_ios_rounded,
                  size: 14, color: Color(0xFF9CA3AF)),
        ),
        if (!isLast)
          const Divider(height: 1, indent: 54, color: Color(0xFFF3F4F6)),
      ],
    );
  }
}
