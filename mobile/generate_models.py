import os

base_dir = "/Users/sohibjonsulaymonov/kodlar/agroz-ai/apps/mobile/lib"

files = {
    "core/models/medicine.dart": """class Medicine {
  final String id;
  final String name;
  final String type;
  final double? price;
  final String? usage;
  final bool hasPhoto;
  final String? photoVersion;
  final String pharmacyId;
  final String pharmacyName;
  final String? pharmacyPhone;
  final String? pharmacyAddress;
  final double? ratingAvg;
  final int ratingCount;

  Medicine({
    required this.id,
    required this.name,
    required this.type,
    this.price,
    this.usage,
    required this.hasPhoto,
    this.photoVersion,
    required this.pharmacyId,
    required this.pharmacyName,
    this.pharmacyPhone,
    this.pharmacyAddress,
    this.ratingAvg,
    required this.ratingCount,
  });

  factory Medicine.fromJson(Map<String, dynamic> json) {
    return Medicine(
      id: json['id'],
      name: json['name'],
      type: json['type'],
      price: json['price']?.toDouble(),
      usage: json['usage'],
      hasPhoto: json['hasPhoto'] ?? false,
      photoVersion: json['photoVersion'],
      pharmacyId: json['pharmacyId'],
      pharmacyName: json['pharmacyName'],
      pharmacyPhone: json['pharmacyPhone'],
      pharmacyAddress: json['pharmacyAddress'],
      ratingAvg: json['ratingAvg']?.toDouble(),
      ratingCount: json['ratingCount'] ?? 0,
    );
  }
}""",
    "core/models/specialist.dart": """class Specialist {
  final String id;
  final String name;
  final String type;
  final String phone;
  final String address;
  final double lat;
  final double lng;
  final double distance;
  final bool isActive;
  final double? ratingAvg;
  final int ratingCount;

  Specialist({
    required this.id,
    required this.name,
    required this.type,
    required this.phone,
    required this.address,
    required this.lat,
    required this.lng,
    required this.distance,
    required this.isActive,
    this.ratingAvg,
    required this.ratingCount,
  });

  factory Specialist.fromJson(Map<String, dynamic> json) {
    return Specialist(
      id: json['id'],
      name: json['name'],
      type: json['type'],
      phone: json['phone'],
      address: json['address'],
      lat: json['lat']?.toDouble() ?? 0.0,
      lng: json['lng']?.toDouble() ?? 0.0,
      distance: json['distance']?.toDouble() ?? 0.0,
      isActive: json['isActive'] ?? true,
      ratingAvg: json['ratingAvg']?.toDouble(),
      ratingCount: json['ratingCount'] ?? 0,
    );
  }
}""",
    "core/models/order.dart": """class OrderLine {
  final String medicineId;
  final String medicineName;
  final int qty;
  final double price;

  OrderLine({
    required this.medicineId,
    required this.medicineName,
    required this.qty,
    required this.price,
  });

  factory OrderLine.fromJson(Map<String, dynamic> json) {
    return OrderLine(
      medicineId: json['medicineId'],
      medicineName: json['medicineName'],
      qty: json['qty'],
      price: json['price']?.toDouble() ?? 0.0,
    );
  }
}

class Order {
  final String id;
  final String orderNumber;
  final String status;
  final List<OrderLine> lines;
  final String deliveryType;
  final String customerName;
  final String customerPhone;
  final double totalAmount;
  final String createdAt;

  Order({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.lines,
    required this.deliveryType,
    required this.customerName,
    required this.customerPhone,
    required this.totalAmount,
    required this.createdAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'],
      orderNumber: json['orderNumber'],
      status: json['status'],
      lines: (json['lines'] as List).map((i) => OrderLine.fromJson(i)).toList(),
      deliveryType: json['deliveryType'],
      customerName: json['customerName'],
      customerPhone: json['customerPhone'],
      totalAmount: json['totalAmount']?.toDouble() ?? 0.0,
      createdAt: json['createdAt'],
    );
  }
}""",
    "core/models/advertisement.dart": """class Advertisement {
  final String id;
  final String title;
  final String description;
  final String imageUrl;
  final String linkUrl;
  final int priority;
  final bool isActive;

  Advertisement({
    required this.id,
    required this.title,
    required this.description,
    required this.imageUrl,
    required this.linkUrl,
    required this.priority,
    required this.isActive,
  });

  factory Advertisement.fromJson(Map<String, dynamic> json) {
    return Advertisement(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      imageUrl: json['imageUrl'],
      linkUrl: json['linkUrl'],
      priority: json['priority'] ?? 0,
      isActive: json['isActive'] ?? true,
    );
  }
}""",
    "core/models/cart_item.dart": """import 'medicine.dart';

class CartItem {
  final Medicine medicine;
  int quantity;

  CartItem({required this.medicine, this.quantity = 1});

  double get totalPrice => (medicine.price ?? 0) * quantity;
}""",
    "core/services/api_service.dart": """import 'package:dio/dio.dart';
import '../constants/api_config.dart';

class ApiService {
  final Dio dio;

  ApiService()
      : dio = Dio(
          BaseOptions(
            baseUrl: ApiConfig.baseUrl,
            connectTimeout: const Duration(milliseconds: ApiConfig.connectTimeout),
            receiveTimeout: const Duration(milliseconds: ApiConfig.receiveTimeout),
          ),
        );
}
""",
}

for filepath, content in files.items():
    full_path = os.path.join(base_dir, filepath)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w") as f:
        f.write(content)
        
print("Models and Services generated successfully.")
