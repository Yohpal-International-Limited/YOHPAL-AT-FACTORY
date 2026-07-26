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
