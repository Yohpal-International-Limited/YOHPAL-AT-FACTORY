import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../data/video_model.dart';

class VideoCard extends StatefulWidget {
  final VideoModel video;
  final bool isActive;
  final VoidCallback? onLike;
  final VoidCallback? onComment;
  final VoidCallback? onShare;

  const VideoCard({
    super.key,
    required this.video,
    this.isActive = false,
    this.onLike,
    this.onComment,
    this.onShare,
  });

  @override
  State<VideoCard> createState() => _VideoCardState();
}

class _VideoCardState extends State<VideoCard> {
  VideoPlayerController? _controller;
  bool _isInitialized = false;
  bool _isPlaying = false;

  @override
  void initState() {
    super.initState();
    if (widget.isActive) _initVideo();
  }

  @override
  void didUpdateWidget(VideoCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive && !oldWidget.isActive) {
      _initVideo();
    } else if (!widget.isActive && oldWidget.isActive) {
      _disposeVideo();
    }
  }

  void _initVideo() {
    if (_controller != null) return;
    _controller = VideoPlayerController.networkUrl(
      Uri.parse(widget.video.videoUrl ?? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'),
    );
    _controller!.initialize().then((_) {
      if (mounted) {
        setState(() => _isInitialized = true);
        _controller!.play();
        _isPlaying = true;
      }
    });
  }

  void _disposeVideo() {
    _controller?.pause();
    _controller?.dispose();
    _controller = null;
    _isInitialized = false;
    _isPlaying = false;
  }

  @override
  void dispose() {
    _disposeVideo();
    super.dispose();
  }

  void _togglePlay() {
    if (_controller == null || !_isInitialized) return;
    setState(() {
      _isPlaying ? _controller!.pause() : _controller!.play();
      _isPlaying = !_isPlaying;
    });
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _togglePlay,
      child: Container(
        color: Colors.black,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Video Player
            if (_controller != null && _isInitialized)
              Center(
                child: AspectRatio(
                  aspectRatio: _controller!.value.aspectRatio,
                  child: VideoPlayer(_controller!),
                ),
              )
            else
              const Center(
                child: CircularProgressIndicator(color: Colors.white),
              ),

            // Gradient Overlay (for better text visibility)
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withOpacity(0.3),
                    Colors.black.withOpacity(0.7),
                  ],
                  stops: const [0.6, 0.8, 1.0],
                ),
              ),
            ),

            // Play/Pause Icon
            if (!_isPlaying)
              const Center(
                child: Icon(
                  Icons.play_arrow,
                  color: Colors.white,
                  size: 64,
                ),
              ),

            // Title (Top Center)
            Positioned(
              top: 60,
              left: 20,
              right: 20,
              child: Text(
                widget.video.title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),

            // Category Badge (Bottom Left)
            Positioned(
              left: 20,
              bottom: 120,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.8),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  widget.video.category.toUpperCase(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),

            // Region & Rank (Bottom Left)
            Positioned(
              left: 20,
              bottom: 90,
              child: Text(
                '${widget.video.region ?? 'Global'} • Rank ${widget.video.rankScore.toStringAsFixed(3)}',
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 14,
                ),
              ),
            ),

            // Action Buttons (Right Side)
            Positioned(
              right: 16,
              bottom: 140,
              child: Column(
                children: [
                  // Like Button
                  _buildActionButton(
                    icon: Icons.favorite_border,
                    label: 'Like',
                    onTap: widget.onLike,
                  ),
                  const SizedBox(height: 24),

                  // Comment Button
                  _buildActionButton(
                    icon: Icons.comment_outlined,
                    label: 'Comment',
                    onTap: widget.onComment,
                  ),
                  const SizedBox(height: 24),

                  // Share Button
                  _buildActionButton(
                    icon: Icons.share_outlined,
                    label: 'Share',
                    onTap: widget.onShare,
                  ),
                  const SizedBox(height: 24),

                  // Bookmark
                  _buildActionButton(
                    icon: Icons.bookmark_border,
                    label: 'Save',
                    onTap: () {},
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Icon(icon, color: Colors.white, size: 32),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(color: Colors.white, fontSize: 12),
          ),
        ],
      ),
    );
  }
}
