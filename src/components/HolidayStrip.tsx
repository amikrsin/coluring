import React, { useMemo } from 'react';
import { CalendarClock, ChevronRight } from 'lucide-react';
import { AdminHolidayTickerItem, Locale } from '../types';
import { TranslationDictionary } from '../i18n/translations';
import { getUpcomingHolidays } from '../utils/holidays';

interface HolidayStripProps {
  locale: Locale;
  t: TranslationDictionary;
  tickerItems?: AdminHolidayTickerItem[];
  onSelectPack: (packSlug: string) => void;
}

export const HolidayStrip: React.FC<HolidayStripProps> = ({
  locale,
  t,
  tickerItems,
  onSelectPack,
}) => {
  const computedItems = useMemo(() => {
    // Strictly compute real-date countdowns from `new Date()` within the next 90 days, sorted chronologically
    return getUpcomingHolidays(locale, t, tickerItems, new Date(), 90).slice(0, 6);
  }, [locale, t, tickerItems]);

  if (computedItems.length === 0) {
    return null;
  }

  return (
    <section
      aria-label={t.sections.comingUp}
      className="bg-white dark:bg-[#111C2D] border-y border-[#E2E8F0] dark:border-slate-800"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-4">
        <div className="flex items-center gap-2 shrink-0 text-[#0F1E36] dark:text-slate-100 font-extrabold text-sm whitespace-nowrap">
          <CalendarClock className="w-4 h-4 text-[#E63946]" />
          <span>{t.sections.comingUp}</span>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-thin pb-0.5 flex-1">
          {computedItems.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectPack(item.packSlug)}
              className={`group flex items-center gap-2.5 h-9 px-3.5 rounded-full border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                idx === 0
                  ? 'bg-[#E63946] border-[#E63946] text-white hover:bg-[#D62839]'
                  : 'bg-[#FAF8F5] dark:bg-slate-800/80 border-[#E2E8F0] dark:border-slate-700 text-[#1E293B] dark:text-slate-100 hover:border-[#E63946] dark:hover:border-[#E63946]'
              }`}
            >
              <span
                className={`text-xs font-extrabold tabular-nums ${
                  idx === 0
                    ? 'text-[#FFDEA9]'
                    : 'text-[#B7102A] dark:text-[#FFB3B1]'
                }`}
              >
                {item.countdownLabel}
              </span>
              <span className="text-xs opacity-40" aria-hidden="true">
                ·
              </span>
              <span className="text-xs sm:text-sm font-bold">{item.title}</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
