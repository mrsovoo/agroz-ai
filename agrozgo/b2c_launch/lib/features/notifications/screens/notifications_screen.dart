import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/home_theme_tokens.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/notifications_provider.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  IconData _getIconData(String type, String title) {
    if (type == 'weather') {
      if (title.contains('Shamol') || title.contains('💨')) {
        return Icons.air_rounded;
      }
      if (title.contains('Yog‘in') || title.contains('Yog\'in') || title.contains('🌧️')) {
        return Icons.water_drop_rounded;
      }
      if (title.contains('Qulay') || title.contains('🌱')) {
        return Icons.wb_sunny_rounded;
      }
      return Icons.warning_amber_rounded;
    }
    if (type == 'crop') {
      return Icons.eco_rounded;
    }
    if (type == 'animal') {
      return Icons.pets_rounded;
    }
    if (type == 'order') {
      return Icons.local_shipping_rounded;
    }
    return Icons.verified_user_rounded;
  }

  Color _getIconColor(String type, String severity) {
    if (severity == 'critical') return const Color(0xFFDC2626);
    if (type == 'weather') return const Color(0xFFD97706);
    if (type == 'crop') return const Color(0xFF16A34A);
    if (type == 'animal') return const Color(0xFFD97706);
    return const Color(0xFF4B5563);
  }

  Color _getIconBgColor(String type, String severity) {
    if (severity == 'critical') return const Color(0xFFFEE2E2);
    if (type == 'weather') return const Color(0xFFFEF3C7);
    if (type == 'crop') return const Color(0xFFDCFCE7);
    if (type == 'animal') return const Color(0xFFFEF3C7);
    return const Color(0xFFF3F4F6);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = Theme.of(context).extension<HomeThemeTokens>() ?? HomeThemeTokens.light;
    final notifState = ref.watch(notificationsProvider);
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final region = (user?.district != null && user!.district!.trim().isNotEmpty)
        ? user.district!.trim()
        : (user?.region != null && user!.region!.trim().isNotEmpty
            ? user.region!.trim()
            : 'Toshkent');

    final unreadCount = notifState.unreadCount;

    return PopScope(
      canPop: true,
      onPopInvokedWithResult: (didPop, _) {
        ref.read(notificationsProvider.notifier).markAllAsRead();
      },
      child: Scaffold(
        backgroundColor: tokens.screenBackground,
        body: SafeArea(
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                child: Row(
                  children: [
                    // Back button
                    Semantics(
                      label: 'Orqaga',
                      button: true,
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: tokens.headerButtonBg,
                          shape: BoxShape.circle,
                          boxShadow: const [
                            BoxShadow(
                              color: Color(0x14000000),
                              blurRadius: 10,
                              offset: Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Material(
                          color: Colors.transparent,
                          shape: const CircleBorder(),
                          child: InkWell(
                            customBorder: const CircleBorder(),
                            onTap: () {
                              HapticFeedback.lightImpact();
                              ref.read(notificationsProvider.notifier).markAllAsRead();
                              if (context.canPop()) {
                                context.pop();
                              } else {
                                context.go('/');
                              }
                            },
                            child: const Center(
                              child: Icon(
                                Icons.arrow_back_ios_new_rounded,
                                size: 18,
                                color: Colors.black87,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  const SizedBox(width: 12),

                  // Title & Subtitle
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(
                              Icons.notifications_rounded,
                              color: Color(0xFF35CA56),
                              size: 20,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              AppStrings.notifications,
                              style: const TextStyle(
                                fontSize: 19,
                                fontWeight: FontWeight.w800,
                                fontFamily: 'PingFang SC',
                                color: Colors.black87,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Ob-havo, dehqonchilik va veterinariya xabarnomalari',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: Colors.black54,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),

                  // Mark all read button
                  if (unreadCount > 0)
                    TextButton.icon(
                      onPressed: () {
                        HapticFeedback.mediumImpact();
                        ref.read(notificationsProvider.notifier).markAllAsRead();
                      },
                      style: TextButton.styleFrom(
                        backgroundColor: const Color(0xFFF2F2F7),
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      icon: const Icon(
                        Icons.done_all_rounded,
                        color: Color(0xFF35CA56),
                        size: 15,
                      ),
                      label: const Text(
                        "O‘qildi",
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: Colors.black87,
                        ),
                      ),
                    ),
                ],
              ),
            ),

            const Divider(height: 1, thickness: 0.6, color: Color(0x1F000000)),

            // Region & count bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Xabarnomalar (${notifState.items.length})',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: Colors.black54,
                    ),
                  ),
                  Text(
                    'Hudud: $region',
                    style: const TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                      color: Colors.black45,
                    ),
                  ),
                ],
              ),
            ),

            // Notifications List
            Expanded(
              child: notifState.items.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 60,
                            height: 60,
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.done_all_rounded,
                              size: 28,
                              color: Colors.black38,
                            ),
                          ),
                          const SizedBox(height: 14),
                          const Text(
                            'Hozircha yangi bildirishnoma yo‘q',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Ob-havo xavfi yoki muhim tavsiyalar shu yerda chiqadi.',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.black45,
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                      physics: const BouncingScrollPhysics(),
                      itemCount: notifState.items.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final item = notifState.items[index];
                        final isRead = notifState.readIds.contains(item.id);
                        final isCritical = item.severity == 'critical';

                        final iconData = _getIconData(item.type, item.title);
                        final iconColor = _getIconColor(item.type, item.severity);
                        final iconBg = _getIconBgColor(item.type, item.severity);
                        final showDateHeader = index == 0 ||
                            notifState.items[index - 1].dateGroup != item.dateGroup;

                        final card = Container(
                          decoration: BoxDecoration(
                            color: isRead
                                ? Colors.white
                                : (isCritical
                                    ? const Color(0xFFFEF2F2)
                                    : const Color(0xFFF0FDF4)),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0x14000000)),
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: Material(
                            color: Colors.transparent,
                            child: InkWell(
                              onTap: () {
                                HapticFeedback.lightImpact();
                                ref.read(notificationsProvider.notifier).markAsRead(item.id);
                                if (item.actionUrl != null) {
                                  context.push(item.actionUrl!);
                                }
                              },
                              child: IntrinsicHeight(
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    if (!isRead)
                                      Container(
                                        width: 4.5,
                                        color: isCritical
                                            ? const Color(0xFFDC2626)
                                            : const Color(0xFF28CD41),
                                      ),
                                    Expanded(
                                      child: Padding(
                                        padding: const EdgeInsets.all(14),
                                        child: Row(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            // Icon box
                                            Container(
                                              width: 40,
                                              height: 40,
                                              decoration: BoxDecoration(
                                                color: iconBg,
                                                borderRadius: BorderRadius.circular(12),
                                              ),
                                              alignment: Alignment.center,
                                              child: Icon(
                                                iconData,
                                                size: 20,
                                                color: iconColor,
                                              ),
                                            ),
                                            const SizedBox(width: 12),

                                            // Text content
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  // Category / date / badge
                                                  Row(
                                                    mainAxisAlignment:
                                                        MainAxisAlignment.spaceBetween,
                                                    children: [
                                                      Text(
                                                        item.dateText.toUpperCase(),
                                                        style: TextStyle(
                                                          fontSize: 10,
                                                          fontWeight: FontWeight.w800,
                                                          letterSpacing: 0.3,
                                                          color: !isRead
                                                              ? (isCritical
                                                                  ? const Color(0xFFDC2626)
                                                                  : const Color(0xFF16A34A))
                                                              : Colors.black45,
                                                        ),
                                                      ),
                                                      if (!isRead)
                                                        Container(
                                                          padding: const EdgeInsets.symmetric(
                                                              horizontal: 6, vertical: 2),
                                                          decoration: BoxDecoration(
                                                            color: const Color(0xFFDCFCE7),
                                                            borderRadius:
                                                                BorderRadius.circular(6),
                                                          ),
                                                          child: const Text(
                                                            'Yangi',
                                                            style: TextStyle(
                                                              fontSize: 9.5,
                                                              fontWeight: FontWeight.w800,
                                                              color: Color(0xFF16A34A),
                                                            ),
                                                          ),
                                                        )
                                                      else
                                                        const Text(
                                                          'O‘qilgan',
                                                          style: TextStyle(
                                                            fontSize: 10,
                                                            fontWeight: FontWeight.w500,
                                                            color: Colors.black38,
                                                          ),
                                                        ),
                                                    ],
                                                  ),
                                                  const SizedBox(height: 5),

                                                  // Title
                                                  Text(
                                                    item.title,
                                                    style: const TextStyle(
                                                      fontSize: 14.5,
                                                      fontWeight: FontWeight.w700,
                                                      fontFamily: 'PingFang SC',
                                                      color: Colors.black87,
                                                      height: 1.25,
                                                    ),
                                                  ),
                                                  const SizedBox(height: 4),

                                                  // Body
                                                  Text(
                                                    item.body,
                                                    style: const TextStyle(
                                                      fontSize: 12.5,
                                                      fontWeight: FontWeight.w400,
                                                      color: Color(0xFF4B5563),
                                                      height: 1.35,
                                                    ),
                                                  ),

                                                  // Action button if available
                                                  if (item.actionUrl != null) ...[
                                                    const SizedBox(height: 10),
                                                    InkWell(
                                                      onTap: () {
                                                        HapticFeedback.lightImpact();
                                                        ref
                                                            .read(notificationsProvider.notifier)
                                                            .markAsRead(item.id);
                                                        context.push(item.actionUrl!);
                                                      },
                                                      borderRadius: BorderRadius.circular(10),
                                                      child: Container(
                                                        padding: const EdgeInsets.symmetric(
                                                            horizontal: 10, vertical: 5),
                                                        decoration: BoxDecoration(
                                                          color: Colors.white,
                                                          borderRadius:
                                                              BorderRadius.circular(10),
                                                          border: Border.all(
                                                            color: const Color(0x1F000000),
                                                          ),
                                                        ),
                                                        child: Row(
                                                          mainAxisSize: MainAxisSize.min,
                                                          children: [
                                                            Text(
                                                              item.actionLabel ?? 'Batafsil',
                                                              style: const TextStyle(
                                                                fontSize: 11.5,
                                                                fontWeight: FontWeight.w700,
                                                                color: Color(0xFF28CD41),
                                                              ),
                                                            ),
                                                            const SizedBox(width: 4),
                                                            const Icon(
                                                              Icons.chevron_right_rounded,
                                                              size: 15,
                                                              color: Color(0xFF28CD41),
                                                            ),
                                                          ],
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );

                        if (!showDateHeader) {
                          return card;
                        }

                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Padding(
                              padding: EdgeInsets.only(
                                top: index == 0 ? 4 : 14,
                                bottom: 8,
                              ),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4.5,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFE5E7EB),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.calendar_today_rounded,
                                      size: 11,
                                      color: Colors.black54,
                                    ),
                                    const SizedBox(width: 5),
                                    Text(
                                      item.dateGroup,
                                      style: const TextStyle(
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.w700,
                                        color: Colors.black87,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            card,
                          ],
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
      ),
    );
  }
}

