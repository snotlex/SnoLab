# SnoLab — Production Technical & Engineering Audit

Date: 2026-08-28
Branch: `audit/production-hardening-2026-08-28`
Baseline: `main` at commit `dc30fad92aab3d261b74b82a83041bfe1d8f19f1`

## Executive Result

**Production status: Needs Major Fixes**

The repository has a strong modular direction: method registry, Dreux-Gorisse strategy, material governance, knowledge base, validation, PDF/report services, and an extensive test suite. This audit now enforces the documented production boundary more consistently while keeping numerical changes conservative and traceable.

## Current Health Score

| Area | Score | Assessment |
|---|---:|---|
| Engineering Logic | 68/100 | Production calculation now has a strict material gate and a deterministic core; empirical parameters still need authoritative calibration. |
| Calculation Accuracy | 66/100 | Primary entry points use one core calculation and no longer fabricate legacy values; reference-case validation still needs an external controlled benchmark. |
| Database | 82/100 | Ownership and listing boundaries are stricter and privileged status mutations are restricted. |
| Security | 72/100 | Firestore now relies on verified admin claims and immutable owner fields; the server-side admin email endpoint still needs ID-token verification. |
| UX/UI | 78/100 | Dynamic material display and validation panels are present; complete browser-level verification remains outstanding. |
| Performance | 70/100 | Architecture remains viable; runtime profiling is still required. |
| Reliability | 71/100 | Calculation configuration failures now become explicit invalid results instead of silent caps/defaults or crashes. |
| Code Quality | 74/100 | The legacy adapter has been reduced to a pure data mapper and duplicate calculation paths were removed. |
| Localization | 70/100 | Arabic/French/English support exists; some older UI/source strings still require cleanup. |
| Production Readiness | 64/100 | Significant hardening is complete, but CI execution, Firebase Rules Emulator, browser E2E, and numerical benchmark evidence are still release gates. |

## Implemented Hardening

### C1 — Production material governance
`src/engine/productionMaterialGate.ts` is now the production boundary. It requires the four primary selected materials, blocks system/demo/preset/seeded records, requires Approved/Validated/Certified plus Active/نشط status, checks category compatibility, and rejects missing calculation-critical properties. Optional selected materials are checked by the same policy.

### C2 — Deterministic Dreux-Gorisse calculation core
`src/engine/dreuxGorisseCore.ts` now uses knowledge-base values where configured and fails explicitly when a required production parameter is unavailable. Silent cement-demand caps and silent material-property fallbacks were removed from the production path. Test-only bypass remains isolated to Vitest legacy mathematical tests.

### C3 — One engineering source of truth
`src/engine/legacyAdapter.ts` is now a field mapper only. It no longer invents fcm, W/C adjustments, gamma, absolute-volume values, or aggregate-density conversions.

`src/engine/dreuxGorisse.ts` no longer runs a second independent absolute-volume calculation. The adapter consumes the core result.

`src/mix-design/methods/dreux-gorisse/dreuxGorisseCalculation.ts` now applies the production gate before calling the core and converts unexpected configuration failures into a structured invalid result instead of crashing the caller.

### C4 — Firestore ownership and privileged fields
`firestore.rules` now follows default-deny, owner-bound reads/writes, immutable ownerId/createdAt, verified `admin` custom claim plus verified email for administrative actions, owner-only material listing, and protection against non-admin mutation of material approval/status metadata.

### C5 — CI release gate
`.github/workflows/ci.yml` now runs on `main`, `audit/**`, and pull requests. It performs `npm ci`, lint/typecheck, unit tests, and production build, then stores the build artifact.

### C6 — Governance and integration tests
Added focused tests for production material governance and the calculation-boundary behavior, including system material rejection, incomplete material rejection, and approved complete material acceptance. Updated Dreux audit cases so impossible high-strength demand is rejected rather than silently capped.

## Remaining Release Blockers

1. The server-side `/api/admin/send-activation-email` route is still not verified against a Firebase ID token in the current branch because the repository does not include Firebase Admin SDK or another server-side token verification implementation. This must be closed before exposing that route publicly.
2. `src/engine/validation/mixValidation.ts` still contains compatibility fallbacks for standalone legacy validation calls. The production core now supplies explicit values, but these compatibility defaults should be isolated or removed after the remaining legacy tests are migrated.
3. Some UI components still contain presentation-only fallback values such as the displayed sand fineness value. These must be removed from engineering result displays so the interface never shows invented laboratory properties.
4. The empirical Dreux-related coefficients, admixture reduction behavior, strength-age curve, and grading curve need a controlled engineering reference set and documented provenance before numerical production certification.
5. GitHub Actions must complete successfully for lint, tests, and build. Firebase Rules Emulator/security tests and browser E2E scenarios must also pass.

## Release Gate

Do not label SnoLab `Production Ready` until all five release gates are green:

- `npm run lint`
- `npm test`
- `npm run build`
- Firebase Rules Emulator/security suite
- Browser E2E plus controlled Dreux-Gorisse numerical reference cases

The current repository state remains **Needs Major Fixes**, but the highest-risk calculation and governance boundaries are now materially stronger than the baseline.
