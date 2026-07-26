import axios from 'axios';
import { z } from 'zod';

const itemSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url(),
  publishedAt: z.string().datetime(),
  score: z.number().min(0).max(100),
  growthRate: z.number().min(-100).max(10_000),
});
const responseSchema = z.object({ items: z.array(itemSchema).max(100) });

export type LicensedTrendSource = {
  name: string;
  endpoint: string;
  licenseId: string;
  apiKey?: string;
  category: string;
  region: string;
  country: string;
};

export function parseLicensedTrendSources(raw: string): LicensedTrendSource[] {
  const schema = z.array(z.object({
    name: z.string().min(1),
    endpoint: z.string().url(),
    licenseId: z.string().min(1),
    apiKey: z.string().min(1).optional(),
    category: z.string().min(1),
    region: z.string().min(1),
    country: z.string().min(1),
  })).max(20);
  return schema.parse(JSON.parse(raw));
}

export async function fetchLicensedTrends(source: LicensedTrendSource) {
  if (process.env.NODE_ENV === 'production' && !source.endpoint.startsWith('https://')) {
    throw new Error(`Trend source ${source.name} must use HTTPS`);
  }
  const response = await axios.get(source.endpoint, {
    headers: source.apiKey ? { authorization: `Bearer ${source.apiKey}` } : undefined,
    timeout: 10_000,
    maxContentLength: 1_000_000,
  });
  return responseSchema.parse(response.data).items.map((item) => ({
    topic: item.title,
    category: source.category,
    score: item.score,
    growthRate: item.growthRate,
    source: source.name,
    region: source.region,
    country: source.country,
    metadata: {
      licenseId: source.licenseId,
      evidence: [{ title: item.title, url: item.url, retrievedAt: new Date().toISOString() }],
      sourcePublishedAt: item.publishedAt,
    },
  }));
}
