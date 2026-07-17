# Security Specification (TDD SPEC) - Concrete Mix Design App

## 1. Data Invariants
- A Mix Design cannot be read, updated, or deleted by any user other than its owner (`ownerId`).
- A Custom Material in the warehouse cannot be read, updated, or deleted by any user other than its owner (`ownerId`).
- An unauthenticated user cannot perform any write, update, or read operations on user mixes or custom materials.
- The `ownerId` must match the authenticated user's `uid` during creation and cannot be updated afterwards.
- Timestamps `createdAt` and `updatedAt` must be validated against `request.time`.

## 2. The "Dirty Dozen" Payloads
These payloads attempt to break security rules and should all return `PERMISSION_DENIED`.

1. **Spoofed Owner Creation**: Creating a mix design with a third-party `ownerId` instead of the current authenticated user's ID.
2. **Anonymous Read Attempt**: An unauthenticated user attempting to query or get document `/user_mixes/mix123` or `/user_materials/mat123`.
3. **Anonymous Create Attempt**: An unauthenticated user attempting to create a document in `/user_mixes` or `/user_materials`.
4. **Owner Hijack Update**: An authenticated user trying to update an existing mix design or material owned by another user.
5. **Owner Field Mutation**: An owner trying to transfer ownership by changing the `ownerId` field during an update.
6. **Immutability Bypass**: Modifying `createdAt` during an update.
7. **Junk Character Document ID**: Attempting to write a document with an extremely long or corrupted ID value to bypass security or exhaust resources.
8. **Shadow Field Injection**: Creating a mix with unlisted extra parameters (e.g. `isAdmin: true` or `restrictedValue: "ghost"`).
9. **Invalid Type for Field**: Writing `inputs` as a simple string instead of an object mapping, or setting a number field as a string.
10. **Spoofed Non-verified Email**: Bypassing custom claims or role gates using unverified email tokens (if verified email constraints are set).
11. **Malicious Giant Array/String**: Sending block strings or huge lists exceeding max allowable sizes on any fields to cause wallet exhaustion.
12. **Future Timestamp Spoofing**: Attempting to manually supply a future date-time value for `updatedAt` or `createdAt` bypassing the server lock.

## 3. Test Runner Reference
The test runner ensures a secure lock on `/user_mixes/{mixId}` and `/user_materials/{materialId}`:
- Reject any read or write if `request.auth == null`.
- Reject if `incoming().ownerId != request.auth.uid`.
- Reject on update if `incoming().ownerId != existing().ownerId`.
- Reject if `incoming().createdAt != existing().createdAt` (for mix designs).
- Reject if `incoming().updatedAt != request.time` (where applicable).

