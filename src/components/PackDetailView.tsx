import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Printer,
  Check,
} from 'lucide-react';
import {
  ColoringSheet,
  Locale,
  PackWithSheets,
  PaperSize,
} from '../types';
import { TranslationDictionary, getText } from '../i18n/translations';
import { SheetCard } from './SheetCard';
import { PackCard } from './PackCard';
import { AdSlot } from './AdSlot';

interface PackDetailViewProps {
  pack: PackWithSheets;
  relatedPacks: PackWithSheets[];
  locale: Locale;
  t: TranslationDictionary;
  paperSize: PaperSize;
  printSetIds: Set<string>;
  onChangePaperSize: (size: PaperSize) => void;
  onBackHome: () => void;
  onOpenPack: (slug: string) => void;
  onOpenSheet: (sheet: ColoringSheet) => void;
  onTogglePrintSet: (sheet: ColoringSheet) => void;
  onAddPackToPrintSet: (sheets: ColoringSheet[]) => void;
  onColorOnline: (sheet: ColoringSheet) => void;
}

export const PackDetailView: React.FC<PackDetailViewProps> = ({
  pack,
  relatedPacks,
  locale,
  t,
  paperSize,
  printSetIds,
  onChangePaperSize,
  onBackHome,
  onOpenPack,
  onOpenSheet,
  onTogglePrintSet,
  onAddPackToPrintSet,
  onColorOnline,
}) => {
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`colorworld_vote_${pack.slug}`);
      setUserVote(saved === 'up' || saved === 'down' ? saved : null);
    } catch {
      setUserVote(null);
    }
  }, [pack.slug]);

  const handleVoteClick = (dir: 'up' | 'down') => {
    const next = userVote === dir ? null : dir;
    setUserVote(next);
    try {
      if (next) localStorage.setItem(`colorworld_vote_${pack.slug}`, next);
      else localStorage.removeItem(`colorworld_vote_${pack.slug}`);
    } catch {
      // ignore storage errors
    }
  };

  const title = getText(pack.title, locale);
  const seoIntro = getText(pack.seoIntro, locale);
  const allInSet = pack.sheets.every((s) => printSetIds.has(s.id));

  return (
    <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs sm:text-sm text-[#64748B] dark:text-slate-400">
        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex items-center gap-1.5 font-bold text-[#0F1E36] dark:text-slate-200 hover:text-[#E63946] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.pack.backHome}</span>
        </button>
        <span aria-hidden="true">/</span>
        <span>{t.categories[pack.category]}</span>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-[#1E293B] dark:text-slate-100 truncate">{title}</span>
      </nav>

      {/* Pack Header Card */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 p-6 sm:p-8 paper-card-shadow">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#2A9D8F] dark:text-[#6FD8C8]">
              <span>{t.categories[pack.category] || pack.category}</span>
              <span aria-hidden="true" className="text-[#CBD5E1] dark:text-slate-600">·</span>
              <span className="tabular-nums">
                {pack.sheets.length} {t.pack.sheetsInPack}
              </span>
              <span aria-hidden="true" className="text-[#CBD5E1] dark:text-slate-600">·</span>
              <span className="text-[#475569] dark:text-slate-300">
                Free PDF • 300 DPI • US Letter &amp; A4
              </span>
            </div>

            <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0F1E36] dark:text-white tracking-tight">
              {title}
            </h1>

            <p className="mt-3 text-sm sm:text-base text-[#475569] dark:text-slate-300 leading-relaxed">
              {seoIntro}
            </p>
          </div>

          {/* Right Paper Switcher + Pack Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
            {/* Paper Format Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#64748B] dark:text-slate-400">
                {t.pack.paperFormat}:
              </span>
              <div className="inline-flex items-center bg-[#FAF8F5] dark:bg-slate-800 p-1 rounded-full border border-[#E2E8F0] dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => onChangePaperSize('a4')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-colors cursor-pointer ${
                    paperSize === 'a4'
                      ? 'bg-[#2A9D8F] text-white shadow-sm'
                      : 'text-[#64748B] dark:text-slate-300 hover:text-[#0F1E36] dark:hover:text-white'
                  }`}
                >
                  A4
                </button>
                <button
                  type="button"
                  onClick={() => onChangePaperSize('letter')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-colors cursor-pointer ${
                    paperSize === 'letter'
                      ? 'bg-[#2A9D8F] text-white shadow-sm'
                      : 'text-[#64748B] dark:text-slate-300 hover:text-[#0F1E36] dark:hover:text-white'
                  }`}
                >
                  US Letter
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onAddPackToPrintSet(pack.sheets)}
              className={`h-11 px-5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                allInSet
                  ? 'bg-[#2A9D8F] text-white hover:bg-[#21867A]'
                  : 'bg-[#E63946] text-white hover:bg-[#D62839]'
              }`}
            >
              {allInSet ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t.card.inPrintSet}</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{t.pack.addPackToTray}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bottom Voting & Print Notice Bar */}
        <div className="mt-6 pt-5 border-t border-[#E2E8F0] dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-slate-400">
            <Printer className="w-4 h-4 text-[#2A9D8F]" />
            <span>{t.pack.noSignUp}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400">
              {t.pack.helpful}
            </span>
            <button
              type="button"
              onClick={() => handleVoteClick('up')}
              className={`h-8 px-3 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                userVote === 'up'
                  ? 'bg-[#2A9D8F] border-[#2A9D8F] text-white'
                  : 'border-[#E2E8F0] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#1E293B] dark:text-slate-200 hover:border-[#2A9D8F]'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{userVote === 'up' ? 'Helpful!' : 'Yes'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleVoteClick('down')}
              className={`h-8 px-3 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                userVote === 'down'
                  ? 'bg-[#0F1E36] border-[#0F1E36] text-white'
                  : 'border-[#E2E8F0] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 text-[#1E293B] dark:text-slate-200 hover:border-[#64748B]'
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              <span>No</span>
            </button>
          </div>
        </div>
      </section>

      {/* Responsive Coloring Sheets Grid */}
      <section className="mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {pack.sheets.map((sheet) => (
            <SheetCard
              key={sheet.id}
              sheet={sheet}
              locale={locale}
              t={t}
              paperSize={paperSize}
              inPrintSet={printSetIds.has(sheet.id)}
              onOpenSheet={onOpenSheet}
              onTogglePrintSet={onTogglePrintSet}
              onColorOnline={onColorOnline}
            />
          ))}
        </div>
      </section>

      <AdSlot slotId="pack-detail-mid" format="leaderboard" />

      {/* Related Collections */}
      {relatedPacks.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F1E36] dark:text-white mb-5">
            {t.pack.relatedPacks}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedPacks.map((rel) => (
              <PackCard
                key={rel.slug}
                pack={rel}
                locale={locale}
                t={t}
                onOpenPack={onOpenPack}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
};
