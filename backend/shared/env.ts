import * as dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

function optionalNumber(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }
  return parsed;
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),

  databaseUrl: required('DATABASE_URL'),
  redisUrl: optional('REDIS_URL', 'redis://localhost:6379'),
  kafkaBrokers: optional('KAFKA_BROKERS', 'localhost:9092')
    .split(',')
    .map((broker) => broker.trim()),

  apiGatewayPort: optionalNumber('API_GATEWAY_PORT', 3000),
  trendServicePort: optionalNumber('TREND_SERVICE_PORT', 3001),
  scriptServicePort: optionalNumber('SCRIPT_SERVICE_PORT', 3002),
  renderServicePort: optionalNumber('RENDER_SERVICE_PORT', 3003),
  moderationServicePort: optionalNumber('MODERATION_SERVICE_PORT', 3004),
  recommendationServicePort: optionalNumber('RECOMMENDATION_SERVICE_PORT', 3005),

  cdnBaseUrl: optional('CDN_BASE_URL', 'https://cdn.yohpal.com'),
  objectStorageBucket: optional('OBJECT_STORAGE_BUCKET', 'yohpal-live-videos'),

  aiGatewayUrl: optional('AI_GATEWAY_URL', 'http://localhost:8080'),
  ttsProvider: optional('TTS_PROVIDER', 'mock'),
  avatarProvider: optional('AVATAR_PROVIDER', 'mock'),
  videoRenderProvider: optional('VIDEO_RENDER_PROVIDER', 'mock'),

  moderationThreshold: optionalNumber('MODERATION_THRESHOLD', 0.78),
  viralPublishThreshold: optionalNumber('VIRAL_PUBLISH_THRESHOLD', 0.75),
};
