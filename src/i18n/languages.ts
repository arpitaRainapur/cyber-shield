export type FullLangCode = 'en' | 'kn' | 'hi' | 'mr' | 'te' | 'ta' | 'ml' | 'bn' | 'gu' | 'pa' | 'ur';

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  speechLocale: string;
  supportLevel: 'full' | 'core';
  rtl?: boolean;
  regionLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', speechLocale: 'en-IN', supportLevel: 'full', regionLabel: 'Global / India' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', speechLocale: 'kn-IN', supportLevel: 'full', regionLabel: 'Karnataka' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', speechLocale: 'hi-IN', supportLevel: 'full', regionLabel: 'India' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', speechLocale: 'mr-IN', supportLevel: 'full', regionLabel: 'Maharashtra' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', speechLocale: 'te-IN', supportLevel: 'full', regionLabel: 'Andhra / Telangana' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', speechLocale: 'ta-IN', supportLevel: 'full', regionLabel: 'Tamil Nadu' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', speechLocale: 'ml-IN', supportLevel: 'full', regionLabel: 'Kerala' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', speechLocale: 'bn-IN', supportLevel: 'full', regionLabel: 'West Bengal' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', speechLocale: 'gu-IN', supportLevel: 'full', regionLabel: 'Gujarat' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', speechLocale: 'pa-IN', supportLevel: 'full', regionLabel: 'Punjab' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', speechLocale: 'ur-IN', supportLevel: 'full', rtl: true, regionLabel: 'India / Global' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', speechLocale: 'or-IN', supportLevel: 'core', regionLabel: 'Odisha' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', speechLocale: 'as-IN', supportLevel: 'core', regionLabel: 'Assam' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', speechLocale: 'es-ES', supportLevel: 'core', regionLabel: 'International' },
  { code: 'fr', name: 'French', nativeName: 'Français', speechLocale: 'fr-FR', supportLevel: 'core', regionLabel: 'International' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', speechLocale: 'ar-SA', supportLevel: 'core', rtl: true, regionLabel: 'International' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', speechLocale: 'de-DE', supportLevel: 'core', regionLabel: 'International' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', speechLocale: 'ja-JP', supportLevel: 'core', regionLabel: 'International' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', speechLocale: 'zh-CN', supportLevel: 'core', regionLabel: 'International' },
];

export const FULL_LANG_CODES = new Set<string>(['en', 'kn', 'hi', 'mr', 'te', 'ta', 'ml', 'bn', 'gu', 'pa', 'ur']);

export function getLanguageMeta(code: string): LanguageOption {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];
}
