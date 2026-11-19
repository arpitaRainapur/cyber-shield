import { sendEmailVerification } from 'firebase/auth';
import { LogOut, MailCheck, RefreshCw, Send } from 'lucide-react';
import { useState } from 'react';
import { tr } from '../i18n/translations';
import { auth } from '../lib/firebase';
import { LangCode } from '../types';

interface VerifyEmailPageProps {
  lang: LangCode;
  email: string;
  onVerified: () => Promise<void>;
  onLogout: () => Promise<void>;
}

export function VerifyEmailPage({ lang, email, onVerified, onLogout }: VerifyEmailPageProps) {
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleCheckVerified = async () => {
    if (!auth.currentUser) return;
    setChecking(true);
    setErrorMsg('');
    setStatusMsg('');
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        await auth.currentUser.getIdToken(true);
        await onVerified();
      } else {
        setErrorMsg('Your email is not verified yet. Please click the verification link in your inbox (or check Spam/Promotions), then click this button again.');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not refresh verification status.');
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (!auth.currentUser) return;
    setResending(true);
    setErrorMsg('');
    setStatusMsg('');
    try {
      await sendEmailVerification(auth.currentUser);
      setStatusMsg(`A new verification link has been sent to ${email}.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Please wait a minute before resending the email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 space-y-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
        <MailCheck className="w-8 h-8" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{tr(lang, 'verifyTitle')}</h1>
        <p className="text-base text-slate-600 leading-relaxed">{tr(lang, 'verifySubtitle')}</p>
        <p className="text-base font-mono font-semibold text-slate-900">{email}</p>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-sm font-medium">
          {statusMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-sm font-medium">
          {errorMsg}
        </div>
      )}

      <div className="space-y-3 pt-2">
        <button
          type="button"
          disabled={checking}
          onClick={handleCheckVerified}
          className="w-full inline-flex items-center justify-center gap-2.5 py-4 px-6 text-base font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-xl cursor-pointer"
        >
          <RefreshCw className={`w-5 h-5 ${checking ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>{checking ? 'Checking...' : tr(lang, 'verifyRefreshBtn')}</span>
        </button>

        <button
          type="button"
          disabled={resending}
          onClick={handleResend}
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 text-base font-semibold text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl cursor-pointer"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
          <span>{resending ? 'Sending...' : tr(lang, 'verifyResendBtn')}</span>
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 text-base font-semibold text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          <span>{tr(lang, 'logoutBtn')}</span>
        </button>
      </div>
    </div>
  );
}
