class OrderItemModel {
  final int id;
  final int orderId;
  final int medicineId;
  final String name;
  final int? price;
  final int qty;

  const OrderItemModel({
    required this.id,
    required this.orderId,
    required this.medicineId,
    required this.name,
    this.price,
    this.qty = 1,
  });

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    return OrderItemModel(
      id: json['id'] as int? ?? 0,
      orderId: json['orderId'] as int? ?? 0,
      medicineId: json['medicineId'] as int? ?? 0,
      name: json['name'] as String? ?? '',
      price: json['price'] as int?,
      qty: json['qty'] as int? ?? 1,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'orderId': orderId,
        'medicineId': medicineId,
        'name': name,
        'price': price,
        'qty': qty,
      };
}

class OrderModel {
  final int id;
  final int? userId;
  final int pharmacySpecialistId;
  final String? pharmacyName;
  final String customerName;
  final String customerPhone;
  final String? note;
  final String deliveryType; // pickup, delivery
  final String? customerAddress;
  final int? totalSum;
  final String status; // yangi, tasdiqlandi, yetkazildi, bekor
  final int? ratingStars;
  final String? ratingNote;
  final DateTime? createdAt;
  final List<OrderItemModel> items;

  const OrderModel({
    required this.id,
    this.userId,
    required this.pharmacySpecialistId,
    this.pharmacyName,
    required this.customerName,
    required this.customerPhone,
    this.note,
    this.deliveryType = 'pickup',
    this.customerAddress,
    this.totalSum,
    this.status = 'yangi',
    this.ratingStars,
    this.ratingNote,
    this.createdAt,
    this.items = const [],
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    var rawItems = json['items'];
    List<OrderItemModel> itemsList = [];
    if (rawItems is List) {
      itemsList = rawItems
          .map((e) => OrderItemModel.fromJson(e as Map<String, dynamic>))
          .toList();
    }

    return OrderModel(
      id: json['id'] as int? ?? 0,
      userId: json['userId'] as int?,
      pharmacySpecialistId: json['pharmacySpecialistId'] as int? ?? 0,
      pharmacyName: json['pharmacyName'] as String?,
      customerName: json['customerName'] as String? ?? '',
      customerPhone: json['customerPhone'] as String? ?? '',
      note: json['note'] as String?,
      deliveryType: json['deliveryType'] as String? ?? 'pickup',
      customerAddress: json['customerAddress'] as String?,
      totalSum: json['totalSum'] as int?,
      status: json['status'] as String? ?? 'yangi',
      ratingStars: json['ratingStars'] as int?,
      ratingNote: json['ratingNote'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      items: itemsList,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'pharmacySpecialistId': pharmacySpecialistId,
        'pharmacyName': pharmacyName,
        'customerName': customerName,
        'customerPhone': customerPhone,
        'note': note,
        'deliveryType': deliveryType,
        'customerAddress': customerAddress,
        'totalSum': totalSum,
        'status': status,
        'ratingStars': ratingStars,
        'ratingNote': ratingNote,
        'createdAt': createdAt?.toIso8601String(),
        'items': items.map((e) => e.toJson()).toList(),
      };
}

