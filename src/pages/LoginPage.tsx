import { sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, Mail } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { tr } from '../i18n/translations';
import { auth, googleAuthProvider } from '../lib/firebase';
import { LangCode, PageRoute } from '../types';

interface LoginPageProps {
  lang: LangCode;
  onNavigate: (page: PageRoute) => void;
}

function mapAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Incorrect email address or password. Please check your details and try again.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many login attempts. Please wait a few minutes or reset your password.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Email/Password sign-in is not yet enabled in the Firebase Console for this project. Enable Email/Password under Authentication -> Sign-in method, or use Continue with Google below.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in popup was closed before completing login.';
  }
  return err instanceof Error ? err.message : 'Unable to sign in. Please try again.';
}

export function LoginPage({ lang, onNavigate }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!email.trim()) {
      setError('Please enter your email address first so we can send a reset link.');
      return;
    }
    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMsg(`Password reset link sent to ${email.trim()}. Please check your inbox and spam folder.`);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onNavigate('welcome')}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>{tr(lang, 'brand')}</span>
        </button>
        <Lock className="w-5 h-5 text-emerald-700" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {forgotMode ? tr(lang, 'forgotPasswordLink') : tr(lang, 'loginTitle')}
        </h1>
        <p className="text-base text-slate-600">
          {forgotMode
            ? 'Enter your registered email address and Firebase Authentication will send a secure password reset link.'
            : tr(lang, 'loginSubtitle')}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-base font-medium" role="alert">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-base font-medium" role="status">
          {successMsg}
        </div>
      )}

      {forgotMode ? (
        <form onSubmit={handlePasswordReset} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="reset-email" className="block text-base font-semibold text-slate-800">
              {tr(lang, 'emailLabel')}
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-11 pr-4 py-3.5 text-base bg-white border border-slate-300 rounded-xl focus:border-emerald-700"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 text-base font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
          >
            {submitting ? 'Sending...' : tr(lang, 'resetPasswordBtn')}
          </button>

          <button
            type="button"
            onClick={() => {
              setForgotMode(false);
              setError('');
              setSuccessMsg('');
            }}
            className="w-full py-3 text-base font-semibold text-sky-800 hover:underline cursor-pointer"
          >
            {tr(lang, 'backToLogin')}
          </button>
        </form>
      ) : (
        <>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-base font-semibold text-slate-800">
                {tr(lang, 'emailLabel')}
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-3.5 text-base bg-white border border-slate-300 rounded-xl focus:border-emerald-700"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-base font-semibold text-slate-800">
                  {tr(lang, 'passwordLabel')}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(true);
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-sky-800 hover:underline cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{tr(lang, 'forgotPasswordLink')}</span>
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 text-lg font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
            >
              {submitting ? 'Signing in...' : tr(lang, 'loginBtn')}
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
            onClick={handleGoogleSignIn}
            className="w-full py-3.5 px-6 text-base font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            {tr(lang, 'googleSignInBtn')}
          </button>

          <div className="pt-3 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={() => onNavigate('register')}
              className="text-base font-semibold text-emerald-800 hover:underline cursor-pointer"
            >
              {tr(lang, 'newAccountPrompt')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
