import assert from 'node:assert/strict';
import test from 'node:test';
import { FactCheckAgent } from '../ai/agents/fact-check.agent';
import { callYohPalBrain, configureProviderJobStore, withBoundedRetries } from '../ai/providers/yohpal-brain/client';
import { AxiosError } from 'axios';
import { webhookSignature, verifyProviderWebhook } from '../libs/security/provider-webhook';
import { quarantineScanAndPromote } from '../libs/media/quarantine';
import {
  calculateRankScore,
  freshnessScoreFromDate,
} from '../libs/common/rank-score';
import { CreateFeedEventRequestSchema, CreateTrendRequestSchema } from '../contracts/api-contracts';
import { assertProductionMedia, assertProductionProviders } from '../libs/common/production-safety';
import { assertProductionSecurity } from '../libs/common/production-safety';
import { ZodValidationPipe } from '../libs/common/zod-validation.pipe';
import { OptionalTakePipe, RequiredQueryPipe } from '../libs/common/query-validation.pipe';
import jwt from 'jsonwebtoken';
import { verifyAccessToken } from '../libs/security/auth';
import { configuredServiceToken, serviceTokensMatch } from '../libs/security/service-identity.guard';
import { calculateAuditHash } from '../libs/audit/admin-audit.service';
import { inspectFfprobeOutput, verifyRemoteAsset } from '../libs/media/asset-verifier';
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
      factCheckProvider: 'yohpal_brain',
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
    factCheckProvider: 'mock',
  }));
});

