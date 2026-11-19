import { Globe, Menu, ShieldCheck, UserCircle2, X } from 'lucide-react';
import { useState } from 'react';
import { getLanguageMeta } from '../i18n/languages';
import { tr } from '../i18n/translations';
import { AuthUser, LangCode, PageRoute } from '../types';

interface NavbarProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
  user: AuthUser | null;
  emailVerified: boolean;
  lang: LangCode;
  largeText: boolean;
  onToggleLargeText: () => void;
  onSignOut: () => void;
}

export function Navbar({
  currentPage,
  onNavigate,
  user,
  emailVerified,
  lang,
  largeText,
  onToggleLargeText,
  onSignOut,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthenticatedDashboardReady = Boolean(user && emailVerified);

  const navItems: Array<{ id: PageRoute; label: string }> = isAuthenticatedDashboardReady
    ? [
        { id: 'dashboard', label: tr(lang, 'navDashboard') },
        { id: 'tutorials', label: tr(lang, 'navTutorials') },
        { id: 'checker', label: tr(lang, 'navChecker') },
        { id: 'simulator', label: tr(lang, 'navSimulator') },
        { id: 'emergency', label: tr(lang, 'navEmergency') },
      ]
    : [
        { id: 'welcome', label: tr(lang, 'selectLanguageLabel') },
        { id: 'login', label: tr(lang, 'loginBtn') },
        { id: 'register', label: tr(lang, 'createAccountBtn') },
      ];

  const handleNavClick = (page: PageRoute) => {
    setMobileOpen(false);
    onNavigate(page);
  };

  const langMeta = getLanguageMeta(lang);

  return (
    <>
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => handleNavClick(isAuthenticatedDashboardReady ? 'dashboard' : 'welcome')}
            className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShieldCheck className="w-6 h-6 text-emerald-700 shrink-0" aria-hidden="true" />
            <span>{tr(lang, 'brand')}</span>
          </button>

          {/* Zone 2: Primary Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6" aria-label="Primary navigation">
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`py-2 text-base font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                    isActive
                      ? 'border-emerald-700 text-emerald-800'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Auth Action + Mobile Menu Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            {isAuthenticatedDashboardReady ? (
              <button
                type="button"
                onClick={onSignOut}
                className="px-4 py-2 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {tr(lang, 'logoutBtn')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleNavClick('login')}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {tr(lang, 'loginBtn')}
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="lg:hidden p-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-base font-medium transition-colors cursor-pointer ${
                    isActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            {isAuthenticatedDashboardReady && (
              <>
                <button
                  type="button"
                  onClick={() => handleNavClick('caregiver')}
                  className="w-full text-left px-4 py-3 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {tr(lang, 'navCaregiver')}
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('settings')}
                  className="w-full text-left px-4 py-3 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {tr(lang, 'navSettings')}
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('profile')}
                  className="w-full text-left px-4 py-3 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {tr(lang, 'navProfile')}
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Workspace Accessibility & Quick Settings Toolbar */}
      <div className="bg-sky-50/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-700 flex flex-wrap items-center gap-2">
            {isAuthenticatedDashboardReady && user ? (
              <>
                <span className="font-semibold text-slate-900">{user.fullName}</span>
                <span aria-hidden="true">·</span>
                <span>{user.role === 'senior' ? tr(lang, 'roleSenior') : tr(lang, 'roleCaregiver')}</span>
              </>
            ) : (
              <span>{tr(lang, 'welcomeTitle')}</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isAuthenticatedDashboardReady && (
              <>
                <button
                  type="button"
                  onClick={() => handleNavClick('profile')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                    currentPage === 'profile'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <UserCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>{tr(lang, 'navProfile')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('caregiver')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                    currentPage === 'caregiver'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {tr(lang, 'navCaregiver')}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => handleNavClick(isAuthenticatedDashboardReady ? 'settings' : 'welcome')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                currentPage === 'settings'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Globe className="w-4 h-4 text-emerald-700" aria-hidden="true" />
              <span>{langMeta.nativeName}</span>
            </button>

            <button
              type="button"
              onClick={onToggleLargeText}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                largeText
                  ? 'bg-sky-700 text-white border-sky-700'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {largeText ? tr(lang, 'textSizeLarge') : tr(lang, 'textSizeStandard')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
