/**
 * CyberShield Firestore Security Rules Verification Specification (Dirty Dozen)
 * Run against Firebase Emulator Suite (`@firebase/rules-unit-testing`) when testing locally.
 */
export const DIRTY_DOZEN_CASES = [
  { id: 1, name: 'Unauthenticated read on /users/userA', expected: 'PERMISSION_DENIED' },
  { id: 2, name: 'Unverified email write on /users/userA', expected: 'PERMISSION_DENIED' },
  { id: 3, name: 'Cross-user PII read on /users/userA/private/info', expected: 'PERMISSION_DENIED' },
  { id: 4, name: 'UID spoofing on user profile creation', expected: 'PERMISSION_DENIED' },
  { id: 5, name: 'Shadow field injection (isAdmin: true) on user profile', expected: 'PERMISSION_DENIED' },
  { id: 6, name: 'Document ID poisoning (>128 chars) on learning_progress', expected: 'PERMISSION_DENIED' },
  { id: 7, name: 'Client-forged createdAt timestamp instead of request.time', expected: 'PERMISSION_DENIED' },
  { id: 8, name: 'Immutable createdAt tampering on profile update', expected: 'PERMISSION_DENIED' },
  { id: 9, name: 'Cross-user list query on /users/userA/scam_checks', expected: 'PERMISSION_DENIED' },
  { id: 10, name: 'Email spoofing on /consent_invites claim without email_verified', expected: 'PERMISSION_DENIED' },
  { id: 11, name: 'Caregiver read on revoked /caregiver_links document', expected: 'PERMISSION_DENIED' },
  { id: 12, name: 'Forged caregiver_links creation without matching pending consent_invite', expected: 'PERMISSION_DENIED' },
] as const;
