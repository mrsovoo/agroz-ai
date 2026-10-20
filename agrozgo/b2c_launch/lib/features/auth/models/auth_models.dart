class UserModel {
  final int id;
  final String? phone;
  final String? secondPhone;
  final int? telegramId;
  final String? telegramUsername;
  final String? name;
  final String? region;
  final String? district;
  final bool isWeatherPushEnabled;
  final bool isPhoneVerified;
  final bool isLocationGranted;

  const UserModel({
    required this.id,
    this.phone,
    this.secondPhone,
    this.telegramId,
    this.telegramUsername,
    this.name,
    this.region,
    this.district,
    this.isWeatherPushEnabled = true,
    this.isPhoneVerified = true,
    this.isLocationGranted = false,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as int? ?? 0,
      phone: json['phone'] as String?,
      secondPhone: json['secondPhone'] as String?,
      telegramId: json['telegramId'] as int?,
      telegramUsername: json['telegramUsername'] as String?,
      name: json['name'] as String?,
      region: json['region'] as String?,
      district: json['district'] as String?,
      isWeatherPushEnabled: json['isWeatherPushEnabled'] as bool? ?? true,
      isPhoneVerified: json['isPhoneVerified'] as bool? ?? true,
      isLocationGranted: json['isLocationGranted'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'phone': phone,
        'secondPhone': secondPhone,
        'telegramId': telegramId,
        'telegramUsername': telegramUsername,
        'name': name,
        'region': region,
        'district': district,
        'isWeatherPushEnabled': isWeatherPushEnabled,
        'isPhoneVerified': isPhoneVerified,
        'isLocationGranted': isLocationGranted,
      };

  UserModel copyWith({
    int? id,
    String? phone,
    String? secondPhone,
    int? telegramId,
    String? telegramUsername,
    String? name,
    String? region,
    String? district,
    bool? isWeatherPushEnabled,
    bool? isPhoneVerified,
    bool? isLocationGranted,
  }) {
    return UserModel(
      id: id ?? this.id,
      phone: phone ?? this.phone,
      secondPhone: secondPhone ?? this.secondPhone,
      telegramId: telegramId ?? this.telegramId,
      telegramUsername: telegramUsername ?? this.telegramUsername,
      name: name ?? this.name,
      region: region ?? this.region,
      district: district ?? this.district,
      isWeatherPushEnabled: isWeatherPushEnabled ?? this.isWeatherPushEnabled,
      isPhoneVerified: isPhoneVerified ?? this.isPhoneVerified,
      isLocationGranted: isLocationGranted ?? this.isLocationGranted,
    );
  }
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

