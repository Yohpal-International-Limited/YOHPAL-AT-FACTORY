export const KafkaTopics = {
  TREND_DISCOVERED: 'trend.discovered',
  SCRIPT_CREATED: 'script.created',
  VIDEO_RENDER_REQUESTED: 'video.render.requested',
  VIDEO_RENDERED: 'video.rendered',
  VIDEO_SCORED: 'video.scored',
  VIDEO_MODERATED: 'video.moderated',
  VIDEO_PUBLISHED: 'video.published',
  FEED_EVENT_CREATED: 'feed.event.created',
} as const;

export type KafkaTopic = typeof KafkaTopics[keyof typeof KafkaTopics];

export type TrendDiscoveredEvent = {
  trendId: string;
  topic: string;
  category: string;
  score: number;
  growthRate: number;
  region?: string | null;
  country?: string | null;
};

export type ScriptCreatedEvent = {
  scriptId: string;
  trendId?: string | null;
  title: string;
  qualityScore: number;
  factScore: number;
};

export type VideoRenderRequestedEvent = {
  videoId: string;
  scriptId: string;
  avatarId?: string | null;
};

export type VideoRenderedEvent = {
  videoId: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
  durationSeconds: number;
};

export type VideoScoredEvent = {
  videoId: string;
  viralProbability: number;
  engagementScore: number;
  watchTimeScore: number;
  shareScore: number;
  commentScore: number;
  qualityScore: number;
};

export type VideoModeratedEvent = {
  videoId: string;
  action: 'ALLOW' | 'LIMIT' | 'REVIEW' | 'BLOCK';
  score: number;
  reason?: string;
};

export type VideoPublishedEvent = {
  videoId: string;
  publishedAt: string;
  region?: string | null;
  country?: string | null;
  language: string;
};

export type FeedEventCreatedEvent = {
  userId: string;
  videoId: string;
  action: string;
  watchMs?: number | null;
  region?: string | null;
};
