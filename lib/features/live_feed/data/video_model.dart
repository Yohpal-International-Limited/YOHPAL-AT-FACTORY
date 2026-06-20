class VideoModel {
  final String id;
  final String title;
  final String category;
  final String? videoUrl;
  final String? thumbnailUrl;
  final int? durationSeconds;
  final String? region;
  final String? country;
  final String language;
  final double rankScore;

  VideoModel({required this.id, required this.title, required this.category, this.videoUrl, this.thumbnailUrl, this.durationSeconds, this.region, this.country, required this.language, required this.rankScore});

  factory VideoModel.fromJson(Map<String, dynamic> json) {
    return VideoModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      category: json['category'] ?? 'seed_content',
      videoUrl: json['videoUrl'],
      thumbnailUrl: json['thumbnailUrl'],
      durationSeconds: json['durationSeconds'],
      region: json['region'],
      country: json['country'],
      language: json['language'] ?? 'en',
      rankScore: (json['rankScore'] ?? 0).toDouble(),
    );
  }
}
