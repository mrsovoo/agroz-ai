class Specialist {
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

  String get typeLabel => type == 'vet' ? 'Veterinar' : 'Agronom';
  String get distanceLabel => '${distance.toStringAsFixed(1)} km';

  factory Specialist.fromJson(Map<String, dynamic> json) {
    return Specialist(
      id: json['id'].toString(),
      name: json['name']?.toString() ?? '',
      type: json['type']?.toString() ?? 'agronom',
      phone: json['phone']?.toString() ?? '',
      address: json['address']?.toString() ?? '',
      lat: (json['lat'] as num?)?.toDouble() ?? 0.0,
      lng: (json['lng'] as num?)?.toDouble() ?? 0.0,
      distance: (json['distance'] as num?)?.toDouble() ?? 0.0,
      isActive: json['isActive'] ?? true,
      ratingAvg: (json['ratingAvg'] as num?)?.toDouble(),
      ratingCount: json['ratingCount'] as int? ?? 0,
    );
  }
}
