import { CheckCircle2, Info, Pause, Play, RotateCcw, Square, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SafeImage } from '../components/SafeImage';
import { getLanguageMeta } from '../i18n/languages';
import { isFullLanguage, pickLocalized, tr } from '../i18n/translations';
import {
  saveUserQuizResult,
  saveUserTutorialProgress,
  syncSeniorCaregiverLinks,
} from '../services/firestoreData';
import { isSpeechSynthesisSupported, pauseSpeech, resumeSpeech, speakText, stopSpeech } from '../services/voice';
import { AuthUser, LangCode, TutorialItem } from '../types';

interface TutorialsPageProps {
  lang: LangCode;
  user: AuthUser;
  tutorials: TutorialItem[];
  simStats: { totalAttempts: number; correctAttempts: number; uniqueMastered: number };
  onRefreshProgress: () => Promise<void>;
}

export function TutorialsPage({
  lang,
  user,
  tutorials,
  simStats,
  onRefreshProgress,
}: TutorialsPageProps) {
  const [selectedId, setSelectedId] = useState<number>(tutorials[0]?.id ?? 1);
  const [speechState, setSpeechState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [slowPace, setSlowPace] = useState((user.speechRate || 0.84) <= 0.9);
  const [voiceNote, setVoiceNote] = useState('');
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizFeedback, setQuizFeedback] = useState<{ score: number; total: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const activeTutorial = tutorials.find((tut) => tut.id === selectedId) || tutorials[0];
  const langMeta = getLanguageMeta(lang);

  useEffect(() => {
    if (tutorials.length > 0 && !tutorials.some((tut) => tut.id === selectedId)) {
      setSelectedId(tutorials[0].id);
    }
  }, [tutorials, selectedId]);

  useEffect(() => {
    stopSpeech();
    setSpeechState('idle');
    setVoiceNote('');
    setQuizAnswers({});
    setQuizFeedback(null);
  }, [selectedId, lang]);

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  if (!activeTutorial) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-600">
        Loading safety tutorials...
      </div>
    );
  }

  const titleText = pickLocalized(activeTutorial.title, lang) || activeTutorial.title.en;
  const summaryText = pickLocalized(activeTutorial.summary, lang) || activeTutorial.summary.en;
  const scriptText = pickLocalized(activeTutorial.script, lang) || activeTutorial.script.en;
  const tipsList = pickLocalized(activeTutorial.tips, lang) || activeTutorial.tips.en;
  const spokenContent = `${titleText}. ${summaryText} ${scriptText}`;

  const syncCaregiverSummaryIfSenior = async (nextCompletedDelta = 0) => {
    if (user.role !== 'senior') return;
    const completedCount = tutorials.filter((t) => t.progress.completed).length + nextCompletedDelta;
    await syncSeniorCaregiverLinks(user.uid, user.fullName, {
      tutorialsCompletedCount: Math.min(tutorials.length, completedCount),
      totalTutorials: tutorials.length,
      simTotalAttempts: simStats.totalAttempts,
      simCorrectAttempts: simStats.correctAttempts,
      simUniqueMastered: simStats.uniqueMastered,
    }).catch(() => {});
  };

  const handlePlayVoice = () => {
    if (!isSpeechSynthesisSupported()) {
      setVoiceNote('Browser speech playback is unavailable on this device. Please read the clear text below.');
      return;
    }

    if (speechState === 'paused') {
      resumeSpeech();
      setSpeechState('playing');
      return;
    }

    const res = speakText(spokenContent, lang, slowPace ? 0.82 : 1.0, {
      onStart: () => setSpeechState('playing'),
      onEnd: () => setSpeechState('idle'),
      onError: () => setSpeechState('idle'),
    });

    if (!res.exactVoiceAvailable && lang !== 'en') {
      setVoiceNote(
        `Your browser does not have a native ${langMeta.name} voice pack installed, so playback fell back to ${res.fallbackLocale}. Written guidance remains in ${langMeta.nativeName}.`
      );
    } else {
      setVoiceNote('');
    }

    saveUserTutorialProgress(
      user.uid,
      activeTutorial.slug,
      { voiceListened: true },
      activeTutorial.progress
    )
      .then(() => onRefreshProgress())
      .catch(() => {});
  };

  const handlePauseVoice = () => {
    pauseSpeech();
    setSpeechState('paused');
  };

  const handleStopVoice = () => {
    stopSpeech();
    setSpeechState('idle');
  };

  const handleReplayVoice = () => {
    stopSpeech();
    setTimeout(() => handlePlayVoice(), 60);
  };

  const handleMarkComplete = async () => {
    setSaving(true);
    try {
      const wasCompleted = activeTutorial.progress.completed;
      await saveUserTutorialProgress(
        user.uid,
        activeTutorial.slug,
        { completed: true },
        activeTutorial.progress
      );
      await syncCaregiverSummaryIfSenior(wasCompleted ? 0 : 1);
      await onRefreshProgress();
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(quizAnswers).length < activeTutorial.quiz.length) return;
    let score = 0;
    for (const q of activeTutorial.quiz) {
      if (quizAnswers[q.id] === q.correctIndex) {
        score += 1;
      }
    }

    setSaving(true);
    try {
      const wasCompleted = activeTutorial.progress.completed;
      await saveUserQuizResult(
        user.uid,
        activeTutorial.slug,
        activeTutorial.title.en,
        score,
        activeTutorial.quiz.length
      );
      await saveUserTutorialProgress(
        user.uid,
        activeTutorial.slug,
        { completed: true },
        activeTutorial.progress
      );
      await syncCaregiverSummaryIfSenior(wasCompleted ? 0 : 1);
      setQuizFeedback({ score, total: activeTutorial.quiz.length });
      await onRefreshProgress();
    } finally {
      setSaving(false);
    }
  };

  const completedCount = tutorials.filter((tut) => tut.progress.completed).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-3xl font-bold text-slate-900">{tr(lang, 'cardTutorialsTitle')}</h1>
          <p className="text-base text-slate-600">{tr(lang, 'cardTutorialsDesc')}</p>
        </div>
        <div className="text-sm font-semibold text-emerald-800 tabular-nums">
          {completedCount} / {tutorials.length} {tr(lang, 'completedLabel')}
        </div>
      </div>

      {!isFullLanguage(lang) && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-sm text-amber-950">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            <strong>{langMeta.nativeName} ({langMeta.name}):</strong> {tr(lang, 'fallbackNotice')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Lesson Selector Sidebar */}
        <aside className="lg:col-span-4 space-y-2.5">
          {tutorials.map((tut) => {
            const isSelected = tut.id === activeTutorial.id;
            const itemTitle = pickLocalized(tut.title, lang) || tut.title.en;
            return (
              <button
                key={tut.id}
                type="button"
                onClick={() => setSelectedId(tut.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-colors flex items-start justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-700 text-slate-900'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500">
                    0{tut.orderIndex} · {tut.category}
                  </p>
                  <p className="text-base font-bold leading-snug">{itemTitle}</p>
                </div>
                {tut.progress.completed && (
                  <CheckCircle2
                    className="w-5 h-5 text-emerald-700 shrink-0 mt-1"
                    aria-label={tr(lang, 'completedLabel')}
                  />
                )}
              </button>
            );
          })}
        </aside>

        {/* Active Lesson Stage */}
        <section className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-[4/3]">
              <SafeImage
                src={activeTutorial.imageUrl}
                alt={titleText}
                className="w-full h-full object-cover"
                fallbackTitle={titleText}
              />
            </div>

            <div className="md:col-span-7 space-y-4">
              <p className="text-xs font-medium text-slate-500">
                Lesson 0{activeTutorial.orderIndex} · {activeTutorial.category}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{titleText}</h2>
              <p className="text-base text-slate-700 leading-relaxed">{summaryText}</p>
            </div>
          </div>

          {/* Voice Guidance Controls */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-sky-950 font-bold text-base">
                <Volume2 className="w-5 h-5 text-sky-700" aria-hidden="true" />
                <span>Voice Guidance ({langMeta.nativeName})</span>
              </div>

              <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSlowPace(true)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                    slowPace ? 'bg-sky-700 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {tr(lang, 'paceSlow')}
                </button>
                <button
                  type="button"
                  onClick={() => setSlowPace(false)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                    !slowPace ? 'bg-sky-700 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {tr(lang, 'paceNormal')}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {speechState !== 'playing' ? (
                <button
                  type="button"
                  onClick={handlePlayVoice}
                  className="inline-flex items-center gap-2 px-5 py-3 text-base font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors cursor-pointer"
                >
                  <Play className="w-5 h-5" aria-hidden="true" />
                  <span>{speechState === 'paused' ? tr(lang, 'resumeBtn') : tr(lang, 'listenBtn')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePauseVoice}
                  className="inline-flex items-center gap-2 px-5 py-3 text-base font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl transition-colors cursor-pointer"
                >
                  <Pause className="w-5 h-5" aria-hidden="true" />
                  <span>{tr(lang, 'pauseBtn')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleReplayVoice}
                className="inline-flex items-center gap-2 px-4 py-3 text-base font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>{tr(lang, 'replayBtn')}</span>
              </button>

              {speechState !== 'idle' && (
                <button
                  type="button"
                  onClick={handleStopVoice}
                  className="inline-flex items-center gap-2 px-4 py-3 text-base font-semibold text-rose-800 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                >
                  <Square className="w-4 h-4" aria-hidden="true" />
                  <span>{tr(lang, 'stopBtn')}</span>
                </button>
              )}
            </div>

            {voiceNote && <p className="text-xs text-slate-600">{voiceNote}</p>}
          </div>

          {/* Written Lesson Script */}
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">Lesson Explanation</h3>
            <p className="text-base text-slate-700 leading-relaxed">{scriptText}</p>
          </div>

          <hr className="border-slate-200" />

          {/* Safety Tips After Every Lesson */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900">{tr(lang, 'tipsHeading')}</h3>
            <ul className="space-y-3">
              {tipsList.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-3 text-base text-slate-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-1" aria-hidden="true" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <hr className="border-slate-200" />

          {/* Mini-Quiz */}
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-bold text-slate-900">{tr(lang, 'quizHeading')}</h3>
              {activeTutorial.latestQuizResult && (
                <span className="text-sm font-medium text-emerald-800 tabular-nums">
                  Saved Score: {activeTutorial.latestQuizResult.score}/{activeTutorial.latestQuizResult.totalQuestions}
                </span>
              )}
            </div>

            <div className="space-y-6">
              {activeTutorial.quiz.map((q, qIdx) => {
                const questionText = pickLocalized(q.question, lang) || q.question.en;
                const opts = pickLocalized(q.options, lang) || q.options.en;
                return (
                  <div key={q.id} className="space-y-3">
                    <p className="text-base font-bold text-slate-900">
                      {qIdx + 1}. {questionText}
                    </p>
                    <div className="space-y-2">
                      {opts.map((optText, oIdx) => {
                        const selected = quizAnswers[q.id] === oIdx;
                        const showResult = quizFeedback !== null;
                        const isCorrect = oIdx === q.correctIndex;
                        let btnStyle = 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50';
                        if (showResult && isCorrect) {
                          btnStyle = 'bg-emerald-50 border-emerald-700 text-emerald-950 font-semibold';
                        } else if (showResult && selected && !isCorrect) {
                          btnStyle = 'bg-rose-50 border-rose-600 text-rose-950';
                        } else if (selected) {
                          btnStyle = 'bg-sky-50 border-sky-700 text-sky-950 font-semibold';
                        }

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => {
                              setQuizAnswers((prev) => ({ ...prev, [q.id]: oIdx }));
                              setQuizFeedback(null);
                            }}
                            className={`w-full text-left px-4 py-3.5 rounded-xl border text-base transition-colors cursor-pointer ${btnStyle}`}
                          >
                            {optText}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={saving || Object.keys(quizAnswers).length < activeTutorial.quiz.length}
                  onClick={handleSubmitQuiz}
                  className="px-6 py-3.5 text-base font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-xl transition-colors cursor-pointer"
                >
                  {tr(lang, 'submitQuiz')}
                </button>

                {!activeTutorial.progress.completed && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleMarkComplete}
                    className="px-5 py-3.5 text-base font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors cursor-pointer"
                  >
                    {tr(lang, 'markComplete')}
                  </button>
                )}
              </div>

              {quizFeedback && (
                <p className="text-base font-bold text-emerald-800 tabular-nums">
                  Score: {quizFeedback.score} / {quizFeedback.total}
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
