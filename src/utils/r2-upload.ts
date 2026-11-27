import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { PDFDocument } from 'pdf-lib';
import { slugify } from '../data/catalog-store';

export const R2_SETTINGS_STORAGE_KEY = 'colorworld_r2_settings_v1';

export interface R2ConnectionSettings {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string;
}

export interface ConvertedColoringAssets {
  webpBlob: Blob;
  webpBytes: Uint8Array;
  webpSizeBytes: number;
  webpWidth: number;
  webpHeight: number;
  pdfBlob: Blob;
  pdfBytes: Uint8Array;
  pdfSizeBytes: number;
  previewObjectUrl: string;
  originalWidth: number;
  originalHeight: number;
}

export type R2UploadStage =
  | 'idle'
  | 'converting'
  | 'uploading-webp'
  | 'uploading-pdf'
  | 'done'
  | 'error';

export interface R2UploadResult {
  previewWebpUrl: string;
  pdfUrl: string;
  pdfLetterUrl: string;
  webpKey: string;
  pdfKey: string;
}

export const EMPTY_R2_SETTINGS: R2ConnectionSettings = {
  accountId: '',
  accessKeyId: '',
  secretAccessKey: '',
  bucketName: '',
  publicBaseUrl: '',
};

const ACCOUNT_ID_RE = /^[a-zA-Z0-9]{16,64}$/;
const BUCKET_NAME_RE = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;

