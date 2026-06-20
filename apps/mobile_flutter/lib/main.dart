import 'package:flutter/material.dart';
import 'features/live_feed/presentation/live_feed_screen.dart';

void main() => runApp(const YohPalLiveApp());

class YohPalLiveApp extends StatelessWidget {
  const YohPalLiveApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'YohPal Live',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(),
      home: const LiveFeedScreen(),
    );
  }
}
