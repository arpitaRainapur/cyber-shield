import {
  BookOpen,
  CheckCircle2,
  Globe,
  LogOut,
  PhoneCall,
  SearchCheck,
  ShieldAlert,
  ShieldCheck,
  UserCircle2,
  Users,
  Volume2,
} from 'lucide-react';
import { useEffect } from 'react';
import { SafeImage } from '../components/SafeImage';
import { getLanguageMeta } from '../i18n/languages';
import { tr } from '../i18n/translations';
import { speakText, stopSpeech } from '../services/voice';
import { AuthUser, LangCode, PageRoute } from '../types';

interface DashboardPageProps {
  lang: LangCode;
  user: AuthUser;
  onNavigate: (page: PageRoute) => void;
  onSignOut: () => Promise<void>;
  completedTutorialsCount: number;
  totalTutorials: number;
  simCorrectCount: number;
  totalScenarios: number;
}

export function DashboardPage({
  lang,
  user,
  onNavigate,
  onSignOut,
  completedTutorialsCount,
  totalTutorials,
  simCorrectCount,
  totalScenarios,
}: DashboardPageProps) {
  const langMeta = getLanguageMeta(lang);

  useEffect(() => {
    return () => stopSpeech();
  }, []);

  const handleSpeakDashboard = () => {
    speakText(
      `${tr(lang, 'dashboardWelcome')}, ${user.fullName}. ${tr(lang, 'dashboardSubtitle')}`,
      lang,
      user.speechRate || 0.84
    );
  };

  const quickModules: Array<{
    id: PageRoute;
    title: string;
    desc: string;
    icon: typeof BookOpen;
    accent: string;
    badge?: string;
  }> = [
    {
      id: 'tutorials',
      title: tr(lang, 'cardTutorialsTitle'),
      desc: tr(lang, 'cardTutorialsDesc'),
      icon: BookOpen,
      accent: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badge: `${completedTutorialsCount}/${totalTutorials}`,
    },
    {
      id: 'checker',
      title: tr(lang, 'cardCheckerTitle'),
      desc: tr(lang, 'cardCheckerDesc'),
      icon: SearchCheck,
      accent: 'bg-sky-50 text-sky-800 border-sky-200',
    },
    {
      id: 'simulator',
      title: tr(lang, 'cardAwarenessTitle'),
      desc: tr(lang, 'cardAwarenessDesc'),
      icon: ShieldAlert,
      accent: 'bg-amber-50 text-amber-800 border-amber-200',
      badge: `${simCorrectCount}/${totalScenarios}`,
    },
    {
      id: 'emergency',
      title: tr(lang, 'cardEmergencyTitle'),
      desc: tr(lang, 'cardEmergencyDesc'),
      icon: PhoneCall,
      accent: 'bg-rose-50 text-rose-800 border-rose-200',
    },
    {
      id: 'settings',
      title: tr(lang, 'cardLanguageTitle'),
      desc: tr(lang, 'cardLanguageDesc'),
      icon: Globe,
      accent: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badge: langMeta.nativeName,
    },
    {
      id: 'profile',
      title: tr(lang, 'cardProfileTitle'),
      desc: tr(lang, 'cardProfileDesc'),
      icon: UserCircle2,
      accent: 'bg-sky-50 text-sky-800 border-sky-200',
    },
    {
      id: 'caregiver',
      title: tr(lang, 'cardCaregiverTitle'),
      desc: tr(lang, 'cardCaregiverDesc'),
      icon: Users,
      accent: 'bg-slate-100 text-slate-800 border-slate-200',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-8 p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-emerald-800">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                  <span>{user.role === 'senior' ? tr(lang, 'roleSenior') : tr(lang, 'roleCaregiver')}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>Verified Account</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-600">{langMeta.nativeName} ({langMeta.name})</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                {tr(lang, 'dashboardWelcome')}, {user.fullName}
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                {tr(lang, 'dashboardSubtitle')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSpeakDashboard}
                className="inline-flex items-center gap-2.5 px-5 py-3.5 text-base font-bold text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors cursor-pointer"
              >
                <Volume2 className="w-5 h-5 text-sky-700" aria-hidden="true" />
                <span>{tr(lang, 'listenWelcomeBtn')}</span>
              </button>

              <a
                href="tel:1930"
                className="inline-flex items-center gap-2.5 px-5 py-3.5 text-base font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl transition-colors"
              >
                <PhoneCall className="w-5 h-5" aria-hidden="true" />
                <span>1930</span>
              </a>

              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-2 px-5 py-3.5 text-base font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-5 h-5" aria-hidden="true" />
                <span>{tr(lang, 'logoutBtn')}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 bg-emerald-50 min-h-[210px]">
            <SafeImage
              src="/src/assets/images/hero_cybershield_seniors_1795006490603.jpg"
              alt="Senior citizens learning digital safety calmly together"
              className="w-full h-full object-cover"
              fallbackTitle="CyberShield Safety Dashboard"
            />
          </div>
        </div>
      </section>

      {/* Main Dashboard Action Cards */}
      <section aria-label="Safety tools" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {quickModules.map((mod) => {
          const Icon = mod.icon;
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => onNavigate(mod.id)}
              className="group text-left bg-white border border-slate-200 hover:border-emerald-600 rounded-2xl p-6 space-y-4 transition-colors flex flex-col justify-between cursor-pointer"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${mod.accent}`}>
                    <Icon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  {mod.badge && (
                    <span className="text-sm font-bold text-emerald-800 tabular-nums">
                      {mod.badge}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-xl font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                    {mod.title}
                  </h2>
                  <p className="text-base text-slate-600 leading-relaxed">{mod.desc}</p>
                </div>
              </div>
            </button>
          );
        })}

        {/* Direct Logout Card on Dashboard */}
        <button
          type="button"
          onClick={onSignOut}
          className="group text-left bg-slate-50 border border-slate-300 hover:border-rose-500 hover:bg-rose-50/40 rounded-2xl p-6 space-y-4 transition-colors flex flex-col justify-between cursor-pointer"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl border border-slate-300 bg-white text-slate-700 group-hover:text-rose-700 flex items-center justify-center shrink-0">
              <LogOut className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-900 group-hover:text-rose-800 transition-colors">
                {tr(lang, 'logoutBtn')}
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Sign out safely from your CyberShield account when finished.
              </p>
            </div>
          </div>
        </button>
      </section>
    </div>
  );
}
