# YohPal Live AI Content Factory

YohPal Live AI Content Factory is the seed video generation engine for YohPal Live.
It solves the cold-start problem by generating, scoring, moderating, publishing, 
and ranking AI-assisted short videos before the platform has enough human creators.

## Core Flow
1. Trend is discovered.
2. AI script is generated.
3. Viral score is calculated.
4. Video render job is created.
5. Avatar/TTS/video rendering runs.
6. Moderation approves or blocks the video.
7. Approved video is published.
8. Recommendation engine ranks it into user feeds.
9. Feed events improve future generation.

## Blueprint status

This repository is currently a proof of concept, not a production-certified
deployment. See [the blueprint audit](docs/BLUEPRINT_AUDIT.md) for implemented,
partial, and missing capabilities, and [the implementation plan](docs/IMPLEMENTATION_PLAN.md)
for sequenced release gates.

## Verification

```bash
npm ci
npm run typecheck
npm test
DATABASE_URL=postgresql://postgres:postgres@localhost:5441/yohpal_live_ai npx prisma validate
```

Production startup fails when any of `LLM_PROVIDER`, `TTS_PROVIDER`,
`AVATAR_PROVIDER`, `VIDEO_RENDER_PROVIDER`, or `MODERATION_PROVIDER` is set to
`mock`. Mock providers remain available for local development and tests.

The initial database migration is committed under `prisma/migrations`. Deploy
schema changes with `npx prisma migrate deploy`; do not use development
migrations in production.

Build a service image with:

```bash
docker build --build-arg SERVICE=api-gateway -t yohpal-content-factory .
```

## Security configuration

All gateway routes except `GET /health` require an HS256 bearer JWT. Tokens
must contain a subject, the configured issuer and audience, and at least one of
the roles `viewer`, `operator`, `moderator`, or `admin`.

Production requires distinct `JWT_SECRET` and `SERVICE_AUTH_TOKEN` values of at
least 32 bytes. Configure `JWT_ISSUER` and `JWT_AUDIENCE` for the issuing system.
For OIDC deployments, set an HTTPS `JWT_JWKS_URI`; the gateway then accepts only
RS256 tokens, caches signing keys, rate-limits JWKS retrieval, and resolves new
`kid` values during key rotation. HS256 is retained for controlled local or
legacy deployments when `JWT_JWKS_URI` is unset.
Internal services reject requests without the shared service credential; only
the gateway should be exposed publicly.

Set `CORS_ALLOWED_ORIGINS` to a comma-separated allowlist. `REQUEST_BODY_LIMIT`,
`RATE_LIMIT_WINDOW_MS`, and `RATE_LIMIT_MAX` control the gateway's body and
traffic limits. Production rejects wildcard CORS configuration.

Administrative mutations are stored in the append-only `AdminAuditLog` table.
Records are serialized and hash-linked, while database triggers reject updates
and deletes. Audit history is available only to administrators at
`GET /admin/audit-logs`.
