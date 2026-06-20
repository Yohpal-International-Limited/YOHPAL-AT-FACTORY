import '../../../core/api_client.dart';
import '../../../core/env.dart';
import 'video_model.dart';

class FeedRepository {
  final ApiClient client;
  FeedRepository({ApiClient? client}) : client = client ?? ApiClient(Env.apiBaseUrl);

  Future<List<VideoModel>> getSeedFeed({
    required String userId,
    String region = 'Nairobi',
    String country = 'Kenya',
    int take = 20,
  }) async {
    final response = await client.get(
      '/feed/seed?userId=$userId&region=$region&country=$country&take=$take',
    );
    final List items = response['data'] ?? [];
    return items.map((item) => VideoModel.fromJson(item)).toList();
  }

  Future<void> recordEvent({
    required String userId,
    required String videoId,
    required String action,
    int? watchMs,
    String region = 'Nairobi',
  }) async {
    await client.post('/feed/events', {
      'userId': userId,
      'videoId': videoId,
      'action': action,
      'watchMs': watchMs,
      'region': region,
    });
  }
}
