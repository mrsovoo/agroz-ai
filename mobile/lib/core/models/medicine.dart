class Medicine {
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

  String get formattedPrice =>
      price != null ? "${price!.toStringAsFixed(0)} so'm" : 'Narx yo\'q';

  factory Medicine.fromJson(Map<String, dynamic> json) {
    return Medicine(
      id: json['id'].toString(),
      name: json['name']?.toString() ?? '',
      type: json['type']?.toString() ?? 'crop',
      price: (json['price'] as num?)?.toDouble(),
      usage: json['usage']?.toString(),
      hasPhoto: json['hasPhoto'] == true,
      photoVersion: json['photoVersion']?.toString(),
      pharmacyId: json['pharmacyId']?.toString() ?? '',
      pharmacyName: json['pharmacyName']?.toString() ?? '',
      pharmacyPhone: json['pharmacyPhone']?.toString(),
      pharmacyAddress: json['pharmacyAddress']?.toString(),
      ratingAvg: (json['ratingAvg'] as num?)?.toDouble(),
      ratingCount: json['ratingCount'] as int? ?? 0,
    );
  }
}
