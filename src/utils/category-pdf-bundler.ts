import { ColoringSheet, Locale, PaperSize } from '../types';
import { getText } from '../i18n/translations';
import { getLineArtDataUri } from '../data/line-art';
import { renderPdfThumbnailDataUrl } from './pdf-canvas';
import { slugify } from '../data/catalog-store';

const PAPER_POINTS: Record<PaperSize, { width: number; height: number; label: string }> = {
  letter: { width: 612, height: 792, label: 'US Letter (8.5 × 11 in)' },
  a4: { width: 595.28, height: 841.89, label: 'A4 (210 × 297 mm)' },
};

export interface CategoryBundleProgress {
  current: number;
  total: number;
  sheetTitle: string;
}

function sanitizePdfWinAnsi(text: string): string {
  // Standard PDF Helvetica fonts use WinAnsi encoding; replace unsupported glyphs safely
  return text
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/•/g, '-')
    .replace(/×/g, 'x')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
}

function wrapTextLines(
  text: string,
  maxCharsPerLine: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxCharsPerLine) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

async function renderSheetToPngBytes(sheet: ColoringSheet): Promise<{
  bytes: Uint8Array;
  width: number;
  height: number;
}> {
  // 1. If backed by a real PDF, render a crisp 1400px white-backdrop PNG via pdf.js
  if (sheet.sourcePdfUrl) {
    try {
      const dataUrl = await renderPdfThumbnailDataUrl(sheet.sourcePdfUrl, 1400);
      const res = await fetch(dataUrl);
      const buf = await res.arrayBuffer();
      const img = await loadImageElement(dataUrl);
      return {
        bytes: new Uint8Array(buf),
        width: img.naturalWidth || 1400,
        height: img.naturalHeight || 1800,
      };
    } catch {
      // Fall through to thumbnail / SVG line art fallback
    }
  }

  // 2. Try sheet lineArtUrl / thumbnailUrl, falling back cleanly to crisp built-in vector line art
  const candidates = [
    sheet.lineArtUrl,
    sheet.thumbnailUrl,
    getLineArtDataUri(sheet.id),
  ].filter((u): u is string => Boolean(u) && !u.startsWith('/cdn/thumbs/'));

  let loadedImg: HTMLImageElement | null = null;
  for (const src of candidates) {
    try {
      loadedImg = await loadImageElement(src);
      break;
    } catch {
      // Try next fallback source
    }
  }

  if (!loadedImg) {
    loadedImg = await loadImageElement(getLineArtDataUri(sheet.id));
  }

  const naturalW = loadedImg.naturalWidth || 800;
  const naturalH = loadedImg.naturalHeight || 1000;
  const targetWidth = 1400;
  const scale = targetWidth / naturalW;
  const width = Math.round(naturalW * scale);
  const height = Math.round(naturalH * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize 2D canvas for PDF export.');
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(loadedImg, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to encode sheet PNG'))),
      'image/png'
    );
  });

  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    width,
    height,
  };
}

function isDirectExternalOrStaticPdfUrl(url: string | undefined): url is string {
  if (!url) return false;
  return (
    url.startsWith('https://') ||
    url.startsWith('http://') ||
    (url.startsWith('/') && !url.startsWith('/cdn/pdfs/') && url.toLowerCase().endsWith('.pdf'))
  );
}

/**
 * Merges all coloring sheets in a category (or active sub-category) into a single
 * print-ready multi-page PDF booklet using `pdf-lib` purely client-side, complete
 * with a clean cover/title page and per-sheet progress updates.
 */
