# CyberShield Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. Every document under `/users/{userId}` and its subcollections belongs exclusively to `request.auth.uid == userId` and requires `request.auth.token.email_verified == true`.
2. PII (`email`, `mobileNumber`, `emergencyContactNote`) is strictly isolated in `/users/{userId}/private/info` and is never readable by any other user, including caregivers.
3. Users cannot modify their `uid` or `createdAt` after creation, and must use server timestamps (`request.time`) on `createdAt`/`updatedAt`/`takenAt`/`attemptedAt`.
4. Caregiver access (`caregiver_links/{linkId}`) is strictly gated by `status == 'granted'` and can be revoked immediately by the owning senior (`seniorUid == request.auth.uid`). Once `status == 'revoked'`, the caregiver loses read access synchronously.
5. `consent_invites/{inviteCode}` can only be created or revoked by the senior (`seniorUid == request.auth.uid`) and can only be read/claimed by a verified caregiver whose `request.auth.token.email` matches `caregiverEmail`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. **Unauthenticated Read**: Read `/users/userA` with `auth == null`.
2. **Unverified Email Write**: Create `/users/userA` with `auth.uid == 'userA'` and `auth.token.email_verified == false`.
3. **Cross-User PII Read**: Read `/users/userA/private/info` as `userB` (even if `userB` is a linked caregiver).
4. **UID Spoofing on Create**: Create `/users/userA` with `{ uid: 'userB', ... }` as `userA`.
5. **Shadow / Ghost Field Injection**: Create `/users/userA` with an unexpected field `isAdmin: true`.
6. **ID Poisoning**: Write `/users/userA/learning_progress/${'x'.repeat(200)}` (invalid/oversized ID).
7. **Fake Timestamp**: Create `/users/userA` with `createdAt` set to a client past/future timestamp instead of `request.time`.
8. **Immutable Field Tampering**: Update `/users/userA` changing `createdAt` or `uid`.
9. **Blanket List Scraping**: List `/users` or `/users/userA/scam_checks` as `userB`.
10. **Email Spoofing on Invite Claim**: Claim `/consent_invites/CODE12` as `userB` whose `email_verified` is `false` or whose email differs from `caregiverEmail`.
11. **Caregiver Reading Revoked Link**: Read `/caregiver_links/userA_userB` when `status == 'revoked'` as `userB`.
12. **Oversized Array / String**: Create `/users/userA/scam_checks/chk1` with `matchedPatterns` of 50 items or `contentExcerpt` > 200 chars.
