import React from 'react';

interface AdSlotProps {
  slotId: string;
  format?: 'leaderboard' | 'inline' | 'sidebar';
}

export const AdSlot: React.FC<AdSlotProps> = ({ slotId, format = 'leaderboard' }) => {
  const isSidebar = format === 'sidebar';

  return (
    <aside
      aria-label="Advertisement"
      data-ad-slot={slotId}
      className={
        isSidebar
          ? 'no-print w-full'
          : 'no-print max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 my-6'
      }
    >
      <div
        className={`w-full rounded-xl border border-dashed border-[#CBD5E1] dark:border-slate-700/80 bg-[#F4F1EA]/70 dark:bg-slate-900/50 flex flex-col items-center justify-center text-center px-4 ${
          isSidebar
            ? 'min-h-[250px] py-6'
            : format === 'leaderboard'
            ? 'min-h-[90px] py-3'
            : 'min-h-[110px] py-4'
        }`}
      >
        <span className="text-[11px] font-semibold tracking-wide text-[#64748B] dark:text-slate-400">
          Advertisement
        </span>
        <span className="text-xs text-[#94A3B8] dark:text-slate-500 mt-0.5">
          {isSidebar
            ? 'Responsive Ad Slot (300×250 Medium Rectangle) · Non-intrusive placement'
            : `Responsive Ad Slot (${format === 'leaderboard' ? '728×90 / 320×100' : '970×90 Native'}) · Non-intrusive placement`}
        </span>
      </div>
    </aside>
  );
};
