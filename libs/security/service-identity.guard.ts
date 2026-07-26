import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { Request } from 'express';

export function serviceTokensMatch(actual: string | undefined, expected: string): boolean {
  if (!actual || !expected) return false;
  const left = Buffer.from(actual);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function configuredServiceToken(): string {
  return process.env.SERVICE_AUTH_TOKEN || 'development-service-token';
}

@Injectable()
export class ServiceIdentityGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.header('x-yohpal-service-token');
    const expected = configuredServiceToken();
    if (!serviceTokensMatch(token, expected)) {
      throw new UnauthorizedException('Valid service identity is required');
    }
    return true;
  }
}
