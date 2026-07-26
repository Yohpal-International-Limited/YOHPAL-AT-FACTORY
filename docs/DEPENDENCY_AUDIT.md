# Dependency Audit Status

Audit date: 2026-07-26

The approved audit was completed against npm's advisory service. Non-breaking
direct upgrades were applied:

- `axios`: 1.7.9 to 1.18.1, resolving its reported SSRF, credential leakage,
  prototype-pollution, header-injection, recursion, and denial-of-service range.
- `@nestjs/common`: 10.4.15 to 10.4.22, resolving GHSA-cj7v-w2c7-cp7c.

The current audit reports 9 dependency paths: 5 moderate and 4 high. They are
all in the NestJS 10 / Express 4 dependency tree (`@nestjs/common`,
`@nestjs/core`, `@nestjs/platform-express`, `file-type`, `body-parser`,
`express`, `multer`, `path-to-regexp`, and `qs`). npm's supported remediation is
NestJS 11.1.28, which is a semver-major framework upgrade.

No `npm audit fix --force` was applied. The remaining remediation requires a
separate NestJS 11 upgrade with compatibility testing. Until then, production
exposure should be constrained with request/body limits, rate limiting, and an
edge proxy or WAF. The application does not currently expose file-upload routes,
which reduces but does not eliminate the Multer dependency risk.
