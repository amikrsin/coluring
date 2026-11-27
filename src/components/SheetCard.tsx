import React, { useEffect, useState } from 'react';
import { Download, Paintbrush, Plus, Check } from 'lucide-react';
import { ColoringSheet, Locale, PaperSize } from '../types';
import { TranslationDictionary, getText } from '../i18n/translations';
import { getLineArtDataUri } from '../data/line-art';
import { renderPdfThumbnailDataUrl } from '../utils/pdf-canvas';

interface SheetCardProps {
  sheet: ColoringSheet;
  locale: Locale;
  t: TranslationDictionary;
  paperSize: PaperSize;
  rank?: number;
  inPrintSet: boolean;
  onOpenSheet: (sheet: ColoringSheet) => void;
  onTogglePrintSet: (sheet: ColoringSheet) => void;
  onColorOnline: (sheet: ColoringSheet) => void;
}

export const SheetCard: React.FC<SheetCardProps> = ({
  sheet,
  locale,
  t,
  rank,
  inPrintSet,
  onOpenSheet,
  onTogglePrintSet,
  onColorOnline,
}) => {
  const title = getText(sheet.title, locale);
  const pageHref = `/page/${sheet.id}`;
  const fallbackArtUri = getLineArtDataUri(sheet.id);
  const [pdfThumb, setPdfThumb] = useState<string | null>(null);

  useEffect(() => {
    if (!sheet.sourcePdfUrl) {
      setPdfThumb(null);
      return;
    }
    let cancelled = false;
    renderPdfThumbnailDataUrl(sheet.sourcePdfUrl, 380)
      .then((url) => {
        if (!cancelled) setPdfThumb(url);
      })
      .catch(() => {
        // Fallback silently
      });
    return () => {
      cancelled = true;
    };
  }, [sheet.sourcePdfUrl]);

  const previewSrc = sheet.sourcePdfUrl ? pdfThumb || '' : sheet.thumbnailUrl;

  const difficultyLabel =
    sheet.difficulty === 'easy'
      ? t.card.easy
      : sheet.difficulty === 'detailed'
      ? t.card.detailed
      : t.card.medium;

  const handleSheetLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onOpenSheet(sheet);
  };

  return (
    <article className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 p-4 flex flex-col paper-card-shadow transition-transform duration-200 hover:-translate-y-0.5">
      {/* Top-Left Rank Stamp (if ranked) */}
      {typeof rank === 'number' && (
        <span
          className={`absolute top-3 left-3 z-10 h-6 px-2 rounded-md text-xs font-extrabold tabular-nums flex items-center justify-center shadow-sm ${
            rank <= 3
              ? 'bg-[#FFB703] text-[#0F1E36]'
              : 'bg-[#0F1E36] text-white dark:bg-slate-700'
          }`}
        >
          #{rank}
        </span>
      )}

      {/* Top-Right Circular Print Set Quick-Add Toggle (never navigates away) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onTogglePrintSet(sheet);
        }}
        title={inPrintSet ? t.card.inPrintSet : t.card.addToPrintSet}
        aria-label={inPrintSet ? t.card.inPrintSet : t.card.addToPrintSet}
        aria-pressed={inPrintSet}
        className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm cursor-pointer ${
          inPrintSet
            ? 'bg-[#2A9D8F] text-white hover:bg-[#21867A]'
            : 'bg-[#E63946] text-white hover:bg-[#D62839]'
        }`}
      >
        {inPrintSet ? (
          <Check className="w-4 h-4" strokeWidth={2.75} />
        ) : (
          <Plus className="w-4 h-4" strokeWidth={2.75} />
        )}
      </button>

      {/* Printable Dashed Cut-Out Artwork Frame -> Navigates to /page/:slug */}
      <a
        href={pageHref}
        onClick={handleSheetLinkClick}
        aria-label={`View and download ${title}`}
        className="w-full aspect-[4/5] rounded-xl bg-white border-[1.5px] border-dashed border-[#CBD5E1] dark:border-slate-600 p-3 flex items-center justify-center overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E63946]"
      >
        {previewSrc ? (
          <img
            src={previewSrc}
            alt={title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const img = e.currentTarget;
              if (!sheet.sourcePdfUrl && img.src !== fallbackArtUri) img.src = fallbackArtUri;
            }}
            className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="text-xs font-semibold text-[#64748B]">Rendering PDF preview...</div>
        )}
      </a>

      {/* Title & Authentic Print Metadata */}
      <div className="mt-3.5 flex-1 flex flex-col">
        <h3 className="text-[15px] font-bold text-[#1E293B] dark:text-slate-100 leading-snug line-clamp-1">
          <a
            href={pageHref}
            onClick={handleSheetLinkClick}
            className="hover:text-[#E63946] transition-colors focus-visible:outline-none focus-visible:underline"
          >
            {title}
          </a>
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-[#64748B] dark:text-slate-400">
          <span>{difficultyLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{sheet.ageRange}</span>
        </div>
        <div className="mt-1 text-[11px] font-semibold text-[#2A9D8F] dark:text-[#6FD8C8] truncate">
          Free PDF • 300 DPI • US Letter &amp; A4
        </div>

        {/* Direct Working Buttons: Download PDF (opens /page/:slug) + Color Online */}
        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <a
            href={pageHref}
            onClick={handleSheetLinkClick}
            className="h-10 px-2.5 rounded-xl border border-[#CBD5E1] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 hover:border-[#0F1E36] dark:hover:border-slate-500 text-[#0F1E36] dark:text-slate-100 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Download PDF</span>
          </a>

          <button
            type="button"
            onClick={() => onColorOnline(sheet)}
            className="h-10 px-2.5 rounded-xl bg-[#E63946] hover:bg-[#D62839] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Paintbrush className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t.card.colorOnline}</span>
          </button>
        </div>
      </div>
    </article>
  );
};
