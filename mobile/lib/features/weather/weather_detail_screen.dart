import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class WeatherDetailScreen extends StatefulWidget {
  const WeatherDetailScreen({super.key});

  @override
  State<WeatherDetailScreen> createState() => _WeatherDetailScreenState();
}

class _WeatherDetailScreenState extends State<WeatherDetailScreen> {
  bool _notificationEnabled = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // Top Bar: < back button on left, "Obhavo" on right
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: const BoxDecoration(
                        color: Color(0xFFF3F4F6),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.chevron_left,
                        color: Color(0xFF374151),
                        size: 24,
                      ),
                    ),
                  ),
                  const Text(
                    'Obhavo',
                    style: TextStyle(
                      fontSize: 19,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF111827),
                    ),
                  ),
                ],
              ),
            ),

            // Content Area
            const Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Column(
                  children: [
                    // 1. TOP GREEN CARD (with 4-day forecast inside)
                    _MainWeatherCard(),
                    SizedBox(height: 18),

                    // 2. 7-DAY EXTENDED FORECAST CARD
                    _WeeklyForecastCard(),
                    SizedBox(height: 80), // spacing for bottom button
                  ],
                ),
              ),
            ),
          ],
        ),
      ),

      // Bottom floating button: "Bildirishnomani yoqish"
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(40, 0, 40, 16),
          child: ElevatedButton(
            onPressed: () {
              setState(() {
                _notificationEnabled = !_notificationEnabled;
              });
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    _notificationEnabled
                        ? 'Ob-havo bildirishnomalari yoqildi! ✅'
                        : 'Bildirishnomalar o\'chirildi',
                  ),
                  duration: const Duration(seconds: 2),
                  backgroundColor: AppColors.primary,
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: _notificationEnabled
                  ? const Color(0xFF007A2A)
                  : const Color(0xFF00A638),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(28),
              ),
              elevation: 4,
            ),
            child: Text(
              _notificationEnabled
                  ? 'Bildirishnomalar yoqilgan ✓'
                  : 'Bildirishnomani yoqish',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────
// TOP GREEN CARD WITH 4-DAY FORECAST
// ─────────────────────────────────────────────────────────────
class _MainWeatherCard extends StatelessWidget {
  const _MainWeatherCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF00A83B),
            Color(0xFF008D2E),
          ],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF00A638).withValues(alpha: 0.25),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Upper Section: Bugun Toshkent, 22°C + Sun
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.wb_sunny_outlined,
                        size: 15,
                        color: Colors.white,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Bugun · Toshkent',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: Colors.white.withValues(alpha: 0.95),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    '22 °C',
                    style: TextStyle(
                      fontSize: 48,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      height: 1.1,
                      letterSpacing: -1,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Row(
                    children: [
                      Icon(Icons.wb_sunny_rounded,
                          size: 13, color: Colors.white),
                      SizedBox(width: 3),
                      Text(
                        'Kunduzi: +28°C',
                        style: TextStyle(fontSize: 12, color: Colors.white),
                      ),
                      Text(
                        '  ·  ',
                        style: TextStyle(fontSize: 12, color: Colors.white70),
                      ),
                      Icon(Icons.nightlight_round,
                          size: 12, color: Colors.white),
                      SizedBox(width: 3),
                      Text(
                        'Kechasi: +18°C',
                        style: TextStyle(fontSize: 12, color: Colors.white),
                      ),
                    ],
                  ),
                ],
              ),

              // Glowing Sun
              Container(
                margin: const EdgeInsets.only(top: 4, right: 6),
                width: 68,
                height: 68,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.amber.withValues(alpha: 0.25),
                      ),
                    ),
                    Container(
                      width: 48,
                      height: 48,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            Color(0xFFFFEE55),
                            Color(0xFFF59E0B),
                          ],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Color(0xFFFFD54F),
                            blurRadius: 16,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Inner White Card: 4-Day Forecast
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 8,
                ),
              ],
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _DayForecastColumn(
                  day: 'Today(Sun)',
                  date: 'Mar 6',
                  icon: _WeatherIcon.sun,
                  condition: 'Sunny',
                  tempRange: '15–20°C',
                  aqi: 'AQI 67',
                ),
                _DayForecastColumn(
                  day: 'Mon',
                  date: 'Mar 7',
                  icon: _WeatherIcon.cloudSun,
                  condition: 'Cloudy',
                  tempRange: '16–22°C',
                  aqi: 'AQI 71',
                ),
                _DayForecastColumn(
                  day: 'Tue',
                  date: 'Mar 8',
                  icon: _WeatherIcon.lightning,
                  condition: 'Lightning',
                  tempRange: '17–20°C',
                  aqi: 'AQI 65',
                ),
                _DayForecastColumn(
                  day: 'Wed',
                  date: 'Mar 9',
                  icon: _WeatherIcon.heavyRain,
                  condition: 'Heavy rain',
                  tempRange: '16–21°C',
                  aqi: 'AQI 70',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

enum _WeatherIcon { sun, cloudSun, lightning, heavyRain, rain, cloud, rainbow }

class _DayForecastColumn extends StatelessWidget {
  final String day;
  final String date;
  final _WeatherIcon icon;
  final String condition;
  final String tempRange;
  final String aqi;

  const _DayForecastColumn({
    required this.day,
    required this.date,
    required this.icon,
    required this.condition,
    required this.tempRange,
    required this.aqi,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          day,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: Color(0xFF111827),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          date,
          style: const TextStyle(
            fontSize: 10,
            color: Color(0xFF9CA3AF),
          ),
        ),
        const SizedBox(height: 8),
        _renderWeatherIcon(icon, 30),
        const SizedBox(height: 8),
        Text(
          condition,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: Color(0xFF374151),
          ),
        ),
        const SizedBox(height: 3),
        Text(
          tempRange,
          style: const TextStyle(
            fontSize: 10,
            color: Color(0xFF6B7280),
          ),
        ),
        const SizedBox(height: 3),
        Text(
          aqi,
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: Color(0xFF4B5563),
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────
// 7-DAY EXTENDED FORECAST CARD
// ─────────────────────────────────────────────────────────────
class _WeeklyForecastCard extends StatelessWidget {
  const _WeeklyForecastCard();

  @override
  Widget build(BuildContext context) {
    final list = [
      (day: 'Today', icon: _WeatherIcon.cloudSun, max: '24°', min: '13°'),
      (day: 'Mon', icon: _WeatherIcon.rain, max: '22°', min: '17°'),
      (day: 'Tue', icon: _WeatherIcon.sun, max: '21°', min: '15°'),
      (day: 'Wed', icon: _WeatherIcon.cloud, max: '20°', min: '16°'),
      (day: 'Tur', icon: _WeatherIcon.lightning, max: '22°', min: '15°'),
      (day: 'Fri', icon: _WeatherIcon.sun, max: '25°', min: '18°'),
      (day: 'Sat', icon: _WeatherIcon.rainbow, max: '24°', min: '17°'),
    ];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        children: list.map((item) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Row(
              children: [
                // Day name
                SizedBox(
                  width: 70,
                  child: Text(
                    item.day,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF111827),
                    ),
                  ),
                ),

                // Weather Icon centered
                Expanded(
                  child: Center(
                    child: _renderWeatherIcon(item.icon, 28),
                  ),
                ),

                // Temperatures (max & min)
                Row(
                  children: [
                    Text(
                      item.max,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Text(
                      item.min,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF9CA3AF),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────
// WEATHER ICONS RENDERER
// ─────────────────────────────────────────────────────────────
Widget _renderWeatherIcon(_WeatherIcon type, double size) {
  switch (type) {
    case _WeatherIcon.sun:
      return Container(
        width: size,
        height: size,
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [Color(0xFFFFEE55), Color(0xFFF59E0B)],
          ),
          boxShadow: [
            BoxShadow(
              color: Color(0xFFFFD54F),
              blurRadius: 8,
              spreadRadius: 1,
            ),
          ],
        ),
      );
    case _WeatherIcon.cloudSun:
      return SizedBox(
        width: size + 6,
        height: size,
        child: Stack(
          alignment: Alignment.center,
          children: [
            Positioned(
              right: 2,
              top: 0,
              child: Container(
                width: size * 0.65,
                height: size * 0.65,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0xFFF59E0B),
                ),
              ),
            ),
            Positioned(
              left: 0,
              bottom: 0,
              child: Icon(
                Icons.cloud,
                size: size * 0.85,
                color: const Color(0xFFBAE6FD),
              ),
            ),
          ],
        ),
      );
    case _WeatherIcon.lightning:
      return SizedBox(
        width: size,
        height: size,
        child: Stack(
          alignment: Alignment.center,
          children: [
            Icon(Icons.cloud, size: size * 0.9, color: const Color(0xFFBAE6FD)),
            Positioned(
              bottom: -2,
              child: Icon(
                Icons.bolt,
                size: size * 0.65,
                color: const Color(0xFFF59E0B),
              ),
            ),
          ],
        ),
      );
    case _WeatherIcon.heavyRain:
      return SizedBox(
        width: size,
        height: size,
        child: Stack(
          alignment: Alignment.center,
          children: [
            Icon(Icons.cloud, size: size * 0.9, color: const Color(0xFF93C5FD)),
            Positioned(
              bottom: -4,
              child: Icon(
                Icons.grain,
                size: size * 0.65,
                color: const Color(0xFF3B82F6),
              ),
            ),
          ],
        ),
      );
    case _WeatherIcon.rain:
      return SizedBox(
        width: size,
        height: size,
        child: Stack(
          alignment: Alignment.center,
          children: [
            Icon(Icons.cloud, size: size * 0.9, color: const Color(0xFFBAE6FD)),
            Positioned(
              bottom: -3,
              child: Icon(
                Icons.water_drop,
                size: size * 0.45,
                color: const Color(0xFF38BDF8),
              ),
            ),
          ],
        ),
      );
    case _WeatherIcon.cloud:
      return Icon(
        Icons.cloud,
        size: size,
        color: const Color(0xFFCBD5E1),
      );
    case _WeatherIcon.rainbow:
      return Container(
        width: size,
        height: size,
        alignment: Alignment.center,
        child: const Text('🌈', style: TextStyle(fontSize: 22)),
      );
  }
}
