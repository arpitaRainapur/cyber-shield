import { getLanguageMeta } from '../i18n/languages';
import { LangCode } from '../types';

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as Record<string, unknown>;
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

export function findBestVoice(lang: LangCode): {
  voice: SpeechSynthesisVoice | null;
  exactMatch: boolean;
  fallbackLocale: string;
} {
  const meta = getLanguageMeta(lang);
  if (!isSpeechSynthesisSupported()) {
    return { voice: null, exactMatch: false, fallbackLocale: meta.speechLocale };
  }

  const voices = window.speechSynthesis.getVoices();
  const targetLocale = meta.speechLocale.toLowerCase();
  const shortCode = lang.toLowerCase();

  const exact = voices.find((v) => v.lang.toLowerCase() === targetLocale);
  if (exact) return { voice: exact, exactMatch: true, fallbackLocale: exact.lang };

  const prefix = voices.find((v) => v.lang.toLowerCase().startsWith(`${shortCode}-`) || v.lang.toLowerCase() === shortCode);
  if (prefix) return { voice: prefix, exactMatch: true, fallbackLocale: prefix.lang };

  // Regional Indian fallback to Hindi or Indian English if browser lacks specific pack
  const hindiVoice = voices.find((v) => v.lang.toLowerCase().startsWith('hi'));
  if (hindiVoice && ['mr', 'gu', 'pa', 'bn', 'or', 'as', 'ur'].includes(shortCode)) {
    return { voice: hindiVoice, exactMatch: false, fallbackLocale: hindiVoice.lang };
  }

  const indianEnglish = voices.find((v) => v.lang.toLowerCase() === 'en-in');
  if (indianEnglish) {
    return { voice: indianEnglish, exactMatch: shortCode === 'en', fallbackLocale: indianEnglish.lang };
  }

  return {
    voice: voices[0] ?? null,
    exactMatch: false,
    fallbackLocale: voices[0]?.lang ?? 'en-IN',
  };
}

export function speakText(
  text: string,
  lang: LangCode,
  rate = 0.84,
  callbacks?: { onStart?: () => void; onEnd?: () => void; onError?: () => void }
): { started: boolean; exactVoiceAvailable: boolean; fallbackLocale: string } {
  const meta = getLanguageMeta(lang);
  if (!isSpeechSynthesisSupported()) {
    callbacks?.onError?.();
    return { started: false, exactVoiceAvailable: false, fallbackLocale: meta.speechLocale };
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const { voice, exactMatch, fallbackLocale } = findBestVoice(lang);
  utterance.lang = exactMatch ? meta.speechLocale : fallbackLocale;
  if (voice) {
    utterance.voice = voice;
  }
  utterance.rate = rate;
  utterance.pitch = 1.0;

  utterance.onstart = () => callbacks?.onStart?.();
  utterance.onend = () => callbacks?.onEnd?.();
  utterance.onerror = () => callbacks?.onError?.();

  window.speechSynthesis.speak(utterance);
  return { started: true, exactVoiceAvailable: exactMatch, fallbackLocale };
}

export function pauseSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.pause();
  }
}

export function resumeSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.resume();
  }
}

export function stopSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

export function startVoiceDictation(
  lang: LangCode,
  onTranscript: (text: string) => void,
  onEnd: () => void,
  onError: (msg: string) => void
): (() => void) | null {
  if (!isSpeechRecognitionSupported()) {
    onError('Speech-to-Text is not supported in this browser. Please type or paste the message.');
    return null;
  }

  const win = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  const RecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;
  if (!RecognitionCtor) return null;

  const meta = getLanguageMeta(lang);
  const recognition = new RecognitionCtor();
  recognition.lang = meta.speechLocale;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript || '';
    if (transcript) {
      onTranscript(transcript);
    }
  };
  recognition.onend = () => onEnd();
  recognition.onerror = () => {
    onError('Could not capture voice in this language. Please check microphone permission or type the message.');
    onEnd();
  };

  recognition.start();
  return () => {
    try {
      recognition.stop();
    } catch {
      // Ignore stop errors if already ended
    }
  };
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results?: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}
