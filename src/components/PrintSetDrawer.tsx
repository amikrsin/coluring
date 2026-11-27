import React, { useEffect, useState } from 'react';
import { X, Printer, Trash2, Download, Paintbrush } from 'lucide-react';
import { ColoringSheet, Locale, PaperSize } from '../types';
import { TranslationDictionary, getText } from '../i18n/translations';
import { getLineArtDataUri } from '../data/line-art';
import { renderPdfThumbnailDataUrl } from '../utils/pdf-canvas';

interface PrintSetDrawerProps {
  open: boolean;
  sheets: ColoringSheet[];
  locale: Locale;
  t: TranslationDictionary;
  paperSize: PaperSize;
  onChangePaperSize: (size: PaperSize) => void;
  onClose: () => void;
  onRemoveSheet: (sheetId: string) => void;
  onClearAll: () => void;
  onColorOnline: (sheet: ColoringSheet) => void;
}

export const PrintSetDrawer: React.FC<PrintSetDrawerProps> = ({
  open,
  sheets,
  locale,
  t,
  paperSize,
  onChangePaperSize,
  onClose,
  onRemoveSheet,
  onClearAll,
  onColorOnline,
}) => {
  const [pdfThumbs, setPdfThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    sheets.forEach((s) => {
      if (s.sourcePdfUrl && !pdfThumbs[s.id]) {
        renderPdfThumbnailDataUrl(s.sourcePdfUrl, 240)
          .then((url) => {
            if (!cancelled) {
              setPdfThumbs((prev) => ({ ...prev, [s.id]: url }));
            }
          })
          .catch(() => {});
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, sheets, pdfThumbs]);

  if (!open) return null;

  const handlePrintAll = async () => {
    if (sheets.length === 0) return;

    const resolvedImages = await Promise.all(
      sheets.map(async (s) => {
        if (s.sourcePdfUrl) {
          try {
            return await renderPdfThumbnailDataUrl(s.sourcePdfUrl, 1100);
          } catch {
            return getLineArtDataUri(s.id);
          }
        }
        return getLineArtDataUri(s.id);
      })
    );

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const pagesHtml = sheets
      .map(
        (s, idx) => `
        <div class="sheet-page">
          <div class="sheet-header">${getText(s.title, locale)}</div>
          <img src="${resolvedImages[idx]}" alt="${getText(s.title, locale)}" />
          <div class="sheet-footer">ColorWorld · ${paperSize === 'a4' ? 'A4' : 'US Letter'} Printable</div>
        </div>
      `
      )
      .join('');

    doc.open();
    doc.write(`
      <!doctype html>
      <html>
        <head>
          <title>ColorWorld Print Set (${sheets.length})</title>
          <style>
            @page { size: ${paperSize === 'a4' ? 'A4' : 'letter'}; margin: 10mm; }
            body { margin: 0; font-family: sans-serif; color: #1E293B; }
            .sheet-page {
              page-break-after: always;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              height: 95vh;
            }
            .sheet-page:last-child { page-break-after: auto; }
            .sheet-header { font-weight: 700; font-size: 14px; width: 100%; }
            img { max-width: 100%; max-height: 84vh; object-fit: contain; }
            .sheet-footer { font-size: 10px; color: #64748B; width: 100%; }
          </style>
        </head>
        <body>
          ${pagesHtml}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                if (window.frameElement) window.frameElement.remove();
              }, 600);
            };
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#0F1E36]/60 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-[#E2E8F0] dark:border-slate-800"
        role="dialog"
        aria-modal="true"
        aria-label={t.printTray.title}
      >
        <div className="px-5 py-4 bg-[#0F1E36] text-white flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold">{t.printTray.title}</h2>
            <p className="text-xs text-slate-300 tabular-nums">
              {sheets.length} {sheets.length === 1 ? t.card.page : t.card.pages} ·{' '}
              {t.printTray.paperSizeNote} {paperSize === 'a4' ? 'A4' : 'US Letter'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper Format Bar */}
        <div className="px-5 py-3 bg-[#FAF8F5] dark:bg-slate-800/60 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-[#64748B] dark:text-slate-400">
            {t.pack.paperFormat}
          </span>
          <div className="flex items-center bg-white dark:bg-slate-900 rounded-full p-0.5 border border-[#E2E8F0] dark:border-slate-700">
            <button
              type="button"
              onClick={() => onChangePaperSize('a4')}
              className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                paperSize === 'a4' ? 'bg-[#2A9D8F] text-white' : 'text-[#64748B] dark:text-slate-300'
              }`}
            >
              A4
            </button>
            <button
              type="button"
              onClick={() => onChangePaperSize('letter')}
              className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                paperSize === 'letter' ? 'bg-[#2A9D8F] text-white' : 'text-[#64748B] dark:text-slate-300'
              }`}
            >
              US Letter
            </button>
          </div>
        </div>

        {/* Sheet List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {sheets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF8F5] dark:bg-slate-800 border border-dashed border-[#CBD5E1] dark:border-slate-600 flex items-center justify-center mb-3">
                <Printer className="w-6 h-6 text-[#64748B]" />
              </div>
              <p className="text-sm font-bold text-[#1E293B] dark:text-slate-100">
                {t.printTray.empty}
              </p>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 max-w-xs">
                {t.printTray.emptySub}
              </p>
            </div>
          ) : (
            sheets.map((sheet) => (
              <div
                key={sheet.id}
                className="p-3 rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-[#FAF8F5] dark:bg-slate-800/50 flex items-center gap-3"
              >
                <div className="w-14 h-16 rounded-lg bg-white border border-dashed border-[#CBD5E1] p-1 shrink-0 flex items-center justify-center">
                  <img
                    src={sheet.sourcePdfUrl ? pdfThumbs[sheet.id] || getLineArtDataUri('dino-trex') : getLineArtDataUri(sheet.id)}
                    alt={getText(sheet.title, locale)}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[#1E293B] dark:text-slate-100 truncate">
                    {getText(sheet.title, locale)}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <a
                      href={sheet.pdfUrls[paperSize]}
                      download={`colorworld-${sheet.id}-${paperSize}.pdf`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#0F1E36] dark:text-slate-200 hover:text-[#E63946]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {t.printTray.downloadPdf}
                    </a>
                    <span className="text-[#CBD5E1]" aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onColorOnline(sheet);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#E63946] hover:underline cursor-pointer"
                    >
                      <Paintbrush className="w-3.5 h-3.5" />
                      {t.card.colorOnline}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveSheet(sheet.id)}
                  aria-label="Remove sheet"
                  className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-[#64748B] hover:text-[#E63946] flex items-center justify-center cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {sheets.length > 0 && (
          <div className="p-4 border-t border-[#E2E8F0] dark:border-slate-800 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClearAll}
              className="h-11 px-4 rounded-xl border border-[#CBD5E1] dark:border-slate-700 text-xs font-bold text-[#64748B] dark:text-slate-300 hover:text-[#1E293B] dark:hover:text-white cursor-pointer"
            >
              {t.printTray.clearAll}
            </button>
            <button
              type="button"
              onClick={handlePrintAll}
              className="flex-1 h-11 px-4 rounded-xl bg-[#E63946] hover:bg-[#D62839] text-white text-sm font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>
                {t.printTray.printAll} ({sheets.length})
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
