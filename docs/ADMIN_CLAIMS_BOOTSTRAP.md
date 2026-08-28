# Secure Firebase Admin Bootstrap

The production Firestore rules no longer identify administrators by hard-coded email addresses. They require a Firebase Auth custom claim:

```json
{ "admin": true }
```

The claim must also be attached to a verified email account.

## Provisioning rule

Set the claim only from a trusted server environment using Firebase Admin SDK or an equivalent administrative backend. Never expose service-account credentials or an admin-claim endpoint to the browser.

Example server-side operation:

```ts
await getAuth().setCustomUserClaims(uid, { admin: true });
await getAuth().revokeRefreshTokens(uid);
```

After provisioning, the administrator must sign in again so the refreshed ID token contains the claim.

## Why this is required

The client application must not be able to grant itself administrator access. Firestore rules therefore treat the signed custom claim as the authorization boundary and keep approval/status mutations server/rule controlled.
