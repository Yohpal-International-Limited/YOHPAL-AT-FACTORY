import { z } from 'zod';

const nonEmpty = z.string().trim().min(1);
const id = z.string().uuid();

export const CreateTrendRequestSchema = z.object({
  topic: nonEmpty.max(200),
  category: nonEmpty.max(80),
  score: z.number().min(0).max(100),
  growthRate: z.number().min(-100).max(10_000),
  source: nonEmpty.max(120),
  region: nonEmpty.max(120).optional(),
  country: nonEmpty.max(120).optional(),
  metadata: z.record(z.unknown()).optional(),
}).strict();

export type CreateTrendRequest = z.infer<typeof CreateTrendRequestSchema>;

export const GenerateScriptRequestSchema = z.object({ trendId: id }).strict();
export type GenerateScriptRequest = z.infer<typeof GenerateScriptRequestSchema>;

export const CreateVideoJobRequestSchema = z.object({
  scriptId: id,
  avatarId: id.optional(),
  creatorId: id.optional(),
}).strict();
export type CreateVideoJobRequest = z.infer<typeof CreateVideoJobRequestSchema>;

export const RenderVideoRequestSchema = z.object({ videoId: id }).strict();
export type RenderVideoRequest = z.infer<typeof RenderVideoRequestSchema>;

export const ProviderWebhookRequestSchema = z.object({
  jobId: nonEmpty.max(200),
  status: z.enum(['succeeded', 'failed']),
  result: z.unknown().optional(),
  error: nonEmpty.max(2_000).optional(),
}).strict();
export type ProviderWebhookRequest = z.infer<typeof ProviderWebhookRequestSchema>;

export const ModerateVideoRequestSchema = RenderVideoRequestSchema;
export type ModerateVideoRequest = z.infer<typeof ModerateVideoRequestSchema>;

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

export const CreateFeedEventRequestSchema = z.object({
  userId: nonEmpty.max(128),
  videoId: id,
  action: z.enum(['view', 'like', 'share', 'comment', 'save', 'skip', 'complete']),
  watchMs: z.number().int().min(0).max(86_400_000).optional(),
  region: nonEmpty.max(120).optional(),
  metadata: z.record(z.unknown()).optional(),
}).strict();
export type CreateFeedEventRequest = z.infer<typeof CreateFeedEventRequestSchema>;
