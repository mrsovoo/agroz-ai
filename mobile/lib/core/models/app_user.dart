class AppUser {
  final int id;
  final String? name;
  final String phone;
  final String? token;

  const AppUser({
    required this.id,
    this.name,
    required this.phone,
    this.token,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'] as int,
      name: json['name'] as String?,
      phone: json['phone'] as String? ?? '',
      token: json['token'] as String?,
    );
  }

  String get displayName => name ?? phone;
}
