import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js web worker cleanly for Vite + Cloudflare Pages static builds
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface PdfRenderResult {
  width: number;
  height: number;
  numPages: number;
}

const thumbnailCache = new Map<string, string>();
const thumbnailInflight = new Map<string, Promise<string>>();

/**
 * Renders a PDF page (from URL or uploaded ArrayBuffer) onto an HTML5 Canvas
 * at high resolution with a pure white paper backdrop so automatic black-outline
 * detection and scanline flood-fill work immediately on any coloring PDF.
 */
export async function renderPdfPageToCanvas(
  source: string | ArrayBuffer,
  canvas: HTMLCanvasElement,
  pageNumber = 1,
  targetWidth = 960
): Promise<PdfRenderResult> {
  const loadingTask =
    typeof source === 'string'
      ? pdfjsLib.getDocument({ url: source })
      : pdfjsLib.getDocument({ data: new Uint8Array(source.slice(0)) });

  const pdf = await loadingTask.promise;
  const safePage = Math.max(1, Math.min(pageNumber, pdf.numPages));
  const page = await pdf.getPage(safePage);

  const baseViewport = page.getViewport({ scale: 1 });
  const scale = targetWidth / baseViewport.width;
  const viewport = page.getViewport({ scale });

  const width = Math.round(viewport.width);
  const height = Math.round(viewport.height);

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Could not acquire 2D canvas context');
  }

  // Paint pure white paper background first (PDFs often have transparent pages)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  await page.render({
    canvasContext: ctx,
    viewport,
    canvas,
  }).promise;

  const totalPages = pdf.numPages;
  await loadingTask.destroy();

  return {
    width,
    height,
    numPages: totalPages,
  };
}

/**
 * Renders page 1 of a PDF URL to a cached PNG thumbnail data URL so PDF-backed
 * coloring sheets automatically display real previews on cards without pre-rendering.
 */
export function renderPdfThumbnailDataUrl(
  pdfUrl: string,
  targetWidth = 360
): Promise<string> {
  const cacheKey = `${pdfUrl}@${targetWidth}`;
  const existing = thumbnailCache.get(cacheKey);
  if (existing) return Promise.resolve(existing);

  const pending = thumbnailInflight.get(cacheKey);
  if (pending) return pending;

  const promise = (async () => {
    const offscreen = document.createElement('canvas');
    await renderPdfPageToCanvas(pdfUrl, offscreen, 1, targetWidth);
    const dataUrl = offscreen.toDataURL('image/png');
    thumbnailCache.set(cacheKey, dataUrl);
    thumbnailInflight.delete(cacheKey);
    return dataUrl;
  })().catch((err) => {
    thumbnailInflight.delete(cacheKey);
    throw err;
  });

  thumbnailInflight.set(cacheKey, promise);
  return promise;
}