export async function buildAndDownloadCategoryPdfPack(params: {
  collectionTitle: string;
  subtitle?: string;
  sheets: ColoringSheet[];
  locale: Locale;
  paperSize: PaperSize;
  onProgress?: (progress: CategoryBundleProgress) => void;
}): Promise<void> {
  const { collectionTitle, subtitle, sheets, locale, paperSize, onProgress } = params;
  if (sheets.length === 0) return;

  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const paper = PAPER_POINTS[paperSize] || PAPER_POINTS.letter;

  const mergedPdf = await PDFDocument.create();
  const fontBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await mergedPdf.embedFont(StandardFonts.Helvetica);

  const cleanCollectionTitle = sanitizePdfWinAnsi(collectionTitle);
  mergedPdf.setTitle(`ColorWorld - ${cleanCollectionTitle} Coloring Pack`);
  mergedPdf.setSubject(
    `Free printable ${cleanCollectionTitle} coloring pages (${sheets.length} pages)`
  );
  mergedPdf.setCreator('ColorWorld');
  mergedPdf.setProducer('ColorWorld Static PDF Bundler');

  // 1. Clean Printable Cover / Title Page
  const coverPage = mergedPdf.addPage([paper.width, paper.height]);
  const margin = 52;
  const contentW = paper.width - margin * 2;

  // Decorative multi-color top accent bar
  const stripeW = contentW / 4;
  const stripeY = paper.height - 56;
  const stripeColors = [
    rgb(0.902, 0.224, 0.275), // #E63946
    rgb(1.0, 0.718, 0.012),   // #FFB703
    rgb(0.165, 0.616, 0.561), // #2A9D8F
    rgb(0.059, 0.118, 0.212), // #0F1E36
  ];
  stripeColors.forEach((col, i) => {
    coverPage.drawRectangle({
      x: margin + i * stripeW,
      y: stripeY,
      width: stripeW,
      height: 6,
      color: col,
    });
  });

  // Brand kicker
  coverPage.drawText('COLORWORLD  |  FREE PRINTABLE COLORING PACK', {
    x: margin,
    y: stripeY - 34,
    size: 10,
    font: fontBold,
    color: rgb(0.165, 0.616, 0.561),
  });

  // Main Cover Title (wrapped cleanly)
  const titleLines = wrapTextLines(
    `Free Printable ${cleanCollectionTitle} Coloring Pages`,
    32
  );
  let cursorY = stripeY - 82;
  for (const line of titleLines) {
    coverPage.drawText(line, {
      x: margin,
      y: cursorY,
      size: 28,
      font: fontBold,
      color: rgb(0.059, 0.118, 0.212),
    });
    cursorY -= 36;
  }

  if (subtitle) {
    const subLines = wrapTextLines(sanitizePdfWinAnsi(subtitle), 66).slice(0, 3);
    cursorY -= 6;
    for (const line of subLines) {
      coverPage.drawText(line, {
        x: margin,
        y: cursorY,
        size: 11.5,
        font: fontRegular,
        color: rgb(0.35, 0.42, 0.52),
      });
      cursorY -= 17;
    }
  }

  // Pack Specs Divider Box
  cursorY -= 14;
  coverPage.drawRectangle({
    x: margin,
    y: cursorY - 46,
    width: contentW,
    height: 46,
    color: rgb(0.98, 0.973, 0.96),
    borderColor: rgb(0.86, 0.89, 0.92),
    borderWidth: 1,
  });

  const specLine = sanitizePdfWinAnsi(
    `${sheets.length} Free Pages   |   300 DPI Print Ready   |   ${paper.label}   |   Personal & Classroom Use`
  );
  coverPage.drawText(specLine, {
    x: margin + 16,
    y: cursorY - 27,
    size: 10,
    font: fontBold,
    color: rgb(0.059, 0.118, 0.212),
  });

  // Table of Contents
  cursorY -= 78;
  coverPage.drawText('INCLUDED IN THIS BOOKLET', {
    x: margin,
    y: cursorY,
    size: 10,
    font: fontBold,
    color: rgb(0.42, 0.48, 0.56),
  });
  cursorY -= 22;

  const maxTocItems = 22;
  const tocSheets = sheets.slice(0, maxTocItems);
  const twoColumns = tocSheets.length > 11;
  const colWidth = twoColumns ? contentW / 2 - 12 : contentW;

  tocSheets.forEach((s, idx) => {
    const col = twoColumns && idx >= 11 ? 1 : 0;
    const row = twoColumns && idx >= 11 ? idx - 11 : idx;
    const itemTitle = sanitizePdfWinAnsi(getText(s.title, locale));
    const truncated =
      itemTitle.length > (twoColumns ? 32 : 64)
        ? `${itemTitle.slice(0, twoColumns ? 29 : 61)}...`
        : itemTitle;

    coverPage.drawText(`${String(idx + 1).padStart(2, '0')}.  ${truncated}`, {
      x: margin + col * (colWidth + 24),
      y: cursorY - row * 21,
      size: 10.5,
      font: fontRegular,
      color: rgb(0.15, 0.2, 0.28),
    });
  });

  if (sheets.length > maxTocItems) {
    coverPage.drawText(
      `+ ${sheets.length - maxTocItems} additional printable coloring sheets included`,
      {
        x: margin,
        y: cursorY - 11 * 21 - 8,
        size: 10,
        font: fontBold,
        color: rgb(0.165, 0.616, 0.561),
      }
    );
  }

  // Cover Footer
  coverPage.drawLine({
    start: { x: margin, y: 66 },
    end: { x: paper.width - margin, y: 66 },
    thickness: 0.75,
    color: rgb(0.86, 0.89, 0.92),
  });
  coverPage.drawText(
    'ColorWorld  |  Free for Personal, Home & Classroom Printing  |  Print Tip: Select "Fit to Page" for clean margins.',
    {
      x: margin,
      y: 44,
      size: 9,
      font: fontRegular,
      color: rgb(0.45, 0.5, 0.58),
    }
  );

  // 2. Append Each Coloring Sheet Sequentially with Live Progress
  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    const sheetTitle = getText(sheet.title, locale);
    onProgress?.({
      current: i + 1,
      total: sheets.length,
      sheetTitle,
    });

    // Yield one frame so React renders progress bar smoothly
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const directPdfUrl =
      isDirectExternalOrStaticPdfUrl(sheet.pdfUrls[paperSize])
        ? sheet.pdfUrls[paperSize]
        : isDirectExternalOrStaticPdfUrl(sheet.sourcePdfUrl)
        ? sheet.sourcePdfUrl
        : null;

    let copiedDirectPdf = false;
    if (directPdfUrl) {
      try {
        const res = await fetch(directPdfUrl, { mode: 'cors' });
        if (res.ok) {
          const pdfBytes = await res.arrayBuffer();
          const srcDoc = await PDFDocument.load(pdfBytes, {
            ignoreEncryption: true,
          });
          const copiedPages = await mergedPdf.copyPages(
            srcDoc,
            srcDoc.getPageIndices()
          );
          copiedPages.forEach((p) => mergedPdf.addPage(p));
          copiedDirectPdf = true;
        }
      } catch {
        // Fallback to high-res PNG embedding below
      }
    }

    if (!copiedDirectPdf) {
      const rendered = await renderSheetToPngBytes(sheet);
      const pngImage = await mergedPdf.embedPng(rendered.bytes);
      const page = mergedPdf.addPage([paper.width, paper.height]);

      const pageMarginX = 36;
      const headerHeight = 42;
      const footerHeight = 34;
      const availW = paper.width - pageMarginX * 2;
      const availH = paper.height - headerHeight - footerHeight;

      const scale = Math.min(availW / rendered.width, availH / rendered.height);
      const drawW = rendered.width * scale;
      const drawH = rendered.height * scale;
      const drawX = (paper.width - drawW) / 2;
      const drawY = footerHeight + (availH - drawH) / 2;

      page.drawText(sanitizePdfWinAnsi(sheetTitle), {
        x: pageMarginX,
        y: paper.height - 28,
        size: 12,
        font: fontBold,
        color: rgb(0.12, 0.16, 0.23),
      });

      page.drawText(sanitizePdfWinAnsi(`Page ${i + 1} of ${sheets.length}`), {
        x: paper.width - pageMarginX - 74,
        y: paper.height - 27,
        size: 9,
        font: fontRegular,
        color: rgb(0.42, 0.48, 0.56),
      });

      page.drawImage(pngImage, {
        x: drawX,
        y: drawY,
        width: drawW,
        height: drawH,
      });

      page.drawText(
        sanitizePdfWinAnsi(`ColorWorld  |  Free Printable  |  ${paper.label}`),
        {
          x: pageMarginX,
          y: 16,
          size: 8.5,
          font: fontRegular,
          color: rgb(0.45, 0.5, 0.58),
        }
      );
    }
  }

  const finalBytes = await mergedPdf.save();
  const blob = new Blob([new Uint8Array(finalBytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `colorworld-${slugify(collectionTitle) || 'coloring'}-pack-${paperSize}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}
