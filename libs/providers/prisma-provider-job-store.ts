import { PrismaService } from '../database/prisma.service';
import { DurableProviderJob, ProviderJobStore } from '../../ai/providers/yohpal-brain/client';

function jobType(path: string): 'LLM_SCRIPT' | 'TTS' | 'AVATAR_VIDEO' | 'VIDEO_COMPOSITE' | 'MODERATION' {
  if (path.includes('/tts')) return 'TTS';
  if (path.includes('/avatars')) return 'AVATAR_VIDEO';
  if (path.includes('/videos')) return 'VIDEO_COMPOSITE';
  if (path.includes('/moderation')) return 'MODERATION';
  return 'LLM_SCRIPT';
}

export class PrismaProviderJobStore implements ProviderJobStore {
  constructor(private readonly prisma: PrismaService) {}

  async find(requestKey: string): Promise<DurableProviderJob | null> {
    const job = await this.prisma.providerJobLog.findUnique({ where: { requestKey } });
    if (!job?.externalJobId || !job.statusUrl) return null;
    if (!['RUNNING', 'SUCCESS', 'FAILED'].includes(job.status)) return null;
    return {
      externalJobId: job.externalJobId,
      statusUrl: job.statusUrl,
      status: job.status as DurableProviderJob['status'],
      response: job.responsePayload,
    };
  }

  async accepted(input: { requestKey: string; externalJobId: string; statusUrl: string; path: string; payload: unknown }) {
    await this.prisma.providerJobLog.upsert({
      where: { requestKey: input.requestKey },
      create: {
        requestKey: input.requestKey, externalJobId: input.externalJobId, statusUrl: input.statusUrl,
        jobType: jobType(input.path), providerName: 'yohpal_brain', status: 'RUNNING', requestPayload: input.payload as any,
      },
      update: { externalJobId: input.externalJobId, statusUrl: input.statusUrl, status: 'RUNNING', errorMessage: null },
    });
  }

  async polled(requestKey: string, attempts: number, nextPollAt: Date) {
    await this.prisma.providerJobLog.update({
      where: { requestKey }, data: { attempts: { increment: 1 }, lastPolledAt: new Date(), nextPollAt },
    });
  }

  async completed(requestKey: string, response: unknown) {
    await this.prisma.providerJobLog.update({
      where: { requestKey }, data: { status: 'SUCCESS', responsePayload: response as any, completedAt: new Date(), nextPollAt: null },
    });
  }

  async failed(requestKey: string, error: string) {
    await this.prisma.providerJobLog.update({
      where: { requestKey }, data: { status: 'FAILED', errorMessage: error, completedAt: new Date(), nextPollAt: null },
    });
  }
}
