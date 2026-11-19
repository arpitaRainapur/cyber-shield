import { ArrowRight, Lock, ShieldCheck, UserPlus, Volume2 } from 'lucide-react';
import { LanguageSelector } from '../components/LanguageSelector';
import { SafeImage } from '../components/SafeImage';
import { tr } from '../i18n/translations';
import { speakText } from '../services/voice';
import { LangCode, PageRoute } from '../types';

interface WelcomePageProps {
  lang: LangCode;
  onLanguageChange: (lang: LangCode) => void;
  onNavigate: (page: PageRoute) => void;
}

export function WelcomePage({ lang, onLanguageChange, onNavigate }: WelcomePageProps) {
  const handleSpeakWelcome = () => {
    speakText(
      `${tr(lang, 'welcomeTitle')}. ${tr(lang, 'welcomeSubtitle')} ${tr(lang, 'chooseLanguageTitle')}`,
      lang,
      0.84
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Split Hero Card */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                <span>{tr(lang, 'brand')} · Digital Safety Assistant</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-slate-900 leading-tight">
                {tr(lang, 'welcomeTitle')}
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
                {tr(lang, 'welcomeSubtitle')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSpeakWelcome}
                className="inline-flex items-center gap-2.5 px-5 py-3.5 text-base font-semibold text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors cursor-pointer"
              >
                <Volume2 className="w-5 h-5 text-sky-700" aria-hidden="true" />
                <span>{tr(lang, 'listenWelcomeBtn')}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-emerald-50/60 min-h-[260px]">
            <SafeImage
              src="/src/assets/images/hero_cybershield_seniors_1795006490603.jpg"
              alt="Senior couple smiling peacefully while using CyberShield on a tablet"
              className="w-full h-full object-cover"
              fallbackTitle="CyberShield Digital Safety for Senior Citizens"
            />
          </div>
        </div>
      </section>

      {/* Step 1: Searchable Language Selection + Login / Create Account */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">{tr(lang, 'chooseLanguageTitle')}</h2>
          <LanguageSelector value={lang} onChange={onLanguageChange} />
        </div>

        <hr className="border-slate-200" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Lock className="w-5 h-5 text-emerald-700" aria-hidden="true" />
              <span>Step 2: Sign In or Create Your Account</span>
            </div>
            <p className="text-base text-slate-600">
              Please login or create a free verified account to access tutorials, scam checking, and your private safety dashboard.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="inline-flex items-center gap-2.5 px-7 py-4 text-lg font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors cursor-pointer"
            >
              <span>{tr(lang, 'loginBtn')}</span>
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('register')}
              className="inline-flex items-center gap-2.5 px-7 py-4 text-lg font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors cursor-pointer"
            >
              <UserPlus className="w-5 h-5" aria-hidden="true" />
              <span>{tr(lang, 'createAccountBtn')}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