export function loadR2Settings(): R2ConnectionSettings {
  try {
    const raw = localStorage.getItem(R2_SETTINGS_STORAGE_KEY);
    if (!raw) return { ...EMPTY_R2_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<R2ConnectionSettings>;
    return {
      accountId: typeof parsed.accountId === 'string' ? parsed.accountId : '',
      accessKeyId: typeof parsed.accessKeyId === 'string' ? parsed.accessKeyId : '',
      secretAccessKey:
        typeof parsed.secretAccessKey === 'string' ? parsed.secretAccessKey : '',
      bucketName: typeof parsed.bucketName === 'string' ? parsed.bucketName : '',
      publicBaseUrl: typeof parsed.publicBaseUrl === 'string' ? parsed.publicBaseUrl : '',
    };
  } catch {
    return { ...EMPTY_R2_SETTINGS };
  }
}

export function saveR2Settings(settings: R2ConnectionSettings): void {
  try {
    const sanitized: R2ConnectionSettings = {
      accountId: settings.accountId.trim(),
      accessKeyId: settings.accessKeyId.trim(),
      secretAccessKey: settings.secretAccessKey.trim(),
      bucketName: settings.bucketName.trim().toLowerCase(),
      publicBaseUrl: settings.publicBaseUrl.trim().replace(/\/+$/, ''),
    };
    localStorage.setItem(R2_SETTINGS_STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearR2Settings(): void {
  try {
    localStorage.removeItem(R2_SETTINGS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function isR2Ready(settings: R2ConnectionSettings): boolean {
  return Boolean(
    settings.accountId.trim() &&
      settings.accessKeyId.trim() &&
      settings.secretAccessKey.trim() &&
      settings.bucketName.trim() &&
      settings.publicBaseUrl.trim()
  );
}

function normalizePublicBaseUrl(raw: string): string | null {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

function validateAndCreateBrowserR2Client(settings: R2ConnectionSettings): {
  client: S3Client;
  bucketName: string;
  publicBaseUrl: string;
} {
  const accountId = settings.accountId.trim();
  const accessKeyId = settings.accessKeyId.trim();
  const secretAccessKey = settings.secretAccessKey.trim();
  const bucketName = settings.bucketName.trim().toLowerCase();
  const publicBaseUrl = normalizePublicBaseUrl(settings.publicBaseUrl);

  if (!accountId || !ACCOUNT_ID_RE.test(accountId)) {
    throw new Error(
      'Invalid Cloudflare R2 Account ID (expected 16–64 alphanumeric characters).'
    );
  }
  if (!accessKeyId || accessKeyId.length < 8) {
    throw new Error('Invalid or missing R2 Access Key ID.');
  }
  if (!secretAccessKey || secretAccessKey.length < 16) {
    throw new Error('Invalid or missing R2 Secret Access Key.');
  }
  if (!bucketName || !BUCKET_NAME_RE.test(bucketName)) {
    throw new Error(
      'Invalid R2 Bucket Name (use lowercase letters, numbers, dots, and hyphens).'
    );
  }
  if (!publicBaseUrl) {
    throw new Error(
      'Invalid Public Custom Domain URL (must start with https://, e.g., https://cdn.yoursite.com).'
    );
  }

  // Pure client-side browser S3 client configured for Cloudflare R2 (100% static Cloudflare Pages compatible)
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
    // Prevent AWS SDK v3 automatic CRC32 checksum headers that break browser CORS on Cloudflare R2
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });

  return { client, bucketName, publicBaseUrl };
}

function formatR2BrowserError(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message : fallback;
  if (/failed to fetch|networkerror|cors|load failed/i.test(msg)) {
    return 'Browser request blocked by R2 CORS policy. Add your site origin to your Cloudflare R2 bucket CORS rules (PUT, GET, HEAD allowed) and retry.';
  }
  return msg || fallback;
}

export function filenameToTitleAndSlug(filename: string): {
  title: string;
  slug: string;
} {
  const withoutExt = filename.replace(/\.[^/.]+$/, '');
  const spaced = withoutExt
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const title = spaced
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: title || 'Untitled Coloring Page',
    slug: slugify(withoutExt) || 'coloring-page',
  };
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function loadImageFromFile(file: File): Promise<{
  img: HTMLImageElement;
  objectUrl: string;
}> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, objectUrl });
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Could not decode image file "${file.name}".`));
    };
    img.src = objectUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Browser failed to encode ${mimeType}.`));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

/**
 * Converts a dropped PNG/JPG/WebP coloring sheet in the browser into:
 * 1. An optimized `.webp` preview image (max width 700px, pure white background composited).
 * 2. A print-ready US Letter (8.5 × 11 in = 612 × 792 pt) `.pdf` file via pdf-lib.
 */
export async function convertImageToWebpAndPdf(
  file: File,
  options?: {
    maxWebpWidth?: number;
    webpQuality?: number;
    title?: string;
  }
): Promise<ConvertedColoringAssets> {
  const maxWebpWidth = options?.maxWebpWidth ?? 700;
  const webpQuality = options?.webpQuality ?? 0.86;

  const { img, objectUrl } = await loadImageFromFile(file);
  const originalWidth = img.naturalWidth || img.width;
  const originalHeight = img.naturalHeight || img.height;

  if (!originalWidth || !originalHeight) {
    URL.revokeObjectURL(objectUrl);
    throw new Error('Selected image has invalid dimensions.');
  }

  // 1. Render optimized <= 700px wide WebP on pure white paper background
  const scale = originalWidth > maxWebpWidth ? maxWebpWidth / originalWidth : 1;
  const webpWidth = Math.max(1, Math.round(originalWidth * scale));
  const webpHeight = Math.max(1, Math.round(originalHeight * scale));

  const webpCanvas = document.createElement('canvas');
  webpCanvas.width = webpWidth;
  webpCanvas.height = webpHeight;
  const wCtx = webpCanvas.getContext('2d');
  if (!wCtx) {
    URL.revokeObjectURL(objectUrl);
    throw new Error('Canvas 2D context unavailable.');
  }
  wCtx.fillStyle = '#FFFFFF';
  wCtx.fillRect(0, 0, webpWidth, webpHeight);
  wCtx.imageSmoothingEnabled = true;
  wCtx.imageSmoothingQuality = 'high';
  wCtx.drawImage(img, 0, 0, webpWidth, webpHeight);

  const webpBlob = await canvasToBlob(webpCanvas, 'image/webp', webpQuality);
  if (webpBlob.type !== 'image/webp') {
    URL.revokeObjectURL(objectUrl);
    throw new Error('This browser does not support WebP canvas encoding.');
  }
  const webpBytes = new Uint8Array(await webpBlob.arrayBuffer());

  // 2. Build print-ready US Letter (8.5 x 11 in = 612 x 792 pt) PDF using pdf-lib
  const pdfDoc = await PDFDocument.create();
  if (options?.title) {
    pdfDoc.setTitle(options.title);
  }
  pdfDoc.setCreator('ColorWorld');
  pdfDoc.setProducer('ColorWorld Print Engine');

  let embeddedImage;
  const lowerType = file.type.toLowerCase();
  if (lowerType === 'image/jpeg' || lowerType === 'image/jpg') {
    const jpgBytes = new Uint8Array(await file.arrayBuffer());
    embeddedImage = await pdfDoc.embedJpg(jpgBytes);
  } else if (lowerType === 'image/png') {
    const pngBytes = new Uint8Array(await file.arrayBuffer());
    embeddedImage = await pdfDoc.embedPng(pngBytes);
  } else {
    const maxPrintPx = 2550;
    const printScale =
      Math.max(originalWidth, originalHeight) > maxPrintPx
        ? maxPrintPx / Math.max(originalWidth, originalHeight)
        : 1;
    const pCanvas = document.createElement('canvas');
    pCanvas.width = Math.max(1, Math.round(originalWidth * printScale));
    pCanvas.height = Math.max(1, Math.round(originalHeight * printScale));
    const pCtx = pCanvas.getContext('2d');
    if (!pCtx) {
      URL.revokeObjectURL(objectUrl);
      throw new Error('Canvas 2D context unavailable for PDF export.');
    }
    pCtx.fillStyle = '#FFFFFF';
    pCtx.fillRect(0, 0, pCanvas.width, pCanvas.height);
    pCtx.drawImage(img, 0, 0, pCanvas.width, pCanvas.height);
    const pngBlob = await canvasToBlob(pCanvas, 'image/png');
    const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
    embeddedImage = await pdfDoc.embedPng(pngBytes);
  }

  // US Letter: 8.5 x 11 inches = 612 x 792 pt
  const isLandscape = originalWidth > originalHeight * 1.15;
  const pageWidth = isLandscape ? 792 : 612;
  const pageHeight = isLandscape ? 612 : 792;
  const margin = 36; // 0.5 inch clean printer margin
  const maxDrawW = pageWidth - margin * 2;
  const maxDrawH = pageHeight - margin * 2;

  const imgRatio = originalWidth / originalHeight;
  let drawW = maxDrawW;
  let drawH = drawW / imgRatio;
  if (drawH > maxDrawH) {
    drawH = maxDrawH;
    drawW = drawH * imgRatio;
  }

  const drawX = (pageWidth - drawW) / 2;
  const drawY = (pageHeight - drawH) / 2;

  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  page.drawImage(embeddedImage, {
    x: drawX,
    y: drawY,
    width: drawW,
    height: drawH,
  });

  const pdfBytes = await pdfDoc.save();
  const pdfArrayBuffer = new ArrayBuffer(pdfBytes.byteLength);
  new Uint8Array(pdfArrayBuffer).set(pdfBytes);
  const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });

  return {
    webpBlob,
    webpBytes,
    webpSizeBytes: webpBlob.size,
    webpWidth,
    webpHeight,
    pdfBlob,
    pdfBytes: new Uint8Array(pdfArrayBuffer),
    pdfSizeBytes: pdfBlob.size,
    previewObjectUrl: objectUrl,
    originalWidth,
    originalHeight,
  };
}

