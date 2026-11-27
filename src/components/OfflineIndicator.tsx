import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="no-print fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-[#0F1E36] text-white border border-[#FFB703]/50 px-3.5 py-2 text-xs font-bold shadow-xl whitespace-nowrap"
    >
      <WifiOff className="w-4 h-4 text-[#FFB703] shrink-0" />
      <span>Offline Mode — Cached coloring pages are ready</span>
    </div>
  );
};
