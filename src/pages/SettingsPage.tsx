import { CheckCircle2, Globe, Save, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LanguageSelector } from '../components/LanguageSelector';
import { getLanguageMeta } from '../i18n/languages';
import { tr } from '../i18n/translations';
import { updateUserPreferences } from '../services/firestoreData';
import { isSpeechSynthesisSupported, speakText, stopSpeech } from '../services/voice';
import { AuthUser, LangCode } from '../types';

interface SettingsPageProps {
  lang: LangCode;
  user: AuthUser;
  largeText: boolean;
  onLanguageChange: (lang: LangCode) => Promise<void>;
  onToggleLargeText: () => Promise<void>;
  onSpeechRateChange: (rate: number) => Promise<void>;
  onUserUpdated: (user: AuthUser) => void;
}

export function SettingsPage({
  lang,
  user,
  largeText,
  onLanguageChange,
  onToggleLargeText,
  onSpeechRateChange,
  onUserUpdated,
}: SettingsPageProps) {
  const [selectedLang, setSelectedLang] = useState<LangCode>(lang);
  const [speechRate, setSpeechRate] = useState<number>(user.speechRate || 0.84);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('');

  useEffect(() => {
    setSelectedLang(lang);
  }, [lang]);

  useEffect(() => {
    setSpeechRate(user.speechRate || 0.84);
    return () => stopSpeech();
  }, [user.speechRate]);

  const handleSelectLanguage = async (newCode: LangCode) => {
    setSelectedLang(newCode);
    setSavedMsg('');
    setVoiceStatus('');
    await onLanguageChange(newCode);
  };

  const handleSaveToProfile = async () => {
    setSaving(true);
    setSavedMsg('');
    try {
      await updateUserPreferences(user.uid, {
        preferredLanguage: selectedLang,
        largeText,
        speechRate,
      });
      await onSpeechRateChange(speechRate);
      onUserUpdated({
        ...user,
        preferredLanguage: selectedLang,
        largeText,
        speechRate,
      });
      setSavedMsg(tr(selectedLang, 'languageSavedMsg'));
    } finally {
      setSaving(false);
    }
  };

  const handleTestVoice = () => {
    if (!isSpeechSynthesisSupported()) {
      setVoiceStatus('Voice playback is not supported in this browser. Clear text instructions remain available.');
      return;
    }
    const meta = getLanguageMeta(selectedLang);
    const res = speakText(
      `${tr(selectedLang, 'welcomeTitle')}. ${tr(selectedLang, 'dashboardSubtitle')}`,
      selectedLang,
      speechRate
    );
    if (!res.exactVoiceAvailable) {
      setVoiceStatus(
        `Your device does not have a dedicated ${meta.name} (${meta.speechLocale}) voice pack installed. Using fallback voice (${res.fallbackLocale}).`
      );
    } else {
      setVoiceStatus(`Playing sample voice in ${meta.nativeName} (${meta.speechLocale}).`);
    }
  };

  const meta = getLanguageMeta(selectedLang);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2.5 text-emerald-800 font-semibold text-sm">
          <Globe className="w-5 h-5" aria-hidden="true" />
          <span>{meta.nativeName} ({meta.name})</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900">{tr(lang, 'navSettings')}</h1>
        <p className="text-base text-slate-600">
          Choose your preferred language anytime, test spoken voice guidance, and adjust text readability for your comfort.
        </p>
      </div>

      {/* Language Picker Section */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <LanguageSelector
          value={selectedLang}
          onChange={handleSelectLanguage}
          label={tr(selectedLang, 'selectLanguageLabel')}
        />

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleTestVoice}
            className="inline-flex items-center gap-2 px-5 py-3.5 text-base font-semibold text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl cursor-pointer"
          >
            <Volume2 className="w-5 h-5 text-sky-700" aria-hidden="true" />
            <span>Test Voice in {meta.nativeName}</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={handleSaveToProfile}
            className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-xl cursor-pointer"
          >
            <Save className="w-5 h-5" aria-hidden="true" />
            <span>{saving ? 'Saving...' : tr(selectedLang, 'saveLanguageBtn')}</span>
          </button>
        </div>

        {voiceStatus && (
          <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sm text-sky-950 font-medium">
            {voiceStatus}
          </div>
        )}

        {savedMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-950 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
            <span>{savedMsg}</span>
          </div>
        )}
      </section>

      {/* Accessibility & Reading Pace */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <h2 className="text-xl font-bold text-slate-900">Reading & Voice Comfort</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 p-5 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-base font-bold text-slate-900">Display Text Size</p>
            <p className="text-sm text-slate-600">
              Increase heading and paragraph text size across every page for comfortable reading.
            </p>
            <button
              type="button"
              onClick={onToggleLargeText}
              className={`px-5 py-3 text-base font-bold rounded-xl border transition-colors cursor-pointer ${
                largeText
                  ? 'bg-sky-700 text-white border-sky-700'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {largeText ? tr(lang, 'textSizeLarge') : tr(lang, 'textSizeStandard')}
            </button>
          </div>

          <div className="space-y-3 p-5 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-base font-bold text-slate-900">Voice Explanation Speed</p>
            <p className="text-sm text-slate-600">
              Choose a slower, clearer speaking pace for voice tutorials and scam check summaries.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  setSpeechRate(0.82);
                  await onSpeechRateChange(0.82);
                }}
                className={`px-4 py-3 text-sm font-bold rounded-xl border cursor-pointer ${
                  speechRate <= 0.9
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {tr(lang, 'paceSlow')}
              </button>
              <button
                type="button"
                onClick={async () => {
                  setSpeechRate(1.0);
                  await onSpeechRateChange(1.0);
                }}
                className={`px-4 py-3 text-sm font-bold rounded-xl border cursor-pointer ${
                  speechRate > 0.9
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {tr(lang, 'paceNormal')}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
