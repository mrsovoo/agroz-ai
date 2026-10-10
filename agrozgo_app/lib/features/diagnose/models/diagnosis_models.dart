class DiagnosisModel {
  final int id;
  final String category; // crop | animal
  final String disease;
  final String solution;
  final List<String> medicines;
  final String severity;
  final int? confidence;
  final String? source;
  final bool hasImage;
  final String? viewToken;
  final DateTime? createdAt;
  final String? disclaimer;

  const DiagnosisModel({
    required this.id,
    required this.category,
    required this.disease,
    required this.solution,
    this.medicines = const [],
    this.severity = 'orta',
    this.confidence,
    this.source = 'ai',
    this.hasImage = false,
    this.viewToken,
    this.createdAt,
    this.disclaimer,
  });

  factory DiagnosisModel.fromJson(Map<String, dynamic> json) {
    var rawMeds = json['medicines'];
    List<String> medList = [];
    if (rawMeds is List) {
      medList = rawMeds.map((e) => e.toString()).toList();
    }

    return DiagnosisModel(
      id: json['id'] as int? ?? 0,
      category: json['category'] as String? ?? 'crop',
      disease: json['disease'] as String? ?? json['diseaseName'] as String? ?? '',
      solution: json['solution'] as String? ?? '',
      medicines: medList,
      severity: json['severity'] as String? ?? 'orta',
      confidence: json['confidence'] as int?,
      source: json['source'] as String? ?? 'ai',
      hasImage: json['hasImage'] as bool? ?? false,
      viewToken: json['viewToken'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      disclaimer: json['disclaimer'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'category': category,
        'disease': disease,
        'solution': solution,
        'medicines': medicines,
        'severity': severity,
        'confidence': confidence,
        'source': source,
        'hasImage': hasImage,
        'viewToken': viewToken,
        'createdAt': createdAt?.toIso8601String(),
        'disclaimer': disclaimer,
      };
}
