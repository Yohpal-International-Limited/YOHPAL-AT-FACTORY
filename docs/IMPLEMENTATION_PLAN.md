# YohPal Live AI Content Factory - Implementation Plan

This plan converts the blueprint into verifiable release gates. A phase is done
only when its acceptance evidence is stored with the release.

## Phase 0 - Honest, reproducible baseline

- Keep mock providers explicit; fail startup when any mock provider is selected
  in a production environment.
- Add runtime request validation and consistent error responses.
- Resolve dependency advisories and generate committed Prisma migrations.
- Remove or formally archive duplicate legacy service trees.
- Add CI for type checking, unit tests, schema validation, and image builds.

Implemented in the current working tree: production mock-provider rejection,
strict mutation-body validation, bounded pagination validation, required feed
user validation, an initial Prisma migration, unit tests, and CI schema/type/
test/container gates. Non-breaking dependency fixes are applied; the remaining
advisories require the separately reviewed NestJS 11 upgrade documented in
[DEPENDENCY_AUDIT.md](./DEPENDENCY_AUDIT.md).

Acceptance: a clean checkout passes `npm ci`, `npm run typecheck`, `npm test`,
`prisma validate`, and container image builds in CI.

## Phase 1 - Security and governance release gate

Implemented: HS256 and OIDC/JWKS JWT verification with rotation, route RBAC,
shared service identity, production secret checks, append-only hash-linked
administrative audit logs, restricted CORS, request limits, rate limiting,
secure headers, and HTTP authorization tests. Secret-manager integration and a
complete route-by-role authorization matrix remain.

- Add OIDC/JWT validation at the gateway.
- Define viewer, moderator, operator, and executive roles; default deny.
- Add workload identity for internal calls and rotate secrets through a secret
  manager.
- Create an append-only admin audit log containing actor, action, target,
  correlation ID, timestamp, and before/after metadata.
- Add rate limits, request size limits, secure headers, and abuse controls.

Acceptance: automated authorization tests cover every route and role; service
calls without valid identity fail; security review has no critical/high finding.

## Phase 2 - Real content generation

Current increment: licensed configurable trend connectors, provenance retention,
authenticated YohPal Brain HTTP adapters, evidence-required factual categories,
and fail-closed remote asset validation are implemented. Provider-specific job
polling, checksums/codecs/caption inspection, citation-to-claim entailment, and
production credentials remain deployment work.

- Build scheduled trend connectors behind a common source interface, starting
  with two licensed/official sources.
- Normalize, deduplicate, score, expire, and retain source provenance.
- Replace placeholder LLM, TTS, avatar, compositor, and moderation adapters with
  production integrations and end-to-end provider audit logs.
- Implement claim extraction, evidence retrieval, citations, and mandatory human
  review for sensitive categories.
- Store produced assets and verify duration, codec, size, checksum, captions,
  branding, and thumbnail before state transition.

Acceptance: a traced trend produces playable, captioned media; every factual
claim links to evidence; provider failure exercises retry/fallback without a
false success state.

## Phase 3 - Autonomous event workflow

- Add versioned event envelopes with event ID, correlation/causation IDs,
  producer, schema version, and timestamp.
- Implement consumers for each pipeline transition with transactional outbox,
  idempotency, bounded retries, dead-letter topics, and replay tooling.
- Replace synchronous bulk loops with worker concurrency and per-item failure
  isolation.

Acceptance: duplicate delivery has no duplicate side effects; poison events
reach a DLQ; replay is audited; a provider outage recovers without data loss.

## Phase 4 - Recommendation learning

- Add `UserInterestProfile` aggregates by topic/category/creator/language and
  decay them over time.
- Consume views, watch time, likes, comments, shares, saves, follows, and skips.
- Add exploration, diversity, freshness, safety, and creator-fairness controls.
- Version ranking models and run offline evaluation plus guarded A/B tests.

Acceptance: offline metrics beat the non-personalized baseline; latency meets
the agreed SLO; safety and diversity constraints pass; rollback is immediate.

## Phase 5 - Operations and production release

- Add structured logs, metrics, traces, dashboards, SLOs, and alerts.
- Automate encrypted backups and regularly test restore against explicit RPO/RTO.
- Add incident, rollback, key-rotation, provider-outage, DLQ, and moderation
  escalation runbooks.
- Add progressive deployment, smoke tests, controlled traffic release, and
  signed release approval evidence.

Acceptance: restore and disaster-recovery exercises pass; alerts reach the
on-call owner; canary rollback succeeds; executive release authorization is
recorded and immutable.

## Phase 6 - Autonomous media platform expansion

After Phases 0-5, prioritize multilingual translation/dubbing and accessible
captions first, then branded channels, creator twins, AI newsrooms/teachers, and
long-form formats. Each new media type must reuse the security, provenance,
moderation, rights, observability, and release controls above.
