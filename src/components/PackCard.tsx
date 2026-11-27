import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Locale, PackWithSheets } from '../types';
import { TranslationDictionary, getText } from '../i18n/translations';
import { getLineArtDataUri } from '../data/line-art';
import { renderPdfThumbnailDataUrl } from '../utils/pdf-canvas';

interface PackCardProps {
  pack: PackWithSheets;
  locale: Locale;
  t: TranslationDictionary;
  showGrowthBadge?: boolean;
  onOpenPack: (slug: string) => void;
}

export const PackCard: React.FC<PackCardProps> = ({
  pack,
  locale,
  t,
  showGrowthBadge = false,
  onOpenPack,
}) => {
  const title = getText(pack.title, locale);
  const leadSheet = pack.sheets[0];
  const fallbackUri = leadSheet ? getLineArtDataUri(leadSheet.id) : '';
  const [pdfThumb, setPdfThumb] = useState<string | null>(null);

  useEffect(() => {
    if (!leadSheet?.sourcePdfUrl) {
      setPdfThumb(null);
      return;
    }
    let cancelled = false;
    renderPdfThumbnailDataUrl(leadSheet.sourcePdfUrl, 380)
      .then((url) => {
        if (!cancelled) setPdfThumb(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [leadSheet?.sourcePdfUrl]);

  const previewSrc = leadSheet?.sourcePdfUrl
    ? pdfThumb || ''
    : leadSheet?.thumbnailUrl || '';

  return (
    <article
      onClick={() => onOpenPack(pack.slug)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenPack(pack.slug);
        }
      }}
      className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 p-4 flex flex-col paper-card-shadow transition-transform duration-200 hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E63946]"
    >
      {/* Artwork Preview Frame */}
      <div className="relative w-full aspect-[4/3] rounded-xl bg-white border-[1.5px] border-dashed border-[#CBD5E1] dark:border-slate-600 p-3 flex items-center justify-center overflow-hidden">
        {leadSheet && previewSrc ? (
          <img
            src={previewSrc}
            alt={title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const img = e.currentTarget;
              if (!leadSheet.sourcePdfUrl && img.src !== fallbackUri) img.src = fallbackUri;
            }}
            className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="text-xs font-semibold text-[#64748B]">Loading preview...</div>
        )}
      </div>

      {/* Pack Metadata */}
      <div className="mt-3.5 flex-1 flex flex-col">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2A9D8F] dark:text-[#6FD8C8]">
          <span>{t.categories[pack.category] || pack.category}</span>
          <span aria-hidden="true" className="text-[#CBD5E1] dark:text-slate-600">
            ·
          </span>
          <span className="text-[#64748B] dark:text-slate-400 tabular-nums">
            {pack.sheets.length} {pack.sheets.length === 1 ? t.card.page : t.card.pages}
          </span>
        </div>

        <h3 className="mt-1 text-base font-bold text-[#1E293B] dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-[#E63946] transition-colors">
          {title}
        </h3>

        <div className="mt-auto pt-3 flex items-center justify-between gap-2 text-[11px] text-[#64748B] dark:text-slate-400">
          <span className="truncate font-semibold text-[#475569] dark:text-slate-400">
            Free PDF • 300 DPI • US Letter &amp; A4
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0F1E36] dark:text-slate-200 group-hover:text-[#E63946] transition-colors shrink-0">
            {t.card.openPack}
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </article>
  );
};
