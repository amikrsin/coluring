import React, { useMemo, useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Download,
  Plus,
  Check,
  Loader2,
  BookOpen,
  Layers,
  Sparkles,
  AlertCircle,
  SlidersHorizontal,
} from 'lucide-react';
import {
  CategoryId,
  ColoringSheet,
  Locale,
  PackWithSheets,
  PaperSize,
} from '../types';
import { TranslationDictionary } from '../i18n/translations';
import { CategorySeoContent } from '../data/category-seo';
import { slugify } from '../data/catalog-store';
import {
  CategoryBundleProgress,
  buildAndDownloadCategoryPdfPack,
} from '../utils/category-pdf-bundler';
import { SheetCard } from './SheetCard';
import { PackCard } from './PackCard';
import { AdSlot } from './AdSlot';

type SheetDifficulty = ColoringSheet['difficulty'];

export interface SubcategoryStat {
  name: string;
  slug: string;
  count: number;
}

interface CategoryPageViewProps {
  categoryId: CategoryId;
  categoryLabel: string;
  activeSubcategory: string | null;
  allCategorySheets: ColoringSheet[];
  categoryPacks: PackWithSheets[];
  populatedSubcategories: SubcategoryStat[];
  sheetSubcategoryById: Map<string, string>;
  seo: CategorySeoContent;
  locale: Locale;
  t: TranslationDictionary;
  paperSize: PaperSize;
  printSetIds: Set<string>;
  onChangePaperSize: (size: PaperSize) => void;
  onNavigate: (path: string) => void;
  onOpenSheet: (sheet: ColoringSheet) => void;
  onTogglePrintSet: (sheet: ColoringSheet) => void;
  onAddSheetsToPrintSet: (sheets: ColoringSheet[]) => void;
  onColorOnline: (sheet: ColoringSheet) => void;
}

const DIFFICULTY_ORDER: SheetDifficulty[] = ['easy', 'medium', 'detailed'];

