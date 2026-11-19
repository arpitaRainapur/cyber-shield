import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Info,
  Link2,
  Mic,
  MicOff,
  SearchCheck,
  ShieldAlert,
  Trash2,
  Volume2,
} from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { pickLocalized, tr } from '../i18n/translations';
import { clearUserScamChecks, fetchUserScamChecks, saveUserScamCheck } from '../services/firestoreData';
import { isSpeechRecognitionSupported, speakText, startVoiceDictation, stopSpeech } from '../services/voice';
import { AuthUser, LangCode, ScamAnalysisResult, ScamHistoryItem } from '../types';

interface ScamCheckerPageProps {
  lang: LangCode;
  user: AuthUser;
}

const SAMPLE_INPUTS = [
  {
    label: 'Fake KYC SMS',
    type: 'sms',
    text: 'URGENT: Your SBI KYC is expired. Account will be blocked in 2 hours. Click http://sbi-kyc-update.xyz and share OTP immediately.',
  },
  {
    label: 'Lottery WhatsApp',
    type: 'whatsapp',
    text: 'Congratulations! You won 25 lakh lottery prize in KBC lucky draw. Pay Rs 2500 processing fee today to unlock reward.',
  },
  {
    label: 'Suspicious URL',
    type: 'url',
    text: 'http://bit.ly/hdfc-verify-account-now',
  },
  {
    label: 'Normal Family Note',
    type: 'whatsapp',
    text: 'Namaste Maa, I will visit home at 6 PM today with groceries. Call me when you are free.',
  },
];

