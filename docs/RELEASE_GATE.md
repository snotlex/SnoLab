# SnoLab Release Gate

SnoLab is not considered `Production Ready` until every gate below passes in CI or the designated verification environment.

## 1. Static verification
- `npm ci`
- `npm run lint`
- no TypeScript compilation errors

## 2. Automated tests
- `npm test`
- production material governance tests pass
- calculation boundary tests pass
- no regression in legacy compatibility tests

## 3. Production build
- `npm run build`
- application starts successfully from the built artifact
- no unresolved imports or runtime configuration failures

## 4. Firebase security verification
Using Firebase Rules Emulator:
- unauthenticated reads/writes are denied
- user A cannot read/update/delete user B mixes or materials
- ownerId cannot be transferred
- createdAt cannot be rewritten
- non-admin cannot mutate approval/status metadata
- admin actions require the verified `admin` custom claim
- email logs are immutable to clients

## 5. Engineering numerical verification
Run a controlled reference set covering at least:
- C25/30, C30/37, C35/45 ordinary concrete cases
- moisture above absorption and moisture below absorption
- multiple Dmax values
- rounded and crushed aggregate cases
- pumped and non-pumped cases
- admixture water-reduction cases
- SCM cases with measured densities
- rejection cases for missing/incompatible/unapproved materials

Compare:
- fcm28
- W/C
- cement content
- effective water
- batch water
- sand/gravel proportions
- absolute-volume closure
- fresh density

No numerical benchmark is considered passed merely because the output is plausible; it must be compared against an identified engineering reference calculation.

## 6. Browser E2E
Verify the critical workflows end-to-end:
- login/logout and activation state
- material create/edit/import/approval
- only complete approved active materials appear in production calculation selectors
- selecting a concrete type filters incompatible materials
- calculation blocks when required data is absent
- calculation result, journal, charts and PDF report remain consistent
- volume/area quantity workflow is consistent
- language switching does not alter numeric results
- invalid inputs never produce an apparently valid mix

## Final status rule
If any gate above is missing, failed, or not executed, status remains `Needs Major Fixes` or `Release Candidate`, never `Production Ready`.