test('production requires signed provider webhooks and quarantine services', () => {
  assert.throws(() => assertProductionProviders({
    nodeEnv: 'production', llmProvider: 'yohpal_brain', ttsProvider: 'yohpal_brain',
    avatarProvider: 'yohpal_brain', videoRenderProvider: 'yohpal_brain',
    moderationProvider: 'yohpal_brain', factCheckProvider: 'yohpal_brain',
    aiProviderApiKey: 'provider-key',
  }), /PROVIDER_WEBHOOK_SECRET/);
  assert.throws(() => assertProductionMedia({
    nodeEnv: 'production', objectStorageGatewayUrl: 'http://storage.example',
    malwareScannerUrl: 'https://scanner.example', objectStorageGatewayToken: 'x'.repeat(32),
  }), /HTTPS/);
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

test('factual categories require claim-level citation entailment', async () => {
  const withoutEvidence = await new FactCheckAgent().check({
    title: 'Technology update', hook: 'Update', body: 'A factual claim.', category: 'technology',
  });
  assert.equal(withoutEvidence.requiresHumanReview, true);
  const checker = new FactCheckAgent(async (claims, evidence) => claims.map((claim) => ({
    claim, supported: true, confidence: 0.94, citationUrls: [evidence[0].url],
  })));
  const withEvidence = await checker.check({
    title: 'Technology update', hook: 'Update', body: 'A factual claim.', category: 'technology',
    evidence: [{ title: 'Official source', url: 'https://example.org/source', retrievedAt: new Date().toISOString() }],
  });
  assert.equal(withEvidence.requiresHumanReview, false);
  assert.equal(withEvidence.citations.length, 1);
  assert.ok(withEvidence.claimEntailments.every((claim) => claim.supported));
  const unsupported = await new FactCheckAgent(async (claims) => claims.map((claim) => ({
    claim, supported: false, confidence: 0.3, citationUrls: [],
  }))).check({
    title: 'Technology update', hook: 'Update', body: 'A factual claim.', category: 'technology',
    evidence: [{ title: 'Official source', url: 'https://example.org/source', retrievedAt: new Date().toISOString() }],
  });
  assert.equal(unsupported.requiresHumanReview, true);
});

test('asset verification rejects insecure and mock URLs before network access', async () => {
  await assert.rejects(() => verifyRemoteAsset('http://cdn.example/video.mp4', 'video'), /HTTPS/);
  await assert.rejects(() => verifyRemoteAsset('https://cdn.example/mock/video.mp4', 'video'), /Mock assets/);
});

test('media inspection requires codecs and captions for video', () => {
  const inspection = inspectFfprobeOutput({
    streams: [
      { codec_type: 'video', codec_name: 'h264' },
      { codec_type: 'audio', codec_name: 'aac' },
      { codec_type: 'subtitle', codec_name: 'mov_text' },
    ],
    format: { format_name: 'mov,mp4', duration: '45.2' },
  }, 'video');
  assert.equal(inspection.videoCodec, 'h264');
  assert.equal(inspection.captionsPresent, true);
  assert.throws(() => inspectFfprobeOutput({
    streams: [{ codec_type: 'video', codec_name: 'h264' }],
  }, 'video'), /caption stream/);
});

test('provider retries are bounded and use exponential delays', async () => {
  let attempts = 0;
  const delays: number[] = [];
  const result = await withBoundedRetries(async () => {
    attempts += 1;
    if (attempts < 3) throw new AxiosError('temporary outage');
    return 'complete';
  }, { maxAttempts: 3, baseDelayMs: 10, sleep: async (delay) => { delays.push(delay); } });
  assert.equal(result, 'complete');
  assert.equal(attempts, 3);
  assert.deepEqual(delays, [10, 20]);
});

test('provider webhooks require a valid unexpired HMAC signature', () => {
  const secret = 'a'.repeat(32);
  const body = { jobId: 'remote-1', status: 'succeeded', result: { url: 'https://cdn.example/video.mp4' } };
  const timestamp = '1700000000';
  const signature = webhookSignature(secret, timestamp, body);
  assert.equal(verifyProviderWebhook({ secret, timestamp, signature, body, now: 1_700_000_100_000 }), true);
  assert.equal(verifyProviderWebhook({ secret, timestamp, signature, body: { ...body, status: 'failed' }, now: 1_700_000_100_000 }), false);
  assert.equal(verifyProviderWebhook({ secret, timestamp, signature, body, now: 1_700_001_000_000 }), false);
});

test('assets remain quarantined until a clean malware scan permits promotion', async () => {
  const operations: string[] = [];
  const result = await quarantineScanAndPromote(Buffer.from('asset'), 'video/hash', 'video/mp4', 'hash', {
    quarantine: async () => { operations.push('quarantine'); return { objectKey: 'quarantine/video/hash' }; },
    scan: async () => { operations.push('scan'); return { clean: true, engine: 'test-scanner' }; },
    promote: async () => { operations.push('promote'); return { url: 'https://cdn.example/video/hash' }; },
  });
  assert.deepEqual(operations, ['quarantine', 'scan', 'promote']);
  assert.equal(result.scan.clean, true);
  await assert.rejects(() => quarantineScanAndPromote(Buffer.from('bad'), 'video/bad', 'video/mp4', 'bad', {
    quarantine: async () => ({ objectKey: 'quarantine/video/bad' }),
    scan: async () => ({ clean: false, engine: 'test-scanner', signature: 'EICAR' }),
    promote: async () => { throw new Error('must not promote'); },
  }), /Malware scanner rejected/);
});

test('completed durable provider jobs are recovered without another submission', async () => {
  const previousGateway = process.env.AI_GATEWAY_URL;
  const previousKey = process.env.AI_PROVIDER_API_KEY;
  process.env.AI_GATEWAY_URL = 'https://ai.example';
  process.env.AI_PROVIDER_API_KEY = 'test-key';
  configureProviderJobStore({
    find: async () => ({
      externalJobId: 'remote-1', statusUrl: 'https://ai.example/jobs/remote-1',
      status: 'SUCCESS', response: { audioUrl: 'https://cdn.example/audio.mp3' },
    }),
    accepted: async () => { throw new Error('must not submit'); },
    polled: async () => { throw new Error('must not poll'); },
    completed: async () => undefined,
    failed: async () => undefined,
  });
  try {
    const result = await callYohPalBrain<{ audioUrl: string }>('/v1/tts', { text: 'hello' });
    assert.equal(result.audioUrl, 'https://cdn.example/audio.mp3');
  } finally {
    process.env.AI_GATEWAY_URL = previousGateway;
    process.env.AI_PROVIDER_API_KEY = previousKey;
  }
});
