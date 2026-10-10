class CartItem {
  final int medicineId;
  final int pharmacyId;
  final String name;
  final int price;
  final int quantity;
  final String stockUnit;

  const CartItem({
    required this.medicineId,
    required this.pharmacyId,
    required this.name,
    required this.price,
    this.quantity = 1,
    this.stockUnit = 'dona',
  });

  int get total => price * quantity;

  CartItem copyWith({
    int? quantity,
  }) {
    return CartItem(
      medicineId: medicineId,
      pharmacyId: pharmacyId,
      name: name,
      price: price,
      quantity: quantity ?? this.quantity,
      stockUnit: stockUnit,
    );
  }

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      medicineId: json['medicineId'] as int? ?? 0,
      pharmacyId: json['pharmacyId'] as int? ?? 0,
      name: json['name'] as String? ?? '',
      price: json['price'] as int? ?? 0,
      quantity: json['quantity'] as int? ?? 1,
      stockUnit: json['stockUnit'] as String? ?? 'dona',
    );
  }

  Map<String, dynamic> toJson() => {
        'medicineId': medicineId,
        'pharmacyId': pharmacyId,
        'name': name,
        'price': price,
        'quantity': quantity,
        'stockUnit': stockUnit,
      };
}
