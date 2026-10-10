class UserModel {
  final int id;
  final String? phone;
  final String? secondPhone;
  final int? telegramId;
  final String? name;
  final String? region;
  final String? district;
  final bool isWeatherPushEnabled;

  const UserModel({
    required this.id,
    this.phone,
    this.secondPhone,
    this.telegramId,
    this.name,
    this.region,
    this.district,
    this.isWeatherPushEnabled = true,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as int? ?? 0,
      phone: json['phone'] as String?,
      secondPhone: json['secondPhone'] as String?,
      telegramId: json['telegramId'] as int?,
      name: json['name'] as String?,
      region: json['region'] as String?,
      district: json['district'] as String?,
      isWeatherPushEnabled: json['isWeatherPushEnabled'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'phone': phone,
        'secondPhone': secondPhone,
        'telegramId': telegramId,
        'name': name,
        'region': region,
        'district': district,
        'isWeatherPushEnabled': isWeatherPushEnabled,
      };
}

class AuthSession {
  final String sessionId;
  final UserModel user;

  const AuthSession({
    required this.sessionId,
    required this.user,
  });

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    return AuthSession(
      sessionId: json['sessionId'] as String? ?? '',
      user: UserModel.fromJson(json['user'] as Map<String, dynamic>? ?? {}),
    );
  }

  Map<String, dynamic> toJson() => {
        'sessionId': sessionId,
        'user': user.toJson(),
      };
}
