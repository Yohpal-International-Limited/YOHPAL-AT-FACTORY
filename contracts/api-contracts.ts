export type CreateTrendRequest = {
  topic: string;
  category: string;
  score: number;
  growthRate: number;
  source: string;
  region?: string;
  country?: string;
  metadata?: Record<string, unknown>;
};

export type GenerateScriptRequest = {
  trendId: string;
};

export type CreateVideoJobRequest = {
  scriptId: string;
  avatarId?: string;
  creatorId?: string;
};

export type RenderVideoRequest = {
  videoId: string;
};

export type ModerateVideoRequest = {
  videoId: string;
};

export type PublishVideoRequest = {
  videoId: string;
};

export type SeedFeedRequest = {
  userId: string;
  region?: string;
  country?: string;
  language?: string;
  take?: number;
};

export type CreateFeedEventRequest = {
  userId: string;
  videoId: string;
  action: 'view' | 'like' | 'share' | 'comment' | 'save' | 'skip' | 'complete';
  watchMs?: number;
  region?: string;
  metadata?: Record<string, unknown>;
};
