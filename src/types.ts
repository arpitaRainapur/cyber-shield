export type LangCode = string;
export type UserRole = 'senior' | 'caregiver';

export type PageRoute =
  | 'welcome'
  | 'login'
  | 'register'
  | 'verify'
  | 'dashboard'
  | 'tutorials'
  | 'simulator'
  | 'checker'
  | 'emergency'
  | 'caregiver'
  | 'settings'
  | 'profile';

export interface AuthUser {
  uid: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
  mobileNumber: string;
  role: UserRole;
  preferredLanguage: LangCode;
  largeText: boolean;
  speechRate: number;
  recoveryNote: string;
}

export interface QuizQuestion {
  id: string;
  question: Record<string, string>;
  options: Record<string, string[]>;
  correctIndex: number;
}

export interface TutorialItem {
  id: number;
  slug: string;
  category: string;
  orderIndex: number;
  imageUrl: string;
  title: Record<string, string>;
  summary: Record<string, string>;
  script: Record<string, string>;
  tips: Record<string, string[]>;
  quiz: QuizQuestion[];
  progress: {
    completed: boolean;
    voiceListened: boolean;
    completedAt: string | null;
  };
  latestQuizResult: {
    score: number;
    totalQuestions: number;
    takenAt: string;
  } | null;
}

export interface SimulationScenario {
  id: string;
  channel: 'SMS' | 'Phone Call' | 'WhatsApp' | 'Email';
  senderLabel: Record<string, string>;
  title: Record<string, string>;
  messageBody: Record<string, string>;
  options: Array<{
    id: string;
    label: Record<string, string>;
  }>;
  correctOptionId: string;
  explanation: Record<string, string>;
  warningSigns: Record<string, string[]>;
  recommendedAction: Record<string, string>;
}

export interface ScamAnalysisResult {
  riskLevel: 'Low' | 'Medium' | 'High';
  riskScore: number;
  engineLabel: string;
  isBaseline: true;
  suspiciousTerms: string[];
  urlFindings: Array<{
    url: string;
    flags: string[];
  }>;
  warningSigns: Record<string, string[]>;
  recommendedAction: Record<string, string>;
  safetyDisclaimer: Record<string, string>;
  neverOpenedUrlNotice: boolean;
}

export interface ScamHistoryItem {
  id: string;
  inputType: string;
  contentExcerpt: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  riskScore: number;
  matchedPatterns: string[];
  createdAt: string;
}

export interface ConsentInviteItem {
  inviteCode: string;
  seniorUid: string;
  seniorName: string;
  caregiverEmail: string;
  status: 'pending' | 'claimed' | 'revoked';
}

export interface CaregiverLinkItem {
  linkId: string;
  seniorUid: string;
  caregiverUid: string;
  inviteCode: string;
  seniorName: string;
  caregiverEmail: string;
  status: 'granted' | 'revoked';
  tutorialsCompletedCount: number;
  totalTutorials: number;
  simTotalAttempts: number;
  simCorrectAttempts: number;
  simUniqueMastered: number;
  updatedAt: string;
}
