import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import { publishEvent } from '../../shared/kafka';
import { KafkaTopics } from '../../../contracts/kafka-events';
import { GenerateScriptRequest } from '../../../contracts/api-contracts';
import { ContentGenerationWorkflow } from '../../../ai/workflows/content-generation.workflow';

@Injectable()
export class ScriptService {
  private readonly workflow = new ContentGenerationWorkflow();

  constructor(private readonly prisma: PrismaService) {}

  async generateFromTrend(input: GenerateScriptRequest) {
    const trend = await this.prisma.trend.findUnique({
      where: { id: input.trendId },
    });

    if (!trend) {
      throw new NotFoundException(`Trend not found: ${input.trendId}`);
    }

    const result = await this.workflow.run({
      topic: trend.topic,
      category: trend.category,
      region: trend.region,
      country: trend.country,
      language: 'en',
    });

    const script = await this.prisma.script.create({
      data: {
        trendId: trend.id,
        title: result.script.title,
        hook: result.script.hook,
        body: result.script.body,
        cta: result.script.cta,
        language: result.script.language,
        durationHint: result.script.durationHint,
        qualityScore: result.script.qualityScore,
        factScore: result.factCheck.factScore,
        metadata: {
          strategy: result.strategy,
          factCheck: result.factCheck,
          viralScore: result.viralScore,
          avatarDirection: result.avatarDirection,
          publishEligible: result.publishEligible,
        } as any,
      },
    });

    await publishEvent(
      KafkaTopics.SCRIPT_CREATED,
      {
        scriptId: script.id,
        trendId: trend.id,
        title: script.title,
        qualityScore: script.qualityScore,
        factScore: script.factScore,
      },
      script.id
    );

    return { script, workflow: result };
  }

  async generateForAllPendingTrends(take = 20) {
    const trends = await this.prisma.trend.findMany({
      where: {
        scripts: {
          none: {},
        },
      },
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
      take,
    });

    const generated = [];
    for (const trend of trends) {
      generated.push(await this.generateFromTrend({ trendId: trend.id }));
    }
    return generated;
  }

  async listScripts(params: {
    trendId?: string;
    language?: string;
    take?: number;
  }) {
    return this.prisma.script.findMany({
      where: {
        trendId: params.trendId,
        language: params.language,
      },
      include: {
        trend: true,
        videos: true,
      },
      orderBy: { createdAt: 'desc' },
      take: params.take || 50,
    });
  }

  async getScript(id: string) {
    const script = await this.prisma.script.findUnique({
      where: { id },
      include: {
        trend: true,
        videos: true,
      },
    });
    if (!script) {
      throw new NotFoundException(`Script not found: ${id}`);
    }
    return script;
  }
}
