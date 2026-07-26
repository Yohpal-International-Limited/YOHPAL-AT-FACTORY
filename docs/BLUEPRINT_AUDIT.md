# YohPal Live AI Content Factory - Blueprint Audit

Audit date: 2026-07-26  
Source: *YohPal Live AI Seed Content Factory, Master Blueprint v1.0*

## Executive conclusion

The repository contains a coherent proof-of-concept pipeline and most of the
blueprint's domain model. It is not yet production-ready. Several capabilities
described as "implemented" in the blueprint are currently deterministic rules,
seed data, mock providers, or configuration scaffolding. Production claims
should remain blocked until the acceptance evidence in the roadmap exists.

Status definitions:

- **Implemented**: executable product code exists for the stated capability.
- **Partial**: the contract or workflow exists, but production behavior or
  operational evidence is incomplete.
- **Missing**: no material implementation was found.

## Capability matrix

| Blueprint capability | Status | Repository evidence | Main gap |
| --- | --- | --- | --- |
| Seed content pipeline | Implemented | API gateway orchestration and service flow | End-to-end test and retry/idempotency evidence |
| Trend discovery | Partial | Trend service and seeded topics | No external source connectors, scheduling, deduplication, or provenance verification |
| Trend intelligence | Partial | Stored score and growth rate | No scoring model or cross-source normalization |
| Script generation | Partial | Content workflow and script agents | Deterministic templates; production LLM adapter returns placeholder content |
| Fact checking | Partial | Restricted-phrase and category rules | No evidence retrieval, citations, claim extraction, or verifier model |
| Avatar selection | Partial | Avatar director and database model | Provider implementation is a placeholder |
| Voice generation | Partial | TTS provider interfaces and audit model | Mock/default output; no rendered media verification |
| Video rendering | Partial | Render workflow and status transitions | Pipeline returns synthetic CDN URLs instead of media |
| Moderation | Partial | Moderation workflow, queue, logs, manual review | Mock/default provider and no copyright classifier |
| Publishing | Implemented | Approval gate, publish transition, Kafka event | No destination integration or delivery reconciliation |
| Recommendation | Partial | Weighted feed ranking and feed event capture | Personalization uses events for the same candidate video only; no user interest profile model |
| Feed learning | Partial | Feed events are persisted and emitted | No consumer updates ranking models/profiles |
| Kafka/event architecture | Partial | Topic contracts and producer helper | No consumers, schema registry, DLQ, replay, or idempotency controls |
| Provider audit logging | Partial | Provider job tables and admin views | Coverage is inconsistent across active workflows; immutability is not enforced |
| Database governance | Partial | Prisma schema and service data access | No migrations or ownership enforcement found |
| JWT, RBAC, service auth | Missing | No guards, strategies, roles, or service credentials found | All gateway/admin endpoints are effectively unprotected |
| Admin service | Missing | Admin web calls other services | No dedicated admin service or governed mutation boundary |
| Observability | Missing | Health endpoints only | No metrics, tracing, dashboards, alerting, or SLOs |
| Backup/disaster recovery | Missing | A SQL snapshot and persistent Docker volume | No automated backup, restore test, RPO/RTO, or runbook |
| Release/deployment governance | Missing | Dockerfiles, Compose, PM2 start script | No CI/CD gates, signed release evidence, rollback automation, or executive authorization control |
| Automated testing | Partial | Core ranking and safety unit tests | Integration, E2E, performance, and security suites remain |
| Future media features | Missing | Some schema hints (creator twin, thumbnail field) | Music, dubbing, translations, channels, podcasts, newsrooms, courses, etc. |

## Code review findings

### Critical

1. Authentication and authorization described by the blueprint are absent.
   Production traffic must not be enabled before gateway and admin routes are
   protected, service-to-service identity is enforced, and audit actors are
   recorded.
2. Rendering can move a video into moderation while returning URLs for media
   that was never produced. Mock mode must be explicit and impossible to enable
   accidentally in production.

### High

1. The fact checker is a phrase filter, not factual verification. It must not
   be used to substantiate news, health, finance, legal, or political claims.
2. Trend discovery is a static five-item seed list, so it cannot satisfy the
   continuous worldwide discovery objective.
3. The recommendation engine does not build the blueprint's
   `UserInterestProfile`; learning is limited to a user's events on each
   candidate video.
4. There are no Kafka consumers, retry policies, dead-letter topics, or
   idempotency keys, so the displayed pipeline is synchronous and cannot yet
   provide the claimed autonomous event-driven operation.
5. Dependency installation reported 9 vulnerabilities (4 moderate, 5 high).
   Review and upgrade without using a forced breaking-change update.

### Medium

1. Duplicate `backend/` and `services/` trees had drifted. The build now targets
   the active `services/` tree plus shared backend code; the legacy service
   copies should be removed only after confirming no deployment depends on them.
2. Request contracts are TypeScript-only and provide no runtime validation.
3. Bulk jobs process sequentially and stop on the first failure.
4. Several list limits accept unbounded, invalid, or non-numeric query values.

## Baseline fixes delivered with this audit

- TypeScript now checks the active services and shared libraries rather than
  incomplete legacy service copies.
- The nullable `Script.trendId` now matches its `onDelete: SetNull` relation.
- Provider audit log IDs now receive database-generated UUID defaults.
- A real test command and initial ranking/fact-safety unit tests replace the
  previous no-op test script.

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for the sequenced path to
production eligibility.
