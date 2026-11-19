import { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  AuthUser,
  CaregiverLinkItem,
  ConsentInviteItem,
  LangCode,
  ScamHistoryItem,
  UserRole,
} from '../types';

function clampString(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

export async function ensureVerifiedUserProfile(
  fbUser: User,
  defaults?: {
    fullName?: string;
    mobileNumber?: string;
    preferredLanguage?: LangCode;
    role?: UserRole;
  }
): Promise<AuthUser> {
  const userPath = `users/${fbUser.uid}`;
  const privatePath = `users/${fbUser.uid}/private/info`;

  let profileData: Record<string, unknown> | null = null;
  let privateData: Record<string, unknown> | null = null;

  try {
    const snap = await getDoc(doc(db, 'users', fbUser.uid));
    if (snap.exists()) {
      profileData = snap.data();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, userPath);
  }

  try {
    const privSnap = await getDoc(doc(db, 'users', fbUser.uid, 'private', 'info'));
    if (privSnap.exists()) {
      privateData = privSnap.data();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, privatePath);
  }

  const displayName =
    clampString(profileData?.displayName, 100) ||
    clampString(defaults?.fullName, 100) ||
    clampString(fbUser.displayName, 100) ||
    clampString(fbUser.email?.split('@')[0], 100) ||
    'CyberShield User';

  const safeDisplayName = displayName.length >= 2 ? displayName : `${displayName} User`;
  const role: UserRole = profileData?.role === 'caregiver' || defaults?.role === 'caregiver' ? 'caregiver' : 'senior';
  const preferredLanguage: LangCode =
    clampString(profileData?.preferredLanguage, 10) ||
    clampString(defaults?.preferredLanguage, 10) ||
    'en';
  const largeText = typeof profileData?.largeText === 'boolean' ? profileData.largeText : false;
  const speechRate = typeof profileData?.speechRate === 'number' ? profileData.speechRate : 0.84;

  if (!profileData) {
    try {
      await setDoc(doc(db, 'users', fbUser.uid), {
        uid: fbUser.uid,
        displayName: safeDisplayName,
        role,
        preferredLanguage,
        largeText,
        speechRate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, userPath);
    }
  }

  const email = clampString(fbUser.email, 180) || clampString(privateData?.email, 180) || 'user@example.com';
  const mobileNumber = clampString(privateData?.mobileNumber, 24) || clampString(defaults?.mobileNumber, 24);
  const emergencyContactNote = clampString(privateData?.emergencyContactNote, 300);

  if (!privateData) {
    try {
      await setDoc(doc(db, 'users', fbUser.uid, 'private', 'info'), {
        uid: fbUser.uid,
        email,
        mobileNumber,
        emergencyContactNote,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, privatePath);
    }
  }

  return {
    uid: fbUser.uid,
    fullName: safeDisplayName,
    email,
    emailVerified: fbUser.emailVerified,
    mobileNumber,
    role,
    preferredLanguage,
    largeText,
    speechRate,
    recoveryNote: emergencyContactNote,
  };
}

export async function updateUserPreferences(
  uid: string,
  updates: {
    displayName?: string;
    role?: UserRole;
    preferredLanguage?: LangCode;
    largeText?: boolean;
    speechRate?: number;
  }
): Promise<void> {
  const path = `users/${uid}`;
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (updates.displayName !== undefined) payload.displayName = clampString(updates.displayName, 100);
  if (updates.role !== undefined) payload.role = updates.role;
  if (updates.preferredLanguage !== undefined) payload.preferredLanguage = clampString(updates.preferredLanguage, 10);
  if (updates.largeText !== undefined) payload.largeText = Boolean(updates.largeText);
  if (updates.speechRate !== undefined) {
    payload.speechRate = Math.max(0.5, Math.min(1.5, Number(updates.speechRate)));
  }

  try {
    await updateDoc(doc(db, 'users', uid), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function updateUserPrivateProfile(
  uid: string,
  updates: {
    email: string;
    mobileNumber?: string;
    emergencyContactNote?: string;
  }
): Promise<void> {
  const path = `users/${uid}/private/info`;
  try {
    await updateDoc(doc(db, 'users', uid, 'private', 'info'), {
      email: clampString(updates.email, 180),
      mobileNumber: clampString(updates.mobileNumber, 24),
      emergencyContactNote: clampString(updates.emergencyContactNote, 300),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function fetchUserProgress(uid: string): Promise<{
  progressMap: Record<string, { completed: boolean; voiceListened: boolean }>;
  quizMap: Record<string, { score: number; totalQuestions: number; takenAt: string }>;
}> {
  const progPath = `users/${uid}/learning_progress`;
  const quizPath = `users/${uid}/quiz_results`;
  const progressMap: Record<string, { completed: boolean; voiceListened: boolean }> = {};
  const quizMap: Record<string, { score: number; totalQuestions: number; takenAt: string }> = {};

  try {
    const snap = await getDocs(
      query(collection(db, 'users', uid, 'learning_progress'), where('userId', '==', uid))
    );
    snap.forEach((d) => {
      const data = d.data();
      progressMap[String(data.tutorialId)] = {
        completed: Boolean(data.completed),
        voiceListened: Boolean(data.voiceListened),
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, progPath);
  }

  try {
    const qSnap = await getDocs(
      query(
        collection(db, 'users', uid, 'quiz_results'),
        where('userId', '==', uid),
        orderBy('takenAt', 'asc')
      )
    );
    qSnap.forEach((d) => {
      const data = d.data();
      quizMap[String(data.tutorialId)] = {
        score: Number(data.score),
        totalQuestions: Number(data.totalQuestions),
        takenAt: data.takenAt?.toDate ? data.takenAt.toDate().toISOString() : new Date().toISOString(),
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, quizPath);
  }

  return { progressMap, quizMap };
}

export async function saveUserTutorialProgress(
  uid: string,
  tutorialSlug: string,
  flags: { completed?: boolean; voiceListened?: boolean },
  currentExisting?: { completed: boolean; voiceListened: boolean }
): Promise<void> {
  const path = `users/${uid}/learning_progress/${tutorialSlug}`;
  const docRef = doc(db, 'users', uid, 'learning_progress', tutorialSlug);
  const completed = Boolean(currentExisting?.completed || flags.completed);
  const voiceListened = Boolean(currentExisting?.voiceListened || flags.voiceListened);

  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, {
        userId: uid,
        tutorialId: tutorialSlug,
        completed,
        voiceListened,
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, {
        completed,
        voiceListened,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveUserQuizResult(
  uid: string,
  tutorialSlug: string,
  tutorialTitle: string,
  score: number,
  totalQuestions: number
): Promise<void> {
  const path = `users/${uid}/quiz_results`;
  try {
    await addDoc(collection(db, 'users', uid, 'quiz_results'), {
      userId: uid,
      tutorialId: tutorialSlug,
      tutorialTitle: clampString(tutorialTitle, 200),
      score,
      totalQuestions,
      takenAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function fetchUserSimulations(uid: string): Promise<{
  latestByScenario: Record<string, { selectedOptionId: string; isCorrect: boolean }>;
  totalAttempts: number;
  correctAttempts: number;
}> {
  const path = `users/${uid}/simulation_results`;
  const latestByScenario: Record<string, { selectedOptionId: string; isCorrect: boolean }> = {};
  let totalAttempts = 0;
  let correctAttempts = 0;

  try {
    const snap = await getDocs(
      query(
        collection(db, 'users', uid, 'simulation_results'),
        where('userId', '==', uid),
        orderBy('attemptedAt', 'asc')
      )
    );
    snap.forEach((d) => {
      const data = d.data();
      latestByScenario[String(data.scenarioId)] = {
        selectedOptionId: String(data.selectedOptionId),
        isCorrect: Boolean(data.isCorrect),
      };
      totalAttempts += 1;
      if (data.isCorrect) correctAttempts += 1;
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }

  return { latestByScenario, totalAttempts, correctAttempts };
}

export async function saveUserSimulationAttempt(
  uid: string,
  scenarioId: string,
  selectedOptionId: string,
  isCorrect: boolean
): Promise<void> {
  const path = `users/${uid}/simulation_results`;
  try {
    await addDoc(collection(db, 'users', uid, 'simulation_results'), {
      userId: uid,
      scenarioId: clampString(scenarioId, 64),
      selectedOptionId: clampString(selectedOptionId, 64),
      isCorrect,
      attemptedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function fetchUserScamChecks(uid: string): Promise<ScamHistoryItem[]> {
  const path = `users/${uid}/scam_checks`;
  const items: ScamHistoryItem[] = [];
  try {
    const snap = await getDocs(
      query(
        collection(db, 'users', uid, 'scam_checks'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc')
      )
    );
    snap.forEach((d) => {
      const data = d.data();
      items.push({
        id: d.id,
        inputType: String(data.inputType),
        contentExcerpt: String(data.contentExcerpt),
        riskLevel: data.riskLevel as 'Low' | 'Medium' | 'High',
        riskScore: Number(data.riskScore),
        matchedPatterns: Array.isArray(data.matchedPatterns) ? data.matchedPatterns : [],
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : '',
      });
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
  return items;
}

export async function saveUserScamCheck(
  uid: string,
  payload: {
    inputType: string;
    content: string;
    riskLevel: 'Low' | 'Medium' | 'High';
    riskScore: number;
    suspiciousTerms: string[];
  }
): Promise<void> {
  const path = `users/${uid}/scam_checks`;
  const excerpt = clampString(payload.content, 180) || 'Check';
  const patterns = payload.suspiciousTerms.slice(0, 20).map((s) => clampString(s, 180));
  try {
    await addDoc(collection(db, 'users', uid, 'scam_checks'), {
      userId: uid,
      inputType: ['sms', 'whatsapp', 'email', 'url', 'message'].includes(payload.inputType)
        ? payload.inputType
        : 'message',
      contentExcerpt: excerpt,
      riskLevel: payload.riskLevel,
      riskScore: Math.max(0, Math.min(100, Math.round(payload.riskScore))),
      matchedPatterns: patterns,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function clearUserScamChecks(uid: string): Promise<void> {
  const path = `users/${uid}/scam_checks`;
  try {
    const snap = await getDocs(
      query(collection(db, 'users', uid, 'scam_checks'), where('userId', '==', uid))
    );
    const batch = writeBatch(db);
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function syncSeniorCaregiverLinks(
  seniorUid: string,
  seniorName: string,
  stats: {
    tutorialsCompletedCount: number;
    totalTutorials: number;
    simTotalAttempts: number;
    simCorrectAttempts: number;
    simUniqueMastered: number;
  }
): Promise<void> {
  const path = 'caregiver_links';
  try {
    const snap = await getDocs(
      query(collection(db, 'caregiver_links'), where('seniorUid', '==', seniorUid), where('status', '==', 'granted'))
    );
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.forEach((d) => {
      batch.update(d.ref, {
        seniorName: clampString(seniorName, 100),
        tutorialsCompletedCount: stats.tutorialsCompletedCount,
        totalTutorials: stats.totalTutorials,
        simTotalAttempts: stats.simTotalAttempts,
        simCorrectAttempts: stats.simCorrectAttempts,
        simUniqueMastered: stats.simUniqueMastered,
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function createSeniorConsentInvite(
  seniorUid: string,
  seniorName: string,
  caregiverEmail: string
): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  const path = `consent_invites/${code}`;
  try {
    await setDoc(doc(db, 'consent_invites', code), {
      seniorUid,
      seniorName: clampString(seniorName, 100),
      caregiverEmail: clampString(caregiverEmail, 180).toLowerCase(),
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
  return code;
}

export async function fetchSeniorConsents(seniorUid: string): Promise<{
  invites: ConsentInviteItem[];
  links: CaregiverLinkItem[];
}> {
  const invites: ConsentInviteItem[] = [];
  const links: CaregiverLinkItem[] = [];

  try {
    const invSnap = await getDocs(
      query(collection(db, 'consent_invites'), where('seniorUid', '==', seniorUid))
    );
    invSnap.forEach((d) => {
      const data = d.data();
      invites.push({
        inviteCode: d.id,
        seniorUid: String(data.seniorUid),
        seniorName: String(data.seniorName),
        caregiverEmail: String(data.caregiverEmail),
        status: data.status as 'pending' | 'claimed' | 'revoked',
      });
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'consent_invites');
  }

  try {
    const linkSnap = await getDocs(
      query(collection(db, 'caregiver_links'), where('seniorUid', '==', seniorUid))
    );
    linkSnap.forEach((d) => {
      const data = d.data();
      links.push({
        linkId: d.id,
        seniorUid: String(data.seniorUid),
        caregiverUid: String(data.caregiverUid),
        inviteCode: String(data.inviteCode),
        seniorName: String(data.seniorName),
        caregiverEmail: String(data.caregiverEmail),
        status: data.status as 'granted' | 'revoked',
        tutorialsCompletedCount: Number(data.tutorialsCompletedCount),
        totalTutorials: Number(data.totalTutorials),
        simTotalAttempts: Number(data.simTotalAttempts),
        simCorrectAttempts: Number(data.simCorrectAttempts),
        simUniqueMastered: Number(data.simUniqueMastered),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : '',
      });
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'caregiver_links');
  }

  return { invites, links };
}

export async function revokeInvite(inviteCode: string): Promise<void> {
  const path = `consent_invites/${inviteCode}`;
  try {
    await updateDoc(doc(db, 'consent_invites', inviteCode), {
      status: 'revoked',
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function revokeCaregiverLink(linkId: string): Promise<void> {
  const path = `caregiver_links/${linkId}`;
  try {
    await updateDoc(doc(db, 'caregiver_links', linkId), {
      status: 'revoked',
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function claimConsentInvite(
  caregiverUid: string,
  caregiverEmail: string,
  inviteCode: string
): Promise<void> {
  const code = inviteCode.trim().toUpperCase();
  const invRef = doc(db, 'consent_invites', code);

  let invData: Record<string, unknown> | null = null;
  try {
    const snap = await getDoc(invRef);
    if (!snap.exists()) {
      throw new Error('Invite code not found or you are not authorized for this code.');
    }
    invData = snap.data();
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `consent_invites/${code}`);
  }

  if (!invData || invData.status !== 'pending') {
    throw new Error('This consent code has already been claimed or revoked.');
  }

  const seniorUid = String(invData.seniorUid);
  const seniorName = clampString(invData.seniorName, 100) || 'Senior Citizen';
  const linkId = `${seniorUid}_${caregiverUid}`;
  const linkRef = doc(db, 'caregiver_links', linkId);

  try {
    const batch = writeBatch(db);
    batch.update(invRef, {
      status: 'claimed',
      updatedAt: serverTimestamp(),
    });
    batch.set(linkRef, {
      seniorUid,
      caregiverUid,
      inviteCode: code,
      seniorName,
      caregiverEmail: clampString(caregiverEmail, 180),
      status: 'granted',
      tutorialsCompletedCount: 0,
      totalTutorials: 5,
      simTotalAttempts: 0,
      simCorrectAttempts: 0,
      simUniqueMastered: 0,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `caregiver_links/${linkId}`);
  }
}

export async function fetchCaregiverLinks(caregiverUid: string): Promise<CaregiverLinkItem[]> {
  const links: CaregiverLinkItem[] = [];
  try {
    const snap = await getDocs(
      query(
        collection(db, 'caregiver_links'),
        where('caregiverUid', '==', caregiverUid),
        where('status', '==', 'granted')
      )
    );
    snap.forEach((d) => {
      const data = d.data();
      links.push({
        linkId: d.id,
        seniorUid: String(data.seniorUid),
        caregiverUid: String(data.caregiverUid),
        inviteCode: String(data.inviteCode),
        seniorName: String(data.seniorName),
        caregiverEmail: String(data.caregiverEmail),
        status: 'granted',
        tutorialsCompletedCount: Number(data.tutorialsCompletedCount),
        totalTutorials: Number(data.totalTutorials),
        simTotalAttempts: Number(data.simTotalAttempts),
        simCorrectAttempts: Number(data.simCorrectAttempts),
        simUniqueMastered: Number(data.simUniqueMastered),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : '',
      });
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'caregiver_links');
  }
  return links;
}

export async function deleteScamCheckDoc(uid: string, checkId: string): Promise<void> {
  const path = `users/${uid}/scam_checks/${checkId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'scam_checks', checkId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
