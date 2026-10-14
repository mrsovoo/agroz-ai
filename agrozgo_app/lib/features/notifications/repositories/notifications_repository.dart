import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_provider.dart';

import '../providers/notifications_provider.dart';

abstract class NotificationsRepository {
  Future<List<NotificationStateItem>> fetchNotifications();
  Future<List<String>> getReadNotificationIds();
  Future<void> markAsRead(String id);
  Future<void> markBatchAsRead(List<String> ids);
}

class NotificationsRepositoryImpl implements NotificationsRepository {
  final ApiClient _apiClient;

  NotificationsRepositoryImpl({required ApiClient apiClient}) : _apiClient = apiClient;

  @override
  Future<List<NotificationStateItem>> fetchNotifications() async {
    try {
      final response = await _apiClient.get('/api/notifications');
      if (response is Map<String, dynamic> && response['notifications'] is List) {
        final list = response['notifications'] as List;
        return list.map((json) {
          final map = json as Map<String, dynamic>;
          final dtStr = map['createdAt']?.toString() ?? '';
          final createdAt = DateTime.tryParse(dtStr) ?? DateTime.now();
          return NotificationStateItem(
            id: map['id']?.toString() ?? 'notif',
            type: map['type']?.toString() ?? 'system',
            severity: map['severity']?.toString() ?? 'info',
            title: map['title']?.toString() ?? '',
            body: map['body']?.toString() ?? '',
            actionUrl: map['actionUrl']?.toString(),
            actionLabel: map['actionLabel']?.toString(),
            dateText: formatNotificationDate(createdAt),
            createdAt: createdAt,
          );
        }).toList();
      }
    } catch (_) {
      // offline fallback
    }
    return [];
  }

  @override
  Future<List<String>> getReadNotificationIds() async {
    final response = await _apiClient.get('/api/notifications/read-status');
    if (response is Map<String, dynamic> && response['readIds'] is List) {
      return (response['readIds'] as List).map((e) => e.toString()).toList();
    }
    return [];
  }

  @override
  Future<void> markAsRead(String id) async {
    await _apiClient.post('/api/notifications/$id/read');
  }

  @override
  Future<void> markBatchAsRead(List<String> ids) async {
    await _apiClient.post(
      '/api/notifications/batch/read',
      data: {'ids': ids},
    );
  }
}

final notificationsRepositoryProvider = Provider<NotificationsRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return NotificationsRepositoryImpl(apiClient: apiClient);
});

