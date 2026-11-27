import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDown, Loader2 } from 'lucide-react';
import { ColoringSheet, Locale, PaperSize } from '../types';
import { TranslationDictionary, getText } from '../i18n/translations';
import { getLineArtDataUri } from '../data/line-art';
import { renderPdfPageToCanvas, renderPdfThumbnailDataUrl } from '../utils/pdf-canvas';
import { CombinedPdfPageInput, generateCombinedPdfBytes } from '../utils/pdf-generator';

interface FloatingPrintSetBarProps {
  sheets: ColoringSheet[];
  locale: Locale;
  t: TranslationDictionary;
  paperSize: PaperSize;
  onClearAll: () => void;
  onOpenDrawer: () => void;
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export const FloatingPrintSetBar: React.FC<FloatingPrintSetBarProps> = ({
  sheets,
  locale,
  t,
  paperSize,
  onClearAll,
  onOpenDrawer,
}) => {
  const [leadThumb, setLeadThumb] = useState<string | null>(null);
  const [buildingPdf, setBuildingPdf] = useState(false);

  const leadSheet = sheets[sheets.length - 1] || sheets[0];

  useEffect(() => {
    if (!leadSheet) {
      setLeadThumb(null);
      return;
    }
    if (!leadSheet.sourcePdfUrl) {
      setLeadThumb(getLineArtDataUri(leadSheet.id));
      return;
    }
    let cancelled = false;
    renderPdfThumbnailDataUrl(leadSheet.sourcePdfUrl, 160)
      .then((url) => {
        if (!cancelled) setLeadThumb(url);
      })
      .catch(() => {
        if (!cancelled) setLeadThumb(getLineArtDataUri('dino-trex'));
      });
    return () => {
      cancelled = true;
    };
  }, [leadSheet]);

  const handleDownloadCombinedPdf = async () => {
    if (sheets.length === 0 || buildingPdf) return;
    setBuildingPdf(true);

    try {
      // Single direct PDF sheet downloads directly without re-encoding
      if (sheets.length === 1 && sheets[0].sourcePdfUrl) {
        const link = document.createElement('a');
        link.href = sheets[0].sourcePdfUrl;
        link.download = `colorworld-${sheets[0].id}-${paperSize}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        return;
      }

      const pageInputs: CombinedPdfPageInput[] = [];

      for (const sheet of sheets) {
        const title = getText(sheet.title, locale);
        if (sheet.sourcePdfUrl) {
          const offscreen = document.createElement('canvas');
          const { width, height } = await renderPdfPageToCanvas(
            sheet.sourcePdfUrl,
            offscreen,
            1,
            1100
          );
          const jpegDataUrl = offscreen.toDataURL('image/jpeg', 0.92);
          pageInputs.push({
            sheetId: sheet.id,
            title,
            jpegBytes: dataUrlToUint8Array(jpegDataUrl),
            jpegWidth: width,
            jpegHeight: height,
          });
        } else {
          pageInputs.push({
            sheetId: sheet.id,
            title,
          });
        }
      }

      const pdfBytes = generateCombinedPdfBytes(pageInputs, paperSize);
      const pdfBuffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength
      ) as ArrayBuffer;
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `colorworld-print-set-${sheets.length}-pages-${paperSize}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } finally {
      setBuildingPdf(false);
    }
  };

  return (
    <AnimatePresence>
      {sheets.length > 0 && (
        <div className="no-print fixed bottom-4 sm:bottom-6 inset-x-0 z-40 flex justify-center px-3 pointer-events-none">
          <motion.div
            key="floating-print-bar"
            initial={{ opacity: 0, y: 90, scale: 0.9 }}
            animate={{
              opacity: 1,
              y: [90, -14, 5, -5, 0],
              scale: [0.9, 1.03, 0.99, 1.01, 1],
            }}
            exit={{ opacity: 0, y: 70, scale: 0.92 }}
            transition={{
              opacity: { duration: 0.22 },
              y: { duration: 0.78, times: [0, 0.42, 0.66, 0.84, 1], ease: 'easeOut' },
              scale: { duration: 0.78, times: [0, 0.42, 0.66, 0.84, 1], ease: 'easeOut' },
            }}
            className="pointer-events-auto w-full max-w-[420px] sm:w-auto sm:max-w-full bg-[#0F1E36] text-white rounded-[22px] p-2.5 pl-3.5 pr-2.5 shadow-[0_18px_40px_-8px_rgba(15,30,54,0.55)] border border-white/12 flex items-center justify-between gap-3 sm:gap-7"
          >
            {/* Left: Mini Stacked Page Thumbnail + Count + Clear */}
            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
              <motion.button
                key={sheets.length}
                type="button"
                onClick={onOpenDrawer}
                initial={{ scale: 0.85, rotate: -4 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 520, damping: 16 }}
                title="View Print Set"
                aria-label="Open print set preview"
                className="relative w-10 h-12 rounded-[6px] bg-white p-1 shadow-md border border-slate-200 shrink-0 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
              >
                {sheets.length > 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-1 w-full h-full rounded-[6px] bg-white/80 border border-slate-300 -z-10 rotate-6"
                  />
                )}
                {leadThumb && (
                  <img
                    src={leadThumb}
                    alt={leadSheet ? getText(leadSheet.title, locale) : 'Print set preview'}
                    className="w-full h-full object-contain"
                  />
                )}
              </motion.button>

              <div className="min-w-0">
                <button
                  type="button"
                  onClick={onOpenDrawer}
                  className="block text-left text-[15px] sm:text-base font-extrabold text-white leading-tight hover:text-[#FFC233] transition-colors tabular-nums cursor-pointer whitespace-nowrap"
                >
                  {sheets.length} {sheets.length === 1 ? t.card.page : t.card.pages}
                </button>
                <div className="text-[13px] text-slate-300 leading-snug flex items-center gap-1.5 whitespace-nowrap mt-0.5">
                  <span className="hidden sm:inline">in your print set</span>
                  <span aria-hidden="true" className="hidden sm:inline">·</span>
                  <button
                    type="button"
                    onClick={onClearAll}
                    className="underline underline-offset-2 text-slate-300 hover:text-white font-medium cursor-pointer"
                  >
                    clear
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Sunny Gold Download PDF CTA */}
            <motion.button
              type="button"
              onClick={handleDownloadCombinedPdf}
              disabled={buildingPdf}
              whileTap={{ scale: 0.97 }}
              className="h-12 px-5 sm:px-6 rounded-[15px] bg-[#FFC233] hover:bg-[#FFB703] active:bg-[#F2A900] text-[#0F1E36] text-[15px] font-extrabold inline-flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-75"
            >
              {buildingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span className="sm:hidden">Building...</span>
                  <span className="hidden sm:inline">Building PDF...</span>
                </>
              ) : (
                <>
                  <ArrowDown className="w-4 h-4 shrink-0" strokeWidth={2.75} />
                  <span className="sm:hidden">Download PDF</span>
                  <span className="hidden sm:inline">Download as one PDF</span>
                </>
              )}
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
