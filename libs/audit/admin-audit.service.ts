import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { AuthenticatedUser } from '../security/auth';

export function calculateAuditHash(input: {
  previousHash?: string | null;
  actorId: string;
  actorRoles: string[];
  action: string;
  targetType: string;
  targetId?: string;
  requestId: string;
  metadata?: Record<string, unknown>;
}): string {
  return createHash('sha256').update(JSON.stringify({
    previousHash: input.previousHash || null,
    actorId: input.actorId,
    actorRoles: [...input.actorRoles].sort(),
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId || null,
    requestId: input.requestId,
    metadata: input.metadata || null,
  })).digest('hex');
}

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: {
    actor: AuthenticatedUser;
    action: string;
    targetType: string;
    targetId?: string;
    requestId: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw`SELECT pg_advisory_xact_lock(897234)`;
      const previous = await transaction.adminAuditLog.findFirst({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: { hash: true },
      });
      const data = {
        actorId: input.actor.id,
        actorRoles: input.actor.roles,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        requestId: input.requestId,
        previousHash: previous?.hash,
        metadata: input.metadata as any,
      };
      return transaction.adminAuditLog.create({
        data: { ...data, hash: calculateAuditHash(data) },
      });
    });
  }

  async list(take = 50) {
    return this.prisma.adminAuditLog.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
    });
  }
}
