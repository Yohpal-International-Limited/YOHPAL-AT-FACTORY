import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import { publishEvent } from '../../shared/kafka';
import { KafkaTopics } from '../../../contracts/kafka-events';
import { CreateTrendRequest } from '../../../contracts/api-contracts';

@Injectable()
export class TrendService {
  constructor(private readonly prisma: PrismaService) {}

  async createTrend(input: CreateTrendRequest) {
    const trend = await this.prisma.trend.create({
      data: {
        topic: input.topic,
        category: input.category,
        score: input.score,
        growthRate: input.growthRate,
        source: input.source,
        // ✅ FIXED: Provide safe defaults for required fields
        region: input.region ?? 'Global',   // If undefined, use 'Global'
        country: input.country ?? 'Kenya',  // If undefined, use 'Kenya'
        metadata: input.metadata as any,
      },
    });

    await publishEvent(
      KafkaTopics.TREND_DISCOVERED,
      {
        trendId: trend.id,
        topic: trend.topic,
        category: trend.category,
        score: trend.score,
        growthRate: trend.growthRate,
        region: trend.region,
        country: trend.country,
      },
      trend.id
    );

    return trend;
  }

  async discoverSeedTrends() {
    const seedTopics = [
      { topic: 'AI Jobs in Africa', category: 'career', score: 92, growthRate: 15, source: 'internal_seed', region: 'Africa', country: 'Kenya' },
      { topic: 'Why Side Hustles Fail', category: 'business', score: 88, growthRate: 12, source: 'internal_seed', region: 'Africa', country: 'Kenya' },
      { topic: 'Study Hacks for Exams', category: 'campus', score: 85, growthRate: 18, source: 'internal_seed', region: 'Africa', country: 'Kenya' },
      { topic: 'Daily Motivation for Success', category: 'motivation', score: 90, growthRate: 10, source: 'internal_seed', region: 'Africa', country: 'Kenya' },
      { topic: 'Tech Trends in 2025', category: 'technology', score: 87, growthRate: 14, source: 'internal_seed', region: 'Africa', country: 'Kenya' },
    ];

    const created = [];
    for (const seed of seedTopics) {
      const existing = await this.prisma.trend.findFirst({
        where: { topic: seed.topic },
      });
      if (!existing) {
        const trend = await this.createTrend(seed);
        created.push(trend);
      }
    }
    return created;
  }

  async listTrends(params: {
    category?: string;
    region?: string;
    country?: string;
    take?: number;
  }) {
    return this.prisma.trend.findMany({
      where: {
        category: params.category,
        region: params.region,
        country: params.country,
      },
      orderBy: { score: 'desc' },
      take: params.take || 50,
    });
  }

  async getTrend(id: string) {
    return this.prisma.trend.findUnique({
      where: { id },
      include: { scripts: true },
    });
  }
}
