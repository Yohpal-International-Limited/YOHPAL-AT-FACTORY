import 'package:flutter/material.dart';
import '../data/feed_repository.dart';
import '../data/video_model.dart';
import 'video_card.dart';

class LiveFeedScreen extends StatefulWidget {
  const LiveFeedScreen({super.key});
  @override
  State<LiveFeedScreen> createState() => _LiveFeedScreenState();
}

class _LiveFeedScreenState extends State<LiveFeedScreen> {
  final FeedRepository repository = FeedRepository();
  late Future<List<VideoModel>> feedFuture;
  final PageController _pageController = PageController();
  int _currentPage = 0;
  static const String demoUserId = 'demo-user';

  @override
  void initState() {
    super.initState();
    feedFuture = repository.getSeedFeed(userId: demoUserId);
    _pageController.addListener(() {
      final page = _pageController.page?.round() ?? 0;
      if (page != _currentPage) {
        setState(() => _currentPage = page);
      }
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> refreshFeed() async {
    setState(() {
      feedFuture = repository.getSeedFeed(userId: demoUserId);
    });
  }

  Future<void> _handleLike(VideoModel video) async {
    await repository.recordEvent(
      userId: demoUserId,
      videoId: video.id,
      action: 'like',
    );
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Liked: ${video.title}')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: FutureBuilder<List<VideoModel>>(
        future: feedFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return _buildLoading();
          }
          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      'Error loading feed',
                      style: TextStyle(color: Colors.white, fontSize: 20),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      '${snapshot.error}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.red, fontSize: 16),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: refreshFeed,
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            );
          }
          final videos = snapshot.data ?? [];
          if (videos.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'No seed videos yet.',
                    style: TextStyle(color: Colors.white, fontSize: 22),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Run the seed pipeline first.',
                    style: TextStyle(color: Colors.white60, fontSize: 16),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: refreshFeed,
                    child: const Text('Refresh'),
                  ),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: refreshFeed,
            child: PageView.builder(
              controller: _pageController,
              scrollDirection: Axis.vertical,
              itemCount: videos.length,
              itemBuilder: (context, index) {
                final video = videos[index];
                return VideoCard(
                  video: video,
                  isActive: index == _currentPage,
                  onLike: () => _handleLike(video),
                  onComment: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Comment feature coming soon!')),
                    );
                  },
                  onShare: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Share feature coming soon!')),
                    );
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildLoading() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(color: Colors.orange),
          SizedBox(height: 24),
          Text(
            'Loading your feed...',
            style: TextStyle(color: Colors.white70, fontSize: 18),
          ),
        ],
      ),
    );
  }
}
