import { ChevronDown, Globe, Info, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getLanguageMeta, SUPPORTED_LANGUAGES } from '../i18n/languages';
import { tr } from '../i18n/translations';
import { LangCode } from '../types';

interface LanguageSelectorProps {
  value: LangCode;
  onChange: (langCode: LangCode) => void;
  compact?: boolean;
  label?: string;
}

export function LanguageSelector({ value, onChange, compact = false, label }: LanguageSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedMeta = getLanguageMeta(value);

  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return SUPPORTED_LANGUAGES;
    return SUPPORTED_LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.regionLabel.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="space-y-3">
      {label && (
        <label htmlFor="language-search-input" className="block text-base font-bold text-slate-900">
          {label}
        </label>
      )}

      {/* Search Box + Native Dropdown Row */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search
            className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="language-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
            placeholder={tr(value, 'searchLanguagePlaceholder')}
            className="w-full pl-11 pr-4 py-3.5 text-base bg-white border border-slate-300 rounded-xl focus:border-emerald-700"
          />
        </div>

        <div className="sm:col-span-6 relative">
          <Globe
            className="w-5 h-5 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <select
            aria-label={tr(value, 'selectLanguageLabel')}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setDropdownOpen(false);
            }}
            className="w-full appearance-none pl-11 pr-10 py-3.5 text-base font-semibold bg-white border border-slate-300 rounded-xl focus:border-emerald-700 cursor-pointer"
          >
            {filteredLanguages.map((langOpt) => (
              <option key={langOpt.code} value={langOpt.code}>
                {langOpt.nativeName} ({langOpt.name})
              </option>
            ))}
          </select>
          <ChevronDown
            className="w-5 h-5 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Interactive Searchable List (visible when typing or not compact) */}
      {(!compact || dropdownOpen || searchQuery.trim().length > 0) && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-56 overflow-y-auto">
          {filteredLanguages.length === 0 ? (
            <p className="text-sm text-slate-600 p-2">
              No matching language found for &ldquo;{searchQuery}&rdquo;. Try Kannada, Hindi, Marathi, Tamil, Telugu, or English.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredLanguages.map((langOpt) => {
                const isSelected = langOpt.code === value;
                return (
                  <button
                    key={langOpt.code}
                    type="button"
                    onClick={() => {
                      onChange(langOpt.code);
                      setSearchQuery('');
                      setDropdownOpen(false);
                    }}
                    className={`text-left px-3.5 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
                    }`}
                  >
                    <p className="text-base font-bold leading-snug">{langOpt.nativeName}</p>
                    <p className={`text-xs ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                      {langOpt.name} · {langOpt.regionLabel}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Honest Partial-Translation / Fallback Notice */}
      {selectedMeta.supportLevel !== 'full' && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-sm text-amber-950">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            <strong>{selectedMeta.nativeName} ({selectedMeta.name}):</strong> {tr(value, 'fallbackNotice')}
          </p>
        </div>
      )}
    </div>
  );
}
