import React, { useEffect, useState } from 'react';
import {
  Lock,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  Loader2,
  Database,
  HardDrive,
} from 'lucide-react';
import {
  CloudStatus,
  DEFAULT_CLOUD_STATUS,
  claimAdminCloudPin,
  fetchCloudStatus,
  loginAdminCloud,
} from '../../utils/cloudflare-admin';

export const ADMIN_SESSION_KEY = 'colorworld_admin_unlocked_v1';

export function getConfiguredAdminPin(): string {
  const envPin = (import.meta.env.VITE_ADMIN_PIN as string | undefined)?.trim();
  return envPin && envPin.length > 0 ? envPin : '123456';
}

export function isAdminSessionUnlocked(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function lockAdminSession(): void {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // ignore
  }
}

interface AdminPinGateProps {
  initialStatus?: CloudStatus;
  onUnlock: (result: { token: string | null; status: CloudStatus }) => void;
  onExit: () => void;
}

export const AdminPinGate: React.FC<AdminPinGateProps> = ({
  initialStatus,
  onUnlock,
  onExit,
}) => {
  const [status, setStatus] = useState<CloudStatus>(
    initialStatus || { ...DEFAULT_CLOUD_STATUS }
  );
  const [checkingStatus, setCheckingStatus] = useState<boolean>(!initialStatus);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchCloudStatus()
      .then((next) => {
        if (active) setStatus(next);
      })
      .finally(() => {
        if (active) setCheckingStatus(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const cloudAuthEnabled =
    status.d1Bound || status.r2Bound || status.pinConfigured;
  const isFirstRunSetup = cloudAuthEnabled && status.needsFirstRunClaim;
  const expectedPreviewPin = getConfiguredAdminPin();
  const isDefaultPreviewPin = !(
    import.meta.env.VITE_ADMIN_PIN as string | undefined
  )?.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = pin.trim();

    if (!trimmed) {
      setError('Please enter your Admin PIN.');
      return;
    }

    // Server-verified Cloudflare Worker auth (Bearer token kept strictly in JS memory)
    if (cloudAuthEnabled) {
      if (isFirstRunSetup) {
        if (trimmed.length < 6) {
          setError('Choose a PIN of at least 6 characters.');
          return;
        }
        if (trimmed !== confirmPin.trim()) {
          setError('PIN confirmation does not match.');
          return;
        }
        setSubmitting(true);
        const claimed = await claimAdminCloudPin(trimmed);
        setSubmitting(false);
        if (!claimed.ok) {
          setError(claimed.error);
          return;
        }
        const updatedStatus: CloudStatus = {
          ...status,
          adminClaimed: true,
          needsFirstRunClaim: false,
        };
        onUnlock({ token: claimed.token, status: updatedStatus });
        return;
      }

      setSubmitting(true);
      const res = await loginAdminCloud(trimmed);
      setSubmitting(false);
      if (!res.ok) {
        if (res.needsClaim) {
          setStatus((prev) => ({ ...prev, needsFirstRunClaim: true }));
        }
        setError(res.error);
        setPin('');
        return;
      }
      onUnlock({ token: res.token, status });
      return;
    }

    // Local preview fallback (when no Cloudflare D1/R2 or ADMIN_PIN secret is bound)
    if (trimmed === expectedPreviewPin) {
      try {
        sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
      } catch {
        // ignore storage errors
      }
      onUnlock({ token: null, status });
    } else {
      setError('Incorrect PIN. Please check your passcode and try again.');
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0B1320] text-[#1E293B] dark:text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111C2D] border border-[#E2E8F0] dark:border-slate-800 shadow-xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-[#0F1E36] text-[#FFB703] flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg font-extrabold text-[#0F1E36] dark:text-white leading-tight">
                {isFirstRunSetup ? 'Set Up Admin PIN' : 'Admin Catalog Manager'}
              </h1>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                {cloudAuthEnabled
                  ? 'Cloudflare Workers D1 & R2 Admin'
                  : 'Local-first catalog editor'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="text-xs font-bold text-[#64748B] hover:text-[#0F1E36] dark:text-slate-400 dark:hover:text-white inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </button>
        </div>

        {/* Live Binding Connection Indicator */}
        {!checkingStatus && (status.d1Bound || status.r2Bound) && (
          <div className="mb-5 rounded-xl bg-[#FAF8F5] dark:bg-slate-900/70 border border-[#E2E8F0] dark:border-slate-800 px-3.5 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-[#334155] dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <Database
                className={`w-3.5 h-3.5 ${
                  status.d1Bound ? 'text-[#2A9D8F]' : 'text-[#94A3B8]'
                }`}
              />
              <span>D1: {status.d1Bound ? 'Connected' : 'Unbound'}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <HardDrive
                className={`w-3.5 h-3.5 ${
                  status.r2Bound ? 'text-[#2A9D8F]' : 'text-[#94A3B8]'
                }`}
              />
              <span>R2: {status.r2Bound ? 'Connected' : 'Unbound'}</span>
            </span>
          </div>
        )}

        {checkingStatus ? (
          <div className="py-10 flex items-center justify-center gap-2 text-xs font-bold text-[#64748B]">
            <Loader2 className="w-4 h-4 animate-spin text-[#2A9D8F]" />
            <span>Checking Cloudflare Worker bindings...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isFirstRunSetup && (
              <p className="text-xs text-[#475569] dark:text-slate-300 leading-relaxed">
                Choose your private Admin PIN to protect Cloudflare D1 catalog saves and R2 uploads. This one-time setup locks automatically once saved (and can also be overridden anytime with the{' '}
                <span className="font-mono font-bold">ADMIN_PIN</span> Cloudflare secret).
              </p>
            )}

            <div>
              <label
                htmlFor="admin-pin-input"
                className="block text-xs font-bold text-[#475569] dark:text-slate-300 mb-1.5"
              >
                {isFirstRunSetup ? 'Create Admin PIN (min 6 characters)' : 'Enter Admin PIN'}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="admin-pin-input"
                  type="password"
                  autoComplete={isFirstRunSetup ? 'new-password' : 'one-time-code'}
                  autoFocus
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={isFirstRunSetup ? 'At least 6 characters' : 'Enter Admin PIN'}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 focus:border-[#0F1E36] dark:focus:border-[#FFB703] text-base font-mono tracking-[0.2em] text-[#0F1E36] dark:text-white focus:outline-none"
                />
              </div>
            </div>

            {isFirstRunSetup && (
              <div>
                <label
                  htmlFor="admin-pin-confirm"
                  className="block text-xs font-bold text-[#475569] dark:text-slate-300 mb-1.5"
                >
                  Confirm Admin PIN
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-pin-confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPin}
                    onChange={(e) => {
                      setConfirmPin(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Re-enter Admin PIN"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 focus:border-[#0F1E36] dark:focus:border-[#FFB703] text-base font-mono tracking-[0.2em] text-[#0F1E36] dark:text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {error && (
              <p role="alert" className="text-xs font-semibold text-[#DC2626]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-xl bg-[#0F1E36] hover:bg-[#192D4E] disabled:opacity-65 text-white text-sm font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#FFB703]" />
                  <span>{isFirstRunSetup ? 'Securing Admin PIN...' : 'Verifying...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#FFB703]" />
                  <span>
                    {isFirstRunSetup ? 'Save PIN & Open Admin' : 'Unlock Admin Catalog'}
                  </span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-5 pt-4 border-t border-[#E2E8F0] dark:border-slate-800 text-xs text-[#64748B] dark:text-slate-400 space-y-1">
          {cloudAuthEnabled ? (
            <p>
              {status.pinConfigured
                ? 'Verified on the server via your Cloudflare Worker ADMIN_PIN secret.'
                : 'Verified on the server against your hashed PIN in Cloudflare D1.'}
            </p>
          ) : isDefaultPreviewPin ? (
            <p>
              Preview PIN:{' '}
              <span className="font-mono font-bold text-[#0F1E36] dark:text-slate-200">
                123456
              </span>{' '}
              (on Cloudflare live, set the{' '}
              <span className="font-mono">ADMIN_PIN</span> Worker secret).
            </p>
          ) : (
            <p>
              Local preview PIN is configured via <span className="font-mono">VITE_ADMIN_PIN</span>.
            </p>
          )}
          <p>Admin session tokens are kept in memory only and cleared when locked or refreshed.</p>
        </div>
      </div>
    </div>
  );
};
