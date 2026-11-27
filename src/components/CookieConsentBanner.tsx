import React from 'react';
import { Cookie, X } from 'lucide-react';

export const COOKIE_CONSENT_STORAGE_KEY = 'colorworld_cookie_consent_v1';

export type CookieConsentStatus = 'accepted' | 'essential' | null;

export function loadCookieConsent(): CookieConsentStatus {
  try {
    const val = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (val === 'accepted' || val === 'essential') return val;
    return null;
  } catch {
    return null;
  }
}

export function saveCookieConsent(status: 'accepted' | 'essential'): void {
  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, status);
  } catch {
    // ignore storage errors
  }
}

interface CookieConsentBannerProps {
  visible: boolean;
  hasFloatingPrintBar: boolean;
  onAcceptAll: () => void;
  onEssentialOnly: () => void;
  onOpenPrivacyPolicy: () => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  visible,
  hasFloatingPrintBar,
  onAcceptAll,
  onEssentialOnly,
  onOpenPrivacyPolicy,
}) => {
  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className={`no-print fixed inset-x-0 z-30 px-3 sm:px-6 transition-all ${
        hasFloatingPrintBar ? 'bottom-20 sm:bottom-24' : 'bottom-3 sm:bottom-4'
      }`}
    >
      <div className="max-w-[1040px] mx-auto rounded-2xl bg-white dark:bg-[#111C2D] border border-[#CBD5E1] dark:border-slate-700 shadow-2xl px-4 py-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="w-8 h-8 rounded-lg bg-[#0F1E36] text-[#FFB703] flex items-center justify-center shrink-0 mt-0.5">
            <Cookie className="w-4 h-4" />
          </span>
          <p className="text-xs sm:text-[13px] text-[#334155] dark:text-slate-300 leading-relaxed">
            ColorWorld stores your Print Set and paper size locally in your browser. Third-party ad partners (such as Google AdSense) may use cookies to display relevant ads and keep all printables free. Read our{' '}
            <button
              type="button"
              onClick={onOpenPrivacyPolicy}
              className="font-bold text-[#E63946] hover:underline cursor-pointer"
            >
              Privacy Policy
            </button>
            .
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 justify-end">
          <button
            type="button"
            onClick={onEssentialOnly}
            className="h-9 px-3 rounded-xl border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold text-[#475569] dark:text-slate-300 hover:bg-[#FAF8F5] dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            Essential Only
          </button>
          <button
            type="button"
            onClick={onAcceptAll}
            className="h-9 px-4 rounded-xl bg-[#0F1E36] hover:bg-[#192D4E] text-white text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap"
          >
            Accept All
          </button>
          <button
            type="button"
            onClick={onEssentialOnly}
            aria-label="Dismiss cookie notice"
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-[#64748B] flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
