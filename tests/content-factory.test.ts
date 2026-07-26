import assert from 'node:assert/strict';
import test from 'node:test';
import { FactCheckAgent } from '../ai/agents/fact-check.agent';
import {
  calculateRankScore,
  freshnessScoreFromDate,
} from '../libs/common/rank-score';
import { CreateFeedEventRequestSchema, CreateTrendRequestSchema } from '../contracts/api-contracts';
import { assertProductionProviders } from '../libs/common/production-safety';
import { assertProductionSecurity } from '../libs/common/production-safety';
import { ZodValidationPipe } from '../libs/common/zod-validation.pipe';
import { OptionalTakePipe, RequiredQueryPipe } from '../libs/common/query-validation.pipe';
import jwt from 'jsonwebtoken';
import { verifyAccessToken } from '../libs/security/auth';
import { configuredServiceToken, serviceTokensMatch } from '../libs/security/service-identity.guard';
import { calculateAuditHash } from '../libs/audit/admin-audit.service';
import { verifyRemoteAsset } from '../libs/media/asset-verifier';
import { parseLicensedTrendSources } from '../services/trend-service/src/trend-source.connector';

test('ranking clamps untrusted score inputs to the zero-to-one range', () => {
  const score = calculateRankScore({
    engagementScore: 2,
    interestScore: -1,
    localityScore: 1,
    freshnessScore: 1,
    qualityScore: 1,
  });

  assert.equal(score, 0.75);
});

test('fresh content ranks above stale content', () => {
  const recent = freshnessScoreFromDate(new Date(Date.now() - 30 * 60 * 1000));
  const stale = freshnessScoreFromDate(new Date(Date.now() - 8 * 24 * 60 * 60 * 1000));

  assert.ok(recent > stale);
});

test('fact checking blocks restricted claims', async () => {
  const result = await new FactCheckAgent().check({
    title: 'Guaranteed profit today',
    hook: 'Act now',
    body: 'This is free money guaranteed.',
    category: 'business',
  });

  assert.equal(result.factScore, 0.45);
  assert.ok(result.unsafeClaims.includes('guaranteed profit'));
  assert.ok(result.unsafeClaims.includes('free money guaranteed'));
});

test('sensitive categories require human review', async () => {
  const result = await new FactCheckAgent().check({
    title: 'Public health update',
    hook: 'What changed',
    body: 'A neutral summary.',
    category: 'health',
  });

  assert.equal(result.requiresHumanReview, true);
});

test('production refuses to start with any mock provider', () => {
  assert.throws(
    () => assertProductionProviders({
      nodeEnv: 'production',
      llmProvider: 'yohpal_brain',
      ttsProvider: 'mock',
      avatarProvider: 'yohpal_brain',
      videoRenderProvider: 'yohpal_brain',
      moderationProvider: 'yohpal_brain',
    }),
    /ttsProvider/
  );
});

test('development permits explicit mock providers', () => {
  assert.doesNotThrow(() => assertProductionProviders({
    nodeEnv: 'development',
    llmProvider: 'mock',
    ttsProvider: 'mock',
    avatarProvider: 'mock',
    videoRenderProvider: 'mock',
    moderationProvider: 'mock',
  }));
});

test('request schemas reject malformed and unknown fields', () => {
  const pipe = new ZodValidationPipe(CreateTrendRequestSchema);
  assert.throws(() => pipe.transform({
    topic: '',
    category: 'news',
    score: 101,
    growthRate: 1,
    source: 'test',
    unexpected: true,
  }));
});

test('feed events accept only supported actions and non-negative watch time', () => {
  assert.equal(CreateFeedEventRequestSchema.safeParse({
    userId: 'user-1',
    videoId: '2da83bdb-88ef-4f65-a17e-25a3621fdb39',
    action: 'like',
    watchMs: 1200,
  }).success, true);
  assert.equal(CreateFeedEventRequestSchema.safeParse({
    userId: 'user-1',
    videoId: '2da83bdb-88ef-4f65-a17e-25a3621fdb39',
    action: 'purchase',
    watchMs: -1,
  }).success, false);
});

test('take query accepts only bounded positive integers', () => {
  const pipe = new OptionalTakePipe();
  assert.equal(pipe.transform(undefined), undefined);
  assert.equal(pipe.transform('25'), 25);
  for (const value of ['0', '101', '1.5', '-1', 'abc']) {
    assert.throws(() => pipe.transform(value));
  }
});

