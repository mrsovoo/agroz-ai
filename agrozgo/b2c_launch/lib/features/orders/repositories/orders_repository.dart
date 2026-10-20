import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_provider.dart';
import '../models/order_models.dart';

abstract class OrdersRepository {
  Future<List<OrderModel>> getOrders();
  Future<Map<String, dynamic>> createOrder({
    required int pharmacySpecialistId,
    required String customerName,
    required String customerPhone,
    required String deliveryType,
    String? customerAddress,
    String? note,
    required List<Map<String, dynamic>> items,
  });
  Future<void> rateOrder(int orderId, int stars, {String? note});
}

class OrdersRepositoryImpl implements OrdersRepository {
  final ApiClient _apiClient;

  OrdersRepositoryImpl({required ApiClient apiClient}) : _apiClient = apiClient;

  @override
  Future<List<OrderModel>> getOrders() async {
    final response = await _apiClient.get('/api/orders/track');
    if (response is Map<String, dynamic> && response['orders'] is List) {
      return (response['orders'] as List)
          .map((e) => OrderModel.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  @override
  Future<Map<String, dynamic>> createOrder({
    required int pharmacySpecialistId,
    required String customerName,
    required String customerPhone,
    required String deliveryType,
    String? customerAddress,
    String? note,
    required List<Map<String, dynamic>> items,
  }) async {
    final response = await _apiClient.post(
      '/api/orders',
      data: {
        'pharmacySpecialistId': pharmacySpecialistId,
        'customerName': customerName,
        'customerPhone': customerPhone,
        'deliveryType': deliveryType,
        'customerAddress': customerAddress,
        'note': note,
        'items': items,
      },
    );

    return response is Map<String, dynamic> ? response : {};
  }

  @override
  Future<void> rateOrder(int orderId, int stars, {String? note}) async {
    await _apiClient.post(
      '/api/orders/$orderId/rate',
      data: {
        'stars': stars,
        if (note != null) 'note': note,
      },
    );
  }
}

final ordersRepositoryProvider = Provider<OrdersRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return OrdersRepositoryImpl(apiClient: apiClient);
});

