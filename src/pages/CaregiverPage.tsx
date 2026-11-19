import { Lock, ShieldCheck, UserPlus, UserX } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { tr } from '../i18n/translations';
import {
  claimConsentInvite,
  createSeniorConsentInvite,
  fetchCaregiverLinks,
  fetchSeniorConsents,
  revokeCaregiverLink,
  revokeInvite,
} from '../services/firestoreData';
import { AuthUser, CaregiverLinkItem, ConsentInviteItem, LangCode } from '../types';

interface CaregiverPageProps {
  lang: LangCode;
  user: AuthUser;
}

export function CaregiverPage({ lang, user }: CaregiverPageProps) {
  // Senior state
  const [invites, setInvites] = useState<ConsentInviteItem[]>([]);
  const [seniorLinks, setSeniorLinks] = useState<CaregiverLinkItem[]>([]);
  const [caregiverEmail, setCaregiverEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  // Caregiver state
  const [caregiverLinks, setCaregiverLinks] = useState<CaregiverLinkItem[]>([]);
  const [consentCodeInput, setConsentCodeInput] = useState('');
  const [linkMessage, setLinkMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (user.role === 'senior') {
        const res = await fetchSeniorConsents(user.uid);
        setInvites(res.invites);
        setSeniorLinks(res.links);
      } else {
        const links = await fetchCaregiverLinks(user.uid);
        setCaregiverLinks(links);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load caregiver consent records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.uid, user.role]);

  // SENIOR CITIZEN CONSENT CONTROLS
  if (user.role === 'senior') {
    const handleInvite = async (e: FormEvent) => {
      e.preventDefault();
      setError('');
      setInviteMessage('');
      const targetEmail = caregiverEmail.trim().toLowerCase();
      if (!targetEmail || !targetEmail.includes('@')) {
        setError('Please enter a valid caregiver email address.');
        return;
      }

      try {
        const code = await createSeniorConsentInvite(user.uid, user.fullName, targetEmail);
        setInviteMessage(
          `Consent code ${code} generated for ${targetEmail}. Share this 6-character code only with your trusted caregiver so they can verify access.`
        );
        setCaregiverEmail('');
        await loadData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create consent invite.');
      }
    };

    const handleRevokeInvite = async (inviteCode: string) => {
      setError('');
      await revokeInvite(inviteCode);
      await loadData();
    };

    const handleRevokeLink = async (linkId: string) => {
      setError('');
      await revokeCaregiverLink(linkId);
      await loadData();
    };

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">{tr(lang, 'cardCaregiverTitle')}</h1>
          <p className="text-base text-slate-600">
            You stay in full control. Authorized caregivers can only view your tutorial completion and simulation counts. They never see your email profile, mobile number, passwords, OTPs, or private scam checks.
          </p>
        </div>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
          <h2 className="text-xl font-bold text-slate-900">Authorize a Trusted Family Caregiver</h2>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={caregiverEmail}
              onChange={(e) => setCaregiverEmail(e.target.value)}
              placeholder="Caregiver's registered email address"
              className="flex-1 px-4 py-3.5 text-base bg-white border border-slate-300 rounded-xl focus:border-emerald-700"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-5 h-5" aria-hidden="true" />
              <span>Generate Consent Code</span>
            </button>
          </form>

          {inviteMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-medium text-emerald-950">
              {inviteMessage}
            </div>
          )}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm font-medium text-rose-900">
              {error}
            </div>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
          <h2 className="text-xl font-bold text-slate-900">Pending Invites & Active Caregiver Links</h2>
          {loading ? (
            <p className="text-slate-600">Loading...</p>
          ) : invites.length === 0 && seniorLinks.length === 0 ? (
            <p className="text-base text-slate-600">No caregivers have been authorized yet.</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {seniorLinks.map((lnk) => (
                <div key={lnk.linkId} className="py-4 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-slate-900">{lnk.caregiverEmail}</p>
                    <p className="text-sm text-slate-600">
                      Code: <span className="font-mono font-semibold">{lnk.inviteCode}</span> · Status:{' '}
                      <span className={lnk.status === 'granted' ? 'text-emerald-800 font-semibold' : 'text-rose-700 font-semibold'}>
                        {lnk.status.toUpperCase()}
                      </span>
                    </p>
                  </div>
                  {lnk.status === 'granted' && (
                    <button
                      type="button"
                      onClick={() => handleRevokeLink(lnk.linkId)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl cursor-pointer"
                    >
                      <UserX className="w-4 h-4" aria-hidden="true" />
                      <span>Withdraw Consent</span>
                    </button>
                  )}
                </div>
              ))}

              {invites
                .filter((inv) => inv.status === 'pending')
                .map((inv) => (
                  <div key={inv.inviteCode} className="py-4 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-slate-900">{inv.caregiverEmail}</p>
                      <p className="text-sm text-slate-600">
                        Consent Code: <span className="font-mono font-semibold">{inv.inviteCode}</span> ·{' '}
                        <span className="text-amber-700 font-semibold">PENDING CLAIM</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRevokeInvite(inv.inviteCode)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl cursor-pointer"
                    >
                      <UserX className="w-4 h-4" aria-hidden="true" />
                      <span>Cancel Invite</span>
                    </button>
                  </div>
                ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  // CAREGIVER OVERSIGHT DASHBOARD
  const handleLinkSenior = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLinkMessage('');
    try {
      await claimConsentInvite(user.uid, user.email, consentCodeInput);
      setLinkMessage('Senior citizen linked successfully with verified consent.');
      setConsentCodeInput('');
      await loadData();
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Unable to link with consent code.';
      try {
        const parsed = JSON.parse(msg) as { error?: string };
        if (parsed.error?.includes('Missing or insufficient permissions')) {
          msg = 'Consent code not found, already used, or was generated for a different caregiver email.';
        }
      } catch {
        // plain message
      }
      setError(msg);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2 max-w-3xl">
          <h1 className="text-3xl font-bold text-slate-900">{tr(lang, 'cardCaregiverTitle')}</h1>
          <p className="text-base text-slate-600">
            Track educational safety progress for senior family members who explicitly granted consent. Private contact details, passwords, OTPs, and scam checks are never shared.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
          <Lock className="w-4 h-4" aria-hidden="true" />
          <span>Consent-Verified Access Only</span>
        </div>
      </div>

      {/* Link Senior with Explicit Consent Code */}
      <section className="bg-sky-50/70 border border-sky-200 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Link a Senior Citizen Using Their 6-Character Consent Code</h2>
        <form onSubmit={handleLinkSenior} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            value={consentCodeInput}
            onChange={(e) => setConsentCodeInput(e.target.value.toUpperCase())}
            placeholder="Enter 6-char Consent Code (e.g. AB7K9P)"
            maxLength={16}
            className="flex-1 px-4 py-3 text-base font-mono uppercase bg-white border border-slate-300 rounded-xl"
          />
          <button
            type="submit"
            className="px-6 py-3 text-base font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl cursor-pointer whitespace-nowrap"
          >
            Verify & Link
          </button>
        </form>
        {linkMessage && <p className="text-sm font-semibold text-emerald-800">{linkMessage}</p>}
        {error && <p className="text-sm font-semibold text-rose-800">{error}</p>}
      </section>

      {/* Consented Senior Cards */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-600">
          Loading consented progress...
        </div>
      ) : caregiverLinks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
          <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto" aria-hidden="true" />
          <h2 className="text-xl font-bold text-slate-900">No Active Senior Consents</h2>
          <p className="text-base text-slate-600 max-w-xl mx-auto">
            Ask your family member to sign into their Senior Citizen account, open Caregiver Access, and generate a consent code for your email address ({user.email}).
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {caregiverLinks.map((lnk) => {
            const simAccuracy =
              lnk.simTotalAttempts > 0
                ? Math.round((lnk.simCorrectAttempts / lnk.simTotalAttempts) * 100)
                : 0;

            return (
              <section key={lnk.linkId} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
                  <div>
                    <p className="text-xs font-medium text-emerald-800">Consent Active · Educational Summary Only</p>
                    <h2 className="text-2xl font-bold text-slate-900">{lnk.seniorName}</h2>
                    <p className="text-xs text-slate-500">Invite Code: {lnk.inviteCode}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-6 text-right tabular-nums">
                    <div>
                      <p className="text-xs text-slate-500">Tutorials</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {lnk.tutorialsCompletedCount}/{lnk.totalTutorials}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Scenarios Mastered</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {lnk.simUniqueMastered}/5
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Practice Accuracy</p>
                      <p className="text-2xl font-bold text-emerald-800">{simAccuracy}%</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-600">
                  Last progress sync: {lnk.updatedAt ? lnk.updatedAt.slice(0, 10) : 'Recently linked'}. Private phone numbers, email addresses, and scam-check texts remain strictly hidden for senior privacy.
                </p>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
