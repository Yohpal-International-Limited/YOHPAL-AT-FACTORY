import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import { Observable, mergeMap } from 'rxjs';
import { AdminAuditService } from './admin-audit.service';
import { AuthenticatedRequest } from '../security/auth';

const AUDIT_KEY = 'yohpal.audit';
type AuditMetadata = { action: string; targetType: string };
export const Audited = (action: string, targetType: string) =>
  SetMetadata(AUDIT_KEY, { action, targetType } satisfies AuditMetadata);

@Injectable()
export class AdminAuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AdminAuditService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const definition = this.reflector.get<AuditMetadata>(AUDIT_KEY, context.getHandler());
    if (!definition) return next.handle();

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return next.handle().pipe(mergeMap(async (result) => {
      if (!request.user) return result;
      const requestId = randomUUID();
      const correlationId = request.header('x-request-id');
      const body = request.body as Record<string, unknown> | undefined;
      await this.audit.record({
        actor: request.user,
        ...definition,
        targetId: String(request.params?.id || body?.videoId || body?.trendId || body?.scriptId || '') || undefined,
        requestId,
        metadata: {
          method: request.method,
          path: request.route?.path || request.path,
          ...(correlationId ? { correlationId } : {}),
        },
      });
      return result;
    }));
  }
}
