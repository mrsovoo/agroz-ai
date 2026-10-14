import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

class LocationResult {
  final double latitude;
  final double longitude;
  final String region;
  final String district;

  const LocationResult({
    required this.latitude,
    required this.longitude,
    required this.region,
    required this.district,
  });
}

class LocationService {
  /// Known administrative centers and major districts in Uzbekistan
  static final List<Map<String, dynamic>> _uzbekistanCenters = [
    {'region': 'Farg‘ona', 'district': 'Farg‘ona shahar', 'lat': 40.3864, 'lng': 71.7864},
    {'region': 'Farg‘ona', 'district': 'Marg‘ilon shahar', 'lat': 40.4719, 'lng': 71.7144},
    {'region': 'Farg‘ona', 'district': 'Qo‘qon shahar', 'lat': 40.5286, 'lng': 70.9426},
    {'region': 'Farg‘ona', 'district': 'Quva tumani', 'lat': 40.5222, 'lng': 72.0078},
    {'region': 'Farg‘ona', 'district': 'Rishton tumani', 'lat': 40.3564, 'lng': 71.2825},
    {'region': 'Farg‘ona', 'district': 'Oltiariq tumani', 'lat': 40.3800, 'lng': 71.4900},
    {'region': 'Andijon', 'district': 'Andijon shahar', 'lat': 40.7821, 'lng': 72.3442},
    {'region': 'Andijon', 'district': 'Asaka tumani', 'lat': 40.6417, 'lng': 72.2389},
    {'region': 'Andijon', 'district': 'Shahrixon tumani', 'lat': 40.7111, 'lng': 72.0556},
    {'region': 'Namangan', 'district': 'Namangan shahar', 'lat': 40.9983, 'lng': 71.6726},
    {'region': 'Namangan', 'district': 'Chust tumani', 'lat': 41.0069, 'lng': 71.2333},
    {'region': 'Namangan', 'district': 'Kosonsoy tumani', 'lat': 41.2561, 'lng': 71.5500},
    {'region': 'Toshkent', 'district': 'Toshkent shahar', 'lat': 41.2995, 'lng': 69.2401},
    {'region': 'Toshkent', 'district': 'Chirchiq shahar', 'lat': 41.4689, 'lng': 69.5822},
    {'region': 'Toshkent', 'district': 'Yangiyo‘l tumani', 'lat': 41.1167, 'lng': 69.0500},
    {'region': 'Toshkent', 'district': 'Bo‘stonliq tumani', 'lat': 41.6000, 'lng': 70.0000},
    {'region': 'Samarqand', 'district': 'Samarqand shahar', 'lat': 39.6542, 'lng': 66.9597},
    {'region': 'Samarqand', 'district': 'Urgut tumani', 'lat': 39.4056, 'lng': 67.2417},
    {'region': 'Samarqand', 'district': 'Kattaqo‘rg‘on shahar', 'lat': 39.8958, 'lng': 66.2575},
    {'region': 'Buxoro', 'district': 'Buxoro shahar', 'lat': 39.7747, 'lng': 64.4286},
    {'region': 'Buxoro', 'district': 'G‘ijduvon tumani', 'lat': 40.1000, 'lng': 64.6667},
    {'region': 'Qashqadaryo', 'district': 'Qarshi shahar', 'lat': 38.8606, 'lng': 65.7891},
    {'region': 'Qashqadaryo', 'district': 'Shahrisabz shahar', 'lat': 39.0500, 'lng': 66.8333},
    {'region': 'Surxondaryo', 'district': 'Termiz shahar', 'lat': 37.2242, 'lng': 67.2783},
    {'region': 'Surxondaryo', 'district': 'Denov tumani', 'lat': 38.2700, 'lng': 67.9000},
    {'region': 'Jizzax', 'district': 'Jizzax shahar', 'lat': 40.1250, 'lng': 67.8800},
    {'region': 'Jizzax', 'district': 'Zomin tumani', 'lat': 39.9600, 'lng': 68.4000},
    {'region': 'Sirdaryo', 'district': 'Guliston shahar', 'lat': 40.4897, 'lng': 68.7842},
    {'region': 'Navoiy', 'district': 'Navoiy shahar', 'lat': 40.0844, 'lng': 65.3792},
    {'region': 'Navoiy', 'district': 'Zarafshon shahar', 'lat': 41.5739, 'lng': 64.2044},
    {'region': 'Xorazm', 'district': 'Urganch shahar', 'lat': 41.5500, 'lng': 60.6333},
    {'region': 'Xorazm', 'district': 'Xiva shahar', 'lat': 41.3783, 'lng': 60.3639},
    {'region': 'Qoraqalpog‘iston', 'district': 'Nukus shahar', 'lat': 42.4602, 'lng': 59.6166},
  ];

  /// Find nearest region/district based on latitude and longitude
  static Map<String, String> resolveNearestRegion(double lat, double lng) {
    double minDistance = double.infinity;
    Map<String, dynamic> nearest = _uzbekistanCenters.first;

    for (final center in _uzbekistanCenters) {
      final double cLat = (center['lat'] as num).toDouble();
      final double cLng = (center['lng'] as num).toDouble();

      // Haversine / Euclidean approximation for closeness
      final dLat = (lat - cLat) * (pi / 180);
      final dLng = (lng - cLng) * (pi / 180);
      final a = sin(dLat / 2) * sin(dLat / 2) +
          cos(lat * (pi / 180)) *
              cos(cLat * (pi / 180)) *
              sin(dLng / 2) *
              sin(dLng / 2);
      final c = 2 * atan2(sqrt(a), sqrt(1 - a));
      final distance = 6371 * c; // in km

      if (distance < minDistance) {
        minDistance = distance;
        nearest = center;
      }
    }

    return {
      'region': nearest['region'] as String,
      'district': nearest['district'] as String,
    };
  }

  /// Helper returning record of nearest region and district
  static ({String regionName, String districtName}) getNearestDistrict(double lat, double lng) {
    final res = resolveNearestRegion(lat, lng);
    return (regionName: res['region']!, districtName: res['district']!);
  }

  /// Request permission and determine current position automatically.
  /// If location service is enabled and permission is granted, returns the resolved LocationResult.
  static Future<LocationResult?> requestAndGetCurrentLocation() async {
    try {
      // 1. Check if location services are enabled
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        debugPrint('[LocationService] Joylashuv xizmati (GPS) yoqilmagan.');
        return null;
      }

      // 2. Check and request permission
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          debugPrint('[LocationService] Foydalanuvchi joylashuv ruxsatini rad etdi.');
          return null;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        debugPrint('[LocationService] Joylashuv ruxsati butunlay bloklangan.');
        return null;
      }

      // 3. Fetch current location
      final Position position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
          timeLimit: Duration(seconds: 10),
        ),
      );

      final resolved = resolveNearestRegion(position.latitude, position.longitude);

      return LocationResult(
        latitude: position.latitude,
        longitude: position.longitude,
        region: resolved['region']!,
        district: resolved['district']!,
      );
    } catch (e) {
      debugPrint('[LocationService] Xatolik: $e');
      return null;
    }
  }
}
