import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../libs/database/prisma.service';
import {
  calculateRankScore,
  freshnessScoreFromDate,
} from '../../../libs/common/rank-score';
import { publishEvent } from '../../../libs/common/kafka';
import { KafkaTopics } from '../../../contracts/kafka-events';
import {
  CreateFeedEventRequest,
  SeedFeedRequest,
} from '../../../contracts/api-contracts';

type RankedVideo = {
  id: string;
  title: string;
  category: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  region: string | null;
  country: string | null;
  language: string;
  publishedAt: Date | null;
  rankScore: number;
  scoreBreakdown: {
    engagementScore: number;
    interestScore: number;
    localityScore: number;
    freshnessScore: number;
    qualityScore: number;
  };
};

@Injectable()
export class RecommendationService {
  constructor(private readonly prisma: PrismaService) {}

  async getSeedFeed(input: SeedFeedRequest): Promise<RankedVideo[]> {
    const take = input.take && input.take > 0 ? Math.min(input.take, 100) : 30;

    const videos = await this.prisma.video.findMany({
      where: {
        tenantId: input.tenantId,
        status: 'PUBLISHED',
        videoUrl: {
          not: null,
        },
        language: input.language || undefined,
        OR: [
          { region: input.region || undefined },
          { country: input.country || undefined },
          { region: null },
        ],
      },
      include: {
        score: true,
        creator: true,
        feedEvents: {
          where: {
            userId: input.userId,
            tenantId: input.tenantId,
          },
          take: 20,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: take * 3,
    });

    return videos
      .map((video) => {
        const interestScore = this.estimateInterestScore({
          userEvents: video.feedEvents.map((event) => event.action),
        });

        const localityScore = this.calculateLocalityScore({
          videoRegion: video.region,
          videoCountry: video.country,
          userRegion: input.region,
          userCountry: input.country,
        });

        const freshnessScore = freshnessScoreFromDate(video.publishedAt);

        const engagementScore =
          video.score?.engagementScore ??
          this.estimateEngagementFromEvents(video.feedEvents.length);

        const qualityScore =
          video.score?.qualityScore ??
          (video.creator?.trustScore ? video.creator.trustScore / 100 : 0.75);

        const rankScore = calculateRankScore({
          engagementScore,
          interestScore,
          localityScore,
          freshnessScore,
          qualityScore,
        });

        return {
          id: video.id,
          title: video.title,
          category: video.category,
          videoUrl: video.videoUrl,
          thumbnailUrl: video.thumbnailUrl,
          durationSeconds: video.durationSeconds,
          region: video.region,
          country: video.country,
          language: video.language,
          publishedAt: video.publishedAt,
          rankScore: Number(rankScore.toFixed(4)),
          scoreBreakdown: {
            engagementScore,
            interestScore,
            localityScore,
            freshnessScore,
            qualityScore,
          },
        };
      })
      .sort((a, b) => b.rankScore - a.rankScore)
      .slice(0, take);
  }

  async createFeedEvent(input: CreateFeedEventRequest & { tenantId: string }) {
    const video = await this.prisma.video.findUnique({
      where: { id: input.videoId },
    });

    if (!video || video.tenantId !== input.tenantId) {
      throw new NotFoundException(`Video not found: ${input.videoId}`);
    }

    const event = await this.prisma.feedEvent.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId,
        videoId: input.videoId,
        action: input.action,
        watchMs: input.watchMs,
        region: input.region,
        metadata: input.metadata as any,
      },
    });

    await publishEvent(
      KafkaTopics.FEED_EVENT_CREATED,
      {
        tenantId: event.tenantId,
        userId: event.userId,
        videoId: event.videoId,
        action: event.action,
        watchMs: event.watchMs,
        region: event.region,
      }
    );

    return event;
  }

  async getVideoById(id: string) {
    const video = await this.prisma.video.findUnique({
      where: { id },
      include: {
        script: true,
        creator: true,
        avatar: true,
        score: true,
        moderationLogs: true,
      },
    });
    if (!video) {
      throw new NotFoundException(`Video not found: ${id}`);
    }
    return video;
  }

  private estimateInterestScore(input: { userEvents: string[] }): number {
    if (input.userEvents.length === 0) {
      return 0.72;
    }

    const positiveActions = ['like', 'share', 'comment', 'save', 'complete'];
    const negativeActions = ['skip'];
    let score = 0.72;

    for (const action of input.userEvents) {
      if (positiveActions.includes(action)) {
        score += 0.04;
      }
      if (negativeActions.includes(action)) {
        score -= 0.06;
      }
    }

    return this.clamp(score);
  }

  private calculateLocalityScore(input: {
    videoRegion: string | null;
    videoCountry: string | null;
    userRegion?: string;
    userCountry?: string;
  }): number {
    if (input.userRegion && input.videoRegion === input.userRegion) {
      return 1.0;
    }
    if (input.userCountry && input.videoCountry === input.userCountry) {
      return 0.85;
    }
    if (!input.videoRegion && !input.videoCountry) {
      return 0.6;
    }
    return 0.5;
  }

  private estimateEngagementFromEvents(eventCount: number): number {
    if (eventCount >= 20) return 0.9;
    if (eventCount >= 10) return 0.82;
    if (eventCount >= 5) return 0.76;
    return 0.7;
  }

  private clamp(value: number): number {
    return Math.max(0, Math.min(1, value));
  }
}
