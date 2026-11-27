import React, { useEffect, useState } from 'react';
import {
  ChevronRight,
  Download,
  Printer,
  Paintbrush,
  Plus,
  Check,
  Link2,
  Loader2,
  FileText,
  Sparkles,
  Maximize2,
  ShieldCheck,
} from 'lucide-react';
import { ColoringSheet, Locale, PaperSize } from '../types';
import { TranslationDictionary, getText } from '../i18n/translations';
import { getLineArtDataUri } from '../data/line-art';
import { slugify } from '../data/catalog-store';
import { renderPdfThumbnailDataUrl } from '../utils/pdf-canvas';
import { generateColoringPdfBytes } from '../utils/pdf-generator';
import { SheetCard } from './SheetCard';
import { AdSlot } from './AdSlot';

interface SheetDetailViewProps {
  sheet: ColoringSheet;
  categoryLabel: string;
  subcategory: string;
  relatedSheets: ColoringSheet[];
  locale: Locale;
  t: TranslationDictionary;
  paperSize: PaperSize;
  inPrintSet: boolean;
  printSetIds: Set<string>;
  onChangePaperSize: (size: PaperSize) => void;
  onNavigate: (path: string) => void;
  onOpenSheet: (sheet: ColoringSheet) => void;
  onTogglePrintSet: (sheet: ColoringSheet) => void;
  onColorOnline: (sheet: ColoringSheet) => void;
}

