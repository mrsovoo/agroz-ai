class OrderLine {
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
}