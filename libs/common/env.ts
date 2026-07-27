import * as dotenv from 'dotenv';
import { assertProductionMedia, assertProductionProviders, assertProductionSecurity } from './production-safety';

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
  objectStorageGatewayUrl: optional('OBJECT_STORAGE_GATEWAY_URL', ''),
  objectStorageGatewayToken: optional('OBJECT_STORAGE_GATEWAY_TOKEN', ''),
  malwareScannerUrl: optional('MALWARE_SCANNER_URL', ''),

  aiGatewayUrl: optional('AI_GATEWAY_URL', 'http://localhost:8080'),
  aiProviderApiKey: optional('AI_PROVIDER_API_KEY', ''),
  providerWebhookSecret: optional('PROVIDER_WEBHOOK_SECRET', ''),
  jwtSecret: optional('JWT_SECRET', 'development-jwt-secret'),
  jwtJwksUri: optional('JWT_JWKS_URI', ''),
  jwtIssuer: optional('JWT_ISSUER', 'yohpal-live'),
  jwtAudience: optional('JWT_AUDIENCE', 'yohpal-api'),
  serviceAuthToken: optional('SERVICE_AUTH_TOKEN', 'development-service-token'),
  corsAllowedOrigins: optional('CORS_ALLOWED_ORIGINS', 'http://localhost:3100,http://localhost:5002')
    .split(',').map((origin) => origin.trim()),
  requestBodyLimit: optional('REQUEST_BODY_LIMIT', '256kb'),
  rateLimitWindowMs: optionalNumber('RATE_LIMIT_WINDOW_MS', 60_000),
  rateLimitMax: optionalNumber('RATE_LIMIT_MAX', 120),
  llmProvider: optional('LLM_PROVIDER', 'mock'),
  ttsProvider: optional('TTS_PROVIDER', 'mock'),
  avatarProvider: optional('AVATAR_PROVIDER', 'mock'),
  videoRenderProvider: optional('VIDEO_RENDER_PROVIDER', 'mock'),
  moderationProvider: optional('MODERATION_PROVIDER', 'mock'),
  factCheckProvider: optional('FACT_CHECK_PROVIDER', 'mock'),

  moderationThreshold: optionalNumber('MODERATION_THRESHOLD', 0.78),
  viralPublishThreshold: optionalNumber('VIRAL_PUBLISH_THRESHOLD', 0.75),
};

assertProductionProviders(env);
assertProductionSecurity(env);
assertProductionMedia(env);
