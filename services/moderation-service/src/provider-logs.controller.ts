import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../../../libs/database/prisma.service';
import { ok } from '../../../libs/common/http-response';
import { OptionalTakePipe } from '../../../libs/common/query-validation.pipe';

@Controller()
export class ProviderLogsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('provider-jobs')
  async listProviderJobs(
    @Query('jobType') jobType?: string,
    @Query('status') status?: string,
    @Query('providerName') providerName?: string,
    @Query('take', OptionalTakePipe) take?: number,
  ) {
    const where: Record<string, unknown> = {};
    if (jobType) where.jobType = jobType;
    if (status) where.status = status;
    if (providerName) where.providerName = providerName;
    const result = await this.prisma.providerJobLog.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: take ?? 50,
      include: { video: { select: { id: true, title: true, category: true, status: true } } },
    });
    return ok(result, { count: result.length });
  }

  @Get('provider-jobs/summary')
  async providerJobsSummary() {
    const [total, success, failed, fallback, running] = await Promise.all([
      this.prisma.providerJobLog.count(),
      this.prisma.providerJobLog.count({ where: { status: 'SUCCESS' } }),
      this.prisma.providerJobLog.count({ where: { status: 'FAILED' } }),
      this.prisma.providerJobLog.count({ where: { fallbackUsed: true } }),
      this.prisma.providerJobLog.count({ where: { status: 'RUNNING' } }),
    ]);
    return ok({ total, success, failed, fallback, running });
  }

  @Get('script-provider-logs')
  async listScriptProviderLogs(
    @Query('providerName') providerName?: string,
    @Query('status') status?: string,
    @Query('take', OptionalTakePipe) take?: number,
  ) {
    const where: Record<string, unknown> = {};
    if (providerName) where.providerName = providerName;
    if (status) where.status = status;
    const result = await this.prisma.scriptProviderLog.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: take ?? 50,
      include: {
        script: { select: { id: true, title: true, hook: true, qualityScore: true, factScore: true } },
        trend: { select: { id: true, topic: true, category: true, region: true, country: true } },
      },
    });
    return ok(result, { count: result.length });
  }

  @Get('script-provider-logs/summary')
  async scriptProviderLogsSummary() {
    const [total, success, failed, fallback, running] = await Promise.all([
      this.prisma.scriptProviderLog.count(),
      this.prisma.scriptProviderLog.count({ where: { status: 'SUCCESS' } }),
      this.prisma.scriptProviderLog.count({ where: { status: 'FAILED' } }),
      this.prisma.scriptProviderLog.count({ where: { fallbackUsed: true } }),
      this.prisma.scriptProviderLog.count({ where: { status: 'RUNNING' } }),
    ]);
    return ok({ total, success, failed, fallback, running });
  }
}
