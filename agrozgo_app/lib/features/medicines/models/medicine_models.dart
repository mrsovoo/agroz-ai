class MedicineModel {
  final int id;
  final String name;
  final String type; // crop, animal, general
  final String? usage;
  final int? price;
  final int stock;
  final String stockUnit;
  final String status;
  final bool hasPhoto;
  final int? pharmacyId;
  final String? pharmacyName;
  final String? pharmacyPhone;
  final String? pharmacyAddress;
  final double? rating;
  final int? ratingCount;

  const MedicineModel({
    required this.id,
    required this.name,
    this.type = 'general',
    this.usage,
    this.price,
    this.stock = 0,
    this.stockUnit = 'dona',
    this.status = 'bor',
    this.hasPhoto = false,
    this.pharmacyId,
    this.pharmacyName,
    this.pharmacyPhone,
    this.pharmacyAddress,
    this.rating,
    this.ratingCount,
  });

  factory MedicineModel.fromJson(Map<String, dynamic> json) {
    return MedicineModel(
      id: json['id'] as int? ?? 0,
      name: json['name'] as String? ?? '',
      type: json['type'] as String? ?? 'general',
      usage: json['usage'] as String?,
      price: json['price'] as int?,
      stock: json['stock'] as int? ?? 0,
      stockUnit: json['stockUnit'] as String? ?? 'dona',
      status: json['status'] as String? ?? 'bor',
      hasPhoto: json['hasPhoto'] as bool? ?? false,
      pharmacyId: json['pharmacyId'] as int?,
      pharmacyName: json['pharmacyName'] as String?,
      pharmacyPhone: json['pharmacyPhone'] as String?,
      pharmacyAddress: json['pharmacyAddress'] as String?,
      rating: (json['rating'] as num?)?.toDouble(),
      ratingCount: json['ratingCount'] as int?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'type': type,
        'usage': usage,
        'price': price,
        'stock': stock,
        'stockUnit': stockUnit,
        'status': status,
        'hasPhoto': hasPhoto,
        'pharmacyId': pharmacyId,
        'pharmacyName': pharmacyName,
        'pharmacyPhone': pharmacyPhone,
        'pharmacyAddress': pharmacyAddress,
        'rating': rating,
        'ratingCount': ratingCount,
      };
}
