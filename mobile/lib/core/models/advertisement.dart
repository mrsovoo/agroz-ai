class Advertisement {
  final String id;
  final String title;
  final String? description;
  final String? imageUrl;
  final String? linkUrl;
  final int priority;
  final bool isActive;

  Advertisement({
    required this.id,
    required this.title,
    this.description,
    this.imageUrl,
    this.linkUrl,
    required this.priority,
    required this.isActive,
  });

  factory Advertisement.fromJson(Map<String, dynamic> json) {
    return Advertisement(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString(),
      imageUrl: json['imageUrl']?.toString(),
      linkUrl: json['linkUrl']?.toString(),
      priority: json['priority'] as int? ?? 0,
      isActive: json['isActive'] as bool? ?? true,
    );
  }
}
