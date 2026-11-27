import React, { useState } from 'react';
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'mobile-menu';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // Suppress button when already running as an installed standalone PWA
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuide(true);
  };

  // In header, show immediately when natively installable or on iOS;
  // in mobile menu, always provide quick access to Install / Add to Home Screen
  if (variant === 'header' && !isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      {variant === 'header' ? (
        <button
          type="button"
          onClick={handleClick}
          className="h-9 px-3 rounded-full bg-[#FFB703] hover:bg-[#F2A900] text-[#0F1E36] text-xs font-extrabold flex items-center gap-1.5 transition-colors shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" strokeWidth={2.6} />
          <span>Install App</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0F1E36] hover:bg-[#192D4E] text-white text-sm font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Smartphone className="w-4 h-4 text-[#FFB703]" />
          <span>{isInstallable ? 'Install ColorWorld App' : 'Add ColorWorld to Home Screen'}</span>
        </button>
      )}

      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Install ColorWorld App"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#111C2D] text-[#0F1E36] dark:text-slate-100 border border-[#E2E8F0] dark:border-slate-700 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-[#0F1E36] dark:text-white">
                  {isIOS ? 'Install on iPhone / iPad' : 'Install ColorWorld App'}
                </h3>
                <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
                  Color offline &amp; launch full-screen from your home screen.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close install instructions"
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-[#64748B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="mt-4 space-y-3 text-sm text-[#1E293B] dark:text-slate-200">
                <li className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#FAF8F5] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 text-xs font-extrabold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span className="flex items-center gap-1.5 flex-wrap">
                    Tap the <Share className="w-4 h-4 text-[#2563EB] inline" /> <strong>Share</strong> button in Safari.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#FAF8F5] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 text-xs font-extrabold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span className="flex items-center gap-1.5 flex-wrap">
                    Scroll down and tap <PlusSquare className="w-4 h-4 text-[#0F1E36] dark:text-white inline" />{' '}
                    <strong>Add to Home Screen</strong>.
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="mt-4 space-y-3 text-sm text-[#1E293B] dark:text-slate-200">
                <li className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#FAF8F5] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 text-xs font-extrabold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>
                    Open the browser menu (<strong>⋮</strong>) or address bar install icon.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#FAF8F5] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 text-xs font-extrabold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>
                    Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                  </span>
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full h-10 rounded-xl bg-[#0F1E36] hover:bg-[#192D4E] text-white text-sm font-bold transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
