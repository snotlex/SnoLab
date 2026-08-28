# SnoLab — Production Technical & Engineering Audit

Date: 2026-08-28
Branch: `audit/production-hardening-2026-08-28`
Baseline: `main` at commit `dc30fad92aab3d261b74b82a83041bfe1d8f19f1`

## Executive Result

**Production status: Needs Major Fixes**

The repository has a strong modular direction, including a Dreux-Gorisse method adapter, a central method registry, a material suitability layer, a granular/knowledge-base layer, PDF services, and an extensive test suite. The architecture document describes this separation explicitly, but several production-critical paths were less strict than the documented contract.

## Health Score

| Area | Score | Assessment |
|---|---:|---|
| Engineering Logic | 62/100 | Core method exists, but several empirical/default corrections need authoritative calibration and traceability. |
| Calculation Accuracy | 58/100 | W/C, moisture, absolute-volume and grading paths contain competing/fallback logic that can diverge. |
| Database | 72/100 | Firestore ownership model exists, but prior rules exposed broader material listing and role risks. |
| Security | 55/100 | Hard-coded admin identities and mutable user profile privileges were too permissive for production. |
| UX/UI | 78/100 | Large engineering-focused component set and validation panels are present; full interactive button-by-button verification requires a runnable environment. |
| Performance | 70/100 | React/Vite architecture is viable, but large components and database listeners merit runtime profiling. |
| Reliability | 61/100 | Strong validation intent, but legacy compatibility and fallback branches reduce determinism. |
| Code Quality | 66/100 | Modularization exists, but legacy adapters and duplicated engineering logic remain. |
| Localization | 69/100 | Arabic/French/English infrastructure exists, but some validation strings are still generated from Arabic source text. |
| Production Readiness | 52/100 | Security and engineering determinism must be hardened and verified before release. |

## Architecture Map

`Material Library / Firestore`
→ `Production Material Governance Gate`
→ `Method Registry / Dreux-Gorisse Adapter`
→ `Dreux-Gorisse Core`
→ `Validation + Absolute Volume + Moisture + Cost`
→ `Result Model`
→ `UI / Journal / PDF`

The repository already documents a closely related layered architecture with a Material Library, Suitability Gate, calculation engines, and report generation. The audit found that the implementation did not always enforce those boundaries as strictly as the documentation claimed.

## Critical Findings

### C1 — System/demo material could pass the production suitability gate
**Location:** `src/engine/suitabilityGate.ts`

The previous logic accepted a non-user material merely because it existed in `materialsDatabase` during non-test execution. This contradicted the repository's own governance tests and documentation.

**Fix implemented:** added `src/engine/productionMaterialGate.ts` and wired it into the primary Dreux calculation entry points. System/demo/preset/seeded sources are now blocked, approval and active status are required, and required engineering properties are checked before calculation.

### C2 — Missing material properties could degrade to defaults/fallbacks
**Locations:** `src/engine/dreuxGorisseCore.ts`, legacy engine adapter paths.

The core and adapters contained defaults for cement density, aggregate absorption, admixture density, fiber density, moisture, and pricing. For a production engineering calculator, silently inventing a laboratory property is unsafe.

**Fix implemented:** production entry points now require complete approved material records before calculation; the compatibility engine no longer invents missing material densities/absorptions and no longer performs an independent volume recalculation.

**Remaining:** dormant fallback constants still exist inside the core for backward-compatible/internal paths. They should be removed entirely after the remaining direct-call test suite is migrated.

### C3 — Legacy adapter fabricated engineering values
**Location:** `src/engine/legacyAdapter.ts`

The adapter contained computed guesses such as `wcRatio * 0.95`, fixed gamma values, and synthetic water/aggregate mappings. That created a second engineering source of truth.

**Status:** identified as a high-priority architecture issue. The primary calculation adapters were corrected to use the core result directly. The legacy transformer still needs a dedicated migration pass because its exact historical consumers were not all statically verified through a runnable application environment.

### C4 — Firestore admin and ownership rules were too permissive
**Location:** `firestore.rules`

The previous rules used hard-coded administrator identities and permitted broad `user_materials` listing. User profile updates were also not sufficiently protected against privileged-field mutation.

**Fix implemented:** production rules now use a verified `admin` custom claim, enforce owner immutability for mixes/materials, restrict user-owned reads, prevent non-admin approval/status mutation, and deny arbitrary privileged writes.

**Migration requirement:** administrative accounts must be provisioned with a server-side Firebase Auth custom claim (`admin=true`). This must never be done from the client.

### C5 — Absolute-volume calculation existed in more than one place
**Locations:** `src/engine/absoluteVolume.ts`, `src/engine/dreuxGorisse.ts`, core result path.

A separate adapter-side recomputation could diverge from the core. This is especially risky when density units or admixture density assumptions differ.

**Fix implemented:** compatibility entry point now uses the core `absoluteVolumeCheck` result rather than re-running an independent approximate calculation.

### C6 — Engineering model contains empirical assumptions that are not the same as classical Dreux-Gorisse equations

The core mixes the Dreux/Bolomey strength relation with a statistical target-strength margin, empirical admixture water-reduction multipliers, default SCM densities, a synthetic strength-age curve, and a synthetic grading curve. These may be useful application heuristics, but they must not be presented as universally normative Dreux-Gorisse equations.

**Status:** not automatically rewritten because changing these constants without a declared reference source would be an engineering design change, not merely a software refactor. A standards-controlled calibration pass is required before declaring numerical production readiness.

## Tests Added

`src/__tests__/productionMaterialGate.test.ts` covers:

- complete approved active material set → accepted;
- system/demo material → blocked;
- missing engineering properties → blocked;
- approved but inactive material → blocked.

Existing governance tests in `src/__tests__/noFallbackDensitiesFinal.test.ts` also demonstrate the intended no-fallback policy for several special cases.

## Verification Limitations

The GitHub connector exposed the repository and allowed isolated branch edits, but no GitHub Actions workflow run was associated with the audit branch commits during this audit session. The application could therefore not be truthfully marked `Production Ready` based on executed build/test evidence.

A final release gate still needs a real environment run of:

- `npm run lint`
- `npm test`
- `npm run build`
- Firebase Rules Emulator/security tests
- browser-level critical UI/E2E scenarios 1–15 from the audit specification
- numerical validation against a controlled set of published/manual Dreux-Gorisse reference calculations

## Next Priority Order

1. Remove remaining core fallback constants and make every direct calculation entry point enforce the production gate.
2. Finish the legacy adapter migration so every returned engineering field is sourced from one calculation result.
3. Calibrate/document the Dreux-Gorisse numerical constants and distinguish normative equations from empirical heuristics.
4. Complete Firebase custom-claim provisioning and rules tests.
5. Execute the full end-to-end suite in a real browser/Firebase environment.
6. Only then reassess Production Readiness.
