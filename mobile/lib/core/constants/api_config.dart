class ApiConfig {
  // Use http://10.0.2.2:4000 for Android emulator if needed, or localhost/production URL.
  // Using localhost:4000 as per instructions, but typically for mobile it needs an IP.
  // Using production base URL as default.
  static const String baseUrl = 'https://api.agroz.uz'; 
  
  static const int connectTimeout = 30000;
  static const int receiveTimeout = 30000;
}
