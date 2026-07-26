import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

export const ROLES_KEY = 'yohpal.roles';
export const PUBLIC_KEY = 'yohpal.public';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
export const Public = () => SetMetadata(PUBLIC_KEY, true);

export type UserRole = 'viewer' | 'operator' | 'moderator' | 'admin';
export type AuthenticatedUser = {
  id: string;
  roles: UserRole[];
};

export type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

export function verifyAccessToken(
  token: string,
  config: { secret: string; issuer: string; audience: string }
): AuthenticatedUser {
  const payload = jwt.verify(token, config.secret, {
    algorithms: ['HS256'],
    issuer: config.issuer,
    audience: config.audience,
  }) as JwtPayload;

  if (!payload.sub) throw new UnauthorizedException('JWT subject is required');
  const rawRoles = Array.isArray(payload.roles) ? payload.roles : [];
  const allowedRoles: UserRole[] = ['viewer', 'operator', 'moderator', 'admin'];
  const roles = rawRoles.filter((role): role is UserRole => allowedRoles.includes(role));
  if (roles.length === 0) throw new UnauthorizedException('JWT roles are required');
  return { id: payload.sub, roles };
}

const jwksClients = new Map<string, ReturnType<typeof jwksClient>>();

async function resolveJwksKey(uri: string, token: string): Promise<string> {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || typeof decoded === 'string' || !decoded.header.kid) {
    throw new UnauthorizedException('JWT key id is required');
  }
  let client = jwksClients.get(uri);
  if (!client) {
    client = jwksClient({
      jwksUri: uri,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 10 * 60 * 1000,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
      timeout: 5000,
    });
    jwksClients.set(uri, client);
  }
  const key = await client.getSigningKey(decoded.header.kid);
  return key.getPublicKey();
}

export async function verifyConfiguredAccessToken(token: string): Promise<AuthenticatedUser> {
  const issuer = process.env.JWT_ISSUER || 'yohpal-live';
  const audience = process.env.JWT_AUDIENCE || 'yohpal-api';
  const jwksUri = process.env.JWT_JWKS_URI;
  if (!jwksUri) {
    return verifyAccessToken(token, {
      secret: process.env.JWT_SECRET || 'development-jwt-secret',
      issuer,
      audience,
    });
  }

  const publicKey = await resolveJwksKey(jwksUri, token);
  const payload = jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer,
    audience,
  }) as JwtPayload;
  if (!payload.sub) throw new UnauthorizedException('JWT subject is required');
  const allowedRoles: UserRole[] = ['viewer', 'operator', 'moderator', 'admin'];
  const rawRoles = Array.isArray(payload.roles) ? payload.roles : [];
  const roles = rawRoles.filter((role): role is UserRole => allowedRoles.includes(role));
  if (roles.length === 0) throw new UnauthorizedException('JWT roles are required');
  return { id: payload.sub, roles };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token is required');
    }
    request.user = await verifyConfiguredAccessToken(authorization.slice(7));
    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])) return true;
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;
    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    return Boolean(user && required.some((role) => user.roles.includes(role)));
  }
}