export const CategoryPageView: React.FC<CategoryPageViewProps> = ({
  categoryId,
  categoryLabel,
  activeSubcategory,
  allCategorySheets,
  categoryPacks,
  populatedSubcategories,
  sheetSubcategoryById,
  seo,
  locale,
  t,
  paperSize,
  printSetIds,
  onChangePaperSize,
  onNavigate,
  onOpenSheet,
  onTogglePrintSet,
  onAddSheetsToPrintSet,
  onColorOnline,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<SheetDifficulty | 'all'>('all');
  const [bundleProgress, setBundleProgress] = useState<CategoryBundleProgress | null>(null);
  const [bundleError, setBundleError] = useState<string | null>(null);
  const [bundleJustFinished, setBundleJustFinished] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  // Reset difficulty filter & FAQ accordion when navigating between categories/subcategories
  useEffect(() => {
    setSelectedDifficulty('all');
    setOpenFaqIdx(0);
    setBundleError(null);
    setBundleJustFinished(false);
  }, [categoryId, activeSubcategory]);

  // Sheets matching active sub-category route (before difficulty filter)
  const subcategoryScopedSheets = useMemo(() => {
    if (!activeSubcategory) return allCategorySheets;
    return allCategorySheets.filter(
      (s) => sheetSubcategoryById.get(s.id) === activeSubcategory
    );
  }, [allCategorySheets, activeSubcategory, sheetSubcategoryById]);

  // Populated difficulties in current scope (hide 0-page difficulty tabs)
  const populatedDifficulties = useMemo(() => {
    const counts = new Map<SheetDifficulty, number>();
    for (const s of subcategoryScopedSheets) {
      counts.set(s.difficulty, (counts.get(s.difficulty) || 0) + 1);
    }
    return DIFFICULTY_ORDER.map((diff) => ({
      id: diff,
      label:
        diff === 'easy'
          ? t.card.easy
          : diff === 'detailed'
          ? t.card.detailed
          : t.card.medium,
      count: counts.get(diff) || 0,
    })).filter((item) => item.count > 0);
  }, [subcategoryScopedSheets, t.card]);

  // Final visible sheets after sub-category + difficulty filters
  const visibleSheets = useMemo(() => {
    if (selectedDifficulty === 'all') return subcategoryScopedSheets;
    return subcategoryScopedSheets.filter((s) => s.difficulty === selectedDifficulty);
  }, [subcategoryScopedSheets, selectedDifficulty]);

  // Group visible sheets by sub-category so every section gets its own "+ Add All (Y)" button
  const groupedSections = useMemo(() => {
    const groups = new Map<string, ColoringSheet[]>();
    const order: string[] = [];

    for (const sheet of visibleSheets) {
      const subName = sheetSubcategoryById.get(sheet.id) || categoryLabel;
      if (!groups.has(subName)) {
        groups.set(subName, []);
        order.push(subName);
      }
      groups.get(subName)!.push(sheet);
    }

    return order.map((name) => ({
      name,
      slug: slugify(name),
      sheets: groups.get(name)!,
    }));
  }, [visibleSheets, sheetSubcategoryById, categoryLabel]);

  const allVisibleInPrintSet = useMemo(
    () =>
      visibleSheets.length > 0 &&
      visibleSheets.every((sheet) => printSetIds.has(sheet.id)),
    [visibleSheets, printSetIds]
  );

  const headingTitle = activeSubcategory
    ? `Free Printable ${activeSubcategory} Coloring Pages`
    : `Free Printable ${categoryLabel} Coloring Pages`;

  const packCollectionName = activeSubcategory
    ? `${activeSubcategory} ${categoryLabel}`
    : categoryLabel;

  const isBundling = bundleProgress !== null;
  const progressPct = bundleProgress
    ? Math.max(6, Math.round((bundleProgress.current / bundleProgress.total) * 100))
    : 0;

  const handleDownloadFullPack = async () => {
    if (isBundling || visibleSheets.length === 0) return;
    setBundleError(null);
    setBundleJustFinished(false);
    setBundleProgress({
      current: 1,
      total: visibleSheets.length,
      sheetTitle: '',
    });

    try {
      await buildAndDownloadCategoryPdfPack({
        collectionTitle: packCollectionName,
        subtitle: seo.leadIntro,
        sheets: visibleSheets,
        locale,
        paperSize,
        onProgress: (p) => setBundleProgress(p),
      });
      setBundleJustFinished(true);
      setTimeout(() => setBundleJustFinished(false), 3500);
    } catch {
      setBundleError(
        'Could not finish merging the PDF pack in this browser. Try again or download individual sheets below.'
      );
    } finally {
      setBundleProgress(null);
    }
  };

  const handleAnchorNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  };

  const categoryBasePath = `/${locale}/category/${categoryId}`;

  return (
    <div className="flex-1 flex flex-col">
      {/* 1. CATEGORY PAGE HEADER SECTION */}
      <section className="bg-gradient-to-b from-[#FFFDF9] to-[#FAF8F5] dark:from-[#0F1E36] dark:to-[#0B1320] border-b border-[#E2E8F0] dark:border-slate-800">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 sm:pt-8 sm:pb-10">
          {/* Breadcrumbs: Home / Coloring Pages / <Category> [/ <Sub-Category>] */}
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#64748B] dark:text-slate-400"
          >
            <a
              href={`/${locale}/`}
              onClick={(e) => handleAnchorNav(e, `/${locale}/`)}
              className="hover:text-[#E63946] transition-colors"
            >
              Home
            </a>
            <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
            <a
              href={`/${locale}/`}
              onClick={(e) => handleAnchorNav(e, `/${locale}/`)}
              className="hover:text-[#E63946] transition-colors"
            >
              {t.nav.coloringPages}
            </a>
            <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
            {activeSubcategory ? (
              <>
                <a
                  href={categoryBasePath}
                  onClick={(e) => handleAnchorNav(e, categoryBasePath)}
                  className="hover:text-[#E63946] transition-colors"
                >
                  {categoryLabel}
                </a>
                <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                <span
                  aria-current="page"
                  className="text-[#0F1E36] dark:text-white font-bold"
                >
                  {activeSubcategory}
                </span>
              </>
            ) : (
              <span
                aria-current="page"
                className="text-[#0F1E36] dark:text-white font-bold"
              >
                {categoryLabel}
              </span>
            )}
          </nav>

          {/* Main Header Layout */}
          <div className="max-w-4xl">
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#0F1E36] dark:text-white tracking-tight leading-[1.14]">
              {headingTitle}
            </h1>

            {/* Decorative Multi-Color Accent Line */}
            <div
              aria-hidden="true"
              className="mt-3.5 flex items-center gap-1.5 h-1.5 w-44 sm:w-56"
            >
              <span className="h-full flex-[1.5] rounded-full bg-[#E63946]" />
              <span className="h-full flex-1 rounded-full bg-[#FFB703]" />
              <span className="h-full flex-[1.2] rounded-full bg-[#2A9D8F]" />
              <span className="h-full flex-[0.8] rounded-full bg-[#0F1E36] dark:bg-slate-400" />
            </div>

            {/* 2-Paragraph SEO Header Introduction (120–160 words) */}
            <div className="mt-5 space-y-3 text-sm sm:text-[15px] text-[#475569] dark:text-slate-300 leading-relaxed max-w-3xl">
              <p>{seo.headerIntroParagraphs[0]}</p>
              <p>{seo.headerIntroParagraphs[1]}</p>
            </div>

            {/* Unboxed Metadata Line + Paper Size Toggle */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#E2E8F0] dark:border-slate-800">
              <p className="text-xs sm:text-sm font-bold text-[#0F1E36] dark:text-slate-200 tabular-nums">
                {visibleSheets.length}{' '}
                {visibleSheets.length === 1 ? 'Free Page' : 'Free Pages'}
                <span className="mx-2 text-[#94A3B8]">•</span>
                300 DPI PDF
                <span className="mx-2 text-[#94A3B8]">•</span>
                US Letter &amp; A4
                <span className="mx-2 text-[#94A3B8]">•</span>
                No Sign-Up
              </p>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 whitespace-nowrap">
                  Paper size:
                </span>
                <div
                  role="group"
                  aria-label="Paper size for PDF pack"
                  className="inline-flex items-center rounded-lg bg-white dark:bg-slate-900 p-0.5 border border-[#CBD5E1] dark:border-slate-700"
                >
                  <button
                    type="button"
                    onClick={() => onChangePaperSize('letter')}
                    className={`px-2.5 py-1 rounded-md text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
                      paperSize === 'letter'
                        ? 'bg-[#0F1E36] text-white'
                        : 'text-[#64748B] dark:text-slate-300 hover:text-[#0F1E36] dark:hover:text-white'
                    }`}
                  >
                    US Letter
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangePaperSize('a4')}
                    className={`px-2.5 py-1 rounded-md text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
                      paperSize === 'a4'
                        ? 'bg-[#0F1E36] text-white'
                        : 'text-[#64748B] dark:text-slate-300 hover:text-[#0F1E36] dark:hover:text-white'
                    }`}
                  >
                    A4
                  </button>
                </div>
              </div>
            </div>

            {/* Primary Header Bundler CTAs */}
            {visibleSheets.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={isBundling}
                  onClick={handleDownloadFullPack}
                  className="h-12 px-6 rounded-xl bg-[#E63946] hover:bg-[#D62839] disabled:opacity-75 text-white text-sm font-extrabold inline-flex items-center justify-center gap-2.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
                >
                  {isBundling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span className="tabular-nums">
                        Merging {bundleProgress.current} of {bundleProgress.total} pages...
                      </span>
                    </>
                  ) : bundleJustFinished ? (
                    <>
                      <Check className="w-4 h-4 shrink-0" />
                      <span>Booklet Downloaded!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 shrink-0" />
                      <span className="tabular-nums">
                        Download All {visibleSheets.length}{' '}
                        {visibleSheets.length === 1 ? 'Page' : 'Pages'} as 1 PDF
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onAddSheetsToPrintSet(visibleSheets)}
                  className={`h-12 px-5 rounded-xl border text-sm font-extrabold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                    allVisibleInPrintSet
                      ? 'bg-[#2A9D8F]/10 border-[#2A9D8F] text-[#115E59] dark:text-teal-300'
                      : 'bg-white dark:bg-slate-900 border-[#CBD5E1] dark:border-slate-700 hover:border-[#0F1E36] dark:hover:border-slate-500 text-[#0F1E36] dark:text-slate-100'
                  }`}
                >
                  {allVisibleInPrintSet ? (
                    <>
                      <Check className="w-4 h-4 text-[#2A9D8F] shrink-0" />
                      <span>
                        All {visibleSheets.length} in Print Set
                      </span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 shrink-0" />
                      <span>
                        {activeSubcategory || selectedDifficulty !== 'all'
                          ? `Add All ${visibleSheets.length} to Print Set`
                          : 'Add Entire Category to Print Set'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Live Progress Indicator for Client-Side PDF Pack Merge */}
            {isBundling && bundleProgress && (
              <div
                role="status"
                aria-live="polite"
                className="mt-4 max-w-xl rounded-xl bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 p-3.5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 text-xs font-bold text-[#0F1E36] dark:text-slate-100">
                  <span className="truncate">
                    Merging {bundleProgress.current} of {bundleProgress.total} pages
                    {bundleProgress.sheetTitle ? ` · ${bundleProgress.sheetTitle}` : '...'}
                  </span>
                  <span className="tabular-nums text-[#E63946] shrink-0">
                    {progressPct}%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-[#E2E8F0] dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#E63946] via-[#FFB703] to-[#2A9D8F] transition-all duration-200"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-[#64748B] dark:text-slate-400">
                  Building cover page + {paperSize === 'letter' ? 'US Letter' : 'A4'} 300 DPI booklet locally in your browser...
                </p>
              </div>
            )}

            {bundleError && (
              <div
                role="alert"
                className="mt-4 max-w-xl rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-4 py-3 flex items-start gap-2.5 text-xs font-semibold text-red-700 dark:text-red-300"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{bundleError}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. STICKY SUB-CATEGORY FILTER & JUMP BAR */}
      {(populatedSubcategories.length > 0 || populatedDifficulties.length > 1) && (
        <div className="sticky top-16 z-20 bg-white/95 dark:bg-[#0E1828]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-slate-800 shadow-[0_2px_10px_rgba(15,30,54,0.04)]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
            {/* Sub-category navigation tabs (clean SEO routes) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 lg:pb-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedDifficulty('all');
                  onNavigate(categoryBasePath);
                }}
                aria-current={!activeSubcategory ? 'page' : undefined}
                className={`h-8 px-3.5 rounded-lg text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                  !activeSubcategory
                    ? 'bg-[#0F1E36] text-white'
                    : 'bg-[#FAF8F5] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 text-[#334155] dark:text-slate-200 hover:border-[#0F1E36] dark:hover:border-slate-500'
                }`}
              >
                All ({allCategorySheets.length})
              </button>

              {populatedSubcategories.map((sub) => {
                const isActive = activeSubcategory === sub.name;
                return (
                  <button
                    key={sub.slug}
                    type="button"
                    onClick={() =>
                      onNavigate(`${categoryBasePath}/${sub.slug}`)
                    }
                    aria-current={isActive ? 'page' : undefined}
                    className={`h-8 px-3.5 rounded-lg text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                      isActive
                        ? 'bg-[#E63946] text-white'
                        : 'bg-[#FAF8F5] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 text-[#334155] dark:text-slate-200 hover:border-[#E63946]'
                    }`}
                  >
                    {sub.name} ({sub.count})
                  </button>
                );
              })}
            </div>

            {/* Difficulty Quick-Filter (Easy / Medium / Detailed — only populated levels shown) */}
            {populatedDifficulties.length > 1 && (
              <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#64748B] dark:text-slate-400 mr-1 whitespace-nowrap">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Level:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDifficulty('all')}
                  className={`h-7 px-2.5 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    selectedDifficulty === 'all'
                      ? 'bg-[#2A9D8F] text-white'
                      : 'text-[#475569] dark:text-slate-300 hover:bg-[#FAF8F5] dark:hover:bg-slate-800'
                  }`}
                >
                  All
                </button>
                {populatedDifficulties.map((diff) => (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() =>
                      setSelectedDifficulty(
                        selectedDifficulty === diff.id ? 'all' : diff.id
                      )
                    }
                    className={`h-7 px-2.5 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                      selectedDifficulty === diff.id
                        ? 'bg-[#2A9D8F] text-white'
                        : 'text-[#475569] dark:text-slate-300 hover:bg-[#FAF8F5] dark:hover:bg-slate-800'
                    }`}
                  >
                    {diff.label} ({diff.count})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN CONTENT BODY */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-12">
        {/* Coloring Sheets Grouped by Sub-Category (each section with its own "+ Add All (Y)" button) */}
        {visibleSheets.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 text-center">
            <p className="text-base font-extrabold text-[#0F1E36] dark:text-white">
              No coloring pages matched this filter yet.
            </p>
            <p className="mt-1.5 text-sm text-[#64748B] dark:text-slate-400">
              Reset your filter to view all free printable {categoryLabel} coloring sheets.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedDifficulty('all');
                onNavigate(categoryBasePath);
              }}
              className="mt-4 h-10 px-5 rounded-xl bg-[#E63946] hover:bg-[#D62839] text-white text-sm font-extrabold cursor-pointer"
            >
              Show All {categoryLabel} Pages
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {groupedSections.map((group) => {
              const sectionAllAdded = group.sheets.every((s) =>
                printSetIds.has(s.id)
              );
              const showSubcategoryLink =
                !activeSubcategory &&
                populatedSubcategories.some((sub) => sub.name === group.name);

              return (
                <section
                  key={group.slug}
                  id={`sub-${group.slug}`}
                  className="scroll-mt-36"
                >
                  {/* Sub-Category Section Header with "+ Add All (Y)" Button */}
                  <div className="mb-5 pb-3 border-b border-[#E2E8F0] dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-baseline gap-2.5">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F1E36] dark:text-white tracking-tight">
                        {group.name}
                      </h2>
                      <span className="text-xs sm:text-sm font-semibold text-[#64748B] dark:text-slate-400 tabular-nums">
                        {group.sheets.length}{' '}
                        {group.sheets.length === 1 ? 'page' : 'pages'}
                      </span>
                      {showSubcategoryLink && (
                        <a
                          href={`${categoryBasePath}/${group.slug}`}
                          onClick={(e) =>
                            handleAnchorNav(e, `${categoryBasePath}/${group.slug}`)
                          }
                          className="text-xs font-bold text-[#2A9D8F] hover:underline ml-1 whitespace-nowrap"
                        >
                          Open section →
                        </a>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onAddSheetsToPrintSet(group.sheets)}
                      className={`h-9 px-3.5 rounded-lg border text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                        sectionAllAdded
                          ? 'bg-[#2A9D8F]/10 border-[#2A9D8F] text-[#115E59] dark:text-teal-300'
                          : 'bg-white dark:bg-slate-900 border-[#CBD5E1] dark:border-slate-700 hover:border-[#0F1E36] dark:hover:border-slate-500 text-[#0F1E36] dark:text-slate-100'
                      }`}
                    >
                      {sectionAllAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#2A9D8F]" />
                          <span>All {group.sheets.length} Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add All ({group.sheets.length})</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Coloring Page Card Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {group.sheets.map((sheet) => (
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
              );
            })}
          </div>
        )}

        {/* Matching Curated Packs (shown on main category view) */}
        {!activeSubcategory &&
          selectedDifficulty === 'all' &&
          categoryPacks.length > 0 && (
            <section className="pt-2">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-[#2A9D8F]" />
                <h2 className="text-lg sm:text-xl font-extrabold text-[#0F1E36] dark:text-white tracking-tight">
                  Curated {categoryLabel} Packs ({categoryPacks.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {categoryPacks.map((pack) => (
                  <PackCard
                    key={pack.slug}
                    pack={pack}
                    locale={locale}
                    t={t}
                    onOpenPack={(slug) =>
                      onNavigate(`/${locale}/coloring-pages/${slug}`)
                    }
                  />
                ))}
              </div>
            </section>
          )}

        {/* Clean AdSense Slot Between Grid and Bottom Guide */}
        <AdSlot slotId="category-after-grid" format="leaderboard" />

        {/* 3. BOTTOM CATEGORY GUIDE & FAQ (FOR GOOGLE RANKING) */}
        <section className="pt-10 border-t border-[#E2E8F0] dark:border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Structured 200–300 Word "How to Print & Color These Pages" Guide */}
          <article className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#2A9D8F]">
              <BookOpen className="w-4 h-4" />
              <span>Printing &amp; Coloring Guide</span>
            </div>

            <h2 className="text-2xl sm:text-[26px] font-extrabold text-[#0F1E36] dark:text-white tracking-tight leading-tight">
              How to Print &amp; Color These {activeSubcategory || categoryLabel} Pages
            </h2>

            <div className="space-y-4 text-sm sm:text-[15px] text-[#475569] dark:text-slate-300 leading-relaxed">
              {seo.extendedGuide.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>

            {/* Quick Printing Checklist */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 p-3.5">
                <div className="text-xs font-extrabold text-[#0F1E36] dark:text-white">
                  1. Pick Your Paper
                </div>
                <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                  20 lb copy paper for crayons &amp; pencils; 65–80 lb cardstock for markers.
                </p>
              </div>
              <div className="rounded-xl bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 p-3.5">
                <div className="text-xs font-extrabold text-[#0F1E36] dark:text-white">
                  2. Fit to Printable Area
                </div>
                <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                  Choose US Letter or A4 above so crisp 300 DPI borders never clip.
                </p>
              </div>
              <div className="rounded-xl bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 p-3.5">
                <div className="text-xs font-extrabold text-[#0F1E36] dark:text-white">
                  3. Bundle or Color Online
                </div>
                <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                  Export a 1-click PDF booklet or paint digitally with Color Online.
                </p>
              </div>
            </div>
          </article>

          {/* Expandable FAQ Accordion (Synced with FAQPage JSON-LD) */}
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#E63946] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quick Answers</span>
            </div>
            <h3 className="text-xl font-extrabold text-[#0F1E36] dark:text-white mb-4 tracking-tight">
              {activeSubcategory || categoryLabel} Coloring Pages FAQ
            </h3>
            <div className="space-y-2.5">
              {seo.faqs.map((faq, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div
                    key={faq.q}
                    className="rounded-xl bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left cursor-pointer"
                    >
                      <span className="text-sm font-bold text-[#0F1E36] dark:text-white leading-snug">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#64748B] shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-[#E63946]' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-xs sm:text-sm text-[#475569] dark:text-slate-300 leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