export function ScamCheckerPage({ lang, user }: ScamCheckerPageProps) {
  const [inputType, setInputType] = useState<'sms' | 'whatsapp' | 'email' | 'url'>('sms');
  const [content, setContent] = useState('');
  const [saveToHistory, setSaveToHistory] = useState(false);
  const [result, setResult] = useState<ScamAnalysisResult | null>(null);
  const [history, setHistory] = useState<ScamHistoryItem[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);
  const stopRecognitionRef = useRef<(() => void) | null>(null);

  const loadHistory = async () => {
    try {
      const items = await fetchUserScamChecks(user.uid);
      setHistory(items);
    } catch {
      // Ignore transient query issue
    }
  };

  useEffect(() => {
    loadHistory();
    return () => {
      stopSpeech();
      stopRecognitionRef.current?.();
    };
  }, [user.uid]);

  const handleAnalyze = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setAnalyzing(true);
    try {
      const res = await fetch('/api/scam-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          inputType,
          saveToHistory: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to analyze text.');
      }

      const analysis = data.analysis as ScamAnalysisResult;
      setResult(analysis);

      if (saveToHistory) {
        await saveUserScamCheck(user.uid, {
          inputType,
          content,
          riskLevel: analysis.riskLevel,
          riskScore: analysis.riskScore,
          suspiciousTerms: analysis.suspiciousTerms,
        });
        await loadHistory();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to analyze text.');
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleVoiceInput = () => {
    if (listening) {
      stopRecognitionRef.current?.();
      setListening(false);
      return;
    }

    setError('');
    setListening(true);
    stopRecognitionRef.current = startVoiceDictation(
      lang,
      (transcript) => {
        setContent((prev) => (prev ? `${prev} ${transcript}` : transcript));
      },
      () => setListening(false),
      (msg) => setError(msg)
    );
  };

  const handleClearHistory = async () => {
    await clearUserScamChecks(user.uid);
    setHistory([]);
  };

  const riskBadgeConfig = (level: ScamAnalysisResult['riskLevel']) => {
    if (level === 'High') {
      return {
        bg: 'bg-rose-50 border-rose-300',
        text: 'text-rose-900',
        icon: AlertOctagon,
        label: lang === 'hi' ? 'उच्च जोखिम (High Risk)' : lang === 'mr' ? 'उच्च धोका (High Risk)' : 'High Risk',
      };
    }
    if (level === 'Medium') {
      return {
        bg: 'bg-amber-50 border-amber-300',
        text: 'text-amber-900',
        icon: AlertTriangle,
        label: lang === 'hi' ? 'मध्यम जोखिम (Medium Risk)' : lang === 'mr' ? 'मध्यम धोका (Medium Risk)' : 'Medium Risk',
      };
    }
    return {
      bg: 'bg-emerald-50 border-emerald-300',
      text: 'text-emerald-900',
      icon: CheckCircle2,
      label: lang === 'hi' ? 'कम जोखिम (Low Risk — सावधानी रखें)' : lang === 'mr' ? 'कमी धोका (Low Risk — सावध राहा)' : 'Low Risk (Stay Cautious)',
    };
  };

  const resultWarnings = result ? pickLocalized(result.warningSigns, lang) || result.warningSigns.en : [];
  const resultAction = result ? pickLocalized(result.recommendedAction, lang) || result.recommendedAction.en : '';
  const resultDisclaimer = result ? pickLocalized(result.safetyDisclaimer, lang) || result.safetyDisclaimer.en : '';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-2 max-w-3xl">
        <h1 className="text-3xl font-bold text-slate-900">{tr(lang, 'cardCheckerTitle')}</h1>
        <p className="text-base text-slate-600">{tr(lang, 'cardCheckerDesc')}</p>
      </div>

      {/* Main Checker Form */}
      <form onSubmit={handleAnalyze} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {(
              [
                { id: 'sms', label: 'SMS' },
                { id: 'whatsapp', label: 'WhatsApp' },
                { id: 'email', label: 'Email' },
                { id: 'url', label: 'Website Link (Text)' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setInputType(tab.id)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                  inputType === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isSpeechRecognitionSupported() && (
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-colors cursor-pointer ${
                listening
                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                  : 'bg-sky-50 border-sky-200 text-sky-900 hover:bg-sky-100'
              }`}
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{listening ? tr(lang, 'checkerListening') : tr(lang, 'checkerSpeakBtn')}</span>
            </button>
          )}
        </div>

        {/* Sample Fill Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-500 font-medium">Try an example:</span>
          {SAMPLE_INPUTS.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => {
                setInputType(sample.type as 'sms' | 'whatsapp' | 'email' | 'url');
                setContent(sample.text);
                setError('');
              }}
              className="px-3 py-1.5 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              {sample.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <label htmlFor="scam-input" className="block text-base font-bold text-slate-900">
            Paste Suspicious Text or Link Below
          </label>
          <textarea
            id="scam-input"
            rows={4}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste SMS, WhatsApp text, email, or link text here (never enter your real OTP or PIN)..."
            className="w-full p-4 text-base bg-white border border-slate-300 rounded-xl focus:border-emerald-700 font-sans"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="inline-flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={saveToHistory}
              onChange={(e) => setSaveToHistory(e.target.checked)}
              className="w-5 h-5 accent-emerald-700 rounded"
            />
            <span>{tr(lang, 'checkerOptIn')}</span>
          </label>

          <button
            type="submit"
            disabled={analyzing || content.trim().length < 4}
            className="inline-flex items-center gap-2.5 px-7 py-3.5 text-base font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-xl transition-colors cursor-pointer"
          >
            <SearchCheck className="w-5 h-5" aria-hidden="true" />
            <span>{analyzing ? 'Analyzing...' : tr(lang, 'checkerAnalyzeBtn')}</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm font-medium" role="alert">
            {error}
          </div>
        )}
      </form>

      {/* Analysis Result */}
      {result && (() => {
        const cfg = riskBadgeConfig(result.riskLevel);
        const RiskIcon = cfg.icon;
        return (
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className={`p-5 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${cfg.bg}`}>
              <div className="flex items-center gap-3.5">
                <RiskIcon className={`w-8 h-8 shrink-0 ${cfg.text}`} aria-hidden="true" />
                <div>
                  <p className={`text-xl font-bold ${cfg.text}`}>{cfg.label}</p>
                  <p className="text-sm text-slate-700 tabular-nums">
                    Pattern Signal Score: {result.riskScore} / 100 · {result.engineLabel}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  speakText(
                    `${cfg.label}. ${resultWarnings.join(' ')} ${resultAction}`,
                    lang,
                    user.speechRate || 0.84
                  )
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl cursor-pointer"
              >
                <Volume2 className="w-4 h-4" aria-hidden="true" />
                <span>Listen to Result</span>
              </button>
            </div>

            {/* Suspicious Phrases */}
            <div className="space-y-2.5">
              <h2 className="text-lg font-bold text-slate-900">Suspicious Words & Patterns Detected</h2>
              {result.suspiciousTerms.length > 0 ? (
                <ul className="space-y-1.5 list-disc pl-5 text-base text-slate-800">
                  {result.suspiciousTerms.map((term, i) => (
                    <li key={i}>{term}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-base text-slate-600">No high-risk scam keywords from the baseline vocabulary matched.</p>
              )}
            </div>

            {/* URL Lexical Analysis */}
            {result.urlFindings.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <Link2 className="w-5 h-5 text-sky-700" aria-hidden="true" />
                  <span>URL Text Inspection (Link Was Never Visited)</span>
                </div>
                <div className="space-y-3">
                  {result.urlFindings.map((u, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <p className="font-mono text-sm text-slate-900 break-all">{u.url}</p>
                      <ul className="space-y-1 list-disc pl-5 text-sm text-slate-700">
                        {u.flags.map((f, j) => (
                          <li key={j}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warning Signs & Recommended Safe Action */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-200">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">Explanation of Warning Signs</h3>
                <ul className="space-y-2 list-disc pl-5 text-base text-slate-700">
                  {resultWarnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2 bg-emerald-50/70 border border-emerald-200 rounded-xl p-5">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-emerald-700" aria-hidden="true" />
                  <h3 className="text-lg font-bold text-slate-900">Recommended Safe Action</h3>
                </div>
                <p className="text-base text-slate-800 leading-relaxed">{resultAction}</p>
              </div>
            </div>

            {/* Honest Baseline & Safety Disclaimer */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 text-sm text-slate-700">
              <Info className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">{resultDisclaimer}</p>
                <p>
                  Model Transparency: This live endpoint runs an explainable TF-IDF/keyword and lexical URL baseline. No accuracy or training metrics are fabricated.
                </p>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Opt-In History Table */}
      {history.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-900">Your Saved Scam Checks (Opted-In)</h2>
            <button
              type="button"
              onClick={handleClearHistory}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span>Clear History</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 pr-4 font-semibold">Type</th>
                  <th className="py-2.5 pr-4 font-semibold">Excerpt</th>
                  <th className="py-2.5 pr-4 font-semibold">Risk</th>
                  <th className="py-2.5 font-semibold text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-medium uppercase text-slate-600">{item.inputType}</td>
                    <td className="py-3 pr-4 text-slate-800 max-w-md truncate">{item.contentExcerpt}</td>
                    <td className="py-3 pr-4 font-semibold text-slate-900">{item.riskLevel}</td>
                    <td className="py-3 text-right font-mono tabular-nums text-slate-700">{item.riskScore}/100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
