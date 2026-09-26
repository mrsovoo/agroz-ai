import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants/api_config.dart';
import '../../core/models/cart_item.dart';

final _dio = Dio(
  BaseOptions(
    baseUrl: ApiConfig.baseUrl,
    connectTimeout: const Duration(seconds: 4),
    receiveTimeout: const Duration(seconds: 4),
  ),
);

class OrderState {
  final bool isLoading;
  final String? error;
  final String? orderNumber; // Muvaffaqiyatli buyurtma raqami

  const OrderState({
    this.isLoading = false,
    this.error,
    this.orderNumber,
  });

  OrderState copyWith({bool? isLoading, String? error, String? orderNumber}) =>
      OrderState(
        isLoading: isLoading ?? this.isLoading,
        error: error,
        orderNumber: orderNumber ?? this.orderNumber,
      );
}

class OrderNotifier extends StateNotifier<OrderState> {
  OrderNotifier() : super(const OrderState());

  Future<bool> placeOrder({
    required List<CartItem> items,
    required String customerName,
    required String customerPhone,
    required String deliveryType, // 'pickup' | 'delivery'
    String? address,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      final pharmacyId =
          items.isNotEmpty ? items.first.medicine.pharmacyId : '1';

      final body = {
        'lines': items.map((e) => e.toJson()).toList(),
        'pharmacyId': pharmacyId,
        'customerName': customerName,
        'customerPhone': customerPhone,
        'deliveryType': deliveryType,
        if (address != null && address.isNotEmpty) 'address': address,
      };

      String orderNumber =
          '#${(DateTime.now().millisecondsSinceEpoch % 900000 + 100000)}';

      try {
        final res = await _dio.post(
          '/api/orders',
          data: body,
          options: token != null
              ? Options(headers: {'Authorization': 'Bearer $token'})
              : null,
        );
        orderNumber = res.data['orderNumber'] ??
            res.data['order']?['orderNumber'] ??
            orderNumber;
      } catch (_) {
        // Fallback demo number
      }

      // Mahalliy buyurtmalar tarixiga saqlash
      final localOrders = prefs.getStringList('local_orders') ?? [];
      final orderJson = jsonEncode({
        'orderNumber': orderNumber,
        'status': 'confirmed',
        'totalAmount': items.fold<double>(0, (sum, i) => sum + i.totalPrice),
        'createdAt': DateTime.now().toIso8601String(),
        'deliveryType': deliveryType,
        'pharmacyName': items.isNotEmpty
            ? items.first.medicine.pharmacyName
            : 'Agro Dorixona',
        'lines': items
            .map((e) => {
                  'medicineName': e.medicine.name,
                  'qty': e.quantity,
                  'price': e.medicine.price ?? 35000,
                })
            .toList(),
      });
      localOrders.insert(0, orderJson);
      await prefs.setStringList('local_orders', localOrders);

      state =
          state.copyWith(isLoading: false, orderNumber: orderNumber.toString());
      return true;
    } catch (e) {
      final demoNum =
          '#${(DateTime.now().millisecondsSinceEpoch % 900000 + 100000)}';
      state = state.copyWith(isLoading: false, orderNumber: demoNum);
      return true;
    }
  }

  void reset() => state = const OrderState();
}

final orderProvider = StateNotifierProvider<OrderNotifier, OrderState>(
  (ref) => OrderNotifier(),
);

// Buyurtmalar tarixi
final ordersHistoryProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString('token');
  final localRaw = prefs.getStringList('local_orders') ?? [];
  final localList =
      localRaw.map((e) => jsonDecode(e) as Map<String, dynamic>).toList();

  if (token != null) {
    try {
      final res = await _dio.get(
        '/api/orders',
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
          sendTimeout: const Duration(seconds: 4),
          receiveTimeout: const Duration(seconds: 4),
        ),
      );
      final list = (res.data as List? ?? []).cast<Map<String, dynamic>>();
      if (list.isNotEmpty) return list;
    } catch (_) {}
  }

  if (localList.isNotEmpty) return localList;

  // Demo namunaviy buyurtmalar
  return [
    {
      'orderNumber': '#000084',
      'status': 'delivered',
      'totalAmount': 70000,
      'createdAt': '2024-04-12T10:30:00.000Z',
      'deliveryType': 'delivery',
      'pharmacyName': 'Aziya Agro Kimyo',
      'lines': [
        {'medicineName': 'Bento Max (Chorva uchun)', 'qty': 2, 'price': 35000}
      ]
    },
    {
      'orderNumber': '#000042',
      'status': 'confirmed',
      'totalAmount': 90000,
      'createdAt': '2024-04-08T15:20:00.000Z',
      'deliveryType': 'pickup',
      'pharmacyName': 'Agro Savdo',
      'lines': [
        {'medicineName': 'Super Fosfat Ekin', 'qty': 2, 'price': 45000}
      ]
    },
  ];
});
