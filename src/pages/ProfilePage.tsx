import { sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { CheckCircle2, KeyRound, Mail, Phone, Save, ShieldCheck, UserCircle2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { getLanguageMeta } from '../i18n/languages';
import { tr } from '../i18n/translations';
import { auth } from '../lib/firebase';
import { updateUserPreferences, updateUserPrivateProfile } from '../services/firestoreData';
import { AuthUser, LangCode } from '../types';

interface ProfilePageProps {
  lang: LangCode;
  user: AuthUser;
  onUserUpdated: (user: AuthUser) => void;
}

export function ProfilePage({ lang, user, onUserUpdated }: ProfilePageProps) {
  const [fullName, setFullName] = useState(user.fullName);
  const [mobileNumber, setMobileNumber] = useState(user.mobileNumber || '');
  const [recoveryNote, setRecoveryNote] = useState(user.recoveryNote || '');
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setFullName(user.fullName);
    setMobileNumber(user.mobileNumber || '');
    setRecoveryNote(user.recoveryNote || '');
  }, [user]);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setStatusMsg('');
    setErrorMsg('');

    const trimmedName = fullName.trim();
    if (trimmedName.length < 2) {
      setErrorMsg('Please enter your full name (at least 2 characters).');
      return;
    }

    setSaving(true);
    try {
      await updateUserPreferences(user.uid, { displayName: trimmedName });
      await updateUserPrivateProfile(user.uid, {
        email: user.email,
        mobileNumber: mobileNumber.trim(),
        emergencyContactNote: recoveryNote.trim(),
      });
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: trimmedName }).catch(() => {});
      }
      onUserUpdated({
        ...user,
        fullName: trimmedName,
        mobileNumber: mobileNumber.trim(),
        recoveryNote: recoveryNote.trim(),
      });
      setStatusMsg('Your private profile has been updated securely.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    setStatusMsg('');
    setErrorMsg('');
    setResetting(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setStatusMsg(`A secure password reset link has been sent to ${user.email}.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not send password reset email.');
    } finally {
      setResetting(false);
    }
  };

  const langMeta = getLanguageMeta(user.preferredLanguage);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2.5 text-emerald-800 text-sm font-semibold">
          <UserCircle2 className="w-5 h-5" aria-hidden="true" />
          <span>{user.role === 'senior' ? tr(lang, 'roleSenior') : tr(lang, 'roleCaregiver')}</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900">{tr(lang, 'navProfile')}</h1>
        <p className="text-base text-slate-600">
          Only you can view and edit your private contact information. Your data is protected by Firebase Authentication and strict Firestore owner-only rules.
        </p>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-base font-semibold flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-base font-medium" role="alert">
          {errorMsg}
        </div>
      )}

      {/* Account Verification & Email Summary */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
              <Mail className="w-4 h-4" aria-hidden="true" />
              <span>{tr(lang, 'emailLabel')}</span>
            </p>
            <p className="text-lg font-bold text-slate-900 font-mono">{user.email}</p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-bold text-emerald-800">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span>Email Verified</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 text-sm text-slate-700">
          <div>
            <span className="text-slate-500 block">{tr(lang, 'accountTypeLabel')}</span>
            <span className="font-bold text-base text-slate-900">
              {user.role === 'senior' ? tr(lang, 'roleSenior') : tr(lang, 'roleCaregiver')}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">{tr(lang, 'selectLanguageLabel')}</span>
            <span className="font-bold text-base text-slate-900">
              {langMeta.nativeName} ({langMeta.name})
            </span>
          </div>
        </div>
      </section>

      {/* Editable Private Profile Form */}
      <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <h2 className="text-xl font-bold text-slate-900">Personal & Emergency Contact Details</h2>

        <div className="space-y-1.5">
          <label htmlFor="profile-name" className="block text-base font-semibold text-slate-800">
            {tr(lang, 'fullNameLabel')}
          </label>
          <input
            id="profile-name"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={100}
            className="w-full px-4 py-3.5 text-base bg-white border border-slate-300 rounded-xl focus:border-emerald-700"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="profile-mobile" className="block text-base font-semibold text-slate-800">
            <span className="inline-flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-slate-500" aria-hidden="true" />
              <span>{tr(lang, 'mobileLabel')}</span>
            </span>
          </label>
          <input
            id="profile-mobile"
            type="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            maxLength={24}
            placeholder="e.g. +91 98XXXXXXXX"
            className="w-full px-4 py-3.5 text-base bg-white border border-slate-300 rounded-xl focus:border-emerald-700"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="profile-emergency-note" className="block text-base font-semibold text-slate-800">
            Trusted Family Contact Note (Private)
          </label>
          <input
            id="profile-emergency-note"
            type="text"
            value={recoveryNote}
            onChange={(e) => setRecoveryNote(e.target.value)}
            maxLength={250}
            placeholder="e.g. Call Rohan Sharma (+91 98XXX-XXXXX) before approving any bank request"
            className="w-full px-4 py-3.5 text-base bg-white border border-slate-300 rounded-xl focus:border-emerald-700"
          />
          <p className="text-xs text-slate-500">
            Never write bank PINs, passwords, or OTPs here.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-xl cursor-pointer"
          >
            <Save className="w-5 h-5" aria-hidden="true" />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>

          <button
            type="button"
            disabled={resetting}
            onClick={handlePasswordReset}
            className="inline-flex items-center gap-2 px-5 py-3.5 text-base font-semibold text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl cursor-pointer"
          >
            <KeyRound className="w-4 h-4" aria-hidden="true" />
            <span>{resetting ? 'Sending...' : tr(lang, 'resetPasswordBtn')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
