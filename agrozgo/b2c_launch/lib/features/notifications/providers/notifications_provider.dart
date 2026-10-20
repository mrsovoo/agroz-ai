import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../repositories/notifications_repository.dart';

String formatNotificationDate(DateTime dateTime) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final itemDate = DateTime(dateTime.year, dateTime.month, dateTime.day);
  final difference = today.difference(itemDate).inDays;

  final hours = dateTime.hour.toString().padLeft(2, '0');
  final minutes = dateTime.minute.toString().padLeft(2, '0');
  final timeStr = '$hours:$minutes';

  if (difference == 0) {
    return 'Bugun, $timeStr';
  } else if (difference == 1) {
    return 'Kecha, $timeStr';
  } else {
    const months = [
      'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
      'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
    ];
    final monthName = months[dateTime.month - 1];
    return '${dateTime.day}-$monthName, $timeStr';
  }
}

String getNotificationDateGroup(DateTime dateTime) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final itemDate = DateTime(dateTime.year, dateTime.month, dateTime.day);
  final difference = today.difference(itemDate).inDays;

  if (difference == 0) {
    return 'Bugun';
  } else if (difference == 1) {
    return 'Kecha';
  } else {
    const months = [
      'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
      'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
    ];
    final monthName = months[dateTime.month - 1];
    return '${dateTime.day}-$monthName, ${dateTime.year}';
  }
}

class NotificationStateItem {
  final String id;
  final String type;
  final String severity; // 'critical', 'warning', 'info', 'success'
  final String title;
  final String body;
  final String? actionUrl;
  final String? actionLabel;
  final String dateText;
  final DateTime createdAt;

  const NotificationStateItem({
    required this.id,
    required this.type,
    this.severity = 'info',
    required this.title,
    required this.body,
    this.actionUrl,
    this.actionLabel,
    required this.dateText,
    required this.createdAt,
  });

  String get dateGroup => getNotificationDateGroup(createdAt);
}

class NotificationsState {
  final List<NotificationStateItem> items;
  final Set<String> readIds;

  const NotificationsState({
    required this.items,
    required this.readIds,
  });

  int get unreadCount => items.where((it) => !readIds.contains(it.id)).length;

  NotificationsState copyWith({
    List<NotificationStateItem>? items,
    Set<String>? readIds,
  }) {
    return NotificationsState(
      items: items ?? this.items,
      readIds: readIds ?? this.readIds,
    );
  }
}

class NotificationsNotifier extends StateNotifier<NotificationsState> {
  final Ref? _ref;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  static const _keyReadIds = 'agroz_read_notification_ids';

  static final List<NotificationStateItem> baselineItems = [
    NotificationStateItem(
      id: 'weather-wind-alert-12oct',
      type: 'weather',
      severity: 'warning',
      title: '💨 Kuchli shamol ogohlantirishi (6 m/s)',
      body: "Shamol tezligi yuqori bo'lgani sababli kimyoviy preparatlar purkash tavsiya etilmaydi. Dori shamolda tarqab ketib samarasiz bo'ladi.",
      dateText: formatNotificationDate(DateTime(2026, 10, 12, 14, 30)),
      createdAt: DateTime(2026, 10, 12, 14, 30),
    ),
    NotificationStateItem(
      id: 'season-crop-autumn-11oct',
      type: 'crop',
      severity: 'info',
      title: "🌾 Kuzgi shudgor va mevali bog'larni parvarishlash",
      body: "Hosil yig'ishtirilgach, daraxt tanalarini oqlash, quruq shoxlarni kesish va tuproqqa fosforli-kaliyli o'g'it solish lozim.",
      actionUrl: '/medicines',
      actionLabel: 'Dorilar katalogi',
      dateText: formatNotificationDate(DateTime(2026, 10, 11, 10, 15)),
      createdAt: DateTime(2026, 10, 11, 10, 15),
    ),
    NotificationStateItem(
      id: 'season-animal-autumn-10oct',
      type: 'animal',
      severity: 'info',
      title: '🐄 Chorva mollarni sovuqqa tayyorlash va profilaktik emlash',
      body: "Kuzda havo harorati o'zgarishi sababli qoramol va qo'ylarda nafas yo'li kasalliklari ko'payadi. Molxona tirqishlarini yopib, quruq to'shama soling.",
      actionUrl: '/specialists',
      actionLabel: 'Veterinarlar',
      dateText: formatNotificationDate(DateTime(2026, 10, 10, 16, 45)),
      createdAt: DateTime(2026, 10, 10, 16, 45),
    ),
    NotificationStateItem(
      id: 'system-status-welcome-08oct',
      type: 'system',
      severity: 'info',
      title: '📱 AgrozGO xizmatlari faol',
      body: "Dorilar yetkazib berish, veterinarlar va agronomlar chaqiruvi hamda sun'iy intellekt agro-tashxisi 24/7 ishlamoqda.",
      dateText: formatNotificationDate(DateTime(2026, 10, 8, 9, 0)),
      createdAt: DateTime(2026, 10, 8, 9, 0),
    ),
  ];

  NotificationsNotifier([this._ref])
      : super(
          NotificationsState(
            items: baselineItems,
            readIds: <String>{},
          ),
        ) {
    _loadFromStorageAndBackend();
  }

  Future<void> _loadFromStorageAndBackend() async {
    try {
      final cachedStr = await _storage.read(key: _keyReadIds);
      if (cachedStr != null && cachedStr.isNotEmpty) {
        final cachedSet = cachedStr
            .split(',')
            .map((s) => s.trim())
            .where((s) => s.isNotEmpty)
            .toSet();
        if (cachedSet.isNotEmpty) {
          state = state.copyWith(readIds: {...state.readIds, ...cachedSet});
        }
      }
    } catch (_) {}

    if (_ref == null) return;
    try {
      final repo = _ref.read(notificationsRepositoryProvider);
      final remoteItems = await repo.fetchNotifications();
      final readIds = await repo.getReadNotificationIds();
      final merged = {...state.readIds, ...readIds};

      if (remoteItems.isNotEmpty) {
        state = state.copyWith(
          items: remoteItems,
          readIds: merged,
        );
      } else if (readIds.isNotEmpty) {
        state = state.copyWith(readIds: merged);
      }

      if (merged.isNotEmpty) {
        await _storage.write(key: _keyReadIds, value: merged.join(','));
      }
    } catch (_) {}
  }

  void markAsRead(String id) {
    if (state.readIds.contains(id)) return;
    final updated = {...state.readIds, id};
    state = state.copyWith(readIds: updated);
    _storage.write(key: _keyReadIds, value: updated.join(',')).catchError((_) {});
    if (_ref != null) {
      _ref.read(notificationsRepositoryProvider).markAsRead(id).catchError((_) {});
    }
  }

  void markAllAsRead() {
    final allIds = state.items.map((it) => it.id).toSet();
    final updated = {...state.readIds, ...allIds};
    state = state.copyWith(readIds: updated);
    _storage.write(key: _keyReadIds, value: updated.join(',')).catchError((_) {});
    if (_ref != null) {
      _ref.read(notificationsRepositoryProvider).markBatchAsRead(allIds.toList()).catchError((_) {});
    }
  }
}

final notificationsProvider =
    StateNotifierProvider<NotificationsNotifier, NotificationsState>((ref) {
  return NotificationsNotifier(ref);
});
