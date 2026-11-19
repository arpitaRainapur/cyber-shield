import { createUserWithEmailAndPassword, sendEmailVerification, signInWithPopup, updateProfile } from 'firebase/auth';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, UserCheck, Users } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { LanguageSelector } from '../components/LanguageSelector';
import { tr } from '../i18n/translations';
import { auth, googleAuthProvider } from '../lib/firebase';
import { LangCode, PageRoute, UserRole } from '../types';

interface RegisterPageProps {
  lang: LangCode;
  onLanguageChange: (lang: LangCode) => void;
  onNavigate: (page: PageRoute) => void;
  onRegistrationMetaSaved: (meta: {
    fullName: string;
    mobileNumber: string;
    preferredLanguage: LangCode;
    role: UserRole;
  }) => void;
}

function mapRegisterError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email already exists. Please use Login instead.';
  }
  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 8 characters with letters and numbers.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Email/Password sign-in is not yet enabled in the Firebase Console for this project. Enable Email/Password under Authentication -> Sign-in method, or use Continue with Google below.';
  }
  return err instanceof Error ? err.message : 'Registration failed. Please try again.';
}

export function RegisterPage({
  lang,
  onLanguageChange,
  onNavigate,
  onRegistrationMetaSaved,
}: RegisterPageProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [role, setRole] = useState<UserRole>('senior');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const hasMinLen = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (fullName.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!hasMinLen || !hasLetter || !hasNumber) {
      setError('Password must be at least 8 characters and include at least one letter and one number.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter the same password.');
      return;
    }

    setSubmitting(true);
    try {
      const meta = {
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        preferredLanguage: lang,
        role,
      };
      onRegistrationMetaSaved(meta);
      localStorage.setItem('cybershield_pending_profile', JSON.stringify(meta));

      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: fullName.trim() });
      await sendEmailVerification(cred.user);
      onNavigate('verify');
    } catch (err) {
      setError(mapRegisterError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setSubmitting(true);
    try {
      const meta = {
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        preferredLanguage: lang,
        role,
      };
      onRegistrationMetaSaved(meta);
      localStorage.setItem('cybershield_pending_profile', JSON.stringify(meta));
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err) {
      setError(mapRegisterError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onNavigate('welcome')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>{tr(lang, 'brand')}</span>
        </button>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{tr(lang, 'registerTitle')}</h1>
        <p className="text-base text-slate-600">{tr(lang, 'registerSubtitle')}</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-base font-medium" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-5">
        {/* Account Role */}
        <div className="space-y-2">
          <label className="block text-base font-semibold text-slate-800">{tr(lang, 'accountTypeLabel')}</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('senior')}
              className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-colors cursor-pointer ${
                role === 'senior'
                  ? 'bg-emerald-50 border-emerald-700 text-emerald-950'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <UserCheck className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-bold text-base">{tr(lang, 'roleSenior')}</p>
                <p className="text-sm text-slate-600">Tutorials, Scam Checker & Practice</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setRole('caregiver')}
              className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-colors cursor-pointer ${
                role === 'caregiver'
                  ? 'bg-sky-50 border-sky-700 text-sky-950'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Users className="w-6 h-6 text-sky-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-bold text-base">{tr(lang, 'roleCaregiver')}</p>
                <p className="text-sm text-slate-600">Consented family oversight</p>
              </div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="reg-name" className="block text-base font-semibold text-slate-800">
              {tr(lang, 'fullNameLabel')}
            </label>
            <input
              id="reg-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Asha Sharma"
              className="w-full px-4 py-3.5 text-base bg-white border border-slate-300 rounded-xl focus:border-emerald-700"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reg-mobile" className="block text-base font-semibold text-slate-800">
              {tr(lang, 'mobileLabel')}
            </label>
            <input
              id="reg-mobile"
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="e.g. +91 98XXXXXXXX"
              maxLength={20}
              className="w-full px-4 py-3.5 text-base bg-white border border-slate-300 rounded-xl focus:border-emerald-700"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="reg-email" className="block text-base font-semibold text-slate-800">
            {tr(lang, 'emailLabel')}
          </label>
          <input
            id="reg-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full px-4 py-3.5 text-base bg-white border border-slate-300 rounded-xl focus:border-emerald-700"
          />
        </div>

        {/* Preferred Language */}
        <LanguageSelector
          value={lang}
          onChange={onLanguageChange}
          compact
          label={tr(lang, 'selectLanguageLabel')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="reg-password" className="block text-base font-semibold text-slate-800">
              {tr(lang, 'passwordLabel')}
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8+ chars, letter & number"
                className="w-full px-4 py-3.5 pr-12 text-base bg-white border border-slate-300 rounded-xl focus:border-emerald-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-600 hover:text-slate-900 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reg-confirm" className="block text-base font-semibold text-slate-800">
              {tr(lang, 'confirmPasswordLabel')}
            </label>
            <input
              id="reg-confirm"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full px-4 py-3.5 text-base bg-white border border-slate-300 rounded-xl focus:border-emerald-700"
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <span className={hasMinLen ? 'text-emerald-800 font-semibold flex items-center gap-1.5' : 'text-slate-500 flex items-center gap-1.5'}>
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" /> 8+ chars
          </span>
          <span className={hasLetter ? 'text-emerald-800 font-semibold flex items-center gap-1.5' : 'text-slate-500 flex items-center gap-1.5'}>
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" /> 1 letter
          </span>
          <span className={hasNumber ? 'text-emerald-800 font-semibold flex items-center gap-1.5' : 'text-slate-500 flex items-center gap-1.5'}>
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" /> 1 number
          </span>
          <span className={passwordsMatch ? 'text-emerald-800 font-semibold flex items-center gap-1.5' : 'text-slate-500 flex items-center gap-1.5'}>
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" /> Matches
          </span>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 px-6 text-lg font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
        >
          {submitting ? 'Creating Account...' : tr(lang, 'createAccountBtn')}
        </button>
      </form>

      <div className="relative flex items-center py-1">
        <div className="flex-grow border-t border-slate-200" />
        <span className="shrink mx-3 text-xs font-medium text-slate-400">OR</span>
        <div className="flex-grow border-t border-slate-200" />
      </div>

      <button
        type="button"
        disabled={submitting}
        onClick={handleGoogleSignUp}
        className="w-full py-3.5 px-6 text-base font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
      >
        {tr(lang, 'googleSignInBtn')}
      </button>

      <div className="pt-3 border-t border-slate-200 text-center">
        <button
          type="button"
          onClick={() => onNavigate('login')}
          className="text-base font-semibold text-sky-800 hover:underline cursor-pointer"
        >
          {tr(lang, 'existingAccountPrompt')}
        </button>
      </div>
    </div>
  );
}
