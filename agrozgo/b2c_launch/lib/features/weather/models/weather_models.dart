class DailyForecastModel {
  final String date;
  final int tempMax;
  final int tempMin;
  final double rainSum;
  final int rainProbMax;
  final double windMax;
  final int code;

  const DailyForecastModel({
    required this.date,
    required this.tempMax,
    required this.tempMin,
    required this.rainSum,
    required this.rainProbMax,
    required this.windMax,
    required this.code,
  });

  factory DailyForecastModel.fromJson(Map<String, dynamic> json) {
    return DailyForecastModel(
      date: json['date'] as String? ?? '',
      tempMax: json['tempMax'] as int? ?? 0,
      tempMin: json['tempMin'] as int? ?? 0,
      rainSum: (json['rainSum'] as num?)?.toDouble() ?? 0.0,
      rainProbMax: json['rainProbMax'] as int? ?? 0,
      windMax: (json['windMax'] as num?)?.toDouble() ?? 0.0,
      code: json['code'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'date': date,
        'tempMax': tempMax,
        'tempMin': tempMin,
        'rainSum': rainSum,
        'rainProbMax': rainProbMax,
        'windMax': windMax,
        'code': code,
      };
}

class WeatherModel {
  final int temp;
  final int tempDay;
  final int tempNight;
  final bool isDay;
  final String? sunrise;
  final String? sunset;
  final double wind;
  final int humidity;
  final double rain;
  final double? soilTemp;
  final String? sprayStatus;
  final String? sprayLabel;
  final String? sprayReason;
  final bool frostRisk;
  final String? agroAdvice;
  final String? advice;
  final String? adviceNight;
  final String? level;
  final List<DailyForecastModel> daily;

  const WeatherModel({
    required this.temp,
    required this.tempDay,
    required this.tempNight,
    this.isDay = true,
    this.sunrise,
    this.sunset,
    required this.wind,
    required this.humidity,
    required this.rain,
    this.soilTemp,
    this.sprayStatus,
    this.sprayLabel,
    this.sprayReason,
    this.frostRisk = false,
    this.agroAdvice,
    this.advice,
    this.adviceNight,
    this.level,
    this.daily = const [],
  });

  factory WeatherModel.fromJson(Map<String, dynamic> json) {
    var rawDaily = json['daily'];
    List<DailyForecastModel> dailyList = [];
    if (rawDaily is List) {
      dailyList = rawDaily
          .map((e) => DailyForecastModel.fromJson(e as Map<String, dynamic>))
          .toList();
    }

    return WeatherModel(
      temp: json['temp'] as int? ?? 0,
      tempDay: json['tempDay'] as int? ?? 0,
      tempNight: json['tempNight'] as int? ?? 0,
      isDay: json['isDay'] as bool? ?? true,
      sunrise: json['sunrise'] as String?,
      sunset: json['sunset'] as String?,
      wind: (json['wind'] as num?)?.toDouble() ?? 0.0,
      humidity: json['humidity'] as int? ?? 0,
      rain: (json['rain'] as num?)?.toDouble() ?? 0.0,
      soilTemp: (json['soilTemp'] as num?)?.toDouble(),
      sprayStatus: json['sprayStatus'] as String?,
      sprayLabel: json['sprayLabel'] as String?,
      sprayReason: json['sprayReason'] as String?,
      frostRisk: json['frostRisk'] as bool? ?? false,
      agroAdvice: json['agroAdvice'] as String?,
      advice: json['advice'] as String?,
      adviceNight: json['adviceNight'] as String?,
      level: json['level'] as String?,
      daily: dailyList,
    );
  }

  Map<String, dynamic> toJson() => {
        'temp': temp,
        'tempDay': tempDay,
        'tempNight': tempNight,
        'isDay': isDay,
        'sunrise': sunrise,
        'sunset': sunset,
        'wind': wind,
        'humidity': humidity,
        'rain': rain,
        'soilTemp': soilTemp,
        'sprayStatus': sprayStatus,
        'sprayLabel': sprayLabel,
        'sprayReason': sprayReason,
        'frostRisk': frostRisk,
        'agroAdvice': agroAdvice,
        'advice': advice,
        'adviceNight': adviceNight,
        'level': level,
        'daily': daily.map((e) => e.toJson()).toList(),
      };
}

