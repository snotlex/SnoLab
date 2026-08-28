# SnoLab Release Gate

SnoLab is not considered `Production Ready` until every gate below passes in CI or the designated verification environment.

## Static verification
- `npm ci`
- `npm run lint`
- no TypeScript compilation errors

## Automated tests
- `npm test`
- production material governance tests pass
- calculation boundary tests pass
- no regression in legacy compatibility tests

## Production build
- `npm run build`
- application starts successfully from the built artifact
- no unresolved imports or runtime configuration failures

## Firebase security verification
Using Firebase Rules Emulator:
- unauthenticated reads/writes are denied
- user A cannot read/update/delete user B mixes or materials
- ownerId cannot be transferred
- createdAt cannot be rewritten
- non-admin cannot mutate approval/status metadata
- admin actions require the verified `admin` custom claim
- email logs are immutable to clients

## Engineering numerical verification
Run a controlled reference set covering C25/30, C30/37, C35/45, moisture above/below absorption, multiple Dmax values, rounded/crushed aggregates, pumped/non-pumped cases, admixture reduction, SCMs with measured densities, and rejection cases.

Compare fcm28, W/C, cement content, effective water, batch water, sand/gravel proportions, absolute-volume closure, and fresh density against identified engineering reference calculations.

## Browser E2E
Verify login/logout and activation state; material create/edit/import/approval; complete-approved-active material filtering; concrete-type compatibility filtering; calculation blocking on missing data; result/journal/charts/PDF consistency; volume/area quantity workflow; language switching without numeric drift; and invalid inputs never producing an apparently valid mix.

## Final status rule
If any gate is missing, failed, or not executed, status remains `Needs Major Fixes` or `Release Candidate`, never `Production Ready`.
