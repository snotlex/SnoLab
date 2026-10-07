# SnoLab Main Baseline — 2026-10-07

## Reference

- Repository: `snotlex/SnoLab`
- Main reference commit before this repair branch: `287cd105ab754695b770d7aabf9748da48265eea`
- Repair branch: `fix/stages-1-5-unified-engine`
- Scope: Stage 1–5 closure without changing Dreux-Gorisse formulas.

## Baseline inherited from PR #37

The merged PR reported:

| Check | Result |
|---|---|
| TypeScript / lint | PASS |
| Vitest | PASS — 116 files, 671 tests |
| Production build | PASS |
| E2E | PASS — 18 tests |
| Vercel status on merge commit | SUCCESS |

These figures are recorded as the repository's pre-repair baseline; they are not a substitute for rerunning the gates on this repair branch.

## Engineering safety baseline

Already present before this repair:

- Unknown calculation methods are blocked.
- Non-finite results are blocked and retained as raw diagnostic data.
- Primary density inputs are validated and their source is tracked.
- Negative moisture/absorption inputs are rejected in engineering mode.
- Application calculation calls were routed to `calculateMixDesign()`.
- Legacy calculation remains diagnostic-only with release eligibility blocked.

## Repair objectives

1. Keep one production calculation entry point: `calculateMixDesign()`.
2. Remove the duplicate legacy plugin registry from `src/engine/EngineeringCore.ts`.
3. Preserve `EngineeringCore` as an orchestration/compatibility facade.
4. Preserve all Dreux-Gorisse formulas and method implementation files unchanged.
5. Keep unknown methods explicitly blocked with reason code `UNKNOWN_METHOD`.
6. Prevent placeholder ACI/DOE/EN-206 adapters from being advertised as active engines.
7. Add regression coverage for the unified boundary.
8. Add baseline accessibility smoke coverage for AR/FR/EN and semantic controls.
9. Keep laboratory/AI governance behavior unchanged unless required by the above boundary cleanup.

## Acceptance gate

This repair is not considered complete until lint, unit tests, production build, E2E, and the accessibility smoke test pass on the repair branch.
