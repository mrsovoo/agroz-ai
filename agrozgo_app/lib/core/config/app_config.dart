enum AppFlavor {
  user,
  business;

  static AppFlavor fromString(String value) {
    switch (value.toLowerCase()) {
      case 'business':
        return AppFlavor.business;
      case 'user':
      default:
        return AppFlavor.user;
    }
  }

  bool get isUser => this == AppFlavor.user;
  bool get isBusiness => this == AppFlavor.business;

  String get appTitle => isUser ? 'AgrozGO' : 'AgrozGO Business';
  String get applicationId => isUser ? 'uz.agrozgo.app' : 'uz.agrozgo.business';
}

class AppConfig {
  AppConfig._();

  static const String _rawFlavor = String.fromEnvironment('FLAVOR', defaultValue: 'user');
  static final AppFlavor flavor = AppFlavor.fromString(_rawFlavor);

  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'https://agroz-ai-backend-production.up.railway.app',
  );

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 15);
  static const Duration sendTimeout = Duration(seconds: 15);
}

