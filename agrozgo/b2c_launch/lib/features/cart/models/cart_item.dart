class CartItem {
  final int medicineId;
  final int pharmacyId;
  final String pharmacyName;
  final String name;
  final int price;
  final int? oldPrice;
  final int quantity;
  final String stockUnit;
  final String? imageUrl;
  final bool isSelected;
  final bool isFavorite;

  const CartItem({
    required this.medicineId,
    required this.pharmacyId,
    this.pharmacyName = 'Dorixona nomi',
    required this.name,
    required this.price,
    this.oldPrice,
    this.quantity = 1,
    this.stockUnit = 'dona',
    this.imageUrl,
    this.isSelected = true,
    this.isFavorite = false,
  });

  int get total => price * quantity;

  CartItem copyWith({
    int? quantity,
    bool? isSelected,
    bool? isFavorite,
    String? pharmacyName,
    String? imageUrl,
    int? oldPrice,
  }) {
    return CartItem(
      medicineId: medicineId,
      pharmacyId: pharmacyId,
      pharmacyName: pharmacyName ?? this.pharmacyName,
      name: name,
      price: price,
      oldPrice: oldPrice ?? this.oldPrice,
      quantity: quantity ?? this.quantity,
      stockUnit: stockUnit,
      imageUrl: imageUrl ?? this.imageUrl,
      isSelected: isSelected ?? this.isSelected,
      isFavorite: isFavorite ?? this.isFavorite,
    );
  }

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      medicineId: json['medicineId'] as int? ?? 0,
      pharmacyId: json['pharmacyId'] as int? ?? 0,
      pharmacyName: json['pharmacyName'] as String? ?? 'Dorixona nomi',
      name: json['name'] as String? ?? '',
      price: json['price'] as int? ?? 0,
      oldPrice: json['oldPrice'] as int?,
      quantity: json['quantity'] as int? ?? 1,
      stockUnit: json['stockUnit'] as String? ?? 'dona',
      imageUrl: json['imageUrl'] as String?,
      isSelected: json['isSelected'] as bool? ?? true,
      isFavorite: json['isFavorite'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'medicineId': medicineId,
        'pharmacyId': pharmacyId,
        'pharmacyName': pharmacyName,
        'name': name,
        'price': price,
        'oldPrice': oldPrice,
        'quantity': quantity,
        'stockUnit': stockUnit,
        'imageUrl': imageUrl,
        'isSelected': isSelected,
        'isFavorite': isFavorite,
      };
}
