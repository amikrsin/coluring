import React, { useState } from 'react';
import { Lock, ArrowLeft, ShieldCheck, KeyRound } from 'lucide-react';

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
  onUnlock: () => void;
  onExit: () => void;
}

export const AdminPinGate: React.FC<AdminPinGateProps> = ({ onUnlock, onExit }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const expectedPin = getConfiguredAdminPin();
  const isDefaultPin = !(import.meta.env.VITE_ADMIN_PIN as string | undefined)?.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === expectedPin) {
      try {
        sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
      } catch {
        // ignore storage errors
      }
      setError(null);
      onUnlock();
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
                Admin Catalog Manager
              </h1>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Local-first static catalog editor
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-pin-input"
              className="block text-xs font-bold text-[#475569] dark:text-slate-300 mb-1.5"
            >
              Enter Admin PIN
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="admin-pin-input"
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter 6-digit PIN"
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#CBD5E1] dark:border-slate-700 focus:border-[#0F1E36] dark:focus:border-[#FFB703] text-base font-mono tracking-[0.25em] text-[#0F1E36] dark:text-white focus:outline-none"
              />
            </div>
            {error && (
              <p role="alert" className="mt-2 text-xs font-semibold text-[#DC2626]">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-[#0F1E36] hover:bg-[#192D4E] text-white text-sm font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-[#FFB703]" />
            <span>Unlock Admin Catalog</span>
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-[#E2E8F0] dark:border-slate-800 text-xs text-[#64748B] dark:text-slate-400 space-y-1">
          {isDefaultPin ? (
            <p>
              Preview PIN:{' '}
              <span className="font-mono font-bold text-[#0F1E36] dark:text-slate-200">
                123456
              </span>{' '}
              (override via <span className="font-mono">VITE_ADMIN_PIN</span>).
            </p>
          ) : (
            <p>
              PIN is configured via <span className="font-mono">VITE_ADMIN_PIN</span>.
            </p>
          )}
          <p>Session stays unlocked in this browser tab until locked or closed.</p>
        </div>
      </div>
    </div>
  );
};
