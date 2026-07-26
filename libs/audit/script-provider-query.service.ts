import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export type ScriptProviderLogQuery = {
  scriptId?: string;
  trendId?: string;
  providerName?: string;
  status?: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'FALLBACK_USED';
  fallbackUsed?: boolean;
  take?: number;
};

@Injectable()
export class ScriptProviderQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async listLogs(query: ScriptProviderLogQuery) {
    return this.prisma.scriptProviderLog.findMany({
      where: {
        scriptId: query.scriptId,
        trendId: query.trendId,
        providerName: query.providerName,
        status: query.status,
        fallbackUsed: query.fallbackUsed,
      },
      include: {
        script: {
          select: {
            id: true,
            title: true,
            hook: true,
            qualityScore: true,
            factScore: true,
            trend: {
              select: {
                id: true,
                topic: true,
                category: true,
                region: true,
                country: true,
              },
            },
          },
        },
        trend: {
          select: {
            id: true,
            topic: true,
            category: true,
            region: true,
            country: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: query.take || 100,
    });
  }

  async getLog(id: string) {
    return this.prisma.scriptProviderLog.findUnique({
      where: { id },
      include: {
        script: {
          include: {
            trend: true,
            videos: true,
          },
        },
        trend: true,
      },
    });
  }

  async getSummary() {
    const [total, success, failed, fallback, running] = await Promise.all([
      this.prisma.scriptProviderLog.count(),
      this.prisma.scriptProviderLog.count({ where: { status: 'SUCCESS' } }),
      this.prisma.scriptProviderLog.count({ where: { status: 'FAILED' } }),
      this.prisma.scriptProviderLog.count({ where: { fallbackUsed: true } }),
      this.prisma.scriptProviderLog.count({ where: { status: 'RUNNING' } }),
    ]);

    return { total, success, failed, fallback, running };
  }
}
