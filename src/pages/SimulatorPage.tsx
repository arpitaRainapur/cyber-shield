import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Info,
  MessageSquareWarning,
  PhoneIncoming,
  ShieldCheck,
  Volume2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { LOCALIZED_SCENARIOS } from '../data/localizedContent';
import { getLanguageMeta } from '../i18n/languages';
import { isFullLanguage, pickLocalized, tr } from '../i18n/translations';
import {
  fetchUserSimulations,
  saveUserSimulationAttempt,
  syncSeniorCaregiverLinks,
} from '../services/firestoreData';
import { speakText, stopSpeech } from '../services/voice';
import { AuthUser, LangCode } from '../types';

interface SimulatorPageProps {
  lang: LangCode;
  user: AuthUser;
  completedTutorialsCount: number;
  totalTutorials: number;
  onRefreshProgress: () => Promise<void>;
}

export function SimulatorPage({
  lang,
  user,
  completedTutorialsCount,
  totalTutorials,
  onRefreshProgress,
}: SimulatorPageProps) {
  const scenarios = LOCALIZED_SCENARIOS;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAttempts, setUserAttempts] = useState<
    Record<string, { selectedOptionId: string; isCorrect: boolean }>
  >({});
  const [stats, setStats] = useState({ totalAttempts: 0, correctAttempts: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadSimulations = async () => {
    setLoading(true);
    try {
      const data = await fetchUserSimulations(user.uid);
      setUserAttempts(data.latestByScenario);
      setStats({ totalAttempts: data.totalAttempts, correctAttempts: data.correctAttempts });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSimulations();
    return () => stopSpeech();
  }, [user.uid]);

  const scenario = scenarios[currentIndex];
  const langMeta = getLanguageMeta(lang);

  useEffect(() => {
    stopSpeech();
  }, [currentIndex, scenario?.id]);

  const handleSelectOption = async (optionId: string) => {
    if (!scenario || submitting) return;
    setSubmitting(true);
    const isCorrect = optionId === scenario.correctOptionId;

    try {
      await saveUserSimulationAttempt(user.uid, scenario.id, optionId, isCorrect);
      const refreshed = await fetchUserSimulations(user.uid);
      setUserAttempts(refreshed.latestByScenario);
      setStats({ totalAttempts: refreshed.totalAttempts, correctAttempts: refreshed.correctAttempts });

      if (user.role === 'senior') {
        const uniqueMastered = Object.values(refreshed.latestByScenario).filter((a) => a.isCorrect).length;
        await syncSeniorCaregiverLinks(user.uid, user.fullName, {
          tutorialsCompletedCount: completedTutorialsCount,
          totalTutorials,
          simTotalAttempts: refreshed.totalAttempts,
          simCorrectAttempts: refreshed.correctAttempts,
          simUniqueMastered: uniqueMastered,
        }).catch(() => {});
      }
      await onRefreshProgress();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-600">
        Loading scam awareness scenarios...
      </div>
    );
  }

  if (!scenario) return null;

  const currentAttempt = userAttempts[scenario.id] || null;
  const solvedCount = Object.values(userAttempts).filter((a) => a.isCorrect).length;

  const titleText = pickLocalized(scenario.title, lang) || scenario.title.en;
  const senderText = pickLocalized(scenario.senderLabel, lang) || scenario.senderLabel.en;
  const bodyText = pickLocalized(scenario.messageBody, lang) || scenario.messageBody.en;
  const explanationText = pickLocalized(scenario.explanation, lang) || scenario.explanation.en;
  const warningList = pickLocalized(scenario.warningSigns, lang) || scenario.warningSigns.en;
  const recommendedText = pickLocalized(scenario.recommendedAction, lang) || scenario.recommendedAction.en;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Progress */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-slate-900">{tr(lang, 'cardAwarenessTitle')}</h1>
          <p className="text-base text-slate-600">{tr(lang, 'cardAwarenessDesc')}</p>
        </div>

        <div className="text-right tabular-nums">
          <p className="text-sm font-semibold text-emerald-800">
            Safe Decisions: {solvedCount} / {scenarios.length}
          </p>
          {stats.totalAttempts > 0 && (
            <p className="text-xs text-slate-500">
              Total Practice Attempts: {stats.correctAttempts}/{stats.totalAttempts}
            </p>
          )}
        </div>
      </div>

      {/* Educational Disclaimer */}
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-start gap-3 text-sm text-sky-950">
        <Info className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" aria-hidden="true" />
        <p>{tr(lang, 'simDisclaimer')}</p>
      </div>

      {!isFullLanguage(lang) && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-sm text-amber-950">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            <strong>{langMeta.nativeName}:</strong> {tr(lang, 'fallbackNotice')}
          </p>
        </div>
      )}

      {/* Progress Step Selector */}
      <div className="flex flex-wrap items-center gap-2">
        {scenarios.map((s, idx) => {
          const attempt = userAttempts[s.id];
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`px-3.5 py-2 text-sm font-semibold rounded-lg border transition-colors tabular-nums cursor-pointer ${
                isCurrent
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : attempt?.isCorrect
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {idx + 1}. {s.channel}
            </button>
          );
        })}
      </div>

      {/* Single Scenario Card */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500">
              Scenario {currentIndex + 1} of {scenarios.length} · {scenario.channel}
            </p>
            <h2 className="text-2xl font-bold text-slate-900">{titleText}</h2>
          </div>

          <button
            type="button"
            onClick={() => speakText(`${titleText}. ${bodyText}`, lang, user.speechRate || 0.84)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4" aria-hidden="true" />
            <span>Read Aloud</span>
          </button>
        </div>

        {/* Fictional Incoming Message Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
            {scenario.channel === 'Phone Call' ? (
              <PhoneIncoming className="w-5 h-5 text-amber-700" aria-hidden="true" />
            ) : (
              <MessageSquareWarning className="w-5 h-5 text-amber-700" aria-hidden="true" />
            )}
            <span>{senderText}</span>
          </div>
          <p className="text-lg text-slate-900 leading-relaxed font-medium">{bodyText}</p>
        </div>

        {/* Action Choices */}
        <div className="space-y-3">
          <p className="text-base font-bold text-slate-900">What is the safest action to take?</p>
          <div className="space-y-3">
            {scenario.options.map((opt) => {
              const isSelected = currentAttempt?.selectedOptionId === opt.id;
              const isCorrectOpt = scenario.correctOptionId === opt.id;
              let styleClass = 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50';
              if (currentAttempt) {
                if (isCorrectOpt) {
                  styleClass = 'bg-emerald-50 border-emerald-700 text-emerald-950 font-semibold';
                } else if (isSelected && !currentAttempt.isCorrect) {
                  styleClass = 'bg-rose-50 border-rose-600 text-rose-950';
                }
              }
              const optText = pickLocalized(opt.label, lang) || opt.label.en;

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSelectOption(opt.id)}
                  className={`w-full text-left px-5 py-4 rounded-xl border text-base transition-colors cursor-pointer ${styleClass}`}
                >
                  {optText}
                </button>
              );
            })}
          </div>
        </div>

        {/* Immediate Educational Feedback */}
        {currentAttempt && (
          <div
            className={`rounded-2xl border p-6 space-y-5 ${
              currentAttempt.isCorrect ? 'bg-emerald-50/80 border-emerald-300' : 'bg-amber-50/80 border-amber-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {currentAttempt.isCorrect ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-700 shrink-0" aria-hidden="true" />
              ) : (
                <AlertTriangle className="w-7 h-7 text-amber-700 shrink-0" aria-hidden="true" />
              )}
              <h3 className="text-xl font-bold text-slate-900">
                {currentAttempt.isCorrect ? tr(lang, 'simSafeChoice') : tr(lang, 'simRiskyChoice')}
              </h3>
            </div>

            <p className="text-base text-slate-800 leading-relaxed">{explanationText}</p>

            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-900">{tr(lang, 'simWarningSigns')}</p>
              <ul className="space-y-1.5 text-base text-slate-800 list-disc pl-5">
                {warningList.map((sign, i) => (
                  <li key={i}>{sign}</li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-base font-semibold text-slate-900">
                {tr(lang, 'simRecommended')}: <span className="font-normal">{recommendedText}</span>
              </p>
            </div>
          </div>
        )}

        {/* Next / Previous Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            className="inline-flex items-center gap-2 px-4 py-3 text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 border border-slate-300 rounded-xl cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>{tr(lang, 'simPrev')}</span>
          </button>

          <button
            type="button"
            disabled={currentIndex === scenarios.length - 1}
            onClick={() => setCurrentIndex((prev) => Math.min(scenarios.length - 1, prev + 1))}
            className="inline-flex items-center gap-2 px-5 py-3 text-base font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 rounded-xl cursor-pointer"
          >
            <span>{tr(lang, 'simNext')}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
}
