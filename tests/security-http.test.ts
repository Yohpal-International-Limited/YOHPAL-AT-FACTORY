import 'reflect-metadata';
import assert from 'node:assert/strict';
import test from 'node:test';
import { Controller, Get, Module, Post } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { NestFactory } from '@nestjs/core';
import { generateKeyPairSync } from 'node:crypto';
import { createServer } from 'node:http';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { configureHttpSecurity } from '../libs/security/http-security';
import { JwtAuthGuard, Public, Roles, RolesGuard, verifyConfiguredAccessToken } from '../libs/security/auth';

@Controller()
@Roles('viewer', 'operator', 'moderator', 'admin')
class SecurityTestController {
  @Get('health')
  @Public()
  health() {
    return { status: 'ok' };
  }

  @Get('feed')
  feed() {
    return { allowed: true };
  }

  @Post('operate')
  @Roles('operator', 'admin')
  operate() {
    return { allowed: true };
  }
}

@Module({
  controllers: [SecurityTestController],
  providers: [
    Reflector,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
class SecurityTestModule {}

const secret = 'http-test-secret-that-is-at-least-32-bytes';
function accessToken(role: 'viewer' | 'operator') {
  return jwt.sign({ roles: [role] }, secret, {
    algorithm: 'HS256',
    subject: `${role}-1`,
    issuer: 'test-issuer',
    audience: 'test-audience',
    expiresIn: '5m',
  });
}

async function createTestApp(rateLimitMax = 100) {
  process.env.JWT_SECRET = secret;
  process.env.JWT_ISSUER = 'test-issuer';
  process.env.JWT_AUDIENCE = 'test-audience';
  delete process.env.JWT_JWKS_URI;
  const app = await NestFactory.create(SecurityTestModule, {
    logger: false,
    bodyParser: false,
  });
  configureHttpSecurity(app, {
    allowedOrigins: ['https://admin.yohpal.test'],
    bodyLimit: '1kb',
    rateLimitWindowMs: 60_000,
    rateLimitMax,
  });
  await app.init();
  return app;
}

test('HTTP authentication and RBAC enforce route access', async () => {
  const app = await createTestApp();
  try {
    await request(app.getHttpServer()).get('/health').expect(200);
    await request(app.getHttpServer()).get('/feed').expect(401);
    await request(app.getHttpServer())
      .get('/feed')
      .set('Authorization', `Bearer ${accessToken('viewer')}`)
      .expect(200);
    await request(app.getHttpServer())
      .post('/operate')
      .set('Authorization', `Bearer ${accessToken('viewer')}`)
      .expect(403);
    await request(app.getHttpServer())
      .post('/operate')
      .set('Authorization', `Bearer ${accessToken('operator')}`)
      .expect(201);
  } finally {
    await app.close();
  }
});

test('HTTP middleware sets secure headers, restricts CORS, and limits bodies', async () => {
  const app = await createTestApp();
  try {
    const allowed = await request(app.getHttpServer())
      .get('/health')
      .set('Origin', 'https://admin.yohpal.test')
      .expect(200);
    assert.equal(allowed.headers['access-control-allow-origin'], 'https://admin.yohpal.test');
    assert.equal(allowed.headers['x-content-type-options'], 'nosniff');

    const blocked = await request(app.getHttpServer())
      .get('/health')
      .set('Origin', 'https://evil.example');
    assert.equal(blocked.headers['access-control-allow-origin'], undefined);

    await request(app.getHttpServer())
      .post('/operate')
      .set('Authorization', `Bearer ${accessToken('operator')}`)
      .set('Content-Type', 'application/json')
      .send({ payload: 'x'.repeat(2048) })
      .expect(413);
  } finally {
    await app.close();
  }
});

test('HTTP middleware rate limits excessive requests', async () => {
  const app = await createTestApp(2);
  try {
    await request(app.getHttpServer()).get('/health').expect(200);
    await request(app.getHttpServer()).get('/health').expect(200);
    await request(app.getHttpServer()).get('/health').expect(429);
  } finally {
    await app.close();
  }
});

test('JWKS verification accepts a newly rotated signing key', async () => {
  const first = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const second = generateKeyPairSync('rsa', { modulusLength: 2048 });
  let keys = [{ ...first.publicKey.export({ format: 'jwk' }), kid: 'key-1', use: 'sig', alg: 'RS256' }];
  const server = createServer((_request, response) => {
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ keys }));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    process.env.JWT_JWKS_URI = `http://127.0.0.1:${address.port}/.well-known/jwks.json`;
    process.env.JWT_ISSUER = 'rotation-test';
    process.env.JWT_AUDIENCE = 'rotation-audience';

    const sign = (key: typeof first.privateKey, kid: string) => jwt.sign(
      { roles: ['admin'] }, key, {
        algorithm: 'RS256',
        keyid: kid,
        subject: 'admin-1',
        issuer: 'rotation-test',
        audience: 'rotation-audience',
        expiresIn: '5m',
      }
    );
    assert.equal((await verifyConfiguredAccessToken(sign(first.privateKey, 'key-1'))).id, 'admin-1');

    keys = [{ ...second.publicKey.export({ format: 'jwk' }), kid: 'key-2', use: 'sig', alg: 'RS256' }];
    assert.equal((await verifyConfiguredAccessToken(sign(second.privateKey, 'key-2'))).id, 'admin-1');
  } finally {
    delete process.env.JWT_JWKS_URI;
    server.close();
  }
});
