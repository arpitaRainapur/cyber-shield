import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { LOCALIZED_SCENARIOS, LOCALIZED_TUTORIALS } from './data/localizedContent';
import { getLanguageMeta } from './i18n/languages';
import { auth, testFirestoreConnection } from './lib/firebase';
import { CaregiverPage } from './pages/CaregiverPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmergencyPage } from './pages/EmergencyPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';
import { ScamCheckerPage } from './pages/ScamCheckerPage';
import { SettingsPage } from './pages/SettingsPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { TutorialsPage } from './pages/TutorialsPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { WelcomePage } from './pages/WelcomePage';
import {
  ensureVerifiedUserProfile,
  fetchUserProgress,
  fetchUserSimulations,
  updateUserPreferences,
} from './services/firestoreData';
import { stopSpeech } from './services/voice';
import { AuthUser, LangCode, PageRoute, TutorialItem, UserRole } from './types';

const PUBLIC_PAGES: PageRoute[] = ['welcome', 'login', 'register'];

function readSavedLanguage(): LangCode {
  try {
    return localStorage.getItem('cybershield_guest_lang') || 'en';
  } catch {
    return 'en';
  }
}

function readPendingProfile(): {
  fullName?: string;
  mobileNumber?: string;
  preferredLanguage?: LangCode;
  role?: UserRole;
} | undefined {
  try {
    const raw = localStorage.getItem('cybershield_pending_profile');
    if (!raw) return undefined;
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function CyberShieldShell() {
  const [currentPage, setCurrentPage] = useState<PageRoute>('welcome');
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [lang, setLang] = useState<LangCode>(readSavedLanguage);
  const [largeText, setLargeText] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const [progressMap, setProgressMap] = useState<Record<string, { completed: boolean; voiceListened: boolean }>>({});
  const [quizMap, setQuizMap] = useState<Record<string, { score: number; totalQuestions: number; takenAt: string }>>({});
  const [simStats, setSimStats] = useState({ totalAttempts: 0, correctAttempts: 0, uniqueMastered: 0 });

  const pendingMetaRef = useRef<{
    fullName?: string;
    mobileNumber?: string;
    preferredLanguage?: LangCode;
    role?: UserRole;
  } | undefined>(readPendingProfile());
  const loggingOutRef = useRef(false);

  const loadUserEducationalProgress = useCallback(async (uid: string) => {
    const [progRes, simRes] = await Promise.all([
      fetchUserProgress(uid),
      fetchUserSimulations(uid),
    ]);
    setProgressMap(progRes.progressMap);
    setQuizMap(progRes.quizMap);
    const uniqueMastered = Object.values(simRes.latestByScenario).filter((a) => a.isCorrect).length;
    setSimStats({
      totalAttempts: simRes.totalAttempts,
      correctAttempts: simRes.correctAttempts,
      uniqueMastered,
    });
  }, []);

  const activateVerifiedUser = useCallback(
    async (fbUser: User) => {
      const pending = pendingMetaRef.current || readPendingProfile();
      const guestLang = readSavedLanguage();
      const profile = await ensureVerifiedUserProfile(fbUser, {
        fullName: pending?.fullName,
        mobileNumber: pending?.mobileNumber,
        preferredLanguage: pending?.preferredLanguage || guestLang,
        role: pending?.role || 'senior',
      });

      try {
        localStorage.removeItem('cybershield_pending_profile');
      } catch {
        // Ignore storage error
      }
      pendingMetaRef.current = undefined;

      setFirebaseUser(fbUser);
      setUser(profile);
      setLang(profile.preferredLanguage || guestLang || 'en');
      setLargeText(profile.largeText);
      await loadUserEducationalProgress(fbUser.uid);

      setCurrentPage((prev) =>
        PUBLIC_PAGES.includes(prev) || prev === 'verify' ? 'dashboard' : prev
      );
    },
    [loadUserEducationalProgress]
  );

  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (!fbUser) {
          setFirebaseUser(null);
          setUser(null);
          setProgressMap({});
          setQuizMap({});
          setSimStats({ totalAttempts: 0, correctAttempts: 0, uniqueMastered: 0 });
          if (loggingOutRef.current) {
            loggingOutRef.current = false;
            setCurrentPage('login');
          } else {
            setCurrentPage((prev) => (PUBLIC_PAGES.includes(prev) ? prev : 'welcome'));
          }
        } else if (!fbUser.emailVerified) {
          setFirebaseUser(fbUser);
          setUser(null);
          setCurrentPage('verify');
        } else {
          await activateVerifiedUser(fbUser);
        }
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, [activateVerifiedUser]);

  // Sync document direction (RTL for Urdu/Arabic) & HTML lang attribute
  useEffect(() => {
    const meta = getLanguageMeta(lang);
    document.documentElement.dir = meta.rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const handleLanguageChange = async (newLang: LangCode) => {
    setLang(newLang);
    try {
      localStorage.setItem('cybershield_guest_lang', newLang);
    } catch {
      // Ignore storage error
    }
    if (user && firebaseUser?.emailVerified) {
      setUser((prev) => (prev ? { ...prev, preferredLanguage: newLang } : prev));
      await updateUserPreferences(user.uid, { preferredLanguage: newLang }).catch(() => {});
    }
  };

  const handleToggleLargeText = async () => {
    const next = !largeText;
    setLargeText(next);
    if (user && firebaseUser?.emailVerified) {
      setUser((prev) => (prev ? { ...prev, largeText: next } : prev));
      await updateUserPreferences(user.uid, { largeText: next }).catch(() => {});
    }
  };

  const handleSpeechRateChange = async (rate: number) => {
    if (user && firebaseUser?.emailVerified) {
      setUser((prev) => (prev ? { ...prev, speechRate: rate } : prev));
      await updateUserPreferences(user.uid, { speechRate: rate }).catch(() => {});
    }
  };

  const handleSignOut = async () => {
    stopSpeech();
    loggingOutRef.current = true;
    await signOut(auth);
    setFirebaseUser(null);
    setUser(null);
    setCurrentPage('login');
  };

  const handleNavigate = (target: PageRoute) => {
    stopSpeech();
    // Enforce authentication & email verification strictly before entering dashboard pages
    if (!firebaseUser) {
      if (PUBLIC_PAGES.includes(target)) {
        setCurrentPage(target);
      } else {
        setCurrentPage('login');
      }
      return;
    }
    if (!firebaseUser.emailVerified) {
      setCurrentPage('verify');
      return;
    }
    setCurrentPage(target);
  };

  const tutorials: TutorialItem[] = useMemo(() => {
    return LOCALIZED_TUTORIALS.map((tut) => ({
      ...tut,
      progress: {
        completed: Boolean(progressMap[tut.slug]?.completed),
        voiceListened: Boolean(progressMap[tut.slug]?.voiceListened),
        completedAt: null,
      },
      latestQuizResult: quizMap[tut.slug] || null,
    }));
  }, [progressMap, quizMap]);

  const completedTutorialsCount = tutorials.filter((t) => t.progress.completed).length;
  const isVerifiedAuthenticated = Boolean(firebaseUser && firebaseUser.emailVerified && user);

  // Strict guarded active view
  const renderPage = () => {
    if (!authReady) {
      return (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-600">
          Loading CyberShield...
        </div>
      );
    }

    if (!firebaseUser) {
      if (currentPage === 'login') {
        return <LoginPage lang={lang} onNavigate={handleNavigate} />;
      }
      if (currentPage === 'register') {
        return (
          <RegisterPage
            lang={lang}
            onLanguageChange={handleLanguageChange}
            onNavigate={handleNavigate}
            onRegistrationMetaSaved={(meta) => {
              pendingMetaRef.current = meta;
            }}
          />
        );
      }
      return (
        <WelcomePage
          lang={lang}
          onLanguageChange={handleLanguageChange}
          onNavigate={handleNavigate}
        />
      );
    }

    if (!firebaseUser.emailVerified || !user) {
      return (
        <VerifyEmailPage
          lang={lang}
          email={firebaseUser.email || ''}
          onVerified={async () => {
            if (auth.currentUser?.emailVerified) {
              await activateVerifiedUser(auth.currentUser);
            }
          }}
          onLogout={handleSignOut}
        />
      );
    }

    switch (currentPage) {
      case 'tutorials':
        return (
          <TutorialsPage
            lang={lang}
            user={user}
            tutorials={tutorials}
            simStats={simStats}
            onRefreshProgress={() => loadUserEducationalProgress(user.uid)}
          />
        );
      case 'simulator':
        return (
          <SimulatorPage
            lang={lang}
            user={user}
            completedTutorialsCount={completedTutorialsCount}
            totalTutorials={tutorials.length}
            onRefreshProgress={() => loadUserEducationalProgress(user.uid)}
          />
        );
      case 'checker':
        return <ScamCheckerPage lang={lang} user={user} />;
      case 'emergency':
        return <EmergencyPage lang={lang} user={user} onUserUpdated={setUser} />;
      case 'caregiver':
        return <CaregiverPage lang={lang} user={user} />;
      case 'settings':
        return (
          <SettingsPage
            lang={lang}
            user={user}
            largeText={largeText}
            onLanguageChange={handleLanguageChange}
            onToggleLargeText={handleToggleLargeText}
            onSpeechRateChange={handleSpeechRateChange}
            onUserUpdated={setUser}
          />
        );
      case 'profile':
        return <ProfilePage lang={lang} user={user} onUserUpdated={setUser} />;
      case 'dashboard':
      default:
        return (
          <DashboardPage
            lang={lang}
            user={user}
            onNavigate={handleNavigate}
            onSignOut={handleSignOut}
            completedTutorialsCount={completedTutorialsCount}
            totalTutorials={tutorials.length}
            simCorrectCount={simStats.uniqueMastered}
            totalScenarios={LOCALIZED_SCENARIOS.length}
          />
        );
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 text-slate-900 ${largeText ? 'senior-large-text' : ''}`}>
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        user={user}
        emailVerified={Boolean(firebaseUser?.emailVerified)}
        lang={lang}
        largeText={largeText}
        onToggleLargeText={handleToggleLargeText}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {renderPage()}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-600">
          <p>CyberShield — Educational Digital Safety Assistant for Senior Citizens</p>
          <div className="flex flex-wrap items-center gap-6">
            {isVerifiedAuthenticated ? (
              <button
                type="button"
                onClick={() => handleNavigate('emergency')}
                className="font-semibold text-rose-800 hover:underline cursor-pointer"
              >
                National Cybercrime Helpline: 1930
              </button>
            ) : (
              <a href="tel:1930" className="font-semibold text-rose-800 hover:underline">
                National Cybercrime Helpline: 1930
              </a>
            )}
            <a
              href="https://cybercrime.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sky-800 hover:underline"
            >
              cybercrime.gov.in
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <CyberShieldShell />
    </ErrorBoundary>
  );
}
