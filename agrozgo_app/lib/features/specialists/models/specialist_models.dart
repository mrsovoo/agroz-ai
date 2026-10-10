class SpecialistModel {
  final int id;
  final String name;
  final String phone;
  final String role; // specialist, pharmacy
  final String? specialty;
  final String? organization;
  final String address;
  final double lat;
  final double lng;
  final String workHours;
  final bool isBusy;
  final double? distanceKm;
  final double? rating;
  final int? ratingCount;
  final String? bio;

  const SpecialistModel({
    required this.id,
    required this.name,
    required this.phone,
    this.role = 'specialist',
    this.specialty,
    this.organization,
    required this.address,
    required this.lat,
    required this.lng,
    this.workHours = '09:00 - 18:00',
    this.isBusy = false,
    this.distanceKm,
    this.rating,
    this.ratingCount,
    this.bio,
  });

  factory SpecialistModel.fromJson(Map<String, dynamic> json) {
    return SpecialistModel(
      id: json['id'] as int? ?? 0,
      name: json['name'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      role: json['role'] as String? ?? 'specialist',
      specialty: json['specialty'] as String?,
      organization: json['organization'] as String?,
      address: json['address'] as String? ?? '',
      lat: (json['lat'] as num?)?.toDouble() ?? 0.0,
      lng: (json['lng'] as num?)?.toDouble() ?? 0.0,
      workHours: json['workHours'] as String? ?? '09:00 - 18:00',
      isBusy: json['isBusy'] as bool? ?? false,
      distanceKm: (json['distanceKm'] as num?)?.toDouble(),
      rating: (json['rating'] as num?)?.toDouble(),
      ratingCount: json['ratingCount'] as int?,
      bio: json['bio'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'phone': phone,
        'role': role,
        'specialty': specialty,
        'organization': organization,
        'address': address,
        'lat': lat,
        'lng': lng,
        'workHours': workHours,
        'isBusy': isBusy,
        'distanceKm': distanceKm,
        'rating': rating,
        'ratingCount': ratingCount,
        'bio': bio,
      };
}