export const SheetDetailView: React.FC<SheetDetailViewProps> = ({
  sheet,
  categoryLabel,
  subcategory,
  relatedSheets,
  locale,
  t,
  paperSize,
  inPrintSet,
  printSetIds,
  onChangePaperSize,
  onNavigate,
  onOpenSheet,
  onTogglePrintSet,
  onColorOnline,
}) => {
  const title = getText(sheet.title, locale);
  const description = getText(sheet.description, locale);
  const fallbackArtUri = getLineArtDataUri(sheet.id);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!sheet.sourcePdfUrl) {
      setPdfPreviewUrl(null);
      return;
    }
    let cancelled = false;
    renderPdfThumbnailDataUrl(sheet.sourcePdfUrl, 1200)
      .then((url) => {
        if (!cancelled) setPdfPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPdfPreviewUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [sheet.sourcePdfUrl, sheet.id]);

  const previewSrc = sheet.sourcePdfUrl
    ? pdfPreviewUrl || ''
    : sheet.lineArtUrl || sheet.thumbnailUrl || fallbackArtUri;

  const difficultyLabel =
    sheet.difficulty === 'easy'
      ? t.card.easy
      : sheet.difficulty === 'detailed'
      ? t.card.detailed
      : t.card.medium;

  const pdfHref = sheet.pdfUrls[paperSize];
  const isRemoteOrStaticPdf =
    Boolean(pdfHref) &&
    (pdfHref.startsWith('https://') ||
      pdfHref.startsWith('http://') ||
      (pdfHref.startsWith('/') && !pdfHref.startsWith('/cdn/pdfs/')));

  const handleDownloadFreePdf = async () => {
    const fileName = `colorworld-${sheet.id}-${paperSize}.pdf`;

    if (isRemoteOrStaticPdf) {
      setDownloadingPdf(true);
      try {
        const res = await fetch(pdfHref, { mode: 'cors' });
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1500);
          setDownloadingPdf(false);
          return;
        }
      } catch {
        // Cross-origin R2 without download CORS header: fall back to direct anchor navigation
      }
      const a = document.createElement('a');
      a.href = pdfHref;
      a.download = fileName;
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloadingPdf(false);
      return;
    }

    // Pure client-side 300 DPI vector PDF generation for built-in catalog sheets
    setDownloadingPdf(true);
    try {
      const pdfBytes = generateColoringPdfBytes(sheet.id, title, paperSize);
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrintDirectly = () => {
    window.print();
  };

  const handleCopyShareLink = async () => {
    const shareUrl = `${window.location.origin}/page/${sheet.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Clipboard API unavailable
    }
  };

  const handleAnchorNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate(path);
  };

  const categoryPath = `/${locale}/category/${sheet.category}`;
  const subcategoryPath = subcategory
    ? `/${locale}/category/${sheet.category}/${slugify(subcategory)}`
    : categoryPath;

  return (
    <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 print:p-0 print:m-0 print:max-w-none">
      {/* Breadcrumb Navigation: Home / Category / Sub-Category / Sheet Title */}
      <nav
        aria-label="Breadcrumb"
        className="no-print mb-6 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#64748B] dark:text-slate-400"
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
          href={categoryPath}
          onClick={(e) => handleAnchorNav(e, categoryPath)}
          className="hover:text-[#E63946] transition-colors"
        >
          {categoryLabel}
        </a>
        {subcategory && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
            <a
              href={subcategoryPath}
              onClick={(e) => handleAnchorNav(e, subcategoryPath)}
              className="hover:text-[#E63946] transition-colors"
            >
              {subcategory}
            </a>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
        <span
          aria-current="page"
          className="text-[#0F1E36] dark:text-slate-100 font-bold truncate max-w-[260px] sm:max-w-md"
        >
          {title}
        </span>
      </nav>

      {/* Main 2-Column Coloring Sheet Showcase & Action Module */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-8 items-start print:block">
        {/* Left Column (7 cols): Large High-Contrast Printable Coloring Sheet Frame */}
        <div className="lg:col-span-7 print-sheet-frame">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 p-4 sm:p-6 paper-card-shadow print:border-0 print:shadow-none print:p-0 print:bg-white print:rounded-none">
            <div className="w-full aspect-[8.5/11] bg-white rounded-xl border-[1.5px] border-dashed border-[#CBD5E1] dark:border-slate-600 p-4 sm:p-6 flex items-center justify-center overflow-hidden print:border-0 print:rounded-none print:p-0 print:aspect-auto print:h-auto">
              {previewSrc ? (
                <img
                  src={previewSrc}
                  alt={`${title} – Free Printable Coloring Page`}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!sheet.sourcePdfUrl && img.src !== fallbackArtUri) {
                      img.src = fallbackArtUri;
                    }
                  }}
                  className="print-sheet-image w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-xs font-semibold text-[#64748B]">
                  <Loader2 className="w-5 h-5 animate-spin text-[#2A9D8F]" />
                  <span>Preparing high-resolution preview...</span>
                </div>
              )}
            </div>

            <div className="no-print mt-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#64748B] dark:text-slate-400">
              <span>
                Free PDF • 300 DPI • {paperSize === 'letter' ? 'US Letter (8.5×11 in)' : 'A4 (210×297 mm)'}
              </span>
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="inline-flex items-center gap-1.5 font-bold text-[#0F1E36] dark:text-slate-200 hover:text-[#E63946] transition-colors cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span className="text-[#16A34A]">Link Copied</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Copy Share Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Title, Actions, Specs Box & Beside-Preview Ad Slot */}
        <div className="no-print lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 p-5 sm:p-6 paper-card-shadow space-y-5">
            {/* Unboxed Clean Metadata Line */}
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#2A9D8F] dark:text-[#6FD8C8]">
                <span>{categoryLabel}</span>
                {subcategory && (
                  <>
                    <span aria-hidden="true" className="text-[#CBD5E1] dark:text-slate-600">
                      ·
                    </span>
                    <span>{subcategory}</span>
                  </>
                )}
                <span aria-hidden="true" className="text-[#CBD5E1] dark:text-slate-600">
                  ·
                </span>
                <span className="text-[#64748B] dark:text-slate-400">{difficultyLabel}</span>
                <span aria-hidden="true" className="text-[#CBD5E1] dark:text-slate-600">
                  ·
                </span>
                <span className="text-[#64748B] dark:text-slate-400">{sheet.ageRange}</span>
              </div>

              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0F1E36] dark:text-white tracking-tight leading-tight">
                {title}
              </h1>

              <p className="mt-2.5 text-sm text-[#475569] dark:text-slate-300 leading-relaxed">
                {description}
              </p>
            </div>

            {/* Paper Size Selector */}
            <div className="flex items-center justify-between gap-3 py-3 border-y border-[#E2E8F0] dark:border-slate-800">
              <span className="text-xs font-bold text-[#475569] dark:text-slate-300">
                Print Paper Size
              </span>
              <div className="flex items-center rounded-lg bg-[#FAF8F5] dark:bg-slate-800 p-1 border border-[#E2E8F0] dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => onChangePaperSize('letter')}
                  className={`px-3 py-1 rounded-md text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
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
                  className={`px-3 py-1 rounded-md text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
                    paperSize === 'a4'
                      ? 'bg-[#0F1E36] text-white'
                      : 'text-[#64748B] dark:text-slate-300 hover:text-[#0F1E36] dark:hover:text-white'
                  }`}
                >
                  A4
                </button>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                disabled={downloadingPdf}
                onClick={handleDownloadFreePdf}
                className="w-full h-12 px-5 rounded-xl bg-[#E63946] hover:bg-[#D62839] disabled:opacity-65 text-white text-sm font-extrabold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              >
                {downloadingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Free PDF</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handlePrintDirectly}
                  className="h-11 px-4 rounded-xl bg-[#0F1E36] hover:bg-[#192D4E] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Printer className="w-4 h-4 text-[#FFB703]" />
                  <span>Print Directly</span>
                </button>

                <button
                  type="button"
                  onClick={() => onColorOnline(sheet)}
                  className="h-11 px-4 rounded-xl bg-[#2A9D8F] hover:bg-[#228579] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Paintbrush className="w-4 h-4" />
                  <span>Color Online</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => onTogglePrintSet(sheet)}
                aria-pressed={inPrintSet}
                className={`w-full h-11 px-4 rounded-xl border text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                  inPrintSet
                    ? 'bg-[#2A9D8F]/10 border-[#2A9D8F] text-[#115E59] dark:text-teal-300'
                    : 'bg-[#FAF8F5] dark:bg-slate-800 border-[#CBD5E1] dark:border-slate-700 hover:border-[#0F1E36] dark:hover:border-slate-500 text-[#0F1E36] dark:text-slate-100'
                }`}
              >
                {inPrintSet ? (
                  <>
                    <Check className="w-4 h-4 text-[#2A9D8F]" />
                    <span>Added to Print Set</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Add to Print Set</span>
                  </>
                )}
              </button>
            </div>

            {/* Sheet Specifications Box */}
            <div className="pt-4 border-t border-[#E2E8F0] dark:border-slate-800 space-y-2.5">
              <h2 className="text-xs font-extrabold text-[#0F1E36] dark:text-white tracking-wide">
                Sheet Specifications
              </h2>
              <dl className="divide-y divide-[#E2E8F0]/70 dark:divide-slate-800 text-xs">
                <div className="py-2 flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-[#64748B] dark:text-slate-400 font-semibold">
                    <FileText className="w-3.5 h-3.5 text-[#2A9D8F]" />
                    <span>Format</span>
                  </dt>
                  <dd className="font-bold text-[#0F1E36] dark:text-slate-100">PDF</dd>
                </div>
                <div className="py-2 flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-[#64748B] dark:text-slate-400 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-[#2A9D8F]" />
                    <span>Resolution</span>
                  </dt>
                  <dd className="font-bold text-[#0F1E36] dark:text-slate-100 tabular-nums">
                    300 DPI
                  </dd>
                </div>
                <div className="py-2 flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-[#64748B] dark:text-slate-400 font-semibold">
                    <Maximize2 className="w-3.5 h-3.5 text-[#2A9D8F]" />
                    <span>Paper Size</span>
                  </dt>
                  <dd className="font-bold text-[#0F1E36] dark:text-slate-100">
                    US Letter &amp; A4
                  </dd>
                </div>
                <div className="py-2 flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-[#64748B] dark:text-slate-400 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2A9D8F]" />
                    <span>License</span>
                  </dt>
                  <dd className="font-bold text-[#0F1E36] dark:text-slate-100 text-right">
                    Free for Personal &amp; Classroom Use
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* AdSense Banner Slot cleanly placed beside the preview */}
          <AdSlot slotId="sheet-detail-sidebar" format="sidebar" />
        </div>
      </section>

      {/* AdSense Banner Slot cleanly placed below the preview */}
      <div className="no-print mt-8">
        <AdSlot slotId="sheet-detail-below-preview" format="leaderboard" />
      </div>

      {/* Related Coloring Pages Grid (8 Sheets prioritized by same sub-category) */}
      {relatedSheets.length > 0 && (
        <section className="no-print mt-10 pt-8 border-t border-[#E2E8F0] dark:border-slate-800">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F1E36] dark:text-white tracking-tight">
                Related Coloring Pages
              </h2>
              <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">
                More free printable {subcategory || categoryLabel} sheets in 300 DPI US Letter &amp; A4 PDF.
              </p>
            </div>
            <a
              href={categoryPath}
              onClick={(e) => handleAnchorNav(e, categoryPath)}
              className="text-sm font-extrabold text-[#E63946] hover:underline whitespace-nowrap"
            >
              Browse all {categoryLabel}
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedSheets.slice(0, 8).map((rel) => (
              <SheetCard
                key={rel.id}
                sheet={rel}
                locale={locale}
                t={t}
                paperSize={paperSize}
                inPrintSet={printSetIds.has(rel.id)}
                onOpenSheet={onOpenSheet}
                onTogglePrintSet={onTogglePrintSet}
                onColorOnline={onColorOnline}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
};