test('required query values reject missing and blank input', () => {
  const pipe = new RequiredQueryPipe('userId');
  assert.equal(pipe.transform(' user-1 '), 'user-1');
  assert.throws(() => pipe.transform(undefined));
  assert.throws(() => pipe.transform('   '));
});

test('JWT verification enforces signature, issuer, audience, and roles', () => {
  const config = {
    secret: 'test-secret-that-is-long-enough-for-hs256',
    issuer: 'yohpal-live',
    audience: 'yohpal-api',
  };
  const token = jwt.sign({ roles: ['operator'] }, config.secret, {
    algorithm: 'HS256',
    subject: 'user-1',
    issuer: config.issuer,
    audience: config.audience,
    expiresIn: '5m',
  });
  assert.deepEqual(verifyAccessToken(token, config), {
    id: 'user-1',
    roles: ['operator'],
  });
  assert.throws(() => verifyAccessToken(token, { ...config, audience: 'wrong' }));
});

test('service identity comparison rejects missing and incorrect credentials', () => {
  assert.equal(serviceTokensMatch('service-secret', 'service-secret'), true);
  assert.equal(serviceTokensMatch('wrong-secret', 'service-secret'), false);
  assert.equal(serviceTokensMatch(undefined, 'service-secret'), false);
});

test('service identity has a matching local-development fallback', () => {
  const previous = process.env.SERVICE_AUTH_TOKEN;
  delete process.env.SERVICE_AUTH_TOKEN;
  assert.equal(configuredServiceToken(), 'development-service-token');
  if (previous) process.env.SERVICE_AUTH_TOKEN = previous;
});

test('production security requires distinct secrets of at least 32 bytes', () => {
  assert.throws(() => assertProductionSecurity({
    nodeEnv: 'production',
    jwtSecret: 'short',
    serviceAuthToken: 'also-short',
  }));
  const shared = 'a'.repeat(32);
  assert.throws(() => assertProductionSecurity({
    nodeEnv: 'production',
    jwtSecret: shared,
    serviceAuthToken: shared,
  }));
});

test('audit hashes are deterministic and reveal record tampering', () => {
  const record = {
    previousHash: 'previous',
    actorId: 'admin-1',
    actorRoles: ['admin'],
    action: 'video.publish',
    targetType: 'video',
    targetId: 'video-1',
    requestId: 'request-1',
    metadata: { method: 'POST' },
  };
  const hash = calculateAuditHash(record);
  assert.equal(hash, calculateAuditHash(record));
  assert.notEqual(hash, calculateAuditHash({ ...record, action: 'video.reject' }));
});

test('licensed trend source configuration requires provenance fields', () => {
  assert.equal(parseLicensedTrendSources(JSON.stringify([{
    name: 'licensed-news',
    endpoint: 'https://provider.example/trends',
    licenseId: 'contract-2026-01',
    category: 'news',
    region: 'Africa',
    country: 'Kenya',
  }])).length, 1);
  assert.throws(() => parseLicensedTrendSources(JSON.stringify([{
    name: 'unlicensed-news',
    endpoint: 'https://provider.example/trends',
    category: 'news',
    region: 'Africa',
    country: 'Kenya',
  }])));
});

test('factual categories require valid evidence citations', async () => {
  const withoutEvidence = await new FactCheckAgent().check({
    title: 'Technology update', hook: 'Update', body: 'A factual claim.', category: 'technology',
  });
  assert.equal(withoutEvidence.requiresHumanReview, true);
  const withEvidence = await new FactCheckAgent().check({
    title: 'Technology update', hook: 'Update', body: 'A factual claim.', category: 'technology',
    evidence: [{ title: 'Official source', url: 'https://example.org/source', retrievedAt: new Date().toISOString() }],
  });
  assert.equal(withEvidence.requiresHumanReview, false);
  assert.equal(withEvidence.citations.length, 1);
});

test('asset verification rejects insecure and mock URLs before network access', async () => {
  await assert.rejects(() => verifyRemoteAsset('http://cdn.example/video.mp4', 'video'), /HTTPS/);
  await assert.rejects(() => verifyRemoteAsset('https://cdn.example/mock/video.mp4', 'video'), /Mock assets/);
});
