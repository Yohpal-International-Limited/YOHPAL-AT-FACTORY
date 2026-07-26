import assert from 'node:assert/strict';
import test from 'node:test';
import { FactCheckAgent } from '../ai/agents/fact-check.agent';
import {
  calculateRankScore,
  freshnessScoreFromDate,
} from '../libs/common/rank-score';
import { CreateFeedEventRequestSchema, CreateTrendRequestSchema } from '../contracts/api-contracts';
import { assertProductionProviders } from '../libs/common/production-safety';
import { ZodValidationPipe } from '../libs/common/zod-validation.pipe';
import { OptionalTakePipe, RequiredQueryPipe } from '../libs/common/query-validation.pipe';

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