/**
 * Pure browser-direct Cloudflare R2 connection check using @aws-sdk/client-s3.
 * Requires zero backend server (works on static Cloudflare Pages).
 */
export async function testR2Connection(
  settings: R2ConnectionSettings
): Promise<{ ok: boolean; error?: string; bucketName?: string }> {
  let client: S3Client | null = null;
  try {
    const resolved = validateAndCreateBrowserR2Client(settings);
    client = resolved.client;
    await client.send(new HeadBucketCommand({ Bucket: resolved.bucketName }));
    return { ok: true, bucketName: resolved.bucketName };
  } catch (err) {
    return {
      ok: false,
      error: formatR2BrowserError(err, 'Unable to connect to Cloudflare R2 bucket.'),
    };
  } finally {
    client?.destroy();
  }
}

/**
 * Pure browser-direct upload of optimized WebP and US Letter PDF directly into Cloudflare R2:
 *   - webp/<category-slug>/<slug>.webp
 *   - pdf/<category-slug>/<slug>.pdf
 */
export async function uploadAssetsToR2(params: {
  settings: R2ConnectionSettings;
  categorySlug: string;
  slug: string;
  assets: ConvertedColoringAssets;
  onStageChange?: (stage: R2UploadStage) => void;
}): Promise<R2UploadResult> {
  const cleanCategory = slugify(params.categorySlug) || 'general';
  const cleanSlug = slugify(params.slug);
  if (!cleanSlug) {
    throw new Error('A valid URL slug is required before uploading to R2.');
  }

  const { client, bucketName, publicBaseUrl } = validateAndCreateBrowserR2Client(
    params.settings
  );

  const webpKey = `webp/${cleanCategory}/${cleanSlug}.webp`;
  const pdfKey = `pdf/${cleanCategory}/${cleanSlug}.pdf`;

  try {
    params.onStageChange?.('uploading-webp');
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: webpKey,
        Body: params.assets.webpBytes,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );

    params.onStageChange?.('uploading-pdf');
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: pdfKey,
        Body: params.assets.pdfBytes,
        ContentType: 'application/pdf',
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );

    params.onStageChange?.('done');
    const previewWebpUrl = `${publicBaseUrl}/${webpKey}`;
    const pdfUrl = `${publicBaseUrl}/${pdfKey}`;

    return {
      previewWebpUrl,
      pdfUrl,
      pdfLetterUrl: pdfUrl,
      webpKey,
      pdfKey,
    };
  } catch (err) {
    throw new Error(
      formatR2BrowserError(err, 'Cloudflare R2 upload failed.')
    );
  } finally {
    client.destroy();
  }
}
